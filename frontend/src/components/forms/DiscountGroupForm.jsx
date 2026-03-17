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
            toast.error('Identificador é obrigatório');
            return;
        }

        // Limpeza dos dados numéricos antes de salvar
        const finalData = { ...formData };
        [1, 2, 3, 4, 5, 6, 7, 8, 9].forEach(n => {
            const field = `gde_desc${n}`;
            let rawValue = String(finalData[field]);
            // Remove pontos (milhar/formatação) e troca vírgula por ponto
            const cleanValue = rawValue.replace(/\./g, '').replace(',', '.');
            finalData[field] = parseFloat(cleanValue) || 0;
        });

        onSave(finalData);
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
                            label="Identificador"
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
                                        type="text"
                                        placeholder="0,00"
                                        value={
                                            typeof formData[`gde_desc${num}`] === 'string'
                                                ? formData[`gde_desc${num}`]
                                                : (formData[`gde_desc${num}`] === 0 ? '' : formData[`gde_desc${num}`].toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
                                        }
                                        onChange={(e) => {
                                            // Lógica de máscara: remove tudo que não é dígito
                                            let val = e.target.value.replace(/\D/g, "");

                                            if (val === "") {
                                                setFormData(prev => ({ ...prev, [`gde_desc${num}`]: 0 }));
                                                return;
                                            }

                                            // Converte para decimal (ex: 1183 vira 11.83)
                                            const floatVal = parseFloat(val) / 100;

                                            // Mantém como string formatada durante a digitação para o usuário ver a máscara
                                            const formatted = floatVal.toLocaleString('pt-BR', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2
                                            });

                                            setFormData(prev => ({ ...prev, [`gde_desc${num}`]: formatted }));
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
