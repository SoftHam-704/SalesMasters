import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Users,
    Plus,
    Search,
    RefreshCw,
    Pencil,
    Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { toast } from "sonner";
import SellerForm from "../components/forms/SellerForm";

const FrmVendedores = () => {
    const [sellers, setSellers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

    const [selectedSeller, setSelectedSeller] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const fetchSellers = async (page = 1) => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search: searchTerm,
            });

            const response = await fetch(`http://localhost:3005/api/sellers?${query.toString()}`);
            if (!response.ok) throw new Error('Falha ao buscar dados');

            const result = await response.json();

            if (result.success) {
                setSellers(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Erro:", error);
            toast.error("Erro ao carregar vendedores: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchSellers(1);
        }, 300); // Debounce search
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleNew = () => {
        setSelectedSeller(null);
        setIsFormOpen(true);
    };

    const handleEdit = (seller) => {
        setSelectedSeller(seller);
        setIsFormOpen(true);
    };

    const handleSave = async (data) => {
        try {
            const method = data.ven_codigo ? 'PUT' : 'POST';
            const url = data.ven_codigo
                ? `http://localhost:3005/api/sellers/${data.ven_codigo}`
                : `http://localhost:3005/api/sellers`;

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao salvar');

            toast.success("Vendedor salvo com sucesso!");
            setIsFormOpen(false);
            fetchSellers(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    const handleDelete = async (seller) => {
        if (!window.confirm(`Tem certeza que deseja excluir o vendedor ${seller.ven_nome}?`)) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:3005/api/sellers/${seller.ven_codigo}`, {
                method: 'DELETE',
            });

            const result = await response.json();

            if (!response.ok) throw new Error(result.message || 'Erro ao excluir');

            toast.success("Vendedor excluído com sucesso!");
            fetchSellers(pagination.page);
        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
    };

    return (
        <div className="p-8 space-y-6 animate-fade-in">
            {isFormOpen && (
                <SellerForm
                    data={selectedSeller}
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
                        <span className="text-gradient">Vendedores</span>
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerencie sua equipe de vendedores
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleNew}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Novo Vendedor
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
                        placeholder="Buscar por nome, CPF ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 bg-background/50 border-white/10 focus:border-primary/50 transition-all font-medium"
                    />
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-primary"
                        onClick={() => fetchSellers(pagination.page)}
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
                                <TableHead className="w-[80px] text-primary font-bold">ID</TableHead>
                                <TableHead className="text-primary font-bold">Nome</TableHead>
                                <TableHead className="text-primary font-bold">Telefone</TableHead>
                                <TableHead className="text-primary font-bold">Usuário</TableHead>
                                <TableHead className="text-right text-primary font-bold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Carregando dados...
                                    </TableCell>
                                </TableRow>
                            ) : sellers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                        Nenhum vendedor encontrado.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                sellers.map((seller) => (
                                    <TableRow
                                        key={seller.ven_codigo}
                                        className="group hover:bg-white/5 border-white/5 transition-colors duration-200"
                                    >
                                        <TableCell className="font-mono text-sm text-muted-foreground">
                                            {seller.ven_codigo}
                                        </TableCell>
                                        <TableCell className="font-semibold text-foreground/90">
                                            {seller.ven_nome}
                                        </TableCell>
                                        <TableCell className="text-sm font-mono text-muted-foreground">
                                            {seller.ven_fone1 || '-'}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {seller.ven_nomeusu || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(seller)}
                                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    title="Editar"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(seller)}
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
                            onClick={() => fetchSellers(pagination.page - 1)}
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
                            onClick={() => fetchSellers(pagination.page + 1)}
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

export default FrmVendedores;
