const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

/**
 * POST /api/export/pdf
 * Export extracted text as PDF
 */
router.post("/pdf", async (req, res, next) => {
  try {
    const { text, language, fileName } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: 50,
        bottom: 50,
        left: 50,
        right: 50,
      },
    });

    const pdfFileName = fileName || `extracted-text-${Date.now()}.pdf`;
    const pdfPath = path.join(__dirname, "../uploads", pdfFileName);

    const writeStream = fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("ScriptSense AI - Extracted Text", {
        align: "center",
      });

    doc.moveDown();

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Language: ${language || "Unknown"}`, {
        align: "left",
      })
      .text(`Date: ${new Date().toLocaleString()}`, {
        align: "left",
      });

    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    doc.fontSize(12).font("Helvetica").text(text, {
      align: "left",
      lineGap: 5,
    });

    doc.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    res.download(pdfPath, pdfFileName, (err) => {
      if (err) {
        console.error("PDF download error:", err);
        next(err);
      }

      setTimeout(() => {
        fs.unlink(pdfPath, (unlinkErr) => {
          if (unlinkErr) console.error("Error deleting temp PDF:", unlinkErr);
        });
      }, 5000);
    });
  } catch (error) {
    console.error("PDF Export Error:", error);
    next(error);
  }
});

module.exports = router;
