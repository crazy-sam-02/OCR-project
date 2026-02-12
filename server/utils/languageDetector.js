const franc = require("franc");

const languageMap = {
  eng: { name: "English", code: "en" },
  tam: { name: "Tamil", code: "ta" },
  hin: { name: "Hindi", code: "hi" },
  und: { name: "Unknown", code: "unknown" },
};

/**
 * Detect language from text
 * @param {string} text - Text to analyze
 * @returns {object} - Language information
 */
const detectLanguage = (text) => {
  if (!text || text.trim().length === 0) {
    return {
      name: "Unknown",
      code: "unknown",
      confidence: 0,
    };
  }

  try {
    const detectedCode = franc(text, { minLength: 3 });

    const language = languageMap[detectedCode] || languageMap["und"];

    return {
      name: language.name,
      code: language.code,
      confidence: detectedCode !== "und" ? 0.8 : 0.3,
    };
  } catch (error) {
    console.error("Language detection error:", error);
    return {
      name: "Unknown",
      code: "unknown",
      confidence: 0,
    };
  }
};

/**
 * Get language name from code
 * @param {string} code - Language code
 * @returns {string} - Language name
 */
const getLanguageName = (code) => {
  const entry = Object.values(languageMap).find((lang) => lang.code === code);
  return entry ? entry.name : "Unknown";
};

module.exports = {
  detectLanguage,
  getLanguageName,
};
