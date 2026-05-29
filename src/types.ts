export interface PDFFile {
  id: string;
  file: File;
  name: string;
  size: number;
  rotation: number; // 0, 90, 180, 270
  pageCount?: number;
  password?: string;
  previewUrl?: string; // For images to PDF
}

export type PDFToolType =
  | "merge"
  | "split"
  | "rotate"
  | "img2pdf"
  | "watermark"
  | "protect"
  | "unlock"
  | "organize"
  | "ai_reader"
  | "remove_pages"
  | "extract_pages"
  | "scan_pdf"
  | "optimize_pdf"
  | "compress_pdf"
  | "repair_pdf"
  | "ocr_pdf"
  | "word2pdf"
  | "ppt2pdf"
  | "excel2pdf"
  | "html2pdf"
  | "pdf2jpg"
  | "pdf2word"
  | "pdf2ppt"
  | "pdf2excel"
  | "pdf2pdfa"
  | "edit_pdf"
  | "page_numbers"
  | "crop_pdf"
  | "pdf_forms"
  | "sign_pdf"
  | "redact_pdf"
  | "compare_pdf"
  | "ai_summarizer"
  | "translate_pdf";

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
}

export interface ToolMetadata {
  id: PDFToolType;
  title: string;
  description: string;
  iconName: string;
  color: string;
  badge?: string;
  category: "organize" | "convert_to" | "convert_from" | "edit" | "security" | "intelligence";
}
