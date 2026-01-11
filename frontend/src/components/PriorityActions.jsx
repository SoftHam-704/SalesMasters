// PriorityActions.jsx
// Classifica insights por prioridade

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PriorityActions.css';

import { PYTHON_API_URL, getApiUrl } from '../utils/apiConfig';

const API_URL = PYTHON_API_URL;

const PriorityActions = () => {
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActions();
    }, []);

    const fetchActions = async () => {
        try {
            const url = getApiUrl(API_URL, '/api/dashboard/analytics/priority-actions');
            const res = await axios.get(url);
            if (res.data.success) {
                setActions(res.data.data);
            }
        } catch (err) {
            console.error('Erro ao buscar ações prioritárias:', err);
        } finally {
            setLoading(false);
        }
    };

    const priorityOrder = ['URGENTE', 'IMPORTANTE', 'MÉDIO PRAZO', 'OPORTUNIDADE'];
    const priorityColors = {
        'URGENTE': '#ef4444',
        'IMPORTANTE': '#f59e0b',
        'MÉDIO PRAZO': '#3b82f6',
        'OPORTUNIDADE': '#10b981'
    };

    if (loading) {
        return (
            <div className="priority-card">
                <h3>🎯 Ações Prioritárias para Próxima Semana</h3>
                <div className="priority-loading">Carregando...</div>
            </div>
        );
    }

    if (actions.length === 0) {
        return (
            <div className="priority-card">
                <h3>🎯 Ações Prioritárias para Próxima Semana</h3>
                <div className="priority-empty">Nenhuma ação prioritária identificada no momento.</div>
            </div>
        );
    }

    return (
        <div className="priority-card">
            <h3>🎯 Ações Prioritárias para Próxima Semana</h3>

            {priorityOrder.map((priority, idx) => {
                const action = actions.find(a => a.prioridade === priority);
                if (!action) return null;

                return (
                    <div
                        key={idx}
                        className="priority-item"
                        style={{ borderLeftColor: priorityColors[priority] }}
                    >
                        <div className="priority-header">
                            PRIORIDADE {idx + 1} - {priority}
                        </div>
                        <div className="priority-icon">
                            {action.icone} {action.titulo}
                        </div>
                        <div className="priority-detail">{action.detalhe}</div>
                    </div>
                );
            })}
        </div>
    );
};

export default PriorityActions;
