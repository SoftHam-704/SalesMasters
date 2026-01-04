import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';

const ProductGroupForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        gru_nome: '',
        gru_percomiss: 0
    });

    useEffect(() => {
        if (data) {
            setFormData({
                gru_nome: data.gru_nome || '',
                gru_percomiss: data.gru_percomiss || 0
            });
        }
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!formData.gru_nome?.trim()) {
            alert('Descrição é obrigatória');
            return;
        }
        onSave(formData);
    };

    return (
        <FormCadPadraoV2
            title={data ? `Grupo: ${data.gru_nome || ''}` : "Novo Grupo de Produtos"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="p-4">
            <div className="p-4">
                <div className="form-grid">
                    {/* Descrição */}
                    <div className="col-9">
                        <InputField
                            label="Descrição"
                            value={formData.gru_nome}
                            onChange={(e) => handleChange('gru_nome', e.target.value)}
                            placeholder=""
                            autoFocus
                            large
                        />
                    </div>

                    {/* % comissão preposto */}
                    <div className="col-3">
                         <InputField
                            label="% comissão preposto"
                            value={formData.gru_percomiss?.toFixed(2) || '0.00'}
                            onChange={(e) => {
                                const value = e.target.value.replace(',', '.');
                                const num = parseFloat(value);
                                if (!isNaN(num)) {
                                    handleChange('gru_percomiss', num);
                                } else if (value === '' || value === '.') {
                                    handleChange('gru_percomiss', 0);
                                }
                            }}
                            onBlur={(e) => {
                                const num = parseFloat(e.target.value.replace(',', '.')) || 0;
                                handleChange('gru_percomiss', parseFloat(num.toFixed(2)));
                            }}
                            placeholder="0,00"
                            className="text-right"
                        />
                    </div>
                </div>
            </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default ProductGroupForm;
