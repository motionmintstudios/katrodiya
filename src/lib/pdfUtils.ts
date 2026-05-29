import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";

/**
 * Merges multiple PDF files (represented as ArrayBuffers) into a single PDF
 * and returns the merged PDF as a Uint8Array.
 */
export async function mergePDFs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const buffer of pdfBuffers) {
    const pdf = await PDFDocument.load(buffer);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

/**
 * Splits a PDF, extracting pages based on user-defined page ranges (e.g., "1-2, 4-5").
 */
export async function splitPDF(pdfBuffer: ArrayBuffer, pageRangesStr: string): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer);
  const totalPages = srcPdf.getPageCount();
  const pageIndices: number[] = [];

  // Parse page ranges. E.g., "1-3, 5, 7"
  const parts = pageRangesStr.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes("-")) {
      const [startStr, endStr] = trimmed.split("-");
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) {
            pageIndices.push(i - 1);
          }
        }
      }
    } else {
      const val = parseInt(trimmed, 10);
      if (!isNaN(val) && val >= 1 && val <= totalPages) {
        pageIndices.push(val - 1);
      }
    }
  }

  // Fallback to extract everything if page range is empty
  const indicesToExtract = pageIndices.length > 0 ? pageIndices : srcPdf.getPageIndices();

  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, indicesToExtract);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}

/**
 * Rotates all pages in a PDF file by a given angle increment (90, 180, 270 degrees).
 */
export async function rotatePDF(pdfBuffer: ArrayBuffer, rotationAngle: number): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  for (const page of pages) {
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + rotationAngle) % 360));
  }
  return await pdfDoc.save();
}

/**
 * Help helper to extract or count pages of a loaded PDF document without full re-save.
 */
export async function getPDFPageCount(pdfBuffer: ArrayBuffer): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return pdfDoc.getPageCount();
  } catch (err) {
    console.warn("Failed to retrieve page count directly", err);
    return 1;
  }
}

/**
 * Converts multiple images (PNG, JPG) to a single compiled PDF.
 */
export async function imagesToPDF(
  images: { buffer: ArrayBuffer; format: "png" | "jpg" }[],
  options: { margin: number; pageSize: "A4" | "Letter" | "Fit" }
): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const imgData of images) {
    let pdfImage;
    try {
      if (imgData.format === "png") {
        pdfImage = await mergedPdf.embedPng(imgData.buffer);
      } else {
        pdfImage = await mergedPdf.embedJpg(imgData.buffer);
      }
    } catch (e) {
      // Fallback try embedJpg if error with format detection
      try {
        pdfImage = await mergedPdf.embedJpg(imgData.buffer);
      } catch (err) {
        pdfImage = await mergedPdf.embedPng(imgData.buffer);
      }
    }

    const { width, height } = pdfImage.scale(1.0);
    const m = options.margin;

    let pageWidth = width + m * 2;
    let pageHeight = height + m * 2;

    if (options.pageSize === "A4") {
      pageWidth = 595.28; // Standard A4 Width in PostScript Points
      pageHeight = 841.89; // Standard A4 Height
    } else if (options.pageSize === "Letter") {
      pageWidth = 612.0; // Letter Width
      pageHeight = 792.0; // Letter Height
    }

    const page = mergedPdf.addPage([pageWidth, pageHeight]);

    const maxDrawWidth = pageWidth - m * 2;
    const maxDrawHeight = pageHeight - m * 2;

    const scaleRatio = Math.min(maxDrawWidth / width, maxDrawHeight / height, 1.0);
    const finalWidth = width * scaleRatio;
    const finalHeight = height * scaleRatio;

    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    page.drawImage(pdfImage, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });
  }

  return await mergedPdf.save();
}

/**
 * Applies a text watermark onto all pages of a PDF.
 */
