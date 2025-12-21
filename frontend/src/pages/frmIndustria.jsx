import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Building2,
    Plus,
    Search,
    Filter,
    Download,
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

import { SupplierDialog } from "@/components/forms/SupplierDialog";

const FrmIndustria = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    // Helper to format CNPJ
    const formatCNPJ = (value) => {
        if (!value) return "";
        const raw = value.replace(/\D/g, '');
        if (raw.length === 14) {
            return raw.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
        }
        return value; // Return original if not valid 14 digits
    };
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const handleEdit = (supplier) => {
        setSelectedSupplier(supplier);
        setDialogOpen(true);
    };

    const handleNew = () => {
        setSelectedSupplier(null);
        setDialogOpen(true);
    };

    const handleSave = async (data) => {
        try {
            const isNew = !data.id;
            const url = isNew
                ? 'http://localhost:3005/api/suppliers'
                : `http://localhost:3005/api/suppliers/${data.id}`;

            const method = isNew ? 'POST' : 'PUT';

            // Map frontend fields back to database columns
            const payload = {
                for_nome: data.razaoSocial,
                for_nomered: data.nomeReduzido,
                for_endereco: data.endereco,
                for_bairro: data.bairro,
                for_cidade: data.cidade,
                for_uf: data.uf,
                for_cep: data.cep,
                for_fone: data.telefone,
                for_email: data.email,
                for_tipo2: data.situacao === "Ativo" ? 'A' : 'I',
                for_cgc: data.cnpj?.replace(/\D/g, ''), // Strip mask before saving
                for_inscricao: data.inscricao,
                for_fax: data.fax,
                for_obs2: data.obs2 || ''
                // Add other fields as they become available in the dialog
            };

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error("Erro ao salvar dados");

            toast.success(isNew ? "Fornecedor criado!" : "Fornecedor atualizado!");
            setDialogOpen(false);
            fetchSuppliers(); // Refresh table
        } catch (error) {
            console.error("Save error:", error);
            toast.error("Erro ao salvar: " + error.message);
        }
    };

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3005/api/suppliers');
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const data = await response.json();

            const adaptedData = (data.data || []).map(item => ({
                id: item.for_codigo,
                cnpj: item.for_cgc || '',
                razaoSocial: item.for_nome || '',
                nomeReduzido: item.for_nomered || '',
                inscricao: item.for_inscricao || '',
                endereco: item.for_endereco || '',
                bairro: item.for_bairro || '',
                cidade: item.for_cidade || '',
                uf: item.for_uf || '',
                cep: item.for_cep || '',
                telefone: item.for_fone || '',
                email: item.for_email || '',
                fax: item.for_fax || '',
                obs2: item.for_obs2 || '',
                situacao: item.for_tipo2 === 'A' ? "Ativo" : "Inativo",
                _original: item
            }));

            setSuppliers(adaptedData);
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar dados: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    // Filter Logic
    const filteredSuppliers = suppliers.filter((supplier) => {
        const term = (searchTerm || "").toLowerCase();
        const matchesSearch =
            (supplier.nomeReduzido || "").toLowerCase().includes(term) ||
            (supplier.razaoSocial || "").toLowerCase().includes(term) ||
            (supplier.cnpj || "").includes(term);
        const matchesStatus = showInactive ? true : supplier.situacao === "Ativo";
        return matchesSearch && matchesStatus;
    });

    const toggleStatus = async (supplier) => {
        try {
            const response = await fetch(`http://localhost:3005/api/suppliers/${supplier.id}/toggle-status`, {
                method: 'PATCH'
            });

            if (response.ok) {
                const newStatus = supplier.situacao === "Ativo" ? "Inativo" : "Ativo";
                setSuppliers(suppliers.map(s =>
                    s.id === supplier.id ? { ...s, situacao: newStatus } : s
                ));
                toast.success(newStatus === "Ativo" ? "Fornecedor ativado" : "Fornecedor desativado");
            } else {
                toast.error("Erro ao atualizar status");
            }
        } catch (error) {
            toast.error("Erro de conexão");
        }
    };

    const handleDelete = async (supplier) => {
        if (!window.confirm(`Tem certeza que deseja excluir o fornecedor ${supplier.razaoSocial}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/suppliers/${supplier.id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Erro ao excluir');

            toast.success("Fornecedor excluído com sucesso!");
            fetchSuppliers();
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            <SupplierDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                supplier={selectedSupplier}
                onSave={handleSave}
            />

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Building2 className="h-8 w-8 text-primary" />
                        <span className="text-gradient">Fornecedores</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie seus fornecedores e parceiros comerciais
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleNew}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Fornecedor
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
                        placeholder="Buscar por nome, razão social ou CNPJ..."
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

                    <Button variant="outline" size="sm" className="gap-2 hover:border-primary/50">
                        <Filter className="h-4 w-4" />
                        Filtros
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary"
                        onClick={fetchSuppliers}
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
                                <TableHead className="w-[180px] text-primary font-bold">CNPJ</TableHead>
                                <TableHead className="text-primary font-bold">Nome Reduzido</TableHead>
                                <TableHead className="min-w-[200px] text-primary font-bold">Razão Social</TableHead>
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
                            ) : filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                        Nenhum fornecedor encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <TableRow
                                        key={supplier.id}
                                        className={`
                                            group hover:bg-white/5 border-white/5 transition-colors duration-200
                                            ${supplier.situacao === "Inativo" ? "opacity-60" : ""}
                                        `}
                                    >
                                        <TableCell className="font-medium font-mono text-sm whitespace-nowrap">
                                            {formatCNPJ(supplier.cnpj)}
                                        </TableCell>
                                        <TableCell className="font-semibold text-orange-600">
                                            {supplier.nomeReduzido}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {supplier.razaoSocial}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {supplier.cidade}/{supplier.uf}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-muted-foreground">
                                            {supplier.telefone}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={supplier.situacao === "Ativo" ? "default" : "secondary"}
                                                className={`
                                                    ${supplier.situacao === "Ativo"
                                                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20"
                                                        : "bg-slate-500/15 text-slate-600 hover:bg-slate-500/25 border-slate-500/20"
                                                    }
                                                `}
                                            >
                                                {supplier.situacao}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(supplier)}
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(supplier)}
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
                </div>
            </motion.div>
        </div>
    );
};

export default FrmIndustria;
