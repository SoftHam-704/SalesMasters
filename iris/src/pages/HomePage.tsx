import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { catalogApi } from '../lib/api';
import { Mic, List, ShoppingCart, User, PlusCircle, History } from 'lucide-react';
import { motion } from 'framer-motion';

const HomePage = () => {
    const navigate = useNavigate();
    const { lojista, industrias } = useAuthStore();
    const [recentOrders, setRecentOrders] = useState([]);

    useEffect(() => {
        catalogApi.getOrders().then(res => {
            if (res.data.success) setRecentOrders(res.data.data.slice(0, 3));
        });
    }, []);

    return (
        <div className="min-h-screen bg-[#06112a] p-6 pb-24 flex flex-col gap-8">
            {/* Header / Saudação */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-[#14B8A6] bg-clip-text text-transparent italic">
                        Olá, {lojista?.cli_nomred || 'Lojista'}!
                    </h1>
                    <p className="text-gray-400 text-sm italic">Como posso ser útil hoje?</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center border border-[#14B8A6]/20">
                    <User size={20} className="text-[#14B8A6]" />
                </div>
            </div>

            {/* Central CTA: Falar com Iris */}
            <motion.div 
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/voice')}
                className="relative h-64 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl overflow-hidden border border-[#14B8A6]/20 flex flex-col items-center justify-center gap-4 cursor-pointer"
            >
                <div className="absolute inset-0 bg-[#14B8A6]/5 blur-3xl rounded-full translate-y-1/2"></div>
                <div className="w-20 h-20 rounded-full bg-[#14B8A6]/20 flex items-center justify-center animate-pulse border border-[#14B8A6]/50 shadow-[0_0_40px_-10px_rgba(20,184,166,0.5)]">
                    <Mic size={40} className="text-[#14B8A6]" />
                </div>
                <h3 className="text-xl font-semibold italic">Falar com a Iris</h3>
                <p className="text-gray-400 text-xs px-12 text-center italic">"Iris, incluir 10 unidades da poltrona paris"</p>
            </motion.div>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => navigate('/catalog')}
                    className="p-4 bg-[#1e293b]/50 rounded-2xl border border-[#14B8A6]/10 flex flex-col gap-2 items-center italic"
                >
                    <List size={20} className="text-[#14B8A6]" />
                    <span className="text-sm font-medium">Ver Catálogo</span>
                </button>
                <button 
                    onClick={() => navigate('/cart')}
                    className="p-4 bg-[#1e293b]/50 rounded-2xl border border-[#14B8A6]/10 flex flex-col gap-2 items-center italic"
                >
                    <ShoppingCart size={20} className="text-[#14B8A6]" />
                    <span className="text-sm font-medium">Carrinho</span>
                </button>
            </div>

            {/* Últimos Pedidos */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center px-1">
                    <h2 className="text-md font-semibold italic">Últimas Cotações</h2>
                    <button onClick={() => navigate('/orders')} className="text-xs text-[#14B8A6] font-medium">Ver todas</button>
                </div>
                
                <div className="flex flex-col gap-3">
                    {recentOrders.map((order: any) => (
                        <div key={order.ped_pedido} className="p-4 bg-[#0f172a] rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 italic">#{order.ped_pedido}</p>
                                <p className="text-sm font-medium truncate w-32">{order.industria_nome}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-[#14B8A6]">R$ {parseFloat(order.ped_totliq).toLocaleString('pt-BR')}</p>
                                <p className="text-[10px] uppercase font-bold text-amber-500 italic">
                                    {order.ped_situacao === 'Q' ? 'Cotação Pendente' : order.ped_situacao}
                                </p>
                            </div>
                        </div>
                    ))}
                    {recentOrders.length === 0 && (
                        <p className="text-center text-gray-500 py-4 text-sm italic">Nenhuma cotação recente.</p>
                    )}
                </div>
            </div>

            {/* Bottom Nav Placeholder */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-[#06112a] to-transparent pointer-events-none">
                <div className="max-w-md mx-auto bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 p-2 rounded-full flex justify-around pointer-events-auto">
                    <button onClick={() => navigate('/')} className="p-2 text-[#14B8A6]"><History size={24}/></button>
                    <button onClick={() => navigate('/voice')} className="p-2 bg-[#14B8A6] text-black rounded-full shadow-lg"><PlusCircle size={28}/></button>
                    <button onClick={() => navigate('/profile')} className="p-2 text-gray-400"><User size={24}/></button>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
