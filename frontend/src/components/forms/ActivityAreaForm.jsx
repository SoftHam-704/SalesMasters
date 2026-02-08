import React, { useState, useEffect } from 'react';
import FormCadPadrao from '../FormCadPadrao';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ActivityAreaForm = ({ open, data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        atu_descricao: '',
        atu_sel: '',
        gid: ''
    });

    useEffect(() => {
        if (data) {
            setFormData({
                atu_descricao: data.descricao || data.atu_descricao || '',
                atu_sel: data.atu_sel || '',
                gid: data.gid || ''
            });
        } else {
            setFormData({
                atu_descricao: '',
                atu_sel: '',
                gid: ''
            });
        }
    }, [data, open]);

    if (!open) return null;

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.atu_descricao?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }

        const payload = {
            atu_descricao: formData.atu_descricao,
            atu_sel: formData.atu_sel,
            gid: formData.gid
        };

        onSave(payload);
    };

    return (
        <FormCadPadrao
            title={data ? `Área: ${formData.atu_descricao || ''}` : "Nova Área de Atuação"}
            onSave={handleSave}
            onClose={onClose}
        >
            <div className="p-2 space-y-4">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Descrição</Label>
                        <Input
                            className="h-9 text-sm font-semibold"
                            value={formData.atu_descricao}
                            onChange={(e) => handleChange('atu_descricao', e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>
            </div>
        </FormCadPadrao>
    );
};

export default ActivityAreaForm;
