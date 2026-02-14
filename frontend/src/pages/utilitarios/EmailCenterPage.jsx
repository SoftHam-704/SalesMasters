import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mail, Users, Target, Cake, Building2, Search, Send,
    Trash2, X, CheckCircle2, AlertCircle, Loader2,
    Paperclip, FileText, ChevronRight, CheckSquare, Square,
    Zap, ShieldCheck, MapPin, ArrowLeft, Eye, EyeOff, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl, NODE_API_URL } from '../../utils/apiConfig';
import { useTabs } from '../../contexts/TabContext';

const EmailCenterPage = () => {
    const { closeTab } = useTabs();

    // Tab System
    const [activeTab, setActiveTab] = useState('composicao');

    // Form States
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [isMassSend, setIsMassSend] = useState(false);

    // Filter & Data States
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedClients, setSelectedClients] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [confirmedRecipients, setConfirmedRecipients] = useState([]);

    // Filter Specific States
    const [atuacaoOptions, setAtuacaoOptions] = useState([]);
    const [selectedAtuacao, setSelectedAtuacao] = useState([]);
    const [atuacaoSearch, setAtuacaoSearch] = useState('');

    // Default birthday range: current month
    const [birthdayRange, setBirthdayRange] = useState(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const formatDate = (date) => {
            const d = date.getDate().toString().padStart(2, '0');
            const m = (date.getMonth() + 1).toString().padStart(2, '0');
            return `${date.getFullYear()}-${m}-${d}`;
        };

        return {
            start: formatDate(firstDay),
            end: formatDate(lastDay)
        };
    });

    const [industriaOptions, setIndustriaOptions] = useState([]);
    const [selectedIndustria, setSelectedIndustria] = useState(null);

    // Sending State
    const [sendProgress, setSendProgress] = useState({
        sending: false,
        current: 0,
        total: 0,
        logs: []
    });

    // Tabs Definition
    const tabs = [
        { id: 'composicao', label: 'Composição', icon: Mail },
        { id: 'contatos', label: 'Destinatários', icon: Users },
        { id: 'atuacao', label: 'Área de Atuação', icon: Target },
        { id: 'aniversariantes', label: 'Aniversários', icon: Cake },
        { id: 'industria', label: 'Por Indústria', icon: Building2 },
        { id: 'prospeccao', label: 'Prospecção', icon: Search },
    ];

    useEffect(() => {
        const loadAux = async () => {
            try {
                const [atuRes, indRes] = await Promise.all([
                    fetch(getApiUrl(NODE_API_URL, '/api/marketing/filter-options/atuacao')),
                    fetch(getApiUrl(NODE_API_URL, '/api/marketing/filter-options/industrias'))
                ]);
                if (atuRes.ok) { const j = await atuRes.json(); setAtuacaoOptions(j.data || []); }
                if (indRes.ok) { const j = await indRes.json(); setIndustriaOptions(j.data || []); }
            } catch (e) { console.error(e); }
        };
        loadAux();
    }, []);

    const fetchFilteredClients = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('filterType', activeTab);
            if (['contatos', 'industria', 'prospeccao'].includes(activeTab) && searchQuery) {
                params.append('search', searchQuery);
            }
            if (activeTab === 'atuacao' && selectedAtuacao.length > 0) params.append('atuacao_ids', selectedAtuacao.join(','));
            if (activeTab === 'aniversariantes') {
                if (birthdayRange.start) params.append('dt_start', birthdayRange.start);
                if (birthdayRange.end) params.append('dt_end', birthdayRange.end);
            }
            if ((activeTab === 'industria' || activeTab === 'prospeccao') && selectedIndustria) {
                params.append('industria_id', selectedIndustria);
            }

            const res = await fetch(getApiUrl(NODE_API_URL, `/api/marketing/filter-clients?${params.toString()}`));
            const data = await res.json();
            if (data.success) {
                setClients(data.data);
                toast.success(`${data.data.length} clientes encontrados.`);
            } else {
                toast.error(data.message || 'Erro ao filtrar clientes');
            }
        } catch (err) {
            toast.error('Erro de conexão com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const toggleClientSelection = (clientId) => {
        const newSelected = new Set(selectedClients);
        if (newSelected.has(clientId)) {
            newSelected.delete(clientId);
        } else {
            newSelected.add(clientId);
        }
        setSelectedClients(newSelected);
    };

    const toggleAll = () => {
        if (selectedClients.size === clients.length) {
            setSelectedClients(new Set());
        } else {
            setSelectedClients(new Set(clients.map(c => c.cli_codigo)));
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setAttachments([...attachments, ...files]);
    };

    const removeAttachment = (index) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve({
                filename: file.name,
                content: reader.result.split(',')[1],
                contentType: file.type
            });
            reader.onerror = (error) => reject(error);
        });
    };

    const handleConfirmSelection = () => {
        const selected = clients.filter(c => selectedClients.has(c.cli_codigo));
        if (selected.length === 0) {
            toast.error('Selecione ao menos um cliente.');
            return;
        }
        setConfirmedRecipients(selected);
        setActiveTab('composicao');
        toast.success(`${selected.length} destinatários confirmados. Volte para a aba Composição.`);
    };

    const handleStartSending = async () => {
        if (confirmedRecipients.length === 0) {
            toast.error('Confirme os destinatários primeiro (use as abas de filtro).');
            return;
        }
        if (!subject || !message) {
            toast.error('Assunto e mensagem são obrigatórios.');
            return;
        }

        const total = confirmedRecipients.length;
        setSendProgress({ sending: true, current: 0, total, logs: ['Processando anexos...'] });

        try {
            const processedAttachments = await Promise.all(attachments.map(file => fileToBase64(file)));
            setSendProgress(prev => ({ ...prev, logs: [...prev.logs, `Iniciando envio para ${total} destinatários...`] }));

            const batchSize = isMassSend ? 10 : total;
            const user = JSON.parse(sessionStorage.getItem('user'));

            for (let i = 0; i < confirmedRecipients.length; i += batchSize) {
                const batch = confirmedRecipients.slice(i, i + batchSize);
                const toRecipient = batch.length > 0 ? batch[0].cli_email : null;
                const bccRecipients = batch.slice(1).map(c => c.cli_email);

                const res = await fetch(getApiUrl(NODE_API_URL, '/api/marketing/send-bulk'), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        recipients: toRecipient ? [toRecipient] : [],
                        bccRecipients: bccRecipients,
                        subject,
                        message,
                        attachments: processedAttachments,
                        isMass: isMassSend,
                        userId: user.id
                    })
                });

                const result = await res.json();
                setSendProgress(prev => ({
                    ...prev,
                    current: Math.min(prev.current + batch.length, total),
                    logs: [...prev.logs, `${result.success ? '✅' : '❌'} Lote ${Math.floor(i / batchSize) + 1}: ${result.message}`]
                }));

                if (isMassSend) await new Promise(r => setTimeout(r, 1000));
            }

            toast.success('Processo de envio finalizado!');
        } catch (e) {
            toast.error('Erro durante o envio.');
        } finally {
            setSendProgress(prev => ({ ...prev, sending: false }));
        }
    };

    // ============================================================
    // RENDER: Tab content based on activeTab
    // ============================================================
    const renderFilterContent = () => {
        return (
            <div className="space-y-6">
                {/* Seção: Filtros */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Search size={18} />
                            </div>
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">
                                {activeTab === 'contatos' && 'I – Buscar Destinatários'}
                                {activeTab === 'atuacao' && 'I – Filtrar por Área de Atuação'}
                                {activeTab === 'aniversariantes' && 'I – Filtrar por Aniversário'}
                                {activeTab === 'industria' && 'I – Filtrar por Indústria'}
                                {activeTab === 'prospeccao' && 'I – Filtrar por Prospecção'}
                            </h3>
                        </div>
                    </div>
                    <div className="p-8">
                        <div className="flex items-end gap-6">
                            {activeTab === 'contatos' && (
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 block">Pesquisar Contatos</label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Busque por nome, e-mail, cidade..."
                                            className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'atuacao' && (
                                <div className="flex-1">
                                    <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4 block flex justify-between items-center">
                                        <span>Áreas de Atuação (Selecione múltiplas)</span>
                                        <div className="relative w-64 normal-case">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3 h-3" />
                                            <input
                                                type="text"
                                                placeholder="Filtrar áreas..."
                                                value={atuacaoSearch}
                                                onChange={(e) => setAtuacaoSearch(e.target.value)}
                                                className="w-full h-8 bg-white border border-slate-200 rounded-lg pl-8 pr-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                                            />
                                        </div>
                                    </label>
                                    <div className="grid grid-cols-4 gap-2 max-h-[220px] overflow-y-auto custom-scrollbar p-2 bg-slate-50/50 rounded-2xl border border-slate-100">
                                        {atuacaoOptions
                                            .filter(opt => opt.atu_nome.toLowerCase().includes(atuacaoSearch.toLowerCase()))
                                            .map(opt => {
                                                const isSelected = selectedAtuacao.includes(opt.atu_codigo);
                                                return (
                                                    <button
                                                        key={opt.atu_codigo}
                                                        onClick={() => {
                                                            const newSel = isSelected
                                                                ? selectedAtuacao.filter(id => id !== opt.atu_codigo)
                                                                : [...selectedAtuacao, opt.atu_codigo];
                                                            setSelectedAtuacao(newSel);
                                                        }}
                                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all text-left ${isSelected
                                                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {isSelected ? <CheckSquare size={14} /> : <Square size={14} className="text-slate-300" />}
                                                        <span className="text-[10px] font-black uppercase tracking-wider truncate">{opt.atu_nome}</span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'aniversariantes' && (
                                <div className="flex gap-6">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Data Início</label>
                                        <input
                                            type="date"
                                            value={birthdayRange.start}
                                            onChange={e => setBirthdayRange({ ...birthdayRange, start: e.target.value })}
                                            className="h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-4 font-mono text-slate-700 outline-none"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Data Fim</label>
                                        <input
                                            type="date"
                                            value={birthdayRange.end}
                                            onChange={e => setBirthdayRange({ ...birthdayRange, end: e.target.value })}
                                            className="h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-4 font-mono text-slate-700 outline-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {(activeTab === 'industria' || activeTab === 'prospeccao') && (
                                <>
                                    <div className="flex-1 max-w-sm">
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 block">Indústria de Referência</label>
                                        <select
                                            value={selectedIndustria || ''}
                                            onChange={e => setSelectedIndustria(e.target.value)}
                                            className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                                        >
                                            <option value="">Selecione uma indústria...</option>
                                            {industriaOptions.map(ind => (
                                                <option key={ind.ind_codigo} value={ind.ind_codigo}>{ind.ind_nome}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-2 block">Filtrar por nome (opcional)</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="Busque cliente..."
                                                className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl pl-11 pr-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            <button
                                onClick={fetchFilteredClients}
                                className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 rounded-xl text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-emerald-600/20"
                            >
                                <Search size={14} /> Buscar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Seção: Lista de Resultados */}
                <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Users size={18} />
                            </div>
                            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">II – Resultados encontrados</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleAll}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:bg-blue-50 hover:border-blue-200 transition-all uppercase tracking-widest"
                            >
                                {selectedClients.size === clients.length && clients.length > 0 ? <CheckSquare size={14} className="text-blue-600" /> : <Square size={14} />}
                                Marcar Todos
                            </button>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl uppercase tracking-widest">
                                {selectedClients.size} selecionados
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Total: {clients.length}
                            </span>
                        </div>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {/* Table Header */}
                        <div className="grid grid-cols-[50px_1fr_2fr_1fr] bg-slate-50 border-b border-slate-100 px-6 py-3 sticky top-0 z-10">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sel</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome / Razão Social</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail</span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cidade/UF</span>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4">
                                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest italic animate-pulse">Consultando base de dados...</p>
                            </div>
                        ) : clients.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-300">
                                <Target size={48} className="opacity-20" />
                                <p className="text-xs font-black uppercase tracking-widest">Utilize os filtros acima para listar clientes</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {clients.map(client => (
                                    <div
                                        key={client.cli_codigo}
                                        className={`grid grid-cols-[50px_1fr_2fr_1fr] px-6 py-3 items-center hover:bg-slate-50/80 transition-colors cursor-pointer group ${selectedClients.has(client.cli_codigo) ? 'bg-blue-50/40' : ''}`}
                                        onClick={() => toggleClientSelection(client.cli_codigo)}
                                    >
                                        <div className="flex justify-center">
                                            {selectedClients.has(client.cli_codigo) ? (
                                                <CheckSquare size={16} className="text-blue-600" />
                                            ) : (
                                                <Square size={16} className="text-slate-200 group-hover:text-blue-300" />
                                            )}
                                        </div>
                                        <div className="flex flex-col overflow-hidden pr-4">
                                            <span className="text-xs font-black text-slate-800 truncate uppercase">{client.cli_nome}</span>
                                            <span className="text-[10px] font-bold text-slate-400 truncate tracking-widest italic">{client.cli_fantasia}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Mail size={12} className="text-slate-300" />
                                            <span className="text-xs font-bold text-slate-600 truncate">{client.cli_email || 'SEM E-MAIL'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-slate-700 truncate uppercase">{client.cli_cidade}</span>
                                            <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{client.cli_uf}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Confirm Button */}
                    {clients.length > 0 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={handleConfirmSelection}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-600/20 hover:scale-[1.02]"
                            >
                                <CheckCircle2 size={16} /> Confirmar {selectedClients.size} selecionados e voltar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderComposicao = () => (
        <div className="space-y-6">
            {/* Seção I: Destinatários confirmados */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                            <UserCheck size={18} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">I – Destinatários Confirmados</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {confirmedRecipients.length > 0 && (
                            <>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <Eye size={12} className="text-emerald-600" />
                                    <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                                        Para: {confirmedRecipients[0]?.cli_email}
                                    </span>
                                </div>
                                {confirmedRecipients.length > 1 && (
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-100">
                                        <EyeOff size={12} className="text-amber-600" />
                                        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                                            BCC: {confirmedRecipients.length - 1} em cópia oculta
                                        </span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="p-8">
                    {confirmedRecipients.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-300 gap-3">
                            <Users size={40} className="opacity-30" />
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum destinatário selecionado</p>
                            <p className="text-[10px] font-bold text-slate-400">Use as abas acima para filtrar e selecionar os clientes</p>
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto custom-scrollbar">
                            {confirmedRecipients.map((client, index) => (
                                <div
                                    key={client.cli_codigo}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all ${index === 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-slate-50 text-slate-600 border-slate-200'
                                        }`}
                                >
                                    {index === 0 ? <Eye size={10} /> : <EyeOff size={10} className="text-slate-400" />}
                                    <span className="truncate max-w-[180px]">{client.cli_nome}</span>
                                    <button
                                        onClick={() => {
                                            setConfirmedRecipients(prev => prev.filter(c => c.cli_codigo !== client.cli_codigo));
                                        }}
                                        className="text-slate-400 hover:text-rose-500 transition-colors ml-1"
                                    >
                                        <X size={10} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Seção II: Conteúdo do E-mail */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                            <Mail size={18} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">II – Conteúdo do E-mail</h3>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    {/* Assunto */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Assunto</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Digite o assunto do e-mail..."
                            className="w-full h-11 bg-slate-50/50 border border-slate-200 rounded-xl px-4 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    {/* Mensagem */}
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Mensagem</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={8}
                            placeholder="Escreva o conteúdo do e-mail aqui..."
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 focus:border-transparent outline-none transition-all resize-none"
                        />
                    </div>
                </div>
            </div>

            {/* Seção III: Anexos */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                            <Paperclip size={18} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">III – Anexos</h3>
                    </div>
                </div>
                <div className="p-8">
                    <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 bg-slate-50/30 active:bg-slate-100 transition-colors cursor-pointer relative group">
                        <input
                            type="file"
                            multiple
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleFileChange}
                        />
                        <div className="text-center">
                            <Paperclip size={24} className="mx-auto mb-2 text-slate-300 group-hover:text-blue-500 transition-colors" />
                            <p className="text-xs font-bold text-slate-400 group-hover:text-blue-500 transition-colors">Clique ou arraste arquivos aqui</p>
                        </div>
                    </div>
                    {attachments.length > 0 && (
                        <div className="space-y-2 mt-4">
                            {attachments.map((file, i) => (
                                <div key={i} className="flex items-center justify-between bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText size={14} className="text-blue-600 flex-shrink-0" />
                                        <span className="text-xs font-bold text-blue-900 truncate">{file.name}</span>
                                    </div>
                                    <button onClick={() => removeAttachment(i)} className="text-rose-500 hover:text-rose-700 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Seção IV: Controle de Envio */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg">
                            <Zap size={18} />
                        </div>
                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">IV – Controle de Envio</h3>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="mass-send"
                            checked={isMassSend}
                            onChange={(e) => setIsMassSend(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="mass-send" className="text-[10px] font-black text-slate-600 uppercase tracking-wide cursor-pointer select-none">
                            Envio em massa <span className="text-rose-500 text-[9px] font-normal italic ml-1">(10 em 10)</span>
                        </label>
                    </div>
                </div>
                <div className="p-8 space-y-6">
                    {/* Status Console */}
                    <div className="w-full h-32 bg-[#0a1120] rounded-xl p-4 font-mono text-[11px] text-emerald-300 overflow-y-auto custom-scrollbar shadow-inner border border-slate-800">
                        {sendProgress.logs.length === 0 ? (
                            <span className="text-slate-300 italic">&gt; Aguardando início do processo...</span>
                        ) : (
                            sendProgress.logs.map((log, i) => (
                                <div key={i} className="mb-1 leading-relaxed">&gt; {log}</div>
                            ))
                        )}
                        {sendProgress.sending && (
                            <div className="flex items-center gap-2 mt-2">
                                <Loader2 size={12} className="animate-spin" />
                                <span>Processando e-mails ({sendProgress.current}/{sendProgress.total})</span>
                            </div>
                        )}
                    </div>

                    {/* Botões */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleStartSending}
                            disabled={sendProgress.sending || confirmedRecipients.length === 0}
                            className="flex-1 h-12 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98] hover:scale-[1.01] flex items-center justify-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <Send size={16} /> Iniciar Envio ({confirmedRecipients.length} destinatários)
                        </button>
                        <button
                            onClick={() => closeTab('/utilitarios/envio-emails')}
                            className="h-12 bg-white hover:bg-rose-50 text-rose-500 border border-slate-200 font-black px-6 rounded-xl transition-all active:scale-[0.98] flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <X size={16} /> Sair
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans">
            {/* Header */}
            <header className="bg-white h-[70px] px-8 flex items-center justify-between shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.05)] relative z-20 border-b border-slate-100">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => closeTab('/utilitarios/envio-emails')}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl h-10 w-10 flex items-center justify-center transition-all hover:scale-105 border border-slate-100"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h1 className="text-slate-800 text-xl font-black tracking-tight">Central de E-mails</h1>
                        <p className="text-slate-400 text-[10px] font-semibold flex items-center gap-2 uppercase tracking-widest">
                            <Mail size={10} className="text-blue-500" />
                            Marketing e Comunicação Direta
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">SMTP Ativo</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-[1100px] mx-auto p-6">
                    {/* Tab Bar - Centered like ClientForm */}
                    <div className="mb-8 flex justify-center sticky top-0 z-50 pt-2 pb-4">
                        <div className="bg-white p-1.5 rounded-2xl flex gap-1 shadow-[0_10px_30px_rgba(0,0,0,0.04)] border border-slate-100">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <tab.icon size={14} />
                                    {tab.label}
                                    {tab.id !== 'composicao' && confirmedRecipients.length > 0 && tab.id === activeTab && (
                                        <span className="ml-1 bg-emerald-600 text-white text-[8px] px-1.5 py-0.5 rounded-full">{confirmedRecipients.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[500px]">
                        {activeTab === 'composicao' ? renderComposicao() : renderFilterContent()}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            ` }} />
        </div>
    );
};

export default EmailCenterPage;
