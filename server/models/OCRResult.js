const mongoose = require("mongoose");

const ocrResultSchema = new mongoose.Schema(
  {
    extractedText: {
      type: String,
      required: true,
    },
    detectedLanguage: {
      type: String,
      required: true,
    },
    languageCode: {
      type: String,
      required: true,
    },
    confidenceScore: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    sourceType: {
      type: String,
      enum: ["image", "camera", "pdf"],
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    boundingBoxes: [
      {
        text: String,
        coordinates: [[Number]],
        confidence: Number,
      },
    ],
    processedImagePath: {
      type: String,
    },
    audioPath: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      processingTime: Number,
      pageCount: Number,
      imageWidth: Number,
      imageHeight: Number,
    },
  },
  {
    timestamps: true,
  },
);

ocrResultSchema.index({ timestamp: -1 });
ocrResultSchema.index({ detectedLanguage: 1 });
ocrResultSchema.index({ sourceType: 1 });

module.exports = mongoose.model("OCRResult", ocrResultSchema);
