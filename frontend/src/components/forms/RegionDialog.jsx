import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const RegionDialog = ({ open, onClose, regions, onSave }) => {
    const [selectedRegion, setSelectedRegion] = useState('');

    useEffect(() => {
        setSelectedRegion('');
    }, [open]);

    const handleSave = () => {
        if (!selectedRegion) {
            toast.error("Selecione uma região");
            return;
        }
        onSave({ vin_regiao: parseInt(selectedRegion) });
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-4 w-96 shadow-xl">
                <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                    Adicionar Região
                </h3>

                <div className="space-y-3">
                    <div>
                        <Label className="text-xs font-semibold">Região</Label>
                        <Select
                            value={selectedRegion}
                            onValueChange={(val) => setSelectedRegion(val)}
                        >
                            <SelectTrigger className="h-8 text-sm border-red-300">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]" container={document.body}>
                                {regions.map((region) => (
                                    <SelectItem key={region.reg_codigo} value={region.reg_codigo.toString()}>
                                        {region.reg_descricao}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex gap-2 mt-4 justify-end border-t pt-3">
                    <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs">
                        <X size={14} className="mr-1" />
                        Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="h-8 text-xs">
                        <Check size={14} className="mr-1" />
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RegionDialog;
