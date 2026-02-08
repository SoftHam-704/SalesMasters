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
import { NODE_API_URL, getApiUrl } from "../../utils/apiConfig";

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
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/clients/${clientId}/discounts`));
            if (!response.ok) throw new Error('Erro ao buscar descontos');
            const result = await response.json();
            setDiscounts(result.data || []);
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
                getApiUrl(NODE_API_URL, `/api/clients/${clientId}/discounts/${discount.cli_forcodigo}/${discount.cli_grupo}`),
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
        <div className="h-[320px] flex flex-col p-3">
            <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-sm text-emerald-800">Grupos de Desconto por Indústria</h3>
                <Button
                    onClick={handleAdd}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs px-4"
                >
                    <Plus className="w-3.5 h-3.5 mr-2" />
                    Adicionar
                </Button>
            </div>

            <div className="flex-1 overflow-auto bg-white/5 border rounded-lg shadow-inner">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">Carregando...</div>
                ) : discounts.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground text-sm">
                        Nenhum grupo de desconto encontrado.
                    </div>
                ) : (
                    <Table>
                        <TableHeader className="sticky top-0 bg-slate-50 z-10">
                            <TableRow>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Grupo</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Indústria</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 1</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 2</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 3</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 4</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 5</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 6</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 7</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 8</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-center">Desc 9</TableHead>
                                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right w-24">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discounts.map((discount, index) => (
                                <TableRow key={index} className="hover:bg-slate-50 border-b border-slate-100">
                                    <TableCell className="text-xs font-semibold py-2.5 text-slate-700">
                                        {discount.grupo_nome || ''}
                                    </TableCell>
                                    <TableCell className="text-xs text-emerald-600 font-bold py-2.5">
                                        {discount.industria_nome}
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc1 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc2 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc3 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc4 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc5 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc6 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc7 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc8 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs text-center py-2.5 font-medium text-slate-600">
                                        {(discount.cli_desc9 || 0).toFixed(2)}%
                                    </TableCell>
                                    <TableCell className="text-xs py-2.5">
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(discount)}
                                                className="h-8 w-8 p-0 hover:bg-blue-50 transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil className="h-3.5 w-3.5 text-blue-600" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDelete(discount)}
                                                className="h-8 w-8 p-0 hover:bg-red-50 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-3.5 w-3.5 text-red-600" />
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
