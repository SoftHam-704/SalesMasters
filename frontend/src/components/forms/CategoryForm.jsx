import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CategoryForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        cat_id: '',
        cat_descricao: ''
    });

    useEffect(() => {
        if (data) {
            setFormData({
                cat_id: data.cat_id || '',
                cat_descricao: data.cat_descricao || ''
            });
        }
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.cat_descricao?.trim()) {
            alert('Descrição é obrigatória');
            return;
        }
        onSave(formData);
    };

    return (
        <FormCadPadraoV2
            title={data ? `Editar Categoria: ${data.cat_id}` : "Nova Categoria"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-2">
                        <Label className="text-xs font-semibold">ID</Label>
                        <Input
                            value={formData.cat_id}
                            className="h-8 text-sm bg-gray-100"
                            disabled={true}
                            placeholder="Auto"
                        />
                    </div>
                    <div className="col-span-10">
                        <Label className="text-xs font-semibold">Descrição da Categoria</Label>
                        <Input
                            value={formData.cat_descricao}
                            onChange={(e) => handleChange('cat_descricao', e.target.value)}
                            className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold text-blue-900"
                            placeholder="Ex: Leve, Pesada, Motopeças"
                            autoFocus
                        />
                    </div>
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default CategoryForm;
