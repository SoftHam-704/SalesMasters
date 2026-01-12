import React from 'react';

export const ProgressRing = ({ progress, label, sublabel, size = 120, strokeWidth = 10 }) => {
    const radius = (size / 2) - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const center = size / 2;

    return (
        <div className="progress-ring-container">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {/* Background circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth={strokeWidth}
                />
                {/* Progress circle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="hsl(160, 84%, 39%)"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    className="progress-ring-circle"
                />
                {/* Text */}
                <text x={center} y={center - 3} textAnchor="middle" className="progress-value" style={{ fontSize: size * 0.22, fill: '#1e293b', fontWeight: 900 }}>
                    {Math.round(progress)}%
                </text>
                <text x={center} y={center + (size * 0.15)} textAnchor="middle" className="progress-label" style={{ fontSize: size * 0.08, fill: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    {label}
                </text>
            </svg>
            {sublabel && (
                <p className="progress-sublabel mt-1 text-[10px] text-slate-400">{sublabel}</p>
            )}
        </div>
    );
};
