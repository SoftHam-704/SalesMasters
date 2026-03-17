import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    CalendarDays,
    Users,
    Package,
    BarChart3,
    Target
} from 'lucide-react';

const quickActions = [
    { icon: ShoppingCart, label: 'Novo Pedido', gradient: 'grad-emerald-soft', path: '/orders/new' },
    { icon: CalendarDays, label: 'Agenda', gradient: 'grad-violet-soft', path: '/agenda' },
    { icon: Users, label: 'Parceiros', gradient: 'grad-blue-soft', path: '/clients' },
    { icon: Package, label: 'Catálogo', gradient: 'grad-indigo-soft', path: '/catalog' },
    { icon: BarChart3, label: 'Sell-Out', gradient: 'grad-amber-soft', path: '/sell-out' },
    { icon: Target, label: 'Campanhas', gradient: 'grad-rose-soft', path: '/campaigns' },
];

const QuickActions = () => {
    const navigate = useNavigate();

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-[17px] font-black text-slate-900 tracking-tight uppercase px-1">Acesso Rápido</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action, i) => {
                    const Icon = action.icon;
                    return (
                        <motion.button
                            key={action.label}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                                delay: 0.2 + i * 0.04,
                                type: 'spring',
                                stiffness: 400,
                                damping: 25,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate(action.path)}
                            className="relative card-premium-mobile flex flex-col items-center justify-center pt-6 pb-5 px-3 group overflow-hidden border-slate-100/60 bg-white"
                        >
                            <div className={`${action.gradient || 'bg-slate-200'} w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transform transition-transform group-active:scale-95`}>
                                <Icon size={24} className="text-white" strokeWidth={3} />
                            </div>
                            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-4 transition-colors group-hover:text-slate-900">
                                {action.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
};

export default QuickActions;
