import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, DollarSign, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function ContasReceberPage() {
    const [contas, setContas] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filtros
    const [filtros, setFiltros] = useState({
        dataInicio: '',
        dataFim: '',
        status: 'ABERTO',
        idCliente: '',
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

            const response = await fetch(`http://localhost:3005/api/financeiro/contas-receber?${params}`);
            const data = await response.json();

            if (data.success) {
                setContas(data.data);
            } else {
                toast.error('Erro ao carregar contas');
            }
        } catch (error) {
            console.error('Error fetching contas:', error);
            toast.error('Erro ao buscar contas a receber');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const variants = {
            'ABERTO': 'default',
            'RECEBIDO': 'success',
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

    const totalAReceber = contas.reduce((sum, c) => sum + parseFloat(c.saldo || 0), 0);
    const totalRecebido = contas.reduce((sum, c) => sum + parseFloat(c.valor_recebido || 0), 0);
    const totalGeral = contas.reduce((sum, c) => sum + parseFloat(c.valor_total || 0), 0);

    return (
        <div className="p-6 bg-gradient-to-br from-slate-50 via-gray-50 to-emerald-50 min-h-screen">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Contas a Receber
                        </h1>
                        <p className="text-slate-500 text-sm">Gestão de Direitos e Recebimentos</p>
                    </div>
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Conta
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total a Receber</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalAReceber)}</div>
                        <p className="text-xs text-slate-500 mt-1">{contas.filter(c => c.status === 'ABERTO').length} contas</p>
                    </CardContent>
                </Card>

                <Card className="border-slate-200">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">Total Recebido</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalRecebido)}</div>
                        <p className="text-xs text-slate-500 mt-1">{contas.filter(c => c.status === 'RECEBIDO').length} contas</p>
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
                                    <SelectItem value="RECEBIDO">Recebido</SelectItem>
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
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cliente</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Descrição</th>
                                        <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Documento</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Valor</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Recebido</th>
                                        <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Saldo</th>
                                        <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {contas.map((conta) => (
                                        <tr
                                            key={conta.id}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                        >
                                            <td className="px-4 py-3 text-sm">
                                                {formatDate(conta.data_vencimento)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">
                                                {conta.cliente_nome || '-'}
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
                                            <td className="px-4 py-3 text-sm text-right text-blue-600">
                                                {formatCurrency(conta.valor_recebido)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold text-emerald-600">
                                                {formatCurrency(conta.saldo)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {getStatusBadge(conta.status)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
