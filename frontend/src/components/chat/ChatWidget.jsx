// =====================================================
// 💬 SALESMASTER CHAT PRO - Widget de Chat
// Componente flutuante para comunicação
// =====================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageCircle, X, Send, Users, Hash, Bell, Search,
    ChevronLeft, MoreVertical, Image, Paperclip, Smile,
    Check, CheckCheck, Clock, Trash2, Plus, Settings
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

// Componente principal do Chat Widget
const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeView, setActiveView] = useState('list'); // 'list', 'chat', 'new'
    const [conversas, setConversas] = useState([]);
    const [conversaAtiva, setConversaAtiva] = useState(null);
    const [mensagens, setMensagens] = useState([]);
    const [novaMensagem, setNovaMensagem] = useState('');
    const [loading, setLoading] = useState(false);
    const [notificacoes, setNotificacoes] = useState([]);
    const [totalNaoLidas, setTotalNaoLidas] = useState(0);
    const [usuarios, setUsuarios] = useState([]);
    const [busca, setBusca] = useState('');

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const userId = sessionStorage.getItem('userId') || '1';

    // Scroll para última mensagem
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [mensagens]);

    // Buscar resumo (badge)
    const fetchResumo = useCallback(async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/resumo'), {
                headers: { 'x-user-id': userId }
            });
            const data = await response.json();
            if (data.success) {
                setTotalNaoLidas(data.data.total);
            }
        } catch (error) {
            console.error('Erro ao buscar resumo do chat:', error);
        }
    }, [userId]);

    // Polling para atualizar resumo e listeners de eventos
    useEffect(() => {
        fetchResumo();
        const interval = setInterval(fetchResumo, 30000); // A cada 30s

        // Listener para abrir o chat externamente
        const handleToggle = () => {
            if (!isOpen) {
                handleOpen();
            } else {
                setIsOpen(false);
            }
        };

        window.addEventListener('chat:toggle', handleToggle);

        // Expor unread count para o sidebar
        const badgeInterval = setInterval(() => {
            window.dispatchEvent(new CustomEvent('chat:badge', { detail: totalNaoLidas }));
        }, 2000);

        return () => {
            clearInterval(interval);
            clearInterval(badgeInterval);
            window.removeEventListener('chat:toggle', handleToggle);
        };
    }, [fetchResumo, isOpen, totalNaoLidas]);

    // Buscar conversas
    const fetchConversas = async () => {
        try {
            setLoading(true);
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/conversas'), {
                headers: { 'x-user-id': userId }
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

    // Buscar mensagens de uma conversa
    const fetchMensagens = async (conversaId) => {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/chat/conversas/${conversaId}/mensagens`),
                { headers: { 'x-user-id': userId } }
            );
            const data = await response.json();
            if (data.success) {
                setMensagens(data.data);
                fetchResumo(); // Atualizar badge
            }
        } catch (error) {
            console.error('Erro ao buscar mensagens:', error);
        }
    };

    // Buscar usuários para nova conversa
    const fetchUsuarios = async () => {
        try {
            const response = await fetch(getApiUrl(NODE_API_URL, '/api/chat/usuarios'), {
                headers: { 'x-user-id': userId }
            });
            const data = await response.json();
            if (data.success) {
                setUsuarios(data.data);
            }
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        }
    };

    // Abrir chat
    const handleOpen = () => {
        setIsOpen(true);
        fetchConversas();
    };

    // Abrir conversa específica
    const abrirConversa = (conversa) => {
        setConversaAtiva(conversa);
        setActiveView('chat');
        fetchMensagens(conversa.id);
    };

    // Voltar para lista
    const voltarParaLista = () => {
        setActiveView('list');
        setConversaAtiva(null);
        setMensagens([]);
        fetchConversas();
    };

    // Iniciar nova conversa
    const iniciarNovaConversa = async (outroUsuarioId) => {
        try {
            const response = await fetch(
                getApiUrl(NODE_API_URL, `/api/chat/conversas/direct/${outroUsuarioId}`),
                { headers: { 'x-user-id': userId } }
            );
            const data = await response.json();
            if (data.success) {
                // Recarregar conversas e abrir a nova
                await fetchConversas();
                const conversa = { id: data.data.id, tipo: 'direct' };
                abrirConversa(conversa);
            }
        } catch (error) {
            console.error('Erro ao criar conversa:', error);
        }
    };

    // Enviar mensagem
    const enviarMensagem = async (e) => {
        e.preventDefault();
        if (!novaMensagem.trim() || !conversaAtiva) return;

        const textoMensagem = novaMensagem.trim();
        setNovaMensagem('');

        // Adicionar mensagem otimisticamente
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
                        'x-user-id': userId
                    },
                    body: JSON.stringify({ conteudo: textoMensagem })
                }
            );
            const data = await response.json();
            if (data.success) {
                // Substituir mensagem temporária pela real
                setMensagens(prev => prev.map(m =>
                    m.id === msgTemp.id ? { ...data.data, sending: false } : m
                ));
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            // Remover mensagem temporária em caso de erro
            setMensagens(prev => prev.filter(m => m.id !== msgTemp.id));
        }
    };

    // Nome da conversa
    const getNomeConversa = (conversa) => {
        if (conversa.tipo === 'channel') return conversa.nome;
        if (conversa.outro_participante) return conversa.outro_participante.nome;
        return 'Conversa';
    };

    // Avatar da conversa
    const getAvatarConversa = (conversa) => {
        if (conversa.tipo === 'channel') return <Hash size={20} />;
        const nome = getNomeConversa(conversa);
        return nome.charAt(0).toUpperCase();
    };

    // Formatar hora
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
        <>

            {/* Janela do Chat */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 overflow-hidden z-50 flex flex-col"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-4 flex items-center gap-3">
                            {activeView === 'chat' && (
                                <button onClick={voltarParaLista} className="text-white/80 hover:text-white">
                                    <ChevronLeft size={20} />
                                </button>
                            )}
                            <div className="flex-1">
                                <h3 className="text-white font-semibold">
                                    {activeView === 'list' && 'Mensagens'}
                                    {activeView === 'chat' && getNomeConversa(conversaAtiva)}
                                    {activeView === 'new' && 'Nova Conversa'}
                                </h3>
                                {activeView === 'list' && (
                                    <p className="text-white/70 text-xs">SalesMaster Chat</p>
                                )}
                            </div>
                            {activeView === 'list' && (
                                <button
                                    onClick={() => { setActiveView('new'); fetchUsuarios(); }}
                                    className="text-white/80 hover:text-white"
                                >
                                    <Plus size={20} />
                                </button>
                            )}
                        </div>

                        {/* Conteúdo */}
                        <div className="flex-1 overflow-hidden">
                            {/* Lista de Conversas */}
                            {activeView === 'list' && (
                                <div className="h-full overflow-y-auto">
                                    {loading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
                                        </div>
                                    ) : conversas.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500 p-6">
                                            <MessageCircle size={48} className="mb-4 opacity-50" />
                                            <p className="text-center">Nenhuma conversa ainda</p>
                                            <button
                                                onClick={() => { setActiveView('new'); fetchUsuarios(); }}
                                                className="mt-4 text-emerald-400 hover:underline text-sm"
                                            >
                                                + Iniciar nova conversa
                                            </button>
                                        </div>
                                    ) : (
                                        conversas.map(conversa => (
                                            <div
                                                key={conversa.id}
                                                onClick={() => abrirConversa(conversa)}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/50 transition-colors"
                                            >
                                                {/* Avatar */}
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${conversa.tipo === 'channel' ? 'bg-blue-600' : 'bg-emerald-600'
                                                    }`}>
                                                    {getAvatarConversa(conversa)}
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-medium truncate">
                                                            {getNomeConversa(conversa)}
                                                        </span>
                                                        <span className="text-gray-500 text-xs">
                                                            {formatarHora(conversa.last_message_at)}
                                                        </span>
                                                    </div>
                                                    <p className="text-gray-400 text-sm truncate">
                                                        {conversa.ultima_mensagem || 'Sem mensagens'}
                                                    </p>
                                                </div>

                                                {/* Badge não lidas */}
                                                {parseInt(conversa.nao_lidas) > 0 && (
                                                    <span className="w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                        {conversa.nao_lidas}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* Chat Ativo */}
                            {activeView === 'chat' && (
                                <div className="h-full flex flex-col">
                                    {/* Mensagens */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {mensagens.map((msg, index) => {
                                            const isMinhaMsg = parseInt(msg.remetente_id) === parseInt(userId);
                                            const showAvatar = !isMinhaMsg && (
                                                index === 0 ||
                                                mensagens[index - 1]?.remetente_id !== msg.remetente_id
                                            );

                                            return (
                                                <div
                                                    key={msg.id}
                                                    className={`flex ${isMinhaMsg ? 'justify-end' : 'justify-start'}`}
                                                >
                                                    {!isMinhaMsg && showAvatar && (
                                                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white text-xs font-medium mr-2">
                                                            {msg.remetente?.nome?.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    {!isMinhaMsg && !showAvatar && <div className="w-8 mr-2" />}

                                                    <div className={`max-w-[75%] ${isMinhaMsg ? 'order-1' : ''}`}>
                                                        {!isMinhaMsg && showAvatar && (
                                                            <span className="text-xs text-gray-500 mb-1 block">
                                                                {msg.remetente?.nome}
                                                            </span>
                                                        )}
                                                        <div className={`px-3 py-2 rounded-2xl ${isMinhaMsg
                                                            ? 'bg-emerald-600 text-white rounded-br-md'
                                                            : 'bg-gray-800 text-white rounded-bl-md'
                                                            } ${msg.sending ? 'opacity-70' : ''}`}>
                                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                                {msg.conteudo}
                                                            </p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 mt-1 ${isMinhaMsg ? 'justify-end' : ''}`}>
                                                            <span className="text-xs text-gray-500">
                                                                {formatarHora(msg.created_at)}
                                                            </span>
                                                            {isMinhaMsg && (
                                                                msg.sending
                                                                    ? <Clock size={12} className="text-gray-500" />
                                                                    : <CheckCheck size={12} className="text-emerald-400" />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Input */}
                                    <form onSubmit={enviarMensagem} className="p-3 border-t border-gray-800 bg-gray-900">
                                        <div className="flex items-center gap-2">
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={novaMensagem}
                                                onChange={(e) => setNovaMensagem(e.target.value)}
                                                placeholder="Digite sua mensagem..."
                                                className="flex-1 bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                type="submit"
                                                disabled={!novaMensagem.trim()}
                                                className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {/* Nova Conversa */}
                            {activeView === 'new' && (
                                <div className="h-full overflow-y-auto">
                                    {/* Busca */}
                                    <div className="p-3 border-b border-gray-800">
                                        <div className="relative">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                            <input
                                                type="text"
                                                value={busca}
                                                onChange={(e) => setBusca(e.target.value)}
                                                placeholder="Buscar usuário..."
                                                className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                        </div>
                                    </div>

                                    {/* Lista de Usuários */}
                                    {usuarios
                                        .filter(u =>
                                            !busca ||
                                            u.nome?.toLowerCase().includes(busca.toLowerCase()) ||
                                            u.sobrenome?.toLowerCase().includes(busca.toLowerCase())
                                        )
                                        .map(usuario => (
                                            <div
                                                key={usuario.id}
                                                onClick={() => iniciarNovaConversa(usuario.id)}
                                                className="flex items-center gap-3 p-3 hover:bg-gray-800/50 cursor-pointer border-b border-gray-800/50"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
                                                    {usuario.nome?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-white font-medium">
                                                        {usuario.nome} {usuario.sobrenome}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    }

                                    {usuarios.length === 0 && (
                                        <div className="flex items-center justify-center h-32 text-gray-500">
                                            Nenhum usuário encontrado
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
