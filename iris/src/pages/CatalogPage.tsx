import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { Search, ChevronLeft, Plus, ChevronRight, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CatalogPage = () => {
    const navigate = useNavigate();
    const { industrias } = useAuthStore();
    const { addItem, items } = useCartStore();
    
    const [selectedInd, setSelectedInd] = useState(industrias[0]?.id || null);
    const [search, setSearch] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedInd) {
            handleSearch();
        }
    }, [selectedInd]);

    const handleSearch = async (term = search) => {
        if (!selectedInd) return;
        setLoading(true);
        try {
            const res = await catalogApi.search(term || ' ', selectedInd); // Espaço para listar iniciais
            setProducts(res.data.data);
        } catch (e) {
            console.error(e);
        }
        setLoading(false);
    };

    const addToCart = (p: any) => {
        addItem({
            pro_id: p.pro_id,
            pro_codprod: p.pro_codprod,
            pro_nome: p.pro_nome,
            pro_conversao: p.pro_conversao,
            pro_embalagem: p.pro_embalagem,
            quantidade: 1,
            preco_unitario: parseFloat(p.itab_precobruto),
            itab_ipi: parseFloat(p.itab_ipi),
            itab_st: parseFloat(p.itab_st)
        });
    };

    return (
        <div className="min-h-screen bg-[#06112a] flex flex-col">
            {/* Nav Header */}
            <div className="p-6 flex items-center justify-between bg-[#0f172a]/50 backdrop-blur-md sticky top-0 z-10 border-b border-white/5">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold font-italic italic">Catálogo</h1>
                <button onClick={() => navigate('/cart')} className="relative p-2 text-[#14B8A6]">
                    <ShoppingBag size={24} />
                    {items.length > 0 && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {items.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Indústrias Chips */}
            <div className="flex gap-2 overflow-x-auto p-6 pt-4 pb-2 no-scrollbar">
                {industrias.map(ind => (
                    <button
                        key={ind.id}
                        onClick={() => setSelectedInd(ind.id)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all italic border ${
                            selectedInd === ind.id 
                            ? 'bg-[#14B8A6] text-black border-[#14B8A6]' 
                            : 'bg-[#1e293b] text-gray-400 border-white/5'
                        }`}
                    >
                        {ind.nome_resumido || ind.nome}
                    </button>
                ))}
            </div>

            {/* Search Input */}
            <div className="px-6 py-4">
                <div className="relative group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#14B8A6] transition-colors" />
                    <input 
                        type="text"
                        placeholder="Buscar por nome popular, código..."
                        className="w-full bg-[#1e293b] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#14B8A6]/50 transition-all font-italic italic"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
            </div>

            {/* Product List */}
            <div className="flex-1 px-6 pb-10 flex flex-col gap-4">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center py-20 text-gray-500 italic">Carregando catálogo...</div>
                ) : products.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-gray-500 gap-4 opacity-50">
                        <ShoppingBag size={64} strokeWidth={1} />
                        <p className="italic">Nenhum produto encontrado.</p>
                    </div>
                ) : (
                    products.map((p: any) => (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={p.pro_id} 
                            className="bg-[#1e293b]/50 p-4 rounded-3xl border border-white/5 flex gap-4 backdrop-blur-sm relative"
                        >
                            <div className="w-20 h-20 bg-[#0f172a] rounded-2xl flex items-center justify-center text-[#14B8A6]/50 border border-white/5">
                                <Plus size={24} />
                            </div>
                            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
                                <div>
                                    <h3 className="text-sm font-bold truncate italic uppercase pr-8">{p.pro_conversao || p.pro_nome}</h3>
                                    <p className="text-[10px] text-gray-400 italic truncate py-1">Cod: {p.pro_codprod} • {p.pro_embalagem}</p>
                                </div>
                                <div className="flex justify-between items-end">
                                    <p className="text-lg font-bold text-[#14B8A6]">
                                        <span className="text-[10px] align-top mt-1 inline-block mr-1">R$</span>
                                        {parseFloat(p.itab_precobruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <button 
                                        onClick={() => addToCart(p)}
                                        className="bg-[#14B8A6] text-black w-8 h-8 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                                    >
                                        <Plus size={18} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CatalogPage;
