import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Plus, Upload, Pencil, Trash2, TrendingUp, Download, FileSpreadsheet } from "lucide-react"
import * as XLSX from 'xlsx'

export default function SellOutPage() {
    const [registros, setRegistros] = useState([])
    const [clientes, setClientes] = useState([])
    const [industrias, setIndustrias] = useState([])
    const [loading, setLoading] = useState(false)

    // Form state
    const [editId, setEditId] = useState(null)
    const [cliCodigo, setCliCodigo] = useState("")
    const [forCodigo, setForCodigo] = useState("")
    const [periodo, setPeriodo] = useState("")
    const [valor, setValor] = useState("")
    const [quantidade, setQuantidade] = useState("")

    // Filters
    const [filtroCliente, setFiltroCliente] = useState("")
    const [filtroIndustria, setFiltroIndustria] = useState("")

    useEffect(() => {
        carregarDados()
        carregarClientes()
        carregarIndustrias()
    }, [])

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
                periodo: periodo + "-01", // Convert YYYY-MM to date
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
    }

    const excluir = async (id) => {
        if (!confirm("Confirma exclusão?")) return
        try {
            await axios.delete(`/crm/sellout/${id}`)
            toast.success("Registro removido!")
            carregarDados()
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

        try {
            const reader = new FileReader()
            reader.onload = async (evt) => {
                const bstr = evt.target?.result
                const wb = XLSX.read(bstr, { type: 'binary' })
                const wsname = wb.SheetNames[0]
                const ws = wb.Sheets[wsname]
                const jsonData = XLSX.utils.sheet_to_json(ws)

                // Map to expected format
                const data = jsonData.map(row => ({
                    cli_codigo: row.CLI_CODIGO || row.cli_codigo,
                    for_codigo: row.FOR_CODIGO || row.for_codigo,
                    periodo: (row.PERIODO || row.periodo) + "-01",
                    valor: parseFloat(row.VALOR || row.valor || 0),
                    quantidade: parseInt(row.QUANTIDADE || row.quantidade || 0)
                }))

                const res = await axios.post("/crm/sellout/import", { data })
                toast.success(`Importado ${res.data.imported} de ${res.data.total} registros`)

                if (res.data.errors?.length > 0) {
                    res.data.errors.forEach(err => toast.warning(err))
                }

                carregarDados()
            }
            reader.readAsBinaryString(file)
        } catch (error) {
            toast.error("Erro ao importar planilha")
        }

        e.target.value = "" // Reset input
    }

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
    }

    const formatPeriodo = (dateStr) => {
        if (!dateStr) return "—"
        const d = new Date(dateStr)
        return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            {/* Header */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-emerald-100 dark:border-slate-800 px-8 py-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-emerald-100 rounded-xl">
                            <TrendingUp className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                Sell-Out
                            </h1>
                            <p className="text-slate-500 mt-1">Registro de vendas dos clientes ao consumidor final</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                            <Download className="w-4 h-4" />
                            Template
                        </Button>
                        <label>
                            <input type="file" accept=".xlsx,.xls" onChange={importarPlanilha} className="hidden" />
                            <Button variant="outline" className="gap-2 cursor-pointer" asChild>
                                <span>
                                    <Upload className="w-4 h-4" />
                                    Importar
                                </span>
                            </Button>
                        </label>
                    </div>
                </div>
            </motion.div>

            <div className="p-8 space-y-6">
                {/* Form Card */}
                <Card className="bg-white/60 backdrop-blur-sm border-emerald-100">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                            {editId ? "Editar Registro" : "Novo Lançamento"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-6 gap-4">
                            <div className="col-span-2">
                                <label className="text-sm font-medium text-slate-600 mb-1 block">Cliente</label>
                                <Select value={cliCodigo} onValueChange={setCliCodigo}>
                                    <SelectTrigger>
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
                                <label className="text-sm font-medium text-slate-600 mb-1 block">Indústria</label>
                                <Select value={forCodigo} onValueChange={setForCodigo}>
                                    <SelectTrigger>
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

                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1 block">Período</label>
                                <Input
                                    type="month"
                                    value={periodo}
                                    onChange={e => setPeriodo(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1 block">Valor (R$)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={valor}
                                    onChange={e => setValor(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-600 mb-1 block">Quantidade</label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={quantidade}
                                    onChange={e => setQuantidade(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                            <Button
                                onClick={salvar}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                {editId ? "Atualizar" : "Adicionar"}
                            </Button>
                            {editId && (
                                <Button variant="outline" onClick={limparForm}>
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <div className="flex gap-4">
                    <Select value={filtroCliente} onValueChange={(v) => { setFiltroCliente(v); }}>
                        <SelectTrigger className="w-64 bg-white">
                            <SelectValue placeholder="Filtrar por cliente" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todos os clientes</SelectItem>
                            {clientes.map(c => (
                                <SelectItem key={c.cli_codigo} value={c.cli_codigo.toString()}>
                                    {c.cli_nomred || c.cli_nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filtroIndustria} onValueChange={(v) => { setFiltroIndustria(v); }}>
                        <SelectTrigger className="w-64 bg-white">
                            <SelectValue placeholder="Filtrar por indústria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Todas as indústrias</SelectItem>
                            {industrias.map(i => (
                                <SelectItem key={i.for_codigo} value={i.for_codigo.toString()}>
                                    {i.for_nome}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button onClick={carregarDados} variant="outline">
                        Filtrar
                    </Button>
                </div>

                {/* Data Grid */}
                <Card className="bg-white/60 backdrop-blur-sm border-emerald-100">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : registros.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <TrendingUp className="w-12 h-12 mb-4" />
                                <p className="text-lg">Nenhum registro de Sell-Out</p>
                                <p className="text-sm">Use o formulário acima ou importe uma planilha</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-slate-50 sticky top-0">
                                    <tr className="text-xs text-slate-500 uppercase tracking-wide">
                                        <th className="text-left p-4 font-medium">Cliente</th>
                                        <th className="text-left p-4 font-medium">Indústria</th>
                                        <th className="text-left p-4 font-medium">Período</th>
                                        <th className="text-right p-4 font-medium">Valor</th>
                                        <th className="text-right p-4 font-medium">Qtde</th>
                                        <th className="text-center p-4 font-medium">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registros.map((reg, idx) => (
                                        <motion.tr
                                            key={reg.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="border-b border-slate-100 hover:bg-emerald-50/50 transition-colors"
                                        >
                                            <td className="p-4 font-medium text-slate-700">{reg.cli_nomred}</td>
                                            <td className="p-4 text-slate-600">{reg.for_nome}</td>
                                            <td className="p-4 text-slate-600">{formatPeriodo(reg.periodo)}</td>
                                            <td className="p-4 text-right text-emerald-700 font-semibold">{formatCurrency(reg.valor)}</td>
                                            <td className="p-4 text-right text-slate-600">{reg.quantidade}</td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button size="sm" variant="ghost" onClick={() => editar(reg)}>
                                                        <Pencil className="w-4 h-4 text-blue-600" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => excluir(reg.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
