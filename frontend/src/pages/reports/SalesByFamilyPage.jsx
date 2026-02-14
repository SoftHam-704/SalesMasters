
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FileText, Search, Calendar, RefreshCcw, Download, Users } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import { toast } from 'sonner';

export default function SalesByFamilyPage() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [filters, setFilters] = useState({
        startDate: new Date(new Date().setMonth(new Date().getMonth() - 12)).toISOString().split('T')[0], // 1 ano atrás
        endDate: new Date().toISOString().split('T')[0],
        groupId: ''
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await fetch(getApiUrl(NODE_API_URL, '/api/v2/reports/groups'));
            const json = await res.json();
            if (json.success) setGroups(json.data);
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
        }
    };

    const loadData = async () => {
        if (!filters.startDate || !filters.endDate) {
            toast.error('Informe o período');
            return;
        }
        setLoading(true);
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const res = await fetch(getApiUrl(NODE_API_URL, `/api/v2/reports/sales-by-family?${queryParams}`));
            const json = await res.json();
            if (json.success) {
                setData(json.data);
                toast.success(`${json.data.length} clientes encontrados`);
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
                            <Users className="w-8 h-8 text-blue-600" />
                            Venda por Família de Produtos
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Identifique quais clientes compraram produtos de uma determinada família no período selecionado.</p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-sm bg-white">
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Grupo de Produtos</Label>
                                <Select value={filters.groupId} onValueChange={(val) => setFilters(f => ({ ...f, groupId: val }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um grupo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.map(g => (
                                            <SelectItem key={g.id} value={String(g.id)}>{g.nome}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Data Inicial</Label>
                                <Input type="date" value={filters.startDate} onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-xs font-bold uppercase text-slate-500">Data Final</Label>
                                <Input type="date" value={filters.endDate} onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))} />
                            </div>
                            <Button onClick={loadData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 h-10">
                                <Search className="w-4 h-4 mr-2" /> PESQUISAR
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="font-bold">CLIENTE</TableHead>
                                    <TableHead className="text-center font-bold">ÚLTIMA COMPRA (FAMÍLIA)</TableHead>
                                    <TableHead className="text-center font-bold">DIAS SEM COMPRA</TableHead>
                                    <TableHead className="font-bold">TELEFONE</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                                            <RefreshCcw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                            Buscando movimentações...
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-32 text-center text-slate-400">
                                            Nenhum registro encontrado para estes filtros.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors">
                                            <TableCell className="font-medium">{item.cli_nomred}</TableCell>
                                            <TableCell className="text-center">
                                                {item.ultima_compra ? new Date(item.ultima_compra).toLocaleDateString() : '-'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.dias_sem_compra > 90 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                    {item.dias_sem_compra} dias
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-slate-600">{item.cli_fone1 || '-'}</TableCell>
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
