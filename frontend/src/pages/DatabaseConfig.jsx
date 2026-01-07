import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Settings, CheckCircle2, AlertCircle, Database, Building2, Image, FolderOpen, Search, Crown } from 'lucide-react';
import MasterPanel from '@/components/settings/MasterPanel';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const DatabaseConfig = () => {
    const [activeTab, setActiveTab] = useState('postgres');

    // PostgreSQL Config State
    const [config, setConfig] = useState({
        host: 'localhost',
        port: 5432,
        database: 'basesales',
        user: 'postgres',
        password: '',
        ssl: false
    });

    // Company Config State
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
        baseDadosLocal: 'C:\\SalesMasters\\Dados50\\Nova\\BASESALES.FDB',
        host: 'localhost',
        porta: 3070,
        username: 'SYSDBA',
        password: '',
        pastaBasica: 'C:\\SalesMasters\\'
    });

    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [companyResult, setCompanyResult] = useState(null);
    const [companySaving, setCompanySaving] = useState(false);

    // Verificar se é o Hamilton (Super Admin)
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    const isHamilton = user.role === 'superadmin';

    // Carregar configuração atual
    useEffect(() => {
        fetch(getApiUrl(NODE_API_URL, '/api/config/database'))
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setConfig(prev => ({ ...prev, ...data.config }));
                }
            })
            .catch(err => console.error('Erro ao carregar configuração:', err));

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

    const handleTest = async () => {
        setTesting(true);
        setResult(null);

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/database/test'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            setResult({
                success: data.success,
                message: data.message
            });
        } catch (error) {
            setResult({
                success: false,
                message: `Erro ao testar conexão: ${error.message}`
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setResult(null);

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/config/database/save'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const data = await response.json();
            setResult({
                success: data.success,
                message: data.message
            });
        } catch (error) {
            setResult({
                success: false,
                message: `Erro ao salvar configuração: ${error.message}`
            });
        } finally {
            setSaving(false);
        }
    };

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
                        <TabsList className={`grid w-full mb-6 ${isHamilton ? 'grid-cols-3' : 'grid-cols-2'}`}>
                            <TabsTrigger value="postgres" className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Dados PostgreSQL
                            </TabsTrigger>
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

                        {/* PostgreSQL Tab */}
                        <TabsContent value="postgres" className="space-y-6">
                            <Alert className="border-blue-200 bg-blue-50">
                                <Database className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    Configure as credenciais de conexão com o banco de dados PostgreSQL.
                                    Funciona tanto para banco local quanto em nuvem.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="host">Host / Servidor *</Label>
                                    <Input
                                        id="host"
                                        value={config.host}
                                        onChange={(e) => setConfig({ ...config, host: e.target.value })}
                                        placeholder="localhost ou IP do servidor"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="port">Porta *</Label>
                                    <Input
                                        id="port"
                                        type="number"
                                        value={config.port}
                                        onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) })}
                                        placeholder="5432"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="database">Nome do Banco *</Label>
                                    <Input
                                        id="database"
                                        value={config.database}
                                        onChange={(e) => setConfig({ ...config, database: e.target.value })}
                                        placeholder="basesales"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="user">Usuário *</Label>
                                    <Input
                                        id="user"
                                        value={config.user}
                                        onChange={(e) => setConfig({ ...config, user: e.target.value })}
                                        placeholder="postgres"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="password">Senha *</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={config.password}
                                        onChange={(e) => setConfig({ ...config, password: e.target.value })}
                                        placeholder="Digite a senha do banco"
                                    />
                                </div>

                                <div className="space-y-2 col-span-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="ssl"
                                            checked={config.ssl}
                                            onChange={(e) => setConfig({ ...config, ssl: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <Label htmlFor="ssl" className="cursor-pointer">
                                            Usar SSL (recomendado para conexões em nuvem)
                                        </Label>
                                    </div>
                                </div>
                            </div>

                            {result && (
                                <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                                    {result.success ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                    )}
                                    <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                                        <strong>{result.message}</strong>
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={handleTest}
                                    disabled={testing || !config.host || !config.database || !config.user || !config.password}
                                >
                                    {testing ? 'Testando...' : '🔍 Testar Conexão'}
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={saving || !config.host || !config.database || !config.user || !config.password}
                                >
                                    {saving ? 'Salvando...' : '💾 Salvar Configuração'}
                                </Button>
                            </div>
                        </TabsContent>

                        {/* Company Tab */}
                        <TabsContent value="company" className="space-y-6">
                            <Alert className="border-emerald-200 bg-emerald-50">
                                <Building2 className="h-4 w-4 text-emerald-600" />
                                <AlertDescription className="text-emerald-800">
                                    Configure os dados da empresa/representação para uso nos documentos e relatórios.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-4">
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

                                {/* CNPJ e Inscrição */}
                                <div className="space-y-2">
                                    <Label htmlFor="cnpj">CNPJ</Label>
                                    <Input
                                        id="cnpj"
                                        value={companyConfig.cnpj}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, cnpj: e.target.value })}
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>

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
                                <div className="space-y-2 col-span-2">
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

                                {/* Base de Dados Local */}
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="baseDadosLocal" className="flex items-center gap-2">
                                        <Database className="w-4 h-4" />
                                        Base de Dados Local (Firebird)
                                    </Label>
                                    <Input
                                        id="baseDadosLocal"
                                        value={companyConfig.baseDadosLocal}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, baseDadosLocal: e.target.value })}
                                        placeholder="C:\SalesMasters\Dados\BASESALES.FDB"
                                    />
                                </div>

                                {/* Host e Porta */}
                                <div className="space-y-2">
                                    <Label htmlFor="companyHost">Host</Label>
                                    <Input
                                        id="companyHost"
                                        value={companyConfig.host}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, host: e.target.value })}
                                        placeholder="localhost"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="porta">Porta</Label>
                                    <Input
                                        id="porta"
                                        type="number"
                                        value={companyConfig.porta}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, porta: parseInt(e.target.value) || 3070 })}
                                        placeholder="3070"
                                    />
                                </div>

                                {/* Username e Password (para banco offline) */}
                                <div className="space-y-2">
                                    <Label htmlFor="username">Usuário (BD Local)</Label>
                                    <Input
                                        id="username"
                                        value={companyConfig.username}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, username: e.target.value })}
                                        placeholder="SYSDBA"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="companyPassword">Senha (BD Local)</Label>
                                    <Input
                                        id="companyPassword"
                                        type="password"
                                        value={companyConfig.password}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>

                                {/* Pasta Básica */}
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="pastaBasica" className="flex items-center gap-2">
                                        <FolderOpen className="w-4 h-4" />
                                        Pasta Básica
                                    </Label>
                                    <Input
                                        id="pastaBasica"
                                        value={companyConfig.pastaBasica}
                                        onChange={(e) => setCompanyConfig({ ...companyConfig, pastaBasica: e.target.value })}
                                        placeholder="C:\SalesMasters\"
                                    />
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
