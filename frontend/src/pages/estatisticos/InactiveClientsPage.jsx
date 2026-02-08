
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Search, UserX, Calendar, RefreshCcw } from 'lucide-react';
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
            'Última Compra': item.ultima_compra ? new Date(item.ultima_compra).toLocaleDateString() : '-'
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes Inativos");
        XLSX.writeFile(wb, `Clientes_Inativos_${new Date().toISOString().split('T')[0]}.xlsx`);
        toast.success('Excel exportado com sucesso!');
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen">
            <div className="flex flex-col gap-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            {periodo === -1 ? (
                                <Search className="w-8 h-8 text-emerald-500" />
                            ) : (
                                <UserX className="w-8 h-8 text-rose-500" />
                            )}
                            {periodo === -1 ? 'Clientes Ativos' : 'Clientes Inativos'}
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            {periodo === -1
                                ? 'Listagem de todos os clientes com cadastro ativo no sistema.'
                                : 'Listagem de clientes sem compras no período selecionado.'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={loadData} disabled={loading} className="gap-2">
                            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Atualizar
                        </Button>
                        <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700 gap-2">
                            <Download className="w-4 h-4" /> Exportar Excel
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide mr-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Período de Inatividade:
                        </span>
                        {periodOptions.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriodo(opt.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${periodo === opt.value
                                    ? opt.active
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </CardContent>
                </Card>

                {/* Data Table */}
                <Card className="border-slate-200 shadow-lg">
                    <CardContent className="p-0">
                        <div className="relative overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-slate-100">
                                    <TableRow>
                                        <TableHead className="w-[80px]">Cód.</TableHead>
                                        <TableHead>CNPJ/CPF</TableHead>
                                        <TableHead>Nome Cliente</TableHead>
                                        <TableHead>Cidade</TableHead>
                                        <TableHead>Vendedor</TableHead>
                                        <TableHead>Telefone</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead className="text-right">Última Compra</TableHead>
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
                                            <TableRow key={idx} className="hover:bg-slate-50 group transition-colors">
                                                <TableCell className="font-mono text-xs font-bold text-slate-500">
                                                    {item.codigo}
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600 font-mono">
                                                    {formatCNPJ(item.cnpj) || '-'}
                                                </TableCell>
                                                <TableCell className="font-medium text-slate-800">
                                                    {item.nome}
                                                    <span className="block text-xs text-slate-400 font-normal">{item.nome_reduzido}</span>
                                                </TableCell>
                                                <TableCell className="text-xs text-slate-600">
                                                    {item.cidade ? `${item.cidade} - ${item.uf}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-xs font-semibold text-slate-700">
                                                    {item.vendedor || '-'}
                                                </TableCell>
                                                <TableCell className="text-slate-600 font-numeric">{item.telefone || '-'}</TableCell>
                                                <TableCell className="text-slate-600 text-xs">{item.email || '-'}</TableCell>
                                                <TableCell className="text-right font-medium">
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
