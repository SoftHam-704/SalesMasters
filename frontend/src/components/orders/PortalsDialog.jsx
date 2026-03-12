import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Building2, ExternalLink, Globe, ArrowRight, CheckCircle2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';
import DbComboBox from '@/components/DbComboBox';
import { auxDataService } from '@/services/orders/auxDataService';

const PortalsDialog = ({ open, onOpenChange, orderId }) => {
    const [activeIndustries, setActiveIndustries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Patral Import State
    const [importMode, setImportMode] = useState(false);
    const [importPortal, setImportPortal] = useState(null);
    const [importClient, setImportClient] = useState('');
    const [importClientName, setImportClientName] = useState('');
    const [importText, setImportText] = useState('');
    const [importPriceTable, setImportPriceTable] = useState('');
    const [importPreview, setImportPreview] = useState([]); // New state for preview
    const [patralIndustryId, setPatralIndustryId] = useState(null);

    useEffect(() => {
        const fetchIndustries = async () => {
            if (!open) return;
            setIsLoading(true);
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, '/api/aux/industrias'));
                const json = await response.json();
                if (json.success) {
                    const names = json.data.map(i => `${i.for_nomered || ''} ${i.for_nome || ''}`.toUpperCase());
                    setActiveIndustries(names);
                }
            } catch (error) {
                console.error('Erro ao buscar indústrias:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchIndustries();
    }, [open]);

    const allPortals = [
        "TSA", "VIEMAR",
        "BORG", "PATRAL",
        "SINALSUL", "ARCA",
        "PHINIA", "STAHL",
        "NINO", "SAMPEL",
        "POLO", "DRIVEWAY",
        "3RHO", "IGUAÇU"
    ];

    // Filtra os portais verificando se o nome do portal está contido na razão social ou nome fantasia das indústrias vinculadas ao cliente/tenant
    const portals = allPortals.filter(portal =>
        activeIndustries.some(ind => {
            const normalize = (s) => (s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            return normalize(ind).includes(normalize(portal));
        })
    );

    const handlePortalClick = async (portal) => {
        if (portal === 'STAHL') {
            try {
                const toastId = toast.loading('Gerando arquivo STAHL...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/stahl`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    // Blob handling for download
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.txt baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'IGUAÇU') {
            try {
                const toastId = toast.loading('Gerando arquivo XML IGUAÇU...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/iguacu`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.xml`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.xml baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'VIEMAR') {
            try {
                const toastId = toast.loading('Gerando planilha VIEMAR...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/viemar`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo ${orderId}.xlsx baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'SAMPEL') {
            try {
                const toastId = toast.loading('Gerando planilha SAMPEL...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/sampel`), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `SAMPEL_${orderId}.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo SAMPEL_${orderId}.xlsx baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação SAMPEL:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else if (portal === 'POLO') {
            try {
                const toastId = toast.loading('Gerando arquivo POLO...');
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/orders/${orderId}/export/polo`), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${orderId}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);

                    toast.success(`Arquivo POLO ${orderId}.csv baixado com sucesso!`, { id: toastId });
                } else {
                    const data = await response.json();
                    toast.error(`Erro: ${data.message || 'Falha no download'}`, { id: toastId });
                }
            } catch (error) {
                console.error('Erro na exportação POLO:', error);
                toast.error('Erro ao conectar com servidor.');
            }
        } else {
            // General Import Mode setup (for PATRAL and others)
            setImportPortal(portal);
            setImportMode(true);
            setImportText('');
            setImportClient('');
            setImportClientName('');
            setImportPriceTable('');

            // Tentar descobrir o ID da Patral se clicar nela
            if (portal.toUpperCase().includes('PATRAL')) {
                try {
                    const res = await auxDataService.getIndustries('PATRAL');
                    const patral = res.data?.find(i => i.for_nomered?.toUpperCase().includes('PATRAL') || i.for_nome?.toUpperCase().includes('PATRAL'));
                    if (patral) {
                        setPatralIndustryId(patral.for_codigo);
                    }
                } catch (e) {
                    console.error('Erro ao buscar ID da Patral:', e);
                }
            }
        }
    };

    const handleImportSubmit = () => {
        if (!importClient) {
            toast.error('Selecione um cliente para a importação.');
            return;
        }
        if (!importText.trim()) {
            toast.error('O texto da importação não pode estar vazio.');
            return;
        }

        if (importPortal === 'PATRAL') {
            const items = [];
            const text = importText.trim();

            // Estratégia 1: Blocos (CÓDIGO: ...)
            if (text.toUpperCase().includes('CÓDIGO:')) {
                // Split case-insensitive pattern
                const blocks = text.split(/CÓDIGO:/i);
                blocks.forEach((block, index) => {
                    if (index === 0) return;
                    try {
                        const codigoMatch = block.match(/^\s*(\S+)/);
                        const qtyMatch = block.match(/QUANTIDADE:\s*(\d+(?:[.,]\d+)?)/i);
                        const priceMatch = block.match(/PREÇO UNITÁRIO:\s*R\$\s*([\d.,]+)/i);
                        const descMatch = block.match(/DESCRICÃO:\s*(.*?)(?:\n|$)/i);

                        if (codigoMatch && qtyMatch) {
                            items.push({
                                codigo: codigoMatch[1].trim(),
                                descricao: descMatch ? descMatch[1].trim() : 'Produto Importado',
                                quantidade: parseFloat(qtyMatch[1].replace(',', '.')),
                                precoUnitario: priceMatch ? parseFloat(priceMatch[1].replace(/\./g, '').replace(',', '.')) : 0,
                                markup: 0
                            });
                        }
                    } catch (e) { console.error("Erro no parser de bloco:", e); }
                });
            }

            // Estratégia 2: Linhas (Grid/Tabela) - Fallback
            if (items.length === 0) {
                const lines = text.split('\n');
                lines.forEach(line => {
                    if (!line.trim()) return;
                    const tabularMatch = line.match(/^(\S+)\s+(.*?)\s+(\d+(?:[.,]\d+)?)(?:\s+R\$\s*[\d.,]+)?/);
                    if (tabularMatch) {
                        const codigo = tabularMatch[1];
                        const qtde = parseFloat(tabularMatch[3].replace(',', '.'));
                        const noise = ['ITEM', 'COD', 'CÓD', 'PRODUTO', 'DESC', 'QTD', 'QUANT'];
                        if (noise.some(n => codigo.toUpperCase().includes(n))) return;

                        if (codigo && !isNaN(qtde) && qtde > 0) {
                            items.push({
                                codigo: codigo.trim(),
                                descricao: tabularMatch[2].trim(),
                                quantidade: qtde,
                                precoUnitario: 0,
                                markup: 0
                            });
                        }
                    }
                });
            }

            if (items.length === 0) {
                toast.error('Não consegui identificar nenhum item. Verifique o formato do texto colado.');
                return;
            }

            setImportPreview(items);
            toast.success(`${items.length} itens identificados! Verifique a prévia.`);
            return; // Don't submit yet, show preview
        }

        // Generic submission for other portals or after preview
        const finalItems = importPortal === 'PATRAL' ? importPreview : []; // This part will be handled by a "Confirm" button
        if (finalItems.length > 0) {
            submitImport(finalItems);
        }
    };

    const submitImport = (items) => {
        // Disparar evento com dados ricos
        const event = new CustomEvent('portalImportCompleted', {
            detail: {
                portal: importPortal,
                cliente: importClient,
                clienteNome: importClientName,
                items: items,
                tabela: importPriceTable,
                industriaId: patralIndustryId
            }
        });
        window.dispatchEvent(event);
        toast.success(`Importação de ${items.length} itens enviada para o pedido!`);
        resetImportMode();
        onOpenChange(false);
    };

    const resetImportMode = () => {
        setImportMode(false);
        setImportPortal('');
        setImportText('');
        setImportPreview([]); // Reset preview
        setImportClient('');
        setImportClientName('');
        setImportPriceTable('');
        setPatralIndustryId(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[850px] p-0 border-none bg-transparent shadow-none overflow-visible" hideCloseButton>
                {/* Acessibilidade para Screen Readers */}
                <div className="sr-only">
                    <DialogTitle>Portais Industriais de Exportação</DialogTitle>
                    <DialogDescription>
                        Selecione um dos portais industriais disponíveis para exportar os dados do pedido.
                    </DialogDescription>
                </div>

                <div className="relative bg-[#EAEAE5] rounded-3xl shadow-2xl border border-stone-300 overflow-visible flex flex-col max-h-[90vh]">

                    <div className="px-8 py-6 border-b border-stone-300 flex items-center justify-between bg-stone-50 rounded-t-3xl">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-stone-900 rounded-sm">
                                <Globe className="h-5 w-5 text-stone-50" />
                            </div>
                            <div>
                                <h3 className="text-xl font-display font-medium text-stone-900 tracking-tight leading-none uppercase">Portais Industriais</h3>
                                <p className="text-xs font-mono text-stone-500 uppercase tracking-widest mt-1">Selecione o destino da exportação</p>
                            </div>
                        </div>

                        {/* Botão de Fechar Customizado */}
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 hover:bg-stone-200 rounded-sm transition-colors duration-200 group"
                        >
                            <X className="h-5 w-5 text-stone-400 group-hover:text-stone-600" />
                        </button>
                    </div>

                    {/* Grid com Design de Cards Interativos */}
                    <div className="p-8 bg-[#EAEAE5] min-h-[250px] flex flex-col justify-center overflow-y-auto custom-scrollbar overflow-x-hidden">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center p-8 text-stone-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900 mb-4"></div>
                                <p className="font-mono uppercase tracking-widest text-[10px]">Carregando portais disponíveis...</p>
                            </div>
                        ) : importMode ? (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <div className="flex items-center justify-between mb-8">
                                     <h4 className="text-3xl font-display font-medium text-stone-900">Importação {importPortal}</h4>
                                     <button onClick={resetImportMode} className="text-xs font-mono text-stone-500 hover:text-stone-900 uppercase tracking-widest flex items-center gap-2">
                                         &larr; Voltar
                                     </button>
                                </div>
                                <div className="space-y-6">
                                    <div className="relative group/combo z-[9999]">
                                        <label className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2 block">1. Selecione o Cliente de Destino</label>
                                        <div className="border border-stone-300 bg-white shadow-sm transition-all focus-within:border-stone-900 focus-within:ring-1 focus-within:ring-stone-900">
                                            <DbComboBox
                                                placeholder="BUSCAR CLIENTE POR NOME OU CNPJ..."
                                                value={importClient}
                                                onChange={(val, item) => {
                                                    setImportClient(val);
                                                    setImportClientName(item?.label || '');
                                                }}
                                                fetchData={async (search) => {
                                                    const res = await auxDataService.getClients('A', search);
                                                    return (res.data || []).map(c => ({
                                                        label: `${c.cli_nomred || c.cli_nome} - ${c.cli_cnpj}`,
                                                        value: c.cli_codigo
                                                    }));
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {importPortal.toUpperCase().includes('PATRAL') && (
                                        <div className="relative group/combo z-[9998] animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-xs font-mono text-stone-500 uppercase tracking-widest mb-2 block text-emerald-600 font-bold">2. Selecione a Tabela de Preços (Patral)</label>
                                            <div className="border border-emerald-200 bg-white shadow-sm transition-all focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500">
                                                <DbComboBox
                                                    placeholder="BUSCAR TABELA DE PREÇOS..."
                                                    value={importPriceTable}
                                                    onChange={(val) => setImportPriceTable(val)}
                                                    fetchData={async (search) => {
                                                        if (!patralIndustryId) return [];
                                                        const res = await auxDataService.getPriceTables(patralIndustryId, search);
                                                        return (res.data || []).map(t => ({
                                                            label: t.nome_tabela || t.tab_descricao || t.itab_nome,
                                                            value: t.nome_tabela || t.itab_idtabela || t.tab_codigo || t.codigo,
                                                            ...t
                                                        }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                            {!importPreview.length ? (
                                                <>
                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-[10px] font-black uppercase text-stone-500 tracking-widest pl-1">
                                                            Cole o texto do Portal aqui
                                                        </label>
                                                        <textarea
                                                            placeholder="Cole aqui o conteúdo do carrinho ou pedido..."
                                                            value={importText}
                                                            onChange={(e) => setImportText(e.target.value)}
                                                            className="w-full h-48 p-4 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-stone-900/10 focus:border-stone-900 outline-none transition-all font-mono text-xs text-stone-600 resize-none"
                                                        />
                                                    </div>

                                                    <button
                                                        onClick={handleImportSubmit}
                                                        className="w-full py-4 bg-stone-900 hover:bg-stone-800 rounded-2xl font-display font-medium flex items-center justify-center gap-2 transition-all group active:scale-[0.98]"
                                                        style={{ color: '#FFD700' }}
                                                    >
                                                        <span>Identificar Itens</span>
                                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <h4 className="text-xs font-black uppercase text-emerald-800 tracking-wider flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                Itens Identificados ({importPreview.length})
                                                            </h4>
                                                            <button 
                                                                onClick={() => setImportPreview([])}
                                                                className="text-[10px] font-bold text-stone-400 hover:text-stone-600 transition-colors uppercase tracking-widest"
                                                            >
                                                                Limpar / Refazer
                                                            </button>
                                                        </div>
                                                        <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                                            <table className="w-full text-left text-[10px]">
                                                                <thead className="sticky top-0 bg-emerald-50 border-b border-emerald-200">
                                                                    <tr>
                                                                        <th className="py-2 font-black uppercase text-emerald-600 tracking-tighter">Cód</th>
                                                                        <th className="py-2 font-black uppercase text-emerald-600 tracking-tighter">Descrição</th>
                                                                        <th className="py-2 font-black uppercase text-emerald-600 tracking-tighter text-right">Qtd</th>
                                                                        <th className="py-2 font-black uppercase text-emerald-600 tracking-tighter text-right">Preço</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {importPreview.map((item, idx) => (
                                                                        <tr key={idx} className="border-b border-emerald-100/50 hover:bg-emerald-100/30 transition-colors">
                                                                            <td className="py-2 font-mono font-bold text-emerald-900">{item.codigo}</td>
                                                                            <td className="py-2 text-emerald-700 truncate max-w-[150px]">{item.descricao}</td>
                                                                            <td className="py-2 font-bold text-emerald-900 text-right">{item.quantidade}</td>
                                                                            <td className="py-2 font-bold text-emerald-900 text-right">
                                                                                {item.precoUnitario > 0 ? `R$ ${item.precoUnitario.toFixed(2)}` : '--'}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={() => submitImport(importPreview)}
                                                        className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-display font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 transition-all group active:scale-[0.98]"
                                                    >
                                                        <Plus className="h-5 w-5" />
                                                        <span>Confirmar Importação de {importPreview.length} Itens</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                </div>
                            </div>
                        ) : portals.length === 0 ? (
                            <div className="text-center p-12 bg-white/60 backdrop-blur-md border border-white/50 shadow-lg rounded-xl">
                                <Building2 className="h-12 w-12 text-stone-300 mx-auto mb-4" />
                                <h4 className="text-xl font-display font-medium text-stone-900 mb-2">Nenhum portal compatível</h4>
                                <p className="text-sm font-sans text-stone-500 leading-relaxed">Nenhuma das indústrias ativas possui integração mapeada neste sistema.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {portals.map((portal, index) => (
                                    <motion.button
                                        key={portal}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        whileHover={{ scale: 1.02, y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handlePortalClick(portal)}
                                        className="group relative flex flex-col justify-between p-6 bg-white border border-stone-200 hover:border-stone-900 hover:shadow-xl transition-all duration-500 min-h-[140px] overflow-hidden"
                                    >
                                        <div className="absolute inset-0 bg-stone-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                        
                                        <div className="mb-4 relative z-10 p-3 rounded bg-stone-100 text-stone-500 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-500 self-start">
                                            <Building2 className="h-6 w-6" />
                                        </div>
                                        
                                        <span className="text-lg font-display font-medium text-stone-900 relative z-10 self-start text-left">
                                            {portal}
                                        </span>
                                        
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-x-1 group-hover:translate-x-0 z-10">
                                            <ExternalLink className="h-4 w-4 text-stone-400 group-hover:text-white" />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer Clean */}
                    <div className="px-8 py-4 bg-stone-50 border-t border-stone-300 flex justify-between items-center rounded-b-3xl">
                        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">
                            Aura System v2.0 • Módulo de Integração
                        </p>
                        <div className="flex gap-2">
                            {/* Espaço para ações futuras */}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PortalsDialog;
