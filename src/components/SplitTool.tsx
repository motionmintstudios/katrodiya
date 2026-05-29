import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, Info } from "lucide-react";
import { splitPDF, getPDFPageCount } from "../lib/pdfUtils";

interface SplitToolProps {
  onBack: () => void;
}

export default function SplitTool({ onBack }: SplitToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [ranges, setRanges] = useState("1-2");
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
      setStatus({ type: "error", message: "Only PDF files are supported for splitting." });
      return;
    }

    setFile(selected);
    setIsProcessing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const count = await getPDFPageCount(buffer);
      setPageCount(count);
      setRanges(`1-${count > 1 ? 2 : 1}`);
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

  const handleSplit = async () => {
    if (!file) return;
    if (!ranges.trim()) {
      setStatus({ type: "error", message: "Please specify at least one page or page range (e.g. 1-2)." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const buffer = await file.arrayBuffer();
      const splitBytes = await splitPDF(buffer, ranges);

      const blob = new Blob([splitBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `split_${ranges.replace(/\s+/g, "")}_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "Pages extracted successfully! Your split PDF is downloaded." });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "An error occurred while splitting the PDF. Please check page range constraints or password protection.",
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
    <div id="split-tool" className="max-w-4xl mx-auto px-4 py-8">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Split PDF File</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Extract selected pages or create a new document with custom page subsets.
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
                <div className="p-3.5 bg-rose-50 rounded-full text-rose-500 mb-3">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select the PDF file you want to split
                </p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to upload</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-rose-50 text-rose-500 rounded-xl shrink-0">
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

              {pageCount && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-500" />
                    <span>Dynamic Page Selector Help</span>
                  </h5>
                  <p className="text-xs text-gray-500 leading-relaxed font-sans">
                    You can extract separate collections of pages. Format examples:<br />
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-150 text-rose-600 font-bold">1-3</code> (extract pages 1, 2, 3)<br />
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-150 text-rose-600 font-bold">1, 3, 5</code> (extract individual separate pages)<br />
                    <code className="font-mono bg-white px-1 py-0.5 rounded border border-gray-150 text-rose-600 font-bold">1-2, 4-6</code> (extract pages 1, 2, 4, 5, 6 compiled in sequence)
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Settings Panel */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Split Configurations
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Page Extraction range
                </label>
                <input
                  type="text"
                  value={ranges}
                  disabled={!file}
                  onChange={(e) => setRanges(e.target.value)}
                  placeholder="e.g. 1-2, 4"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-violet-500 bg-white"
                />
                {pageCount && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    Enter any values between page 1 and page {pageCount}.
                  </p>
                )}
              </div>

              {/* Action Banner */}
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
                onClick={handleSplit}
                disabled={!file || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  !file || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-rose-500 hover:bg-rose-600 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Processing splits...</span>
                  </>
                ) : (
                  <>
                    <span>Split & Extract Pages</span>
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
