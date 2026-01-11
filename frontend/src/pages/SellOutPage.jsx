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
    HelpCircle
} from "lucide-react"
import * as XLSX from 'xlsx'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import SellOutHelpModal from "@/components/sellout/SellOutHelpModal"

const StatCard = ({ title, value, subValue, icon: Icon, trend, trendValue }) => (
    <Card className="bg-white border-2 border-slate-200/60 shadow-lg hover:shadow-xl hover:border-emerald-200 hover:-translate-y-1 transition-all duration-300">
        <CardContent className="p-6">
            <div className="flex justify-between items-start">
                <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800">{value}</h3>
                    {subValue && <p className="text-xs font-semibold text-slate-400">{subValue}</p>}
                </div>
                <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shadow-inner">
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            {trend && (
                <div className="mt-4 flex items-center gap-1.5 p-2 bg-slate-50 rounded-lg w-fit">
                    {trend === 'up' ? (
                        <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                    ) : (
                        <ArrowDownRight className="w-4 h-4 text-rose-500" />
                    )}
                    <span className={trend === 'up' ? "text-emerald-600 text-xs font-bold" : "text-rose-600 text-xs font-bold"}>
                        {trendValue}%
                    </span>
                    <span className="text-slate-400 text-xs font-medium">vs mês anterior</span>
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

    const carregarSummary = async () => {
        setLoadingSummary(true)
        try {
            const res = await axios.get("/crm/sellout/summary")
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
            if (filtroCliente && filtroCliente !== "ALL") params.append('cli_codigo', filtroCliente)
            if (filtroIndustria && filtroIndustria !== "ALL") params.append('for_codigo', filtroIndustria)

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

    const limparForm = () => {
        setEditId(null)
        setCliCodigo("")
        setForCodigo("")
        setPeriodo("")
        setValor("")
        setQuantidade("")
    }

    const downloadTemplate = () => {
        const template = [
            { CLI_CODIGO: 123, FOR_CODIGO: 1, PERIODO: "2024-12", VALOR: 15000.00, QUANTIDADE: 50 },
            { CLI_CODIGO: 456, FOR_CODIGO: 2, PERIODO: "2024-12", VALOR: 8500.00, QUANTIDADE: 30 }
        ]
        const ws = XLSX.utils.json_to_sheet(template)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "SellOut")
        XLSX.writeFile(wb, "template_sellout.xlsx")
        toast.success("Template baixado!")
    }

    const importarPlanilha = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        const loadingToast = toast.loading("Processando planilha...")

        try {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const jsonData = XLSX.utils.sheet_to_json(ws)

                const data = jsonData.map(row => ({
                    cli_codigo: row.CLI_CODIGO || row.cli_codigo,
                    for_codigo: row.FOR_CODIGO || row.for_codigo,
                    periodo: (row.PERIODO || row.periodo) + "-01",
                    valor: parseFloat(row.VALOR || row.valor || 0),
                    quantidade: parseInt(row.QUANTIDADE || row.quantidade || 0)
                }))

                const res = await axios.post("/crm/sellout/import", { data })
                toast.dismiss(loadingToast)
                toast.success(`Importado ${res.data.imported} de ${res.data.total} registros`)

                if (res.data.errors?.length > 0) {
                    res.data.errors.forEach(err => toast.warning(err))
                }

                carregarDados()
                carregarSummary()
                carregarPendencias()
            }
            reader.readAsBinaryString(file)
        } catch (error) {
            toast.dismiss(loadingToast)
            toast.error("Erro ao importar planilha")
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

            {/* Elegant Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-6 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl shadow-xl shadow-emerald-900/10">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">
                                Rotina de Sell-Out
                            </h1>
                            <div className="flex items-center gap-2 text-slate-500 mt-1">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold border border-slate-200 uppercase tracking-wider">
                                    Vendas na Ponta
                                </span>
                                <span className="text-xs font-medium">Gestão de Performance e Giro</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHelp(true)}
                            className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hidden md:flex"
                        >
                            <HelpCircle className="w-5 h-5 mr-1" />
                            Ajuda
                        </Button>
                        <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { carregarDados(); carregarSummary(); carregarPendencias(); }}
                            className="bg-white hover:bg-slate-50 border-slate-200 shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Atualizar
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={downloadTemplate}
                            className="bg-white border-slate-200 shadow-sm"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Template
                        </Button>
                        <label>
                            <input type="file" accept=".xlsx,.xls" onChange={importarPlanilha} className="hidden" />
                            <Button size="sm" variant="outline" className="cursor-pointer bg-white border-slate-200 shadow-sm">
                                <Upload className="w-4 h-4 mr-2" />
                                Importar
                            </Button>
                        </label>
                        <Button
                            onClick={() => { setShowForm(!showForm); if (!showForm) limparForm(); }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Novo Registro
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-8 space-y-8">

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Sell-Out Mes Atual"
                        value={formatCurrency(summary?.current_month_total)}
                        icon={TrendingUp}
                        trend={summary?.growth > 0 ? 'up' : 'down'}
                        trendValue={Math.abs(summary?.growth || 0)}
                    />
                    <StatCard
                        title="Clientes Ativos"
                        value={summary?.total_customers || 0}
                        subValue="Enviaram dados este mês"
                        icon={Users}
                    />
                    <StatCard
                        title="Indústrias"
                        value={summary?.total_industries || 0}
                        subValue="Mapeadas na rotina"
                        icon={Building2}
                    />
                    <StatCard
                        title="Pendências"
                        value={pendencias.length}
                        subValue="Clientes sem reporte"
                        icon={AlertCircle}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Charts & Trends */}
                    <Card className="lg:col-span-2 bg-white border-2 border-slate-200 shadow-lg hover:shadow-xl transition-all">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-slate-800">Tendência de Sell-Out</CardTitle>
                                <p className="text-xs text-slate-400 mt-1 font-medium uppercase tracking-wide">Histórico dos últimos 6 meses</p>
                            </div>
                            <div className="p-2 bg-emerald-50 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-emerald-600" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[280px] w-full mt-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={summary?.trend || []}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="label"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                                            dy={10}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                                                fontFamily: 'inherit'
                                            }}
                                            formatter={(value) => [formatCurrency(value), 'Valor']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#10b981"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorValue)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Manual Entry Form - Collapsible */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="h-full"
                            >
                                <Card className="bg-white border-2 border-emerald-100 shadow-xl shadow-emerald-900/10 h-full">
                                    <CardHeader className="bg-emerald-50/50 border-b border-emerald-100 py-4">
                                        <CardTitle className="text-md font-bold flex items-center gap-2 text-emerald-900 uppercase tracking-wide">
                                            <Plus className="w-5 h-5 text-emerald-600" />
                                            {editId ? "Editar Registro" : "Lançamento Manual"}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6 space-y-5">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Cliente</label>
                                                <Select value={cliCodigo} onValueChange={setCliCodigo}>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-emerald-500/20">
                                                        <SelectValue placeholder="Selecione o cliente" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clientes.map(c => (
                                                            <SelectItem key={c.cli_codigo} value={c.cli_codigo.toString()}>
                                                                {c.cli_nomred || c.cli_nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Indústria</label>
                                                <Select value={forCodigo} onValueChange={setForCodigo}>
                                                    <SelectTrigger className="bg-slate-50 border-slate-200 focus:ring-emerald-500/20">
                                                        <SelectValue placeholder="Selecione" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {industrias.map(i => (
                                                            <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>
                                                                {i.for_nome}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Período</label>
                                                    <Input
                                                        type="month"
                                                        value={periodo}
                                                        onChange={e => setPeriodo(e.target.value)}
                                                        className="bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Quantidade</label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={quantidade}
                                                        onChange={e => setQuantidade(e.target.value)}
                                                        className="bg-slate-50 border-slate-200 focus:ring-emerald-500/20"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-1.5 block">Valor Total (R$)</label>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0,00"
                                                    value={valor}
                                                    onChange={e => setValor(e.target.value)}
                                                    className="bg-slate-50 border-slate-200 text-emerald-700 font-bold text-lg focus:ring-emerald-500/20"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 pt-4">
                                            <Button
                                                onClick={salvar}
                                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/20"
                                            >
                                                {editId ? "Salvar Alterações" : "Confirmar Lançamento"}
                                            </Button>
                                            <Button variant="ghost" onClick={() => setShowForm(false)} className="w-full text-slate-400 hover:text-slate-600">
                                                Cancelar
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tabs System */}
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

                    <TabsContent value="registros" className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-lg shadow-slate-200/50">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por cliente ou indústria..."
                                        className="pl-9 w-80 bg-slate-50 border-slate-200 focus:bg-white transition-all focus:ring-emerald-500/20"
                                        value={filtroBusca}
                                        onChange={e => setFiltroBusca(e.target.value)}
                                    />
                                </div>

                                <Select value={filtroIndustria} onValueChange={setFiltroIndustria}>
                                    <SelectTrigger className="w-48 bg-slate-50 border-slate-200 focus:ring-emerald-500/20">
                                        <SelectValue placeholder="Filtrar Indústria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todas Indústrias</SelectItem>
                                        {industrias.map(i => (
                                            <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>
                                                {i.for_nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button onClick={carregarDados} variant="ghost" className="text-emerald-600 font-bold px-4 hover:bg-emerald-50 rounded-lg">
                                    <Filter className="w-4 h-4 mr-2" />
                                    Filtrar
                                </Button>
                            </div>

                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest px-4">
                                Mostrando {filteredRegistros.length} registros
                            </div>
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
