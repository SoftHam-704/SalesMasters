import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';
import { catalogApi } from '../lib/api';
import { IRIS_SYSTEM_INSTRUCTION, irisTools, AudioHandler } from '../lib/gemini';
import { ChevronLeft, Mic, MicOff, ShoppingCart, Loader2, X, RefreshCw, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const VoiceSessionPage = () => {
    const navigate = useNavigate();
    const { lojista, industrias, token } = useAuthStore();
    const { items, addItem, getTotal, clearCart } = useCartStore();
    
    const [isActive, setIsActive] = useState(false);
    const [status, setStatus] = useState('Conectando...');
    const [transcript, setTranscript] = useState('');
    const [isAiTalking, setIsAiTalking] = useState(false);
    
    const wsRef = useRef<WebSocket | null>(null);
    const audioHandlerRef = useRef<AudioHandler>(new AudioHandler());

    useEffect(() => {
        setupWebSocket();
        return () => {
            wsRef.current?.close();
            audioHandlerRef.current.stopCapture();
        };
    }, []);

    const setupWebSocket = () => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setStatus('Erro: API Key não configurada.');
            return;
        }

        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            const setupMessage = {
                setup: {
                    model: "models/gemini-2.0-flash-exp",
                    generation_config: {
                        response_modalities: ["AUDIO"],
                        speech_config: { voice_config: { prebuilt_voice_config: { voice_name: "Aoede" } } }
                    },
                    system_instruction: { parts: [{ text: IRIS_SYSTEM_INSTRUCTION }] },
                    tools: [{ function_declarations: irisTools }]
                }
            };
            ws.send(JSON.stringify(setupMessage));
            setStatus('Iris está ouvindo...');
            setIsActive(true);
            
            // Start Audio capture after setup
            audioHandlerRef.current.startCapture((base64) => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        realtime_input: { media_chunks: [{ data: base64, mime_type: "audio/pcm" }] }
                    }));
                }
            });
        };

        ws.onmessage = async (event) => {
            const response = JSON.parse(event.data);
            
            // Handle Audio output from AI
            if (response.server_content?.model_turn?.parts) {
                for (const part of response.server_content.model_turn.parts) {
                    if (part.inline_data) {
                        setIsAiTalking(true);
                        audioHandlerRef.current.playChunk(part.inline_data.data);
                    }
                }
            }

            // Detect end of AI speech to stop animation
            if (response.server_content?.turn_complete) {
                setIsAiTalking(false);
            }

            // Handle Function Calls (IRIS TOOLS)
            if (response.server_content?.model_turn?.parts?.[0]?.function_call) {
                const call = response.server_content.model_turn.parts[0].function_call;
                console.log('🛠 IRIS TOOL CALL:', call.name, call.args);
                
                let result = {};
                
                try {
                    if (call.name === 'searchProduct') {
                        const { query, industria_id } = call.args;
                        const indId = industria_id || (industrias[0]?.id);
                        const res = await catalogApi.search(query, indId);
                        result = { products: res.data.data.slice(0, 5) };
                    } 
                    else if (call.name === 'addToCart') {
                        addItem({
                            pro_id: call.args.pro_id,
                            pro_codprod: call.args.pro_codprod,
                            pro_nome: call.args.pro_nome,
                            quantidade: call.args.quantidade,
                            preco_unitario: call.args.preco_unitario,
                            itab_ipi: call.args.itab_ipi || 0
                        });
                        result = { success: true, message: `Adicionado ao carrinho: ${call.args.pro_nome}` };
                    }
                    else if (call.name === 'finalizeQuotation') {
                        const res = await catalogApi.createQuotation({
                            industria: items[0]?.itab_ipi ? 36 : (items[0]?.pro_id ? 42 : industrias[0]?.id),
                            tabela: 'LP PADRÃO',
                            observacao: call.args.observacao,
                            itens: items
                        });
                        if (res.data.success) {
                            clearCart();
                            result = { success: true, order_number: res.data.data.ped_pedido };
                            setTimeout(() => navigate('/orders'), 3000);
                        }
                    }
                } catch (e) {
                    console.error('Erro na ferramenta Iris:', e);
                    result = { error: "Erro ao processar sua solicitação." };
                }

                // Send result back to Gemini
                ws.send(JSON.stringify({
                    tool_response: {
                        function_responses: [{
                            name: call.name,
                            response: { result },
                            id: call.id
                        }]
                    }
                }));
            }
        };

        ws.onclose = () => {
            setIsActive(false);
            setStatus('Sessão encerrada.');
        };
    };

    return (
        <div className="min-h-screen bg-[#06112a] flex flex-col p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400 hover:text-white"><ChevronLeft size={24}/></button>
                <div className="flex flex-col items-center">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-white to-[#14B8A6] bg-clip-text text-transparent italic uppercase tracking-widest">Iris AI</h1>
                    <p className="text-[10px] text-[#14B8A6] font-bold animate-pulse">{status}</p>
                </div>
                <div className="w-10"></div>
            </div>

            {/* AI Visualization Orbs */}
            <div className="flex-1 flex flex-col items-center justify-center relative py-20">
                <AnimatePresence>
                    {isAiTalking ? (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [1, 1.2, 1], opacity: 1 }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute w-64 h-64 bg-[#14B8A6]/10 rounded-full blur-[60px]"
                        />
                    ) : (
                        <div className="absolute w-48 h-48 bg-[#14B8A6]/5 rounded-full blur-[40px]" />
                    )}
                </AnimatePresence>
                
                <div className="relative z-10">
                    <div className={`w-36 h-36 rounded-full border border-[#14B8A6]/30 flex items-center justify-center transition-all duration-700 ${isAiTalking ? 'shadow-[0_0_100px_-10px_rgba(20,184,166,0.5)] scale-110' : 'shadow-none'}`}>
                        <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-[#14B8A6] to-[#0D9488] flex items-center justify-center shadow-xl ${isAiTalking ? 'animate-bounce' : ''}`}>
                            {isActive ? <Mic size={40} className="text-black" /> : <MicOff size={40} className="text-black" />}
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 text-center max-w-xs h-10 overflow-hidden italic text-gray-400 text-sm">
                    {transcript || (isActive ? "Aguardando seu comando..." : "Conectando ao núcleo de voz...")}
                </div>
            </div>

            {/* Live Cart Summary (Real-time updates) */}
            <div className="h-48 overflow-y-auto mb-6 flex flex-col gap-2 p-2 scrollbar-none">
                <AnimatePresence>
                    {items.slice(-3).reverse().map((item, id) => (
                        <motion.div 
                            key={item.pro_id}
                            initial={{ x: 50, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            className="bg-[#1e293b]/80 backdrop-blur-md p-3 rounded-2xl border border-white/5 flex justify-between items-center"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                                    <Plus size={16}/>
                                </div>
                                <div>
                                    <p className="text-xs font-bold truncate w-40 italic uppercase">{item.pro_nome}</p>
                                    <p className="text-[10px] text-gray-400 italic font-medium">{item.quantidade} un • R$ {item.preco_unitario.toLocaleString('pt-BR')}</p>
                                </div>
                            </div>
                            <p className="text-xs font-bold text-[#14B8A6] italic">R$ {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR')}</p>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {items.length > 3 && (
                    <p className="text-[10px] text-center text-gray-600 italic">+{items.length - 3} outros itens no carrinho</p>
                )}
            </div>

            {/* Session Footer */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end bg-[#0f172a]/50 p-4 rounded-3xl border border-white/5 h-20">
                    <div className="flex flex-col">
                        <p className="text-[10px] text-gray-400 italic">Total do Pedido</p>
                        <p className="text-2xl font-bold italic text-[#14B8A6]">
                             <span className="text-sm mr-1">R$</span> {getTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                    <button 
                        onClick={() => navigate('/cart')}
                        className="p-3 bg-white/5 text-gray-400 rounded-2xl flex items-center gap-2 hover:bg-[#14B8A6] hover:text-black transition-all mb-1 italic font-bold text-xs"
                    >
                        Revisar <ShoppingCart size={16}/>
                    </button>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex-1 py-4 bg-white/5 text-gray-500 rounded-2xl font-bold flex items-center justify-center gap-2 italic text-sm"
                    >
                        Encerrar Sessão
                    </button>
                    {!isActive && (
                        <button 
                            onClick={setupWebSocket}
                            className="flex-1 py-4 bg-[#14B8A6] text-black rounded-2xl font-bold flex items-center justify-center gap-2 italic text-sm shadow-lg animate-bounce"
                        >
                            Reconectar <RefreshCw size={18}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VoiceSessionPage;
