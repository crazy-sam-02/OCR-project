const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs").promises;
const gtts = require("gtts");
const OCRResult = require("../models/OCRResult");

/**
 * POST /api/tts/generate
 * Generate text-to-speech audio
 */
router.post("/generate", async (req, res, next) => {
  try {
    const { text, language, resultId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    const languageMap = {
      en: "en",
      ta: "ta",
      hi: "hi",
      english: "en",
      tamil: "ta",
      hindi: "hi",
    };

    const ttsLanguage = languageMap[language.toLowerCase()] || "en";

    const filename = `tts-${Date.now()}-${Math.random().toString(36).substring(7)}.mp3`;
    const audioPath = path.join(__dirname, "../uploads", filename);

    const speech = new gtts(text, ttsLanguage);

    await new Promise((resolve, reject) => {
      speech.save(audioPath, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (resultId) {
      try {
        await OCRResult.findByIdAndUpdate(resultId, {
          audioPath: `uploads/${filename}`,
        });
      } catch (error) {
        console.error("Error updating OCR result with audio path:", error);
      }
    }

    res.json({
      success: true,
      data: {
        audioUrl: `/uploads/${filename}`,
        language: ttsLanguage,
        filename: filename,
      },
    });
  } catch (error) {
    console.error("TTS Generation Error:", error);
    next(error);
  }
});

/**
 * GET /api/tts/download/:filename
 * Download TTS audio file
 */
router.get("/download/:filename", async (req, res, next) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads", filename);

    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({
        success: false,
        error: "Audio file not found",
      });
    }

    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Download error:", err);
        next(err);
      }
    });
  } catch (error) {
    console.error("TTS Download Error:", error);
    next(error);
  }
});

module.exports = router;
