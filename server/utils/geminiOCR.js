const fs = require("fs").promises;
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set in environment");
  }
  const genAI = new GoogleGenerativeAI(apiKey);
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  return genAI.getGenerativeModel({ model: modelName });
};

/**
 * Extract visible text from an image using Gemini
 * @param {string} filePath - Absolute path to the uploaded image file
 * @param {string} mimeType - Image MIME type (e.g., 'image/png', 'image/jpeg')
 * @returns {Promise<{ text: string }>} - Extracted text
 */
async function extractTextFromImage(filePath, mimeType) {
  const model = getModel();

  const imageBuffer = await fs.readFile(filePath);
  const base64 = imageBuffer.toString("base64");

  const prompt = [
    {
      text: "Extract the visible text from this image. Preserve natural reading order and spacing. Return only the plain text with no additional commentary.",
    },
    { inlineData: { mimeType, data: base64 } },
  ];

  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response?.text?.() || "";

  return { text };
}

module.exports = {
  extractTextFromImage,
};
