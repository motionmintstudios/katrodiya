import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, ArrowLeftRight, Check, Square, CheckSquare } from "lucide-react";
import { organizePDF, getPDFPageCount } from "../lib/pdfUtils";

interface OrganizeToolProps {
  onBack: () => void;
}

interface PageItem {
  originalIndex: number; // 0-indexed original page
  displayIndex: number;  // 1-indexed view indicator
}

export default function OrganizeTool({ onBack }: OrganizeToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
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
      setStatus({ type: "error", message: "Only PDF files are supported for organization." });
      return;
    }

    setFile(selected);
    setIsProcessing(true);

    try {
      const buffer = await selected.arrayBuffer();
      const count = await getPDFPageCount(buffer);
      
      const setupPages: PageItem[] = Array.from({ length: count }, (_, idx) => ({
        originalIndex: idx,
        displayIndex: idx + 1,
      }));
      setPages(setupPages);
    } catch (e: any) {
      console.error(e);
      setStatus({ type: "error", message: "Failed to read PDF page elements. Is it locked?" });
      setFile(null);
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

  // Move page element inside array
  const movePage = (index: number, direction: "prev" | "next") => {
    setStatus({ type: "idle", message: "" });
    if (direction === "prev" && index === 0) return;
    if (direction === "next" && index === pages.length - 1) return;

    const targetIdx = direction === "prev" ? index - 1 : index + 1;
    const reordered = [...pages];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;
    setPages(reordered);
  };

  // Delete page element (omit from build list)
  const deletePage = (originalIdx: number) => {
    setPages((prev) => prev.filter((p) => p.originalIndex !== originalIdx));
  };

  const handleReorganize = async () => {
    if (!file) return;
    if (pages.length === 0) {
      setStatus({ type: "error", message: "Please keep at least one page in your output file queue." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const buffer = await file.arrayBuffer();
      const pageSequence = pages.map((p) => p.originalIndex);
      
      const organizedBytes = await organizePDF(buffer, pageSequence);

      const blob = new Blob([organizedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `organized_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "Document reorganized and downloaded successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "An error occurred while building the document output.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPages([]);
    setStatus({ type: "idle", message: "" });
  };

  return (
    <div id="organize-tool" className="max-w-5xl mx-auto px-4 py-8 font-sans text-sm">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Organize PDF Pages</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Reorder individual pages, delete unnecessary elements, and output a freshly restructured file.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
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
                <div className="p-3.5 bg-violet-50 rounded-full text-violet-600 mb-3 animate-pulse">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select the PDF file you want to organize
                </p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to upload</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File details banner */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 bg-violet-50 text-violet-600 rounded-lg shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 font-sans">
                    <p className="text-xs font-semibold text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • {pages.length} Pages active
                    </p>
                  </div>
                </div>

                <button
                  onClick={removeFile}
                  className="px-3 py-1.5 border border-red-100 text-xs text-red-500 hover:bg-red-50 hover:text-red-700 rounded-lg transition cursor-pointer"
                >
                  Omit file
                </button>
              </div>

              {/* Grid workspace */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-6">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                    <ArrowLeftRight className="w-4 h-4 text-violet-600" />
                    <span>Page Grid Order Workspace</span>
                  </h4>
                  <p className="text-[10px] text-gray-400">Rearrange or drop elements using cards control</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pages.map((p, idx) => (
                    <div
                      key={`${p.originalIndex}-${idx}`}
                      className="border border-gray-150 rounded-xl bg-gray-50/50 p-4 flex flex-col justify-between items-center relative shadow-2xs hover:border-violet-300 transition-all duration-150"
                    >
                      {/* Original page layout mini-stamp */}
                      <span className="absolute top-2 left-2 text-[10px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded-full font-mono">
                        Page {p.originalIndex + 1}
                      </span>

                      {/* Representation Box */}
                      <div className="w-[80px] h-[110px] bg-white border border-gray-200 shadow-3xs rounded-md mt-6 mb-4 flex items-center justify-center font-display text-lg font-bold text-gray-400">
                        {idx + 1}
                      </div>

                      {/* Control Panel */}
                      <div className="w-full flex items-center justify-between border-t border-gray-150 pt-2.5 mt-1">
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => movePage(idx, "prev")}
                            disabled={idx === 0}
                            className={`px-1.5 py-1 text-[10px] font-bold border rounded transition-all ${
                              idx === 0
                                ? "text-gray-200 border-gray-100 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer"
                            }`}
                          >
                            ←
                          </button>
                          <button
                            onClick={() => movePage(idx, "next")}
                            disabled={idx === pages.length - 1}
                            className={`px-1.5 py-1 text-[10px] font-bold border rounded transition-all ${
                              idx === pages.length - 1
                                ? "text-gray-200 border-gray-100 cursor-not-allowed"
                                : "text-gray-600 hover:bg-gray-100 border-gray-200 cursor-pointer"
                            }`}
                          >
                            →
                          </button>
                        </div>

                        <button
                          onClick={() => deletePage(p.originalIndex)}
                          className="p-1 rounded text-red-500 hover:bg-red-50 hover:text-red-700 border border-red-100 transition cursor-pointer"
                          title="Omit page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Settings */}
        <div className="space-y-6">
          <div className="bg-white border border-[#e5e7eb] rounded-2xl p-6 shadow-xs font-sans text-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Organize Actions
            </h3>

            <div className="mt-4 space-y-4">
              <div className="text-xs text-gray-500 leading-relaxed font-sans">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside mt-1.5 space-y-1">
                  <li>Omit pages with the Trash icon.</li>
                  <li>Move pages left or right using the arrow keys to adjust sequence.</li>
                  <li>Click <strong>Organize PDF</strong> to output completed compile.</li>
                </ul>
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
                onClick={handleReorganize}
                disabled={!file || pages.length === 0 || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  !file || pages.length === 0 || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Processing changes...</span>
                  </>
                ) : (
                  <>
                    <span>Organize PDF</span>
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
