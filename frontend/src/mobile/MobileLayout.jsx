import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Home, Users, ShoppingCart, Menu, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import logoSales from '@/assets/salesmasters_logo_v2.png';

const MobileLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Bottom Navigation Items
    const navItems = [
        { path: '/', icon: Home, label: 'Início' },
        { path: '/clientes', icon: Users, label: 'Clientes' },
        { path: '/pedidos', icon: ShoppingCart, label: 'Pedidos' },
        { path: '/menu', icon: Menu, label: 'Menu' },
    ];

    const isCurrent = (path) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <div className="flex flex-col h-screen bg-background text-foreground transition-colors duration-300">
            {/* Top Bar (Header) - Emerald Dark Glass */}
            <div className="bg-card/30 backdrop-blur-xl px-4 py-3 flex items-center justify-between shadow-2xl sticky top-0 z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                    {location.pathname !== '/' && (
                        <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 active:scale-95 transition-all">
                            <ArrowLeft className="w-5 h-5 text-sage" />
                        </button>
                    )}
                    <img src={logoSales} alt="Logo" className="h-6 w-auto brightness-0 invert opacity-80" />
                </div>
                {/* Profile/Avatar Placeholder - Emerald Glow */}
                <div className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    {user?.nome?.substring(0, 2).toUpperCase() || 'SM'}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto pb-24 p-4 custom-scrollbar">
                {/* This will render the matched child route */}
                <Outlet />
            </div>

            {/* Bottom Navigation Bar - Tactical Glass */}
            <div className="bg-card/40 backdrop-blur-2xl border-t border-white/5 fixed bottom-0 w-full z-20 pb-safe">
                <div className="flex justify-around items-center h-18 py-2">
                    {navItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all duration-300",
                                isCurrent(item.path)
                                    ? "text-primary filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                    : "text-sage hover:text-white"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all duration-300",
                                isCurrent(item.path) ? "bg-primary/10" : ""
                            )}>
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-transform",
                                        isCurrent(item.path) && "scale-110"
                                    )}
                                    strokeWidth={isCurrent(item.path) ? 2.5 : 2}
                                />
                            </div>
                            <span className={cn(
                                "text-[9px] font-black uppercase tracking-widest transition-opacity",
                                isCurrent(item.path) ? "opacity-100" : "opacity-40"
                            )}>
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MobileLayout;
