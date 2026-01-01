import React from "react";
import "./IAOrderButton.css";

export default function IAOrderButton({ onClick, disabled }) {
    return (
        <button
            type="button"
            className="ia-btn-light"
            onClick={onClick}
            disabled={disabled}
            style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
        >
            <span className="ia-icon">✨</span>
            <span className="ia-text">F2 - Ítens com IA</span>
        </button>
    );
}
