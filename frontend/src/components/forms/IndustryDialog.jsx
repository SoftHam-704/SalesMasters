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

    const [displayComissao, setDisplayComissao] = useState('0,00');

    useEffect(() => {
        if (industry) {
            const value = industry.vin_percom || 0;
            setFormData({
                vin_industria: industry.vin_industria,
                vin_percom: value
            });
            setDisplayComissao(value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
            setFormData({ vin_industria: '', vin_percom: 0 });
            setDisplayComissao('0,00');
        }
    }, [industry]);

    const handleComissaoChange = (e) => {
        let value = e.target.value;
        
        // Remove tudo que não é dígito
        const numeric = value.replace(/\D/g, '');
        
        // Converte para decimal (divindo por 100 para tratar como centavos)
        const numValue = parseFloat(numeric) / 100;
        
        if (!isNaN(numValue)) {
            setFormData(prev => ({ ...prev, vin_percom: numValue }));
            setDisplayComissao(numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
        } else {
            setFormData(prev => ({ ...prev, vin_percom: 0 }));
            setDisplayComissao('0,00');
        }
    };

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
            <div className="bg-white rounded-lg p-4 w-96 shadow-xl border border-gray-200">
                <h3 className="text-sm font-black mb-3 border-b pb-2 uppercase tracking-widest text-blue-900 italic flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
                    {industry ? 'Editar Indústria' : 'Adicionar Indústria'}
                </h3>

                <div className="space-y-4">
                    <div>
                        <Label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Indústria</Label>
                        <Select
                            value={formData.vin_industria?.toString()}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, vin_industria: parseInt(val) }))}
                            disabled={!!industry}
                        >
                            <SelectTrigger className="h-9 text-sm border-slate-200 bg-slate-50 font-bold text-slate-700">
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
                        <Label className="text-[10px] font-black uppercase text-slate-400 mb-1 block">(%) Comissão</Label>
                        <div className="relative group">
                            <Input
                                type="text"
                                value={displayComissao}
                                onChange={handleComissaoChange}
                                className="h-10 text-lg text-right font-black border-slate-200 bg-slate-50 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 transition-all rounded-xl"
                                placeholder="0,00"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm group-focus-within:text-blue-500">
                                %
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 mt-4 justify-end border-t pt-3">
                    <Button size="sm" variant="outline" onClick={onClose} className="h-8 text-xs font-bold border-slate-200 hover:bg-slate-100">
                        <X size={14} className="mr-1" />
                        Cancelar
                    </Button>
                    <Button size="sm" onClick={handleSave} className="h-8 text-xs font-black bg-blue-600 hover:bg-blue-700 shadow-md">
                        <Check size={14} className="mr-1" />
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IndustryDialog;
