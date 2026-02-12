import React from 'react';

const Loading = ({ message = 'Processing...' }) => {
    return (
        <div className="loading">
            <div className="spinner"></div>
            <p className="loading-text">{message}</p>
        </div>
    );
};

export default Loading;
