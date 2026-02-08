import React, { useState, useEffect } from 'react';
import FormCadPadrao from '../FormCadPadrao';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ProductGroupForm = ({ open, data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        gru_nome: '',
        gru_percomiss: 0
    });

    useEffect(() => {
        if (data) {
            setFormData({
                gru_nome: data.nome || data.gru_nome || '',
                gru_percomiss: data.comissao || data.gru_percomiss || 0
            });
        } else {
            setFormData({
                gru_nome: '',
                gru_percomiss: 0
            });
        }
    }, [data, open]);

    if (!open) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.gru_nome?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }

        // Prepara os dados no formato esperado pela API (nomes originais)
        const payload = {
            gru_nome: formData.gru_nome,
            gru_percomiss: formData.gru_percomiss
        };

        onSave(payload);
    };

    return (
        <FormCadPadrao
            title={data ? `Grupo: ${formData.gru_nome || ''}` : "Novo Grupo de Produtos"}
            onSave={handleSave}
            onClose={onClose}
        >
            <div className="p-2 space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    {/* Descrição */}
                    <div className="col-span-9 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Descrição</Label>
                        <Input
                            className="h-9 text-sm font-semibold"
                            value={formData.gru_nome}
                            onChange={(e) => handleChange('gru_nome', e.target.value)}
                            autoFocus
                        />
                    </div>

                    {/* % comissão preposto */}
                    <div className="col-span-3 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">% Comissão</Label>
                        <Input
                            className="h-9 text-right font-mono"
                            value={formData.gru_percomiss}
                            type="number"
                            step="0.01"
                            onChange={(e) => handleChange('gru_percomiss', parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>
        </FormCadPadrao>
    );
};

export default ProductGroupForm;
