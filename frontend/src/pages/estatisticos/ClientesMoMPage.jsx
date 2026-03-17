import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Factory, BarChart3, Download as DownloadIcon, ChevronUp, ChevronDown, TrendingUp, TrendingDown } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatCurrency, formatNumber } from "@/utils/formatters"

export default function ClientesMoMPage({ isSubComponent = false }) {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'));
    const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()));
    const [selectedIndustria, setSelectedIndustria] = useState("");
    const [anoTodo, setAnoTodo] = useState(false);
    const [redeLojas, setRedeLojas] = useState(false);

    const [industrias, setIndustrias] = useState([]);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Months and Years for dropdowns
    const months = [
        { v: "01", l: "Janeiro" }, { v: "02", l: "Fevereiro" }, { v: "03", l: "Março" },
        { v: "04", l: "Abril" }, { v: "05", l: "Maio" }, { v: "06", l: "Junho" },
        { v: "07", l: "Julho" }, { v: "08", l: "Agosto" }, { v: "09", l: "Setembro" },
        { v: "10", l: "Outubro" }, { v: "11", l: "Novembro" }, { v: "12", l: "Dezembro" }
    ];

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

    useEffect(() => {
        const loadIndustrias = async () => {
            try {
                const res = await axios.get('/suppliers');
                setIndustrias(res.data.data || []);
            } catch (error) {
                console.error('Erro indústrias:', error);
                toast.error("Erro ao carregar indústrias");
            }
        };
        loadIndustrias();
    }, []);

    const handleProcess = async () => {
        if (!selectedIndustria || !selectedMonth || !selectedYear) {
            toast.warning("Selecione a indústria e o período de referência");
            return;
        }

        setLoading(true);
        try {
            const res = await axios.get('/reports/clientes-mom', {
                params: {
                    mes: selectedMonth,
                    ano: selectedYear,
                    industria: selectedIndustria,
                    anoTodo: anoTodo,
                    redeLojas: redeLojas
                }
            });
            if (res.data.success) {
                setData(res.data.data || []);
                if (res.data.data.length === 0) toast.info("Nenhum registro encontrado");
            }
        } catch (error) {
            console.error('Erro processar MoM:', error);
            toast.error("Erro ao processar relatório");
        } finally {
            setLoading(false);
        }
    };

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar");
            return;
        }
        const valPrevHeader = `Valor ${parseInt(selectedYear) - 1}`;
        const qtdPrevHeader = `Qtd ${parseInt(selectedYear) - 1}`;
        const valCurrHeader = `Valor ${selectedYear}`;
        const qtdCurrHeader = `Qtd ${selectedYear}`;

        const headers = ['CLIENTE', valPrevHeader, qtdPrevHeader, valCurrHeader, qtdCurrHeader, '% VALOR', '% QTD'];
        const rows = data.map(r => [
            r.cliente_nome,
            Number(r.valor_prev),
            Number(r.qtd_prev),
            Number(r.valor_curr),
            Number(r.qtd_curr),
            Number(r.perc_valor),
            Number(r.perc_qtd)
        ]);

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Clientes_MoM");
        XLSX.writeFile(wb, `Clientes_MoM_${selectedMonth}_${selectedYear}.xlsx`);
        toast.success("Exportado!");
    };

    const renderPerc = (value) => {
        const val = Number(value);
        if (val === 0) return <span className="text-slate-400">0,00%</span>;
        const color = val > 0 ? 'text-green-600' : 'text-red-500';
        return (
            <div className={`flex items-center justify-end gap-1 ${color} font-bold`}>
                {val > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                <span>{val > 0 ? '+' : ''}{formatNumber(val)}%</span>
            </div>
        );
    };

    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 p-1.5 rounded-md text-slate-500">{icon}</div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-700">{title}</span>
                <span className="text-xs text-slate-500 font-mono">{subtitle}</span>
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden font-sans">
            {/* Header / Filters */}
            <div className="bg-white border-b border-stone-200 p-4 shadow-sm z-20 shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {!isSubComponent && (
                                <>
                                    <h1 className="text-xl font-bold tracking-tight text-stone-900">Clientes MoM (Atual vs Anterior)</h1>
                                </>
                            )}
                            <div className="ml-4 flex items-center gap-2">
                                {!isSubComponent && <ClosePageButton />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportExcel} className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                                <DownloadIcon className="w-4 h-4 !text-white" /> <span className="!text-white">Exportar Excel</span>
                            </button>
                            <button onClick={handleProcess} disabled={loading} className="h-[38px] px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                                {loading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : null}
                                <span className="!text-white">{loading ? 'Processando...' : 'Processar'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[220px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Período de Referência <span className="text-red-500">*</span></label>
                            <div className="flex items-center gap-2">
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm w-36"><SelectValue placeholder="Mês" /></SelectTrigger>
                                    <SelectContent>{months.map(m => <SelectItem key={m.v} value={m.v}>{m.l}</SelectItem>)}</SelectContent>
                                </Select>
                                <span className="text-stone-300 font-bold">/</span>
                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm w-28"><SelectValue placeholder="Ano" /></SelectTrigger>
                                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Indústria <span className="text-red-500">*</span></label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm"><SelectValue placeholder="Selecione a indústria..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={String(i.for_codigo)}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cod: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-2 ml-auto">
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <Checkbox id="anoTodo" checked={anoTodo} onCheckedChange={setAnoTodo} />
                                <Label htmlFor="anoTodo" className="text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer">Ano todo</Label>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <Checkbox id="rede" checked={redeLojas} onCheckedChange={setRedeLojas} />
                                <Label htmlFor="rede" className="text-xs font-bold uppercase tracking-wider text-stone-600 cursor-pointer">Rede de lojas</Label>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-auto p-4 bg-stone-50">
                {!data.length && !loading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-2 text-stone-300">
                        <TrendingUp className="w-16 h-16 opacity-10" />
                        <span className="text-sm italic font-medium">Configure o período e a indústria para visualizar a comparação anual</span>
                    </div>
                ) : (
                    <div className="max-w-[1400px] mx-auto">
                        <Card className="border-stone-200 shadow-sm overflow-hidden rounded-xl">
                            <CardContent className="p-0 overflow-auto max-h-[calc(100vh-250px)]">
                                <Table className="table-fixed border-collapse">
                                    <TableHeader className="sticky top-0 z-10 bg-stone-100 shadow-md">
                                        <TableRow className="bg-stone-100 hover:bg-stone-100 border-b border-stone-200">
                                            <TableHead className="w-[320px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200">Cliente</TableHead>
                                            <TableHead className="w-[130px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200 text-right">Valor {parseInt(selectedYear) - 1}</TableHead>
                                            <TableHead className="w-[110px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200 text-right">Qtd {parseInt(selectedYear) - 1}</TableHead>
                                            <TableHead className="w-[130px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200 text-right">Valor {selectedYear}</TableHead>
                                            <TableHead className="w-[110px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200 text-right">Qtd {selectedYear}</TableHead>
                                            <TableHead className="w-[120px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-r border-stone-200 text-right">% Valor</TableHead>
                                            <TableHead className="w-[120px] text-stone-700 font-bold h-10 uppercase text-xs py-1 px-4 border-none text-right">% Qtd</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-stone-50 transition-colors border-b border-stone-100 h-[34px]">
                                                <TableCell className="text-xs font-semibold text-stone-800 py-1.5 px-4 border-r border-stone-100 truncate" title={row.cliente_nome}>
                                                    {row.cliente_nome}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-stone-500 py-1.5 px-4 border-r border-stone-100 text-right">
                                                    {formatCurrency(row.valor_prev)}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums text-stone-500 py-1.5 px-4 border-r border-stone-100 text-right">
                                                    {formatNumber(row.qtd_prev)}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums font-bold text-stone-800 py-1.5 px-4 border-r border-stone-100 text-right bg-stone-50">
                                                    {formatCurrency(row.valor_curr)}
                                                </TableCell>
                                                <TableCell className="text-xs tabular-nums font-bold text-stone-800 py-1.5 px-4 border-r border-stone-100 text-right bg-stone-50">
                                                    {formatNumber(row.qtd_curr)}
                                                </TableCell>
                                                <TableCell className="text-xs py-1.5 px-4 border-r border-stone-100 text-right">
                                                    {renderPerc(row.perc_valor)}
                                                </TableCell>
                                                <TableCell className="text-xs py-1.5 px-4 border-none text-right">
                                                    {renderPerc(row.perc_qtd)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
