import { useState, useEffect } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Download, Factory, BarChart3, Download as DownloadIcon, ChevronDown, ChevronRight, Building2 } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"
import { formatCurrency, formatNumber } from "@/utils/formatters"

export default function GrupoLojasPage() {
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
            const res = await axios.get('/reports/grupo-lojas', {
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
        const headers = ['GRUPO', 'CLIENTE', 'PEDIDO', 'DATA', 'QUANT.', 'VALOR']
        const rows = data.map(row => [
            row.grupo,
            row.cliente,
            row.pedido,
            new Date(row.data).toLocaleDateString(),
            Number(row.quant),
            Number(row.total)
        ])
        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Grupo_Lojas")
        XLSX.writeFile(wb, `Faturamento_Grupo_Lojas_${today}.xlsx`)
        toast.success("Exportado com sucesso!")
    }

    // Grouping logic
    const groupedData = data.reduce((acc, curr) => {
        if (!acc[curr.grupo]) acc[curr.grupo] = []
        acc[curr.grupo].push(curr)
        return acc
    }, {})

    const grandTotalValue = data.reduce((sum, item) => sum + Number(item.total), 0)
    const grandTotalQuant = data.reduce((sum, item) => sum + Number(item.quant), 0)

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
                            <h1 className="text-xl font-bold tracking-tight text-stone-900">Faturamento Grupo de Lojas</h1>
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
                        <Building2 className="w-12 h-12 opacity-20" />
                        <span className="text-sm italic">Selecione a indústria e o período para gerar a análise</span>
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto space-y-4">
                        <Accordion type="multiple" defaultValue={Object.keys(groupedData)} className="space-y-4">
                            {Object.entries(groupedData).map(([groupName, items]) => {
                                const groupTotalValue = items.reduce((sum, item) => sum + Number(item.total), 0)
                                const groupTotalQuant = items.reduce((sum, item) => sum + Number(item.quant), 0)

                                return (
                                    <AccordionItem key={groupName} value={groupName} className="border border-stone-200 bg-white rounded-xl shadow-sm overflow-hidden">
                                        <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-stone-50 border-none transition-colors group">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-stone-100 p-1.5 rounded-md text-stone-500 group-hover:bg-stone-200 transition-colors">
                                                        <Building2 className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-bold text-stone-700 uppercase tracking-tight">Grupo: {groupName}</span>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-stone-400 font-medium uppercase">Quant. Total</span>
                                                        <span className="text-sm font-bold text-stone-700 tabular-nums">{formatNumber(groupTotalQuant)}</span>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[10px] text-stone-400 font-medium uppercase">Valor Total</span>
                                                        <span className="text-sm font-bold text-emerald-600 tabular-nums">{formatCurrency(groupTotalValue)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-0 border-t border-stone-100">
                                            <div className="overflow-x-auto">
                                                <Table>
                                                    <TableHeader className="bg-stone-50">
                                                        <TableRow>
                                                            <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider">Cliente</TableHead>
                                                            <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider">Pedido</TableHead>
                                                            <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider">Data</TableHead>
                                                            <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider text-right">Quant.</TableHead>
                                                            <TableHead className="text-[11px] font-bold text-stone-500 py-1.5 px-4 h-8 uppercase tracking-wider text-right">Valor</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {items.map((item, idx) => (
                                                            <TableRow key={idx} className="hover:bg-stone-50 transition-colors border-b border-stone-100">
                                                                <TableCell className="text-xs text-stone-700 py-1.5 px-4 h-7 whitespace-nowrap">{item.cliente}</TableCell>
                                                                <TableCell className="text-xs font-mono font-semibold text-stone-700 py-1.5 px-4 h-7">{item.pedido}</TableCell>
                                                                <TableCell className="text-xs text-stone-500 py-1.5 px-4 h-7">{new Date(item.data).toLocaleDateString()}</TableCell>
                                                                <TableCell className="text-xs tabular-nums text-right py-1.5 px-4 h-7 text-stone-700">{formatNumber(item.quant)}</TableCell>
                                                                <TableCell className="text-xs tabular-nums font-medium text-right py-1.5 px-4 h-7 text-emerald-700">{formatCurrency(item.total)}</TableCell>
                                                            </TableRow>
                                                        ))}
                                                        {/* Subtotal row */}
                                                        <TableRow className="bg-stone-50">
                                                            <TableCell colSpan={3}></TableCell>
                                                            <TableCell className="text-sm font-bold text-stone-700 text-right py-2 px-4 border-t-2 border-stone-200 tabular-nums">{formatNumber(groupTotalQuant)}</TableCell>
                                                            <TableCell className="text-sm font-bold text-emerald-700 text-right py-2 px-4 border-t-2 border-stone-200 tabular-nums">{formatCurrency(groupTotalValue)}</TableCell>
                                                        </TableRow>
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                )
                            })}
                        </Accordion>

                        {/* Grand Total Footer */}
                        <Card className="bg-stone-900 text-white rounded-xl shadow-lg border-none">
                            <CardContent className="p-4 flex justify-between items-center mr-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/10 p-2 rounded-lg">
                                        <BarChart3 className="w-5 h-5 text-stone-300" />
                                    </div>
                                    <span className="text-sm font-bold uppercase tracking-wider text-white">Total Geral Consolidado</span>
                                </div>
                                <div className="flex gap-12">
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-white/60 font-semibold uppercase tracking-widest">Total Quantidade</span>
                                        <span className="text-2xl font-black tabular-nums text-stone-300">{formatNumber(grandTotalQuant)}</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] text-white/60 font-semibold uppercase tracking-widest">Total Faturamento</span>
                                        <span className="text-2xl font-black tabular-nums text-emerald-400">{formatCurrency(grandTotalValue)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}
