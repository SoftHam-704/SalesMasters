import { useState, useEffect } from 'react';
import './OrderFilters.css';

const SITUACOES = [
    { value: 'Z', label: 'Todos' },
    { value: 'P', label: 'Pedido' },
    { value: 'C', label: 'Cotação pendente' },
    { value: 'A', label: 'Cotação confirmada' },
    { value: 'F', label: 'Faturado' },
    { value: 'G', label: 'Garantia' },
    { value: 'N', label: 'Notificação' },
    { value: 'E', label: 'Excluído' }
];

export default function OrderFilters({ filters, onFiltersChange }) {
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/orders/clients');
            const data = await response.json();

            if (data.success) {
                setClients(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        }
    };

    const handleClearClient = () => {
        onFiltersChange({ ...filters, cliente: null });
    };

    const handleSearch = () => {
        onFiltersChange({ ...filters, pesquisa: searchTerm });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className="order-filters">
            {/* Localizar Cliente */}
            <div className="filter-row">
                <label
                    className="filter-label clickable"
                    onClick={handleClearClient}
                    title="Clique para limpar"
                >
                    <u>C</u>liente:
                </label>
                <select
                    value={filters.cliente || ''}
                    onChange={(e) => onFiltersChange({ ...filters, cliente: e.target.value || null })}
                    className="filter-select"
                >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                        <option key={c.cli_codigo} value={c.cli_codigo}>
                            {c.cli_nomred}
                        </option>
                    ))}
                </select>
                <label className="filter-checkbox">
                    <input
                        type="checkbox"
                        checked={filters.ignorarIndustria}
                        onChange={(e) => onFiltersChange({ ...filters, ignorarIndustria: e.target.checked })}
                    />
                    <span>Mostrar todos os pedidos deste cliente</span>
                </label>
            </div>

            {/* Pesquisa Geral */}
            <div className="filter-row">
                <label className="filter-label">Pesquisar:</label>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Número do pedido ou cliente..."
                    className="filter-input"
                />
                <button onClick={handleSearch} className="filter-button">
                    Pesquisar
                </button>
            </div>

            {/* Período */}
            <div className="filter-row">
                <label className="filter-label">Período:</label>
                <input
                    type="date"
                    value={filters.dataInicio || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dataInicio: e.target.value || null })}
                    className="filter-date"
                />
                <span className="filter-separator">até</span>
                <input
                    type="date"
                    value={filters.dataFim || ''}
                    onChange={(e) => onFiltersChange({ ...filters, dataFim: e.target.value || null })}
                    className="filter-date"
                />
            </div>

            {/* Situação */}
            <div className="filter-row">
                <label className="filter-label">Situação:</label>
                <select
                    value={filters.situacao}
                    onChange={(e) => onFiltersChange({ ...filters, situacao: e.target.value })}
                    className="filter-select-small"
                >
                    {SITUACOES.map(sit => (
                        <option key={sit.value} value={sit.value}>
                            {sit.label}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
