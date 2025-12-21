import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
                        {/* Descrição */}
                        <div>
                            <Label className="text-xs font-semibold">Descrição</Label>
                            <Input
                                value={formData.atu_descricao}
                                onChange={(e) => handleChange('atu_descricao', e.target.value)}
                                className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold"
                                placeholder="Digite a descrição da área de atuação"
                            />
                        </div>

                        {/* Selecionado */}
                        <div>
                            <Label className="text-xs">Selecionado (S/N)</Label>
                            <Input
                                value={formData.atu_sel}
                                onChange={(e) => handleChange('atu_sel', e.target.value.toUpperCase().substring(0, 1))}
                                className="h-8 text-sm"
                                placeholder="S ou N"
                                maxLength={1}
                            />
                        </div>

                        {/* GID */}
                        <div>
                            <Label className="text-xs">GID</Label>
                            <Input
                                value={formData.gid}
                                onChange={(e) => handleChange('gid', e.target.value)}
                                className="h-8 text-sm"
                                placeholder="GID"
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
            title={data ? `Área: ${data.atu_descricao || ''}` : "Nova Área de Atuação"}
            tabs={mainTabs}
            relatedTabs={[]}
            renderTabContent={renderTabContent}
            renderRelatedContent={() => null}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default ActivityAreaForm;
