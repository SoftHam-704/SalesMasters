import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, RefreshCw, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import './GridCadPadrao.css';

/**
 * GridCadPadrao - Componente de Grid Padrão para Cadastros
 * Equivalente visual modernizado para listagens de dados
 * 
 * @param {Object} props
 * @param {Array} props.data - Array de registros
 * @param {Boolean} props.loading - Estado de carregamento
 * @param {Array} props.columns - Definição das colunas [{ key, label, width, align, render, isId }]
 * @param {Function} props.onNew - Callback para novo registro
 * @param {Function} props.onEdit - Callback para editar
 * @param {Function} props.onDelete - Callback para deletar
 * @param {String} props.searchPlaceholder - Placeholder do campo de busca
 * @param {String} props.searchValue - Valor da busca
 * @param {Function} props.onSearchChange - Callback de mudança de busca
 * @param {Object} props.pagination - { page, limit, total, totalPages }
 * @param {Function} props.onPageChange - Callback de mudança de página
 * @param {String} props.title - Título da página
 * @param {String} props.subtitle - Subtítulo
 * @param {Component} props.icon - Ícone LucideReact
 * @param {String} props.newButtonLabel - Label do botão "Novo"
 * @param {Boolean} props.showActions - Mostrar coluna de ações (default: true)
 * @param {Function} props.onRefresh - Callback para refresh
 */
const GridCadPadrao = ({
    data = [],
    loading = false,
    columns = [],
    onNew,
    onEdit,
    onDelete,
    searchPlaceholder = 'Buscar...',
    searchValue = '',
    onSearchChange,
    pagination = { page: 1, limit: 10, total: 0, totalPages: 1 },
    onPageChange,
    title = 'Cadastro',
    subtitle = '',
    icon: Icon,
    newButtonLabel = 'Novo',
    showActions = true,
    onRefresh,
    extraControls = null
}) => {
    // Formata ID com 5 dígitos
    const formatId = (value) => {
        if (value === null || value === undefined || value === '') return '—';
        return String(value).padStart(5, '0');
    };

    // Renderiza célula com base na configuração da coluna
    const renderCell = (row, column) => {
        if (column.render) {
            return column.render(row);
        }

        const value = row[column.key];

        // Se for coluna de ID, formatar com 5 dígitos
        if (column.isId) {
            return formatId(value);
        }

        return value || '—';
    };

    return (
        <div className="grid-cad-padrao">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid-header"
            >
                <div className="header-left">
                    <h1 className="grid-title">
                        {Icon && <Icon className="title-icon" />}
                        {title}
                    </h1>
                    {subtitle && <p className="grid-subtitle">{subtitle}</p>}
                </div>

                {onNew && (
                    <Button
                        onClick={onNew}
                        className="btn-new-record"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {newButtonLabel}
                    </Button>
                )}
            </motion.div>

            {/* Filter Bar */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid-filter-bar"
            >
                <div className="search-wrapper">
                    <Search className="search-icon" />
                    <Input
                        placeholder={searchPlaceholder}
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        className="search-input"
                    />
                </div>

                {extraControls && (
                    <div className="extra-controls">
                        {extraControls}
                    </div>
                )}

                {onRefresh && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="btn-refresh"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                )}
            </motion.div>

            {/* Grid Card */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="grid-card"
            >
                <Table>
                    <TableHeader>
                        <TableRow className="grid-header-row">
                            {columns.map((column, index) => (
                                <TableHead
                                    key={column.key}
                                    className={`grid-th ${column.align === 'right' ? 'text-right' : ''}`}
                                    style={{ width: column.width }}
                                >
                                    {column.label}
                                </TableHead>
                            ))}
                            {showActions && (
                                <TableHead className="grid-th text-right" style={{ width: '120px' }}>
                                    Ações
                                </TableHead>
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                                    Carregando dados...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={columns.length + (showActions ? 1 : 0)} className="h-24 text-center text-muted-foreground">
                                    Nenhum registro encontrado.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={row.id || rowIndex}
                                    className="grid-body-row"
                                >
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.key}
                                            className={`grid-td ${column.isId ? 'id-cell' : ''} ${column.cellClass || ''}`}
                                        >
                                            {renderCell(row, column)}
                                        </TableCell>
                                    ))}
                                    {showActions && (
                                        <TableCell className="grid-td actions-cell">
                                            <div className="action-buttons">
                                                {onEdit && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onEdit(row)}
                                                        className="btn-action btn-edit"
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {onDelete && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onDelete(row)}
                                                        className="btn-action btn-delete"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination */}
                <div className="grid-pagination">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(pagination.page - 1)}
                        disabled={pagination.page <= 1 || loading}
                    >
                        Anterior
                    </Button>
                    <div className="pagination-info">
                        Página {pagination.page} de {pagination.totalPages}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange?.(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages || loading}
                    >
                        Próxima
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

export default GridCadPadrao;
