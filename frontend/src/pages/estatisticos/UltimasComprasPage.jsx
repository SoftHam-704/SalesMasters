import React, { useState, useEffect } from "react"
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
    const [selectedIndustria, setSelectedIndustria] = useState("ALL")
    const [selectedCliente, setSelectedCliente] = useState("ALL")
    const [selectedVendedor, setSelectedVendedor] = useState("ALL")
    const [considerarGrupo, setConsiderarGrupo] = useState(false)
    const [viewMode, setViewMode] = useState("acumulado") // acumulado, ultima
    const [pivotedData, setPivotedData] = useState([])
    const [uniqueIndustrias, setUniqueIndustrias] = useState([])

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

    // --- Trigger load once on mount if desired, but user wants "Process" button ---
    useEffect(() => {
        // Option to load initial data if needed
    }, [])

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
            const rawData = res.data.data || []
            setData(rawData)

            if (selectedIndustria === 'ALL') {
                // Pivot data for matrix view
                const industries = [...new Set(rawData.map(item => item.industria).filter(Boolean))].sort()
                setUniqueIndustrias(industries)

                const clientsMap = {}
                rawData.forEach(item => {
                    if (!clientsMap[item.cliente]) {
                        clientsMap[item.cliente] = {
                            cliente: item.cliente,
                            estado: item.estado,
                            industries: {}
                        }
                    }
                    clientsMap[item.cliente].industries[item.industria] = {
                        valor: item.valor,
                        qtd: item.qtd,
                        data_ultima: item.data_ultima,
                        dias: item.dias
                    }
                })
                setPivotedData(Object.values(clientsMap))
            } else {
                // ALSO PIVOT for Single Industry (User Request: Use Matrix View Always)
                // Inject Name
                const indObj = industrias.find(i => String(i.for_codigo) === String(selectedIndustria))
                const indName = indObj ? indObj.for_nomered : 'Indústria Selecionada'

                // Pivot Logic (Same as above, but with injected name)
                const clientsMap = {}

                rawData.forEach(item => {
                    // Ensure item has industry name
                    const itemInd = indName

                    if (!clientsMap[item.cliente]) {
                        clientsMap[item.cliente] = {
                            cliente: item.cliente,
                            estado: item.estado,
                            industries: {}
                        }
                    }
                    clientsMap[item.cliente].industries[itemInd] = {
                        valor: item.valor,
                        qtd: item.qtd,
                        data_ultima: item.data_ultima,
                        dias: item.dias
                    }
                })
                setUniqueIndustrias([indName])
                setPivotedData(Object.values(clientsMap))
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
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
        if (!pivotedData.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        let headers = ['Cliente', 'Estado']
        uniqueIndustrias.forEach(ind => {
            headers.push(`${ind} - Valor`, `${ind} - Qtd`, `${ind} - Data`, `${ind} - Dias`)
        })

        const rows = pivotedData.map(row => {
            const line = [row.cliente, row.estado]
            uniqueIndustrias.forEach(ind => {
                const dataInd = row.industries[ind] || {}
                line.push(
                    dataInd.valor || 0,
                    dataInd.qtd || 0,
                    formatDate(dataInd.data_ultima),
                    dataInd.dias || 0
                )
            })
            return line
        })

        const sheetData = [headers, ...rows]
        const ws = XLSX.utils.aoa_to_sheet(sheetData)
        // Adjust column widths logic broadly
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
                            <SelectTrigger className={`h-10 bg-white shadow-sm ${selectedIndustria === 'ALL' ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="ALL">
                                    {renderSelectItem(<Factory className="w-4 h-4" />, "Todas as indústrias", "Ver comparativo")}
                                </SelectItem>
                                {industrias.filter(ind => ind.for_codigo).map(ind => (
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
                                {clientes.filter(c => c.cli_codigo).map(c => (
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
                        {/* Toggle MODO */}
                        <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                            {[
                                { id: "acumulado", label: "TOTAL PERÍODO" },
                                { id: "ultima", label: "ÚLTIMA COMPRA" }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setViewMode(option.id)}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all ${viewMode === option.id
                                        ? "bg-white text-blue-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                        }`}
                                >
                                    {option.label}
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

                        {/* Botão Processar */}
                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="ml-auto flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-black uppercase tracking-widest text-xs rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Factory className="w-4 h-4" />}
                            PROCESSAR
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-4">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <Factory className="absolute inset-0 m-auto w-6 h-6 text-blue-600 animate-pulse" />
                                </div>
                                <div className="flex flex-col items-center">
                                    <span className="text-sm font-black text-slate-700 uppercase tracking-[0.2em]">Processando Dados</span>
                                    <span className="text-xs text-slate-400 font-medium">Buscando histórico de compras...</span>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full gap-4 text-slate-300">
                                <div className="p-8 bg-slate-50 rounded-full border border-dashed border-slate-200">
                                    <Factory className="w-16 h-16" />
                                </div>
                                <div className="flex flex-col items-center gap-1">
                                    <span className="text-lg font-bold text-slate-400">Pronto para processar</span>
                                    <span className="text-sm">Clique no botão <span className="text-blue-600 font-bold uppercase underline">Processar</span> para gerar o mapa</span>
                                </div>
                            </div>
                        ) : (
                            <Table className="border-separate border-spacing-0">
                                <TableHeader className="sticky top-0 z-40 bg-white dark:bg-slate-900 shadow-sm">
                                    <TableRow className="border-none hover:bg-transparent">
                                        {/* Sticky Client Column */}
                                        <TableHead className="w-[300px] min-w-[300px] h-14 px-4 text-left align-middle font-bold text-slate-700 bg-slate-50 border-b border-r border-slate-200 sticky left-0 z-50 shadow-[4px_0_12px_rgba(0,0,0,0.05)]">
                                            {considerarGrupo ? 'Rede de Lojas' : 'Cliente / Razão Social'}
                                        </TableHead>

                                        {/* Dynamic Industry Columns */}
                                        {uniqueIndustrias.map(ind => (
                                            <TableHead key={ind} className="min-w-[150px] h-14 px-2 text-center align-middle font-bold text-slate-600 bg-white border-b border-r border-slate-100 uppercase text-[11px] tracking-tight hover:bg-slate-50 transition-colors">
                                                <div className="flex flex-col items-center gap-1">
                                                    <Factory className="w-3 h-3 text-slate-400" />
                                                    <span className="line-clamp-1" title={ind}>{ind}</span>
                                                </div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pivotedData.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors group">
                                            {/* Sticky Client Name */}
                                            <TableCell className="p-3 font-medium text-slate-700 border-b border-r border-slate-100 bg-white sticky left-0 z-30 group-hover:bg-blue-50/30">
                                                <div className="flex items-center gap-3">
                                                    <div className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold border shrink-0
                                                        ${idx % 2 === 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-blue-50 text-blue-600 border-blue-100'}
                                                    `}>
                                                        {row.cliente.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="truncate text-xs font-bold text-slate-800" title={row.cliente}>
                                                            {row.cliente}
                                                        </span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] text-slate-400">
                                                                #{idx + 1}
                                                            </span>
                                                            {!considerarGrupo && row.estado && (
                                                                <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                                    {row.estado}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Matrix Cells */}
                                            {uniqueIndustrias.map(ind => {
                                                const dataInd = row.industries[ind] || {}
                                                const hasData = !!dataInd.data_ultima;

                                                // Status Color Logic
                                                const days = dataInd.dias || 999;
                                                const isFresh = days <= 30;
                                                const isWarning = days > 30 && days <= 60;
                                                const isStale = days > 60 && days <= 90;

                                                // Dynamic Background based on freshness
                                                let cellBg = "";
                                                if (hasData) {
                                                    if (isFresh) { cellBg = "bg-emerald-50/40 hover:bg-emerald-100"; }
                                                    else if (isWarning) { cellBg = "bg-blue-50/40 hover:bg-blue-100"; }
                                                    else if (isStale) { cellBg = "bg-amber-50/40 hover:bg-amber-100"; }
                                                    else { cellBg = "bg-white hover:bg-red-50"; }
                                                }

                                                return (
                                                    <TableCell
                                                        key={ind}
                                                        className={`p-0 text-center border-b border-r border-slate-100 relative transition-all align-middle ${cellBg}`}
                                                        title={hasData ? `${ind}\nValor: ${formatCurrency(dataInd.valor)}\nQtd: ${dataInd.qtd}\nÚltima: ${formatDate(dataInd.data_ultima)}\n(${days} dias atrás)` : 'Sem compras'}
                                                    >
                                                        {hasData ? (
                                                            <div className="w-full h-full flex flex-col items-center justify-center py-2 px-1 gap-1">
                                                                {/* VALUE - Increased Size */}
                                                                <span className="text-[13px] font-bold text-slate-800 leading-none">
                                                                    {formatCurrency(dataInd.valor)}
                                                                </span>

                                                                {/* QTY + DAYS ROW */}
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[11px] font-semibold text-slate-500 bg-white/50 px-1 rounded">
                                                                        {dataInd.qtd} un
                                                                    </span>
                                                                    <div className={`flex items-center gap-1 text-[10px] font-bold ${isFresh ? 'text-emerald-600' : isWarning ? 'text-blue-500' : 'text-slate-400'}`}>
                                                                        <span>{days}d</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-200 text-[10px] select-none">·</span>
                                                        )}
                                                    </TableCell>
                                                );
                                            })
                                            }
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
