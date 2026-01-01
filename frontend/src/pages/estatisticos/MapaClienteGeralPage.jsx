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
        <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 p-4 shadow-sm z-20">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-50 p-2 rounded-lg">
                                <BarChart3 className="text-orange-600 w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-gray-800">Mapa Cliente/Geral</h1>
                                <span className="text-xs text-slate-400 font-mono">Performance vs Mercado</span>
                            </div>
                            <div className="ml-4 flex items-center gap-2">
                                <ClosePageButton />
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleExportExcel} className="gap-2 border-slate-200 text-slate-600">
                            <DownloadIcon className="w-4 h-4" /> Exportar Excel
                        </Button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-sm">

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

                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Cliente <span className="text-red-500">*</span></Label>
                            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={String(c.cli_codigo)}>
                                            {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred, `Cod: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-12 md:col-span-3 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Período</Label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs" />
                                <span className="text-slate-400">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs" />
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-3 flex items-center justify-between gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="group" checked={considerarGrupo} onCheckedChange={setConsiderarGrupo} />
                                <Label htmlFor="group" className="text-sm font-medium leading-none cursor-pointer">Considerar grupo de lojas</Label>
                            </div>
                            <Button onClick={handleProcess} disabled={loading} className="bg-orange-600 hover:bg-orange-700 text-white min-w-[100px]">
                                {loading ? 'Carregando...' : 'Processar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-slate-50/50">
                <Card className="h-full flex flex-col border-slate-200 shadow-lg overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {!data.length && !loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-slate-400">
                                <BarChart3 className="w-12 h-12 opacity-20" />
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
                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-600 text-right bg-blue-900/50 group select-none block" style={{ width: colWidths.cliente, height: 30 }}>
                                            Cliente
                                            <Resizer colKey="cliente" />
                                        </TableHead>
                                        <TableHead className="relative text-white font-bold text-xs py-1 px-2 border-r border-slate-600 text-right bg-green-900/50 group select-none block" style={{ width: colWidths.geral, height: 30 }}>
                                            Geral
                                            <Resizer colKey="geral" />
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
                                            <TableCell className="py-1 px-2 text-xs text-right font-medium text-blue-700 border-r border-slate-200 bg-blue-50/30 truncate block" style={{ width: colWidths.cliente }}>
                                                {formatNumber(row.qtd_cliente)}
                                            </TableCell>
                                            <TableCell className={`py-1 px-2 text-xs text-right font-medium text-green-700 border-r border-slate-200 bg-green-50/30 truncate block ${Number(row.qtd_geral) > Number(row.qtd_cliente) ? 'font-bold' : ''}`} style={{ width: colWidths.geral }}>
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
