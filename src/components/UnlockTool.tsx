import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, KeyRound } from "lucide-react";
import { unlockPDF, getPDFPageCount } from "../lib/pdfUtils";

interface UnlockToolProps {
  onBack: () => void;
}

export default function UnlockTool({ onBack }: UnlockToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setStatus({ type: "idle", message: "" });
    const selected = incomingFiles[0];

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ type: "error", message: "Only PDF files are supported for unlocking." });
      return;
    }

    setFile(selected);
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

  const handleUnlock = async () => {
    if (!file) return;
    if (!password) {
      setStatus({ type: "error", message: "Please enter the password to unlock this PDF." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const buffer = await file.arrayBuffer();
      const unlockedBytes = await unlockPDF(buffer, password);

      const blob = new Blob([unlockedBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `unlocked_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "PDF restrictions removed! Your unlocked PDF is downloaded." });
      setPassword("");
    } catch (err: any) {
      console.error(err);
      setStatus({
        type: "error",
        message: "Failed to unlock document. Please double-check your security password and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus({ type: "idle", message: "" });
  };

  return (
    <div id="unlock-tool" className="max-w-4xl mx-auto px-4 py-8 font-sans text-sm">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Unlock PDF File</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Strip security locks, operational controls, and password credentials from restricted documents.
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
                <div className="p-3.5 bg-emerald-50 rounded-full text-emerald-600 mb-3 animate-pulse">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  Select the secure PDF you want to decrypt
                </p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to upload</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-gray-800 truncate" title={file.name}>
                      {file.name}
                    </h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Locked Document
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

              {/* Informational block */}
              <div className="mt-8 p-4 bg-gray-50 border border-gray-150 rounded-xl flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-gray-500 leading-relaxed font-sans">
                  <strong>Ownership Notice:</strong> You must own or have explicit legal authorization to access this file. PDF limits can be stripped in a single transaction once the matching verification pattern is supplied.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configurations column */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs text-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Unlock Verification
            </h3>

            <div className="mt-4 space-y-4 font-sans">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Unlock Password
                </label>
                <input
                  type="password"
                  value={password}
                  disabled={!file}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter file credential key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white text-gray-800 font-mono"
                />
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
                onClick={handleUnlock}
                disabled={!file || !password || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  !file || !password || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Removing password lock...</span>
                  </>
                ) : (
                  <>
                    <span>Decrypt & Unlock PDF</span>
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
