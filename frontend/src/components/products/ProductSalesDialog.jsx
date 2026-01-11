import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart3, Users, UserX, Tag, Loader2 } from 'lucide-react';
import { toast } from "sonner";

const ProductSalesDialog = ({ open, onClose, product, industria }) => {
    const [dataInicio, setDataInicio] = useState('2024-01-01');
    const [dataFim, setDataFim] = useState('2024-12-31');
    const [loading, setLoading] = useState(false);
    const [salesData, setSalesData] = useState(null);
    const [customersBought, setCustomersBought] = useState([]);
    const [customersNever, setCustomersNever] = useState([]);

    const handleProcess = async () => {
        if (!dataInicio || !dataFim) {
            toast.error('Selecione o período de datas');
            return;
        }

        if (new Date(dataInicio) > new Date(dataFim)) {
            toast.error('Data inicial deve ser menor que data final');
            return;
        }

        setLoading(true);
        try {
            // Buscar análise de vendas
            const salesResponse = await fetch(
                `https://salesmasters.softham.com.br/api/products/sales-analysis/${industria}/${encodeURIComponent(product.pro_codprod)}?dataInicio=${dataInicio}&dataFim=${dataFim}`
            );
            const salesResult = await salesResponse.json();

            if (salesResult.success) {
                setSalesData(salesResult.data);
                toast.success(`Análise processada: ${salesResult.data.totalVendido.toFixed(2)} unidades vendidas`);
            } else {
                toast.error(salesResult.message);
            }

            // Buscar clientes que compraram
            const boughtResponse = await fetch(
                `https://salesmasters.softham.com.br/api/products/customers-bought/${industria}/${encodeURIComponent(product.pro_codprod)}?dataInicio=${dataInicio}&dataFim=${dataFim}`
            );
            const boughtResult = await boughtResponse.json();
            if (boughtResult.success) {
                // Ordenar por número de pedidos (do maior para o menor)
                const sortedData = [...boughtResult.data].sort((a, b) => {
                    return (b.qtd_pedidos || 0) - (a.qtd_pedidos || 0);
                });
                setCustomersBought(sortedData);
            }

            // Buscar clientes que nunca compraram
            const neverResponse = await fetch(
                `https://salesmasters.softham.com.br/api/products/customers-never-bought/${industria}/${encodeURIComponent(product.pro_codprod)}`
            );
            const neverResult = await neverResponse.json();
            if (neverResult.success) {
                setCustomersNever(neverResult.data);
            }

        } catch (error) {
            console.error('Erro ao processar análise:', error);
            toast.error('Erro ao processar análise de vendas');
        } finally {
            setLoading(false);
        }
    };

    const renderSalesGrid = () => {
        if (!salesData || !salesData.vendasPorMes || salesData.vendasPorMes.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhuma venda encontrada no período selecionado</p>
                </div>
            );
        }

        // Agrupar por ano
        const vendas = salesData.vendasPorMes;
        const anos = [...new Set(vendas.map(v => v.ano))].sort();
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

        return (
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                            <th className="px-3 py-2 text-left font-semibold">Ano</th>
                            {meses.map((mes, idx) => (
                                <th key={idx} className="px-3 py-2 text-right font-semibold">{mes}</th>
                            ))}
                            <th className="px-3 py-2 text-right font-semibold bg-blue-50">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {anos.map(ano => {
                            const vendasAno = vendas.filter(v => v.ano === ano);
                            const totalAno = vendasAno.reduce((sum, v) => sum + parseFloat(v.quantidade || 0), 0);

                            return (
                                <tr key={ano} className="border-b hover:bg-gray-50">
                                    <td className="px-3 py-2 font-medium">{ano}</td>
                                    {meses.map((_, mesIdx) => {
                                        const venda = vendasAno.find(v => v.mes === mesIdx + 1);
                                        const qtd = venda ? parseFloat(venda.quantidade) : 0;
                                        return (
                                            <td key={mesIdx} className={`px-3 py-2 text-right ${qtd > 0 ? 'font-medium' : 'text-gray-400'}`}>
                                                {qtd > 0 ? qtd.toFixed(2) : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="px-3 py-2 text-right font-bold bg-blue-50">
                                        {totalAno.toFixed(2)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                            <td className="px-3 py-2">Total Geral</td>
                            {meses.map((_, mesIdx) => {
                                const totalMes = vendas
                                    .filter(v => v.mes === mesIdx + 1)
                                    .reduce((sum, v) => sum + parseFloat(v.quantidade || 0), 0);
                                return (
                                    <td key={mesIdx} className="px-3 py-2 text-right">
                                        {totalMes > 0 ? totalMes.toFixed(2) : '-'}
                                    </td>
                                );
                            })}
                            <td className="px-3 py-2 text-right bg-blue-100">
                                {salesData.totalVendido.toFixed(2)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        );
    };

    const renderCustomersTable = (customers, title) => {
        if (customers.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum cliente encontrado</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 border-b">
                        <tr>
                            <th className="px-4 py-2 text-left">Código</th>
                            <th className="px-4 py-2 text-left">Nome</th>
                            {customers[0].quantidade_total !== undefined && (
                                <>
                                    <th className="px-4 py-2 text-right">Quantidade</th>
                                    <th className="px-4 py-2 text-right">Valor Total</th>
                                    <th className="px-4 py-2 text-center">Última Compra</th>
                                    <th className="px-4 py-2 text-center">Pedidos</th>
                                </>
                            )}
                            {customers[0].cli_cidade !== undefined && (
                                <>
                                    <th className="px-4 py-2 text-left">Cidade</th>
                                    <th className="px-4 py-2 text-center">UF</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {customers.map((customer, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-4 py-2">{customer.cli_codigo}</td>
                                <td className="px-4 py-2">{customer.cli_nome}</td>
                                {customer.quantidade_total !== undefined && (
                                    <>
                                        <td className="px-4 py-2 text-right font-medium">
                                            {parseFloat(customer.quantidade_total).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            R$ {parseFloat(customer.valor_total).toFixed(2)}
                                        </td>
                                        <td className="px-4 py-2 text-center">
                                            {new Date(customer.ultima_compra).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-4 py-2 text-center">{customer.qtd_pedidos}</td>
                                    </>
                                )}
                                {customer.cli_cidade !== undefined && (
                                    <>
                                        <td className="px-4 py-2">{customer.cli_cidade}</td>
                                        <td className="px-4 py-2 text-center">{customer.cli_uf}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Análise de Vendas - {product?.pro_codprod}
                    </DialogTitle>
                    <p className="text-sm text-gray-600">{product?.pro_nome}</p>
                </DialogHeader>

                {/* Filtros */}
                <div className="border-b pb-4">
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div>
                            <Label>Data Início</Label>
                            <Input
                                type="date"
                                value={dataInicio}
                                onChange={(e) => setDataInicio(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>Data Fim</Label>
                            <Input
                                type="date"
                                value={dataFim}
                                onChange={(e) => setDataFim(e.target.value)}
                            />
                        </div>
                        <div>
                            <Button onClick={handleProcess} disabled={loading} className="w-full">
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Processando...
                                    </>
                                ) : (
                                    'Processar'
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="vendas" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="vendas">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Quantidades Vendidas
                        </TabsTrigger>
                        <TabsTrigger value="compraram">
                            <Users className="h-4 w-4 mr-2" />
                            Clientes Compraram ({customersBought.length})
                        </TabsTrigger>
                        <TabsTrigger value="nunca">
                            <UserX className="h-4 w-4 mr-2" />
                            Nunca Compraram ({customersNever.length})
                        </TabsTrigger>
                        <TabsTrigger value="promocao">
                            <Tag className="h-4 w-4 mr-2" />
                            Promoção
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="vendas" className="flex-1 overflow-auto mt-4">
                        {renderSalesGrid()}
                    </TabsContent>

                    <TabsContent value="compraram" className="flex-1 overflow-auto mt-4">
                        {renderCustomersTable(customersBought, 'Clientes que Compraram')}
                    </TabsContent>

                    <TabsContent value="nunca" className="flex-1 overflow-auto mt-4">
                        {renderCustomersTable(customersNever, 'Clientes que Nunca Compraram')}
                    </TabsContent>

                    <TabsContent value="promocao" className="flex-1 overflow-auto mt-4">
                        <div className="text-center py-12 text-gray-500">
                            <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                            <p>Funcionalidade de promoção em desenvolvimento</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default ProductSalesDialog;
