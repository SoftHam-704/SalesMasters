import React, { useState, useEffect } from 'react';
import CircularProgress from '../../components/CircularProgress';
import './PortfolioAnalysis.css';
import { PYTHON_API_URL, getApiUrl } from '../../utils/apiConfig';

const PortfolioAnalysis = ({ filters: parentFilters }) => {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [industrias, setIndustrias] = useState([]);

    // Usar filtros do pai (ano, mes, industria)
    const filters = parentFilters || { ano: 2025, mes: null, industria: null };

    // Carregar análise quando filtros mudarem
    useEffect(() => {
        if (filters.industria && filters.industria !== 'Todos') {
            fetchAnalysis();
        } else {
            setAnalysis(null);
            setLoading(false);
        }
    }, [filters]);

    const fetchAnalysis = async () => {
        setLoading(true);

        try {
            const params = new URLSearchParams({
                ano: filters.ano,
                industria: filters.industria
            });

            if (filters.mes && filters.mes !== 'Todos') {
                // Converter nome do mês para número
                const mesMap = {
                    'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4,
                    'Maio': 5, 'Junho': 6, 'Julho': 7, 'Agosto': 8,
                    'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
                };
                const mesNum = mesMap[filters.mes] || null;
                if (mesNum) {
                    params.append('mes', mesNum);
                }
            }

            const url = getApiUrl(PYTHON_API_URL, `/api/portfolio/analyze?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setAnalysis(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar análise:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Carregando análise ABC...</div>;
    if (!analysis) return null; // Retorna nada se não houver indústria selecionada

    const COLORS = {
        'A': '#10b981',    // Emerald-500 (Tailwind)
        'B': '#f97316',    // Orange-500
        'C': '#64748b',    // Slate-500
        'OFF': '#ef4444'   // Red-500
    };

    return (
        <div className="portfolio-analysis-embedded">
            {/* Grid de Curvas */}
            <div className="curvas-grid">
                {analysis.curvas.map(curva => (
                    <div
                        key={curva.curva}
                        className={`curva-card curva-${curva.color}`}
                    >
                        {/* Cabeçalho com bolinha colorida + Título */}
                        <div className="card-header">
                            <span
                                className="dot"
                                style={{ backgroundColor: COLORS[curva.curva] }}
                            ></span>
                            <span className="curva-title">
                                CURVA {curva.curva} <span className="qty">({curva.qtd_itens})</span>
                            </span>
                        </div>

                        {/* Gráfico Circular */}
                        <div className="chart-wrapper">
                            <CircularProgress
                                percentage={curva.percentual_faturamento}
                                color={COLORS[curva.curva]}
                                size={110}
                            />
                        </div>

                        {/* Status Badge */}
                        <div className={`status-badge status-${curva.color}`}>
                            <span className="badge-icon">{curva.icon}</span>
                            <span className="badge-text">{curva.status}</span>
                        </div>

                        {/* Detalhes */}
                        <div className="curva-detalhes">
                            <ul>
                                {curva.detalhes.map((detalhe, idx) => (
                                    <li key={idx}>{detalhe}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Ação */}
                        {curva.curva === 'OFF' && (
                            <button className="btn-action btn-danger">
                                🏷️ {curva.action_text}
                            </button>
                        )}
                        {curva.curva === 'C' && (
                            <button className="btn-action btn-warning">
                                ⚡ REVISAR ESTRATÉGIA
                            </button>
                        )}
                        {curva.curva === 'A' && (
                            <button className="btn-action btn-success">
                                ✓ {curva.action_text}
                            </button>
                        )}
                        {curva.curva === 'B' && (
                            <button className="btn-action btn-info">
                                ↗️ {curva.action_text}
                            </button>
                        )}
                    </div>
                ))}
            </div>

            {/* Recomendação Estratégica */}
            {analysis.recomendacao_estrategica && (
                <div className="strategic-recommendation">
                    <div className="recommendation-header">
                        <span className="icon">💡</span>
                        <h2>{analysis.recomendacao_estrategica.title}</h2>
                    </div>

                    <div className="recommendation-list">
                        {analysis.recomendacao_estrategica.items.map((item, idx) => (
                            <div
                                key={idx}
                                className={`recommendation-item priority-${item.priority}`}
                            >
                                <span className="item-icon">{item.icon}</span>
                                <div className="item-content">
                                    <strong>CURVA {item.curva}:</strong> {item.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PortfolioAnalysis;
