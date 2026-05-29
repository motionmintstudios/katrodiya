import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Sparkles,
  Bot,
  MessageSquare,
  FileText,
  Bookmark,
  Languages,
  ScanEye,
  Send,
  Loader,
  Copy,
  Check,
  AlertCircle,
  HelpCircle,
  TrendingUp
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "../types";

interface AIReaderToolProps {
  onBack: () => void;
}

const LANGUAGES = [
  { code: "spanish", label: "Spanish (Español)" },
  { code: "french", label: "French (Français)" },
  { code: "german", label: "German (Deutsch)" },
  { code: "japanese", label: "Japanese (日本語)" },
  { code: "hindi", label: "Hindi (हिन्दी)" },
  { code: "chinese", label: "Chinese (中文)" },
];

export default function AIReaderTool({ onBack }: AIReaderToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "ocr" | "translate">("chat");

  // Core loading trigger states
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // AI Tab Contents
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [summary, setSummary] = useState<string>("");
  const [ocrText, setOcrText] = useState<string>("");
  const [translationText, setTranslationText] = useState<string>("");
  const [selectedLang, setSelectedLang] = useState("spanish");

  // Utility copy state triggers
  const [copiedText, setCopiedText] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Read uploaded PDF as base64 client-side
  const handleFileChange = async (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) return;
    setErrorMessage("");
    const selected = incomingFiles[0];

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported for AI Document analysis.");
      return;
    }

    // Protect payload limits
    if (selected.size > 8 * 1024 * 1024) {
      setErrorMessage("Max PDF file size supported by the editor is 8MB.");
      return;
    }

    setFile(selected);
    setIsProcessingFile(true);

    try {
      const base64 = await fileToBase64(selected);
      setPdfBase64(base64);

      // Reset previous AI outputs
      setMessages([
        {
          id: "welcome",
          sender: "ai",
          text: `Hi! I have successfully loaded **${selected.name}**. What would you like to know about it? Ask me any questions, or toggle the panels on the side to summarize or translate.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      setSummary("");
      setOcrText("");
      setTranslationText("");
    } catch (err: any) {
      console.error(err);
      setErrorMessage("Failed to process PDF data cleanly. Please choose another file.");
      setFile(null);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const fileToBase64 = (f: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(f);
      reader.onload = () => {
        const result = reader.result as string;
        const base64Str = result.split(",")[1];
        resolve(base64Str);
      };
      reader.onerror = (e) => reject(e);
    });
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files);
  };

  // Run secure server-side interactive Chat
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !pdfBase64 || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      sender: "user",
      text: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsAiLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          message: userMsg.text,
          conversation: messages.filter((m) => m.id !== "welcome").map((m) => ({
            sender: m.sender === "user" ? "User" : "AI Assistant",
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to communicate with AI server");
      }

      const aiMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "ai",
        text: data.text || "I was unable to determine a response based on this document.",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred. Check if Gemini API limits are exceeded.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run secure summarization API
  const handleGenerateSummary = async () => {
    if (!pdfBase64 || isAiLoading) return;
    setIsAiLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          prompt: "Draft a beautiful structural summary of the attached document. Include key sections, core parameters, major figures/numbers, and bullet-points detailing actionable parameters. Keep the layout extremely reader-friendly.",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Summary synthesis failed");

      setSummary(data.text || "Summary compilation failed.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to compile document summary safely.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run secure OCR Text Extraction API
  const handleExtractOcr = async () => {
    if (!pdfBase64 || isAiLoading) return;
    setIsAiLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          prompt: "Please perform absolute high-fidelity text extraction of this document. Extract all readable contents, maintaining tables, paragraphs, lists, and headings exactly as they appear in the original source without omitting details.",
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "OCR Extraction failed");

      setOcrText(data.text || "No readable texts could be safely processed.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to extract readable document texts.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Run secure Machine Translation API
  const handleTranslate = async () => {
    if (!pdfBase64 || isAiLoading) return;
    setIsAiLoading(true);
    setErrorMessage("");

    const langLabel = LANGUAGES.find((l) => l.code === selectedLang)?.label || selectedLang;

    try {
      const response = await fetch("/api/analyze-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfBase64,
          prompt: `Translate the main body text, claims and crucial details of the attached document into ${langLabel}. Render the translation beautifully maintaining logical structured paragraphs, headers, and bullet formats. Do not shorten or skip sections.`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Machine translation failed");

      setTranslationText(data.text || "Translation payload empty.");
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to translate file text.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Utility to handle clipboard copy
  const handleCopy = (textVal: string) => {
    navigator.clipboard.writeText(textVal);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const removeFile = () => {
    setFile(null);
    setPdfBase64("");
    setMessages([]);
    setSummary("");
    setOcrText("");
    setTranslationText("");
    setErrorMessage("");
  };

  return (
    <div id="ai-reader-tool" className="max-w-6xl mx-auto px-4 py-8 font-sans">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      {/* Main header banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 bg-violet-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-violet-800 uppercase tracking-widest mb-1 shadow-2xs">
            <Sparkles className="w-3 h-3" />
            <span>AI Smart Portal</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900 leading-none">
            AI Co-Writer & Smart Document Reader
          </h2>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Have interactive chat, extract full tables, generate outlines, or translate PDF documents using Gemini.
          </p>
        </div>

        {file && (
          <button
            onClick={removeFile}
            className="text-xs text-red-600 hover:bg-red-50 hover:text-red-700 px-3 py-1.5 border border-red-200/50 rounded-xl transition cursor-pointer self-start"
          >
            Clear current PDF
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-800 leading-relaxed font-sans shadow-2xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-rose-900">Operation Error:</span> {errorMessage}
            <div className="mt-2 text-[11px] text-rose-700">
              Note: This is powered by real Gemini AI integration. Make sure you set a active <strong>GEMINI_API_KEY</strong> configuration inside your AI Studio Secrets manager panel prior to launching.
            </div>
          </div>
        </div>
      )}

      {/* Upload UI if no file is present */}
      {!file ? (
        <div
          onDragOver={onDragOver}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white rounded-3xl p-16 text-center cursor-pointer transition-all duration-200"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files)}
            accept=".pdf"
            className="hidden"
          />
          <div className="flex flex-col items-center max-w-sm mx-auto">
            <div className="p-4 bg-gradient-to-br from-violet-500 to-indigo-600 text-white rounded-2xl shadow-md mb-4 group-hover:scale-105 transition duration-200">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-semibold text-gray-800">
              Select or Drop active PDF file for Gemini
            </h3>
            <p className="text-xs text-gray-400 mt-1 font-sans leading-relaxed">
              Upload any document to launch summarizers, OCR extractions, and secure chatting. Maximum file size is 8MB.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-xs min-h-[550px]">
          {/* LEFT COLUMN: Controls & Document details */}
          <div className="lg:col-span-4 border-r border-gray-200 bg-gray-50/50 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 border-b border-gray-200 pb-4 mb-6">
                <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 font-sans">
                  <p className="text-xs font-semibold text-gray-800 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>

              {/* Action tabs bar selector */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">
                  AI Workspace Tabs
                </span>

                <button
                  onClick={() => setActiveTab("chat")}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-medium rounded-xl transition ${
                    activeTab === "chat"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Interactive Chat Portal</span>
                </button>

                <button
                  onClick={() => setActiveTab("summary")}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-medium rounded-xl transition ${
                    activeTab === "summary"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  <Bookmark className="w-4 h-4 shrink-0" />
                  <span>Dynamic Summary Synthesizer</span>
                </button>

                <button
                  onClick={() => setActiveTab("ocr")}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-medium rounded-xl transition ${
                    activeTab === "ocr"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  <ScanEye className="w-4 h-4 shrink-0" />
                  <span>High-Fidelity Text OCR</span>
                </button>

                <button
                  onClick={() => setActiveTab("translate")}
                  className={`w-full flex items-center gap-3 p-3 text-xs font-medium rounded-xl transition ${
                    activeTab === "translate"
                      ? "bg-violet-600 text-white shadow-xs"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200/60"
                  }`}
                >
                  <Languages className="w-4 h-4 shrink-0" />
                  <span>Multi-Language Translation</span>
                </button>
              </div>
            </div>

            {/* AI processing status indicator */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500 font-sans">
                <Bot className="w-4 h-4 text-violet-500 shrink-0" />
                <span>Gemini API Node: Active</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 pl-6 leading-relaxed">
                Uses Google Gemini Flash. Analysis takes several seconds depending on file length.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN: Functional AI Screens based on Tab */}
          <div className="lg:col-span-8 flex flex-col justify-between">
            {/* TAB CONTENT: Interactive Chat */}
            {activeTab === "chat" && (
              <div className="flex flex-col h-full min-h-[480px]">
                {/* Chat Feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 max-h-[380px]">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 max-w-2xl text-xs leading-relaxed ${
                        m.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-3xs ${
                          m.sender === "user" ? "bg-gray-800 text-white" : "bg-violet-100 text-violet-700"
                        }`}
                      >
                        {m.sender === "user" ? "U" : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Msg bubble */}
                      <div
                        className={`p-3.5 rounded-2xl shadow-3xs ${
                          m.sender === "user"
                            ? "bg-violet-600 text-white font-medium"
                            : "bg-gray-50 text-gray-800 border border-gray-100"
                        }`}
                      >
                        <div className="prose prose-sm max-w-none text-current font-sans">
                          <ReactMarkdown>{m.text}</ReactMarkdown>
                        </div>
                        <span className={`text-[9px] block text-right mt-1 opacity-60 font-mono`}>
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* AI Is Thinking loader */}
                  {isAiLoading && (
                    <div className="flex gap-3 max-w-sm text-xs text-gray-500 items-center">
                      <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                        <Loader className="w-4 h-4 animate-spin" />
                      </div>
                      <span className="font-mono text-[10px]">Gemini is analyzing document...</span>
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Suggestions items bar */}
                {messages.length === 1 && (
                  <div className="px-6 py-2 flex flex-wrap gap-1.5 border-t border-gray-100 bg-gray-50/20">
                    <button
                      onClick={() => setInputMessage("Summarize the main action items of this document.")}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-600 rounded-full cursor-pointer transition"
                    >
                      🚀 Summarize Action Items
                    </button>
                    <button
                      onClick={() => setInputMessage("Is this document legally binding? Or just a memorandum?")}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-600 rounded-full cursor-pointer transition"
                    >
                      ⚖️ Verify Legal Context
                    </button>
                    <button
                      onClick={() => setInputMessage("What are the core dates, figures, or quantities of this PDF?")}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-600 rounded-full cursor-pointer transition"
                    >
                      📊 Key Numbers & Dates
                    </button>
                  </div>
                )}

                {/* Secure bottom input box */}
                <form
                  onSubmit={handleSendChatMessage}
                  className="p-4 border-t border-gray-200/80 flex gap-2 bg-gray-50/50"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    disabled={isAiLoading}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask standard questions or extract data from this PDF..."
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs text-gray-800 shadow-3xs"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isAiLoading}
                    className={`p-2.5 rounded-xl text-white shadow-xs transition cursor-pointer shrink-0 ${
                      !inputMessage.trim() || isAiLoading
                        ? "bg-gray-300 pointer-events-none"
                        : "bg-violet-600 hover:bg-violet-700"
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: Summary Synthesizer */}
            {activeTab === "summary" && (
              <div className="p-6 flex flex-col justify-between h-full min-h-[480px]">
                <div className="flex-1 overflow-y-auto pr-2 max-h-[360px]">
                  {!summary ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                      <div className="p-4 bg-violet-50 rounded-full text-violet-600">
                        <Bookmark className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Compile structured Document summary
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                          Gemini will analyze the full text sequence, keying in on parameters and dates, returning structured bullets.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateSummary}
                        disabled={isAiLoading}
                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Synthesizing Summary...</span>
                          </>
                        ) : (
                          <>
                            <span>Generate Outline Summary</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Summary Output (Markdown)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(summary)}
                            className="p-1 px-2 border border-gray-200 bg-white rounded-lg text-[10px] flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleGenerateSummary}
                            className="p-1 px-2 border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Refresh
                          </button>
                        </div>
                      </div>

                      {/* Display Markdown Summary */}
                      <div className="p-4 bg-white border border-gray-150 rounded-2xl leading-relaxed text-xs text-gray-700 font-sans prose prose-sm max-w-none shadow-3xs overflow-x-auto">
                        <ReactMarkdown>{summary}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: High-Fidelity OCR Extractions */}
            {activeTab === "ocr" && (
              <div className="p-6 flex flex-col justify-between h-full min-h-[480px]">
                <div className="flex-1 overflow-y-auto pr-2 max-h-[360px]">
                  {!ocrText ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                      <div className="p-4 bg-violet-50 rounded-full text-violet-600">
                        <ScanEye className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Extract Raw Readable Text (OCR)
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                          Retrieve structured document layouts containing titles, paragraphs, schedules, and calculations in copyable system formats.
                        </p>
                      </div>
                      <button
                        onClick={handleExtractOcr}
                        disabled={isAiLoading}
                        className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition"
                      >
                        {isAiLoading ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            <span>Processing OCR Analysis...</span>
                          </>
                        ) : (
                          <>
                            <span>Extract Document Text</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Extracted plain text
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(ocrText)}
                            className="p-1 px-2 border border-gray-200 bg-white rounded-lg text-[10px] flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={handleExtractOcr}
                            className="p-1 px-2 border border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            Rerun OCR Extraction
                          </button>
                        </div>
                      </div>

                      {/* Display Text raw block */}
                      <pre className="p-4 bg-gray-900 text-gray-100 font-mono text-[11px] rounded-2xl whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-sm max-h-[300px]">
                        {ocrText}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Multi-Language translation */}
            {activeTab === "translate" && (
              <div className="p-6 flex flex-col justify-between h-full min-h-[480px]">
                <div className="flex-1 overflow-y-auto pr-2 max-h-[360px]">
                  {!translationText ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                      <div className="p-4 bg-violet-50 rounded-full text-violet-600">
                        <Languages className="w-10 h-10" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800">
                          Translate Full PDF content
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 max-w-sm leading-relaxed">
                          Seamlessly translate entire pages, descriptions, figures, or claims into five global formats using state-of-the-art machine models.
                        </p>
                      </div>

                      <div className="flex gap-2 items-center">
                        <select
                          value={selectedLang}
                          onChange={(e) => setSelectedLang(e.target.value)}
                          disabled={isAiLoading}
                          className="px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-violet-500 bg-white"
                        >
                          {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                              {lang.label}
                            </option>
                          ))}
                        </select>

                        <button
                          onClick={handleTranslate}
                          disabled={isAiLoading}
                          className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition"
                        >
                          {isAiLoading ? (
                            <>
                              <Loader className="w-3.5 h-3.5 animate-spin" />
                              <span>Translating...</span>
                            </>
                          ) : (
                            <>
                              <span>Translate PDF</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                          Translated Output (Markdown)
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(translationText)}
                            className="p-1 px-2 border border-gray-200 bg-white rounded-lg text-[10px] flex items-center gap-1.5 font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-50 cursor-pointer transition"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Text</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => setTranslationText("")}
                            className="p-1 px-2 border border-gray-200 bg-white rounded-lg text-[10px] font-medium text-gray-500 hover:text-gray-800 cursor-pointer transition"
                          >
                            Translate to Another Language
                          </button>
                        </div>
                      </div>

                      {/* Display Markdown Translation */}
                      <div className="p-4 bg-white border border-gray-150 rounded-2xl leading-relaxed text-xs text-gray-700 font-sans prose prose-sm max-w-none shadow-3xs overflow-x-auto">
                        <ReactMarkdown>{translationText}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
