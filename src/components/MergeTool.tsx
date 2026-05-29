import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, ArrowUp, ArrowDown, Trash2, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { PDFFile } from "../types";
import { mergePDFs } from "../lib/pdfUtils";

interface MergeToolProps {
  onBack: () => void;
}

export default function MergeTool({ onBack }: MergeToolProps) {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file additions
  const handleFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    setStatus({ type: "idle", message: "" });
    const newFiles: PDFFile[] = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setStatus({ type: "error", message: "Only PDF files are supported for merging." });
        continue;
      }
      newFiles.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        rotation: 0,
      });
    }

    setFiles((prev) => [...prev, ...newFiles]);
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
    handleFiles(e.dataTransfer.files);
  };

  // Reorder files
  const moveFile = (index: number, direction: "up" | "down") => {
    setStatus({ type: "idle", message: "" });
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === files.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  // Remove file
  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Execute Merge
  const handleMerge = async () => {
    if (files.length < 2) {
      setStatus({ type: "error", message: "Please upload at least 2 PDF files to merge." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      // Read files as ArrayBuffer
      const buffers = await Promise.all(
        files.map(async (f) => {
          return await f.file.arrayBuffer();
        })
      );

      const mergedBytes = await mergePDFs(buffers);

      // Trigger automatic file download
      const blob = new Blob([mergedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `merged_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "PDF files combined and downloaded successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: err.message || "An error occurred while merging PDFs. Check if any file is corrupted/password protected.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="merge-tool" className="max-w-4xl mx-auto px-4 py-8">
      {/* Navigation and Title */}
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Merge PDF Files</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Combine multiple PDF files into a single document in any custom sequence you specify.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left / Center Upload Area & List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Reusable Drag & Drop Box */}
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-violet-500 bg-violet-50/50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFiles(e.target.files)}
              multiple
              accept=".pdf"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="p-3 bg-violet-50 rounded-full text-violet-600 mb-3">
                <Upload className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop files here, or <span className="text-violet-600 underline">browse device</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Supports multiple PDF uploads</p>
            </div>
          </div>

          {/* Files List Panel */}
          {files.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Files Selected ({files.length})
                </h4>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                {files.map((file, idx) => (
                  <div key={file.id} className="p-4 flex items-center justify-between gap-3 bg-white hover:bg-gray-50/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Move Up */}
                      <button
                        onClick={() => moveFile(idx, "up")}
                        disabled={idx === 0}
                        className={`p-1.5 rounded-lg border transition-all ${
                          idx === 0
                            ? "text-gray-200 border-gray-100 cursor-not-allowed"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-gray-200 cursor-pointer"
                        }`}
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        onClick={() => moveFile(idx, "down")}
                        disabled={idx === files.length - 1}
                        className={`p-1.5 rounded-lg border transition-all ${
                          idx === files.length - 1
                            ? "text-gray-200 border-gray-100 cursor-not-allowed"
                            : "text-gray-500 hover:text-gray-800 hover:bg-gray-100 border-gray-200 cursor-pointer"
                        }`}
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-lg border border-red-100 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Settings and Trigger */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Merge Actions
            </h3>

            <div className="mt-4 space-y-4">
              <div className="text-xs text-gray-500">
                <p><strong>Instructions:</strong></p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Upload files in order or reorder them above.</li>
                  <li>Verify capacities prior to compilation.</li>
                  <li>Press <strong>Merge PDF</strong> to generate download.</li>
                </ul>
              </div>

              {/* Merge file count summary */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-500">Total Files:</span>
                  <span className="font-mono font-medium text-gray-800">{files.length}</span>
                </div>
                <div className="flex justify-between items-center text-xs mt-1">
                  <span className="text-gray-500">Cumulative Size:</span>
                  <span className="font-mono font-medium text-gray-800">
                    {(files.reduce((a, b) => a + b.size, 0) / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              {status.message && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2 ${
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
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  files.length < 2 || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-violet-600 hover:bg-violet-700 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Merging document parts...</span>
                  </>
                ) : (
                  <>
                    <span>Merge PDF</span>
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
