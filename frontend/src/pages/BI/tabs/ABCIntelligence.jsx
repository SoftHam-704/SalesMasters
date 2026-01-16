import React, { useState, useEffect } from 'react';
import axios from '../../../lib/axios';
import './ABCIntelligence.css';
import { PYTHON_API_URL, getApiUrl } from '../../../utils/apiConfig';

const ABCIntelligence = ({ filtros = {} }) => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState(null);
    const [curvaAtiva, setCurvaAtiva] = useState('todos');

    // Métrica vem do painel de filtros superior
    const metricaAtiva = filtros.metrica || 'valor';

    // Verifica se uma indústria foi selecionada
    const industriaSelecionada = filtros.industria && filtros.industria !== 'todos';

    useEffect(() => {
        if (industriaSelecionada) {
            carregarDados();
        } else {
            setData(null);
            setLoading(false);
        }
    }, [filtros, metricaAtiva]);

    const carregarDados = async () => {
        try {
            setLoading(true);
            const params = {
                ano: filtros.ano || new Date().getFullYear(),
                meses: filtros.meses || 'todos',
                industria: filtros.industria || 'todos',
                clientes: filtros.clientes || 'todos',
                metrica: metricaAtiva
            };

            const url = getApiUrl(PYTHON_API_URL, '/api/analytics/abc-intelligence');
            const response = await axios.get(url, { params });

            if (response.data?.success && response.data?.data) {
                // Adapta o formato do backend para o formato esperado pelo componente
                const backendData = response.data.data;

                // Transforma resumo em array curva_abc
                const curva_abc = ['A', 'B', 'C'].map(curva => ({
                    curva,
                    produtos: backendData.resumo[curva]?.produtos || 0,
                    valor: backendData.resumo[curva]?.valor || 0,
                    percentual: backendData.resumo[curva]?.percentual || 0
                }));

                // Combina todos os produtos em uma lista ordenada
                const todosProdutos = [
                    ...(backendData.produtos?.A || []),
                    ...(backendData.produtos?.B || []),
                    ...(backendData.produtos?.C || [])
                ].sort((a, b) => a.ranking - b.ranking).map(p => ({
                    ranking: p.ranking,
                    produto: p.produto || `Produto ${p.ite_produto}`,
                    valor: p.total || 0,
                    quantidade: p.total || 0, // Backend retorna total como métrica principal
                    percentual: p.percentual || 0,
                    acumulado: p.percentual_acum || 0,
                    clientes: p.qtd_clientes || 0,
                    curva: p.curva || 'C'
                }));

                setData({
                    curva_abc,
                    produtos: todosProdutos,
                    insights: backendData.insights || {}
                });
            } else {
                setData(null);
            }
        } catch (error) {
            console.error('Erro ao carregar ABC Intelligence:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="abc-loading">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '4px solid #e2e8f0',
                        borderTop: '4px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <span>Carregando Análise ABC...</span>
                </div>
                <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    // Se nenhuma indústria foi selecionada, mostrar mensagem
    if (!industriaSelecionada) {
        return (
            <div className="abc-loading">
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏭</div>
                    <div style={{ fontWeight: 700, fontSize: '18px', marginBottom: '8px', color: '#1e293b' }}>Selecione uma Indústria</div>
                    <div style={{ fontSize: '13px', color: '#64748b', maxWidth: '400px', lineHeight: 1.5 }}>
                        Para visualizar a análise da Curva ABC, selecione uma indústria no filtro acima.
                        <br /><br />
                        A análise ABC classifica os produtos vendidos por ordem de importância (Pareto 80/20).
                    </div>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="abc-loading">
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontWeight: 600, marginBottom: '8px' }}>Nenhum dado disponível</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Verifique os filtros selecionados</div>
                </div>
            </div>
        );
    }

    const { curva_abc, insights, produtos } = data;

    // Filtrar produtos por curva
    const produtosFiltrados = curvaAtiva === 'todos'
        ? produtos
        : produtos.filter(p => p.curva.toLowerCase() === curvaAtiva.toLowerCase());

    // Calcular stats do header
    const totalProdutos = curva_abc.reduce((sum, c) => sum + c.produtos, 0);
    const curvaC = curva_abc.find(c => c.curva === 'C');
    const percCurvaC = curvaC ? Math.round((curvaC.produtos / totalProdutos) * 100) : 0;

    return (
        <div className="abc-intelligence">

            {/* HEADER COMPACTO */}
            <div className="pareto-header" style={{ padding: '16px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    {/* Título */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="title-icon">📊</div>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>
                                Curva ABC
                            </div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                                Métrica: <strong style={{ color: '#1e40af' }}>{metricaAtiva === 'valor' ? 'Valor' : metricaAtiva === 'quantidade' ? 'Quantidade' : 'Unidades'}</strong>
                            </div>
                        </div>
                    </div>

                    {/* Stats Horizontais */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {curva_abc.map((curva) => (
                            <div key={curva.curva} style={{
                                background: curva.curva === 'A' ? '#dbeafe' : curva.curva === 'B' ? '#fef3c7' : '#f1f5f9',
                                borderLeft: `4px solid ${curva.curva === 'A' ? '#1e40af' : curva.curva === 'B' ? '#d97706' : '#64748b'}`,
                                padding: '12px 20px',
                                borderRadius: '8px',
                                minWidth: '130px'
                            }}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                                    Curva {curva.curva}
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b' }}>
                                    {curva.percentual.toFixed(1)}%
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                    {curva.produtos} produtos
                                </div>
                            </div>
                        ))}

                        {/* Top #1 Product */}
                        {produtos[0] && (
                            <div style={{
                                background: '#f0fdf4',
                                borderLeft: '4px solid #10b981',
                                padding: '12px 20px',
                                borderRadius: '8px',
                                minWidth: '150px'
                            }}>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                                    🏆 Top #1
                                </div>
                                <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                    {produtos[0].produto}
                                </div>
                                <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                                    {produtos[0].percentual.toFixed(2)}% do total
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LAYOUT 2 COLUNAS: CARDS (esquerda) + TABELA (direita) */}
            <div className="main-layout">

                {/* COLUNA ESQUERDA: CARDS */}
                <div className="cards-column">

                    {/* SEÇÃO 1: MINI GAUGES */}
                    <div>
                        <div className="section-title">📊 Métricas Principais</div>
                        <div className="mini-metrics">
                            <div className="mini-gauge">
                                <div className="gauge-circle perc-70">
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#3b82f6' }}>
                                        {curva_abc[0]?.percentual.toFixed(0)}%
                                    </span>
                                </div>
                                <div className="gauge-label">Concentração A</div>
                            </div>

                            <div className="mini-gauge">
                                <div className="gauge-circle perc-27">
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#f59e0b' }}>
                                        {insights.oportunidades_penetracao?.length > 0
                                            ? insights.oportunidades_penetracao[0].penetracao + '%'
                                            : '0%'}
                                    </span>
                                </div>
                                <div className="gauge-label">
                                    Penetração {insights.oportunidades_penetracao?.[0]?.produto?.substring(0, 10) || 'Top'}
                                </div>
                            </div>

                            <div className="mini-gauge">
                                <div className="gauge-circle perc-87">
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>
                                        {insights.migracao_b_a?.length > 0 ? insights.migracao_b_a[0].percentual_falta + '%' : '0%'}
                                    </span>
                                </div>
                                <div className="gauge-label">
                                    Gap para A {insights.migracao_b_a?.[0]?.produto?.substring(0, 8) || 'B'}
                                </div>
                            </div>

                            <div className="mini-gauge">
                                <div className="gauge-value-simple">
                                    R$ {insights.alerta_curva_c
                                        ? (insights.alerta_curva_c.economia / 1000).toFixed(0) + 'K'
                                        : '0'}
                                </div>
                                <div className="gauge-label">Economia Potencial</div>
                            </div>
                        </div>
                    </div>

                    {/* SEÇÃO 2: INSIGHTS */}
                    <div>
                        <div className="section-title">💡 Insights Inteligentes</div>
                        <div className="insights-grid">

                            {/* 1. ALERTA */}
                            {insights.alerta_curva_c && (
                                <div className="insight-card alert">
                                    <div className="insight-header">
                                        <span className="insight-icon">🚨</span>
                                        <div className="insight-title">{insights.alerta_curva_c.titulo}</div>
                                    </div>
                                    <div className="insight-body">
                                        {insights.alerta_curva_c.detalhes?.map((d, i) => (
                                            <div key={i}>• {d}</div>
                                        ))}
                                    </div>
                                    <div className="insight-highlight">
                                        R$ {insights.alerta_curva_c.economia?.toLocaleString('pt-BR')} economia
                                    </div>
                                </div>
                            )}

                            {/* 2. OPORTUNIDADES */}
                            {insights.oportunidades_penetracao?.length > 0 && (
                                <div className="insight-card opportunity">
                                    <div className="insight-header">
                                        <span className="insight-icon">💡</span>
                                        <div className="insight-title">Oportunidades Expansão (A)</div>
                                    </div>
                                    <div className="insight-body">
                                        <strong>{insights.oportunidades_penetracao[0].produto}</strong><br />
                                        Penetração: {insights.oportunidades_penetracao[0].penetracao}% •
                                        {insights.oportunidades_penetracao[0].clientes_atuais}/{insights.oportunidades_penetracao[0].clientes_atuais + insights.oportunidades_penetracao[0].potencial} clientes
                                    </div>
                                    <div className="insight-highlight">
                                        R$ {insights.oportunidades_penetracao[0].oportunidade?.toLocaleString('pt-BR')} potencial
                                    </div>
                                    <div className="insight-action">👉 Campanha com 10% desconto</div>
                                </div>
                            )}

                            {/* 3. MIGRAÇÃO B→A */}
                            {insights.migracao_b_a?.length > 0 && (
                                <div className="insight-card growth">
                                    <div className="insight-header">
                                        <span className="insight-icon">🚀</span>
                                        <div className="insight-title">Produtos B → Curva A</div>
                                    </div>
                                    <div className="insight-body">
                                        <strong>{insights.migracao_b_a[0].produto}</strong><br />
                                        Falta {insights.migracao_b_a[0].percentual_falta}%
                                        (R$ {insights.migracao_b_a[0].gap?.toLocaleString('pt-BR')}) para A
                                    </div>
                                    <div className="insight-action">👉 Bundle com produto A</div>
                                </div>
                            )}

                            {/* 4. CROSS-SELL */}
                            {insights.cross_sell?.clientes > 0 && (
                                <div className="insight-card cross">
                                    <div className="insight-header">
                                        <span className="insight-icon">🎯</span>
                                        <div className="insight-title">Cross-sell C→A</div>
                                    </div>
                                    <div className="insight-body">
                                        {insights.cross_sell.clientes} clientes compram só Curva C
                                    </div>
                                    <div className="insight-highlight">
                                        R$ {insights.cross_sell.potencial?.toLocaleString('pt-BR')} upgrade
                                    </div>
                                    <div className="insight-action">👉 Pacote A+C desconto 10%</div>
                                </div>
                            )}

                            {/* Fallback se não houver insights */}
                            {!insights.alerta_curva_c && !insights.oportunidades_penetracao?.length && !insights.migracao_b_a?.length && !insights.cross_sell?.clientes && (
                                <div className="insight-card">
                                    <div className="insight-header">
                                        <span className="insight-icon">✅</span>
                                        <div className="insight-title">Portfólio Equilibrado</div>
                                    </div>
                                    <div className="insight-body">
                                        Sua distribuição ABC está dentro dos parâmetros ideais.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: TABELA */}
                <div className="table-column">
                    <div className="table-header">
                        <div className="table-title">📋 Produtos por Classificação ABC</div>
                        <div className="table-tabs">
                            <button
                                className={`tab-btn ${curvaAtiva === 'todos' ? 'active' : ''}`}
                                onClick={() => setCurvaAtiva('todos')}
                            >
                                Todos
                            </button>
                            <button
                                className={`tab-btn ${curvaAtiva === 'a' ? 'active' : ''}`}
                                onClick={() => setCurvaAtiva('a')}
                            >
                                Curva A
                            </button>
                            <button
                                className={`tab-btn ${curvaAtiva === 'b' ? 'active' : ''}`}
                                onClick={() => setCurvaAtiva('b')}
                            >
                                Curva B
                            </button>
                            <button
                                className={`tab-btn ${curvaAtiva === 'c' ? 'active' : ''}`}
                                onClick={() => setCurvaAtiva('c')}
                            >
                                Curva C
                            </button>
                        </div>
                    </div>

                    <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>#</th>
                                    <th>Produto</th>
                                    <th className="text-right" style={{ width: '110px' }}>
                                        {metricaAtiva === 'valor' ? 'Valor' : metricaAtiva === 'quantidade' ? 'Quantidade' : 'Unidades'}
                                    </th>
                                    <th className="text-right" style={{ width: '60px' }}>%</th>
                                    <th style={{ width: '140px' }}>% Acumulado</th>
                                    <th className="text-center" style={{ width: '70px' }}>Clientes</th>
                                    <th className="text-center" style={{ width: '50px' }}>ABC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {produtosFiltrados.slice(0, 50).map((produto, idx) => (
                                    <tr key={idx} style={{
                                        background: produto.curva === 'B' ? '#fffbeb' : produto.curva === 'C' ? '#fafafa' : 'white'
                                    }}>
                                        <td>{produto.ranking}</td>
                                        <td className="product-name">{produto.produto}</td>
                                        <td className="text-right font-bold">
                                            {metricaAtiva === 'valor'
                                                ? `R$ ${produto.valor?.toLocaleString('pt-BR')}`
                                                : produto.quantidade?.toLocaleString('pt-BR')}
                                        </td>
                                        <td className="text-right">{produto.percentual?.toFixed(2)}%</td>
                                        <td>
                                            <div className="progress-bar">
                                                <div
                                                    className={`progress-fill ${produto.curva.toLowerCase()}`}
                                                    style={{ width: `${produto.acumulado || 0}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="text-center">{produto.clientes}</td>
                                        <td className="text-center">
                                            <span className={`badge-abc ${produto.curva.toLowerCase()}`}>
                                                {produto.curva}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{
                        textAlign: 'center',
                        padding: '12px',
                        fontSize: '11px',
                        color: '#64748b',
                        background: '#f8fafc',
                        marginTop: '8px',
                        borderRadius: '6px'
                    }}>
                        Mostrando {Math.min(50, produtosFiltrados.length)} de {produtosFiltrados.length} produtos
                    </div>
                </div>

            </div>

            {/* FOOTER STATS */}
            <div className="footer-stats">
                <div className="stat-item">
                    <div className="stat-value">
                        R$ {(curva_abc.reduce((sum, c) => sum + c.valor, 0) / 1000000).toFixed(2)} Mi
                    </div>
                    <div className="stat-label">Faturamento Total</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">{totalProdutos}</div>
                    <div className="stat-label">Produtos na Análise</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">
                        {curva_abc.find(c => c.curva === 'A')?.produtos || 0}
                    </div>
                    <div className="stat-label">Produtos Curva A</div>
                </div>
                <div className="stat-item">
                    <div className="stat-value">
                        {curva_abc.find(c => c.curva === 'C')?.produtos || 0}
                    </div>
                    <div className="stat-label">Produtos Curva C</div>
                </div>
            </div>

        </div>
    );
};

export default ABCIntelligence;
