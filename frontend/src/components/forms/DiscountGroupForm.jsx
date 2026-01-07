import React, { useState, useEffect } from 'react';
import { FileText } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { Label } from "@/components/ui/label"; // Keep Label if used elsewhere
import { toast } from "sonner";

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
            toast.error('Código (ID) é obrigatório');
            return;
        }
        onSave(formData);
    };

    return (
        <FormCadPadraoV2
            title={data ? `Grupo: ${data.gde_nome || ''}` : "Novo Grupo de Desconto"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="p-4">
                <div className="form-grid">
                    {/* ID e Nome */}
                    <div className="col-3">
                        <InputField
                            label="Código"
                            value={formData.gid}
                            onChange={(e) => handleChange('gid', e.target.value)}
                            placeholder=""
                            autoFocus
                        />
                    </div>
                    <div className="col-9">
                        <InputField
                            label="Descrição"
                            value={formData.gde_nome}
                            onChange={(e) => handleChange('gde_nome', e.target.value)}
                            placeholder=""
                        />
                    </div>

                    {/* Separator / Title */}
                    <div className="col-12 mt-4 mb-2">
                        <Label className="text-sm font-semibold text-gray-700">Níveis de Desconto (%)</Label>
                    </div>

                    {/* Descontos 1-9 using custom comfortable grid */}
                    <div className="col-12">
                        <div className="discount-grid">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <div key={num}>
                                    <InputField
                                        label={`${num}º`}
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
                                        className={`text-center font-medium w-full ${num === 1 ? 'bg-yellow-50 text-yellow-700' : ''}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* 
                       Wait, mapping 9 divs with col-1 will take 9 columns. Perfect.
                       12 columns total. 9 Used. 3 Empty on right. 
                       This looks fine and consistent. 
                    */}
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default DiscountGroupForm;
