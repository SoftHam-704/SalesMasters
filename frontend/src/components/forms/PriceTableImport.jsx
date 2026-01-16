import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Upload, AlertCircle, CheckCircle2, Info, Sparkles, X, FileSpreadsheet,
    Calendar, Factory, Tag, Package, FileText, Barcode, ChevronLeft, ChevronRight
} from 'lucide-react';
import InputField from '../InputField';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import { cn } from '@/lib/utils';

// Smart Split function for Excel data
const smartSplit = (text) => {
    if (!text) return { lines: [], adjustedCount: 0 };

    const rawLines = text.split(/\r?\n/);
    const rows = [];
    let currentCell = '';
    let inQuotedCell = false;
    let adjustedCount = 0;

    for (let i = 0; i < rawLines.length; i++) {
        let line = rawLines[i];

        if (!inQuotedCell) {
            if (line.trim().startsWith('"')) {
                if (line.trim().endsWith('"') && line.trim().length > 1 && !line.trim().endsWith('""')) {
                    rows.push(line.trim());
                } else {
                    inQuotedCell = true;
                    currentCell = line;
                }
            } else {
                if (line.trim() !== '') {
                    rows.push(line.trim());
                }
            }
        } else {
            adjustedCount++;
            currentCell += '\n' + line;

            if (line.trim().endsWith('"') && !line.trim().endsWith('""')) {
                inQuotedCell = false;
                rows.push(currentCell.trim());
                currentCell = '';
            }
        }
    }

    if (inQuotedCell) {
        rows.push(currentCell.trim());
    }

    const processedLines = rows.map(r => {
        let val = r;
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1);
        }
        return val.replace(/""/g, '"').replace(/\n/g, ' ').trim();
    }).filter(r => r !== '');

    return { lines: processedLines, adjustedCount };
};

