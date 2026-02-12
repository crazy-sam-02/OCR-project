import React, { useState, useEffect } from 'react';
import { historyService } from '../services/api';
import Loading from './Loading.jsx';
import './History.css';

const History = ({ onSelectResult }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState({ language: '', sourceType: '' });
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, [filter]);

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);

        try {
            const params = {};
            if (filter.language) params.language = filter.language;
            if (filter.sourceType) params.sourceType = filter.sourceType;

            const response = await historyService.getHistory(params);

            if (response.success) {
                setHistory(response.data.results);
            } else {
                setError('Failed to fetch history');
            }
        } catch (err) {
            console.error('History fetch error:', err);
            setError(err.response?.data?.error || 'Failed to load history');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await historyService.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (err) {
            console.error('Stats fetch error:', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this result?')) {
            return;
        }

        try {
            await historyService.deleteResult(id);
            setHistory(history.filter(item => item._id !== id));
            fetchStats(); // Refresh stats
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete result');
        }
    };

    const handleView = async (id) => {
        try {
            const response = await historyService.getResult(id);
            if (response.success) {
                onSelectResult(response.data);
            }
        } catch (err) {
            console.error('View error:', err);
            alert('Failed to load result');
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    const truncateText = (text, maxLength = 100) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    return (
        <div className="history-container fade-in">
            <div className="card">
                <h2 className="section-title">📚 OCR History</h2>
                <p className="section-description">
                    View and manage your previous OCR scans
                </p>

                {/* Statistics */}
                {stats && (
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total Scans</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🎯</div>
                            <div className="stat-content">
                                <div className="stat-value">
                                    {(stats.averageConfidence * 100).toFixed(1)}%
                                </div>
                                <div className="stat-label">Avg Confidence</div>
                            </div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-icon">🌍</div>
                            <div className="stat-content">
                                <div className="stat-value">{stats.byLanguage?.length || 0}</div>
                                <div className="stat-label">Languages</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="filters">
                    <select
                        className="filter-select"
                        value={filter.language}
                        onChange={(e) => setFilter({ ...filter, language: e.target.value })}
                    >
                        <option value="">All Languages</option>
                        <option value="en">English</option>
                        <option value="ta">Tamil</option>
                        <option value="hi">Hindi</option>
                    </select>

                    <select
                        className="filter-select"
                        value={filter.sourceType}
                        onChange={(e) => setFilter({ ...filter, sourceType: e.target.value })}
                    >
                        <option value="">All Sources</option>
                        <option value="image">Image Upload</option>
                        <option value="camera">Camera Capture</option>
                        <option value="pdf">PDF Upload</option>
                    </select>

                    <button className="btn btn-outline" onClick={fetchHistory}>
                        <span>🔄</span>
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}

                {loading ? (
                    <Loading message="Loading history..." />
                ) : history.length === 0 ? (
                    <div className="history-empty">
                        <div className="empty-icon">📭</div>
                        <p className="empty-text">No history found</p>
                        <p className="empty-subtext">Start scanning to build your history</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.map((item) => (
                            <div key={item._id} className="history-item">
                                <div className="history-header">
                                    <div className="history-meta">
                                        <span className="badge badge-primary">
                                            {item.detectedLanguage}
                                        </span>
                                        <span className="badge badge-success">
                                            {item.sourceType}
                                        </span>
                                        {item.confidenceScore && (
                                            <span className="confidence-badge">
                                                {(item.confidenceScore * 100).toFixed(0)}%
                                            </span>
                                        )}
                                    </div>
                                    <div className="history-date">
                                        {formatDate(item.timestamp)}
                                    </div>
                                </div>

                                <div className="history-content">
                                    <p className="history-text">
                                        {truncateText(item.extractedText)}
                                    </p>
                                </div>

                                <div className="history-footer">
                                    <div className="history-info">
                                        <span className="info-item">
                                            📄 {item.fileName}
                                        </span>
                                        {item.metadata?.processingTime && (
                                            <span className="info-item">
                                                ⏱️ {item.metadata.processingTime}ms
                                            </span>
                                        )}
                                    </div>
                                    <div className="history-actions">
                                        <button
                                            className="btn-small btn-primary"
                                            onClick={() => handleView(item._id)}
                                        >
                                            👁️ View
                                        </button>
                                        <button
                                            className="btn-small btn-danger"
                                            onClick={() => handleDelete(item._id)}
                                        >
                                            🗑️ Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
