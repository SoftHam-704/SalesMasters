// =====================================================
// 📅 PAINEL DE ALERTAS + AVATAR DO USUÁRIO
// Design Clean / Light Mode Compatible
// =====================================================

import React, { useState, useEffect } from 'react';
import {
    Bell, Calendar, AlertTriangle, Clock, ChevronDown,
    User, Settings, LogOut, Cake, CheckCircle2,
    Phone, MapPin, FileText, RefreshCw, X
} from 'lucide-react';
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

// Ícones por tipo de tarefa
const tipoIcons = {
    tarefa: <CheckCircle2 size={14} className="text-emerald-600" />,
    lembrete: <Bell size={14} className="text-amber-600" />,
    visita: <MapPin size={14} className="text-blue-600" />,
    ligacao: <Phone size={14} className="text-violet-600" />,
    reuniao: <User size={14} className="text-cyan-600" />,
    cobranca: <FileText size={14} className="text-rose-600" />,
    followup: <RefreshCw size={14} className="text-orange-600" />,
    aniversario: <Cake size={14} className="text-pink-600" />
};

const DashboardAlertPanel = ({ userName, userInitials, onLogout, onOpenAgenda }) => {
    const [resumo, setResumo] = useState({
        tarefas_hoje: 0,
        atrasadas: 0,
        proximo_compromisso: null,
        aniversarios_hoje: []
    });
    const [loading, setLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    useEffect(() => {
        fetchResumo();
        const interval = setInterval(fetchResumo, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchResumo = async () => {
        try {
            const userStr = sessionStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?.id || '1';
            const empresaId = user?.empresa_id || '1';

            const response = await fetch(getApiUrl(NODE_API_URL, '/api/agenda/resumo'), {
                headers: {
                    'x-user-id': userId,
                    'x-empresa-id': empresaId
                }
            });
            const data = await response.json();
            if (data.success) {
                setResumo(data.data);
            }
        } catch (error) {
            console.error('Erro ao carregar resumo da agenda:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatProximo = () => {
        if (!resumo.proximo_compromisso) return null;
        const { titulo, hora_inicio, tipo } = resumo.proximo_compromisso;
        const hora = hora_inicio ? hora_inicio.substring(0, 5) : 'Dia todo';
        return { titulo, hora, tipo };
    };

    const proximo = formatProximo();
    const totalAlertas = resumo.tarefas_hoje + resumo.atrasadas + resumo.aniversarios_hoje.length;

    return (
        <div className="flex items-center gap-4">
            {/* Painel de Alertas Clean */}
            <div className="relative">
                <button
                    onClick={() => setShowAlerts(!showAlerts)}
                    className="flex items-center gap-4 px-5 py-2.5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all group"
                >
                    {/* Contador de Tarefas Hoje */}
                    <div className="flex items-center gap-2">
                        <Calendar size={18} className="text-emerald-600" />
                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">
                            <span className="font-bold text-emerald-600 text-base">{resumo.tarefas_hoje}</span>
                            <span className="hidden sm:inline ml-1">hoje</span>
                        </span>
                    </div>

                    {/* Separador */}
                    <div className="w-px h-5 bg-slate-200"></div>

                    {/* Atrasadas */}
                    {resumo.atrasadas > 0 ? (
                        <>
                            <div className="flex items-center gap-2">
                                <AlertTriangle size={18} className="text-rose-500 animate-pulse" />
                                <span className="text-sm text-rose-600 font-bold">{resumo.atrasadas}</span>
                            </div>
                            <div className="w-px h-5 bg-slate-200"></div>
                        </>
                    ) : (
                        // Placeholder Empty Atrasadas to keep layout stable or just nothing
                        null
                    )}

                    {/* Próximo Compromisso */}
                    {proximo ? (
                        <div className="flex items-center gap-2 max-w-[180px] text-left">
                            <Clock size={16} className="text-amber-500 flex-shrink-0" />
                            <div className="truncate flex flex-col leading-none">
                                <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider mb-0.5">{proximo.hora}</span>
                                <span className="text-xs text-slate-600 truncate font-medium">{proximo.titulo}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-slate-400">
                            <CheckCircle2 size={16} />
                            <span className="text-xs font-medium">Livre</span>
                        </div>
                    )}

                    {/* Badge de Notificações */}
                    {totalAlertas > 0 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-[10px] font-bold text-white">{totalAlertas > 9 ? '9+' : totalAlertas}</span>
                        </div>
                    )}
                </button>

                {/* Dropdown de Alertas Clean */}
                {showAlerts && (
                    <div className="absolute right-0 top-full mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                <Bell size={16} className="text-emerald-600" />
                                Alertas de Hoje
                            </h3>
                            <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {/* Tarefas pendentes */}
                            {resumo.tarefas_hoje > 0 && (
                                <div className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onOpenAgenda}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Calendar size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800 font-bold">{resumo.tarefas_hoje} tarefa(s) para hoje</p>
                                            <p className="text-xs text-slate-500 group-hover:text-emerald-600 transition-colors">Clique para ver detalhes</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Atrasadas */}
                            {resumo.atrasadas > 0 && (
                                <div className="p-3 border-b border-slate-50 hover:bg-rose-50/30 transition-colors cursor-pointer group" onClick={onOpenAgenda}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <AlertTriangle size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-rose-700 font-bold">{resumo.atrasadas} tarefa(s) atrasada(s)</p>
                                            <p className="text-xs text-rose-500 font-medium">Atenção necessária!</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Próximo compromisso */}
                            {proximo && (
                                <div className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group" onClick={onOpenAgenda}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                                            {tipoIcons[proximo.tipo] || <Clock size={18} />}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-0.5">Hoje às {proximo.hora}</p>
                                            <p className="text-sm text-slate-700 font-medium truncate leading-tight">{proximo.titulo}</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Aniversários */}
                            {resumo.aniversarios_hoje.map((aniv, idx) => (
                                <div key={idx} className="p-3 border-b border-slate-50 hover:bg-pink-50/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                                            <Cake size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-800 font-bold">🎂 {aniv.con_nome}</p>
                                            <p className="text-xs text-slate-500">{aniv.empresa}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Sem alertas */}
                            {totalAlertas === 0 && (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                                        <CheckCircle2 size={24} className="text-emerald-500" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-600">Nenhum alerta pendente</p>
                                    <p className="text-xs text-slate-400">Você está em dia!</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                            <button
                                onClick={onOpenAgenda}
                                className="w-full py-2.5 text-xs font-bold text-emerald-700 hover:bg-white hover:shadow-sm rounded-lg transition-all uppercase tracking-wide border border-transparent hover:border-slate-200"
                            >
                                Ver Agenda Completa
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Avatar do Usuário */}
            <div className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 px-2 py-1.5 md:px-3 rounded-xl hover:bg-white/50 border border-transparent hover:border-slate-200 hover:shadow-sm transition-all group"
                >
                    {/* Avatar com iniciais */}
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-sm ring-2 ring-white">
                        <span className="text-sm font-extrabold text-white">{userInitials || 'US'}</span>
                    </div>

                    {/* Nome */}
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold text-slate-700 group-hover:text-slate-900 leading-tight">{userName || 'Usuário'}</p>
                        <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Online</p>
                    </div>

                    <ChevronDown size={14} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>

                {/* Dropdown do Usuário Clean */}
                {showUserMenu && (
                    <div className="absolute right-0 top-full mt-3 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                            <p className="text-sm font-black text-slate-800">{userName}</p>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">Representante Comercial</p>
                        </div>

                        <div className="p-1.5 space-y-0.5">
                            <button className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors">
                                <User size={16} className="text-slate-400" />
                                Meu Perfil
                            </button>
                            <button className="w-full px-3 py-2.5 text-left text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg flex items-center gap-3 transition-colors">
                                <Settings size={16} className="text-slate-400" />
                                Configurações
                            </button>
                        </div>

                        <div className="border-t border-slate-100 p-1.5">
                            <button
                                onClick={onLogout}
                                className="w-full px-3 py-2.5 text-left text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-3 transition-colors"
                            >
                                <LogOut size={16} />
                                Sair do Sistema
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Click outside to close */}
            {(showAlerts || showUserMenu) && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => { setShowAlerts(false); setShowUserMenu(false); }}
                />
            )}
        </div>
    );
};

export default DashboardAlertPanel;
