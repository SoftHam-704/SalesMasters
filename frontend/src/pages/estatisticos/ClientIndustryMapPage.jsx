import { useState, useEffect, useMemo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Filter, Download, Building, User, Briefcase, CheckCircle2, Factory } from "lucide-react";
import ClosePageButton from "../../components/common/ClosePageButton";
import { toast } from "sonner"
import * as XLSX from 'xlsx'

export default function ClientIndustryMapPage({ isSubComponent = false }) {
    // --- Filters ---
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]
    })

    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [vendedores, setVendedores] = useState([])

    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("")
    const [selectedVendedor, setSelectedVendedor] = useState("")

    const [considerarGrupo, setConsiderarGrupo] = useState(false)
    const [detalhada, setDetalhada] = useState(false)

    // --- Data ---
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // --- Load Aux Data ---
    useEffect(() => {
        const loadAux = async () => {
            try {
                const [resInd, resCli, resVen] = await Promise.all([
                    axios.get('/suppliers').catch(() => ({ data: { data: [] } })),
                    axios.get('/aux/clientes').catch(() => ({ data: { data: [] } })),
                    axios.get('/sellers').catch(() => ({ data: { data: [] } }))
                ])
                setIndustrias(resInd.data.data || [])
                setClientes(resCli.data.data || [])
                setVendedores(resVen.data.data || [])
            } catch (error) {
                console.error("Erro loading filters", error)
            }
        }
        loadAux()
    }, [])

    // --- Process ---
    const loadData = async () => {
        if (!selectedIndustria && !selectedCliente && !selectedVendedor) {
            // Optional: require at least one filter? The user print shows "Indústria: CERCENA".
            // Let's allow loading all if user wants, but maybe prompt.
        }

        setLoading(true)
        try {
            const params = {
                start: startDate,
                end: endDate,
                industria: selectedIndustria,
                cliente: selectedCliente,
                vendedor: selectedVendedor,
                grupo: considerarGrupo,
                detalhada: detalhada
            }
            const res = await axios.get('/reports/mapa_cliente_industria', { params })
            setData(res.data.data || [])
            if ((res.data.data || []).length === 0) toast.warning("Nenhum dado encontrado para os filtros.")
            else toast.success("Relatório gerado com sucesso!")

        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    // --- Grouping ---
    const groupedData = useMemo(() => {
        if (!data.length) return {}
        // Group by Industria
        return data.reduce((acc, item) => {
            const key = item.industria || "Indústria N/I"
            if (!acc[key]) acc[key] = []
            acc[key].push(item)
            return acc
        }, {})
    }, [data])

    // --- Export Excel ---
    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        // Flatten logic matching the detailed/summary view
        // Columns: Industria, Cliente, Data, Valor, Qtd
        const exportData = data.map(item => ({
            "Indústria": item.industria,
            "Cliente": item.cliente,
            "Data Ref": detalhada ? new Date(item.data).toLocaleDateString() : item.mes_ref || new Date(item.data).toLocaleDateString(),
            "Pedido": item.pedido || '-',
            "Qtd": item.qtd,
            "Valor": item.valor
        }))

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Dados")
        XLSX.writeFile(wb, `Mapa_Cliente_Industria_${startDate}_${endDate}.xlsx`)
        toast.success("Excel gerado com sucesso!")
    }

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0)
    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 p-1.5 rounded-md text-slate-500">{icon}</div>
            <div className="flex flex-col text-left">
                <span className="font-medium text-slate-700 text-sm">{title}</span>
                {subtitle && <span className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</span>}
            </div>
        </div>
    )

    return (
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 p-4 shadow-sm z-20 shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {!isSubComponent && (
                                <>
                                    <h1 className="text-xl font-bold tracking-tight text-stone-900">Mapa Cliente por Indústria</h1>
                                </>
                            )}
                            <div className="flex items-center gap-2">
                                {!isSubComponent && <ClosePageButton />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportExcel} className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                                <Download className="w-4 h-4 !text-white" /> <span className="!text-white">Exportar Excel</span>
                            </button>
                            <button onClick={loadData} disabled={loading} className="h-[38px] px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                                {loading ? <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" /> : <Filter size={14} className="!text-white" />}
                                <span className="!text-white">Processar</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Dates */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Período</label>
                            <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg border border-stone-200 shadow-sm">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm outline-none px-2 py-1 text-stone-700" />
                                <span className="text-stone-300 font-bold">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm outline-none px-2 py-1 text-stone-700" />
                            </div>
                        </div>

                        {/* Industry */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Indústria</Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Todas as Indústrias</SelectItem>
                                    {industrias.map(i => (
                                        <SelectItem key={i.id || i.for_codigo} value={String(i.id || i.for_codigo)}>
                                            {renderSelectItem(<Building className="w-4 h-4" />, i.for_nomered || i.nome, `ID: ${i.id || i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Options */}
                        <div className="flex flex-col gap-2 ml-auto">
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setConsiderarGrupo(!considerarGrupo)}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${considerarGrupo ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                                    {considerarGrupo && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Agrupar por Rede</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setDetalhada(!detalhada)}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${detalhada ? 'bg-stone-900 border-stone-900' : 'border-stone-300 group-hover:border-stone-400'}`}>
                                    {detalhada && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs font-bold uppercase tracking-wider text-stone-600">Pedido a Pedido</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 bg-stone-50">
                {Object.keys(groupedData).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-stone-400">
                        <p className="text-sm">Nenhum dado carregado. Selecione os filtros e clique em Processar.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-3">
                        {Object.entries(groupedData).map(([industriaName, items]) => {
                            const totalVal = items.reduce((sum, i) => sum + i.valor, 0)
                            const totalQtd = items.reduce((sum, i) => sum + i.qtd, 0)

                            return (
                                <AccordionItem key={industriaName} value={industriaName} className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:bg-stone-50 transition-colors">
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div className="flex items-center gap-2">
                                                <Factory className="w-5 h-5 text-stone-400" />
                                                <span className="font-bold text-stone-700 text-sm uppercase tracking-wide">{industriaName}</span>
                                                <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full border border-stone-200 ml-2">
                                                    {items.length} {detalhada ? 'pedidos' : 'clientes'}
                                                </span>
                                            </div>
                                            <div className="flex gap-6 text-sm">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-stone-400 uppercase font-bold">Total Qtd</span>
                                                    <span className="font-bold text-stone-700">{formatNumber(totalQtd)}</span>
                                                </div>
                                                <div className="flex flex-col items-end min-w-[100px]">
                                                    <span className="text-[10px] text-stone-400 uppercase font-bold">Total Valor</span>
                                                    <span className="font-bold text-emerald-600 text-sm">{formatCurrency(totalVal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-0 pb-0 border-t border-stone-100">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-stone-50">
                                                    <TableRow>
                                                        {detalhada && <TableHead className="w-[100px] text-xs py-1.5 text-stone-500 font-bold uppercase tracking-wider">Pedido</TableHead>}
                                                        <TableHead className="text-xs py-1.5 text-stone-500 font-bold uppercase tracking-wider">Cliente</TableHead>
                                                        <TableHead className="w-[150px] text-xs py-1.5 text-stone-500 font-bold uppercase tracking-wider">Data</TableHead>
                                                        <TableHead className="text-right w-[120px] text-xs py-1.5 text-stone-500 font-bold uppercase tracking-wider">Quantidade</TableHead>
                                                        <TableHead className="text-right w-[150px] text-xs py-1.5 text-stone-500 font-bold uppercase tracking-wider">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((row, idx) => (
                                                        <TableRow key={idx} className="hover:bg-stone-50 border-b border-stone-50 last:border-0">
                                                            {detalhada && (
                                                                <TableCell className="font-mono text-stone-500 text-xs py-1.5">
                                                                    {row.pedido}
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="font-medium text-stone-800 text-xs py-1.5">
                                                                {row.cliente}
                                                            </TableCell>
                                                            <TableCell className="text-stone-500 text-xs py-1.5">
                                                                {detalhada ? new Date(row.data).toLocaleDateString() : row.mes_ref || new Date(row.data).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="text-right tabular-nums text-stone-700 text-xs py-1.5">
                                                                {formatNumber(row.qtd)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-emerald-700 text-xs py-1.5">
                                                                {formatCurrency(row.valor)}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            )
                        })}
                    </Accordion>
                )}
            </div>
        </div>
    )
}
