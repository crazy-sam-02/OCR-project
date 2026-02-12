import React, { useState } from 'react';
import { ttsService, exportService } from '../services/api';
import Loading from './Loading.jsx';
import './TextDisplay.css';

const TextDisplay = ({ result }) => {
    const [audioUrl, setAudioUrl] = useState(null);
    const [loadingAudio, setLoadingAudio] = useState(false);
    const [loadingPDF, setLoadingPDF] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    if (!result) {
        return (
            <div className="text-display-empty">
                <div className="empty-icon">📝</div>
                <p className="empty-text">No text extracted yet</p>
                <p className="empty-subtext">Upload an image, capture from camera, or upload a PDF to get started</p>
            </div>
        );
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(result.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleGenerateTTS = async () => {
        setLoadingAudio(true);
        setError(null);

        try {
            const response = await ttsService.generateAudio(
                result.text,
                result.languageCode || 'en',
                result.id
            );

            if (response.success) {
                const fullAudioUrl = `${API_URL}${response.data.audioUrl}`;
                setAudioUrl(fullAudioUrl);
            } else {
                setError('Failed to generate audio');
            }
        } catch (err) {
            console.error('TTS error:', err);
            setError(err.response?.data?.error || 'Failed to generate audio');
        } finally {
            setLoadingAudio(false);
        }
    };

    const handleDownloadPDF = async () => {
        setLoadingPDF(true);
        setError(null);

        try {
            await exportService.downloadPDF(
                result.text,
                result.language || 'Unknown',
                `extracted-text-${Date.now()}.pdf`
            );
        } catch (err) {
            console.error('PDF export error:', err);
            setError(err.response?.data?.error || 'Failed to export PDF');
        } finally {
            setLoadingPDF(false);
        }
    };

    return (
        <div className="text-display-container fade-in">
            <div className="card">
                <div className="display-header">
                    <h2 className="section-title">📄 Extracted Text</h2>
                    <div className="result-badges">
                        <span className="badge badge-success">
                            {result.language || 'Unknown Language'}
                        </span>
                        {result.confidence && (
                            <span className="badge badge-primary">
                                {(result.confidence * 100).toFixed(1)}% Confidence
                            </span>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {/* Processed Image */}
                {result.processedImage && (
                    <div className="processed-image-section">
                        <h3 className="subsection-title">🖼️ Processed Image with Bounding Boxes</h3>
                        <div className="image-wrapper">
                            <img
                                src={`${API_URL}${result.processedImage}`}
                                alt="Processed with bounding boxes"
                                className="processed-image"
                            />
                        </div>
                    </div>
                )}

                {/* Extracted Text */}
                <div className="text-section">
                    <div className="text-header">
                        <h3 className="subsection-title">📝 Text Content</h3>
                        <button
                            className={`btn-icon ${copied ? 'copied' : ''}`}
                            onClick={handleCopy}
                            title="Copy to clipboard"
                        >
                            {copied ? '✓' : '📋'}
                        </button>
                    </div>
                    <div className="text-content">
                        <textarea
                            className="text-area"
                            value={result.text}
                            readOnly
                            rows={10}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                    <button
                        className="btn btn-primary"
                        onClick={handleGenerateTTS}
                        disabled={loadingAudio}
                    >
                        {loadingAudio ? (
                            <>
                                <span className="spinner-small"></span>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span>🔊</span>
                                Text-to-Speech
                            </>
                        )}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={handleDownloadPDF}
                        disabled={loadingPDF}
                    >
                        {loadingPDF ? (
                            <>
                                <span className="spinner-small"></span>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                Download PDF
                            </>
                        )}
                    </button>
                </div>

                {/* Audio Player */}
                {audioUrl && (
                    <div className="audio-section">
                        <h3 className="subsection-title">🎵 Generated Audio</h3>
                        <audio controls className="audio-player" src={audioUrl}>
                            Your browser does not support the audio element.
                        </audio>
                        <a
                            href={audioUrl}
                            download
                            className="btn btn-outline mt-2"
                        >
                            <span>💾</span>
                            Download Audio
                        </a>
                    </div>
                )}

                {/* Metadata */}
                {result.processingTime && (
                    <div className="metadata-section">
                        <div className="metadata-item">
                            <span className="metadata-label">⏱️ Processing Time:</span>
                            <span className="metadata-value">{result.processingTime}ms</span>
                        </div>
                        {result.pageCount && (
                            <div className="metadata-item">
                                <span className="metadata-label">📄 Pages:</span>
                                <span className="metadata-value">{result.pageCount}</span>
                            </div>
                        )}
                        {result.pdfType && (
                            <div className="metadata-item">
                                <span className="metadata-label">📋 PDF Type:</span>
                                <span className="metadata-value">{result.pdfType}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextDisplay;
