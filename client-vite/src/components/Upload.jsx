import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ocrService } from '../services/api';
import Loading from './Loading.jsx';
import './Upload.css';

const Upload = ({ onResult }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [uploadType, setUploadType] = useState('image'); // 'image' or 'pdf'

    const onDrop = useCallback(async (acceptedFiles) => {
        if (acceptedFiles.length === 0) return;

        const file = acceptedFiles[0];
        setError(null);
        setLoading(true);

        try {
            let result;

            if (file.type === 'application/pdf') {
                result = await ocrService.uploadPDF(file);
            } else {
                result = await ocrService.uploadImage(file);
            }

            if (result.success) {
                onResult(result.data);
            } else {
                setError(result.error || 'Failed to process file');
            }
        } catch (err) {
            console.error('Upload error:', err);
            setError(err.response?.data?.error || 'Failed to upload file. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [onResult]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: uploadType === 'image'
            ? { 'image/*': ['.png', '.jpg', '.jpeg'] }
            : { 'application/pdf': ['.pdf'] },
        maxSize: 10 * 1024 * 1024, // 10MB
        multiple: false
    });

    return (
        <div className="upload-container fade-in">
            <div className="card">
                <h2 className="section-title">📤 Upload File</h2>
                <p className="section-description">
                    Upload an image or PDF file to extract text using AI-powered OCR
                </p>

                {/* File Type Selector */}
                <div className="upload-type-selector">
                    <button
                        className={`type-btn ${uploadType === 'image' ? 'active' : ''}`}
                        onClick={() => setUploadType('image')}
                    >
                        🖼️ Image
                    </button>
                    <button
                        className={`type-btn ${uploadType === 'pdf' ? 'active' : ''}`}
                        onClick={() => setUploadType('pdf')}
                    >
                        📄 PDF
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {loading ? (
                    <Loading message={`Processing ${uploadType}...`} />
                ) : (
                    <div
                        {...getRootProps()}
                        className={`dropzone ${isDragActive ? 'active' : ''}`}
                    >
                        <input {...getInputProps()} />
                        <div className="dropzone-content">
                            <div className="upload-icon">
                                {uploadType === 'image' ? '🖼️' : '📄'}
                            </div>
                            {isDragActive ? (
                                <p className="dropzone-text">Drop the file here...</p>
                            ) : (
                                <>
                                    <p className="dropzone-text">
                                        Drag & drop {uploadType === 'image' ? 'an image' : 'a PDF'} here
                                    </p>
                                    <p className="dropzone-subtext">or click to browse</p>
                                    <div className="file-info">
                                        <span className="badge badge-primary">
                                            {uploadType === 'image' ? 'JPG, PNG' : 'PDF'} • Max 10MB
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                <div className="upload-features">
                    <div className="feature-item">
                        <span className="feature-icon">✨</span>
                        <span className="feature-text">Multi-language support</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">🎯</span>
                        <span className="feature-text">High accuracy OCR</span>
                    </div>
                    <div className="feature-item">
                        <span className="feature-icon">⚡</span>
                        <span className="feature-text">Fast processing</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Upload;
