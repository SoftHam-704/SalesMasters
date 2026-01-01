import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import axios from "@/lib/axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, Phone, MessageSquare, Target, Settings } from "lucide-react"

// ==================== TIPOS DE INTERAÇÃO ====================
function TiposInteracao() {
    const [lista, setLista] = useState([])
    const [descricao, setDescricao] = useState("")
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)

    const carregar = async () => {
        try {
            const res = await axios.get("/crm/tipos")
            setLista(res.data.data || [])
        } catch (error) {
            toast.error("Erro ao carregar tipos")
        }
    }

    const salvar = async () => {
        if (!descricao.trim()) {
            toast.error("Descrição é obrigatória")
            return
        }
        setLoading(true)
        try {
            if (editId) {
                await axios.put(`/crm/tipos/${editId}`, { descricao })
                toast.success("Tipo atualizado!")
            } else {
                await axios.post("/crm/tipos", { descricao })
                toast.success("Tipo adicionado!")
            }
            setDescricao("")
            setEditId(null)
            carregar()
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar")
        } finally {
            setLoading(false)
        }
    }

    const editar = (item) => {
        setDescricao(item.descricao)
        setEditId(item.id)
    }

    const excluir = async (id) => {
        try {
            await axios.delete(`/crm/tipos/${id}`)
            toast.success("Tipo removido!")
            carregar()
        } catch (error) {
            toast.error("Erro ao remover")
        }
    }

    useEffect(() => { carregar() }, [])

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Descrição do tipo"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && salvar()}
                    className="flex-1"
                />
                <Button
                    onClick={salvar}
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {editId ? "Atualizar" : "Adicionar"}
                </Button>
                {editId && (
                    <Button variant="outline" onClick={() => { setEditId(null); setDescricao("") }}>
                        Cancelar
                    </Button>
                )}
            </div>

            <div className="border rounded-lg divide-y bg-white/60 backdrop-blur-sm">
                {lista.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">Nenhum tipo cadastrado</p>
                ) : (
                    lista.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 flex items-center justify-between hover:bg-purple-50/50 transition-colors"
                        >
                            <span className="font-medium text-slate-700">{item.descricao}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => editar(item)}>
                                    <Pencil className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => excluir(item.id)}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}

// ==================== CANAIS ====================
function CanaisCRM() {
    const [lista, setLista] = useState([])
    const [descricao, setDescricao] = useState("")
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)

    const carregar = async () => {
        try {
            const res = await axios.get("/crm/canais")
            setLista(res.data.data || [])
        } catch (error) {
            toast.error("Erro ao carregar canais")
        }
    }

    const salvar = async () => {
        if (!descricao.trim()) {
            toast.error("Descrição é obrigatória")
            return
        }
        setLoading(true)
        try {
            if (editId) {
                await axios.put(`/crm/canais/${editId}`, { descricao })
                toast.success("Canal atualizado!")
            } else {
                await axios.post("/crm/canais", { descricao })
                toast.success("Canal adicionado!")
            }
            setDescricao("")
            setEditId(null)
            carregar()
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar")
        } finally {
            setLoading(false)
        }
    }

    const editar = (item) => {
        setDescricao(item.descricao)
        setEditId(item.id)
    }

    const excluir = async (id) => {
        try {
            await axios.delete(`/crm/canais/${id}`)
            toast.success("Canal removido!")
            carregar()
        } catch (error) {
            toast.error("Erro ao remover")
        }
    }

    useEffect(() => { carregar() }, [])

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Descrição do canal"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && salvar()}
                    className="flex-1"
                />
                <Button
                    onClick={salvar}
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {editId ? "Atualizar" : "Adicionar"}
                </Button>
                {editId && (
                    <Button variant="outline" onClick={() => { setEditId(null); setDescricao("") }}>
                        Cancelar
                    </Button>
                )}
            </div>

            <div className="border rounded-lg divide-y bg-white/60 backdrop-blur-sm">
                {lista.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">Nenhum canal cadastrado</p>
                ) : (
                    lista.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
                        >
                            <span className="font-medium text-slate-700">{item.descricao}</span>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => editar(item)}>
                                    <Pencil className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => excluir(item.id)}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}

