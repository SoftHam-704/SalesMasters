import React from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';

const SalesHeader = ({ userName, companyName, isOnline, isLoading }) => {
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Bom dia';
        if (hour < 18) return 'Boa tarde';
        return 'Boa noite';
    };

    return (
        <div className="grad-premium-header safe-top relative overflow-hidden min-h-[170px] rounded-b-[32px] mb-6">
            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.1]" style={{
                backgroundImage: `radial-gradient(circle at 70% 20%, hsl(158 80% 50%), transparent 50%),
                          radial-gradient(circle at 20% 80%, hsl(258 60% 58%), transparent 40%)`
            }} />

            <div className="relative px-8 pt-8 pb-10">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <motion.div
                            initial={{ x: -16, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                            className="flex items-center gap-2.5"
                        >
                            <h1 className="text-[32px] font-extrabold tracking-tight text-white leading-tight">
                                {getGreeting()},
                                <br />
                                {userName}!
                            </h1>
                            <motion.span
                                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                                transition={{ duration: 1.5, delay: 0.6 }}
                                className="text-4xl mt-1"
                            >
                                👋
                            </motion.span>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="flex items-center gap-2 mt-4"
                        >
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[14px] font-medium text-white/70">
                                {isLoading ? "Sincronizando dados..." : `Analisando ${companyName || 'seu progresso'}`}
                            </span>
                        </motion.div>
                    </div>

                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-3 flex items-center gap-2 border border-white/10 shadow-lg"
                    >
                        {isOnline ? (
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                                <Wifi size={16} className="text-white/80" />
                                <span className="text-white/80 text-xs font-medium">Online</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                                <WifiOff size={16} className="text-white/50" />
                                <span className="text-white/50 text-xs font-medium">Offline</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default SalesHeader;
