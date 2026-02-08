import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
    Plus,
    Upload,
    Pencil,
    Trash2,
    TrendingUp,
    Download,
    FileSpreadsheet,
    Filter,
    ChevronDown,
    BarChart3,
    Users,
    Building2,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    RefreshCw,
    AlertCircle,
    UserX,
    MessageCircle,
    HelpCircle,
    ArrowLeft
} from "lucide-react"
import * as XLSX from 'xlsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Cell } from 'recharts'
import SellOutHelpModal from "@/components/sellout/SellOutHelpModal"
import { Combobox } from "@/components/ui/combobox"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue, colorClass }) => (
    <Card className="group bg-white dark:bg-slate-900 border-2 border-slate-200/50 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:shadow-2xl hover:border-emerald-500/50 transition-all duration-500 overflow-hidden relative">
        <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-gradient-to-br ${colorClass} opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700`} />

        <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${colorClass}`} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">{value}</h3>
                        {subValue && (
                            <p className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full w-fit">
                                {subValue}
                            </p>
                        )}
                    </div>
                </div>
                <div className={`p-4 bg-gradient-to-br ${colorClass} rounded-2xl text-white shadow-lg shadow-emerald-900/10 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {trend && trendValue !== 0 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} rounded-2xl`}>
                        {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span className="text-sm font-black tracking-tight">{trendValue}%</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">vs mês anterior</span>
                </div>
            )}
            {trendValue === 0 && (
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-400 rounded-2xl">
                        <RefreshCw className="w-4 h-4" />
                        <span className="text-sm font-black tracking-tight">Estável</span>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>
)

export default function SellOutPage() {
    const [registros, setRegistros] = useState([])
    const [pendencias, setPendencias] = useState([])
    const [clientes, setClientes] = useState([])
    const [industrias, setIndustrias] = useState([])
    const [summary, setSummary] = useState(null)
    const [loading, setLoading] = useState(false)
    const [loadingSummary, setLoadingSummary] = useState(false)
    const [activeTab, setActiveTab] = useState("registros")
    const [showHelp, setShowHelp] = useState(false)

    // Form state
    const [editId, setEditId] = useState(null)
    const [cliCodigo, setCliCodigo] = useState("")
    const [forCodigo, setForCodigo] = useState("")
    const [periodo, setPeriodo] = useState("")
    const [valor, setValor] = useState("")
    const [quantidade, setQuantidade] = useState("")
    const [showForm, setShowForm] = useState(false)

    // Filters
    const [filtroCliente, setFiltroCliente] = useState("ALL")
    const [filtroIndustria, setFiltroIndustria] = useState("ALL")
    const [filtroBusca, setFiltroBusca] = useState("")

    useEffect(() => {
        carregarDados()
        carregarClientes()
        carregarIndustrias()
        carregarSummary()
        carregarPendencias()
    }, [])

    // Adicionar listener para recarregar dados quando os filtros de busca mudarem
    useEffect(() => {
        carregarDados()
        carregarSummary()
    }, [filtroIndustria, filtroCliente, periodo])

    const carregarSummary = async () => {
        setLoadingSummary(true)
        try {
            const params = new URLSearchParams()
            if (filtroIndustria && filtroIndustria !== "ALL") params.append('for_codigo', filtroIndustria)
            if (filtroCliente && filtroCliente !== "ALL") params.append('cli_codigo', filtroCliente)
            if (periodo) params.append('periodo', periodo + "-01")

            const res = await axios.get(`/crm/sellout/summary?${params}`)
            setSummary(res.data.data)
        } catch (error) {
            console.error("Erro ao carregar resumo:", error)
        } finally {
            setLoadingSummary(false)
        }
    }

    const carregarPendencias = async () => {
        try {
            const res = await axios.get("/crm/sellout/pendencies")
            setPendencias(res.data.data || [])
        } catch (error) {
            console.error("Erro ao carregar pendências:", error)
        }
    }

    const carregarDados = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (filtroIndustria && filtroIndustria !== "ALL") params.append('for_codigo', filtroIndustria)
            if (filtroCliente && filtroCliente !== "ALL") params.append('cli_codigo', filtroCliente)
            if (periodo) params.append('periodo', periodo + "-01")

            const res = await axios.get(`/crm/sellout?${params}`)
            setRegistros(res.data.data || [])
        } catch (error) {
            toast.error("Erro ao carregar registros")
        } finally {
            setLoading(false)
        }
    }

    const carregarClientes = async () => {
        try {
            const res = await axios.get("/aux/clientes?status=A")
            setClientes(res.data.data || [])
        } catch (error) {
            console.error("Erro ao carregar clientes:", error)
        }
    }

    const carregarIndustrias = async () => {
        try {
            const res = await axios.get("/suppliers")
            setIndustrias(res.data.data || [])
        } catch (error) {
            console.error("Erro ao carregar indústrias:", error)
        }
    }

    const salvar = async () => {
        if (!cliCodigo || !forCodigo || !periodo) {
            toast.error("Cliente, Indústria e Período são obrigatórios")
            return
        }

        try {
            const data = {
                cli_codigo: parseInt(cliCodigo),
                for_codigo: parseInt(forCodigo),
                periodo: periodo + "-01",
                valor: parseFloat(valor) || 0,
                quantidade: parseInt(quantidade) || 0
            }

            if (editId) {
                await axios.put(`/crm/sellout/${editId}`, data)
                toast.success("Registro atualizado!")
            } else {
                await axios.post("/crm/sellout", data)
                toast.success("Registro criado!")
            }

            limparForm()
            carregarDados()
            carregarSummary()
            carregarPendencias()
            setShowForm(false)
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar")
        }
    }

    const editar = (reg) => {
        setEditId(reg.id)
        setCliCodigo(reg.cli_codigo.toString())
        setForCodigo(reg.for_codigo.toString())
        setPeriodo(reg.periodo?.substring(0, 7) || "")
        setValor(reg.valor?.toString() || "")
        setQuantidade(reg.quantidade?.toString() || "")
        setShowForm(true)
    }

    const excluir = async (id) => {
        if (!confirm("Confirma exclusão?")) return
        try {
            await axios.delete(`/crm/sellout/${id}`)
            toast.success("Registro removido!")
            carregarDados()
            carregarSummary()
            carregarPendencias()
        } catch (error) {
            toast.error("Erro ao remover")
        }
    }

    const formatCurrencyInput = (val) => {
        if (!val) return '';
        const numericValue = val.toString().replace(/\D/g, '');
        const floatValue = parseFloat(numericValue) / 100;
        return floatValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const handleCurrencyChange = (e) => {
        const value = e.target.value.replace(/\D/g, '');
        const floatValue = parseFloat(value) / 100;
        setValor(floatValue.toString());
    };

    const limparForm = () => {
        setEditId(null)
        setCliCodigo("")
        setForCodigo("")
        setPeriodo("")
        setValor("")
        setQuantidade("")
    }

    const downloadTemplate = () => {
        // Aba principal de lançamentos
        const template = [
            { CLI_CODIGO: "Ex: 123", FOR_CODIGO: "Ex: 1", PERIODO: "2026-02", VALOR: 1500.50, QUANTIDADE: 100 },
        ]

        // Aba de Clientes para consulta
        const dataClientes = clientes.map(c => ({
            CODIGO: c.cli_codigo,
            NOME: c.cli_nomred || c.cli_nome,
            CIDADE: c.cli_cidade || ""
        }))

        // Aba de Indústrias para consulta
        const dataIndustrias = industrias.map(i => ({
            CODIGO: i.id || i.for_codigo,
            NOME: i.nome || i.for_nomered || i.for_nome
        }))

        const wb = XLSX.utils.book_new()

        // Criar as planilhas
        const wsLancamentos = XLSX.utils.json_to_sheet(template)
        const wsClientes = XLSX.utils.json_to_sheet(dataClientes)
        const wsIndustrias = XLSX.utils.json_to_sheet(dataIndustrias)

        // Adicionar ao Workbook
        XLSX.utils.book_append_sheet(wb, wsLancamentos, "Lancamentos")
        XLSX.utils.book_append_sheet(wb, wsClientes, "LISTA_CLIENTES")
        XLSX.utils.book_append_sheet(wb, wsIndustrias, "LISTA_INDUSTRIAS")

        // Download
        XLSX.writeFile(wb, "Template_SellOut_SalesMasters.xlsx")
        toast.success("Template gerado com dados auxiliares!")
    }

    const importarPlanilha = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const loadingToast = toast.loading("Analisando planilha...")

        try {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary', cellDates: true })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const jsonData = XLSX.utils.sheet_to_json(ws)

                if (jsonData.length === 0) {
                    toast.dismiss(loadingToast)
                    toast.error("Planilha vazia ou sem dados válidos.")
                    return
                }

                const data = jsonData.map((row, index) => {
                    // Normalizar nomes das colunas (Case insensitive e sem espaços)
                    const normalizedRow = Object.keys(row).reduce((acc, key) => {
                        acc[key.trim().toUpperCase()] = row[key]
                        return acc
                    }, {})

                    let p = normalizedRow.PERIODO || ""

                    // Tratamento flexível de data
                    if (p instanceof Date) {
                        p = p.toISOString().substring(0, 7)
                    } else if (typeof p === 'string' && p.includes('/') && p.length >= 7) {
                        const parts = p.split('/')
                        if (parts.length >= 2) {
                            if (parts[1].length === 4) p = `${parts[1]}-${parts[0].padStart(2, '0')}` // MM/YYYY
                            else if (parts[2]?.length === 4) p = `${parts[2]}-${parts[1].padStart(2, '0')}` // DD/MM/YYYY
                        }
                    }

                    return {
                        cli_codigo: parseInt(normalizedRow.CLI_CODIGO || normalizedRow.CLIENTE),
                        for_codigo: parseInt(normalizedRow.FOR_CODIGO || normalizedRow.INDUSTRIA),
                        periodo: p.length === 7 ? p + "-01" : p,
                        valor: parseFloat(normalizedRow.VALOR || 0),
                        quantidade: parseInt(normalizedRow.QUANTIDADE || normalizedRow.QTD || 0)
                    }
                }).filter(row => !isNaN(row.cli_codigo) && !isNaN(row.for_codigo) && row.periodo.length === 10)

                if (data.length === 0) {
                    toast.dismiss(loadingToast)
                    toast.error("Nenhum registro válido processado. Verifique os códigos e o formato da data.")
                    return
                }

                const res = await axios.post("/crm/sellout/import", { data })
                toast.dismiss(loadingToast)
                toast.success(`Sucesso! ${res.data.imported} registros de sell-out importados.`)

                if (res.data.errors?.length > 0) {
                    console.log("Erros durante importação:", res.data.errors)
                }

                carregarDados()
                carregarSummary()
                carregarPendencias()
            }
            reader.readAsBinaryString(file)
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error("Falha ao processar arquivo Excel")
        }

        e.target.value = ""
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    }

    const formatPeriodo = (dateStr) => {
        if (!dateStr) return "—"
        const d = new Date(dateStr)
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    const filteredRegistros = registros.filter(reg => {
        if (!filtroBusca) return true
        const search = filtroBusca.toLowerCase()
        return (
            reg.cli_nomred?.toLowerCase().includes(search) ||
            reg.for_nome?.toLowerCase().includes(search) ||
            reg.cli_codigo?.toString().includes(search)
        )
    })

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <SellOutHelpModal open={showHelp} onClose={() => setShowHelp(false)} />

            {/* Elegant Header - Redesigned for Impact */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-8 py-8 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative p-4 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[28px] shadow-2xl shadow-emerald-900/20 rotate-3 group-hover:rotate-0 transition-all duration-500">
                                <TrendingUp className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">
                                Rotina de <span className="text-emerald-600">Sell-Out</span>
                            </h1>
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
                                    Vendas na Ponta
                                </span>
                                <div className="w-1 h-1 rounded-full bg-slate-300" />
                                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50">
                                    <RefreshCw className="w-3 h-3 animate-spin-slow" /> Tempo Real
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                        <div className="flex items-center bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/50 mr-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowHelp(true)}
                                className="text-slate-500 hover:text-emerald-600 rounded-xl"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { carregarDados(); carregarSummary(); carregarPendencias(); }}
                                className="text-slate-500 hover:text-emerald-600 rounded-xl"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={downloadTemplate}
                                className="h-12 px-6 rounded-2xl border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all gap-2"
                            >
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                <span className="hidden lg:inline">Template</span>
                            </Button>
                            <label className="cursor-pointer">
                                <input type="file" accept=".xlsx,.xls" onChange={importarPlanilha} className="hidden" />
                                <div className="h-12 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 transition-all gap-2 flex items-center justify-center">
                                    <Upload className="w-4 h-4 text-blue-600" />
                                    <span className="hidden lg:inline">Importar</span>
                                </div>
                            </label>
                            <Button
                                onClick={() => { limparForm(); setShowForm(true); }}
                                className="h-12 px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 gap-2 border-b-4 border-emerald-800 active:border-b-0 transition-all"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="hidden sm:inline">NOVO REGISTRO</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Summary Metrics */}
                {/* Summary Metrics - Fixed Grid for Alignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    <StatCard
                        title="Sell-Out Mes Atual"
                        value={formatCurrency(summary?.current_month_total)}
                        icon={TrendingUp}
                        trend={summary?.growth > 0 ? 'up' : 'down'}
                        trendValue={Math.abs(summary?.growth || 0)}
                        colorClass="from-emerald-500 to-emerald-700"
                    />
                    <StatCard
                        title="Clientes Ativos"
                        value={summary?.total_customers || 0}
                        subValue="Enviaram dados este mês"
                        icon={Users}
                        colorClass="from-blue-500 to-indigo-700"
                    />
                    <StatCard
                        title="Indústrias"
                        value={summary?.total_industries || 0}
                        subValue="Mapeadas na rotina"
                        icon={Building2}
                        colorClass="from-cyan-500 to-blue-700"
                    />
                    <StatCard
                        title="Pendências"
                        value={pendencias.length}
                        subValue="Clientes sem reporte"
                        icon={AlertCircle}
                        colorClass="from-amber-500 to-orange-700"
                    />
                </div>

                {/* Tabs System - Moved up for better visibility */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-white p-1 rounded-xl border border-slate-200 shadow-sm inline-flex">
                        <TabsTrigger
                            value="registros"
                            className="rounded-lg px-6 data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:shadow-none data-[state=active]:font-bold"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Registros Efetuados
                        </TabsTrigger>
                        <TabsTrigger
                            value="pendencias"
                            className="rounded-lg px-6 data-[state=active]:bg-rose-50 data-[state=active]:text-rose-700 data-[state=active]:shadow-none data-[state=active]:font-bold"
                        >
                            <UserX className="w-4 h-4 mr-2" />
                            Pendências de Reporte
                            {pendencias.length > 0 && (
                                <span className="ml-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse font-bold">
                                    {pendencias.length}
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="registros" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-wrap items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                            <div className="flex flex-wrap items-center gap-4 flex-1">
                                <div className="relative flex-1 min-w-[300px] group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                        <Search className="w-5 h-5" />
                                    </div>
                                    <Input
                                        placeholder="Pesquisar cliente ou indústria..."
                                        className="h-12 pl-12 pr-4 w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-emerald-500/20 font-medium text-sm transition-all"
                                        value={filtroBusca}
                                        onChange={e => setFiltroBusca(e.target.value)}
                                    />
                                </div>
                                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden lg:block" />

                                <div className="flex items-center gap-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 hidden sm:block">Período:</label>
                                    <Input
                                        type="month"
                                        className="h-12 w-64 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-emerald-500/20 font-bold text-slate-600 px-4"
                                        value={periodo}
                                        onChange={e => setPeriodo(e.target.value)}
                                    />
                                </div>

                                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden lg:block" />

                                <div className="flex items-center gap-2 min-w-[200px]">
                                    <Combobox
                                        items={[
                                            { value: "ALL", label: "Todos Clientes" },
                                            ...clientes.map(c => ({
                                                value: c.cli_codigo.toString(),
                                                label: `${c.cli_codigo} - ${c.cli_nomred || c.cli_nome}`
                                            }))
                                        ]}
                                        value={filtroCliente}
                                        onChange={setFiltroCliente}
                                        placeholder="Filtrar Cliente..."
                                        className="h-12 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-slate-600 uppercase tracking-widest"
                                    />
                                </div>

                                <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden lg:block" />

                                <Select value={filtroIndustria} onValueChange={setFiltroIndustria}>
                                    <SelectTrigger className="h-12 w-56 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl focus:ring-emerald-500/20 font-bold text-slate-600 dark:text-slate-400 text-xs uppercase tracking-widest">
                                        <SelectValue placeholder="Filtrar Indústria" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                        <SelectItem value="ALL">Todas Indústrias</SelectItem>
                                        {industrias.filter(i => (i.id || i.for_codigo)).map(i => (
                                            <SelectItem key={i.id || i.for_codigo} value={(i.id || i.for_codigo).toString()}>
                                                {i.nome || i.for_nomered || i.for_nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    onClick={() => { setFiltroIndustria("ALL"); setFiltroCliente("ALL"); setPeriodo(""); setFiltroBusca(""); }}
                                    variant="ghost"
                                    className="h-12 px-4 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"
                                    title="Limpar Filtros"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                            </div>

                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest leading-none">
                                    Total de {filteredRegistros.length} registros
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Charts & Trends - Optimized Width for new Ranking Chart */}
                            <Card className="lg:col-span-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden group">
                                <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800/50 p-6 bg-slate-50/30 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-emerald-500 rounded-xl text-white shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <CardTitle className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">Tendência de <span className="text-emerald-500">Sell-Out</span></CardTitle>
                                                {summary?.growth !== undefined && (
                                                    <Badge className={`rounded-xl px-3 py-1 border-none font-black text-[10px] uppercase tracking-widest ${parseFloat(summary.growth) >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                        {parseFloat(summary.growth) >= 0 ? '+' : ''}{summary.growth}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Performance filtrada (Visão Trimestral)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-700">
                                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter text-emerald-600 bg-emerald-50 dark:bg-emerald-900/50 rounded-lg">Valor</Button>
                                        <Button variant="ghost" size="sm" className="h-7 px-3 text-[10px] font-black uppercase tracking-tighter text-slate-400 dark:text-slate-500 rounded-lg">Volume</Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={summary?.trend || []}>
                                                <defs>
                                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f1f5f9" />
                                                <XAxis
                                                    dataKey="label"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}
                                                    dy={20}
                                                />
                                                <YAxis hide />
                                                <Tooltip
                                                    cursor={{ stroke: '#10b981', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                    contentStyle={{
                                                        borderRadius: '20px',
                                                        border: 'none',
                                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                                                        padding: '16px',
                                                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                        backdropFilter: 'blur(8px)',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    formatter={(value) => [formatCurrency(value), '']}
                                                    labelStyle={{ color: '#64748b', fontWeight: 900, fontSize: '12px', margin: '0 0 8px 0', textTransform: 'uppercase' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="value"
                                                    stroke="#10b981"
                                                    strokeWidth={4}
                                                    fillOpacity={1}
                                                    fill="url(#colorValue)"
                                                    animationDuration={2000}
                                                    animationEasing="ease-in-out"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* NEW: Ranking de Clientes (Monitoramento do Mês) */}
                            <Card className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden group">
                                <CardHeader className="border-b border-slate-50 dark:border-slate-800/50 p-6 bg-slate-50/30 dark:bg-slate-800/20">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-slate-800 dark:text-white tracking-tighter uppercase whitespace-nowrap">Ranking de <span className="text-blue-500">Clientes</span></CardTitle>
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Top 5 performance do mês</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8">
                                    {summary?.ranking?.length > 0 ? (
                                        <div className="h-[300px] w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={summary.ranking} layout="vertical" margin={{ left: -20, right: 30 }}>
                                                    <CartesianGrid strokeDasharray="6 6" horizontal={false} stroke="#f1f5f9" />
                                                    <XAxis type="number" hide />
                                                    <YAxis
                                                        dataKey="label"
                                                        type="category"
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: '#64748b', fontWeight: 900, textTransform: 'uppercase' }}
                                                        width={100}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: '#f8fafc' }}
                                                        contentStyle={{
                                                            borderRadius: '16px',
                                                            border: 'none',
                                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                                            fontSize: '11px'
                                                        }}
                                                        formatter={(value) => [formatCurrency(value), 'Sell-Out']}
                                                    />
                                                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
                                                        {summary.ranking.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3b82f6'} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <div className="h-[300px] flex flex-col items-center justify-center text-slate-300">
                                            <Users className="w-12 h-12 opacity-20 mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Sem dados de ranking</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Dialog open={showForm} onOpenChange={setShowForm}>
                                <DialogContent className="max-w-2xl p-0 bg-transparent border-none shadow-none">
                                    <Card className="bg-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/10 overflow-hidden rounded-[32px]">
                                        <CardHeader className="bg-emerald-600 border-b border-emerald-700 py-6 px-8 relative">
                                            <CardTitle className="text-xl font-black flex items-center gap-3 text-white uppercase tracking-tighter">
                                                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                                    <Plus className="w-5 h-5 text-white" />
                                                </div>
                                                {editId ? "Editar Registro" : "Lançamento Manual"}
                                            </CardTitle>
                                            <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">Preencha os dados da venda na ponta</p>
                                        </CardHeader>
                                        <CardContent className="p-8 space-y-6">
                                            <div className="space-y-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Cliente / PDV Responsável</label>
                                                    <Combobox
                                                        items={clientes.map(c => ({
                                                            value: c.cli_codigo.toString(),
                                                            label: `${c.cli_codigo} - ${c.cli_nomred || c.cli_nome}`
                                                        }))}
                                                        value={cliCodigo}
                                                        onChange={setCliCodigo}
                                                        placeholder="Pesquisar cliente por nome ou código..."
                                                        searchPlaceholder="Digite para buscar entre +1.000 clientes..."
                                                        className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-emerald-500/20"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Indústria Representada</label>
                                                    <Combobox
                                                        items={industrias.map(i => ({
                                                            value: (i.id || i.for_codigo).toString(),
                                                            label: i.nome || i.for_nomered || i.for_nome
                                                        }))}
                                                        value={forCodigo}
                                                        onChange={setForCodigo}
                                                        placeholder="Selecione a indústria..."
                                                        className="h-14 bg-slate-50 border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-emerald-500/20"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Período Fiscal</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                        <Input
                                                            type="month"
                                                            value={periodo}
                                                            onChange={e => setPeriodo(e.target.value)}
                                                            className="h-14 pl-12 bg-slate-50 border-slate-200 rounded-2xl focus:ring-emerald-500/20 font-bold text-slate-600 w-full"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-5">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Volume / Qtd</label>
                                                        <Input
                                                            type="number"
                                                            placeholder="0"
                                                            value={quantidade}
                                                            onFocus={(e) => e.target.select()}
                                                            onChange={e => setQuantidade(e.target.value)}
                                                            className="h-14 bg-slate-50 border-slate-200 rounded-2xl focus:ring-emerald-500/20 font-bold text-slate-800 text-lg"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Valor Sell-Out (Total)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-emerald-600">R$</span>
                                                            <Input
                                                                type="text"
                                                                placeholder="0,00"
                                                                value={formatCurrencyInput(valor)}
                                                                onFocus={(e) => e.target.select()}
                                                                onChange={handleCurrencyChange}
                                                                className="h-14 pl-11 bg-emerald-50/30 border-emerald-100 text-emerald-700 font-bold text-xl rounded-2xl focus:ring-emerald-500/20 text-right pr-4"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3 pt-4">
                                                <Button
                                                    onClick={salvar}
                                                    className="h-16 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 border-b-4 border-emerald-800 active:border-b-0 transition-all gap-3"
                                                >
                                                    <ArrowUpRight className="w-5 h-5" />
                                                    {editId ? "Salvar Alterações" : "Confirmar Lançamento"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    onClick={() => setShowForm(false)}
                                                    className="h-12 w-full text-slate-400 hover:text-rose-600 font-bold uppercase text-[10px] tracking-widest"
                                                >
                                                    Sair sem salvar
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </DialogContent>
                            </Dialog>
                        </div>

                        <Card className="bg-white overflow-hidden border-2 border-slate-200 shadow-lg">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                                        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                        <p className="text-slate-400 font-medium">Carregando dados da rotina...</p>
                                    </div>
                                ) : registros.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                        <div className="p-6 bg-slate-50 rounded-full mb-6">
                                            <FileSpreadsheet className="w-12 h-12 text-slate-200" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhum Registro Encontrado</h3>
                                        <p className="max-w-xs text-center text-sm">
                                            Comece a rotina de Sell-Out importando uma planilha ou realizando um lançamento manual.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                                <tr className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                    <th className="text-left p-5">Cliente / PDV</th>
                                                    <th className="text-left p-5">Indústria Representada</th>
                                                    <th className="text-left p-5">Período Fiscal</th>
                                                    <th className="text-right p-5">Volume</th>
                                                    <th className="text-right p-5">Valor Sell-Out</th>
                                                    <th className="text-center p-5">Gerenciar</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {filteredRegistros.map((reg, idx) => (
                                                    <motion.tr
                                                        key={reg.id}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        className="group hover:bg-emerald-50/30 transition-colors"
                                                    >
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors shadow-sm">
                                                                    <Users className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-800 leading-snug">{reg.cli_nomred}</p>
                                                                    <div className="flex items-center mt-1 gap-2">
                                                                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-medium">#{reg.cli_codigo}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5 font-bold text-slate-600">{reg.for_nome}</td>
                                                        <td className="p-5">
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-[11px] font-bold shadow-sm">
                                                                <Calendar className="w-3 h-3 text-slate-400" />
                                                                {formatPeriodo(reg.periodo)}
                                                            </span>
                                                        </td>
                                                        <td className="p-5 text-right font-bold text-slate-700">{reg.quantidade} <span className="text-[10px] text-slate-400 font-normal ml-1">itens</span></td>
                                                        <td className="p-5 text-right">
                                                            <p className="font-black text-emerald-700 text-base">{formatCurrency(reg.valor)}</p>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button size="icon" variant="ghost" onClick={() => editar(reg)} className="w-8 h-8 text-blue-600 hover:bg-blue-50 rounded-lg">
                                                                    <Pencil className="w-4 h-4" />
                                                                </Button>
                                                                <Button size="icon" variant="ghost" onClick={() => excluir(reg.id)} className="w-8 h-8 text-rose-600 hover:bg-rose-50 rounded-lg">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="pendencias" className="space-y-4">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-4 shadow-sm">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <AlertCircle className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wide">Atenção à Rotina</h4>
                                <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                    Abaixo estão os clientes que já reportaram sell-out anteriormente, mas ainda não enviaram os dados do mês atual.
                                    Considere entrar em contato para manter a base atualizada.
                                </p>
                            </div>
                        </div>

                        <Card className="bg-white overflow-hidden border-2 border-slate-200 shadow-lg">
                            <CardContent className="p-0">
                                {pendencias.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
                                        <div className="p-6 bg-emerald-50 rounded-full mb-6 text-emerald-600">
                                            <TrendingUp className="w-12 h-12" />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2">Tudo em dia!</h3>
                                        <p className="max-w-xs text-center text-sm">
                                            Todos os clientes ativos na rotina de sell-out já enviaram seus reportes.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-slate-50/80 border-b border-slate-100">
                                                <tr className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                                                    <th className="text-left p-5">Cliente / PDV</th>
                                                    <th className="text-left p-5">Cidade / UF</th>
                                                    <th className="text-left p-5">Promotor Responsável</th>
                                                    <th className="text-center p-5">Ação Recomendada</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {pendencias.map((pend, idx) => (
                                                    <motion.tr
                                                        key={pend.cli_codigo}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.01 }}
                                                        className="group hover:bg-rose-50/30 transition-colors"
                                                    >
                                                        <td className="p-5">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors shadow-sm">
                                                                    <UserX className="w-5 h-5" />
                                                                </div>
                                                                <div>
                                                                    <p className="font-bold text-slate-900 leading-snug">{pend.cli_nomred}</p>
                                                                    <p className="text-[10px] text-slate-400 mt-1 font-bold">CÓD: {pend.cli_codigo}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <p className="text-sm font-semibold text-slate-600">{pend.cli_cidade} - {pend.cli_uf}</p>
                                                        </td>
                                                        <td className="p-5">
                                                            <Badge variant="outline" className="font-bold border-slate-200 text-slate-600">
                                                                {pend.promotor ? pend.promotor.toUpperCase() : "SEM PROMOTOR"}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex justify-center">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="border-rose-200 text-rose-600 hover:bg-rose-50 gap-2 font-bold shadow-sm"
                                                                    onClick={() => toast(`Cobrança de sell-out para ${pend.cli_nomred} registrada!`)}
                                                                >
                                                                    <MessageCircle className="w-4 h-4" />
                                                                    Cobrar Reporte
                                                                </Button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )
}
