
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Target,
    Save,
    Calendar,
    ArrowLeft,
    TrendingUp,
    ChevronRight,
    Search,
    RefreshCw,
    Sparkles
} from 'lucide-react';
import axios from '@/lib/axios';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import './RepCrmMetasConfig.css';

const RepCrmMetasConfig = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [year, setYear] = useState(new Date().getFullYear());
    const [metas, setMetas] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    const months = [
        { key: 'met_jan', label: 'Janeiro' },
        { key: 'met_fev', label: 'Fevereiro' },
        { key: 'met_mar', label: 'Março' },
        { key: 'met_abr', label: 'Abril' },
        { key: 'met_mai', label: 'Maio' },
        { key: 'met_jun', label: 'Junho' },
        { key: 'met_jul', label: 'Julho' },
        { key: 'met_ago', label: 'Agosto' },
        { key: 'met_set', label: 'Setembro' },
        { key: 'met_out', label: 'Outubro' },
        { key: 'met_nov', label: 'Novembro' },
        { key: 'met_dez', label: 'Dezembro' }
    ];

    useEffect(() => {
        fetchMetas();
    }, [year]);

    const fetchMetas = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/metas/config', { params: { ano: year } });
            if (res.data.success) {
                setMetas(res.data.data);
            }
        } catch (error) {
            console.error('Erro fetching metas:', error);
            toast.error("Erro ao carregar metas");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (industriaId, monthKey, value) => {
        setMetas(prev => prev.map(m => {
            if (m.for_codigo === industriaId) {
                return { ...m, [monthKey]: parseFloat(value || 0) };
            }
            return m;
        }));
    };

    const saveGoal = async (goal) => {
        try {
            const res = await axios.post('/metas/save', {
                met_industria: goal.for_codigo,
                met_ano: year,
                ...goal
            });
            return res.data.success;
        } catch (error) {
            console.error('Erro ao salvar meta:', error);
            return false;
        }
    };

    const saveAll = async () => {
        setSaving(true);
        const toastId = toast.loading("Salvando metas...");

        try {
            // Salva sequencialmente para evitar sobrecarga (ou Promise.all se preferir)
            let successCount = 0;
            for (const m of metas) {
                const ok = await saveGoal(m);
                if (ok) successCount++;
            }

            toast.success(`${successCount} metas atualizadas com sucesso!`, { id: toastId });
            fetchMetas();
        } catch (error) {
            toast.error("Erro crítico ao salvar metas", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const filteredMetas = metas.filter(m =>
        m.industria_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const calculateTotalYear = (m) => {
        return months.reduce((acc, month) => acc + (m[month.key] || 0), 0);
    };

    return (
        <div className="metas-config-container custom-scrollbar">
            {/* Header Sticky */}
            <header className="metas-header">
                <div className="header-left">
                    <div className="icon-badge">
                        <Target size={24} />
                    </div>
                    <div>
                        <h1>Gestão de Metas</h1>
                        <p>Defina os objetivos anuais por representada e mês</p>
                    </div>
                </div>

                <div className="header-right">
                    <div className="year-selector">
                        <button onClick={() => setYear(y => y - 1)}><ChevronRight size={16} className="rotate-180" /></button>
                        <span>{year}</span>
                        <button onClick={() => setYear(y => y + 1)}><ChevronRight size={16} /></button>
                    </div>

                    <button
                        className="save-btn"
                        onClick={saveAll}
                        disabled={saving}
                    >
                        {saving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        Salvar Alterações
                    </button>
                </div>
            </header>

            {/* Toolbar */}
            <div className="metas-toolbar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar indústria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="toolbar-stats">
                    <div className="stat-pill">
                        <span className="label">Total Geral {year}:</span>
                        <span className="value">{formatCurrency(metas.reduce((acc, m) => acc + calculateTotalYear(m), 0))}</span>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="metas-grid-wrapper">
                {loading ? (
                    <div className="metas-loading">
                        <RefreshCw size={40} className="animate-spin text-blue-600" />
                        <p>Carregando matriz de metas...</p>
                    </div>
                ) : (
                    <table className="metas-table">
                        <thead>
                            <tr>
                                <th className="sticky-col">Indústria</th>
                                {months.map(m => <th key={m.key}>{m.label}</th>)}
                                <th className="total-col">Total Ano</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence mode='popLayout'>
                                {filteredMetas.map((m, idx) => (
                                    <motion.tr
                                        key={m.for_codigo}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                    >
                                        <td className="sticky-col industria-name">
                                            {m.industria_nome}
                                        </td>
                                        {months.map(month => (
                                            <td key={month.key} className="input-cell">
                                                <input
                                                    type="number"
                                                    value={m[month.key] || ''}
                                                    onChange={(e) => handleInputChange(m.for_codigo, month.key, e.target.value)}
                                                    placeholder="0"
                                                />
                                            </td>
                                        ))}
                                        <td className="total-col">
                                            {formatCurrency(calculateTotalYear(m))}
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>

            {/* AI Assistant Hook */}
            <div className="metas-footer-hint">
                <Sparkles size={16} className="text-blue-500" />
                <p>Dica: As metas definidas aqui alimentam o Dashboard RepCRM e os Indicadores de Desempenho em tempo real.</p>
            </div>
        </div>
    );
};

export default RepCrmMetasConfig;
