import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, ChevronRight } from 'lucide-react';

const RecentOrders = ({ orders = [] }) => {
    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl grad-indigo-soft flex items-center justify-center shadow-sm">
                        <ShoppingCart size={16} className="text-white" />
                    </div>
                    <h2 className="text-[17px] font-black text-slate-900 tracking-tight uppercase">Atividade Recente</h2>
                </div>
                <button className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 transition-colors uppercase tracking-widest flex items-center gap-1">
                    Ver tudo
                    <ChevronRight size={16} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.length > 0 ? (
                    orders.slice(0, 4).map((order, idx) => (
                        <motion.div
                            key={order.ped_pedido || idx}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ duration: 0.3, delay: idx * 0.05, type: 'spring', stiffness: 400, damping: 30 }}
                            whileHover={{ scale: 1.02 }}
                            className="card-premium-mobile p-5 flex items-center gap-4 cursor-pointer bg-white"
                        >
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 border border-indigo-200/50 flex items-center justify-center flex-shrink-0 shadow-sm transition-transform group-hover:scale-110">
                                <span className="text-sm font-black text-indigo-500 uppercase tracking-tighter">
                                    {(order.cli_nomred || 'C')[0]}
                                </span>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="text-[15px] font-black text-slate-900 leading-tight tracking-tight uppercase truncate">
                                    {order.cli_nomred}
                                </h4>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[11px] font-black text-emerald-600 uppercase tabular-nums tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md">
                                        #{order.ped_pedido || '000'}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                                        {order.for_nomered || 'Fornecedor'}
                                    </span>
                                </div>
                            </div>

                            {/* Value */}
                            <div className="text-right shrink-0">
                                <p className="text-[17px] font-black text-slate-900 tabular-nums tracking-tighter leading-none">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.ped_totliq || 0)}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-tight">
                                    {order.ped_data ? new Date(order.ped_data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : 'Hoje'}
                                </p>
                            </div>
                        </motion.div>
                    ))
                ) : (
                    <div className="col-span-full card-premium-mobile p-12 text-center border-dashed border-2 bg-slate-50/10 flex flex-col items-center justify-center">
                        <ShoppingCart size={32} className="text-slate-300 mb-4" />
                        <p className="text-[13px] font-black text-slate-400 uppercase tracking-widest">Nenhum pedido recente</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RecentOrders;
