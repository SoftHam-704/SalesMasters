import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function ClientAreasTab({ clientId }) {
    const [clientAreas, setClientAreas] = useState([]);
    const [availableAreas, setAvailableAreas] = useState([]);
    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [openCombobox, setOpenCombobox] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (clientId) {
            fetchClientAreas();
            fetchAvailableAreas();
        }
    }, [clientId]);

    const fetchClientAreas = async () => {
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/clients/${clientId}/areas`);
            const data = await res.json();
            setClientAreas(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar áreas do cliente.");
        }
    };

    const fetchAvailableAreas = async () => {
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/areas`);
            const data = await res.json();
            setAvailableAreas(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAddArea = async () => {
        if (!selectedAreaId) return;
        setLoading(true);
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/clients/${clientId}/areas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ areaId: selectedAreaId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Erro ao adicionar área');
            }

            toast.success("Área adicionada com sucesso!");
            setSelectedAreaId(null);
            fetchClientAreas();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (areaId) => {
        if (!window.confirm("Deseja remover esta área de atuação?")) return;
        try {
            const res = await fetch(`https://salesmasters.softham.com.br/api/clients/${clientId}/areas/${areaId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Erro ao remover área');

            toast.success("Área removida!");
            fetchClientAreas();
        } catch (error) {
            toast.error("Erro ao remover área.");
        }
    };

    return (
        <div className="space-y-6 p-4">
            <div className="flex items-end gap-4 bg-gray-50/50 p-4 rounded-lg border">
                <div className="flex flex-col gap-2 flex-1">
                    <Label>Adicionar Área de Atuação</Label>
                    <Select
                        value={selectedAreaId?.toString()}
                        onValueChange={(val) => setSelectedAreaId(parseInt(val))}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue placeholder="Selecione uma área..." />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                            {availableAreas.map(area => (
                                <SelectItem key={area.atu_id} value={area.atu_id.toString()}>
                                    {area.atu_descricao}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    onClick={handleAddArea}
                    disabled={!selectedAreaId || loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                    <Plus className="mr-2 h-4 w-4" /> Adicionar
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100/50">
                            <TableHead>Área de atuação</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientAreas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                                    Nenhuma área vinculada.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clientAreas.map((item) => (
                                <TableRow key={item.atu_atuaid}>
                                    <TableCell className="font-medium text-emerald-700 font-mono py-1">
                                        {item.atu_descricao}
                                    </TableCell>
                                    <TableCell className="text-right py-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(item.atu_atuaid)}
                                            className="h-6 w-6 p-0 hover:bg-red-50"
                                            title="Excluir"
                                        >
                                            <Trash2 className="h-3 w-3 text-red-600" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
