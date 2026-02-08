import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import './GridCadPadraoV2.css';

const GridCadPadraoV2 = ({
    title,
    subtitle,
    icon: Icon,
    data = [],
    columns = [], // Optional column definition for table mode
    titleKey = 'nome', // Field to use as main title (Card mode)
    subtitleKey = null, // Field to use as subtitle (Card mode)
    statusKey = 'ativo', // Field for status
    onNew,
    onEdit,
    onDelete,
    headerActions // Novo prop para botões extras no header
}) => {

    // RENDER TABLE MODE
    const renderTable = () => {
        // Prepare grid template columns string
        // If width is provided in column def, use it, otherwise 1fr. 
        // Last columns are auto for actions.
        const gridTemplateColumns = [
            ...columns.map(c => c.width || '1fr'),
            '100px' // Actions column
        ].join(' ');

        return (
            <div className="gridv2-list">
                {/* Header Row */}
                <div className="gridv2-row header-row" style={{ gridTemplateColumns, padding: '0.75rem 1.5rem', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                    {columns.map((col, idx) => (
                        <div
                            key={col.key || idx}
                            style={{ textAlign: col.align || 'left' }}
                            className="text-xs font-bold text-gray-500 uppercase tracking-wider"
                        >
                            {col.label}
                        </div>
                    ))}
                    <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Ações
                    </div>
                </div>

                {/* Data Rows */}
                {data.map((item, rowIdx) => (
                    <motion.div
                        key={item.id || rowIdx}
                        className="gridv2-row"
                        whileHover={{ scale: 1.005 }}
                        style={{ gridTemplateColumns }}
                    >
                        {columns.map((col, colIdx) => (
                            <div
                                key={`${rowIdx}-${colIdx}`}
                                style={{ textAlign: col.align || 'left' }}
                                className={`text-sm text-gray-700 ${col.isId ? 'font-mono text-xs text-gray-400' : ''}`}
                            >
                                {col.render ? col.render(item) : item[col.key]}
                            </div>
                        ))}

                        {/* Actions */}
                        <div className="flex justify-center gap-2">
                            {onEdit && (
                                <button onClick={() => onEdit(item)} className="p-1 hover:text-blue-600 transition-colors" title="Editar">
                                    <Pencil size={16} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={() => onDelete(item)} className="p-1 hover:text-red-600 transition-colors" title="Excluir">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}

                {data.length === 0 && (
                    <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">
                        Nenhum registro encontrado
                    </div>
                )}
            </div>
        );
    };

    // RENDER CARD MODE (Existing)
    const renderCards = () => (
        <div className="gridv2-list">
            {data.map((item, index) => {
                const mainTitle = item[titleKey] || item.descricao || item.nome || `Item ${item.id}`;
                let subTitle = null;
                if (subtitleKey) {
                    subTitle = item[subtitleKey];
                } else if (item.cidade || item.uf) {
                    subTitle = `${item.cidade || ''} / ${item.uf || ''}`;
                }

                return (
                    <motion.div
                        key={index}
                        className="gridv2-row card-mode"
                        whileHover={{ scale: 1.01 }}
                    >
                        <div className="avatar">
                            {mainTitle?.charAt(0) || '?'}
                        </div>

                        <div className="info">
                            <strong>{mainTitle}</strong>
                            {subTitle && (
                                <span>{subTitle}</span>
                            )}
                        </div>

                        <div className="status">
                            {item[statusKey] !== undefined && (
                                <span className={item[statusKey] ? 'badge ativo' : 'badge inativo'}>
                                    {item[statusKey] ? 'Ativo' : 'Inativo'}
                                </span>
                            )}
                        </div>

                        <div className="actions">
                            {onEdit && (
                                <button onClick={() => onEdit(item)}>
                                    <Pencil size={16} />
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={() => onDelete(item)}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );

    return (
        <div className="gridv2-container">
            {/* Header */}
            <div className="gridv2-header">
                <div>
                    <h1>
                        {Icon && <Icon className="icon" />}
                        {title}
                        {headerActions && <div className="ml-4 inline-flex items-center">{headerActions}</div>}
                    </h1>
                    {subtitle && <p>{subtitle}</p>}
                </div>

                {onNew && (
                    <Button className="btn-new" onClick={onNew}>
                        <Plus size={16} />
                        Novo
                    </Button>
                )}
            </div>

            {/* List Content */}
            {columns && columns.length > 0 ? renderTable() : renderCards()}
        </div>
    );
};

export default GridCadPadraoV2;
