import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Configure body parser to allow processing base64 PDF uploads
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ limit: "15mb", extended: true }));

  // Initialize server-side Gemini Client
  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", apiSupported: !!process.env.GEMINI_API_KEY });
  });

  // AI Document analysis / OCR / Translation endpoint
  app.post("/api/analyze-pdf", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please add it in the Secrets panel."
        });
      }
      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }

      const { pdfBase64, prompt } = req.body;

      if (!pdfBase64) {
        return res.status(400).json({ error: "Missing PDF data (pdfBase64 is required)" });
      }

      if (!prompt) {
        return res.status(400).json({ error: "Missing instruction (prompt is required)" });
      }

      // Format parts for the @google/genai SDK
      const contentPart = {
        inlineData: {
          mimeType: "application/pdf",
          data: pdfBase64,
        },
      };

      const textPart = {
        text: prompt,
      };

      // Query Gemini 3.5 Flash for PDF processing
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts: [contentPart, textPart] },
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in analyze-pdf:", error);
      res.status(500).json({
        error: error.message || "An error occurred while communicating with the Gemini model."
      });
    }
  });

  // Interactive PDF conversation API (support both current PDF context and user message history)
  app.post("/api/chat-pdf", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is not configured on the server. Please add it in the Secrets panel."
        });
      }
      if (!ai) {
        ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });
      }

      const { pdfBase64, conversation, message } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Missing user message" });
      }

      const parts: any[] = [];

      // If document is included, add it to ground the chat context
      if (pdfBase64) {
        parts.push({
          inlineData: {
            mimeType: "application/pdf",
            data: pdfBase64,
          },
        });
      }

      // Append conversation outline to steer the response behavior
      const systemInstruction = 
        "You are an expert AI PDF assistant. Help the user understand, verify, extract, or explain the attached document. Be accurate, cite details where visible, and maintain a highly professional tone.";

      // Include message history for continuity in discussions
      let contextualPrompt = "";
      if (conversation && conversation.length > 0) {
        contextualPrompt += "Here is the conversation history so far:\n";
        conversation.forEach((msg: { sender: string; text: string }) => {
          contextualPrompt += `${msg.sender}: ${msg.text}\n`;
        });
        contextualPrompt += `\nUser's new question: ${message}`;
      } else {
        contextualPrompt = message;
      }

      parts.push({ text: contextualPrompt });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: { parts },
        config: {
          systemInstruction,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in chat-pdf:", error);
      res.status(500).json({
        error: error.message || "An error occurred during interactive chatting."
      });
    }
  });

  // Vite development vs production serving logic
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`);
  });
}

startServer();
