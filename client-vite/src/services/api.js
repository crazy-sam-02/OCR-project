import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds for OCR processing
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      console.error("Network Error:", error.message);
    } else {
      console.error("Error:", error.message);
    }
    return Promise.reject(error);
  },
);

export const ocrService = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/api/ocr/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  captureCamera: async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post("/api/ocr/camera", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  uploadPDF: async (file) => {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await api.post("/api/ocr/pdf", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },
};

export const ttsService = {
  generateAudio: async (text, language, resultId) => {
    const response = await api.post("/api/tts/generate", {
      text,
      language,
      resultId,
    });

    return response.data;
  },

  getAudioUrl: (filename) => {
    return `${API_URL}/uploads/${filename}`;
  },
};

export const exportService = {
  downloadPDF: async (text, language, fileName) => {
    const response = await api.post(
      "/api/export/pdf",
      {
        text,
        language,
        fileName,
      },
      {
        responseType: "blob",
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "extracted-text.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();

    return response.data;
  },
};

export const historyService = {
  getHistory: async (params = {}) => {
    const response = await api.get("/api/history", { params });
    return response.data;
  },

  getResult: async (id) => {
    const response = await api.get(`/api/history/${id}`);
    return response.data;
  },

  deleteResult: async (id) => {
    const response = await api.delete(`/api/history/${id}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get("/api/history/stats/summary");
    return response.data;
  },
};

export const healthCheck = async () => {
  const response = await api.get("/health");
  return response.data;
};

export default api;
