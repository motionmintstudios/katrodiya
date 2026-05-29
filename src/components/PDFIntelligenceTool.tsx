import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, FileText, CheckCircle2, ChevronRight, Activity, Trash2, Brain, Globe, Eye, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface PDFIntelligenceToolProps {
  toolType: "ai_summarizer" | "translate_pdf" | "ocr_pdf";
  onBack: () => void;
}

export default function PDFIntelligenceTool({ toolType, onBack }: PDFIntelligenceToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lang, setLang] = useState<string>("Spanish");
  const [result, setResult] = useState<string>("");
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToolDetails = () => {
    switch (toolType) {
      case "ai_summarizer":
        return {
          title: "AI Document Summarizer",
          desc: "Extract key takeaways, structural frameworks, and outline index summaries from files using Gemini AI.",
          accent: "violet",
        };
      case "translate_pdf":
        return {
          title: "AI Document Translator",
          desc: "Translate documents across 50+ international languages while retaining thematic layout references.",
          accent: "blue",
        };
      case "ocr_pdf":
        return {
          title: "AI OCR Document Reader",
          desc: "Apply high-accuracy OCR scans to hand-write notes, skewed scans, and complex tabular coordinates.",
          accent: "indigo",
        };
    }
  };

  const details = getToolDetails();

  const handleFileChange = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setStatus({ type: "idle", message: "" });
    setResult("");
    const selected = incomingFiles[0];
    setFile(selected);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const executeAction = async () => {
    if (!file) return;
    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });
    setResult("");

    try {
      // Read file and convert to base64
      const fileReader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        fileReader.onload = () => {
          const resultStr = fileReader.result as string;
          const base64Data = resultStr.split(",")[1];
          resolve(base64Data);
        };
        fileReader.onerror = () => reject(new Error("Unable to read file bytes."));
        fileReader.readAsDataURL(file);
      });

      const pdfBase64 = await base64Promise;

      // Select target prompt based on PDF intelligence tool selected
      let prompt = "";
      if (toolType === "ai_summarizer") {
        prompt = "Analyze the attached PDF and synthesize an elegant markdown summary. Highlight the key takeaways, core findings, bulleted item outlines, and target messages precisely. Style headers cleanly.";
      } else if (toolType === "translate_pdf") {
        prompt = `Translate the attached PDF's readable contents entirely into ${lang}. Ensure translated text reads organically and matches the formal/informational tone of the source material. Preserve structural names and titles.`;
      } else {
        prompt = "Extract and perform highly precise OCR reading of the attached document. Extract all textual paragraphs, numbers, tabular data blocks, and signatures verbatim. Do not summarize or modify; provide raw extracted text layouts.";
      }

      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64, prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Communication failure with server-side AI endpoint.");
      }

      setResult(data.text || "AI completed generation but returned no output bytes.");
      setStatus({ type: "success", message: "Intelligence transaction completed successfully!" });
    } catch (e: any) {
      console.error(e);
      setStatus({ type: "error", message: e.message || "An unexpected error occurred during analysis." });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setResult("");
    setStatus({ type: "idle", message: "" });
  };

  return (
    <div id={`pdf-intel-tool-${toolType}`} className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">{details?.title}</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">{details?.desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {!file ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-200 ${
                isDragging ? "border-violet-500 bg-violet-50/50" : "border-gray-300 hover:border-gray-400 bg-white"
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
                <p className="text-sm font-medium text-gray-700">Select PDF document to analyze with AI</p>
                <p className="text-xs text-gray-400 mt-1">Drag and drop file here, or click to browse</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-3 bg-violet-50 text-violet-600 rounded-xl shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{file.name}</h4>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic outcomes */}
              {result && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs animate-fade-in space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>Extracted intelligence analysis</span>
                    </h3>
                  </div>

                  <div className="markdown-body text-xs text-gray-700 leading-relaxed space-y-2 whitespace-pre-wrap prose prose-sm max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs text-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Intelligence Settings
            </h3>

            <div className="mt-4 space-y-4">
              {toolType === "translate_pdf" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Convert Target Language</label>
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="w-full px-2.5 py-2 border border-gray-300 rounded-xl bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-violet-500"
                  >
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="German">German (Deutsch)</option>
                    <option value="Chinese">Chinese (简体中文)</option>
                    <option value="Japanese">Japanese (日本語)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                  </select>
                </div>
              )}

              {toolType === "ai_summarizer" && (
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl flex items-start gap-2 text-violet-800">
                  <Brain className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed">
                    Powered by <strong>Gemini 3.5 Flash</strong>. Comprehends context spans up to 1 million tokens for extreme accuracy.
                  </p>
                </div>
              )}

              {toolType === "ocr_pdf" && (
                <div className="p-3 bg-violet-50 border border-violet-100 rounded-xl flex items-start gap-2 text-violet-800">
                  <Eye className="w-4 h-4 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed">
                    Advanced visual spatial OCR model matches margins, tables, and skew offsets seamlessly.
                  </p>
                </div>
              )}

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
                onClick={executeAction}
                disabled={!file || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 ${
                  !file || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Analyzing document payloads...</span>
                  </>
                ) : (
                  <>
                    <span>Execute intelligence</span>
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
