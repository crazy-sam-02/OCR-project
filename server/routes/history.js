const express = require("express");
const router = express.Router();
const OCRResult = require("../models/OCRResult");

/**
 * GET /api/history
 * Get all OCR history
 */
router.get("/", async (req, res, next) => {
  try {
    const { limit = 50, page = 1, language, sourceType } = req.query;

    const filter = {};
    if (language) filter.languageCode = language;
    if (sourceType) filter.sourceType = sourceType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const results = await OCRResult.find(filter)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select("-__v");

    const total = await OCRResult.countDocuments(filter);

    res.json({
      success: true,
      data: {
        results: results,
        pagination: {
          total: total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("History Fetch Error:", error);
    next(error);
  }
});

/**
 * GET /api/history/:id
 * Get specific OCR result
 */
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OCRResult.findById(id).select("-__v");

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "OCR result not found",
      });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("History Detail Error:", error);
    next(error);
  }
});

/**
 * DELETE /api/history/:id
 * Delete specific OCR result
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await OCRResult.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "OCR result not found",
      });
    }

    res.json({
      success: true,
      message: "OCR result deleted successfully",
    });
  } catch (error) {
    console.error("History Delete Error:", error);
    next(error);
  }
});

/**
 * GET /api/history/stats/summary
 * Get statistics summary
 */
router.get("/stats/summary", async (req, res, next) => {
  try {
    const total = await OCRResult.countDocuments();

    const byLanguage = await OCRResult.aggregate([
      {
        $group: {
          _id: "$detectedLanguage",
          count: { $sum: 1 },
        },
      },
    ]);

    const bySourceType = await OCRResult.aggregate([
      {
        $group: {
          _id: "$sourceType",
          count: { $sum: 1 },
        },
      },
    ]);

    const avgConfidence = await OCRResult.aggregate([
      {
        $group: {
          _id: null,
          avgConfidence: { $avg: "$confidenceScore" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        total: total,
        byLanguage: byLanguage,
        bySourceType: bySourceType,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
      },
    });
  } catch (error) {
    console.error("Stats Error:", error);
    next(error);
  }
});

module.exports = router;
