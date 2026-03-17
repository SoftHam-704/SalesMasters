import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Download, Factory, User, BarChart3, Download as DownloadIcon, XCircle } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatNumber } from "@/utils/formatters"

export default function MapaClienteGeralPage() {
    // Filters
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("")
    const [considerarGrupo, setConsiderarGrupo] = useState(false)

    // Dates
    const today = new Date().toISOString().split('T')[0]
    const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(today)

    // Data
    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // Column Resizing
    const [colWidths, setColWidths] = useState({
        codigo: 90,
        descricao: 350,
        cliente: 120,
        geral: 120
    })
    const [resizing, setResizing] = useState(null)

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

    const handleProcess = async () => {
        if (!selectedIndustria || !selectedCliente || !startDate || !endDate) {
            toast.warning("Preencha todos os campos obrigatórios")
            return
        }

        setLoading(true)
        try {
            const res = await axios.get('/reports/mapa-cliente-geral', {
                params: {
                    industria: selectedIndustria,
                    cliente: selectedCliente,
                    dataInicial: startDate,
                    dataFinal: endDate,
                    grupo: considerarGrupo
                }
            })
            if (res.data.success) {
                setData(res.data.data || [])
                if (res.data.data.length === 0) {
                    toast.info("Nenhum registro encontrado")
                }
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error)
            toast.error("Erro ao processar mapa")
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }
        const headers = ['CÓDIGO', 'DESCRIÇÃO', 'CLIENTE', 'GERAL']
        const rows = data.map(row => [row.codigo, row.descricao, Number(row.qtd_cliente), Number(row.qtd_geral)])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Mapa_Cliente_Geral")
        XLSX.writeFile(wb, `Mapa_Cliente_Geral_${today}.xlsx`)
        toast.success("Exportado com sucesso!")
    }

    // Resize Logic
    const handleMouseDown = (e, key) => {
        e.preventDefault()
        setResizing({ key, startX: e.pageX, startWidth: colWidths[key] })
    }

    const handleDoubleClick = (colKey) => {
        const optimalWidth = colKey === 'codigo' ? 100 : colKey === 'descricao' ? 400 : 120
        setColWidths(prev => ({ ...prev, [colKey]: optimalWidth }))
    }

    useEffect(() => {
        if (!resizing) return
        const handleMouseMove = (e) => {
            const diff = e.pageX - resizing.startX
            setColWidths(prev => ({ ...prev, [resizing.key]: Math.max(50, resizing.startWidth + diff) }))
        }
        const handleMouseUp = () => setResizing(null)
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }
    }, [resizing])

    const totalWidth = Object.values(colWidths).reduce((acc, w) => acc + w, 0)

    const Resizer = ({ colKey }) => (
        <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-slate-400/0 hover:bg-blue-400 group-hover:bg-slate-400/50 transition-colors z-20"
            onMouseDown={(e) => handleMouseDown(e, colKey)}
            onDoubleClick={() => handleDoubleClick(colKey)}
            title="Arraste para redimensionar | Duplo-clique para auto-ajustar"
        />
    )

    const renderSelectItem = (icon, title, subtitle) => (
        <div className="flex items-start gap-3 py-1">
            <div className="mt-0.5 bg-slate-100 p-1.5 rounded-md text-slate-500">{icon}</div>
            <div className="flex flex-col text-left">
                <span className="text-sm font-medium text-slate-700">{title}</span>
                <span className="text-xs text-slate-500 font-mono">{subtitle}</span>
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
                            <h1 className="text-xl font-bold tracking-tight text-stone-900">Mapa Cliente/Geral</h1>
                            <div className="ml-4 flex items-center gap-2">
                                <ClosePageButton />
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

                    {/* Filters */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Indústria <span className="text-red-500">*</span></label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={String(i.for_codigo)}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cod: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Cliente <span className="text-red-500">*</span></label>
                            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                                <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                            {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred, `Cod: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Período</label>
                            <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg border border-stone-200 shadow-sm">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 w-full rounded bg-transparent px-2 text-xs outline-none text-stone-700" />
                                <span className="text-stone-300 font-bold">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 w-full rounded bg-transparent px-2 text-xs outline-none text-stone-700" />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 h-[38px] px-3 border border-stone-200 bg-stone-50 rounded-lg shadow-sm">
                            <Checkbox id="group" checked={considerarGrupo} onCheckedChange={setConsiderarGrupo} />
                            <label htmlFor="group" className="text-xs font-bold uppercase tracking-wide text-stone-600 cursor-pointer whitespace-nowrap">Considerar grupo</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-stone-50">
                <Card className="h-full flex flex-col border-stone-200 shadow-sm overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {!data.length && !loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-stone-400">
                                <BarChart3 className="w-12 h-12 opacity-20" />
                                <span className="text-sm">Configure os filtros e clique em Processar</span>
                            </div>
                        ) : (
                            <Table className="table-fixed border-collapse" style={{ width: totalWidth }}>
                                <TableHeader className="sticky top-0 z-10 bg-stone-800 shadow-sm block w-full" style={{ width: totalWidth }}>
                                    <TableRow className="bg-stone-800 hover:bg-stone-800 flex w-full">
                                        <TableHead className="relative text-stone-100 font-bold text-xs uppercase tracking-wider py-1.5 px-2 border-r border-stone-600 bg-stone-900 group select-none block" style={{ width: colWidths.codigo, height: 30 }}>
                                            Código
                                            <Resizer colKey="codigo" />
                                        </TableHead>
                                        <TableHead className="relative text-stone-100 font-bold text-xs uppercase tracking-wider py-1.5 px-2 border-r border-stone-700 group select-none block" style={{ width: colWidths.descricao, height: 30 }}>
                                            Descrição
                                            <Resizer colKey="descricao" />
                                        </TableHead>
                                        <TableHead className="relative text-stone-100 font-bold text-xs uppercase tracking-wider py-1.5 px-2 border-r border-stone-700 text-right bg-stone-800 group select-none block" style={{ width: colWidths.cliente, height: 30 }}>
                                            Cliente
                                            <Resizer colKey="cliente" />
                                        </TableHead>
                                        <TableHead className="relative text-stone-100 font-bold text-xs uppercase tracking-wider py-1.5 px-2 border-r border-stone-700 text-right bg-stone-800 group select-none block" style={{ width: colWidths.geral, height: 30 }}>
                                            Geral
                                            <Resizer colKey="geral" />
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="block w-full" style={{ width: totalWidth }}>
                                    {data.map((row, idx) => (
                                        <TableRow key={idx} className="hover:bg-stone-50 border-b border-stone-100 flex w-full h-[28px] group/row">
                                            <TableCell className="py-1 px-2 text-xs font-mono font-semibold text-stone-700 border-r border-stone-200 bg-stone-100 truncate block" style={{ width: colWidths.codigo }}>
                                                {row.codigo}
                                            </TableCell>
                                            <TableCell className="py-1 px-2 text-xs text-stone-700 border-r border-stone-100 truncate block" style={{ width: colWidths.descricao }} title={row.descricao}>
                                                {row.descricao}
                                            </TableCell>
                                            <TableCell className="py-1 px-2 text-xs text-right font-medium text-stone-700 border-r border-stone-100 truncate block" style={{ width: colWidths.cliente }}>
                                                {formatNumber(row.qtd_cliente)}
                                            </TableCell>
                                            <TableCell className={`py-1 px-2 text-xs text-right font-medium text-emerald-700 border-r border-stone-100 truncate block ${Number(row.qtd_geral) > Number(row.qtd_cliente) ? 'font-bold' : ''}`} style={{ width: colWidths.geral }}>
                                                {formatNumber(row.qtd_geral)}
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
