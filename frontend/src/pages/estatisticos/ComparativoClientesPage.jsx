import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User, ArrowRightLeft, Calendar as CalendarIcon, XCircle } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatCurrency, formatNumber } from "@/utils/formatters"

export default function ComparativoClientesPage() {
    // Filters
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [clienteRef, setClienteRef] = useState("")
    const [clienteAlvo, setClienteAlvo] = useState("")

    // Dates (Default: First day of current year to today)
    const today = new Date().toISOString().split('T')[0]
    const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(today)

    // Mode: 'GAP' (Default) or 'FULL'
    const [mode, setMode] = useState("GAP")

    // Data
    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // Load Dropdowns
    useEffect(() => {
        const loadAux = async () => {
            try {
                const indRes = await axios.get('/suppliers')
                setIndustrias(indRes.data.data || [])

                const cliRes = await axios.get('/aux/clientes')
                setClientes(cliRes.data.data || [])
            } catch (error) {
                console.error('Erro ao carregar filtros:', error)
                toast.error("Erro ao carregar opções")
            }
        }
        loadAux()
    }, [])

    // Fetch Data
    const handleProcess = async () => {
        if (!selectedIndustria || !clienteRef || !clienteAlvo || !startDate || !endDate) {
            toast.warning("Preencha todos os campos obrigatórios")
            return
        }

        if (clienteRef === clienteAlvo) {
            toast.warning("Selecione clientes diferentes para comparar")
            return
        }

        setLoading(true)
        try {
            const res = await axios.get('/reports/comparativo-clientes', {
                params: {
                    industria: selectedIndustria,
                    clienteRef,
                    clienteAlvo,
                    dataInicial: startDate,
                    dataFinal: endDate,
                    modo: mode
                }
            })
            if (res.data.success) {
                setData(res.data.data || [])
                if (res.data.data.length === 0) {
                    toast.info("Nenhum registro encontrado para estes filtros")
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
            toast.error("Erro ao processar comparativo")
        } finally {
            setLoading(false)
        }
    }

    // Export Excel
    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        const headers = ['CÓDIGO', 'DESCRIÇÃO', 'QTD REF', 'VALOR REF', 'QTD ALVO', 'VALOR ALVO']
        const rows = data.map(row => [
            row.codigo,
            row.descricao,
            Number(row.qtd_ref),
            Number(row.valor_ref),
            Number(row.qtd_alvo),
            Number(row.valor_alvo)
        ])

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        ws['!cols'] = [{ wch: 10 }, { wch: 45 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Comparativo")
        XLSX.writeFile(wb, `Comparativo_Clientes_${today}.xlsx`)
        toast.success("Exportado com sucesso!")
    }

    // Render Helpers
    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-md text-slate-500 dark:text-slate-400">
                {icon}
            </div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{subtitle}</span>
            </div>
        </div>
    )

    // Column Resizing
    const [colWidths, setColWidths] = useState({
        codigo: 80,
        descricao: 300,
        qtd_ref: 100,
        qtd_alvo: 100
    })
    const [resizing, setResizing] = useState(null) // { key: 'codigo', startX: 100, startWidth: 80 }

    const handleMouseDown = (e, key) => {
        e.preventDefault()
        setResizing({
            key,
            startX: e.pageX,
            startWidth: colWidths[key]
        })
    }

    useEffect(() => {
        if (!resizing) return

        const handleMouseMove = (e) => {
            const diff = e.pageX - resizing.startX
            const newWidth = Math.max(50, resizing.startWidth + diff) // Min width 50px
            setColWidths(prev => ({ ...prev, [resizing.key]: newWidth }))
        }

        const handleMouseUp = () => {
            setResizing(null)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizing])

    const handleDoubleClick = (colKey) => {
        // Auto-size: measure content and set optimal width
        const minWidth = colKey === 'codigo' ? 80 : colKey === 'descricao' ? 200 : 100
        const maxWidth = colKey === 'codigo' ? 120 : colKey === 'descricao' ? 500 : 150

        // Simple heuristic: set to a reasonable default based on column type
        const optimalWidth = colKey === 'codigo' ? 100 : colKey === 'descricao' ? 350 : 120
        setColWidths(prev => ({ ...prev, [colKey]: optimalWidth }))
    }

    const Resizer = ({ colKey }) => (
        <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-slate-400/0 hover:bg-blue-400 group-hover:bg-slate-400/50 transition-colors z-20"
            onMouseDown={(e) => handleMouseDown(e, colKey)}
            onDoubleClick={() => handleDoubleClick(colKey)}
            title="Arraste para redimensionar | Duplo-clique para auto-ajustar"
        />
    )

    const totalWidth = Object.values(colWidths).reduce((acc, w) => acc + w, 0)

    return (
        <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-20">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-50 p-2 rounded-lg">
                                <ArrowRightLeft className="text-blue-600 w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-gray-800">Comparativo entre Clientes</h1>
                                <span className="text-xs text-slate-400 font-mono">Referência vs Alvo</span>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                                <ClosePageButton />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-slate-200 text-slate-600">
                                <Download className="w-4 h-4" /> Exportar Excel
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-sm">

                        {/* Indústria */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Indústria <span className="text-red-500">*</span></Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={String(i.for_codigo)}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cod: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cliente Referência */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Cliente Referência <span className="text-red-500">*</span></Label>
                            <Select value={clienteRef} onValueChange={setClienteRef}>
                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Referência..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                            {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred, `Cod: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Cliente Alvo */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Cliente Alvo <span className="text-red-500">*</span></Label>
                            <Select value={clienteAlvo} onValueChange={setClienteAlvo}>
                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Alvo..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                            {renderSelectItem(<User className="w-4 h-4 text-red-500" />, c.cli_nomred, `Cod: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Período */}
                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Período</Label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                                    className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs" />
                                <span className="text-slate-400">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs" />
                            </div>
                        </div>

                        {/* Mode Selection & Process Button */}
                        <div className="col-span-12 flex items-center justify-between mt-2 pt-2 border-t border-slate-100">

                            <div className="flex items-center gap-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="mode" className="accent-blue-600"
                                        checked={mode === 'GAP'} onChange={() => setMode('GAP')} />
                                    <span className="text-sm text-slate-700">Referência comprou e alvo não</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="mode" className="accent-blue-600"
                                        checked={mode === 'FULL'} onChange={() => setMode('FULL')} />
                                    <span className="text-sm text-slate-700">Comparativo entre ambos</span>
                                </label>
                            </div>

                            <Button onClick={handleProcess} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]">
                                {loading ? 'Processando...' : 'Processar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area - COMPACT STYLE & RESIZABLE */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {!data.length && !loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-slate-400">
                                <span className="text-4xl">📊</span>
                                <span className="text-sm">Configure os filtros e clique em Processar</span>
                            </div>
                        ) : (
                            <Table className="table-fixed border-collapse" style={{ width: totalWidth }}>
                                <TableHeader className="sticky top-0 z-10 bg-slate-700 shadow-sm block w-full" style={{ width: totalWidth }}>
                                    <TableRow className="bg-slate-700 hover:bg-slate-700 flex w-full">

                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-500 bg-slate-800 group select-none block" style={{ width: colWidths.codigo, height: 30 }}>
                                            Código
                                            <Resizer colKey="codigo" />
                                        </TableHead>

                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-600 group select-none block" style={{ width: colWidths.descricao, height: 30 }}>
                                            Descrição
                                            <Resizer colKey="descricao" />
                                        </TableHead>

                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-600 text-right bg-blue-900/50 group select-none block" style={{ width: colWidths.qtd_ref, height: 30 }}>
                                            Ref (Qtd)
                                            <Resizer colKey="qtd_ref" />
                                        </TableHead>

                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-600 text-right bg-red-900/50 group select-none block" style={{ width: colWidths.qtd_alvo, height: 30 }}>
                                            Alvo (Qtd)
                                            <Resizer colKey="qtd_alvo" />
                                        </TableHead>

                                    </TableRow>
                                </TableHeader>
                                <TableBody className="block w-full" style={{ width: totalWidth }}>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-blue-50/50 border-b border-slate-100 flex w-full h-[28px] group/row">
                                            <TableCell className="py-1 px-2 text-xs font-mono font-bold text-slate-800 border-r border-slate-300 bg-slate-100 truncate block" style={{ width: colWidths.codigo }}>
                                                {row.codigo}
                                            </TableCell>

                                            <TableCell className="py-1 px-2 text-xs text-slate-700 border-r border-slate-200 truncate block" style={{ width: colWidths.descricao }} title={row.descricao}>
                                                {row.descricao}
                                            </TableCell>

                                            {/* Referência */}
                                            <TableCell className="py-1 px-2 text-xs text-right font-medium text-slate-700 border-r border-slate-200 bg-blue-50/30 truncate block" style={{ width: colWidths.qtd_ref }}>
                                                {formatNumber(row.qtd_ref)}
                                            </TableCell>

                                            {/* Alvo */}
                                            <TableCell className={`py-1 px-2 text-xs text-right font-medium border-r border-slate-200 bg-red-50/30 truncate block ${Number(row.qtd_alvo) === 0 ? 'text-red-300' : 'text-slate-700'}`} style={{ width: colWidths.qtd_alvo }}>
                                                {formatNumber(row.qtd_alvo)}
                                            </TableCell>
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
