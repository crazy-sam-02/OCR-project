# ScriptSense AI Server (OCR)

This backend uses Hugging Face Inference to extract text from uploaded images and camera captures. PDF handling remains as before; if a PDF requires OCR it still uses the existing Python service fallback.

## Setup

1. Install dependencies:

```bash
cd server
npm install
```

2. Configure environment:

- Copy `.env.example` to `.env` and set your Hugging Face token.

```
HF_TOKEN=YOUR_HF_TOKEN
HF_MODEL=google/gemma-3-27b-it:featherless-ai
HF_PROVIDER=featherless-ai
```

3. Run the server:

```bash
npm run dev
```

The client calls:

- `POST /api/ocr/upload` for image files
- `POST /api/ocr/camera` for camera captures

Both endpoints now return extracted text produced by Hugging Face.

## Notes

- Confidence scores and bounding boxes are not provided by HF chat completion; the API returns plain text. The response includes `confidence: 0` and `boxes: []` for compatibility.
- If HF chat completion/provider fails, the server falls back to `HF_OCR_MODEL` (default `microsoft/trocr-base-printed`).
