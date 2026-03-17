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
    ShieldAlert,
    Camera,
    Upload
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
        <div className="min-h-screen bg-[#EAEAE5] relative overflow-hidden font-sans selection:bg-stone-800 selection:text-white">
            {/* NOISE GRAIN OVERLAY */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[9999]"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* VERTICAL GRID LINES */}
            <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-0 z-0 h-full w-full opacity-20">
                {[...Array(11)].map((_, i) => (
                    <div key={i} className="border-r border-stone-400 h-full" />
                ))}
            </div>

            <div className="max-w-[1600px] mx-auto p-4 lg:p-12 relative z-10">
                {/* MODERN HEADER AURA 2.0 */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-blue-600/20 blur-2xl group-hover:blur-3xl transition-all duration-700" />
                            <div className="relative w-20 h-20 bg-stone-900 text-[#FACC15] flex items-center justify-center rounded-2xl shadow-2xl shadow-stone-900/40 transform -rotate-2 group-hover:rotate-0 transition-all duration-500">
                                <ShieldCheck size={36} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-stone-500 bg-stone-200/50 px-2 py-0.5 rounded">System Core</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                                <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-stone-400">v2.5.0-Enterprise</span>
                            </div>
                            <h1 className="text-4xl font-display font-medium tracking-tighter text-stone-900 flex items-center gap-3">
                                Gestão de Identidade
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                            </h1>
                            <p className="text-stone-500 text-sm font-light tracking-wide mt-1">Controle mestre de acessos, privilégios e auditoria</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex flex-col items-end border-r border-stone-300 pr-6">
                            <span className="text-[10px] font-mono uppercase tracking-widest text-stone-400">Status da Nuvem</span>
                            <span className="text-xs font-medium text-stone-600 flex items-center gap-2 mt-1">
                                <Activity size={12} className="text-emerald-500" />
                                Todos os sistemas online
                            </span>
                        </div>

                        <button
                            onClick={() => { setEditingUser(null); setShowUserModal(true); }}
                            className="group relative px-8 py-4 bg-stone-900 text-[#FACC15] overflow-hidden rounded-full transition-all hover:shadow-2xl hover:-translate-y-1"
                        >
                            <div className="absolute inset-0 w-full h-full bg-stone-800 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                            <span className="relative z-10 font-mono text-xs uppercase tracking-[0.2em] flex items-center gap-3 font-black">
                                <UserPlus size={16} />
                                Novo Operador
                            </span>
                        </button>
                    </div>
                </header>

                {/* TAB NAVIGATION - PILL STYLE AURA 2.0 */}
                <div className="flex gap-2 mb-12 p-1.5 bg-stone-200/50 backdrop-blur-xl rounded-full w-fit border border-stone-300/50 shadow-inner">
                    <button
                        onClick={() => setActiveTab('grupos')}
                        className={cn(
                            "relative px-10 py-3 rounded-full text-[11px] font-mono font-bold uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden group",
                            activeTab === 'grupos' ? "text-[#FACC15]" : "text-stone-500 hover:text-stone-900"
                        )}
                    >
                        {activeTab === 'grupos' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-stone-900 shadow-xl shadow-stone-900/20"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-3">
                            <Shield size={14} strokeWidth={2} />
                            Políticas de Grupo
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('usuarios')}
                        className={cn(
                            "relative px-10 py-3 rounded-full text-xs font-mono font-black uppercase tracking-[0.2em] transition-all duration-500 overflow-hidden group",
                            activeTab === 'usuarios' ? "text-[#FACC15]" : "text-stone-500 hover:text-stone-900"
                        )}
                    >
                        {activeTab === 'usuarios' && (
                            <motion.div
                                layoutId="activeTabBg"
                                className="absolute inset-0 bg-stone-900 shadow-xl shadow-stone-900/20"
                                transition={{ type: "spring", bounce: 0.15, duration: 0.6 }}
                            />
                        )}
                        <span className="relative z-10 flex items-center gap-3">
                            <Users size={14} strokeWidth={2.5} />
                            Base de Usuários
                        </span>
                    </button>
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'grupos' ? (
                        <motion.div
                            key="grupos-view"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                            className="grid grid-cols-1 lg:grid-cols-12 gap-10"
                        >
                            {/* LEFT PANEL: GROUPS SIDEBAR (AURA STYLE) */}
                            <div className="lg:col-span-3">
                                <div className="bg-white/40 backdrop-blur-3xl rounded-[40px] border border-white/60 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] p-8 flex flex-col h-fit sticky top-12">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-[0.3em]">Diretórios</span>
                                            <h3 className="font-display font-medium text-stone-900 text-2xl tracking-tighter mt-1">Grupos</h3>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setEditingGroup({ grupo: '', descricao: '' });
                                                setShowGroupModal(true);
                                            }}
                                            className="w-12 h-12 bg-white text-stone-900 hover:bg-stone-900 hover:text-white rounded-2xl flex items-center justify-center transition-all duration-500 border border-stone-200 shadow-sm group"
                                        >
                                            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
                                        </button>
                                    </div>

                                    <div className="space-y-3 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
                                        {grupos.map(g => (
                                            <button
                                                key={g.grupo}
                                                onClick={() => {
                                                    setSelectedGrupo(g);
                                                    fetchPermissions(g.grupo);
                                                }}
                                                className={cn(
                                                    "w-full px-6 py-5 rounded-[24px] transition-all duration-500 flex items-center justify-between group relative overflow-hidden",
                                                    selectedGrupo?.grupo === g.grupo
                                                        ? "bg-stone-900 text-[#FACC15] shadow-2xl shadow-stone-900/30 -translate-y-1"
                                                        : "bg-white/50 hover:bg-white border border-transparent hover:border-stone-200 text-stone-600"
                                                )}
                                            >
                                                <div className="flex flex-col text-left relative z-10">
                                                    <span className={cn("text-[10px] font-mono font-bold uppercase tracking-widest mb-1", selectedGrupo?.grupo === g.grupo ? "text-stone-400" : "text-stone-400")}>{g.grupo}</span>
                                                    <span className="text-sm font-medium tracking-tight">{g.descricao}</span>
                                                </div>
                                                <ChevronRight size={16} className={cn("transition-all duration-500", selectedGrupo?.grupo === g.grupo ? "rotate-90 translate-x-1" : "opacity-0 group-hover:opacity-100 group-hover:translate-x-1")} />
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-stone-200/50">
                                        <div className="flex items-start gap-4 p-5 bg-stone-900/5 rounded-3xl border border-stone-900/10">
                                            <Lock size={16} className="text-stone-600 mt-1" />
                                            <p className="text-[11px] font-medium text-stone-700 leading-relaxed tracking-tight">
                                                Mudanças de permissão afetam usuários logados em tempo real. Use com cautela.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT PANEL: PERMISSIONS MATRIX (GLASSMORPHISM) */}
                            <div className="lg:col-span-9">
                                <div className="bg-white/60 backdrop-blur-3xl rounded-[48px] border border-white/80 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] flex flex-col min-h-[800px] overflow-hidden">
                                    <div className="p-10 border-b border-stone-200/50 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 bg-stone-900 text-[#FACC15] rounded-3xl flex items-center justify-center shadow-xl rotate-3">
                                                <ShieldCheck size={32} strokeWidth={1.5} />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-[0.4em]">Namespace / ACL</span>
                                                <h3 className="text-2xl font-display font-medium text-stone-900 tracking-tighter mt-1 flex items-center gap-3">
                                                    Políticas para
                                                    <span className="bg-emerald-500/10 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-500/20">
                                                        {selectedGrupo?.descricao || 'Selection Required'}
                                                    </span>
                                                </h3>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={handleSavePermissions}
                                                disabled={saving || !selectedGrupo}
                                                className="group relative h-16 bg-stone-900 hover:bg-black text-[#FACC15] px-10 rounded-2xl font-mono text-[11px] uppercase tracking-[0.2em] transition-all overflow-hidden flex items-center gap-4 disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/20 border-t-white" />
                                                ) : (
                                                    <>
                                                        <Save size={20} />
                                                        Deploy Policies
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    {/* GRID HEADERS */}
                                    <div className="bg-stone-100/30 border-b border-stone-200/50 grid grid-cols-12 px-10 py-6">
                                        <div className="col-span-6 text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.3em]">Módulo / Entidade</div>
                                        <div className="col-span-6 grid grid-cols-4 gap-6">
                                            {['Visible', 'Create', 'Edit', 'Delete'].map((label, i) => (
                                                <div key={i} className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] text-center">{label}</div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* GRID CONTENT */}
                                    <div className="flex-1 overflow-y-auto max-h-[800px] custom-scrollbar p-6 space-y-2">
                                        {loading ? (
                                            <div className="h-full flex items-center justify-center py-40">
                                                <Activity className="text-stone-300 animate-spin" size={48} />
                                            </div>
                                        ) : !selectedGrupo ? (
                                            <div className="h-full flex flex-col items-center justify-center py-40 text-stone-400 opacity-50">
                                                <ShieldAlert size={80} strokeWidth={1} className="mb-6" />
                                                <p className="font-display text-xl tracking-tight">Select a group to map policies</p>
                                            </div>
                                        ) : permissions.map((perm) => {
                                            const isParent = [10, 20, 30, 50, 60].includes(perm.indice);

                                            return (
                                                <motion.div
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    key={perm.indice}
                                                    className={cn(
                                                        "grid grid-cols-12 items-center px-6 py-5 rounded-[28px] transition-all group border border-transparent",
                                                        isParent
                                                            ? "bg-white/80 shadow-sm border-stone-200/50 my-2"
                                                            : "hover:bg-white hover:shadow-xl hover:shadow-stone-900/5 hover:border-stone-100"
                                                    )}
                                                >
                                                    <div className="col-span-6 flex items-center gap-6">
                                                        <div className={cn(
                                                            "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                                                            isParent ? "bg-stone-900 text-[#FACC15] shadow-lg" : "bg-stone-100 text-stone-400 group-hover:bg-blue-50 group-hover:text-blue-500"
                                                        )}>
                                                            <span className="text-[10px] font-mono font-black">{perm.indice}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className={cn(
                                                                "text-sm tracking-tight transition-colors",
                                                                isParent ? "font-display font-medium text-stone-900" : "font-medium text-stone-600 group-hover:text-stone-900"
                                                            )}>
                                                                {perm.descricao}
                                                            </span>
                                                            {isParent && <span className="text-[9px] font-mono text-stone-400 uppercase tracking-widest mt-0.5">Módulo Principal</span>}
                                                        </div>
                                                    </div>
                                                    <div className="col-span-6 grid grid-cols-4 gap-6">
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
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-white/60 backdrop-blur-3xl rounded-[48px] border border-white/80 shadow-[0_48px_96px_-24px_rgba(0,0,0,0.12)] overflow-hidden"
                        >
                            <div className="p-10 border-b border-stone-200/50 flex flex-col md:flex-row justify-between gap-8 bg-stone-50/30">
                                <div className="relative group flex-1 max-w-4xl flex items-center bg-white border border-stone-200/60 rounded-[32px] px-6 py-2 shadow-sm focus-within:shadow-2xl focus-within:shadow-stone-900/5 transition-all">
                                    <Search className="text-stone-400 group-focus-within:text-stone-900 transition-colors mr-4" size={20} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Pesquisar por nome, ID ou grupo..."
                                        className="flex-1 py-4 bg-transparent text-sm font-medium outline-none placeholder:text-stone-400"
                                    />
                                    <div className="flex items-center gap-2 pl-4 border-l border-stone-100 py-1">
                                        <div className="flex -space-x-3 px-2">
                                            {users.slice(0, 3).map((u, i) => (
                                                <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-stone-100 flex items-center justify-center text-[10px] font-mono font-black text-stone-600 shadow-sm overflow-hidden">
                                                    {u.nome?.charAt(0) || '?'}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="w-10 h-10 bg-stone-50 text-stone-400 rounded-full flex items-center justify-center border border-stone-100">
                                            <MoreVertical size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Additional tools could go here */}
                                </div>
                            </div>

                            <div className="overflow-x-auto p-10 flex-1 max-h-[750px] custom-scrollbar">
                                <table className="w-full text-left border-separate border-spacing-y-4">
                                    <thead>
                                        <tr className="text-stone-400">
                                            <th className="px-8 pb-6 text-[10px] font-mono font-black uppercase tracking-[0.3em]">Identity</th>
                                            <th className="px-8 pb-6 text-[10px] font-mono font-black uppercase tracking-[0.3em]">Access Info</th>
                                            <th className="px-8 pb-6 text-[10px] font-mono font-black uppercase tracking-[0.3em]">Profile</th>
                                            <th className="px-8 pb-6 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-center">Status</th>
                                            <th className="px-8 pb-6 text-[10px] font-mono font-black uppercase tracking-[0.3em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.filter(u =>
                                        (u.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            u.usuario?.toLowerCase().includes(searchTerm.toLowerCase()))
                                        ).map(u => (
                                            <tr key={u.codigo} className="bg-white/40 hover:bg-white border border-stone-200/50 hover:shadow-2xl hover:shadow-stone-900/5 transition-all duration-500 group">
                                                <td className="px-8 py-6 rounded-l-[32px] border-y border-l border-stone-200/50 group-hover:border-stone-200">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center border border-stone-200 group-hover:bg-stone-900 group-hover:text-[#FACC15] transition-all duration-500 overflow-hidden">
                                                            {u.imagem ? (
                                                                <img src={u.imagem} alt={u.nome} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-lg font-mono font-black">{u.nome?.charAt(0)}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-stone-900 font-display font-medium text-base tracking-tight">{u.nome} {u.sobrenome}</span>
                                                            <span className="text-stone-400 font-mono text-[10px] uppercase tracking-widest mt-0.5">ID: {u.codigo}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-stone-200/50 group-hover:border-stone-200">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-stone-800 font-bold text-sm flex items-center gap-3">
                                                            <div className="flex items-center gap-1 opacity-60">
                                                                <Smartphone size={14} className="text-stone-400" />
                                                                <span className="text-[10px]">@</span>
                                                            </div>
                                                            {u.usuario}
                                                        </span>
                                                        <span className="text-xs font-mono font-black text-stone-400 uppercase tracking-widest pl-6">Login Credential</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-stone-200/50 group-hover:border-stone-200">
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-stone-900/5 text-stone-900 px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest border border-stone-900/10">
                                                            {grupos.find(g => g.grupo === u.grupo)?.descricao || u.grupo || 'NO PROFILE'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 border-y border-stone-200/50 group-hover:border-stone-200">
                                                    <div className="flex flex-col items-center">
                                                        {u.master ? (
                                                            <div className="bg-emerald-500/10 text-emerald-700 px-4 py-1.5 rounded-full text-[10px] font-mono font-black border border-emerald-500/20">MASTER</div>
                                                        ) : (
                                                            <div className="bg-stone-100 text-stone-500 px-4 py-1.5 rounded-full text-[10px] font-mono font-black border border-stone-200">USER</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 rounded-r-[32px] border-y border-r border-stone-200/50 group-hover:border-stone-200 text-right">
                                                    <div className="flex justify-end gap-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                                        <button
                                                            onClick={() => { setEditingUser(u); setShowUserModal(true); }}
                                                            className="w-12 h-12 bg-white hover:bg-stone-900 text-stone-400 hover:text-[#FACC15] rounded-2xl flex items-center justify-center shadow-sm border border-stone-200 transition-all active:scale-95"
                                                            title="Edit Details"
                                                        >
                                                            <Edit2 size={18} strokeWidth={1.5} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(u.codigo)}
                                                            className="w-12 h-12 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white rounded-2xl flex items-center justify-center shadow-sm border border-rose-100 transition-all active:scale-95"
                                                            title="Delete Identity"
                                                        >
                                                            <Trash2 size={18} strokeWidth={1.5} />
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-2xl rounded-[48px] w-full max-w-lg overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] border border-white"
            >
                <div className="p-10 border-b border-stone-200/50 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-stone-900 text-[#FACC15] rounded-2xl flex items-center justify-center shadow-2xl">
                            <Plus size={24} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-medium text-stone-900 tracking-tighter">Gestão de Grupos</h3>
                            <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mt-0.5">Definição de Perfil</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 hover:bg-stone-200 rounded-full flex items-center justify-center transition-all">
                        <X size={20} className="text-stone-400" />
                    </button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Identificador Único (TAG)</label>
                        <input
                            type="text"
                            maxLength={4}
                            value={group.grupo}
                            onChange={(e) => setGroup({ ...group, grupo: e.target.value.toUpperCase() })}
                            placeholder="EX: VEND"
                            className="w-full px-8 py-5 bg-white border border-stone-200 rounded-[24px] text-sm font-medium focus:border-stone-900 focus:shadow-2xl focus:shadow-stone-900/5 transition-all outline-none"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Nome de Exibição / Descrição</label>
                        <input
                            type="text"
                            value={group.descricao}
                            onChange={(e) => setGroup({ ...group, descricao: e.target.value })}
                            placeholder="Ex: Equipe de Vendas Internas"
                            className="w-full px-8 py-5 bg-white border border-stone-200 rounded-[24px] text-sm font-medium focus:border-stone-900 focus:shadow-2xl focus:shadow-stone-900/5 transition-all outline-none"
                        />
                    </div>
                </div>
                <div className="p-10 bg-stone-50/50 flex gap-6">
                    <button onClick={onClose} className="flex-1 py-5 text-[11px] font-mono font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-all">Cancelar</button>
                    <button
                        onClick={onSave}
                        className="flex-1 py-5 bg-stone-900 hover:bg-black text-[#FACC15] rounded-[24px] text-[11px] font-mono font-bold uppercase tracking-widest shadow-2xl shadow-stone-900/20 transition-all hover:-translate-y-1"
                    >
                        Confirmar Grupo
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const UserModal = ({ isOpen, onClose, user, grupos, onSave }) => {
    const [formData, setFormData] = useState({
        nome: '', sobrenome: '', usuario: '', senha: '', grupo: '', master: false, gerencia: false, ativo: true, imagem: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                nome: user.nome || '',
                sobrenome: user.sobrenome || '',
                usuario: user.usuario || '',
                senha: '',
                grupo: user.grupo || '',
                master: user.master || false,
                gerencia: user.gerencia || false,
                ativo: user.ativo !== undefined ? user.ativo : true,
                imagem: user.imagem || ''
            });
        } else if (isOpen) {
            setFormData({
                nome: '', sobrenome: '', usuario: '', senha: '', grupo: '', master: false, gerencia: false, ativo: true, imagem: ''
            });
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    // IMAGE COMPRESSION UTILITY
    const compressImage = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 128;
                    const MAX_HEIGHT = 128;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Compress to JPEG with 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    resolve(dataUrl);
                };
            };
        });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem');
            return;
        }

        try {
            const compressedBase64 = await compressImage(file);
            setFormData(prev => ({ ...prev, imagem: compressedBase64 }));
            toast.success('Imagem otimizada com sucesso!', {
                icon: '⚡',
                style: { borderRadius: '15px', background: '#1e293b', color: '#fff', fontSize: '12px' }
            });
        } catch (error) {
            console.error('Erro ao processar imagem:', error);
            toast.error('Falha ao processar imagem');
        }
    };

    const handleLocalSave = async (e) => {
        if (e) e.preventDefault();
        if (!formData.nome || !formData.usuario || (!user && !formData.senha)) {
            toast.error('Preencha os campos obrigatórios');
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
                toast.success(user ? 'Operador atualizado!' : 'Novo operador criado!');
                onSave();
            } else {
                toast.error(data.message || 'Erro ao salvar operador');
            }
        } catch (error) {
            toast.error('Falha na comunicação com o servidor');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-xl">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-white/90 backdrop-blur-2xl rounded-[48px] w-full max-w-3xl overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.3)] border border-white"
            >
                <div className="p-10 border-b border-stone-200/50 flex items-center justify-between bg-stone-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-stone-900 text-[#FACC15] rounded-3xl flex items-center justify-center shadow-2xl">
                            {user ? <Edit2 size={28} /> : <UserPlus size={28} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-display font-medium text-stone-900 tracking-tighter">
                                {user ? 'Editar Identidade' : 'Nova Identidade'}
                            </h3>
                            <p className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest mt-0.5">Provisionamento de Acesso</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 hover:bg-stone-200 rounded-full flex items-center justify-center transition-all">
                        <X size={20} className="text-stone-400" />
                    </button>
                </div>

                <div className="p-10 grid grid-cols-2 gap-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                    {/* AVATAR UPLOAD SECTION */}
                    <div className="col-span-2 flex justify-center mb-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[40px] bg-stone-100 border-2 border-stone-200 overflow-hidden flex items-center justify-center shadow-2xl transition-all group-hover:border-stone-900 relative">
                                {formData.imagem ? (
                                    <img src={formData.imagem} alt="Avatar Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Users size={48} className="text-stone-300" />
                                )}
                                
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer backdrop-blur-sm">
                                    <Camera size={24} className="text-white mb-1" />
                                    <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Alterar</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            </div>
                            {formData.imagem && (
                                <button 
                                    onClick={() => setFormData(prev => ({ ...prev, imagem: '' }))}
                                    className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-all scale-0 group-hover:scale-100"
                                >
                                    <X size={14} strokeWidth={3} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Nome</label>
                        <input type="text" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
                            className="w-full px-6 py-4 bg-white border border-stone-200 rounded-[20px] text-sm font-medium focus:border-stone-900 focus:shadow-xl transition-all outline-none"
                            placeholder="EX: HAMILTON" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Sobrenome</label>
                        <input type="text" value={formData.sobrenome} onChange={e => setFormData({ ...formData, sobrenome: e.target.value.toUpperCase() })}
                            className="w-full px-6 py-4 bg-white border border-stone-200 rounded-[20px] text-sm font-medium focus:border-stone-900 focus:shadow-xl transition-all outline-none"
                            placeholder="EX: SILVA" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Usuário de Login</label>
                        <input type="text" value={formData.usuario} onChange={e => setFormData({ ...formData, usuario: e.target.value.toLowerCase() })}
                            className="w-full px-6 py-4 bg-white border border-stone-200 rounded-[20px] text-sm font-medium focus:border-stone-900 focus:shadow-xl transition-all outline-none"
                            placeholder="usuario.acesso" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">
                            {user ? 'Alterar Senha' : 'Senha Provisória'}
                        </label>
                        <input type="password" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })}
                            className="w-full px-6 py-4 bg-white border border-stone-200 rounded-[20px] text-sm font-medium focus:border-stone-900 focus:shadow-xl transition-all outline-none"
                            placeholder="••••••••" />
                    </div>
                    <div className="col-span-2 space-y-3">
                        <label className="text-[10px] font-mono font-black uppercase text-stone-400 tracking-[0.2em] pl-1">Grupo / Perfil de Acesso</label>
                        <select value={formData.grupo} onChange={e => setFormData({ ...formData, grupo: e.target.value })}
                            className="w-full px-6 py-4 bg-white border border-stone-200 rounded-[20px] text-sm font-medium focus:border-stone-900 focus:shadow-xl transition-all outline-none appearance-none">
                            <option value="">Selecione um Perfil...</option>
                            {grupos.map(g => <option key={g.grupo} value={g.grupo}>{g.descricao}</option>)}
                        </select>
                    </div>

                    <div className="col-span-2 bg-stone-100/50 p-6 rounded-[32px] border border-stone-200 grid grid-cols-3 gap-6">
                        <div className="flex flex-col items-center gap-3">
                            <PermissionToggle active={formData.master} onClick={() => setFormData({ ...formData, master: !formData.master })} color="amber" />
                            <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-widest">Nível Master</span>
                        </div>
                        <div className="flex flex-col items-center gap-3 border-x border-stone-200">
                            <PermissionToggle active={formData.gerencia} onClick={() => setFormData({ ...formData, gerencia: !formData.gerencia })} color="emerald" />
                            <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-widest">Gerência</span>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <PermissionToggle active={formData.ativo} onClick={() => setFormData({ ...formData, ativo: !formData.ativo })} color="blue" />
                            <span className="text-[10px] font-mono font-black text-stone-400 uppercase tracking-widest">Status Ativo</span>
                        </div>
                    </div>
                </div>

                <div className="p-10 bg-stone-50/50 flex gap-6">
                    <button onClick={onClose} className="flex-1 py-5 text-[11px] font-mono font-bold text-stone-400 uppercase tracking-widest hover:text-stone-900 transition-all">Descartar</button>
                    <button
                        onClick={handleLocalSave}
                        disabled={isSaving}
                        className="flex-1 py-5 bg-stone-900 hover:bg-black text-[#FACC15] rounded-[24px] text-[11px] font-mono font-bold uppercase tracking-widest shadow-2xl shadow-stone-900/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? (
                            <Activity className="animate-spin text-white" size={18} />
                        ) : (
                            <>
                                <Save size={18} strokeWidth={1.5} />
                                Confirmar Operador
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// HELPER COMPONENT: AURA PREMIUM SWITCH
const PermissionToggle = ({ active, onClick, color = 'blue' }) => {
    const themes = {
        blue: { active: 'bg-blue-500', glow: 'shadow-blue-500/50' },
        emerald: { active: 'bg-emerald-500', glow: 'shadow-emerald-500/50' },
        amber: { active: 'bg-amber-500', glow: 'shadow-amber-500/50' },
        rose: { active: 'bg-rose-500', glow: 'shadow-rose-500/50' }
    };

    const theme = themes[color];

    return (
        <div className="flex justify-center">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
                className={cn(
                    "relative w-12 h-6 rounded-full transition-all duration-500 ease-in-out border",
                    active
                        ? `${theme.active} border-transparent shadow-lg ${theme.glow}`
                        : "bg-stone-200 border-stone-300 shadow-inner"
                )}
            >
                <div className={cn(
                    "absolute top-1 left-1 w-3.5 h-3.5 bg-white rounded-full transition-all duration-500 ease-in-out shadow-sm",
                    active ? "translate-x-6 scale-110" : "translate-x-0"
                )} />
            </button>
        </div>
    );
};

export default UserManagementPage;
