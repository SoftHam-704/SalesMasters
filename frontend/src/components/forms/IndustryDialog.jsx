import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
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

const IndustryDialog = ({ open, onClose, industry, suppliers, onSave }) => {
    const [formData, setFormData] = useState({
        vin_industria: '',
        vin_percom: 0
    });

    useEffect(() => {
        if (industry) {
            setFormData({
                vin_industria: industry.vin_industria,
                vin_percom: industry.vin_percom || 0
            });
        } else {
            setFormData({ vin_industria: '', vin_percom: 0 });
        }
    }, [industry]);

    const handleSave = () => {
        if (!formData.vin_industria) {
            toast.error("Selecione uma indústria");
            return;
        }
        onSave(formData);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
            <div className="bg-white rounded-lg p-4 w-96 shadow-xl">
                <h3 className="text-sm font-semibold mb-3 border-b pb-2">
                    {industry ? 'Editar Indústria' : 'Adicionar Indústria'}
                </h3>

                <div className="space-y-3">
                    <div>
                        <Label className="text-xs font-semibold">Indústria</Label>
                        <Select
                            value={formData.vin_industria?.toString()}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, vin_industria: parseInt(val) }))}
                            disabled={!!industry}
                        >
                            <SelectTrigger className="h-8 text-sm border-red-300">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]">
                                {suppliers.map((sup) => (
                                    <SelectItem key={sup.for_codigo} value={sup.for_codigo.toString()}>
                                        {sup.for_nomered}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-xs">(%) Comissão</Label>
                        <Input
                            type="text"
                            value={formData.vin_percom.toFixed(2)}
                            onChange={(e) => {
                                const value = e.target.value.replace(',', '.');
                                const num = parseFloat(value);
                                if (!isNaN(num)) {
                                    setFormData(prev => ({ ...prev, vin_percom: num }));
                                } else if (value === '' || value === '.') {
                                    setFormData(prev => ({ ...prev, vin_percom: 0 }));
                                }
                            }}
                            onBlur={(e) => {
                                // Format to 2 decimal places on blur
                                const num = parseFloat(e.target.value.replace(',', '.')) || 0;
                                setFormData(prev => ({ ...prev, vin_percom: parseFloat(num.toFixed(2)) }));
                            }}
                            className="h-8 text-sm text-right"
                            placeholder="0,00"
                        />
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

export default IndustryDialog;
