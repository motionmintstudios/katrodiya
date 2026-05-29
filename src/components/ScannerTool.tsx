import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Camera, Image, CheckCircle2, ChevronRight, Activity, Trash2, RotateCw, RefreshCw, Sparkles, Sliders } from "lucide-react";
import { PDFDocument } from "pdf-lib";

interface ScannerToolProps {
  onBack: () => void;
}

interface ScanPage {
  id: string;
  dataUrl: string;
  rotation: number;
}

export default function ScannerTool({ onBack }: ScannerToolProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pages, setPages] = useState<ScanPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; message: string }>({
    type: "idle",
    message: "",
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize Camera Stream
  useEffect(() => {
    if (isCameraActive) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) {
            videoRef.current.srcObject = mediaStream;
          }
        })
        .catch((err) => {
          console.warn("Unable to establish custom environment camera stream:", err);
          setStatus({
            type: "error",
            message: "Unable to find standard system camera devices. You may still upload standard files directly.",
          });
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCameraActive]);

  const stopCameraFeed = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  const startCameraFeed = () => {
    setIsCameraActive(true);
    setStatus({ type: "idle", message: "" });
  };

  const captureSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Convert captured snapshot to png dataUrl and store it
        const dataUrl = canvas.toDataURL("image/png");
        const newPage: ScanPage = {
          id: Math.random().toString(36).substring(7),
          dataUrl,
          rotation: 0,
        };

        setPages((prev) => [...prev, newPage]);
        setStatus({ type: "idle", message: "" });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const newPage: ScanPage = {
            id: Math.random().toString(36).substring(7),
            dataUrl: event.target.result as string,
            rotation: 0,
          };
          setPages((prev) => [...prev, newPage]);
        }
      };
      reader.readAsDataURL(files[i]);
    }
  };

  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return { ...p, rotation: (p.rotation + 90) % 360 };
        }
        return p;
      })
    );
  };

  const deletePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const compilePagesToPDF = async () => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    setStatus({ type: "idle", message: "" });

    try {
      const compiledPdf = await PDFDocument.create();

      for (const p of pages) {
        // Embed image
        const imgBuffer = await fetch(p.dataUrl).then((r) => r.arrayBuffer());
        const pdfImage = await compiledPdf.embedPng(imgBuffer);
        const { width, height } = pdfImage.scale(1.0);

        // Standard A4 sizes match PostScript parameters
        const page = compiledPdf.addPage([595.28, 841.89]);
        const m = 30; // 30px margins
        const maxDrawWidth = 595.28 - m * 2;
        const maxDrawHeight = 841.89 - m * 2;

        const scaleRatio = Math.min(maxDrawWidth / width, maxDrawHeight / height, 1.0);
        const finalWidth = width * scaleRatio;
        const finalHeight = height * scaleRatio;

        const x = (595.28 - finalWidth) / 2;
        const y = (841.89 - finalHeight) / 2;

        page.drawImage(pdfImage, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });

        if (p.rotation !== 0) {
          page.setRotation({ angle: p.rotation } as any);
        }
      }

      const pdfBytes = await compiledPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `scanned_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setStatus({ type: "success", message: `Compiled ${pages.length} scanned pages successfully into standard PDF!` });
    } catch (e: any) {
      console.error(e);
      setStatus({ type: "error", message: `Unable to compile scans: ${e.message || "Is memory full?"}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="scan-pdf-tool" className="max-w-4xl mx-auto px-4 py-8 font-sans">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to tools</span>
      </button>

      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-display font-semibold text-gray-900">Scan Documents to PDF</h2>
          <p className="text-xs text-gray-500 mt-1 font-sans">
            Capture multiple receipt snaps, invoices or sketches to systematically stitch pages into archive formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isCameraActive ? (
            <button
              onClick={stopCameraFeed}
              className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl transition cursor-pointer"
            >
              Disable Camera
            </button>
          ) : (
            <button
              onClick={startCameraFeed}
              className="px-3.5 py-2 border border-violet-200 bg-violet-50 text-violet-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Activate Camera Feed
            </button>
          )}

          <label className="px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-xs font-semibold text-gray-700 rounded-xl transition cursor-pointer">
            <input type="file" onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
            Upload Scans
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Real Live feed panel */}
          {isCameraActive && (
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video shadow-lg border border-slate-900 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <canvas ref={canvasRef} className="hidden" />

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
                <button
                  onClick={captureSnapshot}
                  className="p-4 bg-red-600 hover:bg-red-700 hover:scale-105 active:scale-95 text-white rounded-full shadow-lg transition duration-200 cursor-pointer"
                >
                  <Camera className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Staged snapshot scans pages */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-violet-600" />
              <span>Captured Pages Stack {pages.length > 0 && `(${pages.length})`}</span>
            </h3>

            {pages.length === 0 ? (
              <div className="border border-dashed border-gray-300 rounded-2xl p-12 text-center bg-white text-gray-400">
                <Image className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                <p className="text-xs font-semibold">No scanned snapshots stage yet.</p>
                <p className="text-[10px] text-gray-400 mt-1">Take pictures above to fill the document workspace.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {pages.map((p, idx) => (
                  <div key={p.id} className="relative group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                    <div className="aspect-3/4 overflow-hidden bg-gray-150 flex items-center justify-center p-2">
                      <img
                        src={p.dataUrl}
                        alt={`Scan step ${idx}`}
                        className="max-h-full max-w-full object-contain transition duration-150"
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                    </div>

                    <div className="absolute top-2 right-2 flex gap-1 bg-black/60 backdrop-blur-xs p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition duration-150">
                      <button
                        onClick={() => rotatePage(p.id)}
                        className="p-1 hover:bg-white/20 text-white rounded transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deletePage(p.id)}
                        className="p-1 hover:bg-red-500 text-white rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="p-2 border-t border-gray-100 text-[10px] font-semibold text-gray-500 font-mono flex justify-between bg-gray-50">
                      <span>PAGE {idx + 1}</span>
                      {p.rotation !== 0 && <span>{p.rotation}°</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs text-xs">
            <h3 className="text-sm font-semibold text-gray-900 border-b border-gray-100 pb-3 uppercase tracking-wide">
              Compilation Workspace
            </h3>

            <div className="mt-4 space-y-4">
              <div className="space-y-1.5 p-3.5 bg-violet-50/50 rounded-xl border border-violet-100 text-violet-900">
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="font-bold">Scan Settings</span>
                </div>
                <p className="text-[10px] text-violet-700">Dynamic scaling on compilation fits pages cleanly inside A4 bounds.</p>
              </div>

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
                onClick={compilePagesToPDF}
                disabled={pages.length === 0 || isProcessing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-semibold text-white tracking-wide transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 ${
                  pages.length === 0 || isProcessing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isProcessing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" />
                    <span>Compiling scanned page layouts...</span>
                  </>
                ) : (
                  <>
                    <span>Compile Scans stack</span>
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
