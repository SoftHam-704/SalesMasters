import React, { useState, useEffect } from 'react';
import {
    Pencil, Trash2, RefreshCw, Plus, MoreVertical,
    FileText, X, Percent, DollarSign, Package,
    Calculator, TrendingUp, FileSpreadsheet, Code,
    Copy, Layers, Upload, BarChart3
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ProductDialog from "@/components/forms/ProductDialog";
import ProductSalesDialog from "@/components/products/ProductSalesDialog";
import DiscountGroupDialog from "@/components/products/DiscountGroupDialog";
import PercentageInputDialog from "@/components/dialogs/PercentageInputDialog";
import AIImportButton from "@/components/products/AIImportButton";
import AIImportDialog from "@/components/products/AIImportDialog";
import { toast } from "sonner";
import { useTabs } from '../contexts/TabContext';
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';

const FrmProdutos = () => {
    const { selectTab } = useTabs();
    const [industries, setIndustries] = useState([]);
    const [tables, setTables] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [selectedIndustry, setSelectedIndustry] = useState('');
    const [selectedTable, setSelectedTable] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // Sales Analysis Dialog
    const [salesDialogOpen, setSalesDialogOpen] = useState(false);
    const [salesProduct, setSalesProduct] = useState(null);

    // Discount Group Dialog
    const [discountGroupDialogOpen, setDiscountGroupDialogOpen] = useState(false);

    // IPI and ST Percentage Dialogs
    const [ipiDialogOpen, setIpiDialogOpen] = useState(false);
    const [stDialogOpen, setStDialogOpen] = useState(false);

    // AI Import Dialog
    const [aiImportDialogOpen, setAiImportDialogOpen] = useState(false);

    // Carregar indústrias
    useEffect(() => {
        fetchIndustries();
    }, []);

    const fetchIndustries = async () => {
        try {
            const url = getApiUrl(NODE_API_URL, '/api/suppliers');
            const response = await fetch(url);
            const data = await response.json();
            if (data.success) {
                setIndustries(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar indústrias:', error);
            toast.error('Erro ao carregar indústrias');
        }
    };

    // Carregar tabelas quando indústria for selecionada
    useEffect(() => {
        if (selectedIndustry) {
            fetchTables(selectedIndustry);
        } else {
            setTables([]);
            setSelectedTable('');
            setProducts([]);
            setFilteredProducts([]);
        }
    }, [selectedIndustry]);

    const fetchTables = async (industria) => {
        try {
            console.log(`📋 [FETCH_TABLES] Buscando tabelas para indústria ${industria}`);
            const url = getApiUrl(NODE_API_URL, `/api/products/tables/${industria}`);
            const response = await fetch(url);
            const data = await response.json();
            console.log(`📋 [FETCH_TABLES] Resposta:`, data);

            if (data.success) {
                setTables(data.data);
                console.log(`📋 [FETCH_TABLES] ${data.data.length} tabela(s) encontrada(s)`);

                // Se houver apenas 1 tabela, seleciona automaticamente
                if (data.data.length === 1) {
                    const tabelaNome = data.data[0].itab_tabela;
                    console.log(`📋 [FETCH_TABLES] Auto-selecionando tabela: "${tabelaNome}"`);
                    setSelectedTable(tabelaNome);
                    toast.success(`Tabela "${tabelaNome}" selecionada automaticamente`);
                } else if (data.data.length === 0) {
                    toast.info('Nenhuma tabela de preço encontrada para esta indústria');
                } else {
                    console.log(`📋 [FETCH_TABLES] Múltiplas tabelas, aguardando seleção manual`);
                    // Limpa seleção se houver múltiplas tabelas
                    setSelectedTable('');
                }
            }
        } catch (error) {
            console.error('❌ [FETCH_TABLES] Erro ao carregar tabelas:', error);
            toast.error('Erro ao carregar tabelas');
        }
    };

    // Carregar produtos quando tabela for selecionada
    useEffect(() => {
        if (selectedIndustry && selectedTable) {
            fetchProducts(selectedIndustry, selectedTable);
        } else {
            setProducts([]);
            setFilteredProducts([]);
        }
    }, [selectedIndustry, selectedTable]);

    const fetchProducts = async (industria, tabela) => {
        setLoading(true);
        try {
            console.log(`📦 [FETCH_PRODUCTS] Buscando produtos: industria=${industria}, tabela="${tabela}"`);
            const url = getApiUrl(NODE_API_URL, `/api/products/${industria}/${encodeURIComponent(tabela)}`);
            console.log(`📦 [FETCH_PRODUCTS] URL: ${url}`);

            const response = await fetch(url);
            const data = await response.json();
            console.log(`📦 [FETCH_PRODUCTS] Resposta:`, data);

            if (data.success) {
                console.log(`📦 [FETCH_PRODUCTS] ${data.data.length} produtos carregados`);
                setProducts(data.data);
                setFilteredProducts(data.data);
            } else {
                console.error(`📦 [FETCH_PRODUCTS] Erro na resposta:`, data.message);
                toast.error(data.message || 'Erro ao carregar produtos');
            }
        } catch (error) {
            console.error('❌ [FETCH_PRODUCTS] Erro ao carregar produtos:', error);
            toast.error('Erro ao carregar produtos');
        } finally {
            setLoading(false);
        }
    };

    // Filtrar produtos por busca
    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredProducts(products);
        } else {
            const filtered = products.filter(product =>
                product.pro_codprod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.pro_nome?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
    }, [searchTerm, products]);

    // Carregar produtos automaticamente quando tabela é selecionada
    useEffect(() => {
        if (selectedIndustry && selectedTable) {
            console.log(`🔄 [USE_EFFECT] Tabela selecionada mudou para: "${selectedTable}"`);
            console.log(`🔄 [USE_EFFECT] Chamando fetchProducts(${selectedIndustry}, "${selectedTable}")`);
            fetchProducts(selectedIndustry, selectedTable);
        } else {
            console.log(`🔄 [USE_EFFECT] Limpando produtos (indústria ou tabela não selecionada)`);
            setProducts([]);
            setFilteredProducts([]);
        }
    }, [selectedIndustry, selectedTable]);

    const handleRefresh = () => {
        if (selectedIndustry && selectedTable) {
            fetchProducts(selectedIndustry, selectedTable);
        }
    };

    // ========== AÇÕES DO PRODUTO (Context Menu) ==========
    const handleNovoProduto = () => {
        setSelectedProduct(null);
        setDialogOpen(true);
    };

    const handleAlterarProduto = (product) => {
        setSelectedProduct(product);
        setDialogOpen(true);
    };

    const handleSaveProduct = async (dadosProduto) => {
        try {
            const url = getApiUrl(NODE_API_URL, '/api/products/save');
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(dadosProduto)
            });

            const result = await response.json();

            if (result.success) {
                toast.success(selectedProduct ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!');
                setDialogOpen(false);
                setSelectedProduct(null);
                // Recarregar produtos
                if (selectedIndustry && selectedTable) {
                    fetchProducts(selectedIndustry, selectedTable);
                }
            } else {
                toast.error(result.message || 'Erro ao salvar produto');
            }
        } catch (error) {
            console.error('Erro ao salvar produto:', error);
            toast.error('Erro ao salvar produto');
        }
    };

    const handleExcluirProduto = async (product) => {
        if (!window.confirm(`Deseja realmente excluir o produto "${product.pro_codprod}" desta tabela?`)) {
            return;
        }
        toast.info(`Excluir produto ${product.pro_codprod} - Em desenvolvimento`);
    };

    const handleZerarDescontoAdd = async (product) => {
        if (!window.confirm(`Zerar desconto ADD do produto "${product.pro_codprod}"?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/products/zero-discount-add/${selectedIndustry}/${encodeURIComponent(selectedTable)}/${product.itab_idprod}`);
            const response = await fetch(url, { method: 'PUT' });

            const result = await response.json();

            if (result.success) {
                toast.success('Desconto ADD zerado com sucesso!');
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao zerar desconto ADD');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao zerar desconto ADD');
        }
    };

    const handleZerarDescontoEspecial = async (product) => {
        if (!window.confirm(`Zerar desconto especial do produto "${product.pro_codprod}"?`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/products/zero-discount-special/${selectedIndustry}/${encodeURIComponent(selectedTable)}/${product.itab_idprod}`);
            const response = await fetch(url, { method: 'PUT' });

            const result = await response.json();

            if (result.success) {
                toast.success('Desconto especial zerado com sucesso!');
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao zerar desconto especial');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao zerar desconto especial');
        }
    };

    const handleZerarPromocao = async (product) => {
        if (!window.confirm(`Zerar preço promocional do produto "${product.pro_codprod}"?`)) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3005/api/products/zero-promo-price/${selectedIndustry}/${encodeURIComponent(selectedTable)}/${product.itab_idprod}`,
                { method: 'PUT' }
            );

            const result = await response.json();

            if (result.success) {
                toast.success('Preço promocional zerado com sucesso!');
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao zerar preço promocional');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao zerar preço promocional');
        }
    };

    const handleZerarPrecoEspecial = async (product) => {
        if (!window.confirm(`Zerar preço especial do produto "${product.pro_codprod}"?`)) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3005/api/products/zero-special-price/${selectedIndustry}/${encodeURIComponent(selectedTable)}/${product.itab_idprod}`,
                { method: 'PUT' }
            );

            const result = await response.json();

            if (result.success) {
                toast.success('Preço especial zerado com sucesso!');
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao zerar preço especial');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao zerar preço especial');
        }
    };

    const handleInserirGrupoDesconto = () => {
        setDiscountGroupDialogOpen(true);
    };

    const handleApplyDiscountGroup = async (groupId) => {
        try {
            const response = await fetch(
                `http://localhost:3005/api/products/set-discount-group/${selectedIndustry}/${encodeURIComponent(selectedTable)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itab_grupodesconto: groupId })
                }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(`Grupo de desconto aplicado a ${result.totalAtualizados} produtos!`);
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao aplicar grupo de desconto');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao aplicar grupo de desconto');
        }
    };

    const handleRetirarGrupoDesconto = async () => {
        if (!window.confirm(`Remover grupo de desconto de TODOS os ${filteredProducts.length} produtos da tabela "${selectedTable}"?`)) {
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:3005/api/products/remove-discount-group/${selectedIndustry}/${encodeURIComponent(selectedTable)}`,
                { method: 'PUT' }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(`Grupo de desconto removido de ${result.totalAtualizados} produtos!`);
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao remover grupo de desconto');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao remover grupo de desconto');
        }
    };

    const handleCalcularPrecos = (product) => {
        toast.info(`Calcular preços do produto ${product.pro_codprod} - Em desenvolvimento`);
    };

    const handleAtualizarIPI = () => {
        setIpiDialogOpen(true);
    };

    const handleApplyIPI = async (percentage) => {
        try {
            const response = await fetch(
                `http://localhost:3005/api/products/update-ipi/${selectedIndustry}/${encodeURIComponent(selectedTable)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ percentage })
                }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(`IPI atualizado para ${percentage}% em ${result.totalAtualizados} produtos!`);
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao atualizar IPI');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao atualizar IPI');
        }
    };

    const handleAtualizarST = () => {
        setStDialogOpen(true);
    };

    const handleApplyST = async (percentage) => {
        try {
            const response = await fetch(
                `http://localhost:3005/api/products/update-st/${selectedIndustry}/${encodeURIComponent(selectedTable)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ percentage })
                }
            );

            const result = await response.json();

            if (result.success) {
                toast.success(`ST atualizado para ${percentage}% em ${result.totalAtualizados} produtos!`);
                fetchProducts(selectedIndustry, selectedTable);
            } else {
                toast.error(result.message || 'Erro ao atualizar ST');
            }
        } catch (error) {
            console.error('Erro:', error);
            toast.error('Erro ao atualizar ST');
        }
    };

    // ========== AÇÕES DA TABELA (Dropdown Menu) ==========
    const handleExcluirTabela = async () => {
        if (!window.confirm(`Deseja realmente excluir TODA a tabela "${selectedTable}"?\n\nEsta ação removerá ${filteredProducts.length} produtos!\n\n⚠️ ESTA AÇÃO É IRREVERSÍVEL!`)) {
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/price-tables/${selectedIndustry}/${encodeURIComponent(selectedTable)}`);
            const response = await fetch(url, { method: 'DELETE' });

            const result = await response.json();

            if (result.success) {
                toast.success(`Tabela "${selectedTable}" excluída com sucesso! ${result.totalExcluidos} produtos removidos.`);
                setSelectedTable('');
                setProducts([]);
                setFilteredProducts([]);
                // Recarregar lista de tabelas
                if (selectedIndustry) {
                    fetchTables(selectedIndustry);
                }
            } else {
                toast.error(result.message || 'Erro ao excluir tabela');
            }
        } catch (error) {
            console.error('Erro ao excluir tabela:', error);
            toast.error('Erro ao excluir tabela de preços');
        }
    };

    const handleExportarExcel = async () => {
        try {
            if (!filteredProducts || filteredProducts.length === 0) {
                toast.error('Nenhum produto para exportar');
                return;
            }

            // Importar biblioteca XLSX dinamicamente
            const XLSX = await import('xlsx');

            // Preparar dados para exportação
            const exportData = filteredProducts.map(product => ({
                'Código': product.pro_codprod || '',
                'Produto': product.pro_nome || '',
                'Grupo Desc.': product.itab_grupodesconto || '',
                'Desc. ADD': product.itab_descontoadd || 0,
                'IPI %': product.itab_ipi || 0,
                'ST %': product.itab_st || 0,
                'Preço Peso': product.itab_prepeso || 0,
                'Preço Bruto': product.itab_precobruto || 0,
                'Preço Promo': product.itab_precopromo || 0,
                'Preço Especial': product.itab_precoespecial || 0,
                'Preço Líquido': product.preco_liquido || '',
                'Data Tabela': product.itab_datatabela ? new Date(product.itab_datatabela).toLocaleDateString('pt-BR') : '',
                'Data Vencimento': product.itab_datavencimento ? new Date(product.itab_datavencimento).toLocaleDateString('pt-BR') : '',
                'Status': product.itab_status ? 'Ativo' : 'Inativo'
            }));

            // Criar workbook e worksheet
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Ajustar largura das colunas
            const colWidths = [
                { wch: 15 }, // Código
                { wch: 40 }, // Produto
                { wch: 12 }, // Grupo Desc
                { wch: 10 }, // Desc ADD
                { wch: 8 },  // IPI
                { wch: 8 },  // ST
                { wch: 12 }, // Preço Peso
                { wch: 12 }, // Preço Bruto
                { wch: 12 }, // Preço Promo
                { wch: 14 }, // Preço Especial
                { wch: 14 }, // Preço Líquido
                { wch: 14 }, // Data Tabela
                { wch: 16 }, // Data Vencimento
                { wch: 10 }  // Status
            ];
            ws['!cols'] = colWidths;

            // Adicionar worksheet ao workbook
            XLSX.utils.book_append_sheet(wb, ws, 'Tabela de Preços');

            // Gerar nome do arquivo
            const industryName = industries.find(i => i.for_id === parseInt(selectedIndustry))?.for_nomered || 'Industria';
            const fileName = `Tabela_${industryName}_${selectedTable}_${new Date().toISOString().split('T')[0]}.xlsx`;

            // Salvar arquivo
            XLSX.writeFile(wb, fileName);

            toast.success(`Tabela exportada com sucesso! ${filteredProducts.length} produtos.`);
        } catch (error) {
            console.error('Erro ao exportar para Excel:', error);
            toast.error('Erro ao exportar tabela para Excel');
        }
    };

    const handleAtualizarTabelaPercentual = () => {
        toast.info('Atualizar tabela em % - Em desenvolvimento');
    };

    const handleAtualizarCodigos = () => {
        toast.info('Atualizar códigos - Em desenvolvimento');
    };

    const handleExcluirCodigosDuplicados = () => {
        toast.info('Excluir códigos duplicados da tabela - Em desenvolvimento');
    };


    const formatCurrency = (value) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatPercent = (value) => {
        if (!value) return '0,00%';
        return `${parseFloat(value).toFixed(2).replace('.', ',')}%`;
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <h1 className="text-2xl font-bold text-gray-800">Produtos e Tabelas de Preço</h1>
            </div>

            {/* Filtros */}
            <div className="bg-white border-b px-6 py-4">
                <div className="grid grid-cols-4 gap-4">
                    <div>
                        <Label className="text-sm font-medium mb-2 block">Indústria</Label>
                        <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione a indústria..." />
                            </SelectTrigger>
                            <SelectContent>
                                {industries.map(ind => (
                                    <SelectItem key={ind.for_codigo} value={ind.for_codigo.toString()}>
                                        {ind.for_nomered}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-sm font-medium mb-2 block">Tabela de Preço</Label>
                        <Select
                            value={selectedTable}
                            onValueChange={setSelectedTable}
                            disabled={!selectedIndustry}
                        >
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione a tabela..." />
                            </SelectTrigger>
                            <SelectContent>
                                {tables.map((table, idx) => (
                                    <SelectItem key={idx} value={table.itab_tabela}>
                                        {table.itab_tabela}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2">
                        <Label className="text-sm font-medium mb-2 block">Pesquisar</Label>
                        <Input
                            placeholder="Código ou nome do produto..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="h-9 text-sm"
                            disabled={!selectedTable}
                        />
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white border-b px-6 py-3 flex items-center gap-3">
                <Button
                    onClick={handleRefresh}
                    size="sm"
                    variant="outline"
                    className="h-9 text-sm"
                    disabled={!selectedTable}
                >
                    <RefreshCw size={16} className="mr-2" />
                    Atualizar
                </Button>

                {/* Ações da Tabela */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-sm"
                            disabled={!selectedTable}
                        >
                            <MoreVertical size={16} className="mr-2" />
                            Ações da Tabela
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={handleExcluirTabela} className="text-red-600">
                            Excluir tabela de preço
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleCalcularPrecos}>
                            Calcular preços
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAtualizarIPI}>
                            Atualizar percentual de IPI
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportarExcel}>
                            Exportar tabela para excel
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAtualizarTabelaPercentual}>
                            Atualizar tabela em %
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAtualizarCodigos}>
                            Atualizar código²
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExcluirCodigosDuplicados}>
                            Excluir códigos duplicados da tabela
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="text-sm text-gray-600">
                    {filteredProducts.length} produto(s)
                </div>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Botão AI Import (Premium) */}
                <AIImportButton
                    onClick={() => setAiImportDialogOpen(true)}
                />

                {/* Botão Importar Tabela (Clássico) */}
                <Button
                    onClick={() => selectTab('/utilitarios/importacao-precos')}
                    size="sm"
                    variant="default"
                    className="h-9 text-sm bg-blue-600 hover:bg-blue-700"
                >
                    <Upload size={16} className="mr-2" />
                    Importar Tabela
                </Button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {!selectedIndustry || !selectedTable ? (
                    <div className="text-center py-12 text-gray-500">
                        <p className="text-lg">Selecione uma indústria e uma tabela de preço</p>
                    </div>
                ) : loading ? (
                    <div className="text-center py-8 text-gray-500">Carregando...</div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        {searchTerm ? 'Nenhum produto encontrado' : 'Nenhum produto nesta tabela'}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-100 border-b">
                                    <tr>
                                        <th className="text-left p-3 text-xs font-semibold text-gray-700 w-32">
                                            ID
                                        </th>
                                        <th className="text-left p-3 text-xs font-semibold text-gray-700">
                                            Produto
                                        </th>
                                        <th className="text-right p-3 text-xs font-semibold text-gray-700 w-28">
                                            Preço Bruto
                                        </th>
                                        <th className="text-right p-3 text-xs font-semibold text-gray-700 w-28">
                                            Preço Promo
                                        </th>
                                        <th className="text-right p-3 text-xs font-semibold text-gray-700 w-28">
                                            Preço Especial
                                        </th>
                                        <th className="text-right p-3 text-xs font-semibold text-gray-700 w-28 bg-purple-50">
                                            Preço Líquido
                                        </th>
                                        <th className="text-center p-3 text-xs font-semibold text-gray-700 w-20">
                                            IPI %
                                        </th>
                                        <th className="text-center p-3 text-xs font-semibold text-gray-700 w-20">
                                            ST %
                                        </th>
                                        <th className="text-left p-3 text-xs font-semibold text-gray-700 w-32">
                                            Cód. Normaliz.
                                        </th>
                                        <th className="text-center p-3 text-xs font-semibold text-gray-700 w-24">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => (
                                        <ContextMenu key={product.itab_idprod}>
                                            <ContextMenuTrigger asChild>
                                                <tr className="border-b hover:bg-gray-50 cursor-pointer">
                                                    <td className="p-3 text-xs text-gray-900 font-mono">
                                                        {product.itab_idprod}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-900">
                                                        {product.pro_nome}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-900 text-right font-semibold">
                                                        {formatCurrency(product.itab_precobruto)}
                                                    </td>
                                                    <td className="p-3 text-xs text-blue-600 text-right font-semibold">
                                                        {formatCurrency(product.itab_precopromo)}
                                                    </td>
                                                    <td className="p-3 text-xs text-green-600 text-right font-semibold">
                                                        {formatCurrency(product.itab_precoespecial)}
                                                    </td>
                                                    <td className="p-3 text-xs text-purple-700 text-right font-bold bg-purple-50">
                                                        {product.preco_liquido ? formatCurrency(product.preco_liquido) : '-'}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-600 text-center">
                                                        {formatPercent(product.itab_ipi)}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-600 text-center">
                                                        {formatPercent(product.itab_st)}
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-500 font-mono">
                                                        {product.pro_codigonormalizado || '-'}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${product.itab_status
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {product.itab_status ? 'Ativo' : 'Inativo'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </ContextMenuTrigger>
                                            <ContextMenuContent className="w-72">
                                                <ContextMenuItem onClick={handleNovoProduto}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Novo produto
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleAlterarProduto(product)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Alterar produto
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => {
                                                    setSalesProduct(product);
                                                    setSalesDialogOpen(true);
                                                }}>
                                                    <BarChart3 className="mr-2 h-4 w-4" />
                                                    Análise de Vendas
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleExcluirProduto(product)} className="text-red-600">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Excluir produto
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem onClick={() => handleZerarDescontoAdd(product)}>
                                                    <Percent className="mr-2 h-4 w-4" />
                                                    Zerar desconto ADD
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleZerarDescontoEspecial(product)}>
                                                    <Percent className="mr-2 h-4 w-4" />
                                                    Zerar desconto especial
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleZerarPromocao(product)}>
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    Zerar o campo de promoção (preço 2)
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleZerarPrecoEspecial(product)}>
                                                    <DollarSign className="mr-2 h-4 w-4" />
                                                    Zerar campo de preço especial (preço 3)
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem onClick={() => handleInserirGrupoDesconto()}>
                                                    <Package className="mr-2 h-4 w-4" />
                                                    Inserir grupo de desconto
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleRetirarGrupoDesconto()}>
                                                    <X className="mr-2 h-4 w-4" />
                                                    Retirar o grupo de desconto da tabela
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem onClick={() => handleExcluirTabela()}>
                                                    <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                                    Excluir a tabela de preço
                                                </ContextMenuItem>
                                                <ContextMenuSeparator />
                                                <ContextMenuItem onClick={() => handleAtualizarIPI()}>
                                                    <TrendingUp className="mr-2 h-4 w-4" />
                                                    Atualizar percentual de IPI
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={() => handleAtualizarST()}>
                                                    <Percent className="mr-2 h-4 w-4" />
                                                    Atualizar % ST
                                                </ContextMenuItem>
                                                <ContextMenuItem onClick={handleExportarExcel}>
                                                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                                                    Exportar tabela para excel
                                                </ContextMenuItem>
                                            </ContextMenuContent>
                                        </ContextMenu>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Dialog */}
            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                product={selectedProduct}
                industria={selectedIndustry}
                tabela={selectedTable}
                onSave={handleSaveProduct}
            />

            {/* Sales Analysis Dialog */}
            <ProductSalesDialog
                open={salesDialogOpen}
                onClose={() => {
                    setSalesDialogOpen(false);
                    setSalesProduct(null);
                }}
                product={salesProduct}
                industria={selectedIndustry}
            />

            {/* Discount Group Dialog */}
            <DiscountGroupDialog
                open={discountGroupDialogOpen}
                onClose={() => setDiscountGroupDialogOpen(false)}
                onApply={handleApplyDiscountGroup}
                product={{
                    selectedTable: selectedTable,
                    totalProducts: filteredProducts.length
                }}
            />

            {/* IPI Percentage Dialog */}
            <PercentageInputDialog
                open={ipiDialogOpen}
                onClose={() => setIpiDialogOpen(false)}
                onApply={handleApplyIPI}
                title="Atualizar Percentual de IPI"
                description="Informe o percentual de IPI que será aplicado a todos os produtos da tabela."
                currentTable={selectedTable}
                totalProducts={filteredProducts.length}
            />

            {/* ST Percentage Dialog */}
            <PercentageInputDialog
                open={stDialogOpen}
                onClose={() => setStDialogOpen(false)}
                onApply={handleApplyST}
                title="Atualizar Percentual de ST"
                description="Informe o percentual de ST (Substituição Tributária) que será aplicado a todos os produtos da tabela."
                currentTable={selectedTable}
                totalProducts={filteredProducts.length}
            />

            {/* AI Import Dialog */}
            <AIImportDialog
                open={aiImportDialogOpen}
                onOpenChange={setAiImportDialogOpen}
                onImportComplete={() => {
                    // Recarregar produtos após importação
                    if (selectedIndustry && selectedTable) {
                        fetchProducts(selectedIndustry, selectedTable);
                    }
                }}
            />
        </div >
    );
};

export default FrmProdutos;
