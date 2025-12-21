import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Plus,
    Search,
    Filter,
    RefreshCw,
    MoreVertical,
    Pencil,
    ShieldCheck,
    ShieldAlert,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ClientForm from "../components/forms/ClientForm";

const FrmClientes = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [selectedClient, setSelectedClient] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Format helpers
    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = value.replace(/\D/g, '');
        if (raw.length === 11) { // CPF
            return raw.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
        }
        if (raw.length === 14) { // CNPJ
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        return value;
    };

    const fetchClients = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm,
            });

            if (!showInactive) {
                query.append('active', 'true');
            }

            const response = await fetch(`http://localhost:3005/api/clients?${query.toString()}`);
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
        const timeoutId = setTimeout(() => {
            fetchClients(1);
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchTerm, showInactive]);

    const handleNew = () => {
        setSelectedClient(null);
        setIsFormOpen(true);
    };

    const handleEdit = (client) => {
        setSelectedClient(client);
        setIsFormOpen(true);
    };

    const handleSave = async (data) => {
        try {
            const method = data.cli_codigo ? 'PUT' : 'POST';
            const url = data.cli_codigo
                ? `http://localhost:3005/api/clients/${data.cli_codigo}`
                : `http://localhost:3005/api/clients`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao salvar');

            toast.success("Cliente salvo com sucesso!");
            setIsFormOpen(false);
            fetchClients(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (client) => {
        if (!window.confirm(`Tem certeza que deseja excluir o cliente ${client.cli_nome}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/clients/${client.cli_codigo}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao excluir');

            toast.success("Cliente excluído com sucesso!");
            fetchClients(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            {isFormOpen && (
                <ClientForm
                    data={selectedClient}
                    onClose={() => setIsFormOpen(false)}
                    onSave={handleSave}
                />
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <span className="text-gradient">Clientes</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie sua base de clientes
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleNew}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Cliente
                    </Button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between"
            >
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por nome, fantasia ou CNPJ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex items-center space-x-2 bg-background/30 px-3 py-2 rounded-lg border border-white/5">
                        <Checkbox
                            id="inactive"
                            checked={showInactive}
                            onCheckedChange={setShowInactive}
                        />
                        <Label htmlFor="inactive" className="text-sm font-medium cursor-pointer">
                            Mostrar inativos
                        </Label>
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary"
                        onClick={() => fetchClients(pagination.page)}
                        disabled={loading}
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-xl border border-white/10 shadow-xl overflow-hidden"
            >
                <div className="p-1">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-white/5 border-white/10">
                                <TableHead className="w-[80px] text-primary font-bold">Cód</TableHead>
                                <TableHead className="w-[180px] text-primary font-bold">CPF/CNPJ</TableHead>
                                <TableHead className="text-primary font-bold">Nome Reduzido</TableHead>
                                <TableHead className="text-primary font-bold">Razão Social / Nome</TableHead>
                                <TableHead className="text-primary font-bold">Cidade/UF</TableHead>
                                <TableHead className="text-primary font-bold">Telefone</TableHead>
                                <TableHead className="text-center text-primary font-bold">Situação</TableHead>
                                <TableHead className="text-right text-primary font-bold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Carregando dados...
                                    </TableCell>
                                </TableRow>
                            ) : clients.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Nenhum cliente encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                clients.map((client) => (
                                    <TableRow
                                        key={client.cli_codigo}
                                        className={`
                                            group hover:bg-white/5 border-white/5 transition-colors duration-200
                                            ${client.cli_tipopes === 'I' ? "opacity-60" : ""}
                                        `}
                                    >
                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                            {client.cli_codigo}
                                        </TableCell>
                                        <TableCell className="font-medium font-mono text-sm whitespace-nowrap">
                                            {formatCNPJ(client.cli_cnpj)}
                                        </TableCell>
                                        <TableCell className="font-semibold text-orange-500">
                                            {client.cli_nomred}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground/90">
                                            {client.cli_nome}
                                            {client.cli_fantasia && client.cli_fantasia !== client.cli_nome && (
                                                <div className="text-xs text-muted-foreground font-normal">
                                                    {client.cli_fantasia}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {client.cli_cidade}/{client.cli_uf}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-muted-foreground">
                                            {client.cli_fone1}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={client.cli_tipopes === 'A' ? "default" : "secondary"}
                                                className={`
                                                    ${client.cli_tipopes === 'A'
                                                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20"
                                                        : "bg-slate-500/15 text-slate-600 hover:bg-slate-500/25 border-slate-500/20"
                                                    }
                                                `}
                                            >
                                                {client.cli_tipopes === 'A' ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(client)}
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(client)}
                                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Simple Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4 px-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchClients(pagination.page - 1)}
                            disabled={pagination.page <= 1 || loading}
                        >
                            Anterior
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Página {pagination.page} de {pagination.totalPages}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchClients(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages || loading}
                        >
                            Próxima
                        </Button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default FrmClientes;
