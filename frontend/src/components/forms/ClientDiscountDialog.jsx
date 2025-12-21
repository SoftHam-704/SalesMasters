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
            const response = await fetch('http://localhost:3005/api/suppliers?active=true&limit=1000');
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
            const response = await fetch('http://localhost:3005/api/discount-groups');
            const data = await response.json();
            console.log('Groups fetched:', data); // Debug
            setGroups(data);
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
            const url = discount
                ? `http://localhost:3005/api/clients/${clientId}/discounts/${discount.cli_forcodigo}/${discount.cli_grupo}`
                : `http://localhost:3005/api/clients/${clientId}/discounts`;

            const method = discount ? 'PUT' : 'POST';

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
                    <DialogTitle className="text-base">
                        {discount ? 'Editar Desconto' : 'Adicionar Desconto'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Supplier and Group Selects */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Indústria:</Label>
                            <Select
                                value={formData.cli_forcodigo}
                                onValueChange={(val) => setFormData({ ...formData, cli_forcodigo: val })}
                            >
                                <SelectTrigger className="h-8 text-xs bg-yellow-50">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.for_codigo} value={supplier.for_codigo.toString()} className="text-xs">
                                            {supplier.for_nomered}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs">Grupo:</Label>
                            <Select
                                value={formData.cli_grupo}
                                onValueChange={(val) => setFormData({ ...formData, cli_grupo: val })}
                            >
                                <SelectTrigger className="h-8 text-xs bg-gray-100">
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent className="z-[9999]">
                                    {groups.map((group) => (
                                        <SelectItem key={group.gru_codigo} value={group.gru_codigo.toString()} className="text-xs">
                                            {group.gru_nome}
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
                            <div key={num} className="space-y-1">
                                <Label className="text-[10px] text-center block text-gray-600">{num}º</Label>
                                <div className="relative">
                                    <Input
                                        type="text"
                                        value={formData[`cli_desc${num}`].toFixed(2)}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                                            setFormData({
                                                ...formData,
                                                [`cli_desc${num}`]: parseFloat(val) || 0,
                                            });
                                        }}
                                        className="h-8 text-[11px] text-center pr-6"
                                    />
                                    <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none">
                                        %
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 pt-3 border-t">
                        <Button
                            type="submit"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs"
                        >
                            <Check className="w-3.5 h-3.5 mr-1.5" />
                            Salvar
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onClose}
                            className="h-8 text-xs"
                        >
                            <X className="w-3.5 h-3.5 mr-1.5" />
                            Cancelar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
