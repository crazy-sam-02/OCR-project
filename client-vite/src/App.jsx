import React, { useState } from 'react';
import Upload from './components/Upload.jsx';
import Camera from './components/Camera.jsx';
import TextDisplay from './components/TextDisplay.jsx';
import History from './components/History.jsx';
import './App.css';

function App() {
    const [activeTab, setActiveTab] = useState('upload');
    const [currentResult, setCurrentResult] = useState(null);

    const handleResult = (result) => {
        setCurrentResult(result);
        // Scroll to result section
        setTimeout(() => {
            const resultSection = document.getElementById('result-section');
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const handleHistorySelect = (result) => {
        setCurrentResult({
            id: result._id,
            text: result.extractedText,
            language: result.detectedLanguage,
            languageCode: result.languageCode,
            confidence: result.confidenceScore,
            boxes: result.boundingBoxes,
            processedImage: result.processedImagePath,
            processingTime: result.metadata?.processingTime,
            pageCount: result.metadata?.pageCount
        });
        setActiveTab('upload');
        setTimeout(() => {
            const resultSection = document.getElementById('result-section');
            if (resultSection) {
                resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    <div className="logo">
                        <div className="logo-icon">SS</div>
                        <div className="logo-text">
                            <h1>ScriptSense AI</h1>
                            <p>Multilingual OCR Platform</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <span className="badge badge-success">
                            ✨ AI-Powered
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container">
                {/* Tabs */}
                <div className="tabs">
                    <button
                        className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <span>📤</span>
                        Upload
                    </button>
                    <button
                        className={`tab ${activeTab === 'camera' ? 'active' : ''}`}
                        onClick={() => setActiveTab('camera')}
                    >
                        <span>📸</span>
                        Camera
                    </button>
                    <button
                        className={`tab ${activeTab === 'history' ? 'active' : ''}`}
                        onClick={() => setActiveTab('history')}
                    >
                        <span>📚</span>
                        History
                    </button>
                </div>

                {/* Tab Content */}
                <div className="tab-content">
                    {activeTab === 'upload' && <Upload onResult={handleResult} />}
                    {activeTab === 'camera' && <Camera onResult={handleResult} />}
                    {activeTab === 'history' && <History onSelectResult={handleHistorySelect} />}
                </div>

                {/* Result Display */}
                {(activeTab === 'upload' || activeTab === 'camera') && (
                    <div id="result-section">
                        <TextDisplay result={currentResult} />
                    </div>
                )}

                {/* Footer Info */}
                <div className="footer-info">
                    <div className="card">
                        <div className="info-grid">
                            <div className="info-item">
                                <div className="info-icon">🌍</div>
                                <div className="info-content">
                                    <h3>Multi-Language Support</h3>
                                    <p>Extract text in English, Tamil, and Hindi with high accuracy</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon">🎯</div>
                                <div className="info-content">
                                    <h3>Advanced OCR</h3>
                                    <p>Powered by PaddleOCR for handwritten and printed text</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon">🔊</div>
                                <div className="info-content">
                                    <h3>Text-to-Speech</h3>
                                    <p>Convert extracted text to audio in multiple languages</p>
                                </div>
                            </div>
                            <div className="info-item">
                                <div className="info-icon">📥</div>
                                <div className="info-content">
                                    <h3>Export Options</h3>
                                    <p>Download as PDF or audio file for easy sharing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="footer-content">
                    <p>© 2026 ScriptSense AI. Built with MERN Stack & PaddleOCR</p>
                    <div className="footer-links">
                        <span>🚀 Production Ready</span>
                        <span>•</span>
                        <span>🔒 Secure</span>
                        <span>•</span>
                        <span>⚡ Fast</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
