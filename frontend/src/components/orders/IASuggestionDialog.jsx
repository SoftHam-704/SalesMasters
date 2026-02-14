import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Sparkles,
    TrendingUp,
    MessageSquare,
    Plus,
    Check,
    AlertCircle,
    ChevronRight,
    Zap,
    RefreshCw,
    Download,
    HelpCircle,
    X,
    BarChart3,
    Users,
    ShoppingCart,
    Target,
    Bell,
    Layers,
    GitCompare,
    DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '@/utils/formatters';
import { toast } from 'sonner';
import axios from '@/lib/axios';
import './IASuggestionDialog.css';

const IASuggestionDialog = ({ isOpen, onClose, clienteId, industriaId, onAddItems }) => {
    const [loading, setLoading] = useState(false);
    const [suggestion, setSuggestion] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showPillars, setShowPillars] = useState(false);

    const PILLARS = [
        { icon: Users, label: 'Perfil do Cliente', desc: 'Dados cadastrais, segmento de atuação, localização e porte da empresa.' },
        { icon: ShoppingCart, label: 'Histórico de Compras', desc: 'Produtos já adquiridos, frequência, volumes e valores por período.' },
        { icon: GitCompare, label: 'Gap Analysis', desc: 'Produtos da indústria que o cliente ainda não comprou (oportunidades).' },
        { icon: BarChart3, label: 'Curva ABC Global', desc: 'Classificação dos produtos pelo faturamento total da indústria.' },
        { icon: Bell, label: 'Alertas de Recompra', desc: 'Produtos com intervalo superior a 45 dias sem nova compra.' },
        { icon: TrendingUp, label: 'Tendências de Mercado', desc: 'Variação de volumes e sazonalidade nos últimos 12 meses.' },
        { icon: Layers, label: 'Cross-Selling', desc: 'Produtos complementares comprados por clientes do mesmo perfil.' },
        { icon: DollarSign, label: 'Potencial de Faturamento', desc: 'Estimativa de receita baseada no comportamento de clientes similares.' }
    ];

    const fetchSuggestion = async (force = false) => {
        setLoading(true);
        try {
            const response = await axios.post('intelligence/smart-ia-suggestion', {
                clienteId,
                industriaId,
                forceRefresh: force
            }, { timeout: 120000 });
            if (response.data.success) {
                setSuggestion(response.data.data);
                if (response.data.cached) {
                    toast.info("Carregado do cache estratégico.");
                } else {
                    toast.success("IA gerou uma nova análise consultiva! ✨");
                }
            }
        } catch (error) {
            console.error('Erro ao buscar sugestão IA:', error);
            toast.error("Falha ao consultar o Assistente IA.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && clienteId && industriaId) {
            fetchSuggestion();
        }
    }, [isOpen, clienteId, industriaId]);

    const toggleItem = (item) => {
        const exists = selectedItems.find(i => i.produto === item.produto);
        if (exists) {
            setSelectedItems(selectedItems.filter(i => i.produto !== item.produto));
        } else {
            setSelectedItems([...selectedItems, item]);
        }
    };

    const handleAddSelected = () => {
        if (selectedItems.length === 0) return;

        // Formatar para o formato esperado pelo OrderForm
        const formattedItems = selectedItems.map(item => ({
            pro_codprod: item.produto,
            pro_nome: item.produto,
            quantidade: item.quantidade_sugerida || item.quantidade_sugerida_inicial || 1,
            preco: 0, // O sistema deve buscar o preço da tabela ativa no front
            isIA: true
        }));

        onAddItems(formattedItems);
        onClose();
        toast.success(`${selectedItems.length} itens adicionados ao pedido.`);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="ia-dialog-content custom-scrollbar max-w-4xl p-0 overflow-hidden bg-slate-50 border-none shadow-2xl">

                {/* Header Superior Estilizado */}
                <div className="ia-header-gradient p-6 text-white relative">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Sparkles size={120} />
                    </div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                            <Sparkles className="text-white animate-pulse" size={28} />
                        </div>
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1 text-white">
                                Assistente <span className="text-blue-200">SalesAI</span>
                            </DialogTitle>
                            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Consultoria Estratégica Baseada em Dados</p>
                        </div>
                        <div className="ml-auto flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowPillars(!showPillars)}
                                className="text-white hover:bg-white/10 rounded-full"
                                title="Como funciona?"
                            >
                                <HelpCircle size={16} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchSuggestion(true)}
                                disabled={loading}
                                className="text-white hover:bg-white/10 rounded-full"
                            >
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Painel dos 8 Pilares */}
                <AnimatePresence>
                    {showPillars && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden border-b border-blue-100"
                        >
                            <div className="bg-gradient-to-b from-blue-50 to-white p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                                            <Zap size={14} className="text-white" />
                                        </div>
                                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Os 8 Pilares Estratégicos</h4>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setShowPillars(false)} className="rounded-full h-7 w-7 p-0 text-slate-400 hover:text-slate-600">
                                        <X size={14} />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {PILLARS.map((pillar, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                                    <pillar.icon size={16} className="text-blue-600" />
                                                </div>
                                                <span className="text-[11px] font-black text-slate-800 leading-tight">{pillar.label}</span>
                                            </div>
                                            <p className="text-[10px] text-slate-500 leading-relaxed">{pillar.desc}</p>
                                        </motion.div>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-400 text-center mt-4 italic">A IA cruza todos os pilares para gerar sugestões personalizadas e argumentos consultivos de venda.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center justify-center space-y-4">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-16 h-16 bg-blue-600/10 rounded-3xl flex items-center justify-center"
                            >
                                <Zap className="text-blue-600" size={32} />
                            </motion.div>
                            <div className="text-center">
                                <h3 className="font-bold text-slate-800">Processando Inteligência...</h3>
                                <p className="text-sm text-slate-500">O motor analítico está cruzando 8 pilares estratégicos.</p>
                            </div>
                        </div>
                    ) : suggestion ? (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-6"
                        >
                            {/* Card de Resumo IA */}
                            <div className="bg-white rounded-[2rem] p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-blue-600 text-white px-4 py-1 rounded-bl-2xl text-xs font-black tracking-widest uppercase">
                                    Raio-X do Cliente
                                </div>
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <MessageSquare size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-2 italic">"{suggestion.frase_abertura}"</h4>
                                        <p className="text-base text-slate-600 leading-relaxed font-medium">
                                            {suggestion.analise_geral.resumo}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                                        <h5 className="text-xs font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <Check size={14} /> Pontos Fortes
                                        </h5>
                                        <ul className="space-y-1">
                                            {suggestion.analise_geral.pontos_fortes.map((p, i) => (
                                                <li key={i} className="text-xs text-emerald-700 font-bold">• {p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                        <h5 className="text-xs font-black text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                                            <AlertCircle size={14} /> Pontos de Atenção
                                        </h5>
                                        <ul className="space-y-1">
                                            {suggestion.analise_geral.pontos_atencao.map((p, i) => (
                                                <li key={i} className="text-xs text-amber-700 font-bold">• {p}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* Alertas de Recompra */}
                            {suggestion.alertas_recompra?.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 px-2">
                                        <RefreshCw size={16} className="text-rose-500" />
                                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Reposições Iminentes</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        {suggestion.alertas_recompra.map((item, i) => (
                                            <div
                                                key={i}
                                                onClick={() => toggleItem(item)}
                                                className={`p-4 rounded-3xl border transition-all cursor-pointer flex items-center justify-between ${selectedItems.find(si => si.produto === item.produto)
                                                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30'
                                                    : 'bg-rose-50 border-rose-100 hover:border-rose-300'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black ${selectedItems.find(si => si.produto === item.produto) ? 'bg-white/20' : 'bg-white text-rose-600 shadow-sm'
                                                        }`}>
                                                        <Zap size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-black text-base">{item.produto}</span>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${selectedItems.find(si => si.produto === item.produto) ? 'bg-white/20' : 'bg-rose-200 text-rose-800'
                                                                }`}>
                                                                {item.urgencia}
                                                            </span>
                                                        </div>
                                                        <p className={`text-xs italic leading-tight ${selectedItems.find(si => si.produto === item.produto) ? 'text-blue-100' : 'text-slate-500'}`}>
                                                            {item.argumento_venda}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-black text-base">{item.quantidade_sugerida} un.</div>
                                                    {selectedItems.find(si => si.produto === item.produto) ? <Check size={20} /> : <Plus size={20} className="text-rose-400" />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Sugestões de Novos Produtos */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2">
                                    <TrendingUp size={16} className="text-blue-600" />
                                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Oportunidades de Mix</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {suggestion.sugestoes_novos_produtos.map((item, i) => (
                                        <div
                                            key={i}
                                            onClick={() => toggleItem(item)}
                                            className={`p-5 rounded-[2rem] border transition-all cursor-pointer relative group ${selectedItems.find(si => si.produto === item.produto)
                                                ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/30'
                                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedItems.find(si => si.produto === item.produto) ? 'bg-white/20' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        <Sparkles size={24} />
                                                    </div>
                                                    <div>
                                                        <h5 className="font-black text-lg">{item.produto}</h5>
                                                        <p className={`text-xs font-black uppercase tracking-widest ${selectedItems.find(si => si.produto === item.produto) ? 'text-blue-200' : 'text-blue-600'}`}>
                                                            {item.motivo_principal}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs font-black opacity-60 uppercase mb-1">Faturamento Est.</div>
                                                    <div className="font-black text-lg">{formatCurrency(item.potencial_faturamento)}</div>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-2xl mb-4 ${selectedItems.find(si => si.produto === item.produto) ? 'bg-white/10' : 'bg-slate-50'
                                                }`}>
                                                <h6 className="text-[11px] font-black uppercase opacity-60 mb-2">Argumento Consultivo</h6>
                                                <p className="text-sm leading-relaxed font-medium italic">
                                                    "{item.argumento_venda}"
                                                </p>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <div className="text-[11px] font-black opacity-60 uppercase">Qtd Inicial</div>
                                                        <div className="font-black text-base">{item.quantidade_sugerida_inicial} un.</div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className={`rounded-full px-6 font-black uppercase tracking-widest text-xs transition-all transform ${selectedItems.find(si => si.produto === item.produto)
                                                        ? 'bg-white text-blue-600 hover:bg-slate-100 scale-105'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {selectedItems.find(si => si.produto === item.produto) ? 'Selecionado' : 'Selecionar'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="py-20 text-center">
                            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
                            <p className="text-slate-500">Nenhum dado disponível.</p>
                        </div>
                    )}
                </div>

                <DialogFooter className="bg-white p-6 border-t border-slate-100">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Itens Selecionados</span>
                            <span className="text-lg font-black text-slate-800">{selectedItems.length}</span>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="outline" onClick={onClose} className="rounded-full px-8 font-black uppercase tracking-widest text-xs border-slate-300">
                                Cancelar
                            </Button>
                            <Button
                                disabled={selectedItems.length === 0}
                                onClick={handleAddSelected}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-10 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/30 group"
                            >
                                Adicionar Selecionados
                                <ChevronRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default IASuggestionDialog;
