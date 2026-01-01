import { useState, useEffect, useMemo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { TrendingUp, Filter, Download, Calendar, Search, Building, User, Briefcase, FileText, CheckCircle2, Factory } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

export default function PivotReportPage({ title, reportType }) {
    // --- Filters State ---
    const [startDate, setStartDate] = useState(() => {
        const date = new Date()
        return new Date(date.getFullYear(), 0, 1).toISOString().split('T')[0] // Jan 1st
    })
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0] // Today
    })

    // Filtros de Entidades
    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [vendedores, setVendedores] = useState([])

    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("")
    const [selectedVendedor, setSelectedVendedor] = useState("")

    // Opções
    const [considerarGrupo, setConsiderarGrupo] = useState(false)
    const [viewMode, setViewMode] = useState("valor_qtd") // valor_qtd, valor, qtd
    const [comparativeMode, setComparativeMode] = useState(false) // Comparative View (Year over Year)

    // --- Data State ---
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // --- Load Aux Data ---
    useEffect(() => {
        const loadAux = async () => {
            try {
                // Carregar Indústrias
                const resInd = await axios.get('/suppliers')
                console.log("🔹 [Pivot] Indústrias carregadas:", resInd.data)
                setIndustrias(resInd.data.data || [])

                // Carregar Clientes e Vendedores (Simulado se não existir)
                // Carregar Clientes
                try {
                    const resCli = await axios.get('/aux/clientes')
                    setClientes(resCli.data.data || [])
                } catch { console.warn("Endpoint /aux/clientes erro") }

                // Carregar Vendedores
                try {
                    const resVen = await axios.get('/sellers')
                    console.log("🔹 [Pivot] Vendedores carregados:", resVen.data)
                    setVendedores(resVen.data.data || [])
                } catch (e) {
                    console.error("Erro sellers", e)
                }

            } catch (error) {
                console.error("Erro ao carregar filtros:", error)
                toast.error("Erro ao carregar opções de filtro")
            }
        }
        loadAux()
    }, [])

    // --- Report Config ---
    const reportConfig = useMemo(() => {
        switch (reportType) {
            case 'vendas':
                return {
                    title: "Mapa de Vendas",
                    rowGroup: "cliente_nome",
                    rowLabel: "Cliente",
                    colKey: "mes", // key to extract month (backend return 'mes')
                }
            case 'cliente_industria':
                return {
                    title: "Mapa Cliente / Indústria",
                    rowGroup: "cliente_nome",
                    rowLabel: "Cliente",
                    colKey: "industria_nome"
                }
            case 'vendedor':
                return {
                    title: title || 'Mapa por Vendedor',
                    rowLabel: 'INDÚSTRIA',
                    colKey: 'mes',
                    rowGroup: 'industria_nome'
                }
            case 'produtos':
                return {
                    title: title || 'Mapa por Produtos',
                    rowLabel: 'ITEM',
                    colKey: 'mes',
                    rowGroup: 'produto_codigo'
                }
            default:
                return {
                    title: title || "Relatório",
                    rowGroup: "nome",
                    rowLabel: "Item",
                    colKey: "periodo"
                }
        }
    }, [reportType, title])

    // --- Load Report Data ---
    useEffect(() => {
        // Debounce or load on button click?
        // User image implies "Filtrar" happens dynamically or maybe standard load?
        // We will load when mandatory fields are set?
        // User said Industry is mandatory for this report.
        if (reportType === 'vendas' && !selectedIndustria) {
            // Don't load yet if required filter missing, or load empty
            setData([])
            return
        }
        if (reportType === 'vendedor' && !selectedVendedor) {
            setData([])
            return
        }
        if (reportType === 'produtos' && !selectedIndustria) {
            setData([])
            return
        }
        loadData()
    }, [reportType, startDate, endDate, selectedIndustria, selectedCliente, selectedVendedor, considerarGrupo])

    const loadData = async () => {
        setLoading(true)
        try {
            if (reportType === 'vendas') {
                const params = {
                    start: startDate,
                    end: endDate,
                    industria: selectedIndustria,
                    cliente: selectedCliente,
                    vendedor: selectedVendedor,
                    grupo: considerarGrupo
                }
                const res = await axios.get('/reports/vendas', { params })
                setData(res.data.data)
            } else if (reportType === 'vendedor') {
                const params = {
                    start: startDate,
                    end: endDate,
                    industria: selectedIndustria,
                    cliente: selectedCliente,
                    vendedor: selectedVendedor
                }
                const res = await axios.get('/reports/vendedor', { params })
                setData(res.data.data)
            } else if (reportType === 'produtos') {
                const params = {
                    start: startDate,
                    end: endDate,
                    industria: selectedIndustria,
                    cliente: selectedCliente
                }
                const res = await axios.get('/reports/produtos', { params })
                setData(res.data.data)
            } else {
                setData([])
            }
        } catch (error) {
            console.error(error)
            toast.error("Erro ao carregar dados")
        } finally {
            setLoading(false)
        }
    }


    // --- Pivot Logic ---
    const pivotData = useMemo(() => {
        if (!data.length) return { columns: [], rows: [] }

        // Helper to normalize client names (Trim & Upper) to merge duplicates
        const normalize = (val) => val ? String(val).trim().toUpperCase() : ""

        let cols = []
        let rows = []

        if (comparativeMode && reportType === 'vendas') {
            // COMPARATIVE MODE: Cols = Jan..Dez, Rows = key + Year
            const allMonths = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
            const monthNames = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' }

            cols = allMonths.map(m => `${m} - ${monthNames[m]}`)

            const rowKeys = [...new Set(data.map(d => {
                const part = d.mes.split('/')
                const year = part[1] || '????'
                return `${normalize(d.cliente_nome)}|${year}`
            }))].sort()

            rows = rowKeys.map(key => {
                const [client, year] = key.split('|')
                // Rows style: Client Name (2024)
                // Find the display name from the first matching item to show niceness (or just use client wrapper)
                const firstMatch = data.find(d => normalize(d.cliente_nome) === client)
                const displayName = firstMatch ? firstMatch.cliente_nome : client

                const rowData = { [reportConfig.rowGroup]: `${displayName} (${year})`, totalValor: 0, totalQtd: 0, _rawClient: client, _year: year }

                allMonths.forEach(m => {
                    const colLabel = `${m} - ${monthNames[m]}`
                    // Aggregation: Sum all items matching normalized client + month/year
                    const items = data.filter(d => normalize(d.cliente_nome) === client && d.mes === `${m}/${year}`)

                    const val = items.reduce((sum, item) => sum + (parseFloat(item.valor || 0)), 0)
                    const qtd = items.reduce((sum, item) => sum + (parseInt(item.qtd || 0)), 0)

                    rowData[`${colLabel}_valor`] = val
                    rowData[`${colLabel}_qtd`] = qtd

                    rowData.totalValor += val
                    rowData.totalQtd += qtd
                })
                return rowData
            })

            rows.sort((a, b) => {
                if (a._rawClient === b._rawClient) return b._year - a._year
                return a._rawClient.localeCompare(b._rawClient)
            })

        } else {
            // STANDARD MODE
            const colKey = reportType === 'vendas' ? 'mes' : reportConfig.colKey
            const rawCols = [...new Set(data.map(item => item[colKey]))]

            // Custom Sort for MM/YYYY
            cols = rawCols.sort((a, b) => {
                if (colKey === 'mes' && a.includes('/') && b.includes('/')) {
                    const [ma, ya] = a.split('/').map(Number)
                    const [mb, yb] = b.split('/').map(Number)
                    if (ya !== yb) return ya - yb
                    return ma - mb
                }
                return a.localeCompare(b)
            })

            // Normalize row keys (Clients)
            const rowKeys = [...new Set(data.map(item => normalize(item[reportConfig.rowGroup])))].sort()

            rows = rowKeys.map(rowKey => {
                // Find display name
                const firstMatch = data.find(d => normalize(d[reportConfig.rowGroup]) === rowKey)
                const displayName = firstMatch ? firstMatch[reportConfig.rowGroup] : rowKey

                const rowData = { [reportConfig.rowGroup]: displayName, totalValor: 0, totalQtd: 0 }

                cols.forEach(col => {
                    const items = data.filter(d => normalize(d[reportConfig.rowGroup]) === rowKey && d[colKey] === col)

                    const val = items.reduce((sum, item) => sum + (parseFloat(item.valor || 0)), 0)
                    const qtd = items.reduce((sum, item) => sum + (parseInt(item.qtd || 0)), 0)

                    rowData[`${col}_valor`] = val
                    rowData[`${col}_qtd`] = qtd

                    rowData.totalValor += val
                    rowData.totalQtd += qtd
                })

                return rowData
            })

            rows.sort((a, b) => {
                // For products, sort by quantity; for others by valor
                if (reportType === 'produtos') {
                    return b.totalQtd - a.totalQtd
                }
                return b.totalValor - a.totalValor
            })
        }

        return { columns: cols, rows }
    }, [data, reportConfig, reportType, comparativeMode])

    // --- Helpers ---
    const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    const formatNumber = (val) => new Intl.NumberFormat('pt-BR').format(val || 0)

    //Helper for Select Item
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
        if (!pivotData.rows.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        // 1. Construct Header Row (Simple Month/Year as requested)
        const headerRow = [reportConfig.rowLabel]
        pivotData.columns.forEach(col => {
            if (viewMode === 'valor_qtd') {
                headerRow.push(col, " ") // Push col and empty spacer for merge or visual separation
            } else {
                headerRow.push(col)
            }
        })

        // Add TOTAL header
        if (viewMode === 'valor_qtd') headerRow.push("TOTAL", " ")
        else headerRow.push("TOTAL")

        // 2. Construct SubHeader Row (Only for 'Both' mode to distinguish Val/Qty)
        const useSubHeader = viewMode === 'valor_qtd'
        const subHeaderRow = [""]
        if (useSubHeader) {
            pivotData.columns.forEach(() => subHeaderRow.push("Valor", "Qtd"))
            subHeaderRow.push("Valor Total", "Qtd Total")
        }

        // 3. Construct Data Rows
        const dataRows = pivotData.rows.map(row => {
            const rowArr = [row[reportConfig.rowGroup]] // Client Name

            pivotData.columns.forEach(col => {
                const val = row[`${col}_valor`]
                const qtd = row[`${col}_qtd`]

                if (showValor && showQtd) {
                    rowArr.push(val, qtd)
                } else if (showValor) {
                    rowArr.push(val)
                } else {
                    rowArr.push(qtd)
                }
            })

            // Totals
            if (showValor && showQtd) {
                rowArr.push(row.totalValor, row.totalQtd)
            } else if (showValor) {
                rowArr.push(row.totalValor)
            } else {
                rowArr.push(row.totalQtd)
            }

            return rowArr
        })

        // 4. Assemble Sheet Data
        const sheetData = [headerRow]
        if (useSubHeader) sheetData.push(subHeaderRow)
        sheetData.push(...dataRows)

        // 5. Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(sheetData)

        // 6. Handle Merges for Header in 'Both' mode (Optional polish)
        if (useSubHeader) {
            const merges = []
            // Client Header Merge (Rows 0-1)
            merges.push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } })

            // Month Headers Merge (Horizontal)
            let colIdx = 1
            pivotData.columns.forEach(() => {
                merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } }) // Merge 2 cells for Month
                colIdx += 2
            })
            // Total Header Merge
            merges.push({ s: { r: 0, c: colIdx }, e: { r: 0, c: colIdx + 1 } })

            ws['!merges'] = merges
        }

        // 7. Auto-Expand Columns (Calculate Max Width)
        const colWidths = []
        // Initialize with header lengths
        headerRow.forEach((h, i) => {
            colWidths[i] = h ? String(h).length + 2 : 5
        })

        // Scan data for max length (limit scan to first 50 rows for performance if huge, but here it's fine)
        dataRows.forEach(row => {
            row.forEach((cell, i) => {
                const rawLen = cell ? String(cell).length : 0
                // If number, use slight buffer.
                const finalLen = typeof cell === 'number' ? rawLen + 4 : rawLen
                if (finalLen > (colWidths[i] || 0)) colWidths[i] = finalLen
            })
        })

        // Apply widths (cap at 60 for sanity)
        ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w + 2, 60) }))


        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Dados")
        XLSX.writeFile(wb, `${reportConfig.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado com sucesso!")
    }

    // --- Render ---
    // For products report, force quantity-only mode
    const isProductsReport = reportType === 'produtos'
    const showValor = isProductsReport ? false : (viewMode === "valor" || viewMode === "valor_qtd")
    const showQtd = isProductsReport ? true : (viewMode === "qtd" || viewMode === "valor_qtd")

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header / Filters */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-20">
                <div className="flex flex-col gap-4">
                    {/* Top Row: Title + Date Range + Main Actions */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <TrendingUp className="text-blue-600 w-6 h-6" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Download className="h-5 w-5 text-blue-600" />
                                <h1 className="text-xl font-bold text-gray-800">{reportConfig.title}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold">Relatórios Gerenciais</span>
                                <ClosePageButton />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300">
                                <Download className="w-4 h-4" /> Exportar Excel
                            </Button>
                        </div>
                    </div>

                    {/* Filters Row - MODERN CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">

                        {/* Periodo */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Período</Label>
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-md border border-slate-200 dark:border-slate-600 shadow-sm">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium"
                                />
                                <span className="text-slate-300">→</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="flex h-8 w-full rounded bg-transparent px-2 py-1 text-sm outline-none text-slate-700 font-medium"
                                />
                            </div>
                        </div>

                        {/* Indústria - Show for vendas and produtos (but not vendedor) */}
                        {reportType !== 'vendedor' && (
                            <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5 relative z-30">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indústria <span className="text-red-500">*</span></Label>
                                <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                    <SelectTrigger className={`h-10 bg-white shadow-sm ${!selectedIndustria ? 'border-blue-300 ring-2 ring-blue-100' : ''}`}>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="ALL">Todas as Indústrias</SelectItem>
                                        {industrias.map(ind => (
                                            <SelectItem key={ind.for_codigo} value={String(ind.for_codigo)}>
                                                {renderSelectItem(<Factory className="w-4 h-4" />, ind.for_nomered, `Cód: ${ind.for_codigo}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Vendedor - Hidden for produtos and vendedor uses different layout */}
                        {reportType !== 'produtos' && (
                            <div className={`col-span-12 ${reportType === 'vendedor' ? 'md:col-span-6' : 'md:col-span-2'} flex flex-col gap-1.5 relative z-20`}>
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {reportType === 'vendedor' ? 'Vendedor (Obrigatório)' : 'Vendedor'}
                                    {reportType === 'vendedor' && <span className="text-red-500 ml-1">*</span>}
                                </Label>
                                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                                    <SelectTrigger className={`h-10 bg-white shadow-sm ${reportType === 'vendedor' && !selectedVendedor ? 'border-red-300 ring-2 ring-red-100' : ''}`}>
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reportType !== 'vendedor' && <SelectItem value="ALL">Todos</SelectItem>}
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
                        )}

                        {/* Cliente - Show for vendas and produtos */}
                        {(reportType === 'vendas' || reportType === 'produtos') && (
                            <div className="col-span-12 md:col-span-2 flex flex-col gap-1.5 relative z-10">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</Label>
                                <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                                    <SelectTrigger className="h-10 bg-white shadow-sm">
                                        <SelectValue placeholder="Todos" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[300px]">
                                        <SelectItem value="ALL">Todos</SelectItem>
                                        {clientes.map(c => (
                                            <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                                {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred || c.cli_nome || `Cliente ${c.cli_codigo}`, `Cód: ${c.cli_codigo}`)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Controls - Right Side */}
                        <div className="col-span-12 md:col-span-2 flex items-start gap-4">
                            {/* Checkboxes Column - Stacked */}
                            <div className="flex flex-col gap-1">
                                {/* Checkbox Rede - Show for vendas and produtos */}
                                {(reportType === 'vendas' || reportType === 'produtos') && (
                                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => {
                                        const newValue = !considerarGrupo;
                                        setConsiderarGrupo(newValue);
                                        if (newValue) toast.info("Atenção: Apenas clientes com Rede de Lojas definida serão exibidos.");
                                    }}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${considerarGrupo ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}>
                                            {considerarGrupo && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-xs font-medium text-green-600">Expandir p/ Rede</span>
                                    </label>
                                )}

                                {/* Checkbox Comparative - Only for vendas */}
                                {reportType === 'vendas' && (
                                    <label className="flex items-center gap-2 cursor-pointer group" onClick={() => setComparativeMode(!comparativeMode)}>
                                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${comparativeMode ? 'bg-green-500 border-green-500' : 'border-slate-300 group-hover:border-green-400'}`}>
                                            {comparativeMode && <CheckCircle2 className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="text-xs font-medium text-green-600">Comparar Anos</span>
                                    </label>
                                )}
                            </div>

                            {/* View Mode Toggle - Hidden for produtos (only qty) */}
                            {reportType !== 'produtos' && (
                                <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                                    {["valor_qtd", "valor", "qtd"].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setViewMode(mode)}
                                            className={`text-[10px] font-bold uppercase py-1.5 px-3 rounded-sm transition-all ${viewMode === mode
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "text-slate-400 hover:text-slate-600"
                                                }`}
                                        >
                                            {mode === "valor_qtd" ? "Ambos" : mode === "valor" ? "VALOR" : "QTD"}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg relative overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-3">
                                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-slate-500 animate-pulse">Carregando dados...</span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50">
                                <div className="bg-slate-100 p-4 rounded-full mb-3">
                                    <Filter className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="font-medium text-slate-500">Nenhum resultado para exibir</p>
                                {reportType === 'vendas' && !selectedIndustria && (
                                    <p className="text-sm text-blue-500 mt-2 bg-blue-50 px-3 py-1 rounded-full animate-bounce">
                                        ☝️ Selecione uma indústria acima
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="relative w-full h-full overflow-auto">
                                <table className="w-full caption-bottom text-sm min-w-max">
                                    <TableHeader className="bg-slate-50 z-10 sticky top-0 shadow-sm">
                                        {/* Row 1: Months / Periods */}
                                        <TableRow className="border-b border-slate-200 hover:bg-transparent">
                                            <TableHead rowSpan={2} className="min-w-[200px] border-r border-slate-200 bg-slate-100 font-bold text-slate-700 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                {reportConfig.rowLabel}
                                            </TableHead>
                                            {pivotData.columns.map(col => (
                                                <TableHead
                                                    key={col}
                                                    colSpan={viewMode === 'valor_qtd' ? 2 : 1}
                                                    className="text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-50/80 text-xs"
                                                >
                                                    {col}
                                                </TableHead>
                                            ))}
                                            <TableHead
                                                colSpan={viewMode === 'valor_qtd' ? 2 : 1}
                                                className="text-center font-bold text-emerald-800 bg-emerald-50 border-l border-emerald-100"
                                            >
                                                TOTAL
                                            </TableHead>
                                        </TableRow>

                                        {/* Row 2: Sub-columns (Val / Qty) */}
                                        <TableRow className="hover:bg-transparent border-b border-slate-200">
                                            {pivotData.columns.map(col => (
                                                <>
                                                    {showValor && (
                                                        <TableHead key={`${col}-v`} className="text-right h-7 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-r border-slate-200 min-w-[100px]">
                                                            Valor (R$)
                                                        </TableHead>
                                                    )}
                                                    {showQtd && (
                                                        <TableHead key={`${col}-q`} className="text-right h-7 py-1 text-[10px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50 border-r border-slate-200 min-w-[80px]">
                                                            Qtd
                                                        </TableHead>
                                                    )}
                                                </>
                                            ))}
                                            {/* Total Sub-columns */}
                                            {showValor && (
                                                <TableHead className="text-right h-8 py-2 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border-r border-emerald-100 min-w-[100px]">
                                                    Valor Total
                                                </TableHead>
                                            )}
                                            {showQtd && (
                                                <TableHead className="text-right h-8 py-2 text-[10px] uppercase tracking-wider font-bold text-emerald-700 bg-emerald-50 border-r border-emerald-100 min-w-[80px]">
                                                    Qtd Total
                                                </TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {pivotData.rows.map((row, idx) => (
                                            <TableRow key={idx} className="hover:bg-blue-50/30 transition-colors border-b border-slate-100 group">
                                                <TableCell className="font-medium text-slate-700 border-r border-slate-200 bg-white group-hover:bg-blue-50/30 sticky left-0 z-10 truncate max-w-[200px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] text-xs py-1">
                                                    {row[reportConfig.rowGroup]}
                                                </TableCell>

                                                {pivotData.columns.map(col => (
                                                    <>
                                                        {showValor && (
                                                            <TableCell key={`${col}-v`} className="text-right text-slate-600 border-r border-slate-100 font-numeric tabular-nums text-xs py-1">
                                                                {formatCurrency(row[`${col}_valor`])}
                                                            </TableCell>
                                                        )}
                                                        {showQtd && (
                                                            <TableCell key={`${col}-q`} className="text-right text-slate-500 border-r border-slate-100 font-numeric tabular-nums text-xs py-1">
                                                                {formatNumber(row[`${col}_qtd`])}
                                                            </TableCell>
                                                        )}
                                                    </>
                                                ))}

                                                {/* Totals */}
                                                {showValor && (
                                                    <TableCell className="text-right font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100 text-xs py-1 shadow-inner">
                                                        {formatCurrency(row.totalValor)}
                                                    </TableCell>
                                                )}
                                                {showQtd && (
                                                    <TableCell className="text-right font-bold text-emerald-700 bg-emerald-50/30 border-r border-emerald-100 text-xs py-1 shadow-inner">
                                                        {formatNumber(row.totalQtd)}
                                                    </TableCell>
                                                )}
                                            </TableRow>
                                        ))}

                                        {/* Footer / Grand Totals */}
                                        <TableRow className="bg-slate-100 font-bold sticky bottom-0 z-20 shadow-inner border-t border-slate-300">
                                            <TableCell className="border-r border-slate-300 sticky left-0 bg-slate-100 z-30 text-slate-800 uppercase text-xs tracking-wider">TOTAIS GERAIS</TableCell>
                                            {pivotData.columns.map(col => {
                                                const colTotalVal = pivotData.rows.reduce((sum, r) => sum + (r[`${col}_valor`] || 0), 0)
                                                const colTotalQtd = pivotData.rows.reduce((sum, r) => sum + (r[`${col}_qtd`] || 0), 0)
                                                return (
                                                    <>
                                                        {showValor && (
                                                            <TableCell key={`${col}-v`} className="text-right text-slate-800 border-r border-slate-300 text-xs bg-slate-100">
                                                                {formatCurrency(colTotalVal)}
                                                            </TableCell>
                                                        )}
                                                        {showQtd && (
                                                            <TableCell key={`${col}-q`} className="text-right text-slate-800 border-r border-slate-300 text-xs bg-slate-100">
                                                                {formatNumber(colTotalQtd)}
                                                            </TableCell>
                                                        )}
                                                    </>
                                                )
                                            })}
                                            {/* Grand Total */}
                                            {showValor && (
                                                <TableCell className="text-right text-emerald-900 border-r border-slate-300 bg-emerald-200/50 text-xs">
                                                    {formatCurrency(pivotData.rows.reduce((sum, r) => sum + r.totalValor, 0))}
                                                </TableCell>
                                            )}
                                            {showQtd && (
                                                <TableCell className="text-right text-emerald-900 border-r border-slate-300 bg-emerald-200/50 text-xs">
                                                    {formatNumber(pivotData.rows.reduce((sum, r) => sum + r.totalQtd, 0))}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    </TableBody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
