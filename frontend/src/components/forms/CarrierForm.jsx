import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import FormCadPadraoV2 from '../FormCadPadraoV2';
import InputField from '../InputField';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const CarrierForm = ({ data, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        tra_nome: '',
        tra_cgc: '',
        tra_inscricao: '',
        tra_endereco: '',
        tra_bairro: '',
        tra_cidade: '',
        tra_uf: '',
        tra_cep: '',
        tra_fone: '',
        tra_contato: '',
        tra_email: '',
        tra_obs: ''
    });

    useEffect(() => {
        if (data) {
            setFormData(data);
        }
    }, [data]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleConsultarCNPJ = async () => {
        const cnpj = formData.tra_cgc?.replace(/\D/g, '');
        if (!cnpj || cnpj.length !== 14) {
            toast.error("Informe um CNPJ válido (14 dígitos) para consultar.");
            return;
        }

        const toastId = toast.loading("Consultando Receita Federal...");

        try {
            const response = await fetch(`http://localhost:3005/api/v2/carriers/cnpj/${cnpj}`);

            if (!response.ok) {
                throw new Error("CNPJ não encontrado.");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Erro na consulta.");
            }

            const data = result.data;

            setFormData(prev => ({
                ...prev,
                tra_nome: data.razao_social || data.nome || prev.tra_nome,
                tra_endereco: data.logradouro ? `${data.logradouro}, ${data.numero || ''}` : prev.tra_endereco,
                tra_bairro: data.bairro || prev.tra_bairro,
                tra_cidade: data.municipio || prev.tra_cidade,
                tra_uf: data.uf || prev.tra_uf,
                tra_cep: data.cep || prev.tra_cep,
                tra_fone: data.telefone || prev.tra_fone,
                tra_email: data.email || prev.tra_email,
                tra_cgc: cnpj
            }));

            toast.dismiss(toastId);
            toast.success("Dados encontrados com sucesso!");
        } catch (error) {
            toast.dismiss(toastId);
            toast.error(error.message);
        }
    };

    const handleSave = () => {
        if (!formData.tra_nome?.trim()) {
            toast.error("Nome é obrigatório!");
            return;
        }
        if (!formData.tra_cgc?.trim()) {
            toast.error("CNPJ é obrigatório!");
            return;
        }
        onSave(formData);
    };

    return (
        <FormCadPadraoV2
            title={data ? `Transportadora: ${data.tra_nome || ''}` : "Nova Transportadora"}
            onSave={handleSave}
            onCancel={onClose}
        >
            <div className="p-4">
                <div className="form-grid">
                    {/* Row 1: CNPJ | Consulta | Inscrição */}
                    <div className="col-5">
                       <div className="flex gap-2 items-center">
                            <div className="flex-1">
                                <InputField
                                    label="CNPJ"
                                    value={formData.tra_cgc || ''}
                                    onChange={(e) => handleChange('tra_cgc', e.target.value)}
                                    placeholder=""
                                    autoFocus
                                />
                            </div>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-[50px] w-[50px] rounded-xl border-slate-200 text-emerald-600 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50 mt-[1px]" // Height to match input field
                                onClick={handleConsultarCNPJ}
                                title="Consultar CNPJ"
                            >
                                <Search className="h-5 w-5" />
                            </Button>
                       </div>
                    </div>
                    <div className="col-4">
                        <InputField
                            label="Inscrição Estadual"
                            value={formData.tra_inscricao || ''}
                            onChange={(e) => handleChange('tra_inscricao', e.target.value)}
                            placeholder=""
                        />
                    </div>
                    {/* Empty space for balance or add ID if available */}
                    <div className="col-3"></div>

                    {/* Row 2: Nome */}
                    <div className="col-12">
                        <InputField
                            label="Nome / Razão Social"
                            value={formData.tra_nome || ''}
                            onChange={(e) => handleChange('tra_nome', e.target.value)}
                            large
                            placeholder=""
                        />
                    </div>

                    {/* Row 3: Endereço (large) | Bairro */}
                    <div className="col-8">
                        <InputField
                            label="Endereço"
                            value={formData.tra_endereco || ''}
                            onChange={(e) => handleChange('tra_endereco', e.target.value)}
                            placeholder=""
                        />
                    </div>
                    <div className="col-4">
                        <InputField
                            label="Bairro"
                            value={formData.tra_bairro || ''}
                            onChange={(e) => handleChange('tra_bairro', e.target.value)}
                            placeholder=""
                        />
                    </div>

                    {/* Row 4: CEP | Cidade | UF */}
                    <div className="col-3">
                        <InputField
                            label="CEP"
                            value={formData.tra_cep || ''}
                            onChange={(e) => handleChange('tra_cep', e.target.value)}
                            placeholder=""
                        />
                    </div>
                    <div className="col-7">
                        <InputField
                            label="Cidade"
                            value={formData.tra_cidade || ''}
                            onChange={(e) => handleChange('tra_cidade', e.target.value)}
                            placeholder=""
                        />
                    </div>
                    <div className="col-2">
                        <InputField
                            label="UF"
                            value={formData.tra_uf || ''}
                            onChange={(e) => handleChange('tra_uf', e.target.value)}
                            placeholder=""
                            className="text-center"
                            maxLength={2}
                        />
                    </div>


                    {/* Row 5: Telefone | Contato | Email */}
                    <div className="col-4">
                        <InputField
                            label="Telefone"
                            value={formData.tra_fone || ''}
                            onChange={(e) => handleChange('tra_fone', e.target.value)}
                            placeholder=""
                        />
                    </div>
                    <div className="col-4">
                        <InputField
                            label="Contato"
                            value={formData.tra_contato || ''}
                            onChange={(e) => handleChange('tra_contato', e.target.value)}
                            placeholder=""
                        />
                    </div>
                     <div className="col-4">
                        <InputField
                            label="E-mail"
                            value={formData.tra_email || ''}
                            onChange={(e) => handleChange('tra_email', e.target.value)}
                            placeholder=""
                            type="email"
                        />
                    </div>

                    {/* Row 6: Observações */}
                    <div className="col-12">
                        <textarea
                            className="modern-textarea"
                            placeholder="Observações adicionais..."
                            value={formData.tra_obs || ''}
                            onChange={(e) => handleChange('tra_obs', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </FormCadPadraoV2>
    );
};

export default CarrierForm;
