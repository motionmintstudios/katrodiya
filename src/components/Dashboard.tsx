import React, { useState } from "react";
import {
  FolderSync,
  Scissors,
  RotateCw,
  Image as ImageIcon,
  Type as FontIcon,
  LayoutGrid,
  ChevronRight,
  ShieldCheck,
  FileText,
  Camera,
  FileCode,
  Landmark,
  Eye,
  Scale,
  Activity,
  PenTool,
  Lock,
  Unlock,
  Sparkles,
  Search,
  Filter,
  FileUp,
  FileDown
} from "lucide-react";
import { PDFToolType, ToolMetadata } from "../types";

interface DashboardProps {
  onSelectTool: (tool: PDFToolType) => void;
}

const TOOLS: ToolMetadata[] = [
  // ORGANIZE CATEGORY
  {
    id: "organize",
    title: "Organize PDF Pages",
    description: "Visually reorder pages, delete unnecessary pages, and restructure documents dynamically.",
    iconName: "LayoutGrid",
    color: "from-violet-500 to-fuchsia-600",
    category: "organize",
  },
  {
    id: "merge",
    title: "Merge PDF",
    description: "Combine multiple PDF files into one. Drag-and-drop to reorder them prior to compilation.",
    iconName: "FolderSync",
    color: "from-blue-500 to-indigo-600",
    category: "organize",
  },
  {
    id: "split",
    title: "Split PDF",
    description: "Extract specific page ranges or split a large document into highly targeted subsets.",
    iconName: "Scissors",
    color: "from-rose-500 to-orange-600",
    category: "organize",
  },
  {
    id: "remove_pages",
    title: "Remove Pages",
    description: "Select specific redundant page numbers and isolate clean documents instantaneously.",
    iconName: "Scissors",
    color: "from-red-500 to-pink-600",
    category: "organize",
  },
  {
    id: "extract_pages",
    title: "Extract Pages",
    description: "Cherrypick selected single pages or custom boundaries for targeted exports.",
    iconName: "FileDown",
    color: "from-teal-500 to-cyan-500",
    category: "organize",
  },
  {
    id: "scan_pdf",
    title: "Scan to PDF Workstation",
    description: "Use device camera to capture scan records directly and compile multi-page files.",
    iconName: "Camera",
    color: "from-emerald-500 to-teal-600",
    badge: "Camera Access",
    category: "organize",
  },
  {
    id: "optimize_pdf",
    title: "Optimize PDF Stream",
    description: "Linearize objects, wipe duplicate attachments and optimize resources cleanly.",
    iconName: "Activity",
    color: "from-purple-500 to-indigo-600",
    category: "organize",
  },
  {
    id: "compress_pdf",
    title: "Compress PDF Size",
    description: "Resize resolution scales and optimize layout streams with no readability losses.",
    iconName: "Scale",
    color: "from-indigo-600 to-blue-500",
    category: "organize",
  },
  {
    id: "repair_pdf",
    title: "Repair PDF",
    description: "Recover structure, reconstruct catalog references and restore unreadable documents.",
    iconName: "Activity",
    color: "from-emerald-500 to-green-600",
    category: "organize",
  },

  // CONVERT TO PDF
  {
    id: "img2pdf",
    title: "JPG & Images to PDF",
    description: "Convert JPG, PNG, and WebP images to highly structured PDF documents instantly.",
    iconName: "ImageIcon",
    color: "from-amber-500 to-yellow-600",
    category: "convert_to",
  },
  {
    id: "word2pdf",
    title: "Word to PDF",
    description: "Decompile DOCX text segments and map clean typography directly to standard PDF outlines.",
    iconName: "FileText",
    color: "from-blue-600 to-sky-500",
    category: "convert_to",
  },
  {
    id: "ppt2pdf",
    title: "PowerPoint to PDF",
    description: "Convert slide elements and vector shapes into standard landscape document dimensions.",
    iconName: "FileText",
    color: "from-orange-500 to-red-500",
    category: "convert_to",
  },
  {
    id: "excel2pdf",
    title: "Excel to PDF Grid",
    description: "Convert spreadsheet workbooks or CSV matrices into bordered clean reports.",
    iconName: "Landmark",
    color: "from-emerald-600 to-teal-500",
    category: "convert_to",
  },
  {
    id: "html2pdf",
    title: "HTML to PDF Builder",
    description: "Write or render raw CSS/HTML code templates straight to pixel-perfect document page margins.",
    iconName: "FileCode",
    color: "from-amber-600 to-red-600",
    category: "convert_to",
  },

  // CONVERT FROM PDF
  {
    id: "pdf2jpg",
    title: "PDF to JPG Extractor",
    description: "Extract image assets or convert page vectors to zip archives of high-definition JPG screens.",
    iconName: "ImageIcon",
    color: "from-pink-500 to-rose-600",
    category: "convert_from",
  },
  {
    id: "pdf2word",
    title: "PDF to Word / TXT",
    description: "Decompile file objects, grouping text bodies perfectly into standard doc elements.",
    iconName: "FileText",
    color: "from-cyan-600 to-sky-500",
    category: "convert_from",
  },
  {
    id: "pdf2ppt",
    title: "PDF to PowerPoint",
    description: "Translate single pages to editable slide bullet sheets on editable layouts.",
    iconName: "FileText",
    color: "from-purple-500 to-violet-600",
    category: "convert_from",
  },
  {
    id: "pdf2excel",
    title: "PDF to Excel Tabular",
    description: "Isolate, capture and convert text matrices into fully formatted CSV sheets.",
    iconName: "Landmark",
    color: "from-emerald-500 to-cyan-500",
    category: "convert_from",
  },
  {
    id: "pdf2pdfa",
    title: "PDF to ISO PDF/A Format",
    description: "Embed ISO-19005 archiving compliance attributes to ensure stable storage periods.",
    iconName: "FileCode",
    color: "from-blue-600 to-indigo-700",
    category: "convert_from",
  },

  // EDIT PDF
  {
    id: "edit_pdf",
    title: "Interactive PDF Editor",
    description: "Apply text boxes, custom notations, markings and visual drawings natively on pages.",
    iconName: "PenTool",
    color: "from-indigo-500 to-purple-600",
    category: "edit",
  },
  {
    id: "rotate",
    title: "Rotate PDF Alignments",
    description: "Rotate every page or single page layers clockwise and save instantly.",
    iconName: "RotateCw",
    color: "from-teal-500 to-emerald-600",
    category: "edit",
  },
  {
    id: "page_numbers",
    title: "Add Dynamic Page Numbers",
    description: "Render clean pagination indexes precisely on specified margin margins.",
    iconName: "FileText",
    color: "from-sky-500 to-indigo-500",
    category: "edit",
  },
  {
    id: "watermark",
    title: "Stamps & Watermarks",
    description: "Overlay customizable text stamps with opacity, rotation, size and positions.",
    iconName: "FontIcon",
    color: "from-cyan-500 to-blue-600",
    category: "edit",
  },
  {
    id: "crop_pdf",
    title: "Crop PDF Margins",
    description: "Interactively resize layout viewing scopes with automated pixel values.",
    iconName: "Scale",
    color: "from-emerald-400 to-teal-500",
    category: "edit",
  },
  {
    id: "pdf_forms",
    title: "Define Form Fields",
    description: "Instantiate interactive text blocks and form selectors inside document grids.",
    iconName: "FileCode",
    color: "from-pink-500 to-violet-600",
    category: "edit",
  },

  // SECURITY
  {
    id: "protect",
    title: "Protect PDF Encryption",
    description: "Encrypt and secure files with high-strength user passwords and policies.",
    iconName: "Lock",
    color: "from-purple-600 to-red-600",
    category: "security",
  },
  {
    id: "unlock",
    title: "Unlock PDF Restrictions",
    description: "Decrypt structures and remove security constraints seamlessly.",
    iconName: "Unlock",
    color: "from-emerald-600 to-green-500",
    category: "security",
  },
  {
    id: "sign_pdf",
    title: "Sign PDF",
    description: "Draw hand signatures on secure ink canvas blocks and stamp onto coordinator boxes.",
    iconName: "PenTool",
    color: "from-indigo-600 to-violet-600",
    category: "security",
  },
  {
    id: "redact_pdf",
    title: "Redact PDF Blackouts",
    description: "Render solid permanent dark stripes to isolate sensitive data logs completely.",
    iconName: "Eye",
    color: "from-red-600 to-pink-700",
    category: "security",
  },
  {
    id: "compare_pdf",
    title: "Compare PDF Editions",
    description: "Analyze logical insertions, edits and structural text differences side by side.",
    iconName: "LayoutGrid",
    color: "from-slate-600 to-neutral-700",
    category: "security",
  },

  // SPECIAL INTELLIGENCE
  {
    id: "ai_summarizer",
    title: "AI Summarizer Outline",
    description: "Leverage Gemini 3.5 Flash to synthesize outlines and key structured points from pages.",
    iconName: "Sparkles",
    color: "from-violet-600 to-indigo-600",
    badge: "Gemini AI",
    category: "intelligence",
  },
  {
    id: "translate_pdf",
    title: "Translate PDF Layout",
    description: "Render translated text dynamically into any supported global tongue.",
    iconName: "Sparkles",
    color: "from-blue-600 to-indigo-600",
    badge: "Gemini AI",
    category: "intelligence",
  },
  {
    id: "ocr_pdf",
    title: "OCR Scanner PDF",
    description: "Apply high-strength OCR model to extract hand-write text and skewed parameters.",
    iconName: "Eye",
    color: "from-fuchsia-600 to-pink-600",
    badge: "Gemini AI Enabled",
    category: "intelligence",
  },
  {
    id: "ai_reader",
    title: "AI Co-Writer & Conversations",
    description: "Ask questions, generate bullet summaries, extract OCR text, or translate documents instantly.",
    iconName: "Sparkles",
    color: "from-violet-600 via-indigo-600 to-blue-500",
    badge: "Gemini AI Enabled",
    category: "intelligence",
  },
];

