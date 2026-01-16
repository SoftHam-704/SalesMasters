// InsightsCard.jsx
// Componente específico para o card azul de insights

import React, { useState, useEffect } from 'react';
import axios from '../lib/axios';
import './InsightsCard.css';

import { PYTHON_API_URL, getApiUrl } from '../utils/apiConfig';

const API_URL = PYTHON_API_URL;

const InsightsCard = ({ ano = 2025, industryId = null }) => {
    const [insights, setInsights] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        fetchInsights();
        // Atualiza a cada 5 minutos
        const interval = setInterval(fetchInsights, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [ano, industryId]);

    const fetchInsights = async () => {
        try {
            setLoading(true);
            // Construct URL with params manually to ensure correct endpoint
            const url = getApiUrl(API_URL, '/api/dashboard/analytics/insights');
            console.log('Fetching insights from:', url, { ano, industryId });

            const response = await axios.get(url, { params: { ano, industryId } });

            if (response.data.success) {
                let insightsData = response.data.data;

                // Handle potential nested JSON string from AI response
                if (typeof insightsData === 'string') {
                    try {
                        insightsData = JSON.parse(insightsData);
                    } catch (e) {
                        console.error("Error parsing insights JSON string", e);
                    }
                }

                // Normalize whatever structure comes back to a list of insights
                // If it's the full structure with categories, we flatten it
                let flatInsights = [];

                if (Array.isArray(insightsData)) {
                    flatInsights = insightsData;
                } else if (insightsData.insights) {
                    flatInsights = insightsData.insights;
                } else if (insightsData.categorias) {
                    // Flatten generic categories structure
                    const cats = insightsData.categorias;
                    flatInsights = [
                        ...(cats.oportunidades || []),
                        ...(cats.alertas || []),
                        ...(cats.riscos || []),
                        ...(cats.destaques || [])
                    ];
                }

                setInsights(flatInsights);
                setLastUpdate(new Date());
                setError(null);
            }
        } catch (err) {
            console.error('Erro ao buscar insights:', err);
            // Fallback friendly message instead of technical error
            setError('Inteligência Analítica indisponível no momento.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && insights.length === 0) {
        return (
            <div className="insights-card-container">
                <div className="insights-header">
                    <h3>💡 DESCOBERTAS DA ANÁLISE</h3>
                </div>
                <div className="insights-loading">
                    <div className="loading-spinner"></div>
                    <p>Compilando novas descobertas baseadas no comportamento atual...</p>
                </div>
            </div>
        );
    }

    if (error && insights.length === 0) {
        return (
            <div className="insights-card-container">
                <div className="insights-header">
                    <h3>💡 DESCOBERTAS DA ANÁLISE</h3>
                </div>
                <div className="insights-error">
                    <p>⚠️ {error}</p>
                    <button onClick={fetchInsights} className="btn-retry">
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="insights-card-container">
            <div className="insights-header">
                <h3>💡 DESCOBERTAS DA ANÁLISE</h3>
                {lastUpdate && (
                    <span className="last-update">
                        Atualizado: {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                )}
            </div>

            <div className="insights-content">
                {insights.length === 0 ? (
                    <div className="text-center p-4 text-slate-400 text-sm">
                        Nenhuma descoberta relevante para este contexto.
                    </div>
                ) : (
                    insights.map((insight, index) => (
                        <div key={index} className="insight-box">
                            <div className="insight-title">
                                {insight.titulo || insight.title}
                            </div>
                            <div className="insight-detail">
                                {insight.detalhe || insight.subtitle || insight.description}
                            </div>
                            {(insight.acao_recomendada || insight.acao) && (
                                <div className="insight-action">
                                    <span className="action-icon">👉</span>
                                    {insight.acao_recomendada || insight.acao}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="insights-footer">
                <button onClick={fetchInsights} className="btn-refresh" disabled={loading}>
                    {loading ? '⏳ Atualizando...' : '🔄 Atualizar Insights'}
                </button>
            </div>
        </div>
    );
};

export default InsightsCard;
