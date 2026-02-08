import React, { useState, useEffect } from 'react';
import FormCadPadrao from '../FormCadPadrao';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Search } from 'lucide-react';
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const CarrierForm = ({ open, data, onClose, onSave }) => {
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
            // Se vier mapeado (como 'nome') ou original (como 'tra_nome')
            setFormData({
                tra_codigo: data.id || data.tra_codigo,
                tra_nome: data.nome || data.tra_nome || '',
                tra_cgc: data.cnpj || data.tra_cgc || '',
                tra_inscricao: data.tra_inscricao || '',
                tra_endereco: data.tra_endereco || '',
                tra_bairro: data.tra_bairro || '',
                tra_cidade: data.cidade || data.tra_cidade || '',
                tra_uf: data.tra_uf || '',
                tra_cep: data.tra_cep || '',
                tra_fone: data.telefone || data.tra_fone || '',
                tra_contato: data.tra_contato || '',
                tra_email: data.tra_email || '',
                tra_obs: data.tra_obs || ''
            });
        } else {
            setFormData({
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
        }
    }, [data, open]);

    if (!open) return null;

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
            const url = getApiUrl(NODE_API_URL, `/api/v2/carriers/cnpj/${cnpj}`);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("CNPJ não encontrado.");
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || "Erro na consulta.");
            }

            const apiData = result.data;

            setFormData(prev => ({
                ...prev,
                tra_nome: apiData.razao_social || apiData.nome || prev.tra_nome,
                tra_endereco: apiData.logradouro ? `${apiData.logradouro}, ${apiData.numero || ''}` : prev.tra_endereco,
                tra_bairro: apiData.bairro || prev.tra_bairro,
                tra_cidade: apiData.municipio || prev.tra_cidade,
                tra_uf: apiData.uf || prev.tra_uf,
                tra_cep: apiData.cep || prev.tra_cep,
                tra_fone: apiData.telefone || prev.tra_fone,
                tra_email: apiData.email || prev.tra_email,
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
        <FormCadPadrao
            title={data ? `Transportadora: ${formData.tra_nome || ''}` : "Nova Transportadora"}
            onSave={handleSave}
            onClose={onClose}
        >
            <div className="p-2 space-y-3">
                <div className="grid grid-cols-12 gap-3">
                    {/* Row 1: CNPJ | Consulta | Inscrição */}
                    <div className="col-span-5 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">CNPJ</Label>
                        <div className="flex gap-2">
                            <Input
                                className="h-8 text-xs font-mono"
                                value={formData.tra_cgc || ''}
                                onChange={(e) => handleChange('tra_cgc', e.target.value)}
                                autoFocus
                            />
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 text-emerald-600 border-emerald-100 hover:bg-emerald-50"
                                onClick={handleConsultarCNPJ}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Inscrição Estadual</Label>
                        <Input
                            className="h-8 text-xs font-mono"
                            value={formData.tra_inscricao || ''}
                            onChange={(e) => handleChange('tra_inscricao', e.target.value)}
                        />
                    </div>
                    <div className="col-span-3"></div>

                    {/* Row 2: Nome */}
                    <div className="col-span-12 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Nome / Razão Social</Label>
                        <Input
                            className="h-8 text-sm font-bold"
                            value={formData.tra_nome || ''}
                            onChange={(e) => handleChange('tra_nome', e.target.value)}
                        />
                    </div>

                    {/* Row 3: Endereço (large) | Bairro */}
                    <div className="col-span-8 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Endereço</Label>
                        <Input
                            className="h-8 text-xs"
                            value={formData.tra_endereco || ''}
                            onChange={(e) => handleChange('tra_endereco', e.target.value)}
                        />
                    </div>
                    <div className="col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Bairro</Label>
                        <Input
                            className="h-8 text-xs"
                            value={formData.tra_bairro || ''}
                            onChange={(e) => handleChange('tra_bairro', e.target.value)}
                        />
                    </div>

                    {/* Row 4: CEP | Cidade | UF */}
                    <div className="col-span-3 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">CEP</Label>
                        <Input
                            className="h-8 text-xs font-mono"
                            value={formData.tra_cep || ''}
                            onChange={(e) => handleChange('tra_cep', e.target.value)}
                        />
                    </div>
                    <div className="col-span-7 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Cidade</Label>
                        <Input
                            className="h-8 text-xs"
                            value={formData.tra_cidade || ''}
                            onChange={(e) => handleChange('tra_cidade', e.target.value)}
                        />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase text-center">UF</Label>
                        <Input
                            className="h-8 text-xs text-center font-bold"
                            value={formData.tra_uf || ''}
                            onChange={(e) => handleChange('tra_uf', e.target.value)}
                            maxLength={2}
                        />
                    </div>

                    {/* Row 5: Telefone | Contato | Email */}
                    <div className="col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Telefone</Label>
                        <Input
                            className="h-8 text-xs font-mono"
                            value={formData.tra_fone || ''}
                            onChange={(e) => handleChange('tra_fone', e.target.value)}
                        />
                    </div>
                    <div className="col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Contato</Label>
                        <Input
                            className="h-8 text-xs"
                            value={formData.tra_contato || ''}
                            onChange={(e) => handleChange('tra_contato', e.target.value)}
                        />
                    </div>
                    <div className="col-span-4 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">E-mail</Label>
                        <Input
                            className="h-8 text-xs"
                            value={formData.tra_email || ''}
                            onChange={(e) => handleChange('tra_email', e.target.value)}
                            type="email"
                        />
                    </div>

                    {/* Row 6: Observações */}
                    <div className="col-span-12 flex flex-col gap-1.5">
                        <Label className="text-[11px] font-bold text-slate-500 uppercase">Observações Internas</Label>
                        <Textarea
                            className="min-h-20 text-xs resize-none"
                            placeholder="Anotações adicionais..."
                            value={formData.tra_obs || ''}
                            onChange={(e) => handleChange('tra_obs', e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </FormCadPadrao>
    );
};

export default CarrierForm;
