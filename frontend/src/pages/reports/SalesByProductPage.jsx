
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, RefreshCcw } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import { toast } from 'sonner';

export default function SalesByProductPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [industries, setIndustries] = useState([]);
    const [selectedIndustry, setSelectedIndustry] = useState('');

    useEffect(() => {
        fetchIndustries();
    }, []);

    const fetchIndustries = async () => {
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, '/api/suppliers'));
            const json = await res.json();
            if (json.success) setIndustries(json.data);
        } catch (error) {
            console.error('Erro indústrias:', error);
        }
    };

    const handleSearch = async (val) => {
        setSearchTerm(val);
        if (selectedProduct) setSelectedProduct(null); // Limpa seleção ao digitar novo termo

        if (val.length < 2) {
            setSearchResults([]);
            return;
        }

        if (!selectedIndustry) {
            toast.warning('Selecione uma indústria primeiro');
            return;
        }

        setSearching(true);
        try {
            // Limpa o ID para evitar casos como "3:1"
            const cleanId = String(selectedIndustry).split(':')[0];
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/reports/products/search?q=${val}&supplierId=${cleanId}`));
            const json = await res.json();

            if (json.success) {
                setSearchResults(json.data);
            } else {
                toast.error(json.message || 'Erro ao buscar produtos');
                setSearchResults([]);
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro de conexão com o servidor');
            setSearchResults([]);
        } finally {
            setSearching(false);
        }
    };

    const selectProduct = (p) => {
        setSelectedProduct(p);
        setSearchTerm(p.referencia); // Inserir o código para não dar erro de busca
        setSearchResults([]);
        loadData(p.id);
    };

    const loadData = async (productId) => {
        let id = productId || selectedProduct?.id;

        // Se clicar no botão e não tiver selecionado, mas houver resultados na lista, pega o primeiro
        if (!id && searchResults.length > 0) {
            const firstResult = searchResults[0];
            setSelectedProduct(firstResult);
            setSearchTerm(firstResult.referencia);
            setSearchResults([]);
            id = firstResult.id;
        }

        if (!id) {
            toast.error('Selecione um produto da lista');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/reports/sales-by-product?productCode=${id}&supplierId=${selectedIndustry}`));

            const json = await res.json();
            if (json.success) {
                setData(json.data);
                toast.success(`${json.data.length} compras encontradas`);
            }
        } catch (error) {
            toast.error('Erro ao buscar dados');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Package className="w-8 h-8 text-emerald-600" />
                            Venda de Produtos Geral
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Veja para quais clientes um produto específico foi vendido e há quanto tempo.</p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-sm bg-white overflow-visible">
                    <CardContent className="p-6">
                        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-end">
                            <div className="flex-1 w-full space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">1. Selecione a Indústria</Label>
                                <Select value={selectedIndustry} onValueChange={(val) => {
                                    setSelectedIndustry(val);
                                    setSearchTerm('');
                                    setSearchResults([]);
                                    setSelectedProduct(null);
                                    setData([]);
                                }}>
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Escolha a representação..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {industries.map(ind => (
                                            <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                                {ind.for_nomered}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-[2] w-full space-y-2 relative">
                                <Label className="text-xs font-bold uppercase text-slate-500">2. Buscar Produto (Nome ou Código)</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            placeholder={selectedIndustry ? "Digite o código ou nome..." : "Selecione a indústria primeiro"}
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && loadData()}
                                            className="h-10 pr-10"
                                            disabled={!selectedIndustry}
                                        />
                                        {searching && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <RefreshCcw className="w-4 h-4 animate-spin text-slate-400" />
                                            </div>
                                        )}

                                        {!selectedProduct && (searchResults.length > 0 || (searchTerm.length >= 2 && !searching)) && (
                                            <div className="absolute top-full left-0 right-0 z-[99999] mt-2 bg-white border-2 border-emerald-500 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] rounded-xl max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                                {searchResults.length > 0 ? (
                                                    <>
                                                        <div className="p-2 bg-emerald-50 text-[10px] font-bold text-emerald-700 border-b border-emerald-100 uppercase tracking-widest text-center italic">
                                                            {searchResults.length} produtos encontrados
                                                        </div>
                                                        {searchResults.map(p => (
                                                            <div
                                                                key={p.id}
                                                                className="p-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex justify-between items-center group"
                                                                onClick={() => selectProduct(p)}
                                                            >
                                                                <div className="flex-1">
                                                                    <div className="font-black text-slate-800 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{p.referencia}</div>
                                                                    <div className="text-[11px] text-slate-500 font-medium uppercase truncate max-w-[280px]">{p.nome}</div>
                                                                </div>
                                                                <div className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1.5 rounded-lg font-black group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                                                                    SELECIONAR
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                ) : searchTerm.length >= 2 && !searching && (
                                                    <div className="p-8 text-center bg-white rounded-xl">
                                                        <div className="bg-slate-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                                            <Search className="text-slate-400 w-6 h-6" />
                                                        </div>
                                                        <p className="text-slate-500 font-bold text-sm uppercase">Nenhum produto encontrado</p>
                                                        <p className="text-slate-400 text-[10px] mt-1 uppercase">Tente outro código ou termo de busca</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        onClick={() => loadData()}
                                        disabled={loading || !selectedIndustry || searchTerm.length < 3}
                                        className="bg-emerald-600 hover:bg-emerald-700 h-10 w-24"
                                    >
                                        <Search className="w-4 h-4" />
                                    </Button>
                                </div>

                            </div>
                        </div>
                    </CardContent>
                </Card>


                {selectedProduct && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                        <div className="bg-emerald-600 text-white p-2 rounded-lg">
                            <Package size={24} />
                        </div>
                        <div>
                            <div className="text-xs font-black text-emerald-800 uppercase tracking-widest">{selectedProduct.referencia}</div>
                            <div className="text-sm font-bold text-emerald-600 uppercase">{selectedProduct.nome}</div>
                        </div>
                    </div>
                )}

                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold">CLIENTE</TableHead>
                                    <TableHead className="text-center font-bold">DATA DA COMPRA</TableHead>
                                    <TableHead className="text-center font-bold">DIAS SEM COMPRA</TableHead>
                                    <TableHead className="text-center font-bold">PEDIDO</TableHead>
                                    <TableHead className="text-right font-bold">QUANTIDADE</TableHead>
                                    <TableHead className="text-right font-bold">VALOR UNIT.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                                            <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Buscando histórico...
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                                            {selectedProduct ? 'Nenhuma venda registrada para este produto.' : 'Selecione um produto para ver as vendas.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-emerald-50/30 transition-colors">
                                            <TableCell className="font-medium">{item.cli_nomred}</TableCell>
                                            <TableCell className="text-center">
                                                {item.data_compra ? new Date(item.data_compra).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.dias_sem_compra > 180 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {item.dias_sem_compra} dias
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-xs">{item.ped_numero}</TableCell>
                                            <TableCell className="text-right font-bold text-slate-700">{item.ite_quantidade}</TableCell>
                                            <TableCell className="text-right text-slate-600 font-numeric">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ite_valorunit)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

