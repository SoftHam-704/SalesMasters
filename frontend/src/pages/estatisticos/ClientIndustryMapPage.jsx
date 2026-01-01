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

export default function ClientIndustryMapPage() {
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
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-20">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <Factory className="text-blue-600 w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Mapa Cliente por Indústria</h1>
                                <span className="text-xs text-slate-500 font-medium uppercase">Relatórios Gerenciais</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="default" onClick={loadData} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? "Processando..." : <><Filter className="w-4 h-4 mr-2" /> Processar</>}
                            </Button>
                            <Button variant="outline" onClick={handleExportExcel} className="gap-2 text-slate-600">
                                <Download className="w-4 h-4" /> Excel
                            </Button>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        {/* Dates */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Período</Label>
                            <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-slate-200">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full text-sm outline-none px-2 py-1" />
                                <span className="text-slate-300">|</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full text-sm outline-none px-2 py-1" />
                            </div>
                        </div>

                        {/* Industry */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-bold text-blue-600 uppercase flex items-center gap-1">
                                <Building className="w-3 h-3" /> Indústria
                            </Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-10 bg-white shadow-sm border-blue-200">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL" className="font-bold text-blue-600">Todas as Indústrias</SelectItem>
                                    {industrias.map(i => (
                                        <SelectItem key={i.id || i.for_codigo} value={String(i.id || i.for_codigo)}>
                                            {renderSelectItem(<Building className="w-4 h-4" />, i.for_nomered || i.nome, `ID: ${i.id || i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Checkboxes - Green Style */}
                        <div className="col-span-12 md:col-span-6 flex flex-col gap-1 justify-center">
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setConsiderarGrupo(!considerarGrupo)}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${considerarGrupo ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}>
                                    {considerarGrupo && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs font-medium text-green-600">Agrupar por Rede de Lojas</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setDetalhada(!detalhada)}>
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${detalhada ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}>
                                    {detalhada && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <span className="text-xs font-medium text-green-600">Mostrar Pedido a Pedido (Detalhado)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100">
                {Object.keys(groupedData).length === 0 ? (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        <p>Nenhum dado carregado. Utilize os filtros acima.</p>
                    </div>
                ) : (
                    <Accordion type="multiple" className="space-y-4">
                        {Object.entries(groupedData).map(([industriaName, items]) => {
                            const totalVal = items.reduce((sum, i) => sum + i.valor, 0)
                            const totalQtd = items.reduce((sum, i) => sum + i.qtd, 0)

                            return (
                                <AccordionItem key={industriaName} value={industriaName} className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
                                    <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 transition-colors">
                                        <div className="flex justify-between items-center w-full pr-4">
                                            <div className="flex items-center gap-2">
                                                <Factory className="w-5 h-5 text-blue-500" />
                                                <span className="font-bold text-slate-700 text-lg uppercase">{industriaName}</span>
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 ml-2">
                                                    {items.length} {detalhada ? 'pedidos' : 'clientes'}
                                                </span>
                                            </div>
                                            <div className="flex gap-6 text-sm">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Qtd</span>
                                                    <span className="font-bold text-slate-600">{formatNumber(totalQtd)}</span>
                                                </div>
                                                <div className="flex flex-col items-end min-w-[100px]">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Total Valor</span>
                                                    <span className="font-bold text-emerald-600 text-base">{formatCurrency(totalVal)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-0 pb-0 border-t border-slate-100">
                                        <div className="overflow-x-auto">
                                            <Table>
                                                <TableHeader className="bg-slate-50">
                                                    <TableRow>
                                                        {detalhada && <TableHead className="w-[100px] text-xs py-1">Pedido</TableHead>}
                                                        <TableHead className="text-xs py-1">Cliente</TableHead>
                                                        <TableHead className="w-[150px] text-xs py-1">Data</TableHead>
                                                        <TableHead className="text-right w-[120px] text-xs py-1">Quantidade</TableHead>
                                                        <TableHead className="text-right w-[150px] text-xs py-1">Valor</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {items.map((row, idx) => (
                                                        <TableRow key={idx} className="hover:bg-slate-50 border-b border-slate-50 last:border-0">
                                                            {detalhada && (
                                                                <TableCell className="font-mono text-slate-500 text-xs py-1">
                                                                    {row.pedido}
                                                                </TableCell>
                                                            )}
                                                            <TableCell className="font-medium text-slate-700 text-xs py-1">
                                                                {row.cliente}
                                                            </TableCell>
                                                            <TableCell className="text-slate-500 text-xs py-1">
                                                                {detalhada ? new Date(row.data).toLocaleDateString() : row.mes_ref || new Date(row.data).toLocaleDateString()}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-slate-600 text-xs py-1">
                                                                {formatNumber(row.qtd)}
                                                            </TableCell>
                                                            <TableCell className="text-right font-bold text-emerald-700 text-xs py-1">
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
