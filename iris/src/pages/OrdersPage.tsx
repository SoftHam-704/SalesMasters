import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogApi } from '../lib/api';
import { ChevronLeft, ShoppingBag, Calendar, ArrowRight, ClipboardList } from 'lucide-react';
import { motion } from 'framer-motion';

const OrdersPage = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        catalogApi.getOrders().then(res => {
            if (res.data.success) setOrders(res.data.data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Q': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
            case 'F': return 'text-green-500 border-green-500/20 bg-green-500/10';
            case 'C': return 'text-red-500 border-red-500/20 bg-red-500/10';
            case 'A': return 'text-blue-500 border-blue-500/20 bg-blue-500/10';
            default: return 'text-gray-400 border-white/5 bg-white/5';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'Q': return 'Cotação Pendente';
            case 'F': return 'Faturado';
            case 'C': return 'Cancelado';
            case 'A': return 'Aprovado';
            default: return 'Processando';
        }
    };

    return (
        <div className="min-h-screen bg-[#06112a] flex flex-col p-6 pb-12">
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/')} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-xl font-bold italic">Minhas Cotações</h1>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 italic">Carregando histórico...</div>
            ) : orders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center gap-4 italic text-gray-500 opacity-50">
                    <ClipboardList size={64} strokeWidth={1} />
                    <p>Nenhuma cotação encontrada.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order: any, idx: number) => (
                        <motion.div 
                            key={order.ped_pedido}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="p-5 bg-[#1e293b]/50 rounded-[32px] border border-white/5 flex flex-col gap-4 backdrop-blur-sm"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#14B8A6]"></div>
                                        <p className="text-xs font-bold text-gray-400 italic uppercase">#{order.ped_pedido}</p>
                                    </div>
                                    <h3 className="font-bold text-md truncate w-48 italic uppercase">{order.industria_nome}</h3>
                                </div>
                                <div className={`text-[10px] px-3 py-1 rounded-full border font-bold italic ${getStatusColor(order.ped_situacao)}`}>
                                    {getStatusText(order.ped_situacao)}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end border-t border-white/5 pt-4">
                                <div className="flex flex-col gap-1 italic">
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                                        <Calendar size={12} />
                                        <span>{new Date(order.ped_data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                                        <ShoppingBag size={12} />
                                        <span>{order.total_itens} itens</span>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <p className="text-xs text-gray-400 italic line-height-1">Valor Final</p>
                                    <p className="text-lg font-bold text-[#14B8A6]">
                                        <span className="text-xs mr-1 italic">R$</span>
                                        {parseFloat(order.ped_totliq).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersPage;
