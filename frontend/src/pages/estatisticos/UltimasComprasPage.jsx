import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User, Briefcase, CheckCircle2 } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

export default function UltimasComprasPage() {
    // --- State ---
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setMonth(0); d.setDate(1);
        return d.toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0])
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("ALL")
    const [selectedVendedor, setSelectedVendedor] = useState("ALL")
    const [considerarGrupo, setConsiderarGrupo] = useState(false)
    const [viewMode, setViewMode] = useState("valor") // valor, qtd, ultima

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [vendedores, setVendedores] = useState([])
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // --- Load Dropdowns ---
    useEffect(() => {
        const loadAux = async () => {
            try {
                const resInd = await axios.get('/suppliers')
                setIndustrias(resInd.data?.data || [])

                const resCli = await axios.get('/aux/clientes')
                setClientes(resCli.data?.data || [])

                const resVen = await axios.get('/sellers')
                setVendedores(resVen.data?.data || [])
            } catch (error) {
                console.error("Erro ao carregar filtros:", error)
            }
        }
        loadAux()
    }, [])

    // --- Load Data ---
    useEffect(() => {
        if (!selectedIndustria) {
            setData([])
            return
        }
        loadData()
    }, [startDate, endDate, selectedIndustria, selectedCliente, selectedVendedor, considerarGrupo, viewMode])

    const loadData = async () => {
        setLoading(true)
        try {
            const params = {
                start: startDate,
                end: endDate,
                industria: selectedIndustria,
                cliente: selectedCliente,
                vendedor: selectedVendedor,
                grupo: considerarGrupo,
                modo: viewMode
            }
            const res = await axios.get('/reports/ultimas-compras', { params })
            setData(res.data.data || [])
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0)
    const formatDate = (val) => val ? new Date(val).toLocaleDateString('pt-BR') : '-'

    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400">
                {icon}
            </div>
            <div className="flex flex-col text-left">
                <span className="font-medium text-slate-700 dark:text-slate-200 text-sm leading-tight">{title}</span>
                {subtitle && <span className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">{subtitle}</span>}
            </div>
        </div>
    )

    // --- Export ---
    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        const headers = ['Cliente', 'Estado', 'Valor', 'Qtd', 'Última Compra', 'Dias']
        const rows = data.map(row => [
            row.cliente,
            row.estado,
            row.valor,
            row.qtd,
            formatDate(row.data_ultima),
            row.dias
        ])

        const sheetData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        ws['!cols'] = [{ wch: 35 }, { wch: 5 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 8 }]

        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Últimas Compras")
        XLSX.writeFile(wb, `Ultimas_Compras_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado com sucesso!")
    }

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header / Filters */}
            <div className="bg-gradient-to-r from-slate-100 to-white dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <ClosePageButton />
                        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">Últimas Compras Clientes</h1>
                    </div>
                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm">
                        <Download className="w-4 h-4" /> Exportar Excel
                    </button>
                </div>

                <div className="grid grid-cols-12 gap-3 items-end">
                    {/* Periodo */}
                    <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</Label>
                        <div className="flex items-center gap-2 bg-white p-1.5 rounded-md border border-slate-200 shadow-sm">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium" />
                            <span className="text-slate-300">→</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium" />
                        </div>
                    </div>

                    {/* Indústria */}
                    <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5 relative z-30">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indústria <span className="text-red-500">*</span></Label>
                        <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                            <SelectTrigger className={`h-10 bg-white shadow-sm ${!selectedIndustria ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {industrias.map(ind => (
                                    <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                        {renderSelectItem(<Factory className="w-4 h-4" />, ind.for_nomered, `Cód: ${ind.for_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente */}
                    <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5 relative z-20">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</Label>
                        <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                            <SelectTrigger className="h-10 bg-white shadow-sm">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="ALL">Todos</SelectItem>
                                {clientes.map(c => (
                                    <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                        {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred || c.cli_nome, `Cód: ${c.cli_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vendedor */}
                    <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5 relative z-10">
                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vendedor</Label>
                        <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                            <SelectTrigger className="h-10 bg-white shadow-sm">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">Todos</SelectItem>
                                {vendedores.map(v => {
                                    const id = v.id || v.ven_codigo
                                    const nome = v.ven_nome || v.nome || `Vendedor ${id}`
                                    if (!id) return null;
                                    return (
                                        <SelectItem key={id} value={String(id)}>
                                            {renderSelectItem(<Briefcase className="w-4 h-4" />, nome, `ID: ${id}`)}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Controls - Right Side */}
                    <div className="col-span-12 md:col-span-4 flex items-center gap-4">
                        {/* Toggle Buttons - Same style as first map */}
                        <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                            {["valor", "qtd", "ultima"].map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all ${viewMode === mode
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                        }`}
                                >
                                    {mode === "valor" ? "VALOR" : mode === "qtd" ? "QTD" : "ÚLTIMA"}
                                </button>
                            ))}
                        </div>

                        {/* Checkbox Rede - Green Style */}
                        <label className="flex items-center gap-2 cursor-pointer group" onClick={() => {
                            const newValue = !considerarGrupo;
                            setConsiderarGrupo(newValue);
                            if (newValue) toast.info("Agrupando por Rede de Lojas");
                        }}>
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${considerarGrupo ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}>
                                {considerarGrupo && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <span className="text-xs font-medium text-green-600">Grupo de Lojas</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-3">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-slate-500 animate-pulse">Carregando dados...</span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-slate-400">
                                <span className="text-4xl">📊</span>
                                <span className="text-sm">Selecione uma indústria para ver os dados</span>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 z-10">
                                    <TableRow className="bg-slate-700 hover:bg-slate-700">
                                        <TableHead className="text-white font-bold text-xs py-1 px-2">Cliente</TableHead>
                                        {!considerarGrupo && <TableHead className="text-white font-bold text-xs py-1 px-2 text-center w-16">UF</TableHead>}
                                        <TableHead className="text-white font-bold text-xs py-1 px-2 text-right w-32">
                                            {viewMode === 'qtd' ? 'Qtd' : 'Valor'}
                                        </TableHead>
                                        <TableHead className="text-white font-bold text-xs py-1 px-2 text-center w-28">Data</TableHead>
                                        <TableHead className="text-white font-bold text-xs py-1 px-2 text-center w-20">Dias</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-blue-50/50 transition-colors border-b border-slate-100">
                                            <TableCell className="py-1 px-2 text-xs font-medium text-slate-700">{row.cliente}</TableCell>
                                            {!considerarGrupo && <TableCell className="py-1 px-2 text-xs text-center text-slate-500">{row.estado || '-'}</TableCell>}
                                            <TableCell className="py-1 px-2 text-xs text-right font-mono text-blue-600">
                                                {viewMode === 'qtd' ? formatNumber(row.qtd) : formatCurrency(row.valor)}
                                            </TableCell>
                                            <TableCell className="py-1 px-2 text-xs text-center text-slate-600">{formatDate(row.data_ultima)}</TableCell>
                                            <TableCell className="py-1 px-2 text-xs text-center font-bold text-red-600">{row.dias}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
