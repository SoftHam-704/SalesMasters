// =====================================================
// 💬 SALESMASTER CHAT PRO - Fresh Corporate Edition
// =====================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, CheckCheck, Clock, Trash2, Plus, Settings, HelpCircle, Info,
    Hash, MessageCircle, MessageSquare, ChevronLeft, Send, Search, X,
    User, Users, Sparkles, Bell, MoreVertical, Paperclip, Smile,
    ArrowLeft, Loader2
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

    const userId = sessionUser?.chat_user_id || sessionUser?.id || sessionUser?.ven_codigo || '1';
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
    }, [userId, empresaId]);

    useEffect(() => {
        if (!userId) return;

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
    }, [fetchResumo, isOpen, totalNaoLidas, userId]);

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
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/usuarios'), {
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
                const conversa = { id: data.data.id, tipo: 'direct', outro_participante: data.data.outro_participante || { id: outroUsuarioId, nome: 'Usuário' } };
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
        if (conversa.tipo === 'channel') return <Hash size={18} className="text-[#60A5FA]" />;
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
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.9 }}
                    className="fixed bottom-6 right-6 w-[380px] h-[600px] z-[999] flex flex-col font-['IBM_Plex_Sans',sans-serif]"
                >
                    {/* Main Container */}
                    <div className="flex-1 bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col relative">

                        {/* Elegant Top Bar Accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#60A5FA] to-[#10B981]"></div>

                        {/* HEADER */}
                        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white z-10">
                            <div className="flex items-center gap-3">
                                {activeView !== 'list' ? (
                                    <button
                                        onClick={voltarParaLista}
                                        className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <div className="p-2 bg-[#F1F5F9] rounded-xl">
                                        <MessageSquare className="w-5 h-5 text-[#10B981]" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-bold text-[#1E293B] uppercase tracking-wide">
                                        {activeView === 'list' && 'Hub de Mensagens'}
                                        {activeView === 'chat' && getNomeConversa(conversaAtiva)}
                                        {activeView === 'new' && 'Nova Conversa'}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></div>
                                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                                            {activeView === 'chat' ? 'Online' : 'SalesMaster Network'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {activeView === 'list' && (
                                    <button
                                        onClick={() => { setActiveView('new'); fetchUsuarios(); }}
                                        className="p-2 text-[#64748B] hover:text-[#60A5FA] transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 text-[#64748B] hover:text-[#DC2626] transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* CONTENT */}
                        <div className="flex-1 overflow-hidden relative bg-[#F8FAFC]">
                            <AnimatePresence mode="wait">
                                {activeView === 'list' && (
                                    <motion.div
                                        key="list"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar"
                                    >
                                        {loading ? (
                                            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#94A3B8]">
                                                <Loader2 className="w-8 h-8 animate-spin" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-[#64748B]">Sincronizando...</span>
                                            </div>
                                        ) : (
                                            <>
                                                {conversas.length === 0 ? (
                                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                                        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-center mb-4">
                                                            <Bell className="w-8 h-8 text-[#E2E8F0]" />
                                                        </div>
                                                        <h4 className="text-sm font-bold text-[#1E293B] mb-1">Sem conversas ativas</h4>
                                                        <p className="text-xs text-[#64748B] leading-relaxed">Clique no "+" para começar a falar com seus colegas.</p>
                                                    </div>
                                                ) : (
                                                    conversas.map(conversa => (
                                                        <button
                                                            key={conversa.id}
                                                            onClick={() => abrirConversa(conversa)}
                                                            className="flex items-center gap-4 p-3.5 bg-white border border-transparent hover:border-[#E2E8F0] hover:shadow-sm rounded-2xl transition-all group text-left w-full"
                                                        >
                                                            <div className={cn(
                                                                "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0",
                                                                conversa.tipo === 'channel' ? "bg-[#60A5FA]/10 text-[#60A5FA]" : "bg-[#10B981]/10 text-[#10B981]"
                                                            )}>
                                                                {getAvatarConversa(conversa)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <span className="text-sm font-bold text-[#1E293B] line-clamp-1">{getNomeConversa(conversa)}</span>
                                                                    <span className="text-[10px] font-bold text-[#94A3B8]">{formatarHora(conversa.last_message_at)}</span>
                                                                </div>
                                                                <p className="text-xs text-[#64748B] font-medium line-clamp-1">
                                                                    {conversa.ultima_mensagem || 'Nenhuma mensagem recente'}
                                                                </p>
                                                            </div>
                                                            {parseInt(conversa.nao_lidas) > 0 && (
                                                                <div className="w-5 h-5 bg-[#10B981] text-white text-[10px] font-black rounded-lg flex items-center justify-center shrink-0">
                                                                    {conversa.nao_lidas}
                                                                </div>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </motion.div>
                                )}

                                {activeView === 'chat' && (
                                    <motion.div
                                        key="chat"
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="h-full flex flex-col"
                                    >
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                            {mensagens.map((msg, index) => {
                                                const isMe = parseInt(msg.remetente_id) === parseInt(userId);
                                                const showHeader = index === 0 || mensagens[index - 1]?.remetente_id !== msg.remetente_id;

                                                return (
                                                    <div key={msg.id} className={cn("flex flex-col", isMe ? "items-end" : "items-start")}>
                                                        {!isMe && showHeader && (
                                                            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest mb-1 ml-1">
                                                                {msg.remetente?.nome}
                                                            </span>
                                                        )}
                                                        <div className={cn(
                                                            "max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm",
                                                            isMe
                                                                ? "bg-[#10B981] text-white rounded-br-none"
                                                                : "bg-white border border-[#E2E8F0] text-[#1E293B] rounded-bl-none"
                                                        )}>
                                                            <p className="font-medium">{msg.conteudo}</p>
                                                            <div className={cn("flex items-center gap-1 mt-1 text-[9px] font-bold uppercase tracking-tighter opacity-70", isMe ? "justify-end" : "")}>
                                                                {formatarHora(msg.created_at)}
                                                                {isMe && (
                                                                    msg.sending ? <Clock size={10} className="animate-spin" /> : <CheckCheck size={12} />
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* INPUT */}
                                        <div className="p-4 bg-white border-t border-[#E2E8F0]">
                                            <form
                                                onSubmit={enviarMensagem}
                                                className="flex items-center gap-2"
                                            >
                                                <input
                                                    ref={inputRef}
                                                    autoFocus
                                                    value={novaMensagem}
                                                    onChange={(e) => setNovaMensagem(e.target.value)}
                                                    placeholder="Digite sua mensagem..."
                                                    className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm font-medium text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 focus:border-[#10B981] transition-all"
                                                />
                                                <button
                                                    type="submit"
                                                    disabled={!novaMensagem.trim()}
                                                    className="w-10 h-10 bg-[#10B981] hover:bg-[#059669] disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#10B981]/20 transition-all active:scale-95"
                                                >
                                                    <Send className="w-5 h-5" />
                                                </button>
                                            </form>
                                        </div>
                                    </motion.div>
                                )}

                                {activeView === 'new' && (
                                    <motion.div
                                        key="new"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="h-full flex flex-col p-4"
                                    >
                                        <div className="relative mb-4">
                                            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                placeholder="Buscar colega pelo nome..."
                                                value={busca}
                                                onChange={(e) => setBusca(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#60A5FA]/20 focus:border-[#60A5FA] transition-all"
                                            />
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                                            {usuarios
                                                .filter(u => u.id !== parseInt(userId) && (!busca || (u.nome + ' ' + (u.sobrenome || '')).toLowerCase().includes(busca.toLowerCase())))
                                                .map(usuario => (
                                                    <button
                                                        key={usuario.id}
                                                        onClick={() => iniciarNovaConversa(usuario.id)}
                                                        className="flex items-center gap-3 w-full p-3 hover:bg-white hover:border-[#E2E8F0] border border-transparent rounded-2xl transition-all group"
                                                    >
                                                        <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-sm font-bold text-[#10B981] uppercase group-hover:bg-[#10B981]/10 transition-colors">
                                                            {usuario.nome?.charAt(0) || '?'}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-bold text-[#1E293B]">{usuario.nome} {usuario.sobrenome}</p>
                                                            <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest">{usuario.perfil || 'Equipe'}</p>
                                                        </div>
                                                        <Plus className="w-4 h-4 text-[#94A3B8] ml-auto group-hover:text-[#10B981] transition-colors" />
                                                    </button>
                                                ))
                                            }
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Styles for scrollbar */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #E2E8F0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #CBD5E1;
                }
            `}} />
        </AnimatePresence>
    );
};

export default ChatWidget;
