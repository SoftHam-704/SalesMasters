// CustomerComparison.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CustomerComparison.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const CustomerComparison = ({ ano = 2025 }) => {
    const [data, setData] = useState({ clientes: [], alertas: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [ano]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_URL}/dashboard/analytics/customer-comparison?ano=${ano}`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Erro ao buscar comparativo de clientes:', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'Crescendo': { icon: '✅', label: 'Crescendo', class: 'status-crescendo' },
            'Destaque': { icon: '🔥', label: 'Destaque', class: 'status-destaque' },
            'Em Queda': { icon: '⚠️', label: 'Em Queda', class: 'status-queda' },
            'Perdido': { icon: '🚨', label: 'Perdido', class: 'status-perdido' },
            'Novo': { icon: '🆕', label: 'Novo', class: 'status-novo' },
            'Estável': { icon: '➖', label: 'Estável', class: 'status-estavel' }
        };

        const badge = badges[status] || badges['Estável'];
        return (
            <span className={`status-badge ${badge.class}`}>
                {badge.icon} {badge.label}
            </span>
        );
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR');
    };

    if (loading) {
        return (
            <div className="customer-comparison">
                <h3>📊 Comparativo de Clientes: Ano Atual vs Ano Anterior</h3>
                <div className="cc-loading">Carregando...</div>
            </div>
        );
    }

    if (!data.clientes || data.clientes.length === 0) {
        return (
            <div className="customer-comparison">
                <h3>📊 Comparativo de Clientes: Ano Atual vs Ano Anterior</h3>
                <div className="cc-empty">Nenhum dado comparativo disponível para este período.</div>
            </div>
        );
    }

    return (
        <div className="customer-comparison">
            <h3>📊 Comparativo de Clientes: Ano Atual vs Ano Anterior</h3>

            <div className="cc-table-wrapper">
                <table className="cc-table">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Ano Anterior</th>
                            <th>Ano Atual</th>
                            <th>Variação</th>
                            <th>Status</th>
                            <th>Última Compra</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.clientes.map((cliente, idx) => (
                            <tr
                                key={idx}
                                className={cliente.status === 'Perdido' ? 'row-perdido' : ''}
                            >
                                <td><strong>{cliente.cliente}</strong></td>
                                <td>{cliente.ano_anterior}</td>
                                <td><strong>{cliente.ano_atual}</strong></td>
                                <td className={cliente.variacao >= 0 ? 'var-positive' : 'var-negative'}>
                                    {cliente.variacao > 0 ? '+' : ''}{cliente.variacao}%
                                </td>
                                <td>{getStatusBadge(cliente.status)}</td>
                                <td>{formatDate(cliente.ultima_compra)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Alertas Contextuais */}
            {data.alertas && data.alertas.map((alerta, idx) => (
                <div
                    key={idx}
                    className={`cc-alert ${alerta.tipo === 'critico' ? 'alert-critico' : 'alert-oportunidade'}`}
                >
                    <div className="alert-title">{alerta.titulo}</div>
                    <div className="alert-details">
                        {alerta.detalhes.map((detalhe, i) => (
                            <div key={i}>• {detalhe}</div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CustomerComparison;
