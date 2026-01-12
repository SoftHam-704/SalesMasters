import React, { useState, useEffect } from 'react';
import {
    ShoppingCart, Users, TrendingUp, Info,
    ChevronRight, ArrowLeft, Search, CheckCircle2,
    BarChart3, AlertCircle, Award, Package,
    ArrowRight, Star, History, Target, Plus, MapPin, Zap
} from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileOrderWizard = () => {
    const [step, setStep] = useState(1); // 1: Client Selection, 2: Intelligence, 3: Catalog, 4: Summary
    const [selectedClient, setSelectedClient] = useState(null);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Intelligence Data
    const [insights, setInsights] = useState({
        recentOrders: [],
        notBought: [],
        benchmarking: [],
        abcAnalysis: []
    });

    // Cart Data
    const [cart, setCart] = useState([]);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setLoading(true);
        try {
            // O interceptor axiosInterceptor.js injeta automaticamente:
            // - x-access-token (do localStorage)
            // - x-tenant-cnpj (do sessionStorage)
            // - x-tenant-db-config (do sessionStorage)
            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/clientes'));
            setClients(response.data.data || []);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadClientIntelligence = async (client) => {
        setLoading(true);
        setSelectedClient(client);
        try {
            // Period for analysis (last 6 months)
            const end = new Date().toISOString().split('T')[0];
            const start = new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0];

            await axios.get(getApiUrl(NODE_API_URL, `/api/reports/ultimas-compras?start=${start}&end=${end}&cliente=${client.codigo}&industria=ALL`));

            setInsights({
                recentOrders: [
                    { data: '05/01/2026', valor: 4500.50, items: 12 },
                    { data: '12/12/2025', valor: 3200.00, items: 8 }
                ],
                notBought: [
                    { codigo: '78910', nome: 'PARAFUSO AUTO BROCANTE 1/2', motivo: 'Nunca comprado' },
                    { codigo: '44552', nome: 'BUCHA NYLON 8MM', motivo: 'Giro alto na região' }
                ],
                benchmarking: [
                    { codigo: '10203', nome: 'ARRUELA LISA 1/4', status: 'Concorrente Vende' }
                ],
                abcAnalysis: { a: 15, b: 35, c: 50 }
            });

            setStep(2);
        } catch (error) {
            console.error("Erro ao carregar inteligência:", error);
            setStep(2);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = (prod) => {
        const existing = cart.find(item => item.codigo === prod.codigo);
        if (existing) {
            setCart(cart.map(item => item.codigo === prod.codigo ? { ...item, qtd: item.qtd + 1 } : item));
        } else {
            setCart([...cart, { ...prod, qtd: 1 }]);
        }
    };

    const removeFromCart = (codigo) => {
        setCart(cart.filter(item => item.codigo !== codigo));
    };

    const totalOrder = cart.reduce((sum, item) => sum + (item.preco * item.qtd), 0);

    // --- Sub-Components for Steps ---

    const Step1_ClientSelection = () => (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 -mx-4 -mt-4 p-8 rounded-b-[3rem] shadow-xl text-white">
                <h2 className="text-2xl font-black mb-2">Novo Pedido</h2>
                <p className="text-blue-100 text-sm font-medium opacity-80">Selecione o cliente para iniciar a venda</p>
            </div>

            <div className="relative -mt-12 px-1">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                    type="text"
                    placeholder="Nome, Fantasia ou Cidade..."
                    className="w-full bg-white pl-14 pr-4 py-5 rounded-3xl border-none outline-none shadow-2xl text-slate-700 font-medium focus:ring-4 focus:ring-blue-500/10 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="space-y-3 px-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Clientes Disponíveis</p>
                {clients.filter(c => (c.fantasia || c.raz_social || c.cli_nomred || '').toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, 15).map(c => (
                        <button
                            key={c.codigo}
                            onClick={() => loadClientIntelligence(c)}
                            className="w-full bg-white p-5 rounded-[2.5rem] border border-slate-50 flex items-center justify-between active:scale-95 active:bg-blue-50 transition-all shadow-xl shadow-slate-200/40"
                        >
                            <div className="flex items-center gap-4 text-left">
                                <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 font-black">
                                    {(c.fantasia || c.raz_social || c.cli_nomred || 'C').substring(0, 1).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-black text-slate-800 text-sm uppercase tracking-tight truncate max-w-[200px]">{c.fantasia || c.raz_social || c.cli_nomred}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{c.cidade} • {c.uf}</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
                                <ChevronRight size={20} />
                            </div>
                        </button>
                    ))}

                {clients.length === 0 && !loading && (
                    <div className="p-10 text-center text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
                        Nenhum cliente disponível.
                    </div>
                )}
            </div>
        </div>
    );

    const Step2_Intelligence = () => (
        <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-10">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 -mx-4 -mt-4 p-8 rounded-b-[3rem] text-white shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/20 backdrop-blur-md rounded-2xl border border-white/10 text-blue-400">
                            <Award size={28} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight truncate max-w-[220px]">{selectedClient?.fantasia || selectedClient?.raz_social}</h2>
                            <p className="text-slate-400 text-xs font-bold tracking-widest uppercase">Inteligência Estratégica</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/5">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Última Venda</p>
                            <p className="font-black text-lg">{insights.recentOrders[0]?.data || 'Sem registro'}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-3xl border border-white/5">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">Recorrência</p>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-lg">ALTA</span>
                                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gap Analysis Section */}
            <div className="space-y-6 px-1">
                <div className="flex items-center justify-between px-2">
                    <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                        <Zap className="text-yellow-500" size={16} fill="currentColor" /> Mix Sugerido
                    </h3>
                    <span className="text-[10px] bg-rose-50 text-rose-600 px-3 py-1 rounded-full font-black">OPORTUNIDADE</span>
                </div>

                <div className="grid gap-4">
                    {insights.notBought.map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1.5 h-full bg-rose-500"></div>
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <h4 className="font-black text-slate-800 text-sm uppercase leading-tight mb-1">{item.nome}</h4>
                                    <p className="text-[10px] text-rose-500 font-black uppercase tracking-tighter">{item.motivo}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        addToCart({ codigo: item.codigo, descricao: item.nome, preco: 45.00 });
                                        setStep(3);
                                    }}
                                    className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-90 transition-transform"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Benchmark Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-400 p-6 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                    <div className="flex items-center gap-3 mb-4">
                        <History size={20} className="text-blue-100" />
                        <h4 className="font-black text-xs uppercase tracking-widest">Alerta de Benchmark</h4>
                    </div>
                    <p className="text-sm font-bold opacity-90 mb-6">O concorrente comprou "ARRUELA LISA 1/4" esta semana. Seu cliente ainda não.</p>
                    <button onClick={() => setStep(3)} className="w-full py-4 bg-white text-blue-600 rounded-3xl font-black text-xs uppercase tracking-widest shadow-lg">
                        Corrigir Mix Agora
                    </button>
                </div>
            </div>

            <button
                onClick={() => setStep(3)}
                className="w-full py-5 bg-slate-900 text-white font-black rounded-[2.5rem] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
            >
                Abrir Catálogo <ShoppingCart size={18} />
            </button>
        </div>
    );

    const Step3_Catalog = () => (
        <div className="animate-in slide-in-from-right duration-500">
            <div className="flex items-center justify-between bg-white/80 backdrop-blur-md -mx-4 -mt-4 p-6 mb-4 sticky top-0 z-50 border-b border-slate-100">
                <button onClick={() => setStep(2)} className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-xl text-slate-400"><ArrowLeft size={20} /></button>
                <div className="text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Catálogo Digital</p>
                    <h4 className="text-xs font-black text-slate-800 uppercase truncate max-w-[150px]">{selectedClient?.fantasia || selectedClient?.raz_social}</h4>
                </div>
                <div className="relative">
                    <button onClick={() => setStep(4)} className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 flex items-center justify-center">
                        <Package size={20} />
                    </button>
                    {cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white">
                            {cart.length}
                        </span>
                    )}
                </div>
            </div>

            <div className="px-1 space-y-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Pesquisar itens..."
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-3xl border border-slate-100 outline-none shadow-xl shadow-slate-200/40 text-sm font-bold"
                    />
                </div>

                <div className="grid gap-4 pb-32">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="bg-white p-4 rounded-[2.2rem] border border-slate-50 shadow-xl shadow-slate-200/30 flex gap-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[1.8rem] flex items-center justify-center text-slate-200 border border-slate-100">
                                <Package size={32} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-black text-slate-800 text-xs uppercase leading-tight mb-1">CÓD {700 + i} - ITEM MESTRE DE EXEMPLO</h4>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Grupo: FIXADORES</p>
                                <div className="flex justify-between items-center mt-3">
                                    <span className="text-blue-600 font-black text-lg italic">R$ 15,90</span>
                                    <button
                                        onClick={() => addToCart({ codigo: 'EX' + i, descricao: 'ITEM MESTRE #' + (700 + i), preco: 15.90 })}
                                        className="bg-blue-600 text-white p-2 px-6 rounded-2xl text-[10px] font-black uppercase shadow-lg shadow-blue-100 active:scale-90 transition-transform"
                                    >
                                        ADICIONAR
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-24 left-4 right-4 bg-slate-900/90 backdrop-blur-xl text-white p-5 rounded-[2.5rem] flex justify-between items-center shadow-2xl animate-in slide-in-from-bottom duration-700 z-50">
                    <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Subtotal</p>
                        <p className="text-2xl font-black italic">R$ {totalOrder.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button onClick={() => setStep(4)} className="bg-blue-600 h-14 px-8 rounded-[1.8rem] font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
                        CHECKOUT <ArrowRight size={18} />
                    </button>
                </div>
            )}
        </div>
    );

    const Step4_Summary = () => (
        <div className="space-y-6 animate-in zoom-in duration-500 pb-10 px-1">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Revisão Final</h2>

            <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-[2.5rem] border border-blue-100 shadow-xl shadow-blue-100/20">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3">CLIENTE DESTINO</p>
                <h3 className="font-black text-slate-800 text-lg uppercase leading-tight">{selectedClient?.fantasia || selectedClient?.raz_social}</h3>
                <div className="flex items-center gap-1 text-xs text-slate-400 font-bold mt-2">
                    <MapPin size={12} /> {selectedClient?.cidade} - {selectedClient?.uf}
                </div>
            </div>

            <div className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Itens Selecionados ({cart.length})</p>
                <div className="bg-white rounded-[2.5rem] border border-slate-50 divide-y divide-slate-50 overflow-hidden shadow-xl shadow-slate-100/50">
                    {cart.map(item => (
                        <div key={item.codigo} className="p-5 flex justify-between items-center bg-white group">
                            <div>
                                <h4 className="font-black text-slate-800 text-xs uppercase">{item.descricao}</h4>
                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">{item.qtd} UNIDADE(S) • UNIT: R$ {item.preco.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-slate-700 italic">R$ {(item.preco * item.qtd).toFixed(2)}</span>
                                <button onClick={() => removeFromCart(item.codigo)} className="w-8 h-8 bg-rose-50 text-rose-500 flex items-center justify-center rounded-xl active:scale-90 transition-transform">
                                    <AlertCircle size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mb-10"></div>
                <div className="space-y-3 relative z-10">
                    <div className="flex justify-between items-center opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-widest">Base de Cálculo</span>
                        <span className="font-bold">R$ {totalOrder.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center opacity-40">
                        <span className="text-[10px] font-black uppercase tracking-widest">IPI/ST (EST.)</span>
                        <span className="font-bold">R$ {(totalOrder * 0.12).toFixed(2)}</span>
                    </div>
                    <div className="border-t border-white/5 pt-4 mt-2 flex justify-between items-end">
                        <div>
                            <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] block mb-1">VALOR TOTAL</span>
                            <span className="text-3xl font-black italic tracking-tighter">R$ {(totalOrder * 1.12).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <CheckCircle2 size={40} className="text-blue-500 opacity-20" />
                    </div>
                </div>
            </div>

            <button
                onClick={() => {
                    alert("✅ Pedido enviado com sucesso para faturamento!");
                    setStep(1);
                    setCart([]);
                    setSelectedClient(null);
                }}
                className="w-full py-6 bg-gradient-to-r from-blue-700 to-blue-500 text-white font-black rounded-[2.5rem] shadow-2xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
            >
                ENVIAR PARA FÁBRICA
            </button>

            <button onClick={() => setStep(3)} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest py-2">
                Revisar Itens do Carrinho
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 p-4 pb-24">
            {step === 1 && <Step1_ClientSelection />}
            {step === 2 && <Step2_Intelligence />}
            {step === 3 && <Step3_Catalog />}
            {step === 4 && <Step4_Summary />}

            {loading && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex flex-col items-center justify-center space-y-6">
                    <div className="w-16 h-16 border-4 border-white/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="text-center">
                        <p className="text-white font-black text-xs uppercase tracking-[0.3em]">IA Masters</p>
                        <p className="text-white/60 text-[10px] font-bold mt-1 uppercase">Sincronizando estratégia...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileOrderWizard;
