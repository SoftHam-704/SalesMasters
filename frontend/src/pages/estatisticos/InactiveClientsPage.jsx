
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, UserX, Calendar, RefreshCcw, TrendingUp, DollarSign, Users, Award } from 'lucide-react';
import axios from '@/lib/axios';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';

export default function InactiveClientsPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [periodo, setPeriodo] = useState(3); // Default: Trimestre (3 meses)

    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = String(value).replace(/\D/g, '');
        if (raw.length === 14) {
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        } else if (raw.length === 11) {
            return raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        }
        return value;
    };

    const periodOptions = [
        { label: 'Todos Ativos', value: -1, color: 'bg-emerald-500', active: 'bg-emerald-500 text-white shadow-emerald-200' },
        { label: 'Último Trimestre', value: 3, color: 'bg-rose-500', active: 'bg-rose-500 text-white shadow-rose-200' },
        { label: 'Último Semestre', value: 6, color: 'bg-rose-500', active: 'bg-rose-500 text-white shadow-rose-200' },
        { label: 'Último Ano', value: 12, color: 'bg-rose-500', active: 'bg-rose-500 text-white shadow-rose-200' },
        { label: 'Nunca Compraram', value: 0, color: 'bg-slate-500', active: 'bg-slate-500 text-white shadow-slate-200' },
    ];

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/reports/clientes-inativos', {
                params: { periodo }
            });
            if (res.data.success) {
                setData(res.data.data);
                toast.success(`${res.data.data.length} clientes encontrados.`);
            }
        } catch (error) {
            console.error('Erro ao buscar inativos:', error);
            toast.error('Erro ao carregar relatório');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [periodo]);

    const handleExport = () => {
        if (!data.length) return toast.warning('Sem dados para exportar');

        const exportData = data.map(item => ({
            'Código': item.codigo,
            'CNPJ/CPF': formatCNPJ(item.cnpj),
            'Nome': item.nome,
            'Nome Reduzido': item.nome_reduzido,
            'Cidade': item.cidade ? `${item.cidade} - ${item.uf}` : '-',
            'Vendedor': item.vendedor || '-',
            'Telefone': item.telefone,
            'Email': item.email,
            'Status': periodo === -1 ? 'Ativo' : (periodo === 0 ? 'Nunca Comprou' : `Inativo há +${periodo} meses`),
            'Frequência (Dias)': Math.round(item.frequencia_dias || 0),
            'Dias Inativo': item.dias_inativo || 0,
            'Pedidos Perdidos': item.pedidos_perdidos || 0,
            'Ticket Médio': item.potential_ticket || 0,
            'Receita Potencial': item.receita_potencial || 0,
            'Última Compra': item.ultima_compra ? new Date(item.ultima_compra).toLocaleDateString() : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes Inativos");
        XLSX.writeFile(wb, `Clientes_Inativos_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel exportado com sucesso!');
    };

    return (
        <div className="p-6 bg-stone-50 min-h-screen font-sans">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
                            {periodo === -1 ? (
                                <Search className="w-8 h-8 text-emerald-500" />
                            ) : (
                                <UserX className="w-8 h-8 text-rose-500" />
                            )}
                            {periodo === -1 ? 'Clientes Ativos' : 'Clientes Inativos'}
                        </h1>
                        <p className="text-stone-500 text-sm mt-1">
                            {periodo === -1
                                ? 'Listagem de todos os clientes com cadastro ativo no sistema.'
                                : 'Listagem de clientes sem compras no período selecionado.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={loadData} disabled={loading} className="h-[38px] px-4 border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </button>
                        <button onClick={handleExport} className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                            <Download className="w-4 h-4 !text-white" /> <span className="!text-white">Exportar Excel</span>
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="border-l-4 border-l-rose-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-rose-50 rounded-lg text-rose-600">
                                <TrendingUp className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Receita a Recuperar</p>
                                <h3 className="text-xl font-black text-slate-800">
                                    R$ {data.reduce((acc, curr) => acc + (parseFloat(curr.receita_potencial) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </h3>
                                <p className="text-[10px] text-rose-600 font-bold italic">Baseado em pedidos perdidos</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clientes no Limbo</p>
                                <h3 className="text-xl font-black text-slate-800">{data.length}</h3>
                                <p className="text-[10px] text-slate-400 font-medium">Inativos no período</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ticket Média Recup.</p>
                                <h3 className="text-xl font-black text-slate-800">
                                    R$ {data.length > 0
                                        ? (data.reduce((acc, curr) => acc + (parseFloat(curr.potential_ticket) || 0), 0) / data.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                                        : '0,00'}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-amber-500 shadow-sm">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-3 bg-amber-50 rounded-lg text-amber-600">
                                <Award className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maior Potencial</p>
                                <h3 className="text-xl font-black text-slate-800">
                                    R$ {Math.max(...data.map(d => parseFloat(d.receita_potencial) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </h3>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card className="border-stone-200 shadow-sm">
                    <CardContent className="p-4 flex flex-wrap gap-2 items-center">
                        <span className="text-xs font-bold text-stone-600 uppercase tracking-wider mr-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Período de Inatividade:
                        </span>
                        {periodOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriodo(opt.value)}
                                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-all ${periodo === opt.value
                                    ? opt.active
                                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="border-stone-200 shadow-sm">
                    <CardContent className="p-0">
                        <div className="relative overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-stone-100">
                                    <TableRow className="border-b border-stone-200">
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider w-[80px]">Cód.</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider">CNPJ/CPF</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider">Nome Cliente</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider">Cidade</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider">Vendedor</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider text-right">Freq. (dias)</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider text-right">Perdidos</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider text-right">Ticket Médio</TableHead>
                                        <TableHead className="text-xs font-bold text-rose-600 uppercase tracking-wider text-right">Receita Potencial</TableHead>
                                        <TableHead className="text-xs font-bold text-stone-600 uppercase tracking-wider text-right">Última Compra</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                                                    Carregando dados...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center text-slate-500">
                                                {periodo === -1
                                                    ? 'Nenhum cliente ativo encontrado no momento.'
                                                    : 'Nenhum cliente inativo encontrado neste período.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        data.map((item, idx) => (
                                            <TableRow key={idx} className="hover:bg-stone-50 group transition-colors border-b border-stone-100">
                                                <TableCell className="font-mono text-xs font-bold text-stone-500">
                                                    {item.codigo}
                                                </TableCell>
                                                <TableCell className="text-xs text-stone-600 font-mono">
                                                    {formatCNPJ(item.cnpj) || '-'}
                                                </TableCell>
                                                <TableCell className="font-medium text-stone-800 text-xs">
                                                    {item.nome}
                                                    <span className="block text-xs text-stone-400 font-normal">{item.nome_reduzido}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-stone-600">
                                                    {item.cidade ? `${item.cidade} - ${item.uf}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-stone-700">
                                                    {item.vendedor || '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-medium text-stone-500">
                                                    {Math.round(item.frequencia_dias) || '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-black text-rose-500">
                                                    {item.pedidos_perdidos || 0}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-medium text-stone-600">
                                                    {item.potential_ticket ? `R$ ${parseFloat(item.potential_ticket).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs font-black text-rose-700 bg-rose-50/50">
                                                    {item.receita_potencial ? `R$ ${parseFloat(item.receita_potencial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-xs">
                                                    <span className={periodo === -1 ? "text-emerald-600" : "text-rose-600"}>
                                                        {item.ultima_compra ? new Date(item.ultima_compra).toLocaleDateString() : 'Nunca'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
