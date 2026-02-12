const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs").promises;
const path = require("path");
const upload = require("../middleware/upload");
const OCRResult = require("../models/OCRResult");
const { detectLanguage } = require("../utils/languageDetector");
const { processPDF, cleanupTempFiles } = require("../utils/pdfProcessor");
const { extractTextFromImageHF } = require("../utils/huggingfaceOCR");

const PYTHON_SERVICE_URL =
  process.env.PYTHON_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/ocr/upload
 * Upload and process image file
 */
router.post("/upload", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No file uploaded",
      });
    }

    const startTime = Date.now();
    const { text } = await extractTextFromImageHF(
      req.file.path,
      req.file.mimetype,
    );
    const boxes = [];
    const confidence = 0; // HF chatCompletion does not provide confidence score
    const processed_image = null;

    const languageInfo = detectLanguage(text);

    let processedImagePath = null;
    if (processed_image) {
      const imageBuffer = Buffer.from(processed_image, "base64");
      processedImagePath = path.join(
        "uploads",
        `processed-${req.file.filename}`,
      );
      await fs.writeFile(
        path.join(__dirname, "..", processedImagePath),
        imageBuffer,
      );
    }

    const ocrResult = new OCRResult({
      extractedText: text,
      detectedLanguage: languageInfo.name,
      languageCode: languageInfo.code,
      confidenceScore: confidence || 0,
      sourceType: "image",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      boundingBoxes: boxes || [],
      processedImagePath: processedImagePath,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    });

    await ocrResult.save();

    res.json({
      success: true,
      data: {
        id: ocrResult._id,
        text: text,
        language: languageInfo.name,
        languageCode: languageInfo.code,
        confidence: confidence,
        boxes: boxes,
        processedImage: processedImagePath
          ? `/uploads/${path.basename(processedImagePath)}`
          : null,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("OCR Upload Error:", error);
    next(error);
  }
});

/**
 * POST /api/ocr/camera
 * Process camera-captured image
 */
router.post("/camera", upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No image captured",
      });
    }

    const startTime = Date.now();
    const { text } = await extractTextFromImageHF(
      req.file.path,
      req.file.mimetype,
    );
    const boxes = [];
    const confidence = 0; // HF chatCompletion does not provide confidence score
    const processed_image = null;

    const languageInfo = detectLanguage(text);

    let processedImagePath = null;
    if (processed_image) {
      const imageBuffer = Buffer.from(processed_image, "base64");
      processedImagePath = path.join(
        "uploads",
        `processed-${req.file.filename}`,
      );
      await fs.writeFile(
        path.join(__dirname, "..", processedImagePath),
        imageBuffer,
      );
    }

    const ocrResult = new OCRResult({
      extractedText: text,
      detectedLanguage: languageInfo.name,
      languageCode: languageInfo.code,
      confidenceScore: confidence || 0,
      sourceType: "camera",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      boundingBoxes: boxes || [],
      processedImagePath: processedImagePath,
      metadata: {
        processingTime: Date.now() - startTime,
      },
    });

    await ocrResult.save();

    res.json({
      success: true,
      data: {
        id: ocrResult._id,
        text: text,
        language: languageInfo.name,
        languageCode: languageInfo.code,
        confidence: confidence,
        boxes: boxes,
        processedImage: processedImagePath
          ? `/uploads/${path.basename(processedImagePath)}`
          : null,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("Camera OCR Error:", error);
    next(error);
  }
});

/**
 * POST /api/ocr/pdf
 * Process PDF file
 */
router.post("/pdf", upload.single("pdf"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "No PDF file uploaded",
      });
    }

    const startTime = Date.now();
    const pdfResult = await processPDF(req.file.path);

    let finalText = "";
    let allBoxes = [];
    let avgConfidence = 0;
    let processedImagePath = null;

    if (pdfResult.requiresOCR) {
      const ocrPromises = pdfResult.imagePaths.map(async (imagePath) => {
        const formData = new FormData();
        formData.append("file", await fs.readFile(imagePath), {
          filename: path.basename(imagePath),
          contentType: "image/png",
        });

        const response = await axios.post(
          `${PYTHON_SERVICE_URL}/ocr`,
          formData,
          {
            headers: formData.getHeaders(),
            timeout: 30000,
          },
        );

        return response.data;
      });

      const ocrResults = await Promise.all(ocrPromises);

      finalText = ocrResults
        .map((r) => r.text)
        .join("\n\n--- Page Break ---\n\n");
      allBoxes = ocrResults.flatMap((r) => r.boxes || []);
      avgConfidence =
        ocrResults.reduce((sum, r) => sum + (r.confidence || 0), 0) /
        ocrResults.length;

      if (ocrResults[0].processed_image) {
        const imageBuffer = Buffer.from(
          ocrResults[0].processed_image,
          "base64",
        );
        processedImagePath = path.join(
          "uploads",
          `processed-${req.file.filename}.png`,
        );
        await fs.writeFile(
          path.join(__dirname, "..", processedImagePath),
          imageBuffer,
        );
      }

      await cleanupTempFiles(path.dirname(pdfResult.imagePaths[0]));
    } else {
      finalText = pdfResult.text;
      avgConfidence = 0.95; // High confidence for selectable text
    }

    const languageInfo = detectLanguage(finalText);

    const ocrResult = new OCRResult({
      extractedText: finalText,
      detectedLanguage: languageInfo.name,
      languageCode: languageInfo.code,
      confidenceScore: avgConfidence,
      sourceType: "pdf",
      fileName: req.file.originalname,
      fileSize: req.file.size,
      boundingBoxes: allBoxes,
      processedImagePath: processedImagePath,
      metadata: {
        processingTime: Date.now() - startTime,
        pageCount: pdfResult.pageCount,
      },
    });

    await ocrResult.save();

    res.json({
      success: true,
      data: {
        id: ocrResult._id,
        text: finalText,
        language: languageInfo.name,
        languageCode: languageInfo.code,
        confidence: avgConfidence,
        boxes: allBoxes,
        processedImage: processedImagePath
          ? `/uploads/${path.basename(processedImagePath)}`
          : null,
        pageCount: pdfResult.pageCount,
        pdfType: pdfResult.type,
        processingTime: Date.now() - startTime,
      },
    });
  } catch (error) {
    console.error("PDF OCR Error:", error);
    next(error);
  }
});

module.exports = router;
