// CommercialEfficiency.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CommercialEfficiency.css';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

const CommercialEfficiency = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await axios.get(`${API_URL}/dashboard/analytics/commercial-efficiency`);
            if (res.data.success) {
                setData(res.data.data);
            }
        } catch (err) {
            console.error('Erro ao buscar eficiência comercial:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !data) {
        return (
            <div className="commercial-efficiency">
                <h3>📊 Eficiência Comercial</h3>
                <div className="ce-loading">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="commercial-efficiency">
            <h3>📊 Eficiência Comercial - {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</h3>

            {/* Ticket Médio */}
            <div className="ce-metric">
                <div className="ce-label">Ticket Médio</div>
                <div className="ce-value">R$ {data.ticket_medio.valor.toLocaleString('pt-BR')}</div>
                <div className={`ce-variation ${data.ticket_medio.variacao < 0 ? 'negative' : 'positive'}`}>
                    {data.ticket_medio.variacao > 0 ? '+' : ''}{data.ticket_medio.variacao}% vs mês anterior
                </div>
            </div>

            {/* Pedidos/Cliente */}
            <div className="ce-metric">
                <div className="ce-label">Pedidos/Cliente</div>
                <div className="ce-value">{data.pedidos_cliente.valor}</div>
                <div className={`ce-variation ${data.pedidos_cliente.variacao < 0 ? 'negative' : 'positive'}`}>
                    {data.pedidos_cliente.variacao > 0 ? '+' : ''}{data.pedidos_cliente.variacao}% vs ano anterior
                </div>
            </div>

            {/* Conversão Catálogo */}
            <div className="ce-metric">
                <div className="ce-label">Conversão Catálogo</div>
                <div className="ce-value">{data.conversao_catalogo.valor}%</div>
                <div className="ce-variation positive">{data.conversao_catalogo.status}</div>
            </div>

            {/* Cross-sell Opportunity */}
            <div className="ce-opportunity">
                <div className="ce-opp-icon">🎯</div>
                <div className="ce-opp-content">
                    <strong>Oportunidade de Cross-sell:</strong>
                    <div className="ce-opp-details">
                        • {data.cross_sell.clientes} clientes compram apenas Curva C<br />
                        • Potencial: R$ {data.cross_sell.potencial.toLocaleString('pt-BR')} em upgrades<br />
                        • Ação: Oferecer pacotes Curva A com desconto
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommercialEfficiency;
