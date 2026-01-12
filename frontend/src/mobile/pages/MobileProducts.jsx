import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Package, Loader } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDebounce, setSearchDebounce] = useState('');

    // Debounce search to avoid too many API calls
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchDebounce(searchTerm);
        }, 600);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (searchDebounce.length > 2) {
            searchProducts();
        } else {
            setProducts([]);
        }
    }, [searchDebounce]);

    const searchProducts = async () => {
        setLoading(true);
        try {
            const token = sessionStorage.getItem('user') ? JSON.parse(sessionStorage.getItem('user')).token : '';

            // NOTE: Using a generic search endpoint. In a real scenario, we might need to specify a table or industry.
            // For now, let's assume there's a generic product search or we reuse an existing one.
            // If no generic search exists, we might need one.
            // Based on previous files, we can use `/api/price-tables/{industria}/{tabela}/products` if we know them.
            // OR create a new simple endpoint for mobile search globally across default tables.

            // Mocking the result for now until backend endpoint is fully confirmed for "Global Search".
            // Ideally should be: axios.get(`${NODE_API_URL}/api/products/search?q=${searchDebounce}`)

            // FALLBACK TO LOCAL MOCK FOR DEMO IF ENDPOINT NOT READY
            // Real implementation would look like:
            // const response = await axios.get(getApiUrl(NODE_API_URL, `/api/products/search?q=${searchDebounce}`), { headers: { 'x-access-token': token } });

            // Simulação de delay
            await new Promise(r => setTimeout(r, 500));
            setProducts([
                { id: 1, codigo: '102030', descricao: 'PARAFUSO SEXTAVADO 1/4 X 2', preco: 15.50, estoque: 2500, imagem: null },
                { id: 2, codigo: '102031', descricao: 'PORCA 1/4 ZINCADA', preco: 0.35, estoque: 10000, imagem: null },
                { id: 3, codigo: '102032', descricao: 'ARRUELA LISA 1/4', preco: 0.15, estoque: 5000, imagem: null },
            ].filter(p => p.descricao.toLowerCase().includes(searchDebounce.toLowerCase())));

        } catch (error) {
            console.error("Erro ao buscar produtos:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="sticky top-0 bg-gray-50 pt-2 pb-2 z-10">
                <h1 className="text-xl font-bold text-gray-800 mb-3 px-1">Consultar Preços</h1>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Digite o nome ou código..."
                        className="w-full bg-white pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none shadow-sm transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Loader className="animate-spin mb-2" />
                    <span className="text-xs">Buscando...</span>
                </div>
            ) : (
                <div className="space-y-3 pb-20">
                    {products.length > 0 ? products.map(prod => (
                        <div key={prod.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4">
                            {/* Imagem Placeholder */}
                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Package className="text-gray-300 w-8 h-8" />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">{prod.descricao}</h3>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono ml-2">{prod.codigo}</span>
                                </div>

                                <div className="mt-2 flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-gray-400">Estoque</p>
                                        <p className="text-xs font-semibold text-gray-600">{prod.estoque.toLocaleString()} un</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-gray-400">Preço Tabela</p>
                                        <p className="text-lg font-black text-blue-600">R$ {prod.preco.toFixed(2).replace('.', ',')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )) : (
                        searchTerm.length > 2 && (
                            <div className="text-center py-10 text-gray-400 text-sm">
                                Nenhum produto encontrado.
                            </div>
                        )
                    )}

                    {searchTerm.length <= 2 && (
                        <div className="text-center py-20 text-gray-300">
                            <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Digite ao menos 3 letras para buscar.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileProducts;
