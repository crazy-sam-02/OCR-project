import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { ocrService } from "../services/api";
import Loading from "./Loading.jsx";
import "./Camera.css";

const Camera = ({ onResult }) => {
  const webcamRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
  };

  const startCamera = () => {
    setCameraActive(true);
    setCapturedImage(null);
    setError(null);
  };

  const stopCamera = () => {
    setCameraActive(false);
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedImage(imageSrc);
    setCameraActive(false);
  }, [webcamRef]);

  const processImage = async () => {
    if (!capturedImage) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], "camera-capture.jpg", {
        type: "image/jpeg",
      });

      const result = await ocrService.captureCamera(file);

      if (result.success) {
        onResult(result.data);
        setCapturedImage(null);
      } else {
        setError(result.error || "Failed to process image");
      }
    } catch (err) {
      console.error("Camera OCR error:", err);
      setError(
        err.response?.data?.error ||
          "Failed to process image. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setCameraActive(true);
  };

  return (
    <div className="camera-container fade-in">
      <div className="card">
        <h2 className="section-title">📸 Camera Capture</h2>
        <p className="section-description">
          Capture an image using your device camera for instant OCR processing
        </p>

        {error && (
          <div className="alert alert-error">
            <span>⚠️</span>
            {error}
          </div>
        )}

        {loading ? (
          <Loading message="Processing captured image..." />
        ) : (
          <>
            <div className="camera-preview">
              {!cameraActive && !capturedImage && (
                <div className="camera-placeholder">
                  <div className="camera-icon">📷</div>
                  <p className="camera-text">Camera is ready</p>
                  <button className="btn btn-primary" onClick={startCamera}>
                    <span>📸</span>
                    Start Camera
                  </button>
                </div>
              )}

              {cameraActive && (
                <div className="webcam-wrapper">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    className="webcam"
                  />
                  <div className="camera-controls">
                    <button className="btn btn-secondary" onClick={stopCamera}>
                      <span>❌</span>
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary capture-btn"
                      onClick={capture}
                    >
                      <span>📸</span>
                      Capture
                    </button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="captured-preview">
                  <img
                    src={capturedImage}
                    alt="Captured"
                    className="captured-image"
                  />
                  <div className="camera-controls">
                    <button className="btn btn-outline" onClick={retake}>
                      <span>🔄</span>
                      Retake
                    </button>
                    <button className="btn btn-success" onClick={processImage}>
                      <span>✨</span>
                      Process Image
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="camera-tips">
              <h3 className="tips-title">📋 Tips for Best Results</h3>
              <ul className="tips-list">
                <li>✓ Ensure good lighting conditions</li>
                <li>✓ Hold the camera steady</li>
                <li>✓ Keep text clearly visible and in focus</li>
                <li>✓ Avoid shadows and glare</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Camera;
