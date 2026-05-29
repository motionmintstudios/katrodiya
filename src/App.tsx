import React, { useState, useRef } from "react";
import Dashboard from "./components/Dashboard";
import MergeTool from "./components/MergeTool";
import SplitTool from "./components/SplitTool";
import RotateTool from "./components/RotateTool";
import ImageToPDFTool from "./components/ImageToPDFTool";
import WatermarkTool from "./components/WatermarkTool";
import ProtectTool from "./components/ProtectTool";
import UnlockTool from "./components/UnlockTool";
import OrganizeTool from "./components/OrganizeTool";
import AIReaderTool from "./components/AIReaderTool";
import ConvertTool from "./components/ConvertTool";
import AdvancedEditTool from "./components/AdvancedEditTool";
import ScannerTool from "./components/ScannerTool";
import RepairAndOptimizeTool from "./components/RepairAndOptimizeTool";
import PDFIntelligenceTool from "./components/PDFIntelligenceTool";
import { PDFToolType } from "./types";
import {
  FileText,
  Sparkles,
  Shield,
  Heart,
  ChevronDown,
  ChevronUp,
  Menu,
  X,
  FolderSync,
  Scissors,
  Trash2,
  FileDown,
  LayoutGrid,
  Camera,
  Scale,
  Activity,
  Eye,
  Image as ImageIcon,
  Globe,
  RotateCw,
  Binary,
  Crop,
  PenTool,
  FileCode,
  Unlock,
  Lock,
  EyeOff,
  GitCompare,
  Languages,
  Brain,
  CheckCircle2,
  X as CloseIcon
} from "lucide-react";

interface NavItem {
  label: string;
  toolId: PDFToolType;
  iconType: string;
  iconColor: string;
}

const CONVERT_TO_PDF_ITEMS: NavItem[] = [
  { label: "JPG to PDF", toolId: "img2pdf", iconType: "jpg", iconColor: "text-amber-500" },
  { label: "WORD to PDF", toolId: "word2pdf", iconType: "word", iconColor: "text-blue-500" },
  { label: "POWERPOINT to PDF", toolId: "ppt2pdf", iconType: "ppt", iconColor: "text-orange-500" },
  { label: "EXCEL to PDF", toolId: "excel2pdf", iconType: "excel", iconColor: "text-emerald-500" },
  { label: "HTML to PDF", toolId: "html2pdf", iconType: "html", iconColor: "text-yellow-600" },
];

const CONVERT_FROM_PDF_ITEMS: NavItem[] = [
  { label: "PDF to JPG", toolId: "pdf2jpg", iconType: "jpg", iconColor: "text-amber-500" },
  { label: "PDF to WORD", toolId: "pdf2word", iconType: "word", iconColor: "text-blue-500" },
  { label: "PDF to POWERPOINT", toolId: "pdf2ppt", iconType: "ppt", iconColor: "text-orange-500" },
  { label: "PDF to EXCEL", toolId: "pdf2excel", iconType: "excel", iconColor: "text-emerald-500" },
  { label: "PDF to PDF/A", toolId: "pdf2pdfa", iconType: "pdfa", iconColor: "text-indigo-600" },
];

