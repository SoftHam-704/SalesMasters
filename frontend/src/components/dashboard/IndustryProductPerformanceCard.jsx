import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Filter, TrendingUp, AlertCircle, CheckCircle, FileDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

export const IndustryProductPerformanceCard = ({ selectedYear, selectedMonth, selectedIndustry }) => {
    const [performanceData, setPerformanceData] = useState([]);
    const [loading, setLoading] = useState(false);

    const COLORS = {
        primaryText: "#1E293B",
        secondaryText: "#64748B",
        border: "#E2E8F0",
        cardBg: "#FFFFFF",
        accentBlue: "#60A5FA",
        accentGreen: "#10B981",
        accentRed: "#DC2626"
    };

    useEffect(() => {
        if (selectedIndustry) {
            fetchPerformance();
        } else {
            // Se "Todas as Indústrias" estiver selecionado, talvez devêssemos mostrar algo diferente 
            // ou buscar para todas se o backend suportar.
            // Por enquanto, vamos manter o comportamento de buscar se houver algo selecionado
            // ou limpar se nada estiver selecionado.
            // Mas o usuário quer "Filtrar todo o contexto", então se for "Todas", 
            // a query enviará industria=null ou 0 e o backend deve tratar.
            fetchPerformance();
        }
    }, [selectedIndustry, selectedYear, selectedMonth]);

    const fetchPerformance = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                ano: selectedYear
            });
            if (selectedMonth) params.append('mes', selectedMonth);
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/industry-product-performance?${params}`);
            console.log(`[MIX-CARD] Fetching: ${url}`);

            const response = await fetch(url);
            const data = await response.json();

            console.log(`[MIX-CARD] Data received:`, data);

            if (data.success) {
                setPerformanceData(data.data || []);
            }
        } catch (error) {
            console.error('[MIX-CARD] Error fetching performance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!performanceData.length) return;

        const exportData = performanceData.map(row => ({
            'CLIENTE': row.cli_nomred || row.cli_nome || 'N/A',
            'ITENS COMPRADOS': row.skus_comprados || 0,
            'GAP PORTFÓLIO': row.gap_portfolio || 0,
            'VOLUME QTD': Number(row.total_quantidade || 0),
            'PENETRAÇÃO %': `${Math.round(Number(row.percentual_mix || 0))}%`
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Mix de Produtos");

        const fileName = `Positivacao_Mix_${selectedIndustry || 'Geral'}_${selectedYear}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const totalPortfolio = performanceData[0]?.total_skus_portfolio || 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="metric-card-lovable"
            style={{
                background: COLORS.cardBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                minHeight: '400px',
                fontFamily: "'IBM Plex Sans', sans-serif"
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <h3 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        margin: 0,
                        fontSize: '1rem',
                        fontWeight: '700',
                        color: COLORS.primaryText
                    }}>
                        <Users size={20} color={COLORS.accentBlue} />
                        Positivação de Mix por Cliente
                    </h3>
                    <span style={{ fontSize: '0.75rem', color: COLORS.secondaryText, marginLeft: '30px' }}>
                        Catálogo Total: <strong>{totalPortfolio} SKUs</strong>
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleExport}
                        disabled={loading || !performanceData.length}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            cursor: (loading || !performanceData.length) ? 'not-allowed' : 'pointer',
                            color: COLORS.primaryText,
                            transition: 'all 0.2s ease'
                        }}
                        title="Exportar para Excel"
                    >
                        <FileDown size={16} color={COLORS.accentGreen} />
                    </button>
                </div>
            </div>

            <div className="performance-table-wrapper" style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: COLORS.secondaryText, fontSize: '0.875rem' }}>Calculando penetração de mix...</p>
                    </div>
                ) : performanceData.length === 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <p style={{ color: COLORS.secondaryText, fontSize: '0.875rem' }}>Nenhum faturamento no período</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 10 }}>
                            <tr>
                                <th style={{ padding: '6px 8px', textAlign: 'left', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', color: COLORS.secondaryText, borderBottom: `2px solid #F1F5F9` }}>CLIENTE</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', color: COLORS.secondaryText, borderBottom: `2px solid #F1F5F9` }}>MIX / GAP</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', color: COLORS.secondaryText, borderBottom: `2px solid #F1F5F9` }}>VOL. (QTD)</th>
                                <th style={{ padding: '6px 8px', textAlign: 'right', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: '600', color: COLORS.secondaryText, borderBottom: `2px solid #F1F5F9` }}>% REAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {performanceData.map((row, idx) => (
                                <tr key={idx} className="table-row-hover" style={{ borderBottom: `1px solid #F1F5F9` }}>
                                    <td style={{ padding: '8px' }}>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600', color: COLORS.primaryText, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '400px' }}>
                                            {row.cli_nomred || row.cli_nome || 'Cliente Indefinido'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: COLORS.accentGreen }}>
                                                {row.skus_comprados || 0} Itens
                                            </span>
                                            {Number(row.gap_portfolio || 0) > 0 ? (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    color: '#991B1B',
                                                    backgroundColor: '#FEF2F2',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #FEE2E2',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    gap -{row.gap_portfolio}
                                                </span>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    fontWeight: '700',
                                                    color: '#166534',
                                                    backgroundColor: '#F0FDF4',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #DCFCE7',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '2px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    <CheckCircle size={10} /> COMPLETO
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '0.85rem', fontWeight: '700', color: COLORS.primaryText }}>
                                        {Math.floor(Number(row.total_quantidade || 0)).toLocaleString('pt-BR')}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                        <div style={{ width: '50px', marginLeft: 'auto' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: COLORS.primaryText }}>
                                                {Math.round(Number(row.percentual_mix || 0))}%
                                            </span>
                                            <div style={{ width: '100%', height: '4px', background: '#F1F5F9', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
                                                <div
                                                    style={{
                                                        width: `${Math.min(100, Math.round(Number(row.percentual_mix || 0)))}%`,
                                                        height: '100%',
                                                        background: Number(row.percentual_mix || 0) > 80 ? COLORS.accentGreen : COLORS.accentBlue
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .table-row-hover:hover {
                    background-color: #F8FAFC;
                    transition: background 0.15s ease;
                }
                .performance-table-wrapper::-webkit-scrollbar { width: 4px; }
                .performance-table-wrapper::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
            `}} />
        </motion.div>
    );
};
