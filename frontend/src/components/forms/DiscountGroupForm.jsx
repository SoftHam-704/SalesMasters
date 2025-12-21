import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DiscountGroupForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        gid: '',
        gde_nome: '',
        gde_desc1: 0,
        gde_desc2: 0,
        gde_desc3: 0,
        gde_desc4: 0,
        gde_desc5: 0,
        gde_desc6: 0,
        gde_desc7: 0,
        gde_desc8: 0,
        gde_desc9: 0
    });

    useEffect(() => {
        if (data) {
            setFormData({
                gid: data.gid || '',
                gde_nome: data.gde_nome || '',
                gde_desc1: data.gde_desc1 || 0,
                gde_desc2: data.gde_desc2 || 0,
                gde_desc3: data.gde_desc3 || 0,
                gde_desc4: data.gde_desc4 || 0,
                gde_desc5: data.gde_desc5 || 0,
                gde_desc6: data.gde_desc6 || 0,
                gde_desc7: data.gde_desc7 || 0,
                gde_desc8: data.gde_desc8 || 0,
                gde_desc9: data.gde_desc9 || 0
            });
        }
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNumberChange = (field, value) => {
        const num = parseFloat(value.replace(',', '.')) || 0;
        handleChange(field, num);
    };

    const handleSave = () => {
        if (!formData.gid?.trim()) {
            alert('Código (ID) é obrigatório');
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
                        {/* ID e Nome */}
                        <div className="grid grid-cols-12 gap-4">
                            <div className="col-span-2">
                                <Label className="text-xs font-semibold">Código</Label>
                                <Input
                                    value={formData.gid}
                                    onChange={(e) => handleChange('gid', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Ex: 001"
                                />
                            </div>
                            <div className="col-span-10">
                                <Label className="text-xs font-semibold">Descrição</Label>
                                <Input
                                    value={formData.gde_nome}
                                    onChange={(e) => handleChange('gde_nome', e.target.value)}
                                    className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold"
                                    placeholder="Descrição do grupo"
                                />
                            </div>
                        </div>

                        {/* Descontos 1-9 */}
                        <div className="border rounded-md p-4 bg-gray-50">
                            <Label className="text-sm font-semibold mb-3 block">Níveis de Desconto (%)</Label>
                            <div className="grid grid-cols-9 gap-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <div key={num} className="text-center">
                                        <Label className="text-xs font-medium mb-1 block">{num}º</Label>
                                        <Input
                                            type="text"
                                            value={formData[`gde_desc${num}`]?.toFixed(2) || '0.00'}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(',', '.');
                                                if (value === '' || value === '.') {
                                                    handleChange(`gde_desc${num}`, 0);
                                                } else if (!isNaN(parseFloat(value))) {
                                                    handleChange(`gde_desc${num}`, parseFloat(value));
                                                }
                                            }}
                                            onBlur={(e) => {
                                                const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                                                handleChange(`gde_desc${num}`, parseFloat(val.toFixed(2)));
                                            }}
                                            className={`h-8 text-sm text-center ${num === 1 ? 'bg-yellow-50 border-yellow-300' : ''}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <FormCadPadrao
            title={data ? `Grupo de Desconto: ${data.gid || ''}` : "Novo Grupo de Desconto"}
            tabs={mainTabs}
            relatedTabs={[]}
            renderTabContent={renderTabContent}
            renderRelatedContent={() => null}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default DiscountGroupForm;
