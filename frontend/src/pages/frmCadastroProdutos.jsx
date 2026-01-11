import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Package, FileText } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const FrmCadastroProdutos = () => {
    const [industries, setIndustries] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Carregar indústrias
    useEffect(() => {
        fetchIndustries();
    }, []);

    // Filtrar produtos quando o termo de busca mudar
    useEffect(() => {
        if (searchTerm) {
            const filtered = products.filter(product =>
                product.pro_codprod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.pro_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.pro_ncm?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const fetchIndustries = async () => {
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/suppliers');
            const data = await response.json();
            if (data.success) {
                // Remove duplicates and ensure valid IDs
                const uniqueIndustries = data.data.reduce((acc, current) => {
                    const x = acc.find(item => item.for_codigo === current.for_codigo);
                    if (!x && current.for_codigo) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
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
            const response = await fetch(`https://salesmasters.softham.com.br/api/products/catalog/${industria}`);
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
        if (selectedIndustry) {
            fetchProducts(selectedIndustry);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Cadastro de Produtos</h1>
                </div>
                <p className="text-sm text-gray-600 mt-1">Catálogo mestre de produtos (dados fixos)</p>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-4">
                <div className="flex items-end gap-4">
                    {/* Indústria */}
                    <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">Indústria</Label>
                        <Select value={selectedIndustry} onValueChange={handleIndustryChange}>
                            <SelectTrigger className="h-10">
                                <SelectValue placeholder="Selecione a indústria" />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map((ind) => (
                                    <SelectItem
                                        key={ind.for_codigo}
                                        value={String(ind.for_codigo)}
                                    >
                                        {ind.for_nomered || ind.for_nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Busca */}
                    <div className="flex-1">
                        <Label className="text-sm font-medium mb-2 block">Buscar</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="text"
                                placeholder="Código, descrição ou NCM..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10"
                                disabled={!selectedIndustry}
                            />
                        </div>
                    </div>

                    {/* Atualizar */}
                    <Button
                        onClick={handleRefresh}
                        disabled={!selectedIndustry || loading}
                        size="default"
                        variant="outline"
                        className="h-10"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </Button>
                </div>

                {/* Info */}
                {selectedIndustry && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        <span>
                            {filteredProducts.length} produto(s) encontrado(s)
                            {searchTerm && ` (filtrado de ${products.length})`}
                        </span>
                    </div>
                )}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {!selectedIndustry ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 text-lg">Selecione uma indústria para visualizar os produtos</p>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center">
                            <RefreshCw className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-500">Carregando produtos...</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Código
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Descrição
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            NCM
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Peso
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Embalagem
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Grupo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Aplicação
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Cód. Barras
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.pro_id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {product.pro_codprod}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {product.pro_nome}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.pro_ncm || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.pro_peso ? `${product.pro_peso} kg` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.pro_embalagem || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.pro_grupo || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                                                {product.pro_aplicacao || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {product.pro_codbarras || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.pro_status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.pro_status ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredProducts.length === 0 && selectedIndustry && !loading && (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">
                                        {searchTerm ? 'Nenhum produto encontrado com os critérios de busca' : 'Nenhum produto cadastrado para esta indústria'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrmCadastroProdutos;
