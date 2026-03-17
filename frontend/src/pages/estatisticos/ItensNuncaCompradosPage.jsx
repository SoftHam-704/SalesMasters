import { useState, useEffect, useMemo } from "react"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Download, Factory, User, ShoppingBag, XCircle } from "lucide-react"
import ClosePageButton from '../../components/common/ClosePageButton';
import * as XLSX from 'xlsx'
import { toast } from "sonner"

export default function ItensNuncaCompradosPage({ isSubComponent = false }) {
    const [selectedIndustria, setSelectedIndustria] = useState("")
    const [selectedCliente, setSelectedCliente] = useState("")

    // Data
    const [industrias, setIndustrias] = useState([])
    const [clientes, setClientes] = useState([])
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(false)

    // Load Dropdowns
    useEffect(() => {
        const loadAux = async () => {
            try {
                // Carregar Indústrias
                const indRes = await axios.get('/suppliers')
                setIndustrias(indRes.data.data || [])

                // Carregar Clientes
                const cliRes = await axios.get('/aux/clientes')
                setClientes(cliRes.data.data || [])
            } catch (error) {
                console.error('Erro ao carregar filtros:', error)
                toast.error("Erro ao carregar opções de filtro")
            }
        }
        loadAux()
    }, [])

    // Load Data
    useEffect(() => {
        if (!selectedIndustria || !selectedCliente || selectedCliente === 'ALL') /* Client is mandatory here per user screenshot context */ {
            setData([])
            return
        }

        const fetchData = async () => {
            setLoading(true)
            try {
                const res = await axios.get('/reports/itens-nunca-comprados', {
                    params: { industria: selectedIndustria, cliente: selectedCliente }
                })
                if (res.data.success) {
                    setData(res.data.data || [])
                }
            } catch (error) {
                console.error('Erro ao buscar dados:', error)
                toast.error("Erro ao carregar relatório")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [selectedIndustria, selectedCliente])

    // Export Excel
    const handleExportExcel = () => {
        if (!data.length) {
            toast.warning("Sem dados para exportar")
            return
        }

        const headers = ['CÓDIGO', 'DESCRIÇÃO', 'APLICAÇÃO']
        const rows = data.map(row => [row.codigo, row.descricao, row.aplicacao])

        const ws = XLSX.utils.aoa_to_sheet([headers, ...rows])
        ws['!cols'] = [{ wch: 15 }, { wch: 50 }, { wch: 30 }]
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Itens Nunca Comprados")
        XLSX.writeFile(wb, `Itens_Nunca_Comprados_${new Date().toISOString().split('T')[0]}.xlsx`)
        toast.success("Relatório exportado com sucesso!")
    }

    // Helper Render Select Item (Standard)
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

    return (
        <div className="h-full flex flex-col bg-stone-50 overflow-hidden font-sans">
            {/* Header / Filters */}
            <div className="bg-white border-b border-stone-200 p-4 shadow-sm z-20 shrink-0">
                <div className="flex flex-col gap-4">
                    {/* Top Row */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            {!isSubComponent && (
                                <>
                                    <h1 className="text-xl font-bold tracking-tight text-stone-900">Itens Nunca Comprados</h1>
                                </>
                            )}
                            <div className="flex items-center gap-2">
                                {!isSubComponent && <ClosePageButton />}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleExportExcel} className="h-[38px] px-4 bg-emerald-600 hover:bg-emerald-700 !text-white rounded-lg font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-colors shadow-sm">
                                <Download className="w-4 h-4 !text-white" /> <span className="!text-white">Exportar Excel</span>
                            </button>
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Cliente */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] relative z-20">
                            <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Cliente <span className="text-red-500">*</span></Label>
                            <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                                <SelectTrigger className={`h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm ${!selectedCliente ? 'border-red-300 ring-1 ring-red-100' : ''}`}>
                                    <SelectValue placeholder="Selecione um cliente..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {clientes.map(c => (
                                        <SelectItem key={c.cli_codigo} value={c.cli_codigo.toString()}>
                                            {renderSelectItem(<User className="w-4 h-4" />, c.cli_nomred, `Cód: ${c.cli_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Indústria */}
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[200px] relative z-30">
                            <Label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Indústria <span className="text-red-500">*</span></Label>
                            <Select value={selectedIndustria} onValueChange={setSelectedIndustria}>
                                <SelectTrigger className={`h-[38px] bg-stone-50 border-stone-200 text-stone-700 shadow-sm ${!selectedIndustria ? 'border-red-300 ring-1 ring-red-100' : ''}`}>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {industrias.map(i => (
                                        <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>
                                            {renderSelectItem(<Factory className="w-4 h-4" />, i.for_nomered, `Cód: ${i.for_codigo}`)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto p-4 bg-stone-50">
                <Card className="h-full flex flex-col border-stone-200 shadow-sm relative overflow-hidden">
                    <CardContent className="p-0 overflow-auto flex-1">
                        {loading ? (
                            <div className="flex flex-col justify-center items-center h-full gap-3">
                                <div className="w-10 h-10 border-4 border-stone-400 border-t-stone-900 rounded-full animate-spin"></div>
                                <span className="text-sm font-medium text-stone-500 animate-pulse">Carregando dados...</span>
                            </div>
                        ) : !selectedCliente || !selectedIndustria ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-stone-400">
                                <span className="text-4xl">🔍</span>
                                <span className="text-sm">Selecione Cliente e Indústria para ver os itens</span>
                            </div>
                        ) : data.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-full gap-2 text-stone-400">
                                <span className="text-4xl">✅</span>
                                <span className="text-sm">Este cliente já comprou todos os itens desta indústria, ou não há itens ativos.</span>
                            </div>
                        ) : (
                            <div className="overflow-auto h-full w-full">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10">
                                        <TableRow className="bg-stone-100 hover:bg-stone-100 border-b border-stone-200">
                                            <TableHead className="text-stone-700 font-bold text-xs py-1.5 px-3 border-r border-stone-200 w-[100px] uppercase tracking-wider">CÓDIGO</TableHead>
                                            <TableHead className="text-stone-700 font-bold text-xs py-1.5 px-3 border-r border-stone-200 uppercase tracking-wider">DESCRIÇÃO</TableHead>
                                            <TableHead className="text-stone-700 font-bold text-xs py-1.5 px-3 border-r border-stone-200 uppercase tracking-wider">APLICAÇÃO</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {data.map((row, rowIdx) => (
                                            <TableRow key={rowIdx} className="hover:bg-stone-50 border-b border-stone-100 h-7 text-xs">
                                                <TableCell className="py-1.5 px-3 border-r border-stone-100 font-mono font-semibold text-stone-700">{row.codigo}</TableCell>
                                                <TableCell className="py-1.5 px-3 border-r border-stone-100 text-stone-700">{row.descricao}</TableCell>
                                                <TableCell className="py-1.5 px-3 border-r border-stone-100 text-stone-500">{row.aplicacao}</TableCell>
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
