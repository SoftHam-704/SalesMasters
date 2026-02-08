import React, { useState, useEffect } from 'react';
import FormCadPadrao from '../FormCadPadrao';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const CategoryForm = ({ open, data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        cat_id: '',
        cat_descricao: ''
    });

    useEffect(() => {
        if (data) {
            setFormData({
                cat_id: data.id || data.cat_id || '',
                cat_descricao: data.descricao || data.cat_descricao || ''
            });
        } else {
            setFormData({
                cat_id: '',
                cat_descricao: ''
            });
        }
    }, [data, open]);

    if (!open) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.cat_descricao?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }

        const payload = {
            cat_descricao: formData.cat_descricao
        };

        onSave(payload);
    };

    return (
        <FormCadPadrao
            title={data ? `Categoria: ${formData.cat_descricao || ''}` : "Nova Categoria"}
            onSave={handleSave}
            onClose={onClose}
        >
            <div className="p-2 space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    {/* ID */}
                    <div className="col-span-3 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">ID</Label>
                        <Input
                            className="h-9 text-xs font-mono bg-slate-50"
                            value={formData.cat_id}
                            disabled
                            placeholder="Auto"
                        />
                    </div>
                    {/* Descrição */}
                    <div className="col-span-9 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Descrição da Categoria</Label>
                        <Input
                            className="h-9 text-sm font-semibold"
                            value={formData.cat_descricao}
                            onChange={(e) => handleChange('cat_descricao', e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            </div>
        </FormCadPadrao>
    );
};

export default CategoryForm;
