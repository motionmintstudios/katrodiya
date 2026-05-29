import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, RotateCw } from "lucide-react";
import { rotatePDF, getPDFPageCount } from "../lib/pdfUtils";

interface RotateToolProps {
  onBack: () => void;
}

export default function RotateTool({ onBack }: RotateToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [rotation, setRotation] = useState<number>(90); // 90, 180, 270
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
      setStatus({ type: "error", message: "Only PDF files are supported for rotation." });
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

  const handleRotate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const buffer = await file.arrayBuffer();
      const rotatedBytes = await rotatePDF(buffer, rotation);

      const blob = new Blob([rotatedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `rotated_${rotation}_deg_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: `Rotated document pages by ${rotation}° clockwise and downloaded!` });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "An error occurred while rotating pages. Check for file encryptions.",
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
    <div id="rotate-tool" className="max-w-4xl mx-auto px-4 py-8">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Rotate PDF Document</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Rotate all pages clockwise by 90, 180, or 270 degrees.
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
                <div className="p-3.5 bg-teal-50 rounded-full text-teal-600 mb-3">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select the PDF file you want to rotate
                </p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to upload</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-teal-50 text-teal-600 rounded-xl shrink-0">
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

              {/* Angle visualization block */}
              <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center">
                <p className="text-xs font-semibold text-gray-600 mb-4 tracking-wide uppercase">
                  Rotation Direction Preview
                </p>
                <div
                  className="bg-white p-5 rounded-lg border border-gray-200 shadow-xs flex items-center justify-center transition-transform duration-300 relative"
                  style={{
                    width: "120px",
                    height: "170px",
                    transform: `rotate(${rotation}deg)`,
                  }}
                >
                  {/* Miniature text mockups to indicate orientation */}
                  <div className="text-center text-gray-400">
                    <p className="text-[10px] font-bold">PDF PAGE</p>
                    <p className="text-[8px] mt-1">TOP LEVEL</p>
                  </div>
                  <div className="absolute top-1 left-2 h-1 w-8 bg-violet-400 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rotation configuration */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Angle Settings
            </h3>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {([90, 180, 270] as const).map((angle) => (
                  <button
                    key={angle}
                    onClick={() => setRotation(angle)}
                    disabled={!file}
                    className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                      rotation === angle
                        ? "bg-teal-500 text-white border-teal-500 shadow-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {angle}° Clockwise
                  </button>
                ))}
              </div>

              {/* Status banner */}
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
                onClick={handleRotate}
                disabled={!file || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  !file || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-teal-500 hover:bg-teal-600 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Applying page rotations...</span>
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    <span>Rotate pages</span>
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
