import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, Type } from "lucide-react";
import { watermarkPDF, getPDFPageCount } from "../lib/pdfUtils";

interface WatermarkToolProps {
  onBack: () => void;
}

export default function WatermarkTool({ onBack }: WatermarkToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [text, setText] = useState("CONFIDENTIAL");
  const [fontSize, setFontSize] = useState<number>(45);
  const [color, setColor] = useState("#dd2a2a");
  const [opacity, setOpacity] = useState<number>(0.35);
  const [rotation, setRotation] = useState<number>(45);
  const [placement, setPlacement] = useState<"center" | "top-left" | "top-right" | "bottom-left" | "bottom-right">("center");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setStatus({ type: "idle", message: "" });
    const selected = incomingFiles[0];

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Only PDF files are supported for watermarking." });
      return;
    }

    setFile(selected);
    setIsProcessing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const count = await getPDFPageCount(buffer);
      setPageCount(count);
    } catch (e: any) {
      console.warn("Could not retrieve page count automatically", e);
      setPageCount(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleApplyWatermark = async () => {
    if (!file) return;
    if (!text.trim()) {
      setStatus({ type: "error", message: "Watermark text cannot be empty." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const buffer = await file.arrayBuffer();
      const watermarkedBytes = await watermarkPDF(buffer, text, {
        fontSize,
        color,
        opacity,
        rotation,
        placement,
      });

      const blob = new Blob([watermarkedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `watermarked_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "Watermark applied and file downloaded successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "An error occurred while stamping watermark. Is this PDF password-protected?",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPageCount(null);
    setStatus({ type: "idle", message: "" });
  };

  return (
    <div id="watermark-tool" className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Add Text Watermark</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Overlay high-fidelity text stamps onto each page of your PDF file in customizable styles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!file ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-violet-500 bg-violet-50/50"
                  : "border-gray-300 hover:border-gray-400 bg-white"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileChange(e.target.files)}
                accept=".pdf"
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="p-3.5 bg-cyan-50 rounded-full text-cyan-600 mb-3 animate-pulse">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select the PDF file you want to watermark
                </p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to upload</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-cyan-50 text-cyan-600 rounded-xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pageCount !== null ? `${pageCount} pages` : "Detecting pages..."}
                    </p>
                  </div>
                </div>

                <button
                  onClick={removeFile}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Watermark position layout preview */}
              <div className="mt-8 border border-gray-200 bg-gray-50 rounded-2xl p-6 relative flex items-center justify-center min-h-[300px] overflow-hidden">
                <div className="w-[180px] h-[240px] bg-white border border-gray-300 shadow-sm rounded-lg relative overflow-hidden flex items-center justify-center p-4">
                  {/* Miniature mockup contents */}
                  <div className="w-full h-full opacity-10 space-y-4">
                    <div className="h-3 w-3/4 bg-gray-400 rounded" />
                    <div className="h-3 w-1/2 bg-gray-400 rounded" />
                    <div className="h-3 w-5/6 bg-gray-400 rounded" />
                    <div className="h-3 w-2/3 bg-gray-400 rounded" />
                    <div className="h-3 w-1/2 bg-gray-400 rounded" />
                  </div>

                  {/* Dynamic Watermark preview stamp layer */}
                  <div
                    className="absolute text-center select-none pointer-events-none transition-all duration-200"
                    style={{
                      fontSize: `${Math.max(12, fontSize * 0.3)}px`,
                      color: color,
                      opacity: opacity,
                      transform: `rotate(${-rotation}deg)`,
                      whiteSpace: "nowrap",
                      fontWeight: "bold",
                      ...(placement === "center" && {
                        left: "50%",
                        top: "50%",
                        transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                      }),
                      ...(placement === "top-left" && { left: "12px", top: "12px" }),
                      ...(placement === "top-right" && { right: "12px", top: "12px" }),
                      ...(placement === "bottom-left" && { left: "12px", bottom: "12px" }),
                      ...(placement === "bottom-right" && { right: "12px", bottom: "12px" }),
                    }}
                  >
                    {text || "PREVIEW"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs font-sans text-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide flex items-center gap-2">
              <Type className="w-4 h-4 text-cyan-600" />
              <span>Watermark Styles</span>
            </h3>

            <div className="mt-4 space-y-4">
              {/* Text Input */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Stamp text
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={text}
                  disabled={!file}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="e.g. STRICTLY CONFIDENTIAL"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white text-gray-800"
                />
              </div>

              {/* Placement */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Page Placement
                </label>
                <select
                  value={placement}
                  disabled={!file}
                  onChange={(e) => setPlacement(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 bg-white text-gray-800"
                >
                  <option value="center">Center of Page</option>
                  <option value="top-left">Top Left Corner</option>
                  <option value="top-right">Top Right Corner</option>
                  <option value="bottom-left">Bottom Left Corner</option>
                  <option value="bottom-right">Bottom Right Corner</option>
                </select>
              </div>

              {/* Font Size slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Font size</span>
                  <span className="font-mono text-gray-500 font-bold">{fontSize} px</span>
                </div>
                <input
                  type="range"
                  min={12}
                  max={90}
                  value={fontSize}
                  disabled={!file}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Opacity (Transparency)</span>
                  <span className="font-mono text-gray-500 font-bold">{Math.round(opacity * 100)} %</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={5}
                  value={opacity * 100}
                  disabled={!file}
                  onChange={(e) => setOpacity(parseInt(e.target.value) / 100)}
                  className="w-full accent-cyan-600"
                />
              </div>

              {/* Rotation angle */}
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-medium text-gray-700">Rotation angle</span>
                  <span className="font-mono text-gray-500 font-bold">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={15}
                  value={rotation}
                  disabled={!file}
                  onChange={(e) => setRotation(parseInt(e.target.value))}
                  className="w-full accent-cyan-600"
                />
              </div>

              {/* Custom hex color selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                   Stamping Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    disabled={!file}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-gray-300"
                  />
                  <input
                    type="text"
                    value={color}
                    disabled={!file}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#dd2a2a"
                    className="w-24 px-2 py-1.5 border border-gray-300 rounded-xl focus:ring-1 font-mono uppercase bg-white text-gray-800"
                  />
                </div>
              </div>

              {/* Status Banner */}
              {status.message && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    status.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                      : "bg-rose-50 text-rose-800 border border-rose-100"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{status.message}</span>
                </div>
              )}

              <button
                onClick={handleApplyWatermark}
                disabled={!file || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  !file || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-700 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Adding watermark overlay...</span>
                  </>
                ) : (
                  <>
                    <span>Apply Watermark</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
