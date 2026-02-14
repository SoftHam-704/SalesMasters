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
import {
    Save, Mail, Settings, Monitor, Package, User, Hash, FileText,
    AtSign, ShieldCheck, Server, Key, ListOrdered, MousePointer2,
    BellRing, PlayCircle, Truck, Layers, Copy, Zap, Info, Plus, ArrowLeft, Trash2, CheckCircle2, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

export default function ParametrosPage() {
    const [formData, setFormData] = useState({
        par_usuario: null,
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
        par_telemkttipo: 'E',
        par_iniciapedido: 'P',
        par_tipofretepadrao: 'F',
        par_emailserver: '',
        par_email: '',
        par_emailuser: '',
        par_emailporta: 587,
        par_emailpassword: '',
        par_emailtls: false,
        par_emailssl: false,
        par_emailalternativo: '',
        par_obs_padrao: ''
    });

    const [view, setView] = useState('list'); // 'list' ou 'edit'
    const [allParams, setAllParams] = useState([]);
    const [systemUsers, setSystemUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [testingEmail, setTestingEmail] = useState(false);
    const [loggedUser, setLoggedUser] = useState(null);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const handleTestConnection = async () => {
        setTestingEmail(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/email/test-connection'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error('Erro técnico ao tentar conectar: ' + error.message);
        } finally {
            setTestingEmail(false);
        }
    };

    useEffect(() => {
        const userStr = sessionStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setLoggedUser(user);
                loadAllParameters();
                loadSystemUsers();
            } catch (e) {
                console.error('Erro ao parsear usuário:', e);
            }
        }
    }, []);

    const loadAllParameters = async () => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/parametros/all'));
            const data = await response.json();
            if (data.success) {
                setAllParams(data.data);
            }
        } catch (error) {
            console.error('Erro ao listar parâmetros:', error);
            toast.error('Erro ao carregar lista de usuários');
        } finally {
            setLoading(false);
        }
    };

    const loadSystemUsers = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/system/users'));
            const data = await response.json();
            if (data.success) {
                setSystemUsers(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários do sistema:', error);
        }
    };

    const handleSave = async () => {
        if (!formData.par_usuario) {
            toast.error('Selecione um usuário para salvar as configurações');
            return;
        }

        setSaving(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/parametros'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                toast.success('✨ Configurações salvas com sucesso!');
                loadAllParameters();
                setView('list');
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

    const handleDelete = async (userId) => {
        if (!window.confirm('Deseja realmente excluir os parâmetros deste usuário?')) return;

        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${userId}`), {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Parâmetros excluídos');
                loadAllParameters();
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            toast.error('Erro ao excluir parâmetros');
        }
    };

    const handleEdit = (paramData) => {
        setFormData({
            ...paramData,
            par_usuario: paramData.par_usuario || paramData.codigo, // Fallback caso venha do JOIN
            par_obs_padrao: paramData.par_obs_padrao || ''
        });
        setSelectedUserId(paramData.par_usuario);
        setView('edit');
    };

    const handleCreateNew = () => {
        setFormData({
            par_usuario: null,
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
            par_telemkttipo: 'E',
            par_iniciapedido: 'P',
            par_tipofretepadrao: 'F',
            par_emailserver: '',
            par_email: '',
            par_emailuser: '',
            par_emailporta: 587,
            par_emailpassword: '',
            par_emailtls: false,
            par_emailssl: false,
            par_emailalternativo: '',
            par_obs_padrao: ''
        });
        setSelectedUserId(null);
        setView('edit');
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // --- Custom UI Components for Parametros ---

    const SelectionCard = ({ title, icon: Icon, children, className = "" }) => (
        <div className={cn(
            "relative group bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-300 hover:shadow-lg hover:border-emerald-100/50",
            className
        )}>
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={16} strokeWidth={2.5} />
                </div>
                <Label className="text-[13px] font-bold text-gray-700 uppercase tracking-tight">{title}</Label>
            </div>
            {children}
        </div>
    );

    const ModernRadioOption = ({ field, value, label, currentValue }) => {
        const active = String(currentValue) === String(value);
        return (
            <label
                className={cn(
                    "flex-1 flex items-center justify-center px-3 py-2.5 rounded-xl border text-[13px] font-bold cursor-pointer transition-all duration-200",
                    active
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20"
                        : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100 hover:text-gray-700"
                )}
            >
                <RadioGroupItem value={String(value)} id={`${field}-${value}`} className="sr-only" />
                {label}
            </label>
        );
    };

    if (loading && view === 'list') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50/50">
                <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium animate-pulse">Carregando painel de gerenciamento...</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden">

            {/* Premium Header */}
            <div className="px-8 py-6 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                        <Settings size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Parametrização do Sistema</h1>
                            {view === 'edit' && (
                                <Button
                                    variant="ghost"
                                    onClick={() => setView('list')}
                                    className="h-8 px-2 text-slate-400 hover:text-emerald-600"
                                >
                                    <ArrowLeft size={16} className="mr-2" /> Voltar ao Grid
                                </Button>
                            )}
                        </div>
                        <p className="text-[13px] text-gray-500 font-medium">
                            {view === 'list' ? 'Gestão de usuários e regras de negócio' : 'Configurando preferências e padrões de operação'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {view === 'list' ? (
                        <Button
                            onClick={handleCreateNew}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-6 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Novo Parâmetro
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                            {saving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full mr-2" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Salvar Alterações
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">
                <div className="max-w-[1400px] mx-auto space-y-10">

                    {view === 'list' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-3">
                                <ListOrdered size={20} className="text-emerald-500" />
                                <h2 className="text-[16px] font-black text-gray-800 uppercase tracking-widest">Usuários com Parâmetros Definidos</h2>
                            </div>

                            <Card className="border-gray-100 overflow-hidden rounded-2xl shadow-sm bg-white">
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-gray-100">
                                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Login</th>
                                                <th className="px-6 py-4 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest">Empresa Padrão</th>
                                                <th className="px-6 py-4 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {allParams.length > 0 ? allParams.map((p) => (
                                                <tr key={p.par_id} className="hover:bg-emerald-50/30 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs">
                                                                {p.nome?.charAt(0)}{p.sobrenome?.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700">{p.nome} {p.sobrenome}</p>
                                                                <p className="text-[10px] text-slate-400 font-medium">ID Interno: #{p.par_usuario}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-500 uppercase">{p.login_usuario}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase">
                                                            Layout Mod. {p.par_pedidopadrao}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                variant="outline" size="icon"
                                                                onClick={() => handleEdit(p)}
                                                                className="h-8 w-8 rounded-lg border-gray-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-200"
                                                            >
                                                                <FileText size={14} />
                                                            </Button>
                                                            <Button
                                                                variant="outline" size="icon"
                                                                onClick={() => handleDelete(p.par_usuario)}
                                                                className="h-8 w-8 rounded-lg border-gray-100 text-slate-400 hover:text-red-600 hover:border-red-200"
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-medium italic">
                                                        Nenhum usuário parametrizado no momento.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500 space-y-10">

                            {/* Seleção de Usuário (Apenas para novos ou edição) */}
                            <Card className="border-none shadow-xl shadow-emerald-950/5 overflow-hidden rounded-[24px] bg-white border-l-4 border-l-emerald-500">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                <User size={24} />
                                            </div>
                                            <div>
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">USUÁRIO RESPONSÁVEL</Label>
                                                {!selectedUserId ? (
                                                    <Select
                                                        onValueChange={(v) => handleFieldChange('par_usuario', parseInt(v))}
                                                    >
                                                        <SelectTrigger className="w-[300px] h-11 bg-gray-50 border-gray-200 font-black text-emerald-700">
                                                            <SelectValue placeholder="Selecione o Usuário..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {systemUsers.map(u => (
                                                                <SelectItem key={u.codigo} value={String(u.codigo)} className="font-bold">
                                                                    {u.nome} {u.sobrenome} ({u.usuario})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                                        {formData.nome || systemUsers.find(u => u.codigo === formData.par_usuario)?.nome} {formData.sobrenome || systemUsers.find(u => u.codigo === formData.par_usuario)?.sobrenome}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {formData.par_usuario && (
                                            <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">ID SISTEMA</p>
                                                    <p className="text-sm font-black text-slate-600">#{formData.par_usuario}</p>
                                                </div>
                                                <div className="w-[1px] h-8 bg-slate-200" />
                                                <div className="text-right">
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">STATUS</p>
                                                    <p className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> CONFIGURANDO
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Section: Configurações de Interface e Pedidos */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Monitor size={20} className="text-emerald-500" />
                                    <h2 className="text-[16px] font-black text-gray-800 uppercase tracking-widest">Interface e Operação</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                    <SelectionCard title="Ordem dos Pedidos" icon={ListOrdered}>
                                        <RadioGroup value={formData.par_ordemped} onValueChange={(v) => handleFieldChange('par_ordemped', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_ordemped" value="D" label="Por Data" currentValue={formData.par_ordemped} />
                                            <ModernRadioOption field="par_ordemped" value="N" label="Numérica" currentValue={formData.par_ordemped} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Velocidade Digitação" icon={Zap}>
                                        <RadioGroup value={String(formData.par_qtdenter)} onValueChange={(v) => handleFieldChange('par_qtdenter', parseInt(v))} className="grid grid-cols-2 gap-2">
                                            <ModernRadioOption field="par_qtdenter" value="1" label="Explosiva" currentValue={formData.par_qtdenter} />
                                            <ModernRadioOption field="par_qtdenter" value="2" label="Rápida" currentValue={formData.par_qtdenter} />
                                            <ModernRadioOption field="par_qtdenter" value="3" label="Padrão" currentValue={formData.par_qtdenter} />
                                            <ModernRadioOption field="par_qtdenter" value="4" label="Cuidadosa" currentValue={formData.par_qtdenter} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Formato Pesquisa" icon={MousePointer2}>
                                        <RadioGroup value={formData.par_fmtpesquisa} onValueChange={(v) => handleFieldChange('par_fmtpesquisa', v)} className="flex flex-col gap-2">
                                            <ModernRadioOption field="par_fmtpesquisa" value="C" label="Apenas Código" currentValue={formData.par_fmtpesquisa} />
                                            <ModernRadioOption field="par_fmtpesquisa" value="D" label="Código + Descrição" currentValue={formData.par_fmtpesquisa} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Pesquisa de Clientes" icon={User}>
                                        <RadioGroup value={formData.par_tipopesquisa} onValueChange={(v) => handleFieldChange('par_tipopesquisa', v)} className="flex flex-col gap-2">
                                            <ModernRadioOption field="par_tipopesquisa" value="R" label="Razão Social" currentValue={formData.par_tipopesquisa} />
                                            <ModernRadioOption field="par_tipopesquisa" value="N" label="Nome Reduzido" currentValue={formData.par_tipopesquisa} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Tipo CRM/Telemarketing" icon={Zap}>
                                        <RadioGroup value={formData.par_telemkttipo} onValueChange={(v) => handleFieldChange('par_telemkttipo', v)} className="flex flex-col gap-2">
                                            <ModernRadioOption field="par_telemkttipo" value="E" label="Efetivo" currentValue={formData.par_telemkttipo} />
                                            <ModernRadioOption field="par_telemkttipo" value="P" label="Prospecção" currentValue={formData.par_telemkttipo} />
                                        </RadioGroup>
                                    </SelectionCard>
                                </div>
                            </div>

                            {/* Section: Regras de Negócio */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <Package size={20} className="text-emerald-500" />
                                    <h2 className="text-[16px] font-black text-gray-800 uppercase tracking-widest">Regras de Negócio e Produtos</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                    <SelectionCard title="Casas Decimais (Qtd)" icon={Hash}>
                                        <RadioGroup value={formData.par_usadecimais} onValueChange={(v) => handleFieldChange('par_usadecimais', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_usadecimais" value="S" label="Habilitar" currentValue={formData.par_usadecimais} />
                                            <ModernRadioOption field="par_usadecimais" value="N" label="Desabilitar" currentValue={formData.par_usadecimais} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Precisão Decimais" icon={Info}>
                                        <RadioGroup value={String(formData.par_qtddecimais)} onValueChange={(v) => handleFieldChange('par_qtddecimais', parseInt(v))} className="flex gap-2">
                                            <ModernRadioOption field="par_qtddecimais" value="2" label="2 Casas" currentValue={formData.par_qtddecimais} />
                                            <ModernRadioOption field="par_qtddecimais" value="3" label="3 Casas" currentValue={formData.par_qtddecimais} />
                                            <ModernRadioOption field="par_qtddecimais" value="4" label="4 Casas" currentValue={formData.par_qtddecimais} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Itens Duplicados" icon={Copy}>
                                        <RadioGroup value={formData.par_itemduplicado} onValueChange={(v) => handleFieldChange('par_itemduplicado', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_itemduplicado" value="S" label="Permitir" currentValue={formData.par_itemduplicado} />
                                            <ModernRadioOption field="par_itemduplicado" value="N" label="Bloquear" currentValue={formData.par_itemduplicado} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Zerar Descontos Promo" icon={FileText}>
                                        <RadioGroup value={formData.par_zerapromo} onValueChange={(v) => handleFieldChange('par_zerapromo', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_zerapromo" value="S" label="Sim" currentValue={formData.par_zerapromo} />
                                            <ModernRadioOption field="par_zerapromo" value="N" label="Não" currentValue={formData.par_zerapromo} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Código Original" icon={Package}>
                                        <RadioGroup value={formData.par_mostracodori} onValueChange={(v) => handleFieldChange('par_mostracodori', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_mostracodori" value="S" label="Exibir" currentValue={formData.par_mostracodori} />
                                            <ModernRadioOption field="par_mostracodori" value="N" label="Ocultar" currentValue={formData.par_mostracodori} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Gerenciar Validades" icon={ShieldCheck}>
                                        <RadioGroup value={formData.par_validapromocao} onValueChange={(v) => handleFieldChange('par_validapromocao', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_validapromocao" value="S" label="Ativo" currentValue={formData.par_validapromocao} />
                                            <ModernRadioOption field="par_validapromocao" value="N" label="Inativo" currentValue={formData.par_validapromocao} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Salvar Automático" icon={Save}>
                                        <RadioGroup value={formData.par_salvapedidoauto} onValueChange={(v) => handleFieldChange('par_salvapedidoauto', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_salvapedidoauto" value="S" label="Sim" currentValue={formData.par_salvapedidoauto} />
                                            <ModernRadioOption field="par_salvapedidoauto" value="N" label="Não" currentValue={formData.par_salvapedidoauto} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Desconto por Grupos" icon={Layers}>
                                        <RadioGroup value={formData.par_descontogrupo} onValueChange={(v) => handleFieldChange('par_descontogrupo', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_descontogrupo" value="S" label="Ativo" currentValue={formData.par_descontogrupo} />
                                            <ModernRadioOption field="par_descontogrupo" value="N" label="Inativo" currentValue={formData.par_descontogrupo} />
                                        </RadioGroup>
                                    </SelectionCard>
                                </div>
                            </div>

                            {/* Section: Impressão e Envio */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <FileText size={20} className="text-emerald-500" />
                                    <h2 className="text-[16px] font-black text-gray-800 uppercase tracking-widest">Processamento e Logística</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                    <SelectionCard title="Iniciar Pedido como" icon={PlayCircle}>
                                        <RadioGroup value={formData.par_iniciapedido} onValueChange={(v) => handleFieldChange('par_iniciapedido', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_iniciapedido" value="P" label="Pedido" currentValue={formData.par_iniciapedido} />
                                            <ModernRadioOption field="par_iniciapedido" value="C" label="Cotação" currentValue={formData.par_iniciapedido} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Ordem Impressão" icon={ListOrdered}>
                                        <RadioGroup value={formData.par_ordemimpressao} onValueChange={(v) => handleFieldChange('par_ordemimpressao', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_ordemimpressao" value="N" label="Numérica" currentValue={formData.par_ordemimpressao} />
                                            <ModernRadioOption field="par_ordemimpressao" value="D" label="Digitação" currentValue={formData.par_ordemimpressao} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Tipo de Frete Padrao" icon={Truck}>
                                        <RadioGroup value={formData.par_tipofretepadrao} onValueChange={(v) => handleFieldChange('par_tipofretepadrao', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_tipofretepadrao" value="F" label="FOB" currentValue={formData.par_tipofretepadrao} />
                                            <ModernRadioOption field="par_tipofretepadrao" value="C" label="CIF" currentValue={formData.par_tipofretepadrao} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Confirmar Recebimento" icon={BellRing}>
                                        <RadioGroup value={formData.par_solicitarconfemail} onValueChange={(v) => handleFieldChange('par_solicitarconfemail', v)} className="flex gap-2">
                                            <ModernRadioOption field="par_solicitarconfemail" value="S" label="Solicitar" currentValue={formData.par_solicitarconfemail} />
                                            <ModernRadioOption field="par_solicitarconfemail" value="N" label="Ignorar" currentValue={formData.par_solicitarconfemail} />
                                        </RadioGroup>
                                    </SelectionCard>

                                    <SelectionCard title="Layout Pedido" icon={FileText}>
                                        <Select
                                            value={String(formData.par_pedidopadrao)}
                                            onValueChange={(v) => handleFieldChange('par_pedidopadrao', parseInt(v))}
                                        >
                                            <SelectTrigger className="w-full h-11 bg-gray-50 border-gray-100 rounded-xl font-bold text-gray-700">
                                                <SelectValue placeholder="Escolha o formato oficial" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-[300px]">
                                                {Array.from({ length: 28 }, (_, i) => i + 1).map(num => (
                                                    <SelectItem key={num} value={String(num)} className="font-bold py-2">
                                                        LAYOUT MODELO {num}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </SelectionCard>

                                    <div className="lg:col-span-3">
                                        <SelectionCard title="Mensagem Padrao Observações" icon={Info}>
                                            <Input
                                                value={formData.par_obs_padrao || ""}
                                                onChange={(e) => handleFieldChange('par_obs_padrao', e.target.value)}
                                                placeholder="Ex: Pedido sujeito a confirmação de estoque..."
                                                className="h-11 bg-gray-50 border-gray-100 rounded-xl font-bold"
                                            />
                                        </SelectionCard>
                                    </div>
                                </div>
                            </div>

                            {/* Section: E-mail Config */}
                            <Card className="border-none shadow-2xl shadow-emerald-950/5 overflow-hidden rounded-[32px] bg-white">
                                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                            <Mail size={24} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <CardTitle className="text-xl font-black text-white">Configurações de E-mail</CardTitle>
                                            <p className="text-emerald-100 text-[14px] font-medium">Configure o servidor SMTP para envio automático de pedidos</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                                    <div className="space-y-2 lg:col-span-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Server size={14} /> Servidor SMTP
                                        </Label>
                                        <Input
                                            value={formData.par_emailserver}
                                            onChange={(e) => handleFieldChange('par_emailserver', e.target.value)}
                                            placeholder="ex: smtp.office365.com"
                                            className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <AtSign size={14} /> Porta
                                        </Label>
                                        <Input
                                            type="number"
                                            value={formData.par_emailporta}
                                            onChange={(e) => handleFieldChange('par_emailporta', parseInt(e.target.value) || 587)}
                                            className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold text-center"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ShieldCheck size={14} /> Segurança
                                        </Label>
                                        <div className="flex h-12 items-center gap-6 px-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <Switch checked={formData.par_emailtls} onCheckedChange={(v) => handleFieldChange('par_emailtls', v)} />
                                                <span className="text-[13px] font-bold text-gray-700">TLS</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch checked={formData.par_emailssl} onCheckedChange={(v) => handleFieldChange('par_emailssl', v)} />
                                                <span className="text-[13px] font-bold text-gray-700">SSL</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 lg:col-span-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <User size={14} /> E-mail de Envio
                                        </Label>
                                        <Input
                                            type="email"
                                            value={formData.par_email}
                                            onChange={(e) => handleFieldChange('par_email', e.target.value)}
                                            placeholder="ex: vendas@empresa.com.br"
                                            className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Key size={14} /> Senha App
                                        </Label>
                                        <Input
                                            type="password"
                                            value={formData.par_emailpassword}
                                            onChange={(e) => handleFieldChange('par_emailpassword', e.target.value)}
                                            placeholder="••••••••••••"
                                            className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-[12px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <AtSign size={14} /> E-mail Alternativo (Copia)
                                        </Label>
                                        <Input
                                            type="email"
                                            value={formData.par_emailalternativo}
                                            onChange={(e) => handleFieldChange('par_emailalternativo', e.target.value)}
                                            placeholder="ex: gerencia@empresa.com.br"
                                            className="h-12 bg-gray-50 border-gray-100 rounded-xl font-bold"
                                        />
                                    </div>

                                    <div className="lg:col-span-4 mt-4 flex justify-end p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                        <Button
                                            variant="outline"
                                            onClick={handleTestConnection}
                                            disabled={testingEmail}
                                            className="h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                        >
                                            {testingEmail ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Testando Autenticação...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Testar Configurações de E-mail
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="pb-10" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