const PriceTableImport = () => {
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(0);
    const [direction, setDirection] = useState(0);

    const [formData, setFormData] = useState({
        industria: '',
        nomeTabela: '',
        tabelaExistente: '',
        grupoDesconto: '',
        dataTabela: new Date().toISOString().split('T')[0],
        dataVencimento: '',
    });

    const [textareas, setTextareas] = useState({
        codigo: '',
        complemento: '',
        nome: '',
        precobruto: '',
        precopromo: '',
        precoespecial: '',
        grupo: '',
        aplicacao: '',
        embalagem: '',
        peso: '',
        ipi: '',
        st: '',
        codigooriginal: '',
        codbarras: '',
        descontoadd: '',
        ncm: '',
        curva: '',
        categoria: '',
        conversao: ''
    });

    const [lineCounts, setLineCounts] = useState({});
    const [adjustments, setAdjustments] = useState({});
    const [isValid, setIsValid] = useState(false);
    const [industries, setIndustries] = useState([]);
    const [existingTables, setExistingTables] = useState([]);
    const [discountGroups, setDiscountGroups] = useState([]);
    const [importing, setImporting] = useState(false);
    const [result, setResult] = useState(null);
    const [progress, setProgress] = useState({ current: 0, total: 0, percentage: 0 });

    // Tab definitions
    const tabs = [
        {
            id: 0,
            label: 'Dados Principais',
            icon: Package,
            color: 'emerald',
            // Reorganized: Line 1: codigo, complemento | Line 2: nome (full) | Line 3: precos
            fields: ['codigo', 'complemento', 'nome', 'precobruto', 'precopromo', 'precoespecial']
        },
        {
            id: 1,
            label: 'Detalhes do Produto',
            icon: FileText,
            color: 'blue',
            fields: ['grupo', 'aplicacao', 'embalagem', 'peso', 'ipi', 'st']
        },
        {
            id: 2,
            label: 'Códigos e Classificações',
            icon: Barcode,
            color: 'purple',
            fields: ['codigooriginal', 'codbarras', 'descontoadd', 'ncm', 'curva', 'categoria', 'conversao']
        }
    ];

    const fieldLabels = {
        codigo: { label: 'Código', required: true },
        complemento: { label: 'Complemento', required: false },
        nome: { label: 'Nome do Produto', required: true, fullWidth: true },
        precobruto: { label: 'Preço Bruto', required: true },
        precopromo: { label: 'Preço Promoção', required: false },
        precoespecial: { label: 'Preço Especial', required: false },
        grupo: { label: 'Grupo de Produtos', required: false },
        aplicacao: { label: 'Aplicação', required: false, wide: true },
        embalagem: { label: 'Embalagem', required: false },
        peso: { label: 'Peso', required: false },
        ipi: { label: '% IPI', required: false },
        st: { label: '% ST', required: false },
        codigooriginal: { label: 'Código Original', required: false },
        codbarras: { label: 'Código de Barras', required: false },
        descontoadd: { label: 'Desconto Adicional', required: false },
        ncm: { label: 'NCM', required: false },
        curva: { label: 'Curva ABC', required: false },
        categoria: { label: 'Categoria', required: false },
        conversao: { label: 'Conversão', required: false }
    };

    // Load industries
    useEffect(() => {
        if (location.state?.industriaId) {
            setFormData(prev => ({ ...prev, industria: location.state.industriaId.toString() }));
        }
    }, [location.state]);

    useEffect(() => {
        fetch(getApiUrl(NODE_API_URL, '/api/suppliers'))
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setIndustries(data.data);
                }
            })
            .catch(err => console.error('Erro ao carregar indústrias:', err));
    }, []);

    useEffect(() => {
        fetch(getApiUrl(NODE_API_URL, '/api/v2/discount-groups'))
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setDiscountGroups(data.data);
                }
            })
            .catch(err => console.error('Erro ao carregar grupos de desconto:', err));
    }, []);

    useEffect(() => {
        if (formData.industria) {
            fetch(getApiUrl(NODE_API_URL, `/api/price-tables/${formData.industria}`))
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setExistingTables(data.data);
                    }
                })
                .catch(err => console.error('Erro ao carregar tabelas:', err));
        } else {
            setExistingTables([]);
        }
    }, [formData.industria]);

    useEffect(() => {
        const counts = {};
        const adjs = {};
        Object.keys(textareas).forEach(key => {
            const { lines, adjustedCount } = smartSplit(textareas[key]);
            counts[key] = lines.length;
            adjs[key] = adjustedCount;
        });
        setLineCounts(counts);
        setAdjustments(adjs);

        const nonEmptyCounts = Object.values(counts).filter(count => count > 0);
        const allEqual = nonEmptyCounts.length > 0 &&
            nonEmptyCounts.every(count => count === nonEmptyCounts[0]);
        setIsValid(allEqual && nonEmptyCounts[0] > 0);
    }, [textareas]);

    const handleTextareaChange = (field, value) => {
        setTextareas(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const navigateTab = (newTab) => {
        setDirection(newTab > activeTab ? 1 : -1);
        setActiveTab(newTab);
    };

    const handleImport = async () => {
        if (!formData.industria || !formData.nomeTabela) {
            alert('Por favor, preencha Indústria e Nome da Tabela!');
            return;
        }

        if (!isValid) {
            alert('Os campos não têm o mesmo número de linhas!');
            return;
        }

        setImporting(true);
        setResult(null);

        try {
            const { lines: linhasCodigo } = smartSplit(textareas.codigo);
            const totalProdutos = linhasCodigo.length;

            const parseValue = (val) => {
                if (!val) return 0;
                const cleaned = val.toString().replace(/[^\d,.-]/g, '');
                if (cleaned.includes(',') && cleaned.includes('.')) {
                    return parseFloat(cleaned.replace(/\./g, '').replace(',', '.')) || 0;
                }
                return parseFloat(cleaned.replace(',', '.')) || 0;
            };

            const produtos = linhasCodigo.map((_, index) => {
                const getLinha = (field) => {
                    const { lines } = smartSplit(textareas[field]);
                    return lines[index] || '';
                };

                return {
                    codigo: getLinha('codigo'),
                    complemento: getLinha('complemento'),
                    descricao: getLinha('nome'),
                    precobruto: parseValue(getLinha('precobruto')),
                    precopromo: parseValue(getLinha('precopromo')),
                    precoespecial: parseValue(getLinha('precoespecial')),
                    grupo: getLinha('grupo'),
                    aplicacao: getLinha('aplicacao'),
                    embalagem: parseInt(getLinha('embalagem').replace(/\D/g, '')) || 1,
                    peso: parseValue(getLinha('peso')),
                    ipi: parseValue(getLinha('ipi')),
                    st: parseValue(getLinha('st')),
                    codigooriginal: getLinha('codigooriginal'),
                    codbarras: getLinha('codbarras'),
                    descontoadd: parseValue(getLinha('descontoadd')),
                    ncm: getLinha('ncm'),
                    curva: getLinha('curva'),
                    categoria: getLinha('categoria'),
                    conversao: getLinha('conversao')
                };
            });

            const TAMANHO_LOTE = 200;
            const lotes = [];
            for (let i = 0; i < produtos.length; i += TAMANHO_LOTE) {
                lotes.push(produtos.slice(i, i + TAMANHO_LOTE));
            }

            setProgress({ current: 0, total: lotes.length, percentage: 0 });

            let totalInseridos = 0;
            let totalAtualizados = 0;
            let totalErros = 0;
            const detalhesErros = [];

            for (let i = 0; i < lotes.length; i++) {
                const lote = lotes[i];
                const numeroLote = i + 1;

                const percentage = Math.round((numeroLote / lotes.length) * 100);
                setProgress({ current: numeroLote, total: lotes.length, percentage });

                const payload = {
                    industria: parseInt(formData.industria),
                    nomeTabela: formData.nomeTabela.toUpperCase(),
                    grupoDesconto: formData.grupoDesconto && formData.grupoDesconto !== 'none'
                        ? parseInt(formData.grupoDesconto)
                        : null,
                    dataTabela: formData.dataTabela,
                    dataVencimento: formData.dataVencimento || null,
                    produtos: lote
                };

                const response = await fetch(getApiUrl(NODE_API_URL, '/api/price-tables/import'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (data.success) {
                    totalInseridos += data.resumo.produtosNovos || 0;
                    totalAtualizados += data.resumo.produtosAtualizados || 0;
                    totalErros += data.resumo.erros || 0;

                    if (data.resumo.detalhesErros && data.resumo.detalhesErros.length > 0) {
                        detalhesErros.push(...data.resumo.detalhesErros);
                    }
                } else {
                    throw new Error(data.message || 'Erro ao processar lote');
                }
            }

            setResult({
                success: true,
                message: 'Importação concluída com sucesso!',
                resumo: {
                    total: totalProdutos,
                    inseridos: totalInseridos,
                    atualizados: totalAtualizados,
                    erros: totalErros,
                    detalhesErros: detalhesErros
                }
            });

        } catch (error) {
            console.error('❌ Erro na importação:', error);
            setResult({
                success: false,
                message: `Erro na importação: ${error.message}`
            });
        } finally {
            setImporting(false);
        }
    };

    const getLineCountColor = (field) => {
        const count = lineCounts[field] || 0;
        if (count === 0) return 'text-slate-400';

        const nonZeroCounts = Object.values(lineCounts).filter(c => c > 0);
        const maxCount = Math.max(...nonZeroCounts);

        return count === maxCount ? 'text-emerald-600 font-bold' : 'text-red-500 font-bold';
    };

    // Get count for each tab
    const getTabCount = (tabIndex) => {
        const tab = tabs[tabIndex];
        const counts = tab.fields.map(f => lineCounts[f] || 0).filter(c => c > 0);
        return counts.length > 0 ? counts[0] : 0;
    };

    // Textarea Component
    const TextareaField = ({ field }) => {
        const config = fieldLabels[field];
        const count = lineCounts[field] || 0;
        const adjustment = adjustments[field] || 0;

        return (
            <div className={cn(
                "flex flex-col rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-lg hover:border-emerald-400 group",
                config.fullWidth && "md:col-span-2 lg:col-span-3",
                config.wide && "md:col-span-2"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                    <Label className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        {config.label}
                        {config.required && <span className="text-red-500 text-lg">*</span>}
                    </Label>
                    <div className="flex items-center gap-3">
                        {adjustment > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                                <Sparkles size={12} />
                                <span>{adjustment} ajustadas</span>
                            </div>
                        )}
                        <span
                            className={cn(
                                "text-xs px-3 py-1 rounded-full cursor-pointer transition-all",
                                count > 0 ? getLineCountColor(field) + " bg-slate-100 hover:bg-red-100" : "text-slate-400 bg-slate-50"
                            )}
                            onClick={() => handleTextareaChange(field, '')}
                            title="Clique para limpar"
                        >
                            {count} linhas
                        </span>
                    </div>
                </div>

                {/* Textarea */}
                <div className="relative flex-1">
                    <textarea
                        value={textareas[field]}
                        onChange={(e) => handleTextareaChange(field, e.target.value)}
                        className={cn(
                            "w-full h-[180px] p-4 text-sm font-mono resize-none border-0",
                            "focus:ring-4 focus:ring-emerald-500/20 focus:outline-none",
                            "overflow-x-auto whitespace-pre transition-all",
                            "placeholder:text-slate-400"
                        )}
                        placeholder={`Cole aqui os dados de ${config.label.toLowerCase()}...`}
                        style={{ whiteSpace: 'pre', overflowWrap: 'normal' }}
                    />
                </div>
            </div>
        );
    };

    const clearAll = () => {
        setTextareas({
            codigo: '', complemento: '', nome: '', precobruto: '',
            precopromo: '', precoespecial: '', grupo: '', aplicacao: '',
            embalagem: '', peso: '', ipi: '', st: '', codigooriginal: '',
            codbarras: '', descontoadd: '', ncm: '', curva: '',
            categoria: '', conversao: ''
        });
        setResult(null);
    };

    // Slide animation variants
    const slideVariants = {
        enter: (direction) => ({
            x: direction > 0 ? 500 : -500,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction) => ({
            zIndex: 0,
            x: direction < 0 ? 500 : -500,
            opacity: 0
        })
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50/50 p-6">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl shadow-emerald-500/30">
                            <FileSpreadsheet className="w-10 h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                                Importação de <span className="text-emerald-600">Tabela de Preços</span>
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">Cole os dados do Excel nos campos correspondentes</p>
                        </div>
                    </div>

                    {isValid && (
                        <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-3 px-5 py-3 bg-emerald-50 border-2 border-emerald-200 rounded-2xl shadow-lg"
                        >
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            <span className="text-base font-black text-emerald-700">
                                {lineCounts.codigo} produtos prontos!
                            </span>
                        </motion.div>
                    )}
                </div>

                {/* Configuration Card */}
                <Card className="border-2 border-slate-200 shadow-lg rounded-2xl overflow-hidden">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-12 gap-4">
                            {/* Indústria */}
                            <div className="col-span-12 lg:col-span-3">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <Factory className="w-4 h-4 text-emerald-600" />
                                    Indústria *
                                </Label>
                                <Select
                                    value={formData.industria}
                                    onValueChange={(val) => {
                                        setFormData({ ...formData, industria: val, tabelaExistente: '', nomeTabela: '' });
                                    }}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 bg-white hover:border-emerald-400 transition-colors">
                                        <SelectValue placeholder="Selecione a indústria..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map(ind => (
                                            <SelectItem key={ind.for_codigo} value={ind.for_codigo.toString()}>
                                                <span className="font-medium">{ind.for_nomered}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Nome da Tabela */}
                            <div className="col-span-12 lg:col-span-3">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-blue-600" />
                                    Nome da Tabela *
                                </Label>
                                {formData.industria && existingTables.length > 0 ? (
                                    <Select
                                        value={formData.nomeTabela}
                                        onValueChange={(val) => {
                                            if (val === '__NEW__') {
                                                setFormData({ ...formData, nomeTabela: '' });
                                            } else {
                                                setFormData({ ...formData, nomeTabela: val });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 bg-white uppercase font-bold hover:border-blue-400 transition-colors">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__NEW__" className="text-emerald-600 font-bold">
                                                ➕ CRIAR NOVA TABELA
                                            </SelectItem>
                                            {existingTables.map((table, idx) => (
                                                <SelectItem key={idx} value={table.nome_tabela}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="font-bold">{table.nome_tabela}</span>
                                                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                                            {table.total_produtos} produtos
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <input
                                        type="text"
                                        value={formData.nomeTabela}
                                        onChange={(e) => setFormData({ ...formData, nomeTabela: e.target.value.toUpperCase() })}
                                        placeholder="Ex: PADRAO, PROMOCIONAL"
                                        className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white uppercase font-bold text-slate-800 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all hover:border-emerald-400"
                                        disabled={!formData.industria}
                                    />
                                )}
                            </div>

                            {/* Grupo de Desconto */}
                            <div className="col-span-12 lg:col-span-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                    Grupo Desconto
                                </Label>
                                <Select
                                    value={formData.grupoDesconto}
                                    onValueChange={(val) => setFormData({ ...formData, grupoDesconto: val })}
                                >
                                    <SelectTrigger className="h-12 rounded-xl border-2 border-slate-200 bg-white hover:border-purple-400 transition-colors">
                                        <SelectValue placeholder="Nenhum" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Nenhum</SelectItem>
                                        {discountGroups.map(grupo => (
                                            <SelectItem key={grupo.gde_id} value={grupo.gde_id.toString()}>
                                                {grupo.gde_nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Datas */}
                            <div className="col-span-6 lg:col-span-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-600" />
                                    Data Tabela
                                </Label>
                                <input
                                    type="date"
                                    value={formData.dataTabela}
                                    onChange={(e) => setFormData({ ...formData, dataTabela: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div className="col-span-6 lg:col-span-2">
                                <Label className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-2">
                                    Validade
                                </Label>
                                <input
                                    type="date"
                                    value={formData.dataVencimento}
                                    onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Status Banner */}
                        {formData.nomeTabela && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={cn(
                                    "mt-4 p-3 rounded-xl flex items-center gap-3",
                                    existingTables.some(t => t.nome_tabela === formData.nomeTabela)
                                        ? "bg-amber-50 border-2 border-amber-200"
                                        : "bg-emerald-50 border-2 border-emerald-200"
                                )}
                            >
                                {existingTables.some(t => t.nome_tabela === formData.nomeTabela) ? (
                                    <>
                                        <AlertCircle className="w-5 h-5 text-amber-600" />
                                        <div>
                                            <p className="text-sm font-bold text-amber-800">Modo: ATUALIZAR TABELA</p>
                                            <p className="text-xs text-amber-700">Códigos existentes serão atualizados</p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        <div>
                                            <p className="text-sm font-bold text-emerald-800">Modo: CRIAR NOVA TABELA</p>
                                            <p className="text-xs text-emerald-700">Tabela "{formData.nomeTabela}" será criada</p>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                    </CardContent>
                </Card>

                {/* Tab Navigation */}
                <div className="flex items-center justify-between bg-white rounded-2xl border-2 border-slate-200 p-2 shadow-lg">
                    {/* Previous Button */}
                    <button
                        onClick={() => navigateTab(Math.max(0, activeTab - 1))}
                        disabled={activeTab === 0}
                        className={cn(
                            "p-3 rounded-xl transition-all",
                            activeTab === 0
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    {/* Tabs */}
                    <div className="flex items-center gap-2">
                        {tabs.map((tab, index) => {
                            const Icon = tab.icon;
                            const count = getTabCount(index);
                            const isActive = activeTab === index;

                            return (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => navigateTab(index)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={cn(
                                        "relative flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all",
                                        isActive
                                            ? `bg-gradient-to-r from-${tab.color}-500 to-${tab.color}-600 text-white shadow-lg`
                                            : "text-slate-600 hover:bg-slate-100"
                                    )}
                                    style={isActive ? {
                                        background: tab.color === 'emerald'
                                            ? 'linear-gradient(to right, #10b981, #059669)'
                                            : tab.color === 'blue'
                                                ? 'linear-gradient(to right, #3b82f6, #2563eb)'
                                                : 'linear-gradient(to right, #8b5cf6, #7c3aed)'
                                    } : {}}
                                >
                                    <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
                                    <span className="hidden md:inline">{tab.label}</span>
                                    {count > 0 && (
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-full text-xs font-black",
                                            isActive ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-700"
                                        )}>
                                            {count}
                                        </span>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Next Button */}
                    <button
                        onClick={() => navigateTab(Math.min(tabs.length - 1, activeTab + 1))}
                        disabled={activeTab === tabs.length - 1}
                        className={cn(
                            "p-3 rounded-xl transition-all",
                            activeTab === tabs.length - 1
                                ? "text-slate-300 cursor-not-allowed"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        )}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>

                {/* Swipe Indicator */}
                <div className="flex items-center justify-center gap-2">
                    {tabs.map((_, index) => (
                        <motion.div
                            key={index}
                            className={cn(
                                "h-2 rounded-full transition-all",
                                activeTab === index ? "w-8 bg-emerald-500" : "w-2 bg-slate-300"
                            )}
                        />
                    ))}
                </div>

                {/* Tab Content with Slide Animation */}
                <div className="relative overflow-hidden rounded-2xl bg-slate-50 border-2 border-slate-200 min-h-[500px]">
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={activeTab}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 }
                            }}
                            className="p-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {tabs[activeTab].fields.map(field => (
                                    <TextareaField key={field} field={field} />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Alerts */}
                {!isValid && Object.values(lineCounts).some(c => c > 0) && (
                    <Alert variant="destructive" className="bg-red-50 border-2 border-red-200 rounded-xl">
                        <AlertCircle className="h-5 w-5" />
                        <AlertDescription className="text-sm">
                            <strong>Atenção!</strong> Número de linhas inconsistente. Todos os campos devem ter o mesmo número de linhas.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Progress Bar */}
                {importing && progress.total > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl space-y-4"
                    >
                        <div className="flex justify-between items-center">
                            <span className="text-base font-bold text-blue-900">
                                Processando lote {progress.current} de {progress.total}
                            </span>
                            <span className="text-2xl font-black text-blue-700">{progress.percentage}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-4 overflow-hidden">
                            <motion.div
                                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress.percentage}%` }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Result */}
                {result && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Alert className={cn(
                            "rounded-2xl border-2",
                            result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
                        )}>
                            {result.success ? (
                                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            ) : (
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            )}
                            <AlertDescription className={result.success ? 'text-emerald-800' : 'text-red-800'}>
                                <strong className="text-lg">{result.message}</strong>
                                {result.resumo && (
                                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="p-4 bg-white rounded-xl border-2 border-slate-200">
                                            <p className="text-xs text-slate-500 uppercase font-bold">Total</p>
                                            <p className="text-2xl font-black text-slate-800">{result.resumo.total}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border-2 border-emerald-200">
                                            <p className="text-xs text-emerald-600 uppercase font-bold">Inseridos</p>
                                            <p className="text-2xl font-black text-emerald-700">{result.resumo.inseridos}</p>
                                        </div>
                                        <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
                                            <p className="text-xs text-blue-600 uppercase font-bold">Atualizados</p>
                                            <p className="text-2xl font-black text-blue-700">{result.resumo.atualizados}</p>
                                        </div>
                                        {result.resumo.erros > 0 && (
                                            <div className="p-4 bg-white rounded-xl border-2 border-red-200">
                                                <p className="text-xs text-red-600 uppercase font-bold">Erros</p>
                                                <p className="text-2xl font-black text-red-700">{result.resumo.erros}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t-2 border-slate-200">
                    <Alert className="bg-blue-50 border-2 border-blue-200 rounded-xl flex-1 mr-4">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 text-sm">
                            <strong>Dica:</strong> Use as setas ← → ou clique nas abas para navegar entre as categorias.
                        </AlertDescription>
                    </Alert>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            onClick={clearAll}
                            className="h-12 px-6 rounded-xl border-2"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Limpar Tudo
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={!isValid || importing || !formData.industria || !formData.nomeTabela}
                            className={cn(
                                "h-12 px-8 rounded-xl font-bold text-base transition-all",
                                !isValid || !formData.industria || !formData.nomeTabela
                                    ? "bg-slate-200 text-slate-400 border-2 border-slate-300 shadow-none cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-xl shadow-emerald-500/30 text-white"
                            )}
                        >
                            {importing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Importando...
                                </>
                            ) : (
                                <>
                                    {!formData.industria ? (
                                        <>
                                            <Factory className="w-5 h-5 mr-2 opacity-50" />
                                            Selecione a Indústria
                                        </>
                                    ) : !formData.nomeTabela ? (
                                        <>
                                            <Tag className="w-5 h-5 mr-2 opacity-50" />
                                            Nomeie a Tabela
                                        </>
                                    ) : !isValid ? (
                                        <>
                                            <AlertCircle className="w-5 h-5 mr-2 opacity-50" />
                                            Verifique as Linhas
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="w-5 h-5 mr-2" />
                                            Importar Tabela
                                        </>
                                    )}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PriceTableImport;
