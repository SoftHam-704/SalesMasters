import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Target, Loader2, AlertCircle } from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const fmt = (v) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v || 0);
const fmtPct = (v) => {
    const n = parseFloat(v) || 0;
    return `${n > 0 ? '+' : ''}${n.toFixed(2)}%`;
};

export const MetasIndustriasTable = ({ selectedYear, selectedMonth, selectedIndustry, limit }) => {
    const [data, setData] = useState({ status: [], por_mes: [], mes_ate: 1 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [view, setView] = useState('tabela'); // Tabela é o padrão agora

    useEffect(() => {
        fetchMetas();
    }, [selectedYear, selectedMonth, selectedIndustry]);

    const fetchMetas = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ ano: selectedYear });
            if (selectedMonth) params.append('mes', selectedMonth);
            if (selectedIndustry) params.append('for_codigo', selectedIndustry);

            const url = getApiUrl(NODE_API_URL, `/api/dashboard/metas-industrias?${params}`);
            const res = await fetch(url);
            const json = await res.json();

            if (json.success) {
                setData(json.data);
            } else {
                setError(json.message || 'Erro ao carregar metas');
            }
        } catch (err) {
            setError('Erro ao conectar com o servidor');
            console.error('[MetasIndustriasTable]', err);
        } finally {
            setLoading(false);
        }
    };

    // Agrupar por_mes por indústria
    const byIndustry = React.useMemo(() => {
        const map = {};
        (data.por_mes || []).forEach(row => {
            const nome = row.industria_nome || 'Sem nome';
            if (!map[nome]) map[nome] = {};
            map[nome][row.mes] = row;
        });
        return map;
    }, [data.por_mes]);

    const industrias = limit ? Object.keys(byIndustry).slice(0, limit) : Object.keys(byIndustry);

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px', color: 'var(--text-secondary)' }}>
                <Loader2 size={18} className="animate-spin" />
                <span style={{ fontSize: '13px' }}>Carregando dados de metas...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px', color: '#ef4444' }}>
                <AlertCircle size={18} />
                <span style={{ fontSize: '13px' }}>{error}</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', overflow: 'hidden' }}>
            {/* Tabela de Metas (Identidade BI) */}

            {/* VIEW: Tabela Mensal (Identidade BI) */}
            {view === 'tabela' && (
                <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', minWidth: '940px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '10px', width: '180px', position: 'sticky', left: 0, background: '#f8fafc', zIndex: 2 }}>Indústria</th>
                                {MONTH_LABELS.map((m, i) => (
                                    <th key={i} style={{ textAlign: 'right', padding: '10px 8px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', fontSize: '10px' }}>{m}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {industrias.map((industria, idx) => {
                                const meses = byIndustry[industria];
                                return (
                                    <React.Fragment key={idx}>
                                        {/* Header da Indústria - Estilo Dark BI */}
                                        <tr style={{ background: '#334155' }}>
                                            <td colSpan={13} style={{ padding: '8px 12px', fontWeight: '800', color: '#fff', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                {industria}
                                            </td>
                                        </tr>
                                        {/* Ano Anterior */}
                                        <Row label="Ano anterior" mesesData={meses} field="ano_anterior" color="#64748b" />
                                        {/* Meta */}
                                        <Row label="Meta ano corrente" mesesData={meses} field="meta_ano_corrente" color="#3b82f6" />
                                        {/* Realizado */}
                                        <Row label="Vendas ano corrente" mesesData={meses} field="vendas_ano_corrente" color="#1e293b" bold />
                                        {/* % Atingimento */}
                                        <PercentRow label="% Atingido da meta" mesesData={meses} field="perc_atingimento" isGoal />
                                        {/* % Evolução */}
                                        <PercentRow label="% Em relação ao ano ant." mesesData={meses} field="perc_relacao_ano_ant" lastOfIndustry />
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* VIEW: Resumo Status */}
            {view === 'status' && (
                <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#64748b', fontWeight: '700', fontSize: '11px' }}>Indústria</th>
                                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: '700', fontSize: '11px' }}>Realizado YTD</th>
                                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: '700', fontSize: '11px' }}>% Meta</th>
                                <th style={{ textAlign: 'right', padding: '10px 12px', color: '#64748b', fontWeight: '700', fontSize: '11px' }}>Saldo</th>
                                <th style={{ textAlign: 'center', padding: '10px 12px', color: '#64748b', fontWeight: '700', fontSize: '11px' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(limit ? data.status.slice(0, limit) : data.status).map((row, i) => {
                                const pct = parseFloat(row.percentual_meta) || 0;
                                const saldo = parseFloat(row.saldo) || 0;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '10px 12px', fontWeight: '700', color: '#1e293b' }}>{row.industria_nome}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: '#1e293b' }}>{fmt(row.atual)}</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '700', color: pct >= 100 ? '#10b981' : '#f59e0b' }}>{pct.toFixed(1)}%</td>
                                        <td style={{ padding: '10px 12px', textAlign: 'right', color: saldo <= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                                            {saldo <= 0 ? `+${fmt(Math.abs(saldo))}` : `-${fmt(saldo)}`}
                                        </td>
                                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                            <span style={{
                                                background: pct >= 100 ? '#d1fae5' : pct >= 80 ? '#fef3c7' : '#fee2e2',
                                                color: pct >= 100 ? '#10b981' : pct >= 80 ? '#f59e0b' : '#ef4444',
                                                fontSize: '10px', fontWeight: '800', padding: '3px 10px', borderRadius: '6px', textTransform: 'uppercase'
                                            }}>
                                                {row.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Componente de Linha de Valor
const Row = ({ label, mesesData, field, color, bold }) => (
    <tr style={{ borderBottom: '1px solid #f1f5f9', background: '#fff' }}>
        <td style={{ padding: '6px 12px', color: '#64748b', fontWeight: '500', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #f1f5f9' }}>
            {label}
        </td>
        {MONTH_LABELS.map((_, i) => {
            const mesNum = i + 1;
            const val = parseFloat(mesesData?.[mesNum]?.[field]) || 0;
            return (
                <td key={i} style={{ padding: '6px 8px', textAlign: 'right', color: val > 0 ? color : '#cbd5e1', fontWeight: bold ? '700' : '500' }}>
                    {val !== 0 ? fmt(val) : '0,00'}
                </td>
            );
        })}
    </tr>
);

// Componente de Linha de Percentual
const PercentRow = ({ label, mesesData, field, isGoal, lastOfIndustry }) => (
    <tr style={{ borderBottom: lastOfIndustry ? '2px solid #e2e8f0' : '1px solid #f1f5f9', background: '#fff' }}>
        <td style={{ padding: '6px 12px', color: '#64748b', fontWeight: '500', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #f1f5f9' }}>
            {label}
        </td>
        {MONTH_LABELS.map((_, i) => {
            const mesNum = i + 1;
            const row = mesesData?.[mesNum];
            const pct = parseFloat(row?.[field]) || 0;
            const meta = parseFloat(row?.meta_ano_corrente) || 0;

            let color = '#94a3b8';
            if (isGoal) {
                color = meta === 0 ? '#94a3b8' : pct >= 100 ? '#10b981' : (pct > 0 ? '#f59e0b' : '#94a3b8');
            } else {
                color = pct > 0 ? '#10b981' : (pct < 0 ? '#ef4444' : '#94a3b8');
            }

            return (
                <td key={i} style={{ padding: '6px 8px', textAlign: 'right', fontWeight: '700', color, fontSize: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end' }}>
                        {pct.toFixed(2)}%
                        {!isGoal && pct > 0 && <TrendingUp size={10} />}
                        {!isGoal && pct < 0 && <TrendingDown size={10} />}
                    </span>
                </td>
            );
        })}
    </tr>
);

export default MetasIndustriasTable;
