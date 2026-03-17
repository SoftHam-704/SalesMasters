import React, { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User, Briefcase, CheckCircle2, TrendingUp, Calendar, Search, Loader2, ShoppingCart, ArrowUpRight } from "lucide-react"
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
        <div className="h-full flex flex-col bg-stone-50 font-sans text-stone-900 overflow-hidden">
            {/* Header & Control Bar */}
            <div className="px-6 py-4 bg-white border-b border-stone-200 shadow-sm z-20 shrink-0">

                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <ClosePageButton />
                        <h1 className="text-xl font-bold tracking-tight text-stone-900">Dashboard de \u00daltimas Compras</h1>
                        <span className="text-xs text-stone-400 font-mono flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Mapa de Calor por Ind\u00fastria
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-stone-100 p-0.5 rounded-md border border-stone-200">
                            {[
                                { id: "acumulado", label: "Hist\u00f3rico" },
                                { id: "ultima", label: "\u00daltima Compra" }
                            ].map((option) => (
                                <button
                                    key={option.id}
                                    onClick={() => setViewMode(option.id)}
                                    className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all ${viewMode === option.id
                                        ? "bg-white text-stone-900 shadow-sm"
                                        : "text-stone-400 hover:text-stone-600"
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleExportExcel}
                            disabled={data.length === 0}
                            className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4 !text-white" /> <span className="!text-white">Exportar Excel</span>
                        </button>
                    </div>
                </div>

                <div className="flex flex-wrap items-end gap-3">
                    {/* Periodo Filter */}
                    <div className="flex flex-col gap-1.5 min-w-[240px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Per\u00edodo de An\u00e1lise</label>
                        <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg border border-stone-200 shadow-sm h-[38px]">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="bg-transparent text-xs font-medium text-stone-700 outline-none w-full px-2"
                            />
                            <span className="text-stone-300 font-bold">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="bg-transparent text-xs font-medium text-stone-700 outline-none w-full px-2"
                            />
                        </div>
                    </div>

                    {/* Ind\u00fastria Select */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">
                            Ind\u00fastria
                        </label>
                        <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                            <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="ALL">
                                    {renderSelectItem(<Factory className="w-4 h-4" />, "Todas as ind\u00fastrias", "Vis\u00e3o Comparativa")}
                                </SelectItem>
                                {industrias.filter(ind => ind.for_codigo).map(ind => (
                                    <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                        {renderSelectItem(<Factory className="w-4 h-4" />, ind.for_nomered, `CNPJ: ${ind.for_cgc || ind.for_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Cliente Select */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Cliente</label>
                        <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                            <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm">
                                <SelectValue placeholder="Todos os clientes" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="ALL">Todos os clientes ativos</SelectItem>
                                {clientes.filter(c => c.cli_codigo).map(c => (
                                    <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                        {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred || c.cli_nome, `C\u00f3digo: ${c.cli_codigo}`)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Vendedor Select */}
                    <div className="flex flex-col gap-1.5 flex-1 min-w-[140px]">
                        <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Vendedor</label>
                        <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                            <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm">
                                <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                <SelectItem value="ALL">Todos os vendedores</SelectItem>
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

                    {/* Grupo Toggle & Processar */}
                    <div className="flex items-end gap-3 h-[62px]">
                        <label className="flex items-center gap-2 cursor-pointer h-[38px] px-3 border border-stone-200 bg-stone-50 rounded-lg" onClick={() => setConsiderarGrupo(!considerarGrupo)}>
                            <div className={`w-8 h-4 rounded-full p-0.5 transition-all duration-300 ${considerarGrupo ? 'bg-emerald-500' : 'bg-stone-300'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full transition-all duration-300 transform shadow-sm ${considerarGrupo ? 'translate-x-4' : ''}`}></div>
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wide text-stone-600">Rede</span>
                        </label>

                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="h-[38px] px-6 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm"
                        >
                            {loading ? (
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                                <Factory className="w-3.5 h-3.5 !text-white" />
                            )}
                            <span className="!text-white">{loading ? 'Filtrando...' : 'FILTRAR'}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-4 bg-stone-50">
                <Card className="h-full border-stone-200 shadow-sm rounded-xl overflow-hidden bg-white flex flex-col">
                    <CardContent className="p-0 overflow-hidden flex-1 flex flex-col">
                        {loading ? (
                            <div className="flex-1 flex flex-col justify-center items-center gap-6">
                                <div className="relative">
                                    <div className="w-24 h-24 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <TrendingUp className="w-8 h-8 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-black text-[#1E293B] uppercase tracking-[0.3em]">Mapeando Compras</h3>
                                    <p className="text-sm text-[#64748B] font-medium mt-1 uppercase tracking-widest animate-pulse">Cruzando dados de indústrias e clientes...</p>
                                </div>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex-1 flex flex-col justify-center items-center gap-8 py-20">
                                <div className="relative group">
                                    <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500/10 to-transparent rounded-full blur-3xl group-hover:scale-110 transition-transform duration-1000"></div>
                                    <div className="w-40 h-40 bg-white rounded-[40px] shadow-2xl border border-slate-100 flex items-center justify-center relative z-10">
                                        <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center">
                                            <Calendar className="w-12 h-12 text-[#94A3B8]" />
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-slate-50 animate-bounce">
                                        <Search className="w-8 h-8 text-indigo-500" />
                                    </div>
                                </div>
                                <div className="text-center max-w-sm">
                                    <h3 className="text-2xl font-black text-[#1E293B] uppercase tracking-tight">O mapa está limpo</h3>
                                    <p className="text-[#64748B] font-medium mt-3 text-sm leading-relaxed uppercase tracking-widest">
                                        Defina o período e a indústria para visualizar o engajamento de compra dos seus clientes.
                                    </p>
                                    <button
                                        onClick={loadData}
                                        className="mt-8 px-8 py-3.5 bg-[#1E293B] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95"
                                    >
                                        Começar Análise Agora
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto custom-scrollbar">
                                <Table className="border-separate border-spacing-0">
                                    <TableHeader className="sticky top-0 z-40 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                                        <TableRow className="border-none hover:bg-transparent">
                                            {/* Sticky Client Column Header */}
                                            <TableHead className="w-[300px] min-w-[300px] h-12 px-4 text-left align-middle bg-[#F1F5F9] border-b border-r border-[#E2E8F0] sticky left-0 z-50">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide">
                                                        {considerarGrupo ? 'Rede / Grupo' : 'Razão Social'}
                                                    </span>
                                                </div>
                                            </TableHead>

                                            {/* Dynamic Industry Header Cells */}
                                            {uniqueIndustrias.map(ind => (
                                                <TableHead key={ind} className="min-w-[140px] h-12 px-3 text-center align-middle bg-white border-b border-r border-[#E2E8F0]">
                                                    <span className="text-[10px] font-medium text-[#64748B] uppercase tracking-wide truncate max-w-[120px]" title={ind}>
                                                        {ind}
                                                    </span>
                                                </TableHead>
                                            ))}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pivotedData.map((row, rowIdx) => (
                                            <TableRow key={rowIdx} className="hover:bg-slate-50/50 transition-all group">
                                                {/* Sticky Client Label Cell */}
                                                <TableCell className="px-4 py-1.5 border-b border-r border-[#E2E8F0] bg-white sticky left-0 z-30 group-hover:bg-[#F8FAFC]">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`
                                                            w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold border shadow-sm
                                                            ${rowIdx % 2 === 0 ? 'bg-white text-[#1E293B] border-[#E2E8F0]' : 'bg-[#F1F5F9] text-[#10B981] border-[#E2E8F0]'}
                                                        `}>
                                                            {row.cliente.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-[12px] font-bold text-[#1E293B] uppercase tracking-tight truncate leading-tight" title={row.cliente}>
                                                                {row.cliente}
                                                            </span>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                {!considerarGrupo && row.estado && (
                                                                    <span className="text-[8px] font-bold text-[#10B981] uppercase">
                                                                        {row.estado}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Matrix Data Cells */}
                                                {uniqueIndustrias.map(ind => {
                                                    const dataInd = row.industries[ind] || {}
                                                    const hasData = !!dataInd.data_ultima;
                                                    const days = dataInd.dias || 999;

                                                    // Thresholds (Business Logic)
                                                    const isFresh = days <= 30;
                                                    const isWarning = days > 30 && days <= 60;
                                                    const isStale = days > 60 && days <= 90;

                                                    // Corporate Standard Heatmap Colors
                                                    let cellStyle = "bg-white text-[#94A3B8]";
                                                    let dotColor = "bg-[#E2E8F0]";

                                                    if (hasData) {
                                                        if (isFresh) {
                                                            cellStyle = "bg-[#EEFDF6] text-[#065F46] border-[#D1FAE5]";
                                                            dotColor = "bg-[#10B981]";
                                                        } else if (isWarning) {
                                                            cellStyle = "bg-[#EFF6FF] text-[#1E40AF] border-[#DBEAFE]";
                                                            dotColor = "bg-[#60A5FA]";
                                                        } else if (isStale) {
                                                            cellStyle = "bg-[#FFFBEB] text-[#92400E] border-[#FEF3C7]";
                                                            dotColor = "bg-[#F59E0B]";
                                                        } else {
                                                            cellStyle = "bg-[#FEF2F2] text-[#991B1B] border-[#FEE2E2]";
                                                            dotColor = "bg-[#DC2626]";
                                                        }
                                                    }

                                                    return (
                                                        <TableCell
                                                            key={ind}
                                                            className={`p-1.5 text-center border-b border-r border-[#E2E8F0] transition-colors ${cellStyle}`}
                                                        >
                                                            {hasData ? (
                                                                <div className="flex flex-col items-center justify-center">
                                                                    <div className="text-[13px] font-bold tracking-tight mb-0.5">
                                                                        {formatCurrency(dataInd.valor)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
                                                                        <span className="text-[11px] font-bold uppercase">
                                                                            {days}d
                                                                        </span>
                                                                        {viewMode === "acumulado" && (
                                                                            <span className="text-[10px] font-semibold opacity-80">
                                                                                ({dataInd.qtd} un)
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-center opacity-30">
                                                                    <span className="text-[10px]">•</span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                    );
                                                })}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
