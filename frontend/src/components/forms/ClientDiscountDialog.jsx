import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { NODE_API_URL, getApiUrl } from "../../utils/apiConfig";

export function ClientDiscountDialog({
    isOpen,
    onClose,
    clientId,
    discount = null,
    onSave
}) {
    const [suppliers, setSuppliers] = useState([]);
    const [groups, setGroups] = useState([]);
    const [formData, setFormData] = useState({
        cli_forcodigo: "",
        cli_grupo: "",
        cli_desc1: 0,
        cli_desc2: 0,
        cli_desc3: 0,
        cli_desc4: 0,
        cli_desc5: 0,
        cli_desc6: 0,
        cli_desc7: 0,
        cli_desc8: 0,
        cli_desc9: 0,
    });

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            fetchGroups();
            if (discount) {
                setFormData({
                    cli_forcodigo: discount.cli_forcodigo?.toString() || "",
                    cli_grupo: discount.cli_grupo?.toString() || "",
                    cli_desc1: discount.cli_desc1 || 0,
                    cli_desc2: discount.cli_desc2 || 0,
                    cli_desc3: discount.cli_desc3 || 0,
                    cli_desc4: discount.cli_desc4 || 0,
                    cli_desc5: discount.cli_desc5 || 0,
                    cli_desc6: discount.cli_desc6 || 0,
                    cli_desc7: discount.cli_desc7 || 0,
                    cli_desc8: discount.cli_desc8 || 0,
                    cli_desc9: discount.cli_desc9 || 0,
                });
            } else {
                setFormData({
                    cli_forcodigo: "",
                    cli_grupo: "",
                    cli_desc1: 0,
                    cli_desc2: 0,
                    cli_desc3: 0,
                    cli_desc4: 0,
                    cli_desc5: 0,
                    cli_desc6: 0,
                    cli_desc7: 0,
                    cli_desc8: 0,
                    cli_desc9: 0,
                });
            }
        }
    }, [isOpen, discount]);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/suppliers?active=true&limit=1000'));
            const data = await response.json();
            if (data.success) {
                setSuppliers(data.data);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    };

    const fetchGroups = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/discount-groups'));
            const data = await response.json();
            console.log('Groups fetched:', data); // Debug
            setGroups(data.data || []);
        } catch (error) {
            console.error('Error fetching groups:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.cli_forcodigo || !formData.cli_grupo) {
            toast.error('Selecione a indústria e o grupo');
            return;
        }

        try {
            const url = getApiUrl(NODE_API_URL, `/api/clients/${clientId}/discounts`);

            const method = 'POST'; // My backend uses POST with ON CONFLICT DO UPDATE

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cli_forcodigo: parseInt(formData.cli_forcodigo),
                    cli_grupo: parseInt(formData.cli_grupo),
                    cli_codigo: clientId,
                }),
            });

            if (!response.ok) throw new Error('Erro ao salvar desconto');

            toast.success(discount ? 'Desconto atualizado com sucesso!' : 'Desconto adicionado com sucesso!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving discount:', error);
            toast.error('Erro ao salvar desconto');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-slate-800">
                        {discount ? 'Editar Desconto' : 'Adicionar Desconto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Supplier and Group Selects */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Indústria:</Label>
                            <Select
                                value={formData.cli_forcodigo}
                                onValueChange={(val) => setFormData({ ...formData, cli_forcodigo: val })}
                            >
                                <SelectTrigger className="h-10 text-sm bg-yellow-50/50 border-yellow-100 shadow-sm">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.for_codigo} value={supplier.for_codigo.toString()} className="text-sm py-2">
                                            {supplier.for_nomered}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold text-slate-700">Grupo:</Label>
                            <Select
                                value={formData.cli_grupo}
                                onValueChange={(val) => setFormData({ ...formData, cli_grupo: val })}
                            >
                                <SelectTrigger className="h-10 text-sm bg-slate-50 border-slate-200 shadow-sm">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {groups.map((group) => (
                                        <SelectItem key={group.id} value={group.id.toString()} className="text-sm py-2">
                                            {group.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Discount Inputs - Título */}
                    <div className="pt-2">
                        <Label className="text-xs font-semibold">Descontos</Label>
                    </div>

                    {/* Discount Inputs Grid */}
                    <div className="grid grid-cols-9 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <div key={num} className="space-y-1.5">
                                <Label className="text-[11px] font-bold text-center block text-slate-500">{num}º</Label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData[`cli_desc${num}`]}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                [`cli_desc${num}`]: parseFloat(e.target.value) || 0,
                                            });
                                        }}
                                        className="h-10 text-xs font-bold text-center pr-6 bg-white border-slate-200"
                                    />
                                    <span className="absolute right-1.5 text-[10px] top-1/2 -translate-y-1/2 text-slate-400 font-extrabold">
                                        %
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-6 text-sm font-bold shadow-lg shadow-emerald-200"
                        >
                            <Check className="w-4 h-4 mr-2" />
                            Salvar Alterações
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-10 px-6 text-sm font-semibold border-slate-200 text-slate-600"
                        >
                            <X className="w-4 h-4 mr-2" />
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
