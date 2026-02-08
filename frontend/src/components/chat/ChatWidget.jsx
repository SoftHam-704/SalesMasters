// =====================================================
// 💬 SALESMASTER CHAT PRO - Ultra Modern Edition
// =====================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, CheckCheck, Clock, Trash2, Plus, Settings, HelpCircle, Info,
    Hash, MessageCircle, MessageSquare, ChevronLeft, Send, Search, X,
    User, Users, Sparkles, Bell, MoreVertical, Paperclip, Smile
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { cn } from '@/lib/utils';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list', 'chat', 'new'
    const [conversas, setConversas] = useState([]);
    const [conversaAtiva, setConversaAtiva] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [usuarios, setUsuarios] = useState([]);
    const [busca, setBusca] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    // Pegar usuário da sessão de forma segura
    const sessionUser = useMemo(() => {
        try {
            return JSON.parse(sessionStorage.getItem('user'));
        } catch (e) { return null; }
    }, []);

    const userId = sessionUser?.id || '1';
    const empresaId = sessionUser?.empresa_id || '1';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && activeView === 'chat') {
            scrollToBottom();
        }
    }, [mensagens, isOpen, activeView]);

    const fetchResumo = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/resumo'), {
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            const data = await response.json();
            if (data.success) {
                setTotalNaoLidas(data.data.total);
            }
        } catch (error) {
            console.error('Erro ao buscar resumo:', error);
        }
    }, [userId]);

    useEffect(() => {
        fetchResumo();
        const interval = setInterval(fetchResumo, 30000);
        const handleToggle = () => isOpen ? setIsOpen(false) : handleOpen();
        window.addEventListener('chat:toggle', handleToggle);

        const badgeInterval = setInterval(() => {
            window.dispatchEvent(new CustomEvent('chat:badge', { detail: totalNaoLidas }));
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(badgeInterval);
            window.removeEventListener('chat:toggle', handleToggle);
        };
    }, [fetchResumo, isOpen, totalNaoLidas]);

    const fetchConversas = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/conversas'), {
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            const data = await response.json();
            if (data.success) {
                setConversas(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar conversas:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMensagens = async (conversaId) => {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/chat/conversas/${conversaId}/mensagens`),
                {
                    headers: {
                        'x-user-id': userId,
                        'x-empresa-id': empresaId
                    }
                }
            );
            const data = await response.json();
            if (data.success) {
                setMensagens(data.data);
                fetchResumo();
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        }
    };

    const fetchUsuarios = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/aux/usuarios'), {
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsuarios(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    const handleOpen = () => {
        setIsOpen(true);
        fetchConversas();
    };

    const abrirConversa = (conversa) => {
        setConversaAtiva(conversa);
        setActiveView('chat');
        fetchMensagens(conversa.id);
    };

    const voltarParaLista = () => {
        setActiveView('list');
        setConversaAtiva(null);
        setMensagens([]);
        fetchConversas();
    };

    const iniciarNovaConversa = async (outroUsuarioId) => {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/chat/conversas/direct/${outroUsuarioId}`),
                {
                    headers: {
                        'x-user-id': userId,
                        'x-empresa-id': empresaId
                    }
                }
            );
            const data = await response.json();
            if (data.success) {
                await fetchConversas();
                const conversa = { id: data.data.id, tipo: 'direct', outro_participante: data.data.outro_participante };
                abrirConversa(conversa);
            }
        } catch (error) {
            console.error('Erro ao criar conversa:', error);
        }
    };

    const enviarMensagem = async (e) => {
        if (e) e.preventDefault();
        if (!novaMensagem.trim() || !conversaAtiva) return;

        const textoMensagem = novaMensagem.trim();
        setNovaMensagem('');

        const msgTemp = {
            id: Date.now(),
            conteudo: textoMensagem,
            remetente_id: parseInt(userId),
            remetente: { id: parseInt(userId), nome: 'Você' },
            created_at: new Date().toISOString(),
            sending: true
        };
        setMensagens(prev => [...prev, msgTemp]);

        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/chat/conversas/${conversaAtiva.id}/mensagens`),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-user-id': userId,
                        'x-empresa-id': empresaId
                    },
                    body: JSON.stringify({ conteudo: textoMensagem })
                }
            );
            const data = await response.json();
            if (data.success) {
                setMensagens(prev => prev.map(m =>
                    m.id === msgTemp.id ? { ...data.data, sending: false } : m
                ));
            }
        } catch (error) {
            console.error('Erro ao enviar:', error);
            setMensagens(prev => prev.filter(m => m.id !== msgTemp.id));
        }
    };

    const getNomeConversa = (conversa) => {
        if (!conversa) return '';
        if (conversa.tipo === 'channel') return conversa.nome;
        if (conversa.outro_participante) return conversa.outro_participante.nome;
        return 'Conversa';
    };

    const getAvatarConversa = (conversa) => {
        if (conversa.tipo === 'channel') return <Hash size={18} className="text-white" />;
        const nome = getNomeConversa(conversa);
        return nome.charAt(0).toUpperCase();
    };

    const formatarHora = (dataStr) => {
        if (!dataStr) return '';
        const data = new Date(dataStr);
        const hoje = new Date();
        if (data.toDateString() === hoje.toDateString()) {
            return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        }
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(10px)' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-[85px] right-6 w-[420px] h-[640px] z-[999] flex flex-col"
                >
                    {/* Glass Container */}
                    <div className="absolute inset-0 bg-[#020617] rounded-[32px] border border-white/10 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col">

                        {/* HEADER - Premium Design */}
                        <div className="relative px-6 py-5 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                            <div className="flex items-center gap-4">
                                {(activeView === 'chat' || activeView === 'new' || activeView === 'help') ? (
                                    <motion.button
                                        whileHover={{ x: -2 }}
                                        onClick={voltarParaLista}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-colors"
                                    >
                                        <ChevronLeft size={22} />
                                    </motion.button>
                                ) : (
                                    <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                        <Sparkles size={24} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-white font-black text-lg tracking-tight">
                                        {activeView === 'list' && 'Hub de Mensagens'}
                                        {activeView === 'chat' && getNomeConversa(conversaAtiva)}
                                        {activeView === 'new' && 'Novo Chat'}
                                        {activeView === 'help' && 'Central de Ajuda'}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-white/40 text-[10px] uppercase font-black tracking-widest">{activeView === 'chat' ? 'Conectado agora' : 'SalesMaster Network'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {activeView === 'list' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => { setActiveView('new'); fetchUsuarios(); }}
                                        className="w-10 h-10 flex items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                    >
                                        <Plus size={20} />
                                    </motion.button>
                                )}
                                <button onClick={() => setIsOpen(false)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-hidden relative">
                            <AnimatePresence mode="wait">
                                {activeView === 'list' && (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="h-full overflow-y-auto px-4 py-2 custom-scrollbar"
                                    >
                                        {loading ? (
                                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                                <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                                                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Sincronizando...</span>
                                            </div>
                                        ) : conversas.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                                                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                                    <MessageSquare size={40} className="text-white/10" />
                                                </div>
                                                <h4 className="text-white font-black text-xl mb-2">Sem conversas</h4>
                                                <p className="text-white/40 text-sm mb-8 leading-relaxed">Conecte-se com sua equipe para agilizar as operações de venda.</p>
                                                <button
                                                    onClick={() => { setActiveView('new'); fetchUsuarios(); }}
                                                    className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/5"
                                                >
                                                    Iniciar Primeiro Chat
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid gap-2 py-2">
                                                {conversas.map(conversa => (
                                                    <motion.div
                                                        key={conversa.id}
                                                        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                        onClick={() => abrirConversa(conversa)}
                                                        className="group flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all border border-transparent hover:border-white/5"
                                                    >
                                                        <div className={cn(
                                                            "w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner relative",
                                                            conversa.tipo === 'channel' ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                        )}>
                                                            {getAvatarConversa(conversa)}
                                                            {conversa.online && <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-4 border-slate-900" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-white font-black tracking-tight group-hover:text-emerald-400 transition-colors">
                                                                    {getNomeConversa(conversa)}
                                                                </span>
                                                                <span className="text-white/20 text-[10px] font-black group-hover:text-white/40 transition-colors">
                                                                    {formatarHora(conversa.last_message_at)}
                                                                </span>
                                                            </div>
                                                            <p className="text-white/40 text-sm truncate font-medium">
                                                                {conversa.ultima_mensagem || 'Nenhuma mensagem recente'}
                                                            </p>
                                                        </div>
                                                        {parseInt(conversa.nao_lidas) > 0 && (
                                                            <div className="w-6 h-6 bg-emerald-500 text-white text-[10px] font-black rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                                                {conversa.nao_lidas}
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeView === 'chat' && (
                                    <motion.div
                                        key="chat"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="h-full flex flex-col bg-black/20"
                                    >
                                        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 custom-scrollbar">
                                            {mensagens.map((msg, index) => {
                                                const isMe = parseInt(msg.remetente_id) === parseInt(userId);
                                                const showHeader = index === 0 || mensagens[index - 1]?.remetente_id !== msg.remetente_id;

                                                return (
                                                    <div key={msg.id} className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}>
                                                        {!isMe && showHeader && (
                                                            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1.5 ml-1">
                                                                {msg.remetente?.nome}
                                                            </span>
                                                        )}
                                                        <div className={cn(
                                                            "max-w-[85%] px-5 py-3.5 relative shadow-xl transform transition-transform group-hover:scale-[1.02]",
                                                            isMe
                                                                ? "bg-emerald-600 text-white rounded-[24px] rounded-br-[4px] shadow-emerald-900/10"
                                                                : "bg-white/5 backdrop-blur-md text-white rounded-[24px] rounded-bl-[4px] border border-white/5"
                                                        )}>
                                                            <p className="text-[15px] leading-relaxed font-semibold break-words">
                                                                {msg.conteudo}
                                                            </p>
                                                            <div className={cn("flex items-center gap-1.5 mt-2", isMe ? "justify-end text-white/50" : "text-white/30")}>
                                                                <span className="text-[9px] font-black tracking-tighter italic">
                                                                    {formatarHora(msg.created_at)}
                                                                </span>
                                                                {isMe && (
                                                                    msg.sending
                                                                        ? <Clock size={10} className="animate-spin" />
                                                                        : <CheckCheck size={12} className="text-emerald-300" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* MODERN INPUT AREA */}
                                        <div className="p-6 bg-gradient-to-t from-slate-950 to-transparent">
                                            <div className="relative group">
                                                <div className="absolute inset-0 bg-white/5 rounded-[24px] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                                                <form
                                                    onSubmit={enviarMensagem}
                                                    className="relative flex items-center gap-2 p-2 bg-white/5 backdrop-blur-2xl rounded-[100px] border border-white/10 focus-within:border-emerald-500/50 transition-all shadow-inner"
                                                >
                                                    <button type="button" className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-emerald-400 transition-colors">
                                                        <Paperclip size={20} />
                                                    </button>
                                                    <input
                                                        ref={inputRef}
                                                        autoFocus
                                                        value={novaMensagem}
                                                        onChange={(e) => setNovaMensagem(e.target.value)}
                                                        placeholder="Sua mensagem..."
                                                        className="flex-1 bg-transparent text-white truncate px-4 py-3 text-sm font-bold placeholder:text-white/20 focus:outline-none"
                                                    />
                                                    <button type="button" className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-amber-400 transition-colors">
                                                        <Smile size={20} />
                                                    </button>
                                                    <motion.button
                                                        whileTap={{ scale: 0.9 }}
                                                        type="submit"
                                                        disabled={!novaMensagem.trim()}
                                                        className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-400 disabled:opacity-20 disabled:grayscale transition-all"
                                                    >
                                                        <Send size={20} fill="currentColor" />
                                                    </motion.button>
                                                </form>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeView === 'new' && (
                                    <motion.div
                                        key="new"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="h-full flex flex-col"
                                    >
                                        <div className="px-6 py-4 border-b border-white/5">
                                            <div className="relative">
                                                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                                                <input
                                                    placeholder="Buscar integrante..."
                                                    value={busca}
                                                    onChange={(e) => setBusca(e.target.value)}
                                                    className="w-full bg-white/5 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-black border border-white/5 focus:border-emerald-500/30 transition-all focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                                            {usuarios
                                                .filter(u => u.id !== parseInt(userId) && (!busca || cn(u.nome, u.sobrenome).toLowerCase().includes(busca.toLowerCase())))
                                                .map(usuario => (
                                                    <motion.div
                                                        key={usuario.id}
                                                        whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                        onClick={() => iniciarNovaConversa(usuario.id)}
                                                        className="flex items-center gap-4 p-4 rounded-3xl cursor-pointer group"
                                                    >
                                                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white font-black border border-white/10 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                                                            {usuario.nome?.charAt(0) || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-black tracking-tight">{usuario.nome} {usuario.sobrenome}</p>
                                                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">{usuario.perfil || 'Membro do Time'}</p>
                                                        </div>
                                                        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Plus size={18} className="text-emerald-500" />
                                                        </div>
                                                    </motion.div>
                                                ))
                                            }
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Footer Accent Decoration */}
                    <div className="h-1 w-32 bg-emerald-500 mx-auto mt-4 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.5)] opacity-50" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatWidget;

