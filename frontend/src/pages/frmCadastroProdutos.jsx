import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, Plus, Pencil, Trash2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from "../utils/apiConfig";
import ProductDialog from "@/components/forms/ProductDialog";

const FrmCadastroProdutos = () => {
    const [industries, setIndustries] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    useEffect(() => { fetchIndustries(); }, []);

    useEffect(() => {
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const filtered = products.filter(p =>
                p.pro_codprod?.toLowerCase().includes(term) ||
                p.pro_nome?.toLowerCase().includes(term) ||
                p.pro_codigonormalizado?.toLowerCase().includes(term) ||
                p.pro_conversao?.toLowerCase().includes(term) ||
                p.pro_aplicacao?.toLowerCase().includes(term)
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const fetchIndustries = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/suppliers'));
            const data = await response.json();
            if (data.success) {
                const uniqueIndustries = data.data.reduce((acc, current) => {
                    const x = acc.find(item => item.for_codigo === current.for_codigo);
                    if (!x && current.for_codigo) return acc.concat([current]);
                    return acc;
                }, []);
                setIndustries(uniqueIndustries);
            }
        } catch (error) {
            console.error('Erro ao carregar indústrias:', error);
            toast.error('Erro ao carregar indústrias');
        }
    };

    const fetchProducts = async (industria) => {
        if (!industria || industria === 'undefined') return;
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/products/catalog/${industria}`));
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
                setFilteredProducts(data.data);
            } else {
                toast.error(data.message || 'Erro ao carregar produtos');
                setProducts([]);
                setFilteredProducts([]);
            }
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            toast.error('Erro de conexão ao buscar produtos');
            setProducts([]);
            setFilteredProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const handleIndustryChange = (value) => {
        setSelectedIndustry(value);
        setSearchTerm('');
        fetchProducts(value);
    };

    const handleRefresh = () => {
        if (selectedIndustry) fetchProducts(selectedIndustry);
    };

    const handleEdit = (product) => {
        setSelectedProduct(product);
        setDialogOpen(true);
    };

    const handleDelete = async (product) => {
        if (window.confirm(`Deseja realmente excluir o produto ${product.pro_codprod}?`)) {
            try {
                const response = await fetch(getApiUrl(NODE_API_URL, `/api/products/${product.pro_id}`), { method: 'DELETE' });
                const data = await response.json();
                if (data.success) {
                    toast.success('Produto excluído com sucesso');
                    fetchProducts(selectedIndustry);
                } else {
                    toast.error(data.message || 'Erro ao excluir produto');
                }
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                toast.error('Erro de conexão ao excluir produto');
            }
        }
    };

    const handleSaveProduct = async (dadosProduto) => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/products/save'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosProduto)
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Produto salvo com sucesso');
                setDialogOpen(false);
                fetchProducts(selectedIndustry);
            } else {
                toast.error(data.message || 'Erro ao salvar produto');
            }
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            toast.error('Erro de conexão ao salvar produto');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                        <Package className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-base font-semibold text-gray-900 leading-none">Catálogo Mestre</h1>
                        <p className="text-[11px] text-gray-400 mt-0.5">Gestão de Produtos</p>
                    </div>
                </div>
                <Button
                    onClick={() => { setSelectedProduct(null); setDialogOpen(true); }}
                    disabled={!selectedIndustry}
                    size="sm"
                    className="bg-gray-800 text-white hover:bg-gray-700 text-xs gap-1.5 h-8 px-4"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Novo Produto
                </Button>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b border-gray-200 px-6 py-3">
                <div className="flex items-center gap-4">
                    {/* Industry selector */}
                    <div className="w-72">
                        <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
                            <SelectTrigger className="h-9 text-sm border-gray-300 focus:ring-gray-400">
                                <SelectValue placeholder="Selecione a indústria" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                {industries
                                    .filter(ind => ind.for_codigo && String(ind.for_codigo).trim() !== "")
                                    .map((ind) => (
                                        <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                            <span className="font-medium">{ind.for_nomered || ind.for_nome}</span>
                                            <span className="ml-2 text-xs text-gray-400">#{ind.for_codigo}</span>
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Buscar por código, descrição, aplicação..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 h-9 text-sm border-gray-300 focus:ring-gray-400"
                            disabled={!selectedIndustry}
                        />
                    </div>

                    {/* Refresh */}
                    <button
                        onClick={handleRefresh}
                        disabled={!selectedIndustry || loading}
                        className="h-9 px-3 border border-gray-300 rounded-md flex items-center gap-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 disabled:opacity-40 transition-colors"
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>

                    {/* Counter */}
                    {selectedIndustry && (
                        <div className="text-xs text-gray-400 whitespace-nowrap border-l border-gray-200 pl-4">
                            <span className="font-semibold text-gray-600">{filteredProducts.length}</span> produto{filteredProducts.length !== 1 ? 's' : ''}
                            {searchTerm && <span className="ml-1 text-amber-500">(filtrado)</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-hidden">
                {!selectedIndustry ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                        <Package className="h-12 w-12 opacity-15" />
                        <p className="text-sm">Selecione uma indústria para carregar os produtos</p>
                    </div>
                ) : loading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4">
                        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin"></div>
                        <p className="text-sm">Carregando produtos...</p>
                    </div>
                ) : (
                    <div className="h-full overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 z-10">
                                <tr className="bg-gray-100 border-b border-gray-200">
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '130px' }}>Código</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs">Descrição</th>
                                    <th className="text-left px-4 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '160px' }}>Conversão</th>
                                    <th className="text-right px-4 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '80px' }}>Peso</th>
                                    <th className="text-center px-4 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '50px' }}>Emb</th>
                                    <th className="text-center px-2 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '50px' }}>Grp</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-emerald-600 text-xs" style={{ width: '48px' }}>Leve</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-blue-600 text-xs" style={{ width: '48px' }}>Pesad</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-amber-600 text-xs" style={{ width: '48px' }}>Agríc</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-purple-600 text-xs" style={{ width: '48px' }}>Util</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-rose-600 text-xs" style={{ width: '48px' }}>Moto</th>
                                    <th className="text-center px-1 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '48px' }}>Off</th>
                                    <th className="text-center px-2 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '30px' }}></th>
                                    <th className="text-center px-2 py-2.5 font-semibold text-gray-600 text-xs" style={{ width: '80px' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product, idx) => (
                                    <tr
                                        key={product.pro_id}
                                        className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                    >
                                        {/* Code */}
                                        <td className="px-4 py-2">
                                            <span className="font-semibold text-gray-900 text-[13px]">{product.pro_codprod}</span>
                                        </td>

                                        {/* Description + Application */}
                                        <td className="px-4 py-2">
                                            <div className="leading-tight">
                                                <span className="text-gray-800 text-[13px]">{product.pro_nome}</span>
                                                {product.pro_aplicacao && product.pro_aplicacao !== 'None' && (
                                                    <p className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[400px]">{product.pro_aplicacao}</p>
                                                )}
                                            </div>
                                        </td>

                                        {/* Conversion */}
                                        <td className="px-4 py-2 text-gray-500 text-[12px]">
                                            {product.pro_conversao || ''}
                                        </td>

                                        {/* Weight */}
                                        <td className="px-4 py-2 text-right text-gray-500 text-[12px] tabular-nums">
                                            {product.pro_peso ? `${product.pro_peso}kg` : ''}
                                        </td>

                                        {/* Packaging */}
                                        <td className="px-4 py-2 text-center text-gray-500 text-[12px] tabular-nums">
                                            {product.pro_embalagem || 1}
                                        </td>

                                        {/* Group */}
                                        <td className="px-4 py-2 text-center text-gray-400 text-[12px]">
                                            {product.pro_grupo || ''}
                                        </td>

                                        {/* Categories - individual columns */}
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_linhaleve && <Check className="h-4 w-4 mx-auto text-emerald-500" strokeWidth={2.5} />}
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_linhapesada && <Check className="h-4 w-4 mx-auto text-blue-500" strokeWidth={2.5} />}
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_linhaagricola && <Check className="h-4 w-4 mx-auto text-amber-500" strokeWidth={2.5} />}
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_linhautilitarios && <Check className="h-4 w-4 mx-auto text-purple-500" strokeWidth={2.5} />}
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_motocicletas && <Check className="h-4 w-4 mx-auto text-rose-500" strokeWidth={2.5} />}
                                        </td>
                                        <td className="px-1 py-2 text-center">
                                            {product.pro_offroad && <Check className="h-4 w-4 mx-auto text-gray-500" strokeWidth={2.5} />}
                                        </td>

                                        {/* Status */}
                                        <td className="px-2 py-2 text-center">
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full mx-auto ${product.pro_status ? 'bg-emerald-500' : 'bg-red-400'}`}
                                                title={product.pro_status ? 'Ativo' : 'Inativo'}
                                            ></div>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-2 py-2">
                                            <div className="flex items-center justify-center gap-0.5">
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product)}
                                                    className="w-7 h-7 rounded flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {filteredProducts.length === 0 && selectedIndustry && !loading && (
                            <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <p className="text-sm">Nenhum produto encontrado</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Product Dialog */}
            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                product={selectedProduct}
                industria={selectedIndustry}
                tabela={null}
                onSave={handleSaveProduct}
            />
        </div>
    );
};

export default FrmCadastroProdutos;
