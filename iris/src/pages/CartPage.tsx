import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { catalogApi } from '../lib/api';
import { ChevronLeft, Trash2, Minus, Plus, FileText, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CartPage = () => {
    const navigate = useNavigate();
    const { items, removeItem, updateQuantity, getTotal, clearCart, observacao, setObservacao } = useCartStore();
    const { industrias } = useAuthStore();
    
    const [submitting, setSubmitting] = useState(false);
    const [successData, setSuccessData] = useState<any>(null);

    const handleFinalize = async () => {
        if (items.length === 0) return;
        setSubmitting(true);
        try {
            // Assume single industry for MVP (or take from the first item)
            const firstItemInd = items[0].pro_id; // In reality, we'd need to group by industry
            // For MVP simplicity, we send them all. 
            // Better: find industry from first item or store it in cartStore
            
            const res = await catalogApi.createQuotation({
                industria: items[0].itab_ipi ? 36 : 42, // Mock logic or real from store
                tabela: 'LP PADRÃO',
                observacao,
                itens: items
            });
            
            if (res.data.success) {
                setSuccessData(res.data.data);
                clearCart();
            }
        } catch (e) {
            console.error(e);
            alert('Falha ao enviar cotação. Tente novamente.');
        }
        setSubmitting(false);
    };

    if (successData) {
        return (
            <div className="min-h-screen bg-[#06112a] flex flex-col items-center justify-center p-8 text-center gap-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring' }} className="w-24 h-24 bg-[#14B8A6]/20 rounded-full flex items-center justify-center text-[#14B8A6]">
                    <CheckCircle size={64} />
                </motion.div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold italic">Cotação Enviada!</h1>
                    <p className="text-gray-400 italic text-sm">Sua cotação <span className="text-white font-bold">#{successData.ped_pedido}</span> foi enviada para o representante e aguarda aprovação.</p>
                </div>
                <div className="w-full p-4 bg-[#1e293b] rounded-2xl border border-white/5 flex flex-col gap-2">
                    <div className="flex justify-between text-sm py-1 border-b border-white/5 italic text-gray-400">
                        <span>Total da Cotação</span>
                        <span className="text-white font-bold">R$ {successData.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
                <button 
                    onClick={() => navigate('/')}
                    className="w-full py-4 bg-[#14B8A6] text-black font-bold rounded-2xl shadow-lg mt-4 flex items-center justify-center gap-2 italic active:scale-95 transition-all"
                >
                    Voltar para Início
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#06112a] flex flex-col p-6 pb-32">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400"><ChevronLeft size={24}/></button>
                <h1 className="text-xl font-bold italic">Revisar Pedido</h1>
            </div>

            <div className="flex flex-col gap-4 flex-1">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-4 opacity-50 italic">
                        <Trash2 size={48} strokeWidth={1} />
                        <p>Seu carrinho está vazio.</p>
                        <button onClick={() => navigate('/catalog')} className="text-[#14B8A6] text-sm underline mt-2">Explorar catálogo</button>
                    </div>
                ) : (
                    <AnimatePresence>
                        {items.map((item) => (
                            <motion.div 
                                key={item.pro_id}
                                layout
                                exit={{ opacity: 0, x: -50 }}
                                className="bg-[#1e293b]/50 p-4 rounded-3xl border border-white/5 flex flex-col gap-3"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-sm font-bold truncate italic pr-4 uppercase">{item.pro_conversao || item.pro_nome}</h3>
                                        <p className="text-[10px] text-gray-400 italic font-medium">{item.pro_codprod} • R$ {item.preco_unitario.toLocaleString('pt-BR')}/un</p>
                                    </div>
                                    <button onClick={() => removeItem(item.pro_id)} className="text-red-500 p-1 opacity-50 hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                </div>
                                <div className="flex justify-between items-center bg-[#0f172a]/50 p-2 pl-4 rounded-2xl">
                                    <p className="text-lg font-bold text-[#14B8A6]">
                                        <span className="text-xs mr-1 italic">R$</span>
                                        {(item.quantidade * item.preco_unitario).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                    <div className="flex items-center bg-[#1e293b] rounded-xl border border-white/10 p-1">
                                        <button onClick={() => updateQuantity(item.pro_id, item.quantidade - 1)} className="p-1 text-gray-400"><Minus size={18}/></button>
                                        <span className="w-10 text-center font-bold text-sm italic">{item.quantidade}</span>
                                        <button onClick={() => updateQuantity(item.pro_id, item.quantidade + 1)} className="p-1 text-[#14B8A6]"><Plus size={18}/></button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {items.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#06112a] via-[#06112a] to-transparent flex flex-col gap-4">
                    <div className="bg-[#1e293b] p-4 rounded-3xl border border-white/10 flex flex-col gap-3">
                        <div className="flex items-center gap-3 text-gray-400 px-1 italic">
                            <FileText size={18} />
                            <input 
                                type="text" 
                                placeholder="Adicionar observação..." 
                                className="bg-transparent text-sm w-full focus:outline-none"
                                value={observacao}
                                onChange={(e) => setObservacao(e.target.value)}
                            />
                        </div>
                        <div className="h-px bg-white/5 mx-1"></div>
                        <div className="flex justify-between items-center px-1">
                            <span className="text-sm text-gray-400 italic">Total Estimado</span>
                            <span className="text-xl font-bold text-[#14B8A6]">R$ {getTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <button 
                            disabled={submitting}
                            onClick={handleFinalize}
                            className="w-full py-4 mt-1 bg-[#14B8A6] text-black font-bold rounded-2xl shadow-[0_0_40px_-10px_rgba(20,184,166,0.3)] flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all text-md italic disabled:opacity-50"
                        >
                            {submitting ? 'Enviando...' : (
                                <>
                                    <span>Enviar Cotação</span>
                                    <Send size={18} strokeWidth={2.5}/>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
