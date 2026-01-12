import React, { useState, useEffect } from 'react';
import { Search, Phone, MessageCircle, MapPin, ChevronRight, UserPlus, Filter } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';

const MobileClients = () => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        try {
            setError(null);
            // O interceptor axiosInterceptor.js injeta automaticamente:
            // - x-access-token (do localStorage)
            // - x-tenant-cnpj (do sessionStorage)
            // - x-tenant-db-config (do sessionStorage)
            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/clientes'));

            // O backend retorna { success: true, data: [...] }
            setClients(response.data.data || []);
        } catch (error) {
            console.error("Erro ao carregar clientes mobile:", error);
            setError("Não foi possível carregar a lista de clientes.");
        } finally {
            setLoading(false);
        }
    };

    const filteredClients = clients.filter(c =>
        (c.raz_social || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.fantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.cnpj_cpf || '').includes(searchTerm) ||
        (c.cli_nomred || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleWhatsApp = (phone) => {
        if (!phone) return;
        const cleanPhone = phone.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanPhone}`, '_blank');
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in">
            {/* Tactical Header */}
            <div className="sticky top-0 bg-background/80 backdrop-blur-xl pt-2 pb-6 z-40 px-1 border-b border-white/5">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <p className="text-sage text-[10px] font-black uppercase tracking-[0.2em] mb-1 opacity-60">Strategic Asset</p>
                        <h1 className="text-2xl font-black text-white tracking-tight">Client Portfolio</h1>
                    </div>
                    <button className="w-12 h-12 bg-primary text-obsidian rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-90 transition-all">
                        <UserPlus size={22} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-sage h-5 w-5 transition-colors group-focus-within:text-primary" />
                        <input
                            type="text"
                            placeholder="Search corporate entity or tax ID..."
                            className="w-full bg-white/5 pl-12 pr-4 py-4 rounded-2xl border border-white/10 focus:border-primary/50 focus:bg-white/10 outline-none transition-all text-sm font-medium text-white placeholder:text-sage/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-sage hover:text-primary transition-colors">
                        <Filter size={22} />
                    </button>
                </div>
            </div>

            {/* List with Performance Indicators */}
            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(16,185,129,0.2)]"></div>
                    <p className="text-[10px] font-black text-sage uppercase tracking-[0.2em] animate-pulse">Syncing Portfolio...</p>
                </div>
            ) : error ? (
                <div className="p-10 text-center">
                    <p className="text-red-400 font-black uppercase tracking-widest text-[10px] mb-4">{error}</p>
                    <button onClick={loadClients} className="bg-primary text-obsidian px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Execute Reboot</button>
                </div>
            ) : (
                <div className="space-y-4 px-1">
                    {filteredClients.map((client, idx) => (
                        <div key={client.codigo} className="emerald-glass rounded-[2.5rem] overflow-hidden active:scale-[0.98] transition-all stagger-1" style={{ animationDelay: `${idx * 0.05}s` }}>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 flex items-center justify-center text-primary font-black text-xl shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                            {(client.fantasia || client.raz_social || 'C').substring(0, 1).toUpperCase()}
                                        </div>
                                        <div className="max-w-[180px]">
                                            <h3 className="font-black text-white text-[13px] leading-tight uppercase tracking-tight truncate">
                                                {client.fantasia || client.raz_social || client.cli_nomred}
                                            </h3>
                                            <div className="flex items-center gap-1 text-[9px] text-sage font-bold uppercase tracking-tighter mt-1">
                                                <MapPin size={10} className="text-primary opacity-60" />
                                                {client.cidade || 'N/A'} - {client.uf || '??'}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${client.bloqueado ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                            {client.bloqueado ? 'Inhibited' : 'Operational'}
                                        </span>
                                        <div className="text-[9px] font-black text-primary">+12.4% <span className="text-sage/40">YTD</span></div>
                                    </div>
                                </div>

                                {/* Buying Intensity Sparkline (Simulated tactical look) */}
                                <div className="mt-4 bg-white/5 rounded-xl p-3 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[8px] font-black text-sage uppercase tracking-widest">Buying Intensity</span>
                                        <span className="text-[10px] font-black text-white">84.2% <span className="text-primary text-[8px]">HEALTH</span></span>
                                    </div>
                                    <div className="flex items-end gap-1 h-8">
                                        {[40, 60, 45, 90, 65, 80, 100].map((h, i) => (
                                            <div key={i} className={`flex-1 rounded-sm transition-all duration-1000 ${i === 6 ? 'bg-primary' : 'bg-white/10'}`} style={{ height: `${h}%` }}></div>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-6">
                                    <div
                                        onClick={() => handleWhatsApp(client.celular || client.fone)}
                                        className="bg-primary/10 border border-primary/20 text-primary py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        <MessageCircle size={14} fill="currentColor" /> Signal
                                    </div>

                                    <div
                                        onClick={() => window.open(`tel:${client.fone?.replace(/\D/g, '')}`, '_self')}
                                        className="bg-white/5 border border-white/10 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        <Phone size={14} fill="currentColor" /> Direct Comms
                                    </div>
                                </div>
                            </div>

                            <div className="bg-black/20 p-4 px-6 flex justify-between items-center border-t border-white/5">
                                <span className="text-[9px] text-sage font-black uppercase tracking-widest">ID: <span className="text-white">{client.cnpj_cpf}</span></span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] text-primary font-black uppercase tracking-widest">Access Profile</span>
                                    <ChevronRight size={16} className="text-primary" />
                                </div>
                            </div>
                        </div>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="bg-white/5 rounded-[2rem] p-12 border border-dashed border-white/10 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center text-primary/20">
                                <Search size={40} />
                            </div>
                            <div>
                                <h4 className="font-black text-white text-lg uppercase tracking-tight">Zero Assets Found</h4>
                                <p className="text-[10px] text-sage font-bold uppercase tracking-widest mt-2">Adjust tactical parameters or check uplink.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileClients;