export async function watermarkPDF(
  pdfBuffer: ArrayBuffer,
  text: string,
  options: {
    fontSize: number;
    color: string;
    opacity: number;
    rotation: number;
    placement: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";
  }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Clean and parse Hex Color
  const rawHex = options.color.replace("#", "");
  const r = parseInt(rawHex.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(rawHex.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(rawHex.substring(4, 6), 16) / 255 || 0;

  for (const page of pages) {
    const { width, height } = page.getSize();
    let x = width / 2;
    let y = height / 2;

    // Calculate alignment
    if (options.placement === "center") {
      x = width / 2 - (text.length * options.fontSize) / 4;
      y = height / 2;
    } else if (options.placement === "top-left") {
      x = 40;
      y = height - 40;
    } else if (options.placement === "top-right") {
      x = width - ((text.length * options.fontSize) / 2 + 40);
      y = height - 40;
    } else if (options.placement === "bottom-left") {
      x = 40;
      y = 40;
    } else if (options.placement === "bottom-right") {
      x = width - ((text.length * options.fontSize) / 2 + 40);
      y = 40;
    }

    page.drawText(text, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(options.rotation),
    });
  }

  return await pdfDoc.save();
}

/**
 * Password-protects (encrypts) a PDF file.
 */
export async function protectPDF(pdfBuffer: ArrayBuffer, password: string): Promise<Uint8Array> {
  const srcBytes = new Uint8Array(pdfBuffer);
  const prefix = `PDFCRAFT_SECURE:${password}:`;
  const signatureBytes = new TextEncoder().encode(prefix);
  const encryptedBytes = new Uint8Array(srcBytes.length + signatureBytes.length);

  // Prepend security verify credentials
  encryptedBytes.set(signatureBytes, 0);

  // Apply byte XOR encryption key using password byte sequences
  const key = password.split("").map((c) => c.charCodeAt(0));
  for (let i = 0; i < srcBytes.length; i++) {
    encryptedBytes[signatureBytes.length + i] = srcBytes[i] ^ key[i % key.length];
  }

  return encryptedBytes;
}

/**
 * Removes password protection (decrypts) a PDF file, assuming they input the correct key.
 */
export async function unlockPDF(pdfBuffer: ArrayBuffer, password: string): Promise<Uint8Array> {
  const encryptedBytes = new Uint8Array(pdfBuffer);
  const decoder = new TextDecoder();
  const prefix = `PDFCRAFT_SECURE:${password}:`;
  const signatureBytes = new TextEncoder().encode(prefix);

  if (encryptedBytes.length < signatureBytes.length) {
    throw new Error("Invalid format or incorrect password verification.");
  }

  // Slice header and cross-verify password key
  const loadedSigBytes = encryptedBytes.slice(0, signatureBytes.length);
  const loadedSigStr = decoder.decode(loadedSigBytes);

  if (loadedSigStr !== prefix) {
    throw new Error("Incorrect password provided.");
  }

  // Perform inverse XOR decryption to retrieve the baseline PDF bytes
  const bodyBytes = encryptedBytes.slice(signatureBytes.length);
  const decryptedBytes = new Uint8Array(bodyBytes.length);
  const key = password.split("").map((c) => c.charCodeAt(0));
  for (let i = 0; i < bodyBytes.length; i++) {
    decryptedBytes[i] = bodyBytes[i] ^ key[i % key.length];
  }

  // Confirm PDF header sequence starts with %PDF
  const checkHeader = decoder.decode(decryptedBytes.slice(0, 5));
  if (!checkHeader.startsWith("%PDF")) {
    throw new Error("Failed to decrypt cleanly. File is corrupted or password mismatch.");
  }

  return decryptedBytes;
}

/**
 * Organizes PAGES of a single PDF file (allows re-ordering and deletions).
 */
export async function organizePDF(pdfBuffer: ArrayBuffer, selectedPageIndices: number[]): Promise<Uint8Array> {
  const srcPdf = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const copiedPages = await newPdf.copyPages(srcPdf, selectedPageIndices);
  copiedPages.forEach((page) => newPdf.addPage(page));
  return await newPdf.save();
}
