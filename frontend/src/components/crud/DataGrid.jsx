import React from 'react';
import { MoreVertical } from 'lucide-react';
import StatusBadge from './StatusBadge';
import './DataGrid.css';

const DataGrid = ({ columns, data, onRowClick, actions, emptyMessage = "Nenhum registro encontrado" }) => {
    const [activeMenu, setActiveMenu] = React.useState(null);

    const handleMenuToggle = (id) => {
        setActiveMenu(activeMenu === id ? null : id);
    };

    if (!data || data.length === 0) {
        return (
            <div className="data-grid-empty">
                <p>{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="data-grid-container">
            <table className="data-grid">
                <thead>
                    <tr>
                        {columns.map((col, idx) => (
                            <th key={idx} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                        {actions && <th style={{ width: '60px' }}></th>}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIdx) => (
                        <tr
                            key={row.id || rowIdx}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={onRowClick ? 'clickable' : ''}
                        >
                            {columns.map((col, colIdx) => (
                                <td key={colIdx}>
                                    {col.render ? col.render(row[col.field], row) : row[col.field]}
                                </td>
                            ))}
                            {actions && (
                                <td className="actions-cell">
                                    <button
                                        className="btn-menu"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMenuToggle(row.id);
                                        }}
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {activeMenu === row.id && (
                                        <div className="popup-menu">
                                            {actions.map((action, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        action.onClick(row);
                                                        setActiveMenu(null);
                                                    }}
                                                    className={action.variant === 'danger' ? 'delete-option' : ''}
                                                >
                                                    {action.icon && <span className="menu-icon">{action.icon}</span>}
                                                    {action.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataGrid;
