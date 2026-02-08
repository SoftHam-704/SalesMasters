import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Shield,
    ChevronRight,
    Check,
    X,
    Save,
    Plus,
    Edit2,
    Trash2,
    Search,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    MoreVertical,
    UserPlus,
    Key,
    Activity,
    Smartphone,
    Monitor,
    LayoutGrid,
    Settings,
    ShieldAlert
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from 'sonner';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';

const UserManagementPage = () => {
    const [activeTab, setActiveTab] = useState('grupos');
    const [grupos, setGrupos] = useState([]);
    const [selectedGrupo, setSelectedGrupo] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // User lists
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showUserModal, setShowUserModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editingGroup, setEditingGroup] = useState({ grupo: '', descricao: '' });

    useEffect(() => {
        fetchGrupos();
        fetchUsers();
    }, []);

    const fetchGrupos = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/system/groups'));
            const data = await response.json();
            if (data.success) {
                setGrupos(data.data);
                if (data.data.length > 0 && !selectedGrupo) {
                    setSelectedGrupo(data.data[0]);
                    fetchPermissions(data.data[0].grupo);
                }
            }
        } catch (error) {
            toast.error('Erro ao buscar grupos');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/system/users'));
            const data = await response.json();
            if (data.success) setUsers(data.data);
        } catch (error) {
            toast.error('Erro ao buscar usuários');
        }
    };

    const fetchPermissions = async (groupId) => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/system/groups/${groupId}/permissions`));
            const data = await response.json();
            if (data.success) setPermissions(data.data);
        } catch (error) {
            toast.error('Erro ao buscar permissões');
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePermission = (indice, field) => {
        setPermissions(prev => prev.map(p =>
            p.indice === indice ? { ...p, [field]: !p[field] } : p
        ));
    };

    const handleSavePermissions = async () => {
        if (!selectedGrupo) return;
        setSaving(true);
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/system/groups/${selectedGrupo.grupo}/permissions`), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ permissions })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Matriz de acesso atualizada!', {
                    icon: '🛡️',
                    style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontWeight: '900' }
                });
            }
        } catch (error) {
            toast.error('Erro ao salvar permissões');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveGroup = async () => {
        try {
            const isEditing = grupos.some(g => g.grupo === editingGroup.grupo);
            const method = isEditing ? 'PUT' : 'POST';
            const url = isEditing
                ? `/api/v2/system/groups/${editingGroup.grupo}`
                : '/api/v2/system/groups';

            const response = await fetch(getApiUrl(NODE_API_URL, url), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingGroup)
            });
            const data = await response.json();
            if (data.success) {
                toast.success(data.message);
                setShowGroupModal(false);
                fetchGrupos();
            }
        } catch (error) {
            toast.error('Erro ao salvar grupo');
        }
    };

    const handleDeleteUser = async (codigo) => {
        if (!window.confirm('Deseja realmente excluir este operador?')) return;
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, `/api/v2/system/users/${codigo}`), {
                method: 'DELETE'
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Usuário removido');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Erro ao excluir usuário');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -ml-48 -mb-48" />

            <div className="max-w-[1600px] mx-auto relative z-10">
                {/* MODERN HEADER */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600 blur-xl opacity-20 animate-pulse" />
                            <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-600/40 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                                <ShieldCheck size={32} strokeWidth={2.5} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-md">System Core</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">v2.5.0-Enterprise</span>
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                                Gestão de Identidade
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            </h1>
                            <p className="text-slate-500 text-sm font-semibold mt-0.5">Controle mestre de acessos, privilégios e auditoria</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="hidden lg:flex flex-col items-end mr-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Nuvem</span>
                            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                                <Activity size={10} />
                                Todos os sistemas online
                            </span>
                        </div>
                        <button
                            onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                            className="bg-white hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-wider px-6 py-3.5 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md flex items-center gap-2 group"
                        >
                            <UserPlus size={16} className="text-blue-600 group-hover:scale-110 transition-transform" />
                            Novo Operador
                        </button>
                    </div>
                </header>

                {/* TAB NAVIGATION - GLASSMORPHISM STYLE */}
                <div className="flex gap-1 mb-8 p-1.5 bg-slate-200/40 backdrop-blur-md rounded-[20px] w-fit border border-white/40">
                    <button
                        onClick={() => setActiveTab('grupos')}
                        className={cn(
                            "relative px-8 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-500 overflow-hidden group",
                            activeTab === 'grupos' ? "text-white" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {activeTab === 'grupos' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Shield size={14} />
                            Políticas de Grupo
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={cn(
                            "relative px-8 py-3 rounded-[14px] text-xs font-black uppercase tracking-widest transition-all duration-500 overflow-hidden group",
                            activeTab === 'usuarios' ? "text-white" : "text-slate-500 hover:text-slate-900"
                        )}
                    >
                        {activeTab === 'usuarios' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-600/20"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                            <Users size={14} />
                            Base de Usuários
                        </span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'grupos' ? (
                        <motion.div
                            key="grupos-view"
                            initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-8"
                        >
                            {/* LEFT PANEL: GROUPS LIST */}
                            <div className="md:col-span-1 lg:col-span-1">
                                <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/40 p-6 flex flex-col h-full sticky top-8">
                                    <div className="flex items-center justify-between mb-6 px-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Diretórios</span>
                                            <h3 className="font-black text-slate-800 text-lg tracking-tight">Grupos</h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingGroup({ grupo: '', descricao: '' });
                                                setShowGroupModal(true);
                                            }}
                                            className="w-10 h-10 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm"
                                        >
                                            <Plus size={20} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    <div className="space-y-2 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
                                        {grupos.map(g => (
                                            <button
                                                key={g.grupo}
                                                onClick={() => {
                                                    setSelectedGrupo(g);
                                                    fetchPermissions(g.grupo);
                                                }}
                                                className={cn(
                                                    "w-full px-5 py-4 rounded-3xl transition-all duration-300 flex items-center justify-between group relative overflow-hidden",
                                                    selectedGrupo?.grupo === g.grupo
                                                        ? "bg-blue-600 text-white shadow-xl shadow-blue-600/30 -translate-y-1"
                                                        : "bg-[#f8fafc] hover:bg-white border border-transparent hover:border-slate-200 text-slate-600"
                                                )}
                                            >
                                                {selectedGrupo?.grupo === g.grupo && (
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -mr-8 -mt-8" />
                                                )}
                                                <div className="flex flex-col text-left relative z-10">
                                                    <span className={cn("text-xs font-black uppercase tracking-tight", selectedGrupo?.grupo === g.grupo ? "text-blue-100" : "text-slate-400")}>{g.grupo}</span>
                                                    <span className="text-sm font-black tracking-tight">{g.descricao}</span>
                                                </div>
                                                <div className={cn(
                                                    "w-8 h-8 rounded-xl flex items-center justify-center transition-all relative z-10",
                                                    selectedGrupo?.grupo === g.grupo ? "bg-white/20" : "bg-white shadow-sm"
                                                )}>
                                                    <ChevronRight size={14} className={cn("transition-transform", selectedGrupo?.grupo === g.grupo && "rotate-90")} />
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-100 px-2">
                                        <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                            <Lock size={16} className="text-amber-600" />
                                            <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                                                Atenção: Mudanças de permissão afetam usuários logados imediatamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: PERMISSIONS MATRIX */}
                            <div className="md:col-span-3 lg:col-span-4">
                                <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col min-h-[700px] overflow-hidden">
                                    <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 via-white to-white flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                                                <ShieldCheck size={28} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Namespace / ACL</span>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    Políticas para <span className="bg-blue-600 text-white px-3 py-1 rounded-xl shadow-lg shadow-blue-600/20 ml-1">{selectedGrupo?.descricao || 'Selecione um grupo'}</span>
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                                                <LayoutGrid size={14} className="text-slate-400" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{permissions.length} Rotinas</span>
                                            </div>
                                            <button
                                                onClick={handleSavePermissions}
                                                disabled={saving || !selectedGrupo}
                                                className="group relative h-14 bg-slate-900 hover:bg-black text-white px-8 rounded-2xl font-black text-sm transition-all overflow-hidden flex items-center gap-3 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                                                ) : (
                                                    <>
                                                        <Save size={18} className="group-hover:scale-110 transition-transform" />
                                                        Deploy Permissões
                                                    </>
                                                )}
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full transition-transform duration-1000 group-hover:translate-x-full"
                                                />
                                            </button>
                                        </div>
                                    </div>

                                    {/* GRID HEADERS */}
                                    <div className="bg-slate-50/50 border-b border-slate-100 grid grid-cols-12 px-8 py-5">
                                        <div className="col-span-1 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center">Índice</div>
                                        <div className="col-span-5 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] pl-4">Entidade / Módulo</div>
                                        <div className="col-span-6 grid grid-cols-4 gap-4">
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center flex items-center justify-center gap-2">
                                                <Eye size={12} /> Visível
                                            </div>
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center flex items-center justify-center gap-2">
                                                <Plus size={12} /> Inserir
                                            </div>
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center flex items-center justify-center gap-2">
                                                <Edit2 size={12} /> Editar
                                            </div>
                                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] text-center flex items-center justify-center gap-2">
                                                <Trash2 size={12} /> Apagar
                                            </div>
                                        </div>
                                    </div>

                                    {/* GRID CONTENT */}
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden max-h-[700px] custom-scrollbar p-4 space-y-1 bg-slate-50/30">
                                        {loading ? (
                                            <div className="h-full flex items-center justify-center py-40">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="relative">
                                                        <div className="absolute inset-0 bg-blue-600 blur-2xl opacity-20 animate-pulse" />
                                                        <div className="w-16 h-16 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin relative z-10" />
                                                    </div>
                                                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Resolvendo matriz de acesso...</span>
                                                </div>
                                            </div>
                                        ) : !selectedGrupo ? (
                                            <div className="h-full flex flex-col items-center justify-center py-32 text-slate-300">
                                                <ShieldAlert size={64} strokeWidth={1} className="mb-4 opacity-20" />
                                                <span className="text-sm font-black uppercase tracking-widest text-slate-400">Selecione um grupo para mapear</span>
                                            </div>
                                        ) : permissions.map((perm) => {
                                            const isParent = [10, 20, 30, 50, 60].includes(perm.indice);

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={perm.indice}
                                                    className={cn(
                                                        "grid grid-cols-12 items-center px-4 py-3.5 rounded-[20px] transition-all group",
                                                        isParent
                                                            ? "bg-white border border-slate-200/60 shadow-md mb-3 mt-4"
                                                            : "hover:bg-white/80 hover:shadow-sm"
                                                    )}
                                                >
                                                    <div className="col-span-1 flex justify-center">
                                                        <span className={cn(
                                                            "text-[11px] font-black tracking-tighter px-3 py-1 rounded-lg",
                                                            isParent ? "bg-slate-900 text-white" : "text-slate-400"
                                                        )}>
                                                            {perm.indice}
                                                        </span>
                                                    </div>
                                                    <div className={cn(
                                                        "col-span-5 flex flex-col transition-all",
                                                        !isParent && "pl-8 border-l-2 border-slate-100 ml-4"
                                                    )}>
                                                        <span className={cn(
                                                            "text-sm tracking-tight",
                                                            isParent ? "font-black text-slate-900 uppercase" : "font-bold text-slate-600"
                                                        )}>
                                                            {perm.descricao}
                                                        </span>
                                                        {isParent && (
                                                            <div className="h-0.5 w-8 bg-blue-600 rounded-full mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="col-span-6 grid grid-cols-4 gap-4">
                                                        <PermissionToggle
                                                            active={!perm.invisivel}
                                                            onClick={() => handleTogglePermission(perm.indice, 'invisivel')}
                                                            color="blue"
                                                        />
                                                        <PermissionToggle
                                                            active={perm.incluir}
                                                            onClick={() => handleTogglePermission(perm.indice, 'incluir')}
                                                            color="emerald"
                                                        />
                                                        <PermissionToggle
                                                            active={perm.modificar}
                                                            onClick={() => handleTogglePermission(perm.indice, 'modificar')}
                                                            color="amber"
                                                        />
                                                        <PermissionToggle
                                                            active={perm.excluir}
                                                            onClick={() => handleTogglePermission(perm.indice, 'excluir')}
                                                            color="rose"
                                                        />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="usuarios-view"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-[40px] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden"
                        >
                            {/* USER SEARCH & TOOLBAR */}
                            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-6">
                                <div className="relative group flex-1 max-w-xl">
                                    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                        <Search className="text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Filtrar operadores por nome, usuário ou grupo..."
                                        className="w-full pl-14 pr-6 py-4 bg-slate-100 border-2 border-transparent rounded-[24px] text-sm font-bold focus:bg-white focus:border-blue-600/20 transition-all outline-none"
                                    />
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3 overflow-hidden px-4">
                                        {users.slice(0, 5).map((u, i) => (
                                            <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600">
                                                {u.nome?.charAt(0) || '?'}
                                            </div>
                                        ))}
                                        {users.length > 5 && (
                                            <div className="inline-block h-10 w-10 rounded-full ring-4 ring-white bg-blue-600 flex items-center justify-center text-[10px] font-black text-white">
                                                +{users.length - 5}
                                            </div>
                                        )}
                                    </div>
                                    <button className="p-4 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="overflow-x-auto p-4 flex-1 max-h-[700px] custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-2">
                                    <thead>
                                        <tr className="text-slate-400">
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] w-24">Identidade</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Informações do Usuário</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em]">Perfil Funcional</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-center">Nível Master</th>
                                            <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-right">Ações de Gestão</th>
                                        </tr>
                                    </thead>
                                    <tbody className="space-y-4">
                                        {users.filter(u =>
                                        (u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()))
                                        ).map(u => (
                                            <tr key={u.codigo} className="bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/60 transition-all duration-300 group">
                                                <td className="px-8 py-6 rounded-l-[28px] relative overflow-hidden">
                                                    <div className={cn(
                                                        "absolute left-0 top-0 bottom-0 w-1.5 transition-all group-hover:w-2",
                                                        u.ativo ? "bg-emerald-500" : "bg-slate-300"
                                                    )} />
                                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                                                        <span className="text-lg font-black text-slate-900">{u.nome?.charAt(0)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-slate-900 font-black text-base tracking-tight uppercase group-hover:text-blue-600 transition-colors uppercase">{u.nome} {u.sobrenome}</span>
                                                        <span className="text-slate-400 font-bold text-xs flex items-center gap-1.5">
                                                            <Activity size={10} />
                                                            ID: {u.codigo} • @{u.usuario}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] shadow-md shadow-blue-600/10">
                                                                {grupos.find(g => g.grupo === u.grupo)?.descricao || u.grupo || 'Sem Perfil'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold px-1">
                                                            <div className="flex items-center gap-1">
                                                                <Monitor size={10} /> WEB
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Smartphone size={10} /> MOBILE
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        {u.master ? (
                                                            <div className="relative group/master">
                                                                <div className="absolute inset-0 bg-amber-400 blur-md opacity-20 scale-150 rotate-45" />
                                                                <div className="relative w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-400/30 group-hover:scale-110 transition-transform">
                                                                    <Key size={20} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-300">
                                                                <Lock size={16} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 rounded-r-[28px] text-right">
                                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                                                        <button className="w-12 h-12 bg-white hover:bg-amber-500 text-slate-400 hover:text-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 transition-all active:scale-95" title="Editar Credenciais"
                                                            onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                                                        >
                                                            <Edit2 size={18} />
                                                        </button>
                                                        <button className="w-12 h-12 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 transition-all active:scale-95" title="Excluir Operador"
                                                            onClick={() => handleDeleteUser(u.codigo)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* MODALS */}
            <GroupModal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                group={editingGroup}
                setGroup={setEditingGroup}
                onSave={handleSaveGroup}
            />

            <UserModal
                isOpen={showUserModal}
                onClose={() => setShowUserModal(false)}
                user={editingUser}
                grupos={grupos}
                onSave={() => { fetchUsers(); setShowUserModal(false); }}
            />

            {/* FLOATING ACTION BUTTON PERMISSION MODAL FALLBACK */}
            {activeTab === 'grupos' && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="fixed bottom-8 right-8 z-50 lg:hidden"
                >
                    <button
                        onClick={handleSavePermissions}
                        className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center"
                    >
                        <Save size={24} />
                    </button>
                </motion.div>
            )}
        </div>
    );
};

// MODAL COMPONENTS
const GroupModal = ({ isOpen, onClose, group, setGroup, onSave }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                            <Plus size={20} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Novo Grupo</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Código do Grupo</label>
                        <input
                            type="text"
                            maxLength={4}
                            value={group.grupo}
                            onChange={(e) => setGroup({ ...group, grupo: e.target.value.toUpperCase() })}
                            placeholder="EX: VEND"
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600/20 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Descrição</label>
                        <input
                            type="text"
                            value={group.descricao}
                            onChange={(e) => setGroup({ ...group, descricao: e.target.value })}
                            placeholder="Nome do perfil de acesso..."
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-blue-600/20 transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="p-8 bg-slate-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all">Cancelar</button>
                    <button
                        onClick={onSave}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 transition-all"
                    >
                        Criar Grupo
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const UserModal = ({ isOpen, onClose, user, grupos, onSave }) => {
    const [formData, setFormData] = useState({
        nome: '', sobrenome: '', usuario: '', senha: '', grupo: '', master: false, gerencia: false, ativo: true
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                nome: user.nome || '',
                sobrenome: user.sobrenome || '',
                usuario: user.usuario || '',
                senha: '', // Senha sempre vazia no início
                grupo: user.grupo || '',
                master: user.master || false,
                gerencia: user.gerencia || false,
                ativo: user.ativo !== undefined ? user.ativo : true
            });
        } else if (isOpen) {
            setFormData({
                nome: '', sobrenome: '', usuario: '', senha: '', grupo: '', master: false, gerencia: false, ativo: true
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    const handleLocalSave = async (e) => {
        if (e) e.preventDefault();

        if (!formData.nome || !formData.usuario || (!user && !formData.senha)) {
            toast.error('Preencha os campos obrigatórios (Nome, Usuário e Senha)');
            return;
        }

        setIsSaving(true);
        try {
            const payload = user ? { ...formData, codigo: user.codigo } : formData;

            const response = await fetch(getApiUrl(NODE_API_URL, '/api/v2/system/users'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(user ? 'Operador atualizado!' : 'Novo operador criado!', {
                    icon: '👤',
                    style: { borderRadius: '15px', background: '#1e293b', color: '#fff' }
                });
                onSave();
            } else {
                toast.error(data.message || 'Erro ao salvar operador');
            }
        } catch (error) {
            console.error('Save user error:', error);
            toast.error('Falha na comunicação com o servidor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            {user ? <Edit2 size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">
                                {user ? 'Editar Operador' : 'Novo Operador'}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provisionamento de Acesso</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Nome</label>
                        <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600/20 transition-all outline-none"
                            placeholder="EX: HAMILTON" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sobrenome</label>
                        <input type="text" value={formData.sobrenome} onChange={e => setFormData({ ...formData, sobrenome: e.target.value.toUpperCase() })}
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600/20 transition-all outline-none"
                            placeholder="EX: SILVA" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Usuário de Login</label>
                        <input type="text" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600/20 transition-all outline-none"
                            placeholder="usuario.acesso" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                            {user ? 'Nova Senha (vazio para manter)' : 'Senha Temporária'}
                        </label>
                        <input type="password" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600/20 transition-all outline-none"
                            placeholder="••••••••" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Grupo / Perfil</label>
                        <select value={formData.grupo} onChange={e => setFormData({ ...formData, grupo: e.target.value })}
                            className="w-full px-5 py-4 bg-slate-100 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-indigo-600/20 transition-all outline-none">
                            <option value="">Selecione um Perfil...</option>
                            {grupos.map(g => <option key={g.grupo} value={g.grupo}>{g.descricao}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-6 pt-8">
                        <div className="flex items-center gap-2">
                            <PermissionToggle active={formData.master} onClick={() => setFormData({ ...formData, master: !formData.master })} color="amber" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Master</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PermissionToggle active={formData.gerencia} onClick={() => setFormData({ ...formData, gerencia: !formData.gerencia })} color="emerald" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Gerência</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <PermissionToggle active={formData.ativo} onClick={() => setFormData({ ...formData, ativo: !formData.ativo })} color="blue" />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Ativo</span>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 text-sm font-black text-slate-500 uppercase tracking-widest hover:text-slate-900 transition-all">Cancelar</button>
                    <button
                        onClick={handleLocalSave}
                        disabled={isSaving}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                        ) : (
                            <>
                                <Save size={18} />
                                {user ? 'Salvar Alterações' : 'Salvar Operador'}
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// HELPER COMPONENT: CUSTOM PERMISSION TOGGLE
const PermissionToggle = ({ active, onClick, color = 'blue' }) => {
    const colors = {
        blue: { bgActive: 'bg-blue-600', bgInactive: 'bg-slate-200', textActive: 'text-white' },
        emerald: { bgActive: 'bg-emerald-500', bgInactive: 'bg-slate-200', textActive: 'text-white' },
        amber: { bgActive: 'bg-amber-500', bgInactive: 'bg-slate-200', textActive: 'text-white' },
        rose: { bgActive: 'bg-rose-500', bgInactive: 'bg-slate-200', textActive: 'text-white' }
    };

    const c = colors[color];

    return (
        <label className="flex items-center justify-center cursor-pointer">
            <div className="relative" onClick={onClick}>
                <div className={cn(
                    "w-12 h-6 rounded-full transition-all duration-500",
                    active ? c.bgActive : c.bgInactive
                )} />
                <div className={cn(
                    "absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-all duration-500 shadow-md",
                    active ? "translate-x-6 scale-110" : "translate-x-0"
                )} />
            </div>
            <div className="ml-3 hidden md:block">
                <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    active ? "text-slate-900" : "text-slate-300"
                )}>
                    {active ? 'ON' : 'OFF'}
                </span>
            </div>
        </label>
    );
};

export default UserManagementPage;