export default function App() {
  const [selectedTool, setSelectedTool] = useState<PDFToolType | null>(null);
  const [activeMenu, setActiveMenu] = useState<"convert" | "all" | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedSection, setMobileExpandedSection] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "info" } | null>(null);

  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (message: string, type: "success" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleOpenMenu = (menu: "convert" | "all") => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
    setActiveMenu(menu);
  };

  const handleCloseMenu = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  const handleKeepMenuOpen = () => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
      menuTimeoutRef.current = null;
    }
  };

  const handleSelectToolFromNav = (toolId: PDFToolType) => {
    setSelectedTool(toolId);
    setActiveMenu(null);
    setIsMobileMenuOpen(false);
  };

  const renderActiveTool = () => {
    if (!selectedTool) {
      return <Dashboard onSelectTool={(tool) => setSelectedTool(tool)} />;
    }

    switch (selectedTool) {
      case "merge":
        return <MergeTool onBack={() => setSelectedTool(null)} />;
      case "split":
      case "remove_pages":
      case "extract_pages":
        return <SplitTool onBack={() => setSelectedTool(null)} />;
      case "rotate":
        return <RotateTool onBack={() => setSelectedTool(null)} />;
      case "img2pdf":
        return <ImageToPDFTool onBack={() => setSelectedTool(null)} />;
      case "watermark":
        return <WatermarkTool onBack={() => setSelectedTool(null)} />;
      case "protect":
        return <ProtectTool onBack={() => setSelectedTool(null)} />;
      case "unlock":
        return <UnlockTool onBack={() => setSelectedTool(null)} />;
      case "organize":
        return <OrganizeTool onBack={() => setSelectedTool(null)} />;
      case "ai_reader":
        return <AIReaderTool onBack={() => setSelectedTool(null)} />;
      case "word2pdf":
      case "ppt2pdf":
      case "excel2pdf":
      case "html2pdf":
      case "pdf2jpg":
      case "pdf2word":
      case "pdf2ppt":
      case "pdf2excel":
      case "pdf2pdfa":
        return <ConvertTool toolType={selectedTool} onBack={() => setSelectedTool(null)} />;
      case "edit_pdf":
      case "page_numbers":
      case "crop_pdf":
      case "pdf_forms":
      case "sign_pdf":
      case "redact_pdf":
      case "compare_pdf":
        return <AdvancedEditTool toolType={selectedTool} onBack={() => setSelectedTool(null)} />;
      case "scan_pdf":
        return <ScannerTool onBack={() => setSelectedTool(null)} />;
      case "optimize_pdf":
      case "compress_pdf":
      case "repair_pdf":
        return <RepairAndOptimizeTool toolType={selectedTool} onBack={() => setSelectedTool(null)} />;
      case "ai_summarizer":
      case "translate_pdf":
      case "ocr_pdf":
        return <PDFIntelligenceTool toolType={selectedTool} onBack={() => setSelectedTool(null)} />;
      default:
        return <Dashboard onSelectTool={(tool) => setSelectedTool(tool)} />;
    }
  };

  const menuToolIcon = (toolId: PDFToolType) => {
    switch (toolId) {
      case "merge":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><FolderSync className="w-3.5 h-3.5" /></div>;
      case "split":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><Scissors className="w-3.5 h-3.5" /></div>;
      case "remove_pages":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><Trash2 className="w-3.5 h-3.5" /></div>;
      case "extract_pages":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><FileDown className="w-3.5 h-3.5" /></div>;
      case "organize":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><LayoutGrid className="w-3.5 h-3.5" /></div>;
      case "scan_pdf":
        return <div className="w-5 h-5 rounded bg-red-50 text-[#E74C3C] flex items-center justify-center shrink-0 border border-red-100"><Camera className="w-3.5 h-3.5" /></div>;

      case "compress_pdf":
        return <div className="w-5 h-5 rounded bg-emerald-50 text-[#27AE60] flex items-center justify-center shrink-0 border border-emerald-100"><Scale className="w-3.5 h-3.5" /></div>;
      case "repair_pdf":
        return <div className="w-5 h-5 rounded bg-emerald-50 text-[#27AE60] flex items-center justify-center shrink-0 border border-emerald-100"><Activity className="w-3.5 h-3.5" /></div>;
      case "ocr_pdf":
        return <div className="w-5 h-5 rounded bg-emerald-50 text-[#27AE60] flex items-center justify-center shrink-0 border border-emerald-100"><Eye className="w-3.5 h-3.5" /></div>;

      case "img2pdf":
        return <div className="w-5 h-5 rounded bg-amber-50 text-[#F39C12] flex items-center justify-center shrink-0 border border-amber-100"><ImageIcon className="w-3.5 h-3.5" /></div>;
      case "word2pdf":
        return <div className="w-5 h-5 rounded bg-blue-50 text-[#2980B9] flex items-center justify-center font-bold text-[9px] shrink-0 border border-blue-100">W</div>;
      case "ppt2pdf":
        return <div className="w-5 h-5 rounded bg-orange-50 text-[#E67E22] flex items-center justify-center font-bold text-[9px] shrink-0 border border-orange-100">P</div>;
      case "excel2pdf":
        return <div className="w-5 h-5 rounded bg-emerald-50 text-[#27AE60] flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-100">X</div>;
      case "html2pdf":
        return <div className="w-5 h-5 rounded bg-yellow-50 text-[#D35400] flex items-center justify-center shrink-0 border border-yellow-100"><Globe className="w-3.5 h-3.5" /></div>;

      case "pdf2jpg":
        return <div className="w-5 h-5 rounded bg-amber-50 text-[#F39C12] flex items-center justify-center shrink-0 border border-amber-100"><ImageIcon className="w-3.5 h-3.5" /></div>;
      case "pdf2word":
        return <div className="w-5 h-5 rounded bg-blue-50 text-[#2980B9] flex items-center justify-center font-bold text-[9px] shrink-0 border border-blue-100">W</div>;
      case "pdf2ppt":
        return <div className="w-5 h-5 rounded bg-orange-50 text-[#E67E22] flex items-center justify-center font-bold text-[9px] shrink-0 border border-orange-100">P</div>;
      case "pdf2excel":
        return <div className="w-5 h-5 rounded bg-emerald-50 text-[#27AE60] flex items-center justify-center font-bold text-[9px] shrink-0 border border-emerald-100">X</div>;
      case "pdf2pdfa":
        return <div className="w-5 h-5 rounded bg-indigo-50 text-[#4F46E5] flex items-center justify-center font-bold text-[9px] shrink-0 border border-indigo-100">/A</div>;

      case "rotate":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center shrink-0 border border-purple-100"><RotateCw className="w-3.5 h-3.5" /></div>;
      case "page_numbers":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center font-bold text-[8px] shrink-0 border border-purple-100">12</div>;
      case "watermark":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center font-medium text-[8px] shrink-0 border border-purple-100">W</div>;
      case "crop_pdf":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center shrink-0 border border-purple-100"><Crop className="w-3.5 h-3.5" /></div>;
      case "edit_pdf":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center shrink-0 border border-purple-100"><PenTool className="w-3.5 h-3.5" /></div>;
      case "pdf_forms":
        return <div className="w-5 h-5 rounded bg-purple-50 text-[#8E44AD] flex items-center justify-center shrink-0 border border-purple-100"><FileCode className="w-3.5 h-3.5" /></div>;

      case "unlock":
        return <div className="w-5 h-5 rounded bg-sky-50 text-[#2980B9] flex items-center justify-center shrink-0 border border-sky-100"><Unlock className="w-3.5 h-3.5" /></div>;
      case "protect":
        return <div className="w-5 h-5 rounded bg-sky-50 text-[#2980B9] flex items-center justify-center shrink-0 border border-sky-100"><Lock className="w-3.5 h-3.5" /></div>;
      case "sign_pdf":
        return <div className="w-5 h-5 rounded bg-sky-50 text-[#2980B9] flex items-center justify-center shrink-0 border border-sky-100"><PenTool className="w-3.5 h-3.5" /></div>;
      case "redact_pdf":
        return <div className="w-5 h-5 rounded bg-sky-50 text-[#2980B9] flex items-center justify-center shrink-0 border border-sky-100"><EyeOff className="w-3.5 h-3.5" /></div>;
      case "compare_pdf":
        return <div className="w-5 h-5 rounded bg-sky-50 text-[#2980B9] flex items-center justify-center shrink-0 border border-sky-100"><GitCompare className="w-3.5 h-3.5" /></div>;

      case "ai_summarizer":
        return <div className="w-5 h-5 rounded bg-violet-50 text-[#8E24AA] flex items-center justify-center shrink-0 border border-violet-100"><Sparkles className="w-3.5 h-3.5" /></div>;
      case "translate_pdf":
        return <div className="w-5 h-5 rounded bg-violet-50 text-[#8E24AA] flex items-center justify-center shrink-0 border border-violet-100"><Languages className="w-3.5 h-3.5" /></div>;
      case "ai_reader":
        return <div className="w-5 h-5 rounded bg-violet-50 text-[#8E24AA] flex items-center justify-center shrink-0 border border-violet-100"><Brain className="w-3.5 h-3.5" /></div>;

      default:
        return <div className="w-5 h-5 rounded bg-gray-50 text-gray-500 flex items-center justify-center shrink-0 border border-gray-100"><FileText className="w-3.5 h-3.5" /></div>;
    }
  };

  const ALL_TOOLS_CATEGORIES = [
    {
      title: "ORGANIZE PDF",
      items: [
        { name: "Merge PDF", id: "merge" as PDFToolType },
        { name: "Split PDF", id: "split" as PDFToolType },
        { name: "Remove pages", id: "remove_pages" as PDFToolType },
        { name: "Extract pages", id: "extract_pages" as PDFToolType },
        { name: "Organize PDF", id: "organize" as PDFToolType },
        { name: "Scan to PDF", id: "scan_pdf" as PDFToolType },
      ],
    },
    {
      title: "OPTIMIZE PDF",
      items: [
        { name: "Compress PDF", id: "compress_pdf" as PDFToolType },
        { name: "Repair PDF", id: "repair_pdf" as PDFToolType },
        { name: "OCR PDF", id: "ocr_pdf" as PDFToolType },
      ],
    },
    {
      title: "CONVERT TO PDF",
      items: [
        { name: "JPG to PDF", id: "img2pdf" as PDFToolType },
        { name: "WORD to PDF", id: "word2pdf" as PDFToolType },
        { name: "POWERPOINT to PDF", id: "ppt2pdf" as PDFToolType },
        { name: "EXCEL to PDF", id: "excel2pdf" as PDFToolType },
        { name: "HTML to PDF", id: "html2pdf" as PDFToolType },
      ],
    },
    {
      title: "CONVERT FROM PDF",
      items: [
        { name: "PDF to JPG", id: "pdf2jpg" as PDFToolType },
        { name: "PDF to WORD", id: "pdf2word" as PDFToolType },
        { name: "PDF to POWERPOINT", id: "pdf2ppt" as PDFToolType },
        { name: "PDF to EXCEL", id: "pdf2excel" as PDFToolType },
        { name: "PDF to PDF/A", id: "pdf2pdfa" as PDFToolType },
      ],
    },
    {
      title: "EDIT PDF",
      items: [
        { name: "Rotate PDF", id: "rotate" as PDFToolType },
        { name: "Add page numbers", id: "page_numbers" as PDFToolType },
        { name: "Add watermark", id: "watermark" as PDFToolType },
        { name: "Crop PDF", id: "crop_pdf" as PDFToolType },
        { name: "Edit PDF", id: "edit_pdf" as PDFToolType },
        { name: "PDF Forms", id: "pdf_forms" as PDFToolType },
      ],
    },
    {
      title: "PDF SECURITY",
      items: [
        { name: "Unlock PDF", id: "unlock" as PDFToolType },
        { name: "Protect PDF", id: "protect" as PDFToolType },
        { name: "Sign PDF", id: "sign_pdf" as PDFToolType },
        { name: "Redact PDF", id: "redact_pdf" as PDFToolType },
        { name: "Compare PDF", id: "compare_pdf" as PDFToolType },
      ],
    },
    {
      title: "PDF INTELLIGENCE",
      items: [
        { name: "AI Summarizer", id: "ai_summarizer" as PDFToolType },
        { name: "Translate PDF", id: "translate_pdf" as PDFToolType },
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/40">
      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce flex items-center gap-3 bg-gray-950 text-white text-xs px-4 py-3 rounded-2xl shadow-xl border border-gray-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 hover:text-gray-300">
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Premium navigation header styled exactly like iLovePDF */}
      <header
        className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm font-sans"
        onMouseLeave={handleCloseMenu}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
          {/* Logo brand section */}
          <div className="flex items-center gap-6 lg:gap-8">
            <div
              id="brand-logo-container"
              onClick={() => setSelectedTool(null)}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <span className="text-2xl font-black text-gray-900 tracking-tight flex items-center font-sans">
                I
                <span className="relative mx-1 lg:mx-1.5 flex items-center justify-center w-8 h-8">
                  <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#E53E3E] fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {/* Dynamic page-fold simulation exactly matching iLovePDF */}
                  <div className="absolute top-[3px] right-[1px] w-2.5 h-2.5 bg-white border-b border-l border-gray-300 rounded-bl-xs" />
                </span>
                <span className="font-extrabold text-[#2C3E50]">PDF</span>
              </span>
            </div>

            {/* Desktop link navigation */}
            <nav className="hidden xl:flex items-center gap-5 lg:gap-6 text-xs font-bold uppercase tracking-wide">
              <span
                onClick={() => handleSelectToolFromNav("merge")}
                className={`hover:text-[#E53E3E] hover:underline underline-offset-8 decoration-2 transition cursor-pointer ${
                  selectedTool === "merge" ? "text-[#E53E3E]" : "text-gray-800"
                }`}
              >
                Merge PDF
              </span>
              <span
                onClick={() => handleSelectToolFromNav("split")}
                className={`hover:text-[#E53E3E] hover:underline underline-offset-8 decoration-2 transition cursor-pointer ${
                  selectedTool === "split" ? "text-[#E53E3E]" : "text-gray-800"
                }`}
              >
                Split PDF
              </span>
              <span
                onClick={() => handleSelectToolFromNav("compress_pdf")}
                className={`hover:text-[#E53E3E] hover:underline underline-offset-8 decoration-2 transition cursor-pointer ${
                  selectedTool === "compress_pdf" ? "text-[#E53E3E]" : "text-gray-800"
                }`}
              >
                Compress PDF
              </span>

              {/* CONVERT PDF dropdown trigger */}
              <div
                className="relative py-4"
                onMouseEnter={() => handleOpenMenu("convert")}
              >
                <div
                  className={`flex items-center gap-1 hover:text-[#E53E3E] transition cursor-pointer select-none ${
                    activeMenu === "convert" ? "text-[#E53E3E]" : "text-gray-800"
                  }`}
                >
                  <span>Convert PDF</span>
                  {activeMenu === "convert" ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>

              {/* ALL PDF TOOLS mega menu trigger */}
              <div
                className="relative py-4"
                onMouseEnter={() => handleOpenMenu("all")}
              >
                <div
                  className={`flex items-center gap-1 hover:text-[#E53E3E] transition cursor-pointer select-none ${
                    activeMenu === "all" ? "text-[#E53E3E]" : "text-gray-800"
                  }`}
                >
                  <span>All PDF Tools</span>
                  {activeMenu === "all" ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </div>
              </div>
            </nav>
          </div>

          {/* Right hand side elements */}
          <div className="flex items-center gap-3 lg:gap-4 font-sans">
            <span
              onClick={() => triggerToast("Login: Workspace single sign-on is active. Logged in as dhruvkatrodiyaaa@gmail.com.", "info")}
              className="hidden sm:inline text-xs font-bold text-gray-800 hover:text-[#E53E3E] uppercase tracking-wide transition cursor-pointer"
            >
              Login
            </span>

            <button
              onClick={() => triggerToast("Sign up: You have a complimentary lifetime premium license for PDFCraft!", "success")}
              className="px-4 py-2 bg-[#E53E3E] hover:bg-[#C53030] active:scale-95 text-white rounded-md text-xs font-bold tracking-wide transition shadow-sm cursor-pointer select-none"
            >
              Sign up
            </button>

            {/* Custom styled 3x3 apps launcher grid */}
            <div
              onClick={() => handleSelectToolFromNav("ai_reader")}
              className="w-8 h-8 flex flex-wrap gap-0.5 justify-center items-center content-center hover:bg-gray-100 rounded-full cursor-pointer text-gray-400 hover:text-gray-800 transition-colors shrink-0"
              title="Launch AI Co-Writer Workspace"
            >
              {[...Array(9)].map((_, i) => (
                <span key={i} className="w-1 h-1 bg-current rounded-full" />
              ))}
            </div>

            {/* Mobile hamburger menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="xl:hidden p-2 text-gray-700 hover:text-gray-900 focus:outline-none cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* 1. DROP-DOWN SCREEN FOR "CONVERT PDF" */}
        {activeMenu === "convert" && (
          <div
            className="absolute left-0 right-0 top-16 bg-slate-50 border-b border-gray-200 shadow-xl z-50 animate-fade-in"
            onMouseEnter={handleKeepMenuOpen}
          >
            {/* Direct caret arrow pointer */}
            <div className="absolute top-0 left-[28%] xl:left-[30%] w-3 h-3 bg-white border-t border-l border-gray-200 -mt-1.5 transform rotate-45" />

            <div className="max-w-4xl mx-auto bg-white p-8 grid grid-cols-2 gap-12 rounded-b-2xl border border-gray-150 relative z-10">
              {/* CONVERT TO PDF COLUMN */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-2">
                  CONVERT TO PDF
                </h4>
                <ul className="space-y-3">
                  {CONVERT_TO_PDF_ITEMS.map((item) => (
                    <li
                      key={item.toolId}
                      onClick={() => handleSelectToolFromNav(item.toolId)}
                      className="group flex items-center gap-3.5 py-1 px-2 rounded-lg hover:bg-gray-50/80 cursor-pointer transition"
                    >
                      {menuToolIcon(item.toolId)}
                      <span className="text-[13px] font-bold text-gray-700 group-hover:text-[#E53E3E] transition">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CONVERT FROM PDF COLUMN */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-black text-gray-400 tracking-wider uppercase border-b border-gray-100 pb-2">
                  CONVERT FROM PDF
                </h4>
                <ul className="space-y-3">
                  {CONVERT_FROM_PDF_ITEMS.map((item) => (
                    <li
                      key={item.toolId}
                      onClick={() => handleSelectToolFromNav(item.toolId)}
                      className="group flex items-center gap-3.5 py-1 px-2 rounded-lg hover:bg-gray-50/80 cursor-pointer transition"
                    >
                      {menuToolIcon(item.toolId)}
                      <span className="text-[13px] font-bold text-gray-700 group-hover:text-[#E53E3E] transition">
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 2. MEGA-MENU FOR "ALL PDF TOOLS" (Full Width 7 Columns) */}
        {activeMenu === "all" && (
          <div
            className="absolute left-0 right-0 top-16 bg-slate-50 border-b border-gray-200 shadow-2xl z-50 animate-fade-in"
            onMouseEnter={handleKeepMenuOpen}
          >
            {/* Direct caret pointer */}
            <div className="absolute top-0 left-[38%] xl:left-[40%] w-3 h-3 bg-white border-t border-l border-gray-200 -mt-1.5 transform rotate-45" />

            <div className="max-w-[94rem] mx-auto bg-white p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6 rounded-b-3xl border border-gray-150 relative z-10 shadow-xs">
              {ALL_TOOLS_CATEGORIES.map((cat, idx) => (
                <div key={idx} className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 tracking-widest uppercase border-b border-gray-100 pb-2">
                    {cat.title}
                  </h4>
                  <ul className="space-y-2.5">
                    {cat.items.map((item) => (
                      <li
                        key={item.id}
                        onClick={() => handleSelectToolFromNav(item.id)}
                        className="group flex items-center gap-2 py-0.5 px-1.5 rounded-lg hover:bg-gray-50/50 cursor-pointer transition-all duration-100"
                      >
                        {menuToolIcon(item.id)}
                        <span className="text-[12px] font-bold text-gray-600 group-hover:text-[#E53E3E] group-hover:translate-x-0.5 transition duration-100">
                          {item.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mobile slide-out link panel drawer */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-gray-200 px-6 py-4 space-y-4 max-h-[calc(100vh-4rem)] overflow-y-auto font-sans shadow-lg animate-fade-in block">
            <div className="flex flex-col gap-3 font-semibold text-xs uppercase tracking-wide">
              <span
                onClick={() => handleSelectToolFromNav("merge")}
                className="py-2 border-b border-gray-100 block hover:text-[#E53E3E]"
              >
                Merge PDF
              </span>
              <span
                onClick={() => handleSelectToolFromNav("split")}
                className="py-2 border-b border-gray-100 block hover:text-[#E53E3E]"
              >
                Split PDF
              </span>
              <span
                onClick={() => handleSelectToolFromNav("compress_pdf")}
                className="py-2 border-b border-gray-100 block hover:text-[#E53E3E]"
              >
                Compress PDF
              </span>

              {/* Accordion sections for mobile convert/all tools */}
              <div>
                <button
                  onClick={() => setMobileExpandedSection(mobileExpandedSection === "convert" ? null : "convert")}
                  className="w-full text-left py-2 border-b border-gray-100 font-bold uppercase flex justify-between items-center text-gray-800"
                >
                  <span>Convert PDF</span>
                  <ChevronDown className={`w-4 h-4 transition ${mobileExpandedSection === "convert" ? "rotate-180" : ""}`} />
                </button>
                {mobileExpandedSection === "convert" && (
                  <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg mt-2 mb-2">
                    <div>
                      <h5 className="text-[9px] font-bold text-gray-400 mb-2">TO PDF</h5>
                      <ul className="space-y-2 text-[11px] font-semibold text-gray-700">
                        {CONVERT_TO_PDF_ITEMS.map((item) => (
                          <li key={item.toolId} onClick={() => handleSelectToolFromNav(item.toolId)} className="flex items-center gap-1.5 py-1 cursor-pointer">
                            {menuToolIcon(item.toolId)}
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="text-[9px] font-bold text-gray-400 mb-2">FROM PDF</h5>
                      <ul className="space-y-2 text-[11px] font-semibold text-gray-700">
                        {CONVERT_FROM_PDF_ITEMS.map((item) => (
                          <li key={item.toolId} onClick={() => handleSelectToolFromNav(item.toolId)} className="flex items-center gap-1.5 py-1 cursor-pointer">
                            {menuToolIcon(item.toolId)}
                            <span>{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={() => setMobileExpandedSection(mobileExpandedSection === "all" ? null : "all")}
                  className="w-full text-left py-2 border-b border-gray-100 font-bold uppercase flex justify-between items-center text-gray-800"
                >
                  <span>All PDF Tools</span>
                  <ChevronDown className={`w-4 h-4 transition ${mobileExpandedSection === "all" ? "rotate-180" : ""}`} />
                </button>
                {mobileExpandedSection === "all" && (
                  <div className="space-y-4 bg-gray-50 p-4 rounded-xl mt-2 mb-2 max-h-96 overflow-y-auto">
                    {ALL_TOOLS_CATEGORIES.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <h5 className="text-[9px] font-black text-gray-400 tracking-wide uppercase border-b border-gray-200 pb-1">{cat.title}</h5>
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-gray-700">
                          {cat.items.map((item) => (
                            <div key={item.id} onClick={() => handleSelectToolFromNav(item.id)} className="flex items-center gap-1.5 py-1 cursor-pointer">
                              {menuToolIcon(item.id)}
                              <span>{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main active work content area */}
      <main className="flex-1">
        {renderActiveTool()}
      </main>

      {/* Modern styled footer with details */}
      <footer className="border-t border-gray-200 bg-white py-8 px-6 mt-16 text-center text-xs text-gray-500 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Completed fully client-side on device standard tools • Safe & Encrypted</span>
          </div>

          <div className="flex items-center gap-1 justify-center sm:justify-start font-mono text-[10px]">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5 animate-pulse" />
            <span>as a professional document suite</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
