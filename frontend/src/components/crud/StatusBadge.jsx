import React from 'react';
import './StatusBadge.css';

const StatusBadge = ({ status, label, icon }) => {
    const variants = {
        active: 'success',
        inactive: 'muted',
        pending: 'warning',
        error: 'danger'
    };

    const variant = variants[status?.toLowerCase()] || 'success';

    return (
        <span className={`status-badge status-badge-${variant}`}>
            {icon && <span className="status-badge-icon">{icon}</span>}
            <span className="status-badge-label">{label || status}</span>
        </span>
    );
};

export default StatusBadge;
