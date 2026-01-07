import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Crown, Building2, Users, Ban, CheckCircle2, AlertCircle,
    Plus, Edit, Trash2, RefreshCw, Search, ExternalLink, Loader2,
    UserCog, Key, X, ChevronDown, ChevronUp, Database
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const MasterPanel = () => {
    const [empresas, setEmpresas] = useState([]);
    const [metricas, setMetricas] = useState({ total: 0, ativas: 0, bloqueadas: 0, inadimplentes: 0, degustacao: 0 });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [searchingCnpj, setSearchingCnpj] = useState(false);
    const [formData, setFormData] = useState({
        cnpj: '', razao_social: '', nome_fantasia: '', email_contato: '', telefone: '',
        status: 'ATIVO', data_vencimento: '', valor_mensalidade: '',
        db_host: '', db_nome: '', db_usuario: '', db_senha: '', db_porta: 5432
    });
    const [result, setResult] = useState(null);
    const [testingConnection, setTestingConnection] = useState(false);

    // Estado para gerenciamento de usuários
    const [expandedEmpresa, setExpandedEmpresa] = useState(null);
    const [usuarios, setUsuarios] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showUserForm, setShowUserForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userFormData, setUserFormData] = useState({
        nome: '', sobrenome: '', senha: '', email: '', master: false, ativo: true
    });

    const resetUserForm = () => {
        setUserFormData({
            nome: '', sobrenome: '', senha: '', email: '', master: false, ativo: true
        });
    };

    const user = JSON.parse(sessionStorage.getItem('user') || '{}');

    // Carregar empresas
    const loadEmpresas = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/master/empresas'), {
                headers: { 'x-user-role': user.role || 'admin' }
            });
            const data = await response.json();
            if (data.success) {
                setEmpresas(data.data);
                setMetricas(data.metricas);
            }
        } catch (error) {
            console.error('Erro ao carregar empresas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmpresas();
    }, []);

    // Carregar usuários de uma empresa
    const loadUsuarios = async (empresaId) => {
        setLoadingUsers(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/empresas/${empresaId}/usuarios`), {
                headers: { 'x-user-role': user.role || 'admin' }
            });
            const data = await response.json();
            if (data.success) {
                setUsuarios(data.data);
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao carregar usuários.' });
        } finally {
            setLoadingUsers(false);
        }
    };

    // Toggle expandir/recolher usuários
    const toggleUsuarios = async (empresa) => {
        if (expandedEmpresa === empresa.id) {
            setExpandedEmpresa(null);
            setUsuarios([]);
        } else {
            setExpandedEmpresa(empresa.id);
            await loadUsuarios(empresa.id);
        }
    };

    // Salvar usuário (criar/editar)
    const handleSaveUser = async () => {
        try {
            const isEdit = editingUser?.codigo;
            const url = isEdit
                ? getApiUrl(NODE_API_URL, `/api/master/empresas/${expandedEmpresa}/usuarios/${editingUser.codigo}`)
                : getApiUrl(NODE_API_URL, `/api/master/empresas/${expandedEmpresa}/usuarios`);

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role
                },
                body: JSON.stringify(userFormData)
            });
            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                setShowUserForm(false);
                setEditingUser(null);
                resetUserForm();
                await loadUsuarios(expandedEmpresa);
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao salvar usuário.' });
        }
    };

    // Excluir usuário
    const handleDeleteUser = async (codigo, nome) => {
        if (!confirm(`Deseja excluir o usuário "${nome}"?`)) return;

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/empresas/${expandedEmpresa}/usuarios/${codigo}`), {
                method: 'DELETE',
                headers: { 'x-user-role': user.role || 'admin' }
            });
            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                await loadUsuarios(expandedEmpresa);
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao excluir usuário.' });
        }
    };

    // Reset senha
    const handleResetSenha = async (codigo, nome) => {
        const novaSenha = prompt(`Nova senha para ${nome}:`, '123456');
        if (novaSenha === null) return;

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/empresas/${expandedEmpresa}/usuarios/${codigo}/reset-senha`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role || 'admin'
                },
                body: JSON.stringify({ nova_senha: novaSenha })
            });
            const data = await response.json();
            setResult({ success: data.success, message: data.message });
        } catch (error) {
            setResult({ success: false, message: 'Erro ao resetar senha.' });
        }
    };


    const openEditUserForm = (u) => {
        setEditingUser(u);
        setUserFormData({
            nome: u.nome || '',
            sobrenome: u.sobrenome || '',
            senha: '',
            usuario: u.usuario || '',
            grupo: u.grupo || '0002',
            master: u.master || false,
            gerencia: u.gerencia || false
        });
        setShowUserForm(true);
    };

    // Buscar dados do CNPJ
    const handleSearchCnpj = async () => {
        if (!formData.cnpj || formData.cnpj.length < 14) {
            setResult({ success: false, message: 'Digite um CNPJ válido.' });
            return;
        }

        setSearchingCnpj(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/buscar-cnpj/${formData.cnpj}`), {
                headers: { 'x-user-role': user.role || 'admin' }
            });
            const data = await response.json();

            if (data.success) {
                if (data.exists) {
                    setResult({ success: false, message: data.message || 'CNPJ já cadastrado!' });
                } else {
                    setFormData(prev => ({
                        ...prev,
                        ...data.data,
                        cnpj: data.data.cnpj || prev.cnpj
                    }));
                    setResult({ success: true, message: `Dados encontrados via ${data.source || 'busca'}!` });
                }
            } else {
                setResult({ success: false, message: data.message || 'Erro ao buscar CNPJ.' });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao buscar CNPJ.' });
        } finally {
            setSearchingCnpj(false);
        }
    };

    // Filtrar empresas
    const filteredEmpresas = empresas.filter(e =>
        e.razao_social?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.cnpj?.includes(searchTerm.replace(/\D/g, '')) ||
        e.nome_fantasia?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Alterar status
    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/empresas/${id}/status`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role || 'admin'
                },
                body: JSON.stringify({ status: newStatus })
            });
            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                loadEmpresas();
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao alterar status.' });
        }
    };

    const handleSave = async () => {
        // Validação básica
        if (!formData.cnpj || !formData.razao_social || !formData.db_host || !formData.db_nome || !formData.db_usuario) {
            setResult({ success: false, message: 'Por favor, preencha todos os campos obrigatórios (*).' });
            return;
        }

        try {
            const isEdit = selectedEmpresa?.id;
            const url = isEdit
                ? getApiUrl(NODE_API_URL, `/api/master/empresas/${selectedEmpresa.id}`)
                : getApiUrl(NODE_API_URL, '/api/master/empresas');

            const response = await fetch(url, {
                method: isEdit ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role || 'admin'
                },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                setShowForm(false);
                setSelectedEmpresa(null);
                resetForm();
                loadEmpresas();
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao salvar empresa.' });
        }
    };

    // Testar conexão com o banco da empresa
    const handleTestConnection = async () => {
        setTestingConnection(true);
        setResult(null);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/master/test-connection'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role || 'admin'
                },
                body: JSON.stringify({
                    db_host: formData.db_host,
                    db_nome: formData.db_nome,
                    db_usuario: formData.db_usuario,
                    db_senha: formData.db_senha,
                    db_porta: formData.db_porta
                })
            });
            const data = await response.json();
            setResult({ success: data.success, message: data.message });
        } catch (error) {
            setResult({ success: false, message: 'Erro ao testar conexão: ' + error.message });
        } finally {
            setTestingConnection(false);
        }
    };

    // Excluir empresa
    const handleDelete = async (id, nome) => {
        if (!confirm(`Deseja realmente EXCLUIR a empresa "${nome}"? Esta ação é irreversível!`)) return;

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/master/empresas/${id}`), {
                method: 'DELETE',
                headers: { 'x-user-role': user.role || 'admin' }
            });
            const data = await response.json();
            if (data.success) {
                setResult({ success: true, message: data.message });
                loadEmpresas();
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao excluir empresa.' });
        }
    };

    // Alternar tenant (switch)
    const handleSwitchTenant = async (empresa) => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/master/switch-tenant'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user.role || 'admin'
                },
                body: JSON.stringify({ empresa_id: empresa.id })
            });
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('tenantConfig', JSON.stringify(data.tenantConfig));
                setResult({ success: true, message: `Conectado a: ${empresa.razao_social}` });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                setResult({ success: false, message: data.message });
            }
        } catch (error) {
            setResult({ success: false, message: 'Erro ao alternar empresa.' });
        }
    };

    const resetForm = () => {
        setFormData({
            cnpj: '', razao_social: '', nome_fantasia: '', email_contato: '', telefone: '',
            status: 'ATIVO', data_vencimento: '', valor_mensalidade: '',
            db_host: '', db_nome: '', db_usuario: '', db_senha: '', db_porta: 5432
        });
    };

    const openEditForm = (empresa) => {
        setSelectedEmpresa(empresa);
        setFormData({
            cnpj: empresa.cnpj || '',
            razao_social: empresa.razao_social || '',
            nome_fantasia: empresa.nome_fantasia || '',
            email_contato: empresa.email_contato || '',
            telefone: empresa.telefone || '',
            status: empresa.status || 'ATIVO',
            data_vencimento: empresa.data_vencimento?.split('T')[0] || '',
            valor_mensalidade: empresa.valor_mensalidade || '',
            db_host: empresa.db_host || '',
            db_nome: empresa.db_nome || '',
            db_usuario: empresa.db_usuario || '',
            db_senha: '',
            db_porta: empresa.db_porta || 5432
        });
        setShowForm(true);
    };

    const getStatusBadge = (status) => {
        const styles = {
            'ATIVO': 'bg-green-100 text-green-800 border-green-300',
            'BLOQUEADO': 'bg-red-100 text-red-800 border-red-300',
            'INADIMPLENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'DEGUSTAÇÃO': 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    const formatCNPJ = (cnpj) => {
        if (!cnpj) return '';
        const clean = cnpj.replace(/\D/g, '');
        return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    return (
        <div className="space-y-6">
            {/* Header com Métricas */}
            <div className="grid grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-emerald-600">{metricas.total}</p>
                        <p className="text-sm text-gray-600">Total</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-green-600">{metricas.ativas}</p>
                        <p className="text-sm text-gray-600">Ativas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-red-600">{metricas.bloqueadas}</p>
                        <p className="text-sm text-gray-600">Bloqueadas</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-yellow-600">{metricas.inadimplentes}</p>
                        <p className="text-sm text-gray-600">Inadimplentes</p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
                    <CardContent className="p-4 text-center">
                        <p className="text-3xl font-bold text-blue-600">{metricas.degustacao}</p>
                        <p className="text-sm text-gray-600">Degustação</p>
                    </CardContent>
                </Card>
            </div>

            {/* Result Alert */}
            {result && (
                <Alert className={result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                    {result.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                    <AlertDescription className={result.success ? 'text-green-800' : 'text-red-800'}>
                        {result.message}
                    </AlertDescription>
                </Alert>
            )}

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-80"
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={loadEmpresas}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                <Button onClick={() => { resetForm(); setSelectedEmpresa(null); setShowForm(true); }}>
                    <Plus className="h-4 w-4 mr-2" /> Nova Empresa
                </Button>
            </div>

            {/* Form Modal - Empresa */}
            {showForm && (
                <Card className="border-2 border-slate-200 shadow-xl bg-white overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                    <CardHeader className="bg-slate-900 text-white py-4">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                {selectedEmpresa ? <Edit className="h-5 w-5 text-amber-400" /> : <Plus className="h-5 w-5 text-amber-400" />}
                                <span>{selectedEmpresa ? 'Editar Empresa' : 'Nova Empresa'}</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-slate-800"
                                onClick={() => { setShowForm(false); setSelectedEmpresa(null); setResult(null); }}
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-bold flex items-center gap-1">
                                    CNPJ <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={formData.cnpj}
                                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                        placeholder="00.000.000/0000-00"
                                        disabled={!!selectedEmpresa}
                                        className="font-mono text-lg border-slate-300 focus:ring-slate-500"
                                    />
                                    {!selectedEmpresa && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={handleSearchCnpj}
                                            disabled={searchingCnpj}
                                            className="shrink-0 bg-slate-100 hover:bg-slate-200"
                                        >
                                            {searchingCnpj ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4 text-slate-600" />}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Razão Social <span className="text-red-500">*</span></Label>
                                <Input
                                    value={formData.razao_social}
                                    onChange={e => setFormData({ ...formData, razao_social: e.target.value })}
                                    className="border-slate-300"
                                    placeholder="Nome jurídico da empresa"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Nome Fantasia</Label>
                                <Input
                                    value={formData.nome_fantasia}
                                    onChange={e => setFormData({ ...formData, nome_fantasia: e.target.value })}
                                    className="border-slate-300"
                                    placeholder="Como a empresa é conhecida"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Email de Contato</Label>
                                <Input
                                    type="email"
                                    value={formData.email_contato}
                                    onChange={e => setFormData({ ...formData, email_contato: e.target.value })}
                                    className="border-slate-300"
                                    placeholder="contato@empresa.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Telefone</Label>
                                <Input
                                    value={formData.telefone}
                                    onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                                    className="border-slate-300"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Status do Plano</Label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full h-10 px-3 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-slate-500"
                                >
                                    <option value="ATIVO">✅ ATIVO</option>
                                    <option value="BLOQUEADO">🚫 BLOQUEADO</option>
                                    <option value="INADIMPLENTE">⚠️ INADIMPLENTE</option>
                                    <option value="DEGUSTAÇÃO">💎 DEGUSTAÇÃO</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Vencimento da Licença</Label>
                                <Input
                                    type="date"
                                    value={formData.data_vencimento}
                                    onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                                    className="border-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">Valor Mensalidade (R$)</Label>
                                <Input
                                    type="number"
                                    value={formData.valor_mensalidade}
                                    onChange={e => setFormData({ ...formData, valor_mensalidade: e.target.value })}
                                    className="border-slate-300"
                                    step="0.01"
                                    placeholder="0,00"
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Database className="h-5 w-5 text-indigo-500" />
                                    Configurações de Banco de Dados (PostgreSQL)
                                </h4>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTestConnection}
                                    disabled={testingConnection || !formData.db_host || !formData.db_nome}
                                    className="text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                                >
                                    {testingConnection ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                                    Testar Conexão
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                                <div className="md:col-span-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Host / Servidor *</Label>
                                    <Input
                                        value={formData.db_host}
                                        onChange={e => setFormData({ ...formData, db_host: e.target.value })}
                                        placeholder="ex: node123.saveincloud.net"
                                        className="border-slate-300"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Porta</Label>
                                    <Input
                                        type="number"
                                        value={formData.db_porta}
                                        onChange={e => setFormData({ ...formData, db_porta: parseInt(e.target.value) || 5432 })}
                                        className="border-slate-300"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Nome do Banco *</Label>
                                    <Input
                                        value={formData.db_nome}
                                        onChange={e => setFormData({ ...formData, db_nome: e.target.value })}
                                        className="border-slate-300"
                                        placeholder="basesales"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs uppercase text-slate-500 font-bold">Usuário *</Label>
                                    <Input
                                        value={formData.db_usuario}
                                        onChange={e => setFormData({ ...formData, db_usuario: e.target.value })}
                                        className="border-slate-300"
                                        placeholder="postgres"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <Label className="text-xs uppercase text-slate-500 font-bold">
                                        Senha {selectedEmpresa ? '(deixe vazio para manter atual)' : '*'}
                                    </Label>
                                    <Input
                                        type="password"
                                        value={formData.db_senha}
                                        onChange={e => setFormData({ ...formData, db_senha: e.target.value })}
                                        className="border-slate-300"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                            <Button
                                variant="outline"
                                onClick={() => { setShowForm(false); setSelectedEmpresa(null); setResult(null); }}
                                className="border-slate-200 text-slate-600 hover:bg-slate-50"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSave}
                                className="bg-slate-900 hover:bg-slate-800 text-white px-8"
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                {selectedEmpresa ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Lista de Empresas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Empresas Cadastradas ({filteredEmpresas.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center py-8">Carregando...</div>
                        ) : filteredEmpresas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Nenhuma empresa encontrada</div>
                        ) : (
                            filteredEmpresas.map(empresa => (
                                <div key={empresa.id} className="border rounded-lg overflow-hidden">
                                    {/* Linha da empresa */}
                                    <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleUsuarios(empresa)}
                                                className="p-1 hover:bg-gray-200 rounded"
                                                title="Ver usuários"
                                            >
                                                {expandedEmpresa === empresa.id ?
                                                    <ChevronUp className="h-5 w-5 text-gray-600" /> :
                                                    <ChevronDown className="h-5 w-5 text-gray-600" />
                                                }
                                            </button>
                                            <div className="font-mono text-xs whitespace-nowrap">{formatCNPJ(empresa.cnpj)}</div>
                                            <div>
                                                <div className="font-medium">{empresa.razao_social}</div>
                                                {empresa.nome_fantasia && <div className="text-xs text-gray-500">{empresa.nome_fantasia}</div>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {getStatusBadge(empresa.status)}
                                            <div className="text-xs text-gray-500">{empresa.db_nome}@{empresa.db_host?.substring(0, 15)}...</div>
                                            <div className="flex items-center gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => handleSwitchTenant(empresa)} title="Acessar">
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => openEditForm(empresa)} title="Editar">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                {empresa.status === 'ATIVO' ? (
                                                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(empresa.id, 'BLOQUEADO')} title="Bloquear">
                                                        <Ban className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" variant="ghost" onClick={() => handleStatusChange(empresa.id, 'ATIVO')} title="Ativar">
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" onClick={() => handleDelete(empresa.id, empresa.razao_social)} title="Excluir">
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Painel de usuários expandido */}
                                    {expandedEmpresa === empresa.id && (
                                        <div className="bg-gray-50 border-t p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <UserCog className="h-4 w-4" />
                                                    Usuários de {empresa.razao_social}
                                                </h4>
                                                <Button size="sm" onClick={() => { resetUserForm(); setEditingUser(null); setShowUserForm(true); }}>
                                                    <Plus className="h-4 w-4 mr-1" /> Novo Usuário
                                                </Button>
                                            </div>

                                            {/* Form de usuário */}
                                            {showUserForm && (
                                                <Card className="mb-6 border-slate-200 shadow-lg bg-white overflow-hidden animate-in zoom-in-95 duration-200">
                                                    <CardHeader className="bg-slate-800 text-white py-2 px-4 flex flex-row items-center justify-between">
                                                        <h5 className="text-sm font-bold flex items-center gap-2">
                                                            {editingUser ? <Edit className="h-3 w-3 text-amber-400" /> : <Plus className="h-3 w-3 text-amber-400" />}
                                                            {editingUser ? `Editando Usuário: ${editingUser.usuario}` : 'Adesão de Novo Usuário'}
                                                        </h5>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-slate-700" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </CardHeader>
                                                    <CardContent className="p-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-bold text-slate-600">Nome *</Label>
                                                                <Input
                                                                    value={userFormData.nome}
                                                                    onChange={e => setUserFormData({ ...userFormData, nome: e.target.value })}
                                                                    className="h-9 text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-bold text-slate-600">Sobrenome *</Label>
                                                                <Input
                                                                    value={userFormData.sobrenome}
                                                                    onChange={e => setUserFormData({ ...userFormData, sobrenome: e.target.value })}
                                                                    className="h-9 text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-bold text-slate-600">Email (Login) *</Label>
                                                                <Input
                                                                    value={userFormData.email}
                                                                    onChange={e => setUserFormData({ ...userFormData, email: e.target.value })}
                                                                    className="h-9 text-sm font-mono"
                                                                    placeholder="exemplo@email.com"
                                                                />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-bold text-slate-600">Senha {editingUser ? '(vazio = manter)' : ''}</Label>
                                                                <Input
                                                                    type="password"
                                                                    value={userFormData.senha}
                                                                    onChange={e => setUserFormData({ ...userFormData, senha: e.target.value })}
                                                                    className="h-9 text-sm"
                                                                    placeholder="••••••••"
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-6 pt-6">
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${userFormData.master ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300 group-hover:border-indigo-400'}`}>
                                                                        {userFormData.master && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                        <input type="checkbox" className="hidden" checked={userFormData.master} onChange={e => setUserFormData({ ...userFormData, master: e.target.checked })} />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700">Acesso Master</span>
                                                                </label>
                                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${userFormData.ativo ? 'bg-emerald-600 border-emerald-600' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                                                                        {userFormData.ativo && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                                        <input type="checkbox" className="hidden" checked={userFormData.ativo} onChange={e => setUserFormData({ ...userFormData, ativo: e.target.checked })} />
                                                                    </div>
                                                                    <span className="text-sm font-medium text-slate-700">Ativo</span>
                                                                </label>
                                                            </div>
                                                            <div className="col-span-1 md:col-span-2 flex items-end justify-end gap-2">
                                                                <Button variant="ghost" size="sm" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>Cancelar</Button>
                                                                <Button size="sm" className="bg-slate-900 text-white hover:bg-slate-800" onClick={handleSaveUser}>
                                                                    {editingUser ? 'Atualizar Usuário' : 'Criar Usuário'}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            {/* Tabela de usuários */}
                                            {loadingUsers ? (
                                                <div className="text-center py-4">Carregando usuários...</div>
                                            ) : usuarios.length === 0 ? (
                                                <div className="text-center py-4 text-gray-500">Nenhum usuário cadastrado</div>
                                            ) : (
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="border-b bg-gray-100">
                                                            <th className="px-3 py-2 text-left">Nome</th>
                                                            <th className="px-3 py-2 text-left">Email / Login</th>
                                                            <th className="px-3 py-2 text-center">Admin</th>
                                                            <th className="px-3 py-2 text-center">Status</th>
                                                            <th className="px-3 py-2 text-center">Ações</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {usuarios.map(u => (
                                                            <tr key={u.codigo} className="border-b hover:bg-white">
                                                                <td className="px-3 py-2">{u.nome} {u.sobrenome}</td>
                                                                <td className="px-3 py-2 font-mono text-xs">{u.usuario}</td>
                                                                <td className="px-3 py-2 text-center">{u.master ? '✓' : '-'}</td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${u.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {u.ativo ? 'Ativo' : 'Inativo'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <div className="flex items-center justify-center gap-1">
                                                                        <Button size="sm" variant="ghost" onClick={() => openEditUserForm(u)} title="Editar">
                                                                            <Edit className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => handleResetSenha(u.codigo, u.nome)} title="Reset Senha">
                                                                            <Key className="h-4 w-4 text-amber-600" />
                                                                        </Button>
                                                                        <Button size="sm" variant="ghost" onClick={() => handleDeleteUser(u.codigo, u.nome)} title="Excluir">
                                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                                        </Button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default MasterPanel;
