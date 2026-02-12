const fs = require("fs").promises;
const path = require("path");
const pdfParse = require("pdf-parse");
const { convert } = require("pdf-poppler");

/**
 * Check if PDF has selectable text
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<boolean>}
 */
const hasSelectableText = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return data.text && data.text.trim().length > 50;
  } catch (error) {
    console.error("Error checking PDF text:", error);
    return false;
  }
};

/**
 * Extract text from selectable PDF
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<object>}
 */
const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer);

    return {
      text: data.text,
      pageCount: data.numpages,
      info: data.info,
    };
  } catch (error) {
    console.error("Error extracting PDF text:", error);
    throw new Error("Failed to extract text from PDF");
  }
};

/**
 * Convert PDF pages to images
 * @param {string} filePath - Path to PDF file
 * @param {string} outputDir - Directory to save images
 * @returns {Promise<string[]>} - Array of image paths
 */
const convertPDFToImages = async (filePath, outputDir) => {
  try {
    await fs.mkdir(outputDir, { recursive: true });

    const opts = {
      format: "png",
      out_dir: outputDir,
      out_prefix: path.basename(filePath, path.extname(filePath)),
      page: null, // Convert all pages
    };

    await convert(filePath, opts);

    const files = await fs.readdir(outputDir);
    const imageFiles = files
      .filter((file) => file.endsWith(".png"))
      .map((file) => path.join(outputDir, file))
      .sort();

    return imageFiles;
  } catch (error) {
    console.error("Error converting PDF to images:", error);
    throw new Error("Failed to convert PDF to images");
  }
};

/**
 * Process PDF file - extract text or convert to images
 * @param {string} filePath - Path to PDF file
 * @returns {Promise<object>}
 */
const processPDF = async (filePath) => {
  try {
    const isSelectable = await hasSelectableText(filePath);

    if (isSelectable) {
      const result = await extractTextFromPDF(filePath);
      return {
        type: "selectable",
        text: result.text,
        pageCount: result.pageCount,
        requiresOCR: false,
      };
    } else {
      const outputDir = path.join(path.dirname(filePath), "pdf-images");
      const imagePaths = await convertPDFToImages(filePath, outputDir);

      return {
        type: "scanned",
        imagePaths: imagePaths,
        pageCount: imagePaths.length,
        requiresOCR: true,
      };
    }
  } catch (error) {
    console.error("Error processing PDF:", error);
    throw error;
  }
};

/**
 * Clean up temporary files
 * @param {string} dirPath - Directory to clean
 */
const cleanupTempFiles = async (dirPath) => {
  try {
    const files = await fs.readdir(dirPath);
    await Promise.all(files.map((file) => fs.unlink(path.join(dirPath, file))));
    await fs.rmdir(dirPath);
  } catch (error) {
    console.error("Error cleaning up temp files:", error);
  }
};

module.exports = {
  hasSelectableText,
  extractTextFromPDF,
  convertPDFToImages,
  processPDF,
  cleanupTempFiles,
};
