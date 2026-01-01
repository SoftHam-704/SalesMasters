import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Mail } from 'lucide-react';

export default function ParametrosPage() {
    const [formData, setFormData] = useState({
        par_usuario: 1, // TODO: Pegar do contexto de autenticação
        par_ordemped: 'D',
        par_qtdenter: 2,
        par_itemduplicado: 'N',
        par_ordemimpressao: 'N',
        par_descontogrupo: 'N',
        par_separalinhas: 'N',
        par_usadecimais: 'S',
        par_fmtpesquisa: 'D',
        par_zerapromo: 'N',
        par_tipopesquisa: 'N',
        par_validapromocao: 'S',
        par_salvapedidoauto: 'S',
        par_mostracodori: 'N',
        par_solicitarconfemail: 'N',
        par_mostrapednovos: 'S',
        par_mostraimpostos: 'S',
        par_qtddecimais: 2,
        par_pedidopadrao: 1,
        par_telemkttipo: 'P',
        par_iniciapedido: 'P',
        par_tipofretepadrao: 'F',
        par_emailserver: '',
        par_email: '',
        par_emailuser: '',
        par_emailporta: 587,
        par_emailpassword: '',
        par_emailtls: false,
        par_emailssl: false,
        par_emailalternativo: ''
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadParameters();
    }, []);

    const loadParameters = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3005/api/parametros/1`);
            const data = await response.json();

            if (data.success && data.data) {
                setFormData(prev => ({ ...prev, ...data.data }));
            }
        } catch (error) {
            console.error('Erro ao carregar parâmetros:', error);
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch('http://localhost:3005/api/parametros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('✅ Configurações salvas com sucesso!');
            } else {
                toast.error('Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Erro ao salvar parâmetros:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const GroupBox = ({ title, children, className = '' }) => (
        <fieldset className={`border border-slate-300 rounded-md p-3 ${className}`}>
            <legend className="text-sm font-semibold text-slate-700 px-2">{title}</legend>
            {children}
        </fieldset>
    );

    const RadioOption = ({ field, value, label }) => (
        <div className="flex items-center space-x-2">
            <RadioGroupItem
                value={String(value)}
                id={`${field}-${value}`}
            />
            <Label htmlFor={`${field}-${value}`} className="cursor-pointer text-sm font-normal">
                {label}
            </Label>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Carregando configurações...</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            <div className="max-w-[1400px] mx-auto space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                        Parâmetros do Sistema
                    </h1>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </Button>
                </div>

                {/* Configurações */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Configurações</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        <GroupBox title="Ordem de apresentação dos pedidos">
                            <RadioGroup
                                value={formData.par_ordemped}
                                onValueChange={(value) => handleFieldChange('par_ordemped', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_ordemped" value="D" label="Data" />
                                <RadioOption field="par_ordemped" value="N" label="Numérica" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Utilizar casas decimais na quantidade">
                            <RadioGroup
                                value={formData.par_usadecimais}
                                onValueChange={(value) => handleFieldChange('par_usadecimais', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_usadecimais" value="S" label="Sim" />
                                <RadioOption field="par_usadecimais" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Mostrar código original no pedido">
                            <RadioGroup
                                value={formData.par_mostracodori}
                                onValueChange={(value) => handleFieldChange('par_mostracodori', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_mostracodori" value="S" label="Sim" />
                                <RadioOption field="par_mostracodori" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Telemarketing">
                            <RadioGroup
                                value={formData.par_telemkttipo}
                                onValueChange={(value) => handleFieldChange('par_telemkttipo', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_telemkttipo" value="P" label="Prospecção" />
                                <RadioOption field="par_telemkttipo" value="I" label="Indústrias" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Velocidade de digitação de itens">
                            <RadioGroup
                                value={String(formData.par_qtdenter)}
                                onValueChange={(value) => handleFieldChange('par_qtdenter', parseInt(value))}
                                className="grid grid-cols-2 gap-1"
                            >
                                <RadioOption field="par_qtdenter" value="1" label="Muito rápido" />
                                <RadioOption field="par_qtdenter" value="2" label="Rápido" />
                                <RadioOption field="par_qtdenter" value="3" label="Lento" />
                                <RadioOption field="par_qtdenter" value="4" label="Muito lento" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Formato das pesquisar">
                            <RadioGroup
                                value={formData.par_fmtpesquisa}
                                onValueChange={(value) => handleFieldChange('par_fmtpesquisa', value)}
                                className="flex flex-col gap-1"
                            >
                                <RadioOption field="par_fmtpesquisa" value="C" label="Somente código" />
                                <RadioOption field="par_fmtpesquisa" value="D" label="Código e Descrição" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Solicitar confirmação receb. emails?">
                            <RadioGroup
                                value={formData.par_solicitarconfemail}
                                onValueChange={(value) => handleFieldChange('par_solicitarconfemail', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_solicitarconfemail" value="S" label="Sim" />
                                <RadioOption field="par_solicitarconfemail" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Iniciar pedido como">
                            <RadioGroup
                                value={formData.par_iniciapedido}
                                onValueChange={(value) => handleFieldChange('par_iniciapedido', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_iniciapedido" value="P" label="Pedido" />
                                <RadioOption field="par_iniciapedido" value="C" label="Cotação" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Permitir itens duplicados">
                            <RadioGroup
                                value={formData.par_itemduplicado}
                                onValueChange={(value) => handleFieldChange('par_itemduplicado', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_itemduplicado" value="S" label="Sim" />
                                <RadioOption field="par_itemduplicado" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Zerar desconto das promoções">
                            <RadioGroup
                                value={formData.par_zerapromo}
                                onValueChange={(value) => handleFieldChange('par_zerapromo', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_zerapromo" value="S" label="Sim" />
                                <RadioOption field="par_zerapromo" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Mostrar prod. novos no pedido">
                            <RadioGroup
                                value={formData.par_mostrapednovos}
                                onValueChange={(value) => handleFieldChange('par_mostrapednovos', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_mostrapednovos" value="S" label="Sim" />
                                <RadioOption field="par_mostrapednovos" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Pesquisar cliente por">
                            <RadioGroup
                                value={formData.par_tipopesquisa}
                                onValueChange={(value) => handleFieldChange('par_tipopesquisa', value)}
                                className="flex flex-col gap-1"
                            >
                                <RadioOption field="par_tipopesquisa" value="R" label="Razão social" />
                                <RadioOption field="par_tipopesquisa" value="N" label="Nome reduzido" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Ordenação dos itens na impressão">
                            <RadioGroup
                                value={formData.par_ordemimpressao}
                                onValueChange={(value) => handleFieldChange('par_ordemimpressao', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_ordemimpressao" value="N" label="Numérica" />
                                <RadioOption field="par_ordemimpressao" value="D" label="Digitação" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Gerenciar as validades das promoções">
                            <RadioGroup
                                value={formData.par_validapromocao}
                                onValueChange={(value) => handleFieldChange('par_validapromocao', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_validapromocao" value="S" label="Sim" />
                                <RadioOption field="par_validapromocao" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Mostrar total com impostos nos pedidos">
                            <RadioGroup
                                value={formData.par_mostraimpostos}
                                onValueChange={(value) => handleFieldChange('par_mostraimpostos', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_mostraimpostos" value="S" label="Sim" />
                                <RadioOption field="par_mostraimpostos" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Tipo frete">
                            <RadioGroup
                                value={formData.par_tipofretepadrao}
                                onValueChange={(value) => handleFieldChange('par_tipofretepadrao', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_tipofretepadrao" value="F" label="FOB" />
                                <RadioOption field="par_tipofretepadrao" value="C" label="CIF" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Utilizar desconto por grupos">
                            <RadioGroup
                                value={formData.par_descontogrupo}
                                onValueChange={(value) => handleFieldChange('par_descontogrupo', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_descontogrupo" value="S" label="Sim" />
                                <RadioOption field="par_descontogrupo" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Salvar pedido automaticamente">
                            <RadioGroup
                                value={formData.par_salvapedidoauto}
                                onValueChange={(value) => handleFieldChange('par_salvapedidoauto', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_salvapedidoauto" value="S" label="Sim" />
                                <RadioOption field="par_salvapedidoauto" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Separar itens por grupo/linha">
                            <RadioGroup
                                value={formData.par_separalinhas}
                                onValueChange={(value) => handleFieldChange('par_separalinhas', value)}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_separalinhas" value="S" label="Sim" />
                                <RadioOption field="par_separalinhas" value="N" label="Não" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Quantidade casas decimais">
                            <RadioGroup
                                value={String(formData.par_qtddecimais)}
                                onValueChange={(value) => handleFieldChange('par_qtddecimais', parseInt(value))}
                                className="flex gap-4"
                            >
                                <RadioOption field="par_qtddecimais" value="2" label="2" />
                                <RadioOption field="par_qtddecimais" value="3" label="3" />
                                <RadioOption field="par_qtddecimais" value="4" label="4" />
                            </RadioGroup>
                        </GroupBox>

                        <GroupBox title="Formato de pedido padrão" className="col-span-1">
                            <Select
                                value={String(formData.par_pedidopadrao)}
                                onValueChange={(value) => handleFieldChange('par_pedidopadrao', parseInt(value))}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Escolha o formato" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 29 }, (_, i) => i + 1).map(num => (
                                        <SelectItem key={num} value={String(num)}>
                                            Formato {num}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </GroupBox>

                        <GroupBox title="Observações para os pedidos" className="col-span-3">
                            <Textarea
                                rows={3}
                                placeholder="Digite observações padrão para os pedidos..."
                                className="resize-none"
                            />
                        </GroupBox>

                    </CardContent>
                </Card>

                {/* Configuração envio dos emails */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2">
                        <Mail className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-lg">Configuração envio dos emails</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                        <div>
                            <Label className="text-sm font-medium">SMTP</Label>
                            <Input
                                value={formData.par_emailserver}
                                onChange={(e) => handleFieldChange('par_emailserver', e.target.value)}
                                placeholder="smtp.exemplo.com"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium">E-Mail</Label>
                            <Input
                                type="email"
                                value={formData.par_email}
                                onChange={(e) => handleFieldChange('par_email', e.target.value)}
                                placeholder="email@exemplo.com"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Usuário</Label>
                            <Input
                                value={formData.par_emailuser}
                                onChange={(e) => handleFieldChange('par_emailuser', e.target.value)}
                                placeholder="usuário"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Porta</Label>
                            <Input
                                type="number"
                                value={formData.par_emailporta}
                                onChange={(e) => handleFieldChange('par_emailporta', parseInt(e.target.value) || 587)}
                                placeholder="587"
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-sm font-medium">Senha</Label>
                            <Input
                                type="password"
                                value={formData.par_emailpassword}
                                onChange={(e) => handleFieldChange('par_emailpassword', e.target.value)}
                                placeholder="••••••••"
                                className="mt-1"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label className="text-sm font-medium">TLS/SSL</Label>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.par_emailtls}
                                        onCheckedChange={(checked) => handleFieldChange('par_emailtls', checked)}
                                    />
                                    <Label className="text-sm font-normal">TLS</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.par_emailssl}
                                        onCheckedChange={(checked) => handleFieldChange('par_emailssl', checked)}
                                    />
                                    <Label className="text-sm font-normal">SSL</Label>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <Label className="text-sm font-medium">E-Mail alternativo</Label>
                            <Input
                                type="email"
                                value={formData.par_emailalternativo}
                                onChange={(e) => handleFieldChange('par_emailalternativo', e.target.value)}
                                placeholder="alternativo@exemplo.com"
                                className="mt-1"
                            />
                        </div>

                    </CardContent>
                </Card>



            </div>
        </div>
    );
}