// ==================== RESULTADOS ====================
function ResultadosCRM() {
    const [lista, setLista] = useState([])
    const [descricao, setDescricao] = useState("")
    const [ordem, setOrdem] = useState(0)
    const [editId, setEditId] = useState(null)
    const [loading, setLoading] = useState(false)

    const carregar = async () => {
        try {
            const res = await axios.get("/crm/resultados")
            setLista(res.data.data || [])
        } catch (error) {
            toast.error("Erro ao carregar resultados")
        }
    }

    const salvar = async () => {
        if (!descricao.trim()) {
            toast.error("Descrição é obrigatória")
            return
        }
        setLoading(true)
        try {
            if (editId) {
                await axios.put(`/crm/resultados/${editId}`, { descricao, ordem })
                toast.success("Resultado atualizado!")
            } else {
                await axios.post("/crm/resultados", { descricao, ordem })
                toast.success("Resultado adicionado!")
            }
            setDescricao("")
            setOrdem(0)
            setEditId(null)
            carregar()
        } catch (error) {
            toast.error(error.response?.data?.message || "Erro ao salvar")
        } finally {
            setLoading(false)
        }
    }

    const editar = (item) => {
        setDescricao(item.descricao)
        setOrdem(item.ordem || 0)
        setEditId(item.id)
    }

    const excluir = async (id) => {
        try {
            await axios.delete(`/crm/resultados/${id}`)
            toast.success("Resultado removido!")
            carregar()
        } catch (error) {
            toast.error("Erro ao remover")
        }
    }

    useEffect(() => { carregar() }, [])

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <Input
                    placeholder="Descrição do resultado"
                    value={descricao}
                    onChange={e => setDescricao(e.target.value)}
                    className="flex-1"
                />
                <Input
                    type="number"
                    placeholder="Ordem"
                    value={ordem}
                    onChange={e => setOrdem(Number(e.target.value))}
                    className="w-24"
                />
                <Button
                    onClick={salvar}
                    disabled={loading}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {editId ? "Atualizar" : "Adicionar"}
                </Button>
                {editId && (
                    <Button variant="outline" onClick={() => { setEditId(null); setDescricao(""); setOrdem(0) }}>
                        Cancelar
                    </Button>
                )}
            </div>

            <div className="border rounded-lg divide-y bg-white/60 backdrop-blur-sm">
                {lista.length === 0 ? (
                    <p className="p-4 text-center text-slate-500">Nenhum resultado cadastrado</p>
                ) : (
                    lista.map(item => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700">
                                    {item.ordem || 0}
                                </span>
                                <span className="font-medium text-slate-700">{item.descricao}</span>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="ghost" onClick={() => editar(item)}>
                                    <Pencil className="w-4 h-4 text-blue-600" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => excluir(item.id)}>
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}

// ==================== MAIN SETTINGS PAGE ====================
export default function CRMSettings() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-purple-100 dark:border-slate-800 px-8 py-6"
            >
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-100 rounded-xl">
                        <Settings className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Configurações do CRM
                        </h1>
                        <p className="text-slate-500 mt-1">Gerenciar tipos de interação, canais e resultados</p>
                    </div>
                </div>
            </motion.div>

            <div className="p-8">
                <Card className="bg-white/60 backdrop-blur-sm border-purple-100">
                    <CardContent className="p-6">
                        <Tabs defaultValue="tipos" className="w-full">
                            <TabsList className="grid w-full grid-cols-3 mb-6">
                                <TabsTrigger value="tipos" className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" />
                                    Tipos de Interação
                                </TabsTrigger>
                                <TabsTrigger value="canais" className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    Canais
                                </TabsTrigger>
                                <TabsTrigger value="resultados" className="flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Resultados
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="tipos">
                                <TiposInteracao />
                            </TabsContent>

                            <TabsContent value="canais">
                                <CanaisCRM />
                            </TabsContent>

                            <TabsContent value="resultados">
                                <ResultadosCRM />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
