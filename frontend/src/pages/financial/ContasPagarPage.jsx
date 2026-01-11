import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, DollarSign, Calendar, AlertCircle, HelpCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import FinancialHelpModal from '@/components/financial/FinancialHelpModal';
import NovaContaModal from '@/components/financial/NovaContaModal';
import DetalhesContaModal from '@/components/financial/DetalhesContaModal';

export default function ContasPagarPage() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [helpOpen, setHelpOpen] = useState(false);
    const [novaContaOpen, setNovaContaOpen] = useState(false);
    const [detalhesContaId, setDetalhesContaId] = useState(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        status: 'ABERTO',
        idFornecedor: '',
        idPlanoContas: '',
        idCentroCusto: ''
    });

    useEffect(() => {
        fetchContas();
    }, []);

    const fetchContas = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            Object.entries(filtros).forEach(([key, value]) => {
                if (value && value !== 'TODOS') params.append(key, value);
            });

            const url = getApiUrl(NODE_API_URL, `/api/financeiro/contas-pagar?${params}`);
            const response = await fetch(url);
            const data = await response.json();

            if (data.success) {
                setContas(data.data);
            } else {
                toast.error('Erro ao carregar contas');
            }
        } catch (error) {
            console.error('Error fetching contas:', error);
            toast.error('Erro ao buscar contas a pagar');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'ABERTO': 'default',
            'PAGO': 'success',
            'VENCIDO': 'destructive',
            'CANCELADO': 'secondary'
        };

        return (
            <Badge variant={variants[status] || 'default'}>
                {status}
            </Badge>
        );
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const totalAPagar = contas.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0);
    const totalPago = contas.reduce((sum, c) => sum + parseFloat(c.valor_pago || 0), 0);
    const totalGeral = contas.reduce((sum, c) => sum + parseFloat(c.valor_total || 0), 0);

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">
                            Contas a Pagar
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de Obrigações e Pagamentos</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setHelpOpen(true)}
                            className="relative bg-gradient-to-r from-amber-400 via-orange-500 to-amber-500 hover:from-amber-500 hover:via-orange-600 hover:to-amber-600 text-white font-bold px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-pulse hover:animate-none group"
                            title="Como usar o Financeiro?"
                        >
                            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                            <span className="relative flex items-center gap-2">
                                <HelpCircle className="w-5 h-5" />
                                <span className="text-sm">Como usar...</span>
                                <Sparkles className="w-4 h-4 text-yellow-200" />
                            </span>
                        </Button>
                        <Button
                            onClick={() => setNovaContaOpen(true)}
                            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Nova Conta
                        </Button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total em Aberto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(totalAPagar)}</div>
                        <p className="text-xs text-slate-500 mt-1">{contas.filter(c => c.status === 'ABERTO').length} contas</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPago)}</div>
                        <p className="text-xs text-slate-500 mt-1">{contas.filter(c => c.status === 'PAGO').length} contas</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Geral</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-slate-700">{formatCurrency(totalGeral)}</div>
                        <p className="text-xs text-slate-500 mt-1">{contas.length} contas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Filtros
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label>Data Início</Label>
                            <Input
                                type="date"
                                value={filtros.dataInicio}
                                onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Data Fim</Label>
                            <Input
                                type="date"
                                value={filtros.dataFim}
                                onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select value={filtros.status} onValueChange={(value) => setFiltros({ ...filtros, status: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TODOS">Todos</SelectItem>
                                    <SelectItem value="ABERTO">Aberto</SelectItem>
                                    <SelectItem value="PAGO">Pago</SelectItem>
                                    <SelectItem value="VENCIDO">Vencido</SelectItem>
                                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={fetchContas} className="w-full">
                                <Search className="w-4 h-4 mr-2" />
                                Filtrar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 text-center text-slate-500">
                            Carregando...
                        </div>
                    ) : contas.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                            <p>Nenhuma conta encontrada</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vencimento</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Fornecedor</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Descrição</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Documento</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Valor</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Pago</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Saldo</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {contas.map((conta) => (
                                        <tr
                                            key={conta.id}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors group"
                                            onClick={() => setDetalhesContaId(conta.id)}
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(conta.data_vencimento)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {conta.fornecedor_nome || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                {conta.descricao}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-500">
                                                {conta.numero_documento || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">
                                                {formatCurrency(conta.valor_total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-emerald-600">
                                                {formatCurrency(conta.valor_pago)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-red-600">
                                                {formatCurrency(conta.saldo)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(conta.status)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDetalhesContaId(conta.id);
                                                    }}
                                                    className="h-8 group-hover:bg-red-600 group-hover:text-white transition-all"
                                                >
                                                    {conta.status === 'PAGO' ? 'Ver' : 'Baixar'}
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
            <FinancialHelpModal
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
            />
            <NovaContaModal
                open={novaContaOpen}
                onOpenChange={setNovaContaOpen}
                type="PAGAR"
                onSuccess={fetchContas}
            />
            {detalhesContaId && (
                <DetalhesContaModal
                    open={!!detalhesContaId}
                    onOpenChange={(open) => !open && setDetalhesContaId(null)}
                    contaId={detalhesContaId}
                    type="PAGAR"
                    onRefresh={fetchContas}
                />
            )}
        </div>
    );
}
