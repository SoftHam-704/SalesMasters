import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Download, Factory, BarChart3, Download as DownloadIcon, User, Package, ChevronRight } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatNumber } from "@/utils/formatters"

export default function ProdutosUnicaCompraPage() {
    // Filters
    const [selectedIndustria, setSelectedIndustria] = useState("")

    // Dates
    const today = new Date().toISOString().split('T')[0]
    const firstDay = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(firstDay)
    const [endDate, setEndDate] = useState(today)

    // Data
    const [industrias, setIndustrias] = useState([])
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // Load Dropdowns
    useEffect(() => {
        const loadAux = async () => {
            try {
                const indRes = await axios.get('/suppliers')
                setIndustrias(indRes.data.data || [])
            } catch (error) {
                console.error('Erro ao carregar filtros:', error)
                toast.error("Erro ao carregar indústrias")
            }
        }
        loadAux()
    }, [])

    const handleProcess = async () => {
        if (!selectedIndustria || !startDate || !endDate) {
            toast.warning("Preencha todos os campos obrigatórios")
            return
        }

        setLoading(true)
        try {
            const res = await axios.get('/reports/produtos-unica-compra', {
                params: {
                    industria: selectedIndustria,
                    dataInicial: startDate,
                    dataFinal: endDate
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
            toast.error("Erro ao processar relatório")
        } finally {
            setLoading(false)
        }
    }

    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }
        const headers = ['CLIENTE', 'CÓDIGO', 'PRODUTO', 'QUANT.']
        const rows = data.map(row => [
            row.cliente_nome,
            row.produto_codigo,
            row.produto_desc,
            Number(row.quantidade)
        ])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Unica_Compra")
        XLSX.writeFile(wb, `Produtos_Unica_Compra_${today}.xlsx`)
        toast.success("Exportado com sucesso!")
    }

    // Grouping by client
    const groupedData = data.reduce((acc, curr) => {
        if (!acc[curr.cliente_nome]) acc[curr.cliente_nome] = []
        acc[curr.cliente_nome].push(curr)
        return acc
    }, {})

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
                            <div className="bg-red-50 p-2 rounded-lg">
                                <Package className="text-red-600 w-6 h-6" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl font-bold text-gray-800">Produtos de Única Compra</h1>
                                <span className="text-xs text-slate-400 font-mono">Itens que o cliente comprou apenas uma vez</span>
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
                        <div className="col-span-12 md:col-span-4 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Período</Label>
                            <div className="flex items-center gap-2">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs bg-white" />
                                <span className="text-slate-400">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-full rounded-md border border-slate-200 px-2 text-xs bg-white" />
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5">
                            <Label className="text-xs font-semibold text-slate-500 uppercase">Indústria <span className="text-red-500">*</span></Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-9 bg-white"><SelectValue placeholder="Selecione a indústria..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={String(i.for_codigo)}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cod: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="col-span-12 md:col-span-3">
                            <Button onClick={handleProcess} disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white">
                                {loading ? 'Carregando...' : 'Processar'}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-slate-50/50">
                {!data.length && !loading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-2 text-slate-400">
                        <Package className="w-12 h-12 opacity-20" />
                        <span className="text-sm italic">Selecione os filtros para identificar oportunidades</span>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-4 pb-8">
                        <Accordion type="multiple" defaultValue={Object.keys(groupedData).slice(0, 5)} className="space-y-3">
                            {Object.entries(groupedData).map(([clientName, items]) => (
                                <AccordionItem key={clientName} value={clientName} className="border border-slate-200 bg-white rounded-lg shadow-sm overflow-hidden">
                                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-slate-50 border-none transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-slate-100 p-1.5 rounded-md text-slate-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="text-sm font-bold text-slate-700 uppercase">Cliente : {clientName}</span>
                                                <span className="text-[10px] text-slate-400 font-medium uppercase">{items.length} item(ns) encontrado(s)</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0 border-t border-slate-100">
                                        <Table>
                                            <TableHeader className="bg-slate-50">
                                                <TableRow>
                                                    <TableHead className="text-[11px] font-bold text-slate-500 py-1 px-4 h-8 uppercase w-[120px]">Código</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-500 py-1 px-4 h-8 uppercase">Produto</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-slate-500 py-1 px-4 h-8 uppercase text-right w-[100px]">Quant.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, idx) => (
                                                    <TableRow key={idx} className="hover:bg-red-50/30 transition-colors">
                                                        <TableCell className="text-xs font-mono font-bold text-slate-800 py-1.5 px-4 h-7 bg-slate-100/50">{item.produto_codigo}</TableCell>
                                                        <TableCell className="text-xs text-slate-700 py-1.5 px-4 h-7">{item.produto_desc}</TableCell>
                                                        <TableCell className="text-xs font-mono font-bold text-right py-1.5 px-4 h-7 text-blue-600">{formatNumber(item.quantidade)}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                )}
            </div>
        </div>
    )
}