export default function Dashboard({ onSelectTool }: DashboardProps) {
  const [filter, setFilter] = useState<"all" | "organize" | "convert_to" | "convert_from" | "edit" | "security" | "intelligence">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTools = TOOLS.filter((tool) => {
    const matchesFilter = filter === "all" || tool.category === filter;
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const renderIcon = (name: string, classes: string) => {
    switch (name) {
      case "FolderSync":
        return <FolderSync className={classes} />;
      case "Scissors":
        return <Scissors className={classes} />;
      case "RotateCw":
        return <RotateCw className={classes} />;
      case "ImageIcon":
        return <ImageIcon className={classes} />;
      case "FontIcon":
        return <FontIcon className={classes} />;
      case "LayoutGrid":
        return <LayoutGrid className={classes} />;
      case "Lock":
        return <Lock className={classes} />;
      case "Unlock":
        return <Unlock className={classes} />;
      case "Sparkles":
        return <Sparkles className={classes} />;
      case "Camera":
        return <Camera className={classes} />;
      case "FileCode":
        return <FileCode className={classes} />;
      case "Landmark":
        return <Landmark className={classes} />;
      case "Eye":
        return <Eye className={classes} />;
      case "Scale":
        return <Scale className={classes} />;
      case "Activity":
        return <Activity className={classes} />;
      case "PenTool":
        return <PenTool className={classes} />;
      default:
        return <FileText className={classes} />;
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case "organize":
        return "Organize PDF";
      case "convert_to":
        return "Convert to PDF";
      case "convert_from":
        return "Convert from PDF";
      case "edit":
        return "Edit PDF Workspace";
      case "security":
        return "PDF Security & Signature";
      case "intelligence":
        return "AI Intelligence & OCR";
      default:
        return "Workspace tools";
    }
  };

  return (
    <div id="pdf-dashboard" className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Header section with modern display typography */}
      <div className="text-center mb-10 mt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 rounded-full text-xs font-semibold text-violet-700 mb-4 animate-fade-in">
          <Sparkles className="w-3 h-3" />
          <span>Next-Generation Document workspace</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight leading-none mb-4">
          Every PDF tool at your <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">fingertips</span>
        </h1>
        <p className="max-w-2xl mx-auto text-sm text-gray-500">
          Your streamlined, browser-native suite of 30+ executive PDF tools. Merge, split, edit, secure, convert, or power document actions directly using state-of-the-art Gemini AI intelligence.
        </p>
      </div>

      {/* Advanced search bar */}
      <div className="max-w-md mx-auto mb-8 relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
        <input
          type="text"
          placeholder="Search 30+ PDF tools (e.g. compress, sign, OCR, word)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-gray-200 text-xs text-gray-700 shadow-sm focus:ring-1 focus:ring-violet-500 bg-white"
        />
      </div>

      {/* Tabs / Filters */}
      <div className="flex flex-wrap justify-center items-center gap-2 mb-10">
        {(["all", "organize", "convert_to", "convert_from", "edit", "security", "intelligence"] as const).map((cat) => (
          <button
            key={cat}
            id={`filter-${cat}`}
            onClick={() => setFilter(cat)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-bold tracking-wider uppercase transition-all duration-150 cursor-pointer ${
              filter === cat
                ? "bg-gray-900 text-white shadow-xs"
                : "bg-white text-gray-500 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {cat.replace("_", " ")} {cat === "intelligence" && "✨"}
          </button>
        ))}
      </div>

      {/* Grouping by Category when 'all' is selected */}
      {filter === "all" && searchQuery === "" ? (
        <div className="space-y-12">
          {(["organize", "convert_to", "convert_from", "edit", "security", "intelligence"] as const).map((cat) => (
            <div key={cat} className="space-y-4">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">
                {getCategoryLabel(cat)}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TOOLS.filter((t) => t.category === cat).map((tool) => (
                  <div
                    key={tool.id}
                    id={`tool-card-${tool.id}`}
                    onClick={() => onSelectTool(tool.id)}
                    className="group relative flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
                  >
                    <div className={`absolute top-0 left-0 right-0 h-[2.5px] rounded-t-2xl bg-gradient-to-r ${tool.color}`} />
                    <div className="mb-4">
                      <div className="flex items-start justify-between">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-2xs group-hover:scale-105 transition-transform duration-150`}>
                          {renderIcon(tool.iconName, "w-5 h-5")}
                        </div>
                        {tool.badge && (
                          <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[9px] font-bold rounded">
                            {tool.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900 mt-3 group-hover:text-violet-600 transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        {tool.description}
                      </p>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-gray-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all mt-2">
                      <span>Launch workspace</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              id={`tool-card-${tool.id}`}
              onClick={() => onSelectTool(tool.id)}
              className="group relative flex flex-col justify-between p-5 bg-white border border-gray-200 rounded-2xl hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
            >
              <div className={`absolute top-0 left-0 right-0 h-[2.5px] rounded-t-2xl bg-gradient-to-r ${tool.color}`} />
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-2xs group-hover:scale-105 transition-transform duration-150`}>
                    {renderIcon(tool.iconName, "w-5 h-5")}
                  </div>
                  {tool.badge && (
                    <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[9px] font-bold rounded">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mt-3 group-hover:text-violet-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                  {tool.description}
                </p>
              </div>
              <div className="flex items-center text-[10px] font-bold text-gray-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all mt-2">
                <span>Launch workspace</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Security note section */}
      <div className="mt-16 p-4 max-w-2xl mx-auto rounded-xl bg-gray-50 border border-gray-100 text-center flex items-center justify-center gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
        <span className="text-[10px] text-gray-500 leading-relaxed font-sans">
          <strong>100% Client-Side Privacy:</strong> Standard PDF files do not leave your device. All calculations, splits, and encryptions happen entirely inside your web browser. AI analysis operations are encrypted and securely brokered client-to-server.
        </span>
      </div>
    </div>
  );
}
