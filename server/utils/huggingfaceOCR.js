const fs = require("fs").promises;

async function getClient() {
  const token = process.env.HF_TOKEN;
  if (!token) {
    throw new Error("HF_TOKEN is not set in environment");
  }
  const mod = await import("@huggingface/inference");
  const { InferenceClient } = mod;
  return new InferenceClient(token);
}

/**
 * Extract visible text from an image using Hugging Face chatCompletion.
 * Uses a data URL for local files.
 * @param {string} filePath - Absolute path to the image file
 * @param {string} mimeType - e.g. 'image/png', 'image/jpeg'
 * @returns {Promise<{ text: string }>} - Extracted text
 */
async function extractTextFromImageHF(filePath, mimeType) {
  const client = await getClient();
  const buffer = await fs.readFile(filePath);
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const configuredModel =
    process.env.HF_MODEL || "google/gemma-3-27b-it:featherless-ai";

  // Support both formats:
  // 1) HF_MODEL=org/model and HF_PROVIDER=provider
  // 2) HF_MODEL=org/model:provider
  let model = configuredModel;
  let provider = process.env.HF_PROVIDER;
  if (configuredModel.includes(":")) {
    const [modelPart, providerPart] = configuredModel.split(":");
    model = modelPart;
    if (!provider && providerPart) {
      provider = providerPart;
    }
  }

  const request = {
    model,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Extract all visible text from this image. Preserve natural reading order and spacing. Return only plain text with no extra commentary.",
          },
          {
            type: "image_url",
            image_url: { url: dataUrl },
          },
        ],
      },
    ],
  };

  if (provider) {
    request.provider = provider;
  }

  try {
    const chatCompletion = await client.chatCompletion(request);

    // Robustly read response shapes: string or structured array
    const message = chatCompletion?.choices?.[0]?.message;
    let text = "";

    if (typeof message?.content === "string") {
      text = message.content;
    } else if (Array.isArray(message?.content)) {
      const textItem = message.content.find(
        (c) => c?.type === "text" && c?.text,
      );
      text = textItem?.text || "";
    } else if (typeof message === "string") {
      text = message;
    }

    return { text: (text || "").trim() };
  } catch (chatErr) {
    // Fallback for provider/model chat issues: OCR model endpoint
    try {
      const imageToText = await client.imageToText({
        model: process.env.HF_OCR_MODEL || "microsoft/trocr-base-printed",
        data: buffer,
      });

      const fallbackText = (imageToText?.generated_text || "").trim();
      return { text: fallbackText };
    } catch (ocrErr) {
      const chatMessage = chatErr?.message || "chatCompletion failed";
      const ocrMessage = ocrErr?.message || "imageToText fallback failed";
      throw new Error(
        `Hugging Face OCR failed. Chat error: ${chatMessage}. Fallback error: ${ocrMessage}`,
      );
    }
  }
}

module.exports = {
  extractTextFromImageHF,
};
