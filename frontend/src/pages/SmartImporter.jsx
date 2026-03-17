import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    UploadCloud,
    Search,
    FileSpreadsheet,
    ArrowRight,
    Building2,
    PackageSearch,
    CheckCircle2,
    Trash2,
    Plus,
    X,
    AlertCircle,
    Copy,
    ArrowUpRight,
    Loader2
} from 'lucide-react';
import DbComboBox from '@/components/DbComboBox';
import { auxDataService } from '@/services/orders/auxDataService';
import { toast } from 'sonner';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const API_BASE_URL = getApiUrl(NODE_API_URL, '/api');

const SmartImporter = () => {
    const [pasteArea, setPasteArea] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    // Buckets state: grouped by industry (Loaded from localStorage if available)
    const [buckets, setBuckets] = useState(() => {
        try {
            const saved = localStorage.getItem('smart_importer_buckets');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [notFound, setNotFound] = useState(() => {
        try {
            const saved = localStorage.getItem('smart_importer_not_found');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });

    const [selectedClient, setSelectedClient] = useState(() => {
        try {
            const saved = localStorage.getItem('smart_importer_last_client');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    });

    // Persist data whenever they change
    useEffect(() => {
        localStorage.setItem('smart_importer_buckets', JSON.stringify(buckets));
    }, [buckets]);

    useEffect(() => {
        localStorage.setItem('smart_importer_not_found', JSON.stringify(notFound));
    }, [notFound]);

    useEffect(() => {
        if (selectedClient) {
            localStorage.setItem('smart_importer_last_client', JSON.stringify(selectedClient));
        } else {
            localStorage.removeItem('smart_importer_last_client');
        }
    }, [selectedClient]);

    // Logic to fetch clients for DbComboBox
    const fetchClients = useCallback(async (search) => {
        try {
            const res = await auxDataService.getClients('A', search);
            return (res.data || []).map(c => ({
                label: `${c.cli_nomred || c.cli_nome} - ${c.cli_cnpj}`,
                value: c.cli_codigo,
                ...c
            }));
        } catch (err) {
            console.error('Erro ao buscar clientes:', err);
            return [];
        }
    }, []);

    // Logic to fetch drafts from DB on mount
    const fetchDrafts = useCallback(async () => {
        const userJson = sessionStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        const v_id = user.vendedor_id || user.codigo;

        if (!v_id) return;

        try {
            const res = await fetch(`${API_BASE_URL}/smart-importer/drafts/${v_id}`);
            const result = await res.json();
            if (result.success) {
                setBuckets(result.data || []);
            }
        } catch (err) {
            console.error('Erro ao buscar rascunhos do banco:', err);
        }
    }, []);

    useEffect(() => {
        fetchDrafts();
    }, [fetchDrafts]);

    // Logic to sync a bucket (draft) with the backend
    const syncDraftWithDB = async (bucket) => {
        const userJson = sessionStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        const v_id = user.vendedor_id || user.codigo;

        if (!v_id || !bucket.client) return;

        try {
            await fetch(`${API_BASE_URL}/smart-importer/drafts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vendedor_id: v_id,
                    cli_codigo: bucket.client.cli_codigo,
                    industria_id: bucket.industria_id,
                    industria_nome: bucket.industria_nome,
                    items: bucket.items,
                    total: bucket.total
                })
            });
        } catch (err) {
            console.error('Erro ao sincronizar rascunho:', err);
        }
    };

    const handleAnalyze = async () => {
        if (!pasteArea.trim()) {
            toast.error('Cole os códigos e quantidades primeiro.');
            return;
        }
        if (!selectedClient) {
            toast.error('Selecione um cliente para vincular os preços e indústrias.');
            return;
        }

        setIsProcessing(true);
        try {
            // Parse lines: assumes "CODE QUANTITY" or "CODE\tQUANTITY"
            const lines = pasteArea.split('\n').filter(l => l.trim().length > 0);
            const items = lines.map(line => {
                // Split by common separators (space, tab, semicolon)
                const parts = line.split(/[\s\t;]+/).filter(p => p.trim().length > 0);
                const codigo = parts[0];
                const quantidade = parts.length > 1 ? parseFloat(parts[1].replace(',', '.')) : 1;
                return { codigo, quantidade: isNaN(quantidade) ? 1 : quantidade };
            });

            const response = await fetch(`${API_BASE_URL}/smart-importer/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cli_codigo: selectedClient.cli_codigo,
                    items
                })
            });

            const result = await response.json();

            if (result.success) {
                // Merging with existing buckets if same industry/client
                const updatedBuckets = [...buckets];
                for (const newGroup of result.grouped) {
                    const existingIdx = updatedBuckets.findIndex(b =>
                        b.industria_id === newGroup.industria_id &&
                        b.client?.cli_codigo === selectedClient?.cli_codigo
                    );

                    let entryToSync;
                    if (existingIdx >= 0) {
                        // Merge items
                        newGroup.items.forEach(newItem => {
                            const itemIdx = updatedBuckets[existingIdx].items.findIndex(i => i.codigo === newItem.codigo);
                            if (itemIdx >= 0) {
                                updatedBuckets[existingIdx].items[itemIdx].quantidade += newItem.quantidade;
                                updatedBuckets[existingIdx].items[itemIdx].total += newItem.total;
                            } else {
                                updatedBuckets[existingIdx].items.push(newItem);
                            }
                            updatedBuckets[existingIdx].total += newItem.total;
                        });
                        entryToSync = updatedBuckets[existingIdx];
                    } else {
                        entryToSync = { ...newGroup, client: selectedClient };
                        updatedBuckets.unshift(entryToSync);
                    }

                    // Sync this specific bucket with DB
                    await syncDraftWithDB(entryToSync);
                }

                setBuckets(updatedBuckets);
                setNotFound(result.notFound || []);
                setPasteArea('');
                setSelectedClient(null); // Limpa o cliente selecionado para o próximo
                localStorage.removeItem('smart_importer_last_client'); // Limpa a persistência do cliente
                toast.success('Análise concluída! Rascunhos salvos no servidor.');
            } else {
                toast.error(result.message || 'Erro ao analisar rascunho.');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            toast.error('Erro de conexão com o servidor.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemoveBucket = async (index) => {
        const bucket = buckets[index];
        if (bucket.id) {
            try {
                await fetch(`${API_BASE_URL}/smart-importer/drafts/${bucket.id}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Erro ao remover rascunho do banco:', err);
            }
        }
        setBuckets(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAll = async () => {
        const userJson = sessionStorage.getItem('user');
        const user = userJson ? JSON.parse(userJson) : {};
        const v_id = user.vendedor_id || user.codigo;

        if (v_id) {
            try {
                // Endpoint para limpar tudo de um vendedor (o backend já tem DELETE por ID, mas não por vendedor, vou adicionar ou usar loop)
                // Usando o endpoint de checkout que limpa tudo do vendedor pode ser perigoso, melhor criar um específico
                await fetch(`${API_BASE_URL}/smart-importer/drafts/all/${v_id}`, { method: 'DELETE' });
            } catch (e) { }
        }

        setBuckets([]);
        setNotFound([]);
        setPasteArea('');
        setSelectedClient(null);
        localStorage.removeItem('smart_importer_buckets');
        localStorage.removeItem('smart_importer_not_found');
        localStorage.removeItem('smart_importer_last_client');
    };

    const handleCheckout = async () => {
        if (buckets.length === 0) return;

        setIsProcessing(true);
        try {
            const userJson = sessionStorage.getItem('user');
            const user = userJson ? JSON.parse(userJson) : {};

            // Get initials (first 2 letters of name/login)
            const initials = user.nome ? (user.nome.substring(0, 1) + (user.sobrenome ? user.sobrenome.substring(0, 1) : user.nome.substring(1, 2))).toUpperCase() : 'SM';

            const response = await fetch(`${API_BASE_URL}/smart-importer/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    buckets,
                    vendedor_id: user.vendedor_id || user.codigo || 0,
                    user_initials: initials
                })
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setBuckets([]);
                localStorage.removeItem('smart_importer_buckets');
                localStorage.removeItem('smart_importer_not_found');
                localStorage.removeItem('smart_importer_last_client');
                // Após faturar, redireciona para a lista de pedidos para o usuário ver o resultado
                setTimeout(() => navigate('/pedidos'), 1500);
            } else {
                toast.error(result.message || 'Erro ao faturar pedidos.');
            }
        } catch (err) {
            console.error('Checkout error:', err);
            toast.error('Erro de conexão ao tentar faturar.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="h-screen flex flex-col bg-[#F8FAFC] font-['IBM_Plex_Sans',sans-serif] text-[#1E293B] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                        <ShoppingCart className="w-5 h-5 text-[#10B981]" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[#1E293B] tracking-tight">Importador Inteligente</h1>
                        <p className="text-xs text-[#64748B] font-medium mt-0.5">Prepare cotações o dia todo sem usar Excel.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {buckets.length > 0 && (
                        <>
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-2 text-[#64748B] hover:text-[#DC2626] transition-colors text-sm font-semibold"
                            >
                                <Trash2 className="w-4 h-4" />
                                Limpar Tudo
                            </button>
                            <button
                                onClick={handleCheckout}
                                disabled={isProcessing}
                                className="flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-sm transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="w-4 h-4" />
                                )}
                                Faturar {buckets.length} {buckets.length === 1 ? 'Carrinho' : 'Carrinhos'}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-6 flex flex-col lg:flex-row gap-6">

                {/* Lado Esquerdo: Input Area (Caixa de Entrada) */}
                <div className="flex-1 flex flex-col gap-4 min-w-[320px] max-w-lg">
                    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6 flex flex-col h-full relative overflow-hidden">

                        {/* Subtle decorative element */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#60A5FA] to-[#10B981]"></div>

                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-base font-bold text-[#1E293B] flex items-center gap-2">
                                <Plus className="w-5 h-5 text-[#60A5FA]" />
                                Capturar Novos Itens
                            </h2>
                            <div className="bg-[#60A5FA]/10 text-[#60A5FA] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#60A5FA]/20 tracking-wider">
                                Rascunho Rápido
                            </div>
                        </div>

                        {/* Cliente Select using DbComboBox */}
                        <div className="mb-6">
                            <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-2">
                                1. DESTINATÁRIO (CLIENTE)
                            </label>
                            <div className="relative">
                                <DbComboBox
                                    label=""
                                    placeholder="Comece a digitar o nome..."
                                    fetchData={fetchClients}
                                    value={selectedClient?.cli_codigo}
                                    onChange={(val, item) => setSelectedClient(item)}
                                    className="w-full"
                                />
                                {selectedClient && (
                                    <div className="mt-2 flex items-center gap-2 text-xs text-[#10B981] font-medium bg-[#10B981]/5 p-2 rounded border border-[#10B981]/10 animate-in fade-in slide-in-from-top-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Cliente: {selectedClient.cli_nomred || selectedClient.cli_nome}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paste Area */}
                        <div className="flex-1 flex flex-col min-h-[300px]">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                                    2. CÓDIGOS E QUANTIDADES
                                </label>
                                <span className="text-[#60A5FA] text-[10px] font-bold hover:underline cursor-pointer flex items-center gap-1">
                                    <FileSpreadsheet className="w-3 h-3" /> IMPORTAR ARQUIVO
                                </span>
                            </div>
                            <textarea
                                className="flex-1 w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-sm text-[#1E293B] font-mono focus:outline-none focus:ring-2 focus:ring-[#60A5FA] focus:border-transparent transition-all placeholder-[#94A3B8] resize-none leading-relaxed"
                                placeholder={"Cole aqui direto do Excel ou TXT:\n\n4PK1038\t30\n6001DDUC3\t15\nAKX35181\t8"}
                                value={pasteArea}
                                onChange={(e) => setPasteArea(e.target.value)}
                            ></textarea>
                            <div className="mt-2 text-[10px] text-[#64748B] italic">
                                * O sistema descobrirá a fábrica e aplicará a tabela do cliente automaticamente.
                            </div>
                        </div>

                        {/* Action Button */}
                        <button
                            onClick={handleAnalyze}
                            disabled={!pasteArea.trim() || !selectedClient || isProcessing}
                            className="mt-6 w-full flex items-center justify-center gap-2 bg-[#1E293B] hover:bg-slate-800 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] text-white px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-slate-200 disabled:shadow-none transform active:scale-[0.98]"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processando Inteligência...
                                </>
                            ) : (
                                <>
                                    <PackageSearch className="w-5 h-5" />
                                    Distribuir itens no carrinho
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Lado Direito: Caçamba / Carrinhos Abertos */}
                <div className="flex-[1.5] flex flex-col h-full overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-bold text-[#1E293B] flex items-center gap-2 uppercase tracking-tight">
                                <ShoppingCart className="w-6 h-6 text-[#FB923C]" />
                                Carrinhos de Faturamento do Dia
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-[#EAB308]/10 text-[#EAB308] px-3 py-1 rounded-full text-[11px] font-bold border border-[#EAB308]/20 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[#EAB308] rounded-full"></div>
                                {buckets.length} {buckets.length === 1 ? 'CARRINHO AGUARDANDO' : 'CARRINHOS AGUARDANDO'}
                            </div>
                        </div>
                    </div>

                    {notFound.length > 0 && (
                        <div className="mb-6 animate-in slide-in-from-top duration-500">
                            <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-2xl p-4 flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                    <AlertCircle className="text-[#DC2626]" size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-[#991B1B]">Atenção: Itens não identificados ({notFound.length})</h4>
                                    <p className="text-xs text-[#991B1B]/80 mt-1">Alguns códigos não foram encontrados para o cliente selecionado ou não possuem preço.</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {notFound.slice(0, 8).map((nf, idx) => (
                                            <span key={idx} className="bg-white px-2 py-1 rounded border border-[#FEE2E2] text-[10px] font-bold text-[#DC2626]">
                                                {nf.codigo}
                                            </span>
                                        ))}
                                        {notFound.length > 8 && <span className="text-[10px] text-[#DC2626] font-bold">+{notFound.length - 8}</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {buckets.length === 0 ? (
                        <div className="flex-1 bg-[#F1F5F9] border-2 border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-center p-12 transition-all">
                            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm border border-[#E2E8F0] flex items-center justify-center mb-6">
                                <ShoppingCart className="w-10 h-10 text-[#94A3B8]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Seu carrinho está vazio</h3>
                            <p className="text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                                Use o campo à esquerda para selecionar um cliente e colar uma lista de produtos. Eu vou separar tudo automaticamente por fábrica.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                                {buckets.map((bucket, bIdx) => (
                                    <div key={bIdx} className="bg-white border text-left border-[#E2E8F0] rounded-[24px] p-5 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all group relative flex flex-col">

                                        {/* Header do Card (Estilo Campanha) */}
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center text-[#64748B] font-bold text-base shadow-inner shrink-0">
                                                    {(bucket.client?.cli_nomred || bucket.client?.cli_nome || 'C').charAt(0).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[13px] font-bold text-[#1E293B] leading-tight uppercase tracking-tight truncate">
                                                        {bucket.industria_nome}
                                                    </h3>
                                                    <p className="text-[10px] font-medium text-[#64748B] uppercase tracking-widest mt-0.5 truncate">
                                                        {bucket.client?.cli_nomred || bucket.client?.cli_nome || 'Cliente'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                <div className="bg-[#FFFBEB] text-[#92400E] text-[8px] font-bold px-1.5 py-0.5 rounded border border-[#FEF3C7] tracking-tighter uppercase">
                                                    AGUARDANDO
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveBucket(bIdx)}
                                                    className="p-1 px-1.5 text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Badge de Fornecedor */}
                                        <div className="flex items-center gap-2 mb-3 px-2.5 py-1 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] w-fit">
                                            <Building2 size={10} className="text-[#10B981]" />
                                            <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Fábrica: {bucket.industria_id}</span>
                                        </div>

                                        {/* Tabela de Itens (Limitada a 3) */}
                                        <div className="flex-1 space-y-1.5 mb-3">
                                            {bucket.items.slice(0, 3).map((item, iIdx) => (
                                                <div key={iIdx} className="flex items-center justify-between p-2 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white hover:border-[#10B981] transition-all cursor-default">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[10px] font-bold text-[#1E293B] shrink-0">
                                                            {item.quantidade}
                                                        </div>
                                                        <div className="overflow-hidden min-w-0">
                                                            <div className="text-[11px] font-bold text-[#1E293B] truncate">{item.codigo}</div>
                                                            <div className="text-[9px] text-[#64748B] truncate">{item.descricao}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-2">
                                                        <div className="text-[11px] font-bold text-[#1E293B]">{formatCurrency(item.preco_unitario)}</div>
                                                    </div>
                                                </div>
                                            ))}
                                            {bucket.items.length > 3 && (
                                                <div className="text-center py-0.5">
                                                    <button className="text-[9px] font-bold text-[#10B981] uppercase tracking-widest hover:underline flex items-center justify-center gap-1 mx-auto">
                                                        + {bucket.items.length - 3} itens ocultos <ArrowUpRight size={10} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Totais (Estilo Boxes da imagem) */}
                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                            <div className="bg-[#F1F5F9] rounded-xl p-2.5 border border-[#E2E8F0] overflow-hidden">
                                                <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-widest block mb-1 truncate">Tabela</span>
                                                <span className="text-[10px] font-bold text-[#1E293B] block truncate">{bucket.items[0].tabela}</span>
                                            </div>
                                            <div className="bg-[#EEFDF6] rounded-xl p-2.5 border border-[#D1FAE5] text-right overflow-hidden">
                                                <span className="text-[8px] font-bold text-[#065F46] uppercase tracking-widest block mb-1 truncate">Total</span>
                                                <span className="text-[12px] font-bold text-[#065F46] block truncate">{formatCurrency(bucket.total)}</span>
                                            </div>
                                        </div>

                                        {/* Rodapé do Card */}
                                        <div className="flex items-center justify-between pt-2.5 border-t border-[#E2E8F0]">
                                            <div className="flex gap-1">
                                                {bucket.items[0].descontos.desc1 > 0 && <span className="px-1.5 py-0.5 rounded-md bg-[#10B981] text-white text-[8px] font-bold">-{bucket.items[0].descontos.desc1}%</span>}
                                                {bucket.items[0].descontos.desc2 > 0 && <span className="px-1.5 py-0.5 rounded-md bg-[#60A5FA] text-white text-[8px] font-bold">-{bucket.items[0].descontos.desc2}%</span>}
                                            </div>
                                            <button className="text-[10px] font-bold text-[#64748B] hover:text-[#10B981] uppercase tracking-widest transition-colors flex items-center gap-1">
                                                DETALHES <ArrowUpRight size={10} />
                                            </button>
                                        </div>

                                        {/* Decoração Lateral */}
                                        <div className="absolute top-0 right-0 w-1 h-full bg-[#10B981] border-r-[24px] border-[#10B981] opacity-0 group-hover:opacity-10 rounded-r-[24px] transition-opacity"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* Styles for scrollbar */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
                
                /* Animations */
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 2s infinite;
                }
            `}} />
        </div>
    );
};

export default SmartImporter;
