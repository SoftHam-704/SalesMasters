import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, CheckCircle2, AlertCircle, Building2, Image, Search, Crown, Loader2 } from 'lucide-react';
import MasterPanel from '@/components/settings/MasterPanel';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

export const DatabaseConfig = () => {
    const [activeTab, setActiveTab] = useState('company');

    // Company Config State - Apenas dados comerciais conforme solicitado
    const [companyConfig, setCompanyConfig] = useState({
        situacao: 'A',
        nome: 'SOFTHAM SISTEMAS - LOCAL',
        endereco: 'R. SANTIAGO PERES UBINHA, 150',
        bairro: 'JARDIM DOM NERY',
        cidade: 'CAMPINAS',
        uf: 'SP',
        cep: '13.031-730',
        cnpj: '17.504.829/0001-24',
        inscricao: '',
        fones: '(19) 3203-8600',
        logotipo: 'C:\\SalesMasters\\Imagens\\Softham1.png',
        // Campos de conexão removidos pois não são mais necessários
    });

    const [testing, setTesting] = useState(false);
    const [companyResult, setCompanyResult] = useState(null);
    const [companySaving, setCompanySaving] = useState(false);

    // Verificar se é o Hamilton (Super Admin)
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isHamilton = user.role === 'superadmin';

    // Carregar configuração atual
    useEffect(() => {
        // Carregar configuração da empresa
        fetch(getApiUrl(NODE_API_URL, '/api/config/company'))
            .then(res => res.json())
            .then(data => {
                if (data.success && data.config) {
                    setCompanyConfig(prev => ({ ...prev, ...data.config }));
                }
            })
            .catch(err => console.error('Erro ao carregar configuração da empresa:', err));
    }, []);

    const handleSaveCompany = async () => {
        setCompanySaving(true);
        setCompanyResult(null);

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/company/save'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyConfig)
            });

            const data = await response.json();
            setCompanyResult({
                success: data.success,
                message: data.message || 'Configuração da empresa salva com sucesso!'
            });
        } catch (error) {
            setCompanyResult({
                success: false,
                message: `Erro ao salvar configuração: ${error.message}`
            });
        } finally {
            setCompanySaving(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Configurações do Sistema
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className={`grid w-full mb-6 ${isHamilton ? 'grid-cols-2' : 'grid-cols-1'}`}>
                            <TabsTrigger value="company" className="flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Dados da Empresa
                            </TabsTrigger>
                            {isHamilton && (
                                <TabsTrigger value="master" className="flex items-center gap-2">
                                    <Crown className="w-4 h-4 text-amber-500 animate-pulse" />
                                    PAINEL MASTER
                                </TabsTrigger>
                            )}
                        </TabsList>

                        {/* Company Tab */}
                        <TabsContent value="company" className="space-y-6">
                            <Alert className="border-emerald-200 bg-emerald-50">
                                <Building2 className="h-4 w-4 text-emerald-600" />
                                <AlertDescription className="text-emerald-800">
                                    Configure os dados da empresa/representação para uso nos documentos e relatórios.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                {/* CNPJ e Busca - PRIMEIRO LUGAR */}
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="cnpj"
                                            value={companyConfig.cnpj}
                                            onChange={(e) => {
                                                const raw = e.target.value.replace(/\D/g, '');
                                                let formatted = raw;
                                                if (raw.length <= 14) {
                                                    formatted = raw.replace(/^(\d{2})(\d)/, '$1.$2')
                                                        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                                                        .replace(/\.(\d{3})(\d)/, '.$1/$2')
                                                        .replace(/(\d{4})(\d)/, '$1-$2');
                                                }
                                                setCompanyConfig({ ...companyConfig, cnpj: formatted });
                                            }}
                                            placeholder="00.000.000/0000-00"
                                            maxLength={18}
                                            className="font-mono field-cnpj"
                                        />
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={async () => {
                                                if (!companyConfig.cnpj || companyConfig.cnpj.length < 14) {
                                                    setCompanyResult({ success: false, message: 'Digite um CNPJ válido da empresa.' });
                                                    return;
                                                }
                                                setTesting(true);
                                                try {
                                                    const cleanCnpj = companyConfig.cnpj.replace(/\D/g, '');
                                                    console.log('Buscando CNPJ:', cleanCnpj);

                                                    // Usando endpoint público ou interno
                                                    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);

                                                    if (response.ok) {
                                                        const data = await response.json();
                                                        // Preenche os dados
                                                        setCompanyConfig(prev => ({
                                                            ...prev,
                                                            nome: data.razao_social || prev.nome,
                                                            endereco: `${data.logradouro}, ${data.numero} ${data.complemento || ''}`.trim(),
                                                            bairro: data.bairro || prev.bairro,
                                                            cidade: data.municipio || prev.cidade,
                                                            uf: data.uf || prev.uf,
                                                            cep: data.cep || prev.cep,
                                                            fones: data.ddd_telefone_1 || prev.fones
                                                        }));
                                                        setCompanyResult({ success: true, message: 'Dados encontrados na Receita!' });
                                                    } else {
                                                        setCompanyResult({ success: false, message: 'CNPJ não encontrado na base pública.' });
                                                    }
                                                } catch (error) {
                                                    console.error(error);
                                                    setCompanyResult({ success: false, message: 'Erro ao buscar CNPJ.' });
                                                } finally {
                                                    setTesting(false);
                                                }
                                            }}
                                            disabled={testing}
                                            title="Buscar dados do CNPJ"
                                        >
                                            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-slate-600" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Situação e Nome da Empresa */}
                                <div className="space-y-2">
                                    <Label htmlFor="situacao">Situação</Label>
                                    <select
                                        id="situacao"
                                        value={companyConfig.situacao}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, situacao: e.target.value })}
                                        className="w-full h-10 px-3 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="A">Ativo</option>
                                        <option value="B">Bloqueado</option>
                                    </select>
                                </div>

                                {/* Nome da Empresa */}
                                <div className="space-y-2">
                                    <Label htmlFor="nome">Nome da Empresa *</Label>
                                    <Input
                                        id="nome"
                                        value={companyConfig.nome}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, nome: e.target.value })}
                                        placeholder="Nome da empresa"
                                    />
                                </div>

                                {/* Endereço */}
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="endereco">Endereço</Label>
                                    <Input
                                        id="endereco"
                                        value={companyConfig.endereco}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, endereco: e.target.value })}
                                        placeholder="Endereço completo"
                                    />
                                </div>

                                {/* Bairro e Cidade */}
                                <div className="space-y-2">
                                    <Label htmlFor="bairro">Bairro</Label>
                                    <Input
                                        id="bairro"
                                        value={companyConfig.bairro}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, bairro: e.target.value })}
                                        placeholder="Bairro"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cidade">Cidade</Label>
                                    <Input
                                        id="cidade"
                                        value={companyConfig.cidade}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, cidade: e.target.value })}
                                        placeholder="Cidade"
                                    />
                                </div>

                                {/* UF e CEP */}
                                <div className="space-y-2">
                                    <Label htmlFor="uf">UF</Label>
                                    <Input
                                        id="uf"
                                        value={companyConfig.uf}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, uf: e.target.value })}
                                        placeholder="UF"
                                        maxLength={2}
                                        className="w-24"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cep">CEP</Label>
                                    <Input
                                        id="cep"
                                        value={companyConfig.cep}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, cep: e.target.value })}
                                        placeholder="00.000-000"
                                    />
                                </div>

                                {/* Inscrição Estadual */}
                                <div className="space-y-2">
                                    <Label htmlFor="inscricao">Inscrição Estadual</Label>
                                    <Input
                                        id="inscricao"
                                        value={companyConfig.inscricao}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, inscricao: e.target.value })}
                                        placeholder="Inscrição estadual"
                                    />
                                </div>

                                {/* Telefones */}
                                <div className="space-y-2">
                                    <Label htmlFor="fones">Telefones</Label>
                                    <Input
                                        id="fones"
                                        value={companyConfig.fones}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, fones: e.target.value })}
                                        placeholder="(00) 0000-0000"
                                    />
                                </div>

                                {/* Separador visual */}
                                <div className="col-span-2 border-t border-gray-200 my-2"></div>

                                {/* Logotipo */}
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="logotipo" className="flex items-center gap-2">
                                        <Image className="w-4 h-4" />
                                        Logotipo
                                    </Label>
                                    <div className="flex gap-4 items-start">
                                        <div className="flex-1">
                                            <div className="relative">
                                                <Input
                                                    id="logotipo"
                                                    value={companyConfig.logotipo}
                                                    onChange={(e) => setCompanyConfig({ ...companyConfig, logotipo: e.target.value })}
                                                    placeholder="C:\SalesMasters\Imagens\logo.png"
                                                    className="pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => document.getElementById('logoFileInput')?.click()}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title="Procurar arquivo"
                                                >
                                                    <Search className="w-5 h-5" />
                                                </button>
                                                <input
                                                    type="file"
                                                    id="logoFileInput"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            try {
                                                                const formData = new FormData();
                                                                formData.append('logo', file);

                                                                const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/company/upload-logo'), {
                                                                    method: 'POST',
                                                                    body: formData
                                                                });

                                                                const data = await response.json();

                                                                if (data.success) {
                                                                    setCompanyConfig({ ...companyConfig, logotipo: data.path });
                                                                } else {
                                                                    alert('Erro ao enviar logo: ' + data.message);
                                                                }
                                                            } catch (error) {
                                                                alert('Erro ao enviar logo: ' + error.message);
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        {/* Preview do Logotipo */}
                                        <div className="w-40 h-28 border border-gray-300 rounded-md flex items-center justify-center bg-gray-50 overflow-hidden flex-shrink-0">
                                            {companyConfig.logotipo ? (
                                                <img
                                                    src={getApiUrl(NODE_API_URL, `/api/image?path=${encodeURIComponent(companyConfig.logotipo)}`)}
                                                    alt="Logotipo"
                                                    className="max-w-full max-h-full object-contain"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div className={`text-xs text-gray-400 text-center ${companyConfig.logotipo ? 'hidden' : 'flex'} flex-col items-center`}>
                                                <Image className="w-8 h-8 mb-1 text-gray-300" />
                                                <span>Preview</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {companyResult && (
                                <Alert className={companyResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                                    {companyResult.success ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <AlertDescription className={companyResult.success ? 'text-green-800' : 'text-red-800'}>
                                        <strong>{companyResult.message}</strong>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button
                                    onClick={handleSaveCompany}
                                    disabled={companySaving || !companyConfig.nome}
                                >
                                    {companySaving ? 'Salvando...' : '💾 Salvar Configuração'}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Master Panel Tab - Only for Hamilton */}
                        {isHamilton && (
                            <TabsContent value="master">
                                <MasterPanel />
                            </TabsContent>
                        )}
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default DatabaseConfig;
