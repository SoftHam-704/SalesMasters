import React, { useState, useEffect, useRef } from "react";
import { GoogleGenAI, Modality } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Loader2, Package, Clock, Calendar } from "lucide-react";
import { AudioHandler, SYSTEM_INSTRUCTION, stockToolDeclaration } from "../lib/gemini";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
}

export default function VoiceAssistant() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [stock, setStock] = useState<StockItem[]>([]);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [transcription, setTranscription] = useState("");

  const audioHandlerRef = useRef<AudioHandler | null>(null);
  const sessionRef = useRef<any>(null);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    const res = await fetch("/api/stock");
    const data = await res.json();
    setStock(data);
  };

  const handleUpdateStock = async (name: string, quantityChange: number) => {
    const res = await fetch("/api/stock/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, quantityChange }),
    });
    const data = await res.json();
    if (data.success) {
      setLastAction(`Estoque Atualizado: ${data.item.name} (${quantityChange > 0 ? "+" : ""}${quantityChange})`);
      fetchStock();
      return { success: true, item: data.item };
    }
    return { success: false, message: data.message };
  };

  const toggleConnection = async () => {
    if (isConnected) {
      audioHandlerRef.current?.stopCapture();
      sessionRef.current?.close();
      setIsConnected(false);
      setIsRecording(false);
      return;
    }

    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const audioHandler = new AudioHandler();
      audioHandlerRef.current = audioHandler;

      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          tools: [{ functionDeclarations: [stockToolDeclaration] }],
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            setIsRecording(true);
            audioHandler.startCapture((base64) => {
              session.sendRealtimeInput({
                audio: { data: base64, mimeType: "audio/pcm;rate=16000" },
              });
            });
          },
          onmessage: async (message) => {
            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              audioHandler.playChunk(audioData);
            }

            // Handle Tool Calls
            const toolCall = message.serverContent?.modelTurn?.parts?.[0]?.functionCall;
            if (toolCall && toolCall.name === "updateStock") {
              const args = toolCall.args as { name: string; quantityChange: number };
              const result = await handleUpdateStock(args.name, args.quantityChange);
              session.sendToolResponse({
                functionResponses: [
                  {
                    name: "updateStock",
                    id: toolCall.id,
                    response: result,
                  },
                ],
              });
            }

            // Handle Transcription (if enabled in config)
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
              setTranscription(prev => prev + " " + message.serverContent?.modelTurn?.parts?.[0]?.text);
            }
          },
          onclose: () => {
            setIsConnected(false);
            setIsRecording(false);
          },
          onerror: (err: any) => {
            console.error("Gemini Live Error:", err);
            setIsConnecting(false);
          },
        },
      });

      sessionRef.current = session;
    } catch (error) {
      console.error("Failed to connect:", error);
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E6E6E6] p-4 md:p-8 font-sans text-[#151619]">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Bia Live Interface */}
        <div className="md:col-span-2 space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#151619] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Hardware Feel: Dashed Grid Background */}
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#FFF 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
            
            <div className="relative z-10 flex flex-col items-center text-center space-y-8">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Ambiente Restaurado (Padrão A.N.T)</span>
                </div>
                <div className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Gemini 2.5 Live</div>
              </div>

              {/* Bia Visualizer */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.2, opacity: 0.2 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
                    />
                  )}
                </AnimatePresence>
                
                <div className={cn(
                  "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 border-2",
                  isConnected ? "border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.5)]" : "border-white/10"
                )}>
                  <div className="text-white">
                    {isConnecting ? (
                      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    ) : isConnected ? (
                      <div className="flex space-x-1 items-center">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ height: [10, 30, 10] }}
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                            className="w-1 bg-blue-500 rounded-full"
                          />
                        ))}
                      </div>
                    ) : (
                      <Mic className="w-12 h-12 text-white/20" />
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-white">Bia Live <span className="text-[10px] bg-blue-500 px-1.5 py-0.5 rounded ml-2 align-middle">REAL-TIME</span></h2>
                <p className="text-white/60 text-sm">Conexão Multimodal direta com Gemini 2.5</p>
              </div>

              <button
                onClick={toggleConnection}
                disabled={isConnecting}
                className={cn(
                  "px-12 py-4 rounded-xl font-bold transition-all duration-300 flex items-center space-x-3",
                  isConnected 
                    ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white" 
                    : "bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/20"
                )}
              >
                {isConnected ? (
                  <>
                    <MicOff className="w-5 h-5" />
                    <span>ENCERRAR</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-5 h-5" />
                    <span>INICIAR CONVERSA</span>
                  </>
                )}
              </button>

              {lastAction && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 w-full text-left"
                >
                  <div className="flex items-center space-x-2 text-blue-400 mb-1">
                    <Package className="w-4 h-4" />
                    <span className="text-[10px] font-mono uppercase tracking-wider">Ação Recente</span>
                  </div>
                  <p className="text-white text-xs font-medium">{lastAction}</p>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Transcription Area */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5 min-h-[100px]">
            <div className="flex items-center space-x-2 text-black/40 mb-4">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-mono uppercase tracking-wider">Transcrição ao Vivo</span>
            </div>
            <p className="text-sm text-black/80 leading-relaxed italic">
              {transcription || "Aguardando interação..."}
            </p>
          </div>
        </div>

        {/* Right Column: Stock Status */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-black/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">Base de Produtos</h3>
              <Package className="w-5 h-5 text-black/20" />
            </div>
            
            <div className="space-y-4">
              {stock.map((item) => (
                <div key={item.id} className="p-4 bg-[#F5F5F5] rounded-xl border border-black/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-medium text-black/60">{item.name}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono",
                      item.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                      {item.quantity > 0 ? "EM ESTOQUE" : "ESGOTADO"}
                    </span>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-bold">{item.quantity}</span>
                    <span className="text-[10px] text-black/40 uppercase font-mono">{item.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-6 py-3 border-2 border-dashed border-black/10 rounded-xl text-black/40 text-sm font-medium hover:border-blue-500 hover:text-blue-500 transition-colors">
              + Novo Produto
            </button>
          </div>

          {/* Extra Info Cards */}
          <div className="bg-[#151619] rounded-2xl p-6 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calendar className="w-12 h-12" />
            </div>
            <div className="relative z-10">
              <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest block mb-1">Status do Sistema</span>
              <div className="text-xl font-bold mb-4">Sábado, 22 de Março</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-[10px] text-white/40 uppercase mb-1">Fuso Rondônia</div>
                  <div className="text-sm font-mono">18:18</div>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                  <div className="text-[10px] text-white/40 uppercase mb-1">Latência</div>
                  <div className="text-sm font-mono">12ms</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
