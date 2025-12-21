import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ClientDiscountDialog } from "./ClientDiscountDialog";

export function ClientDiscountsTab({ clientId }) {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedDiscount, setSelectedDiscount] = useState(null);

    useEffect(() => {
        if (clientId) {
            fetchDiscounts();
        }
    }, [clientId]);

    const fetchDiscounts = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3005/api/clients/${clientId}/discounts`);
            if (!response.ok) throw new Error('Erro ao buscar descontos');
            const data = await response.json();
            setDiscounts(data);
        } catch (error) {
            console.error('Error fetching discounts:', error);
            toast.error('Erro ao carregar grupos de desconto');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = () => {
        setSelectedDiscount(null);
        setDialogOpen(true);
    };

    const handleEdit = (discount) => {
        setSelectedDiscount(discount);
        setDialogOpen(true);
    };

    const handleDelete = async (discount) => {
        if (!confirm('Deseja realmente excluir este grupo de desconto?')) return;

        try {
            const response = await fetch(
                `http://localhost:3005/api/clients/${clientId}/discounts/${discount.cli_forcodigo}/${discount.cli_grupo}`,
                { method: 'DELETE' }
            );

            if (!response.ok) throw new Error('Erro ao excluir desconto');

            toast.success('Desconto excluído com sucesso!');
            fetchDiscounts();
        } catch (error) {
            console.error('Error deleting discount:', error);
            toast.error('Erro ao excluir desconto');
        }
    };

    const handleSave = () => {
        fetchDiscounts();
    };

    if (!clientId) {
        return (
            <div className="p-4 text-center text-muted-foreground">
                Salve o cliente primeiro para gerenciar grupos de desconto.
            </div>
        );
    }

    return (
        <div className="h-[280px] flex flex-col p-2">
            <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-[10px] text-emerald-800">Grupos de Desconto por Indústria</h3>
                <Button
                    onClick={handleAdd}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-6 text-[10px] px-2"
                >
                    <Plus className="w-3 h-3 mr-1" />
                    Adicionar
                </Button>
            </div>

            <div className="flex-1 overflow-auto bg-white/5 border rounded">
                {loading ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">Carregando...</div>
                ) : discounts.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-xs">
                        Nenhum grupo de desconto encontrado.
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted/20">
                            <TableRow>
                                <TableHead className="text-[9px] font-semibold">Grupo</TableHead>
                                <TableHead className="text-[9px] font-semibold">Indústria</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 1</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 2</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 3</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 4</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 5</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 6</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 7</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 8</TableHead>
                                <TableHead className="text-[9px] font-semibold text-center">Desc 9</TableHead>
                                <TableHead className="text-[9px] font-semibold text-right w-20">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discounts.map((discount, index) => (
                                <TableRow key={index} className="hover:bg-white/5">
                                    <TableCell className="text-[10px] font-medium py-1">
                                        {discount.grupo_nome || ''}
                                    </TableCell>
                                    <TableCell className="text-[10px] text-emerald-600 py-1">
                                        {discount.industria}
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc1 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc2 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc3 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc4 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc5 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc6 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc7 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc8 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] text-center py-1">
                                        {(discount.cli_desc9 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-[10px] py-1">
                                        <div className="flex gap-1 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(discount)}
                                                className="h-6 w-6 p-0 hover:bg-blue-50"
                                                title="Editar"
                                            >
                                                <Pencil className="h-3 w-3 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(discount)}
                                                className="h-6 w-6 p-0 hover:bg-red-50"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-3 w-3 text-red-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <ClientDiscountDialog
                isOpen={dialogOpen}
                onClose={() => setDialogOpen(false)}
                clientId={clientId}
                discount={selectedDiscount}
                onSave={handleSave}
            />
        </div>
    );
}
