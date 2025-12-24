import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign } from 'lucide-react';
import './TopClientsCard.css';

export const TopClientsCard = ({ clients, loading }) => {
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    if (loading) {
        return (
            <div className="top-clients-card">
                <div className="card-header">
                    <h3 className="card-title">
                        <TrendingUp className="title-icon" />
                        Top 15 Clientes
                    </h3>
                </div>
                <div className="loading-state">
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="top-clients-card"
        >
            <div className="card-header">
                <h3 className="card-title">
                    <TrendingUp className="title-icon" />
                    Top 15 Clientes
                </h3>
            </div>
            <div className="clients-list">
                {clients && clients.length > 0 ? (
                    clients.map((client, index) => (
                        <motion.div
                            key={client.cliente_codigo}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                            className="client-item"
                        >
                            <div className="client-rank">
                                <span className={`rank-badge rank-${index + 1}`}>
                                    {index + 1}
                                </span>
                            </div>
                            <div className="client-info">
                                <div className="client-name">{client.cliente_nome}</div>
                                <div className="client-stats">
                                    <span className="stat">
                                        <DollarSign size={12} />
                                        {formatCurrency(client.total_vendido)}
                                    </span>
                                    <span className="stat-separator">·</span>
                                    <span className="stat">
                                        {client.quantidade_pedidos} pedidos
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="empty-state">
                        <p>Nenhum cliente encontrado para o período selecionado</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};
