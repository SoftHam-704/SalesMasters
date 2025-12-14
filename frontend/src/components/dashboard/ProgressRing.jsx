import React from 'react';

export const ProgressRing = ({ progress, label, sublabel }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <div className="progress-ring-container">
            <svg className="progress-ring-svg" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="10"
                />
                {/* Progress circle */}
                <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="none"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth="10"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    className="progress-ring-circle"
                />
                {/* Text */}
                <text x="60" y="52" textAnchor="middle" className="progress-value">
                    {progress}%
                </text>
                <text x="60" y="68" textAnchor="middle" className="progress-label">
                    {label}
                </text>
            </svg>
            {sublabel && (
                <p className="progress-sublabel">{sublabel}</p>
            )}
        </div>
    );
};
