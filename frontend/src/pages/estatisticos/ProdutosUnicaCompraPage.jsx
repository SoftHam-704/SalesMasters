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
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden font-sans">
            {/* Header */}
            <div className="bg-white border-b border-stone-200 p-4 shadow-sm z-20 shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-stone-900">Produtos de Única Compra</h1>
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
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[250px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Período</label>
                            <div className="flex items-center gap-2 bg-stone-50 p-1 rounded-lg border border-stone-200 shadow-sm">
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-8 w-full rounded bg-transparent px-2 text-xs outline-none text-stone-700" />
                                <span className="text-stone-300 font-bold">-</span>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-8 w-full rounded bg-transparent px-2 text-xs outline-none text-stone-700" />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px]">
                            <label className="text-xs font-bold uppercase tracking-wider text-stone-500">Indústria <span className="text-red-500">*</span></label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className="h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm"><SelectValue placeholder="Selecione a indústria..." /></SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={String(i.for_codigo)}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cod: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4 bg-stone-50">
                {!data.length && !loading ? (
                    <div className="flex flex-col justify-center items-center h-full gap-2 text-stone-400">
                        <Package className="w-12 h-12 opacity-20" />
                        <span className="text-sm italic">Selecione os filtros para identificar oportunidades</span>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto space-y-4 pb-8">
                        <Accordion type="multiple" defaultValue={Object.keys(groupedData).slice(0, 5)} className="space-y-3">
                            {Object.entries(groupedData).map(([clientName, items]) => (
                                <AccordionItem key={clientName} value={clientName} className="border border-stone-200 bg-white rounded-xl shadow-sm overflow-hidden">
                                    <AccordionTrigger className="px-4 py-2.5 hover:no-underline hover:bg-stone-50 border-none transition-colors group">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-stone-100 p-1.5 rounded-md text-stone-500 group-hover:bg-stone-200 transition-colors">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="text-sm font-bold text-stone-700 uppercase">Cliente: {clientName}</span>
                                                <span className="text-[10px] text-stone-400 font-medium uppercase">{items.length} item(ns) encontrado(s)</span>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-0 border-t border-stone-100">
                                        <Table>
                                            <TableHeader className="bg-stone-50">
                                                <TableRow>
                                                    <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider w-[120px]">Código</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider">Produto</TableHead>
                                                    <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider text-right w-[100px]">Quant.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, idx) => (
                                                    <TableRow key={idx} className="hover:bg-stone-50 transition-colors border-b border-stone-100">
                                                        <TableCell className="text-xs font-mono font-semibold text-stone-700 py-1.5 px-4 h-7">{item.produto_codigo}</TableCell>
                                                        <TableCell className="text-xs text-stone-700 py-1.5 px-4 h-7">{item.produto_desc}</TableCell>
                                                        <TableCell className="text-xs tabular-nums font-bold text-right py-1.5 px-4 h-7 text-emerald-700">{formatNumber(item.quantidade)}</TableCell>
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
