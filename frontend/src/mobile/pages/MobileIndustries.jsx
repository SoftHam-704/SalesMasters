import React, { useState, useEffect } from 'react';
import { Factory, Phone, Mail, Globe, Search, ChevronRight, FileText, ExternalLink } from 'lucide-react';
import { getApiUrl, NODE_API_URL } from '@/utils/apiConfig';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const MobileIndustries = () => {
    const navigate = useNavigate();
    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadIndustries();
    }, []);

    const loadIndustries = async () => {
        try {
            // O interceptor já injeta os headers necessários
            const response = await axios.get(getApiUrl(NODE_API_URL, '/api/industrias'));
            setIndustries(response.data);
        } catch (error) {
            console.error("Erro ao carregar indústrias:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = industries.filter(i =>
        i.for_nomered?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.for_nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-24">
            {/* VIBRANT STICKY HEADER */}
            <div className="sticky top-0 bg-gray-50/80 backdrop-blur-md pt-2 pb-4 z-40 px-1 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Representadas</h1>
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100 text-blue-600">
                        <Factory size={20} />
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Pesquisar indústria..."
                        className="w-full bg-white pl-12 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all text-sm font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapeando Indústrias...</p>
                </div>
            ) : (
                <div className="grid gap-4 px-1">
                    {filtered.map(ind => (
                        <div key={ind.for_id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/30 overflow-hidden group">
                            <div className="p-6">
                                <div className="flex items-center gap-5 mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">
                                        {ind.for_nomered?.substring(0, 1)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-slate-800 text-base uppercase leading-tight tracking-tight">{ind.for_nomered}</h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 line-clamp-1">{ind.for_nome}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                                        <ChevronRight size={20} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => window.open(`tel:${ind.for_fone?.replace(/\D/g, '')}`, '_self')}
                                        className="flex items-center justify-center gap-2 p-4 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 active:bg-slate-100 transition-colors"
                                    >
                                        <Phone size={14} className="text-blue-500" /> Ligar
                                    </button>
                                    <button
                                        onClick={() => window.open(`mailto:${ind.for_email}`, '_blank')}
                                        className="flex items-center justify-center gap-2 p-4 bg-slate-50 text-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 active:bg-slate-100 transition-colors"
                                    >
                                        <Mail size={14} className="text-blue-600" /> E-mail
                                    </button>
                                </div>

                                <button
                                    onClick={() => navigate('/pedidos/historico', { state: { industryId: ind.for_codigo } })}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-slate-200 active:scale-95 transition-all"
                                >
                                    <FileText size={16} className="text-blue-400" /> Ver Pedidos Enviados
                                </button>
                            </div>

                            <div className="bg-slate-50/50 p-4 px-6 flex justify-between items-center border-t border-slate-100">
                                <span className="text-[9px] text-slate-400 font-black uppercase">Código Master: <span className="text-slate-600">{ind.for_codigo}</span></span>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <span className="text-[9px] text-emerald-600 font-black uppercase">Ativo</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                                <Factory size={40} />
                            </div>
                            <p className="font-bold text-slate-400">Nenhuma indústria encontrada.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MobileIndustries;
