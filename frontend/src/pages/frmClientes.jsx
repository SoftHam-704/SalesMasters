import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, Plus, Filter,
    RefreshCw, UserPlus, SlidersHorizontal,
    LayoutGrid, List as ListIcon,
    Sparkles, Target
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import ClientForm from "../components/forms/ClientForm";
import ClientCard from "../components/clients/ClientCard";
import { NODE_API_URL, getApiUrl } from '../utils/apiConfig';
import { cn } from "@/lib/utils";

const FrmClientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
    const [statusFilter, setStatusFilter] = useState("true"); // 'true' = Ativos, 'false' = Inativos, 'all' = Todos

    const [selectedClient, setSelectedClient] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [viewMode, setViewMode] = useState("grid"); // grid or list

    const fetchClients = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '12',
                search: searchTerm,
                active: statusFilter
            });

            const url = getApiUrl(NODE_API_URL, `/api/clients?${query.toString()}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success) {
                setClients(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar clientes: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients(1);
    }, [statusFilter]);

    const handleSearch = () => fetchClients(1);
    const handleKeyPress = (e) => { if (e.key === 'Enter') handleSearch(); };

    const handleNew = () => {
        setSelectedClient(null);
        setIsFormOpen(true);
    };

    const handleSave = async (clientData) => {
        setLoading(true);
        try {
            const method = selectedClient ? 'PUT' : 'POST';
            const url = selectedClient
                ? getApiUrl(NODE_API_URL, `/api/clients/${selectedClient.cli_codigo}`)
                : getApiUrl(NODE_API_URL, '/api/clients');

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData)
            });

            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                setIsFormOpen(false);
                fetchClients(pagination.page);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao salvar: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (row) => {
        if (!confirm(`Deseja realmente excluir o cliente ${row.cli_nomred}?`)) return;

        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, `/api/clients/${row.cli_codigo}`);
            const response = await fetch(url, {
                method: 'DELETE'
            });
            const result = await response.json();

            if (result.success) {
                toast.success(result.message);
                fetchClients(pagination.page);
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao excluir: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#f5f5f5] transition-colors duration-500 overflow-hidden">
            {/* Header Section */}
            <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="p-6 border-b border-slate-200 bg-white z-20"
            >
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                                Base de <span className="text-emerald-600">Clientes</span>
                            </h1>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px] font-black py-0">CRM ACTIVE</Badge>
                        </div>
                        <p className="text-slate-400 mt-1 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest font-black">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                            {pagination.total} PDVS CADASTRADOS NA BASE
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative group">
                            <div className="relative flex items-center bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all duration-300">
                                <Search className="h-4 w-4 text-slate-400 mr-3" />
                                <input
                                    placeholder="BUSCAR PDV POR NOME, CNPJ OU ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="bg-transparent border-0 outline-none p-0 text-slate-800 placeholder:text-slate-400 text-[11px] font-black uppercase tracking-wider w-80"
                                />
                            </div>
                        </div>

                        {/* Status Filters - White Aesthetic */}
                        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                            {[
                                { id: 'true', label: 'Vigentes' },
                                { id: 'false', label: 'Suspensos' },
                                { id: 'all', label: 'Todos' }
                            ].map((filter) => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={cn(
                                        "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                        statusFilter === filter.id
                                            ? "bg-white text-emerald-600 shadow-sm border border-slate-200"
                                            : "text-slate-400 hover:text-slate-500"
                                    )}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleNew}
                            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-sm"
                        >
                            <UserPlus size={16} />
                            Novo Cliente
                        </motion.button>
                    </div>
                </div>

                {/* Sub-Filters / Stats bar */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-emerald-500/50" />
                            <span className="text-[10px] font-bold text-emerald-500/40 uppercase tracking-widest">Segmentação:</span>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/60 text-[9px]">VAREJO</Badge>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/60 text-[9px]">ATACADO</Badge>
                            <Badge variant="outline" className="border-emerald-500/20 text-emerald-400/60 text-[9px] bg-emerald-500/5">POSITIVAR</Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchClients(pagination.page)}
                            className="p-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-200" />
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn("p-1.5 rounded-md transition-all font-black", viewMode === "grid" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400")}
                            >
                                <LayoutGrid size={14} />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn("p-1.5 rounded-md transition-all font-black", viewMode === "list" ? "bg-white shadow-sm text-emerald-600" : "text-slate-400")}
                            >
                                <ListIcon size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Content Area */}
            <ScrollArea className="flex-1 p-6 custom-scrollbar">
                {loading && clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-4">
                        <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-emerald-500/40 uppercase tracking-[0.3em] animate-pulse">Sincronizando PDVs...</p>
                    </div>
                ) : clients.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-40 space-y-6">
                        <div className="p-10 rounded-full bg-emerald-500/5 border border-emerald-500/10">
                            <Users className="w-20 h-20 text-emerald-500/10" />
                        </div>
                        <div className="text-center">
                            <p className="text-emerald-500 font-black uppercase tracking-[0.2em]">Nenhum PDV Localizado</p>
                            <p className="text-emerald-500/30 text-[10px] mt-2 uppercase">Ajuste os filtros de busca tática ou cadastre novo</p>
                        </div>
                    </div>
                ) : (
                    <div className={cn(
                        "pb-20",
                        viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6" : "space-y-4"
                    )}>
                        <AnimatePresence>
                            {clients.map((client, index) => (
                                <ClientCard
                                    key={client.cli_codigo}
                                    client={client}
                                    index={index}
                                    onEdit={(row) => { setSelectedClient(row); setIsFormOpen(true); }}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                )}

                {/* Pagination (Simplified for now) */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 py-8">
                        <Button
                            variant="outline"
                            onClick={() => fetchClients(pagination.page - 1)}
                            disabled={pagination.page === 1}
                            className="bg-black/40 border-emerald-500/20 text-emerald-400 text-xs"
                        >
                            Anterior
                        </Button>
                        <span className="text-xs font-mono text-emerald-500/60 uppercase">Página {pagination.page} de {pagination.totalPages}</span>
                        <Button
                            variant="outline"
                            onClick={() => fetchClients(pagination.page + 1)}
                            disabled={pagination.page === pagination.totalPages}
                            className="bg-black/40 border-emerald-500/20 text-emerald-400 text-xs"
                        >
                            Próxima
                        </Button>
                    </div>
                )}
            </ScrollArea>

            {/* Modals and Overlays */}
            <ClientForm
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                data={selectedClient}
                onSave={handleSave}
            />

            {/* FAB for Mobile/Quick access */}
            <motion.button
                whileHover={{ scale: 1.1, translateY: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNew}
                className="fixed bottom-8 right-8 z-50 w-16 h-16 bg-emerald-500 text-black rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] flex flex-col items-center justify-center group lg:hidden"
            >
                <Plus className="w-8 h-8 relative z-10" />
            </motion.button>
        </div>
    );
};

export default FrmClientes;
