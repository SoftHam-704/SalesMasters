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
    columns = [], // Optional column definition for helper
    titleKey = 'nome', // Field to use as main title
    subtitleKey = null, // Field to use as subtitle
    statusKey = 'ativo', // Field for status
    onNew,
    onEdit,
    onDelete,
}) => {
    return (
        <div className="gridv2-container">
            {/* Header */}
            <div className="gridv2-header">
                <div>
                    <h1>
                        {Icon && <Icon className="icon" />}
                        {title}
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

            {/* List */}
            <div className="gridv2-list">
                {data.map((item, index) => {
                    // Determine main title
                    const mainTitle = item[titleKey] || item.descricao || item.nome || `Item ${item.id}`;

                    // Determine subtitle
                    let subTitle = null;
                    if (subtitleKey) {
                        subTitle = item[subtitleKey];
                    } else if (item.cidade || item.uf) {
                        subTitle = `${item.cidade || ''} / ${item.uf || ''}`;
                    }

                    return (
                        <motion.div
                            key={index}
                            className="gridv2-row"
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
        </div>
    );
};

export default GridCadPadraoV2;
