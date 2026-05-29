import React, { useState, useRef } from "react";
import { ArrowLeft, Upload, ImageIcon, Trash2, CheckCircle2, ChevronRight, Activity } from "lucide-react";
import { imagesToPDF } from "../lib/pdfUtils";

interface ImageToPDFToolProps {
  onBack: () => void;
}

interface ImageFileRef {
  id: string;
  file: File;
  name: string;
  size: number;
  format: "png" | "jpg";
  previewUrl: string;
}

export default function ImageToPDFTool({ onBack }: ImageToPDFToolProps) {
  const [images, setImages] = useState<ImageFileRef[]>([]);
  const [pageSize, setPageSize] = useState<"Fit" | "A4" | "Letter">("Fit");
  const [margin, setMargin] = useState<number>(0); // 0, 15, 30
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImages = (incomingFiles: FileList | null) => {
    if (!incomingFiles) return;
    setStatus({ type: "idle", message: "" });
    const newImages: ImageFileRef[] = [];

    for (let i = 0; i < incomingFiles.length; i++) {
      const file = incomingFiles[i];
      const nameLower = file.name.toLowerCase();
      let format: "png" | "jpg" = "jpg";

      if (nameLower.endsWith(".png")) {
        format = "png";
      } else if (nameLower.endsWith(".jpg") || nameLower.endsWith(".jpeg")) {
        format = "jpg";
      } else {
        setStatus({
          type: "error",
          message: "Only JPG, JPEG, and PNG images are supported for conversion.",
        });
        continue;
      }

      newImages.push({
        id: Math.random().toString(36).substring(2, 9),
        file,
        name: file.name,
        size: file.size,
        format,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setImages((prev) => [...prev, ...newImages]);
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
    handleImages(e.dataTransfer.files);
  };

  const removeImage = (id: string, url: string) => {
    URL.revokeObjectURL(url);
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setStatus({ type: "idle", message: "" });
  };

  const handleCompile = async () => {
    if (images.length === 0) {
      setStatus({ type: "error", message: "Please select at least one image file to convert." });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const payload = await Promise.all(
        images.map(async (img) => {
          const buffer = await img.file.arrayBuffer();
          return {
            buffer,
            format: img.format,
          };
        })
      );

      const pdfBytes = await imagesToPDF(payload, { margin, pageSize });

      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `images_converted_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: "Images converted to PDF and downloaded successfully!" });
    } catch (err: any) {
      console.error(err);
      setStatus({ type: "error", message: err.message || "An error occurred during conversion." });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="image-to-pdf-tool" className="max-w-4xl mx-auto px-4 py-8">
      <button
        id="btn-back-dashboard"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Convert Image to PDF</h2>
        <p className="text-xs text-gray-500 mt-1 font-sans">
          Turn your JPG, JPEG, and PNG images into standard page-oriented PDF layouts fast.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-violet-500 bg-violet-50/50"
                : "border-gray-300 hover:border-gray-400 bg-white"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImages(e.target.files)}
              multiple
              accept="image/png, image/jpeg, image/jpg"
              className="hidden"
            />
            <div className="flex flex-col items-center">
              <div className="p-3 bg-amber-50 rounded-full text-amber-500 mb-3 animate-pulse">
                <Upload className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-gray-700">
                Drag & drop images here, or <span className="text-violet-600 underline">browse computer</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">Supports PNG, JPG, and JPEG</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex justify-between items-center border-b border-gray-150 pb-3 mb-4">
                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  Image Queue ({images.length})
                </h4>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-600 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
              </div>

              {/* Grid representation of previews */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className="group border border-gray-150 rounded-xl overflow-hidden relative aspect-square bg-gray-50 flex flex-col justify-between"
                  >
                    <img
                      src={img.previewUrl}
                      alt={img.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />

                    {/* Dark gradient and trash cover on Hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(img.id, img.previewUrl);
                        }}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm transform scale-90 group-hover:scale-100 transition duration-150"
                        title="Delete image"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1.5 text-center">
                      <p className="text-[10px] text-white truncate font-sans px-1" title={img.name}>
                        {img.name}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configurations panel */}
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Conversion Options
            </h3>

            <div className="mt-4 space-y-4 font-sans text-xs">
              {/* Spacing option */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Page margins
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: "None", val: 0 },
                    { label: "Small", val: 15 },
                    { label: "Large", val: 32 },
                  ] as const).map((m) => (
                    <button
                      key={m.label}
                      onClick={() => setMargin(m.val)}
                      disabled={images.length === 0}
                      className={`py-2 text-center text-xs font-medium border rounded-xl transition-all ${
                        margin === m.val
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Page format */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Target Page Dimensions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { key: "Fit", label: "Fit Image" },
                    { key: "A4", label: "A4 Page" },
                    { key: "Letter", label: "Letter" },
                  ] as const).map((size) => (
                    <button
                      key={size.key}
                      onClick={() => setPageSize(size.key)}
                      disabled={images.length === 0}
                      className={`py-2 text-center text-xs font-medium border rounded-xl transition-all ${
                        pageSize === size.key
                          ? "bg-amber-500 text-white border-amber-500 shadow-xs"
                          : "bg-white text-gray-600 hover:bg-gray-50 border-gray-200"
                      }`}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>
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
                onClick={handleCompile}
                disabled={images.length === 0 || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 ${
                  images.length === 0 || isProcessing
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 hover:shadow-md"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Compiling PDF document...</span>
                  </>
                ) : (
                  <>
                    <span>Convert to PDF</span>
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
