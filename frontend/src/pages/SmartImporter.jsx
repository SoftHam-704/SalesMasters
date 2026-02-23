import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag,
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
    const [selectedClient, setSelectedClient] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const navigate = useNavigate();

    // Buckets state: grouped by industry
    const [buckets, setBuckets] = useState([]);
    const [notFound, setNotFound] = useState([]);

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
                setBuckets(prev => {
                    const newBuckets = [...prev];
                    result.grouped.forEach(newGroup => {
                        const existingIdx = newBuckets.findIndex(b => b.industria_id === newGroup.industria_id);
                        if (existingIdx >= 0) {
                            // Merge items
                            newGroup.items.forEach(newItem => {
                                const itemIdx = newBuckets[existingIdx].items.findIndex(i => i.codigo === newItem.codigo);
                                if (itemIdx >= 0) {
                                    newBuckets[existingIdx].items[itemIdx].quantidade += newItem.quantidade;
                                    newBuckets[existingIdx].items[itemIdx].total += newItem.total;
                                } else {
                                    newBuckets[existingIdx].items.push(newItem);
                                }
                                newBuckets[existingIdx].total += newItem.total;
                            });
                        } else {
                            newBuckets.unshift({ ...newGroup, client: selectedClient });
                        }
                    });
                    return newBuckets;
                });

                setNotFound(result.notFound || []);
                setPasteArea('');
                toast.success('Análise concluída! Rascunhos organizados por fábrica.');
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

    const handleRemoveBucket = (index) => {
        setBuckets(prev => prev.filter((_, i) => i !== index));
    };

    const handleClearAll = () => {
        setBuckets([]);
        setNotFound([]);
        setPasteArea('');
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
        <div className="flex flex-col h-full bg-[#F8FAFC] font-['IBM_Plex_Sans',sans-serif] text-[#1E293B]">
            {/* Header */}
            <div className="px-6 py-4 bg-white border-b border-[#E2E8F0] shadow-sm flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#F1F5F9] rounded-xl border border-[#E2E8F0]">
                        <ShoppingBag className="w-5 h-5 text-[#10B981]" />
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
                                Faturar {buckets.length} {buckets.length === 1 ? 'Pedido' : 'Pedidos'}
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
                                    Distribuir itens nas sacolas
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
                                <ShoppingBag className="w-6 h-6 text-[#FB923C]" />
                                Sacolas de Faturamento do Dia
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-[#EAB308]/10 text-[#EAB308] px-3 py-1 rounded-full text-[11px] font-bold border border-[#EAB308]/20 flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-[#EAB308] rounded-full"></div>
                                {buckets.length} AGUARDANDO
                            </div>
                        </div>
                    </div>

                    {notFound.length > 0 && (
                        <div className="bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-xl p-4 animate-in slide-in-from-top-4 mb-5">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-[#DC2626]">Atenção: Itens não identificados ({notFound.length})</h4>
                                    <p className="text-xs text-[#DC2626]/80 mt-1">Alguns códigos não foram encontrados para o cliente selecionado ou não possuem preço.</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {notFound.slice(0, 8).map((nf, idx) => (
                                            <span key={idx} className="bg-white px-2 py-1 rounded border border-[#DC2626]/20 text-[10px] font-bold text-[#DC2626]">
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
                                <ShoppingBag className="w-10 h-10 text-[#94A3B8]" />
                            </div>
                            <h3 className="text-lg font-bold text-[#1E293B] mb-2">Suas sacolas estão vazias</h3>
                            <p className="text-sm text-[#64748B] max-w-sm mx-auto leading-relaxed">
                                Use o campo à esquerda para selecionar um cliente e colar uma lista de produtos. Eu vou separar tudo automaticamente por fábrica.
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar pb-8">



                            {/* Bucket Cards */}
                            {buckets.map((bucket, bIdx) => (
                                <div key={bIdx} className="bg-white border text-left border-[#E2E8F0] rounded-2xl p-5 shadow-sm hover:shadow-lg hover:border-[#60A5FA]/30 transition-all group relative overflow-hidden">
                                    {/* Glass Morph Decoration */}
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#60A5FA]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1.5">
                                                <div className="w-1.5 h-1.5 bg-[#60A5FA] rounded-full"></div>
                                                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">{bucket.client.cli_nomred || bucket.client.cli_nome}</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-[#1E293B] leading-tight flex items-center gap-2">
                                                <Building2 className="w-5 h-5 text-[#1E293B]" />
                                                {bucket.industria_nome}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRemoveBucket(bIdx)}
                                                className="text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#DC2626]/5 transition-all p-2 rounded-lg"
                                            >
                                                <Trash2 className="w-4.5 h-4.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Sub-tabela preview (Estilo Fresh Corporate Tabular) */}
                                    <div className="mb-4 border border-[#F1F5F9] rounded-xl overflow-hidden bg-[#F8FAFC]">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-[#F1F5F9]">
                                                <tr className="border-b border-[#E2E8F0]">
                                                    <th className="py-2 px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest w-16">Qtd</th>
                                                    <th className="py-2 px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest">Produto</th>
                                                    <th className="py-2 px-3 text-[10px] font-bold text-[#64748B] uppercase tracking-widest text-right">Unitário</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {bucket.items.slice(0, 5).map((item, iIdx) => (
                                                    <tr key={iIdx} className="border-b border-[#F1F5F9] last:border-0 hover:bg-white transition-colors">
                                                        <td className="py-2 px-3 text-[13px] text-[#1E293B] font-bold">{item.quantidade}</td>
                                                        <td className="py-2 px-3">
                                                            <div className="text-[13px] text-[#1E293B] font-medium leading-tight">{item.codigo}</div>
                                                            <div className="text-[10px] text-[#64748B] truncate max-w-[280px]">{item.descricao}</div>
                                                        </td>
                                                        <td className="py-2 px-3 text-[12px] text-[#64748B] text-right font-medium">
                                                            {formatCurrency(item.preco_unitario)}
                                                            {item.is_promo && <span className="ml-1 text-[#DC2626] font-bold">🔥</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        {bucket.items.length > 5 && (
                                            <div className="bg-white py-2 px-4 text-[11px] font-bold text-[#60A5FA] text-center border-t border-[#F1F5F9] cursor-pointer hover:bg-[#60A5FA]/5 transition-colors flex items-center justify-center gap-1">
                                                MAIS {bucket.items.length - 5} ITENS <ArrowUpRight className="w-3 h-3" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-[#F1F5F9] relative z-10">
                                        <div className="space-y-1">
                                            <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                                                TABELA: <span className="text-[#1E293B] font-bold">{bucket.items[0].tabela}</span>
                                            </div>
                                            <div className="flex gap-1.5">
                                                {bucket.items[0].descontos.desc1 > 0 && <span className="px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] text-[9px] font-black border border-[#10B981]/20">-{bucket.items[0].descontos.desc1}%</span>}
                                                {bucket.items[0].descontos.desc2 > 0 && <span className="px-1.5 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] text-[9px] font-black border border-[#10B981]/20">-{bucket.items[0].descontos.desc2}%</span>}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-bold text-[#64748B] block mb-1">TOTAL DA SACOLA</span>
                                            <div className="flex items-baseline justify-end gap-1.5">
                                                <span className="text-lg font-black text-[#10B981]">
                                                    {formatCurrency(bucket.total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Hover overlay */}
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-[#10B981] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                                </div>
                            ))}
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
