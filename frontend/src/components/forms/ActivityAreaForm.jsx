import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { toast } from "sonner";

const ActivityAreaForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        atu_descricao: '',
        atu_sel: '',
        gid: ''
    });

    useEffect(() => {
        if (data) {
            setFormData({
                atu_descricao: data.atu_descricao || '',
                atu_sel: data.atu_sel || '',
                gid: data.gid || ''
            });
        }
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.atu_descricao?.trim()) {
            toast.error('Descrição é obrigatória');
            return;
        }
        onSave(formData);
    };

    return (
        <FormCadPadraoV2
            title={data ? `Área: ${data.atu_descricao || ''}` : "Nova Área de Atuação"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="p-4">
                <div className="form-grid">
                    {/* Descrição - Full Width */}
                    <div className="col-12">
                        <InputField
                            label="Descrição"
                            value={formData.atu_descricao}
                            onChange={(e) => handleChange('atu_descricao', e.target.value)}
                            placeholder=""
                            autoFocus
                            large
                        />
                    </div>
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default ActivityAreaForm;
