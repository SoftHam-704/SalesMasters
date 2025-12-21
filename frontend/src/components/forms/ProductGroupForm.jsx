import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    const mainTabs = [
        { id: 'dados', label: 'Dados', icon: <FileText size={16} /> },
    ];

    const renderTabContent = (activeTab) => {
        if (activeTab === 'dados') {
            return (
                <div className="p-4">
                    <div className="grid grid-cols-1 gap-4">
                        {/* Descrição - highlighted in blue */}
                        <div>
                            <Label className="text-xs font-semibold">Descrição</Label>
                            <Input
                                value={formData.gru_nome}
                                onChange={(e) => handleChange('gru_nome', e.target.value)}
                                className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold"
                                placeholder="Digite a descrição do grupo"
                            />
                        </div>

                        {/* % comissão preposto */}
                        <div>
                            <Label className="text-xs">% comissão preposto</Label>
                            <Input
                                type="text"
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
                                className="h-8 text-sm text-right"
                                placeholder="0,00"
                            />
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <FormCadPadrao
            title={data ? `Grupo: ${data.gru_nome || ''}` : "Novo Grupo de Produtos"}
            tabs={mainTabs}
            relatedTabs={[]}
            renderTabContent={renderTabContent}
            renderRelatedContent={() => null}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default ProductGroupForm;
