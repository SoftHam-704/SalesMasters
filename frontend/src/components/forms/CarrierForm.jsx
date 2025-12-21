import React, { useState, useEffect } from 'react';
import { FileText, Search } from 'lucide-react';
import FormCadPadrao from '../FormCadPadrao';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

    const mainTabs = [
        { id: 'dados', label: 'Dados', icon: <FileText size={16} /> },
    ];

    const renderTabContent = (activeTab) => {
        if (activeTab === 'dados') {
            return (
                <div className="p-4 space-y-3">
                    {/* Row 1: CNPJ | Inscrição */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label className="text-xs font-semibold">CNPJ</Label>
                            <div className="relative flex items-center">
                                <Input
                                    value={formData.tra_cgc || ''}
                                    onChange={(e) => handleChange('tra_cgc', e.target.value)}
                                    className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold pr-10"
                                    placeholder="Somente números"
                                />
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="absolute right-0 h-8 w-8 text-emerald-600 hover:text-emerald-700"
                                    onClick={handleConsultarCNPJ}
                                    title="Consultar CNPJ"
                                >
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs font-semibold">Inscrição Estadual</Label>
                            <Input
                                value={formData.tra_inscricao || ''}
                                onChange={(e) => handleChange('tra_inscricao', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 2: Nome */}
                    <div>
                        <Label className="text-xs font-semibold">Nome / Razão Social</Label>
                        <Input
                            value={formData.tra_nome || ''}
                            onChange={(e) => handleChange('tra_nome', e.target.value)}
                            className="h-8 text-sm bg-blue-50 border-blue-300 font-semibold"
                            placeholder="Digite o nome da transportadora"
                        />
                    </div>

                    {/* Row 3: Endereço | Bairro */}
                    <div className="flex gap-3">
                        <div className="flex-[2]">
                            <Label className="text-xs font-semibold">Endereço</Label>
                            <Input
                                value={formData.tra_endereco || ''}
                                onChange={(e) => handleChange('tra_endereco', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs font-semibold">Bairro</Label>
                            <Input
                                value={formData.tra_bairro || ''}
                                onChange={(e) => handleChange('tra_bairro', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 4: Cidade | UF | CEP */}
                    <div className="flex gap-3">
                        <div className="flex-[2]">
                            <Label className="text-xs font-semibold">Cidade</Label>
                            <Input
                                value={formData.tra_cidade || ''}
                                onChange={(e) => handleChange('tra_cidade', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="w-20">
                            <Label className="text-xs font-semibold">UF</Label>
                            <Input
                                value={formData.tra_uf || ''}
                                onChange={(e) => handleChange('tra_uf', e.target.value)}
                                className="h-8 text-sm text-center"
                                maxLength={2}
                            />
                        </div>
                        <div className="w-32">
                            <Label className="text-xs font-semibold">CEP</Label>
                            <Input
                                value={formData.tra_cep || ''}
                                onChange={(e) => handleChange('tra_cep', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 5: Telefone | Contato */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <Label className="text-xs font-semibold">Telefone</Label>
                            <Input
                                value={formData.tra_fone || ''}
                                onChange={(e) => handleChange('tra_fone', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="flex-1">
                            <Label className="text-xs font-semibold">Contato</Label>
                            <Input
                                value={formData.tra_contato || ''}
                                onChange={(e) => handleChange('tra_contato', e.target.value)}
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>

                    {/* Row 6: Email */}
                    <div>
                        <Label className="text-xs font-semibold">E-mail</Label>
                        <Input
                            value={formData.tra_email || ''}
                            onChange={(e) => handleChange('tra_email', e.target.value)}
                            className="h-8 text-sm"
                            type="email"
                        />
                    </div>

                    {/* Row 7: Observações */}
                    <div>
                        <Label className="text-xs font-semibold">Observações</Label>
                        <Textarea
                            value={formData.tra_obs || ''}
                            onChange={(e) => handleChange('tra_obs', e.target.value)}
                            className="text-sm min-h-[80px]"
                            placeholder="Observações adicionais..."
                        />
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <FormCadPadrao
            title={data ? `Transportadora: ${data.tra_nome || ''}` : "Nova Transportadora"}
            tabs={mainTabs}
            relatedTabs={[]}
            renderTabContent={renderTabContent}
            renderRelatedContent={() => null}
            onSave={handleSave}
            onClose={onClose}
        />
    );
};

export default CarrierForm;
