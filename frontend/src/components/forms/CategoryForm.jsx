import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';

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
            <div className="p-4">
               <div className="form-grid">
                    {/* ID */}
                    <div className="col-3">
                        <InputField
                            label="ID"
                            value={formData.cat_id}
                            disabled
                            placeholder="Auto"
                            className="bg-gray-100"
                        />
                    </div>
                    {/* Descrição */}
                    <div className="col-9">
                        <InputField
                            label="Descrição da Categoria"
                            value={formData.cat_descricao}
                            onChange={(e) => handleChange('cat_descricao', e.target.value)}
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

export default CategoryForm;
