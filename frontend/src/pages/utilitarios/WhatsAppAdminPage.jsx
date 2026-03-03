import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquare,
    RefreshCcw,
    QrCode,
    ShieldCheck,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Wifi,
    WifiOff,
    ArrowLeft,
    ExternalLink,
    Smartphone,
    Bot,
    Info,
    Zap,
    Clock,
    Users,
    BarChart3,
    BrainCircuit
} from 'lucide-react';
import { toast } from 'sonner';
import { getApiUrl, NODE_API_URL } from '../../utils/apiConfig';
import { useTabs } from '../../contexts/TabContext';

const WhatsAppAdminPage = () => {
    const { closeTab } = useTabs();
    const [status, setStatus] = useState('CHECKING'); // CHECKING, DISCONNECTED, CONNECTED, QR_READY
    const [qrCode, setQrCode] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tenantInfo, setTenantInfo] = useState(null);

    // Identificar tenant atual
    useEffect(() => {
        const config = sessionStorage.getItem('tenantConfig');
        if (config) {
            try {
                const parsed = JSON.parse(config);
                setTenantInfo(parsed);
                checkConnection(parsed.cnpj.replace(/\D/g, ''));
            } catch (e) {
                console.error('Erro ao ler tenantConfig', e);
            }
        }
    }, []);

    const checkConnection = async (instance) => {
        setLoading(true);
        try {
            const apiUrl = getApiUrl(NODE_API_URL, `/api/wpp-service/connect/${instance}`);
            console.log('🔗 [WPP] Chamando API Radar:', apiUrl);
            const res = await fetch(apiUrl);
            const data = await res.json();

            if (data.success) {
                if (data.status === 'CONNECTED') {
                    setStatus('CONNECTED');
                    setQrCode(null);
                } else if (data.status === 'QR_CODE') {
                    setStatus('QR_READY');
                    setQrCode(data.qrcode);
                }
            } else {
                setStatus('DISCONNECTED');
            }
        } catch (err) {
            console.error('Erro ao checar conexão WhatsApp:', err);
            toast.error('Erro de conexão com o servidor de WhatsApp');
            setStatus('DISCONNECTED');
        } finally {
            setLoading(false);
        }
    };

    const handleReconnect = () => {
        if (tenantInfo) {
            checkConnection(tenantInfo.cnpj.replace(/\D/g, ''));
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#f8fafc] overflow-hidden font-sans relative">
            {/* Background Accents - Subtler */}
            <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] bg-emerald-400/5 blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-400/5 blur-[120px] rounded-full pointer-events-none"></div>

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl h-[85px] px-8 flex items-center justify-between shrink-0 shadow-[0_4px_20px_rgba(0,0,0,0.02)] relative z-20 border-b border-slate-100">
                <div className="flex items-center gap-6">
                    <motion.button
                        whileHover={{ scale: 1.05, backgroundColor: '#f1f5f9' }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => closeTab('/utilitarios/whatsapp-ia')}
                        className="bg-slate-50 text-slate-500 rounded-2xl h-11 w-11 flex items-center justify-center transition-all border border-slate-100"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div>
                        <h1 className="text-slate-900 text-2xl font-black tracking-tighter flex items-center gap-2">
                            WhatsApp <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Nexus IA</span>
                        </h1>
                        <p className="text-slate-400 text-[9px] font-black flex items-center gap-2 uppercase tracking-[0.3em] mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                            SoftHam Smart Automation
                        </p>
                    </div>
                </div>

                {tenantInfo && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-5 bg-emerald-50/50 border border-emerald-100 p-2 pr-5 rounded-[24px] backdrop-blur-md"
                    >
                        <div className="bg-white text-emerald-600 px-4 py-2.5 rounded-[20px] flex flex-col justify-center shadow-sm border border-emerald-100/50">
                            <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest leading-none mb-1">Empresa</p>
                            <p className="text-[11px] font-black tracking-tight truncate max-w-[150px]">
                                {tenantInfo.nome_fantasia || 'Instância Ativa'}
                            </p>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {status === 'CONNECTED' ? 'Ativo' : 'Pausado'}
                                </span>
                                <div className={`w-2 h-2 rounded-full ${status === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                            </div>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 tracking-tighter italic">{tenantInfo.cnpj}</p>
                        </div>
                    </motion.div>
                )}
            </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Status Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="lg:col-span-5 bg-white rounded-[45px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col items-center text-center relative overflow-hidden group"
                        >
                            <div className={`w-32 h-32 rounded-[40px] flex items-center justify-center mb-8 transition-all duration-700 ${status === 'CONNECTED'
                                ? 'bg-emerald-50 text-emerald-500 shadow-inner'
                                : 'bg-slate-50 text-slate-300 shadow-inner'
                                }`}>
                                {status === 'CONNECTED' ? <Wifi size={56} className="animate-pulse" /> : <WifiOff size={56} />}
                            </div>

                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-4 leading-none">
                                {status === 'CONNECTED' ? 'Conexão Estável' : 'WhatsApp Pendente'}
                            </h2>
                            <p className="text-slate-500 text-sm font-medium max-w-[280px] mb-10 leading-relaxed">
                                {status === 'CONNECTED'
                                    ? 'A inteligência artificial está operando seus canais de atendimento agora.'
                                    : 'Aponte a câmera para o código ao lado para sincronizar o cérebro da IA.'}
                            </p>

                            <div className="w-full space-y-4 mb-10">
                                <div className={`rounded-[28px] p-5 text-left flex items-start gap-4 border transition-all ${status === 'CONNECTED' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-amber-50/50 border-amber-100'
                                    }`}>
                                    <div className={`p-2.5 rounded-xl ${status === 'CONNECTED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                        {status === 'CONNECTED' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.1em] mb-1">
                                            {status === 'CONNECTED' ? 'Operação Segura' : 'Aguardando Sinc'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                            {status === 'CONNECTED'
                                                ? 'As regras Repset estão sendo aplicadas a cada interação.'
                                                : 'A IA requer um canal de saída ativo para responder.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02, boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleReconnect}
                                disabled={loading}
                                className="w-full h-16 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <RefreshCcw size={20} />}
                                {status === 'CONNECTED' ? 'Recarregar Painel' : 'Gerar Novo QrCode'}
                            </motion.button>
                        </motion.div>

                        {/* Scanner Area */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="lg:col-span-7 bg-white rounded-[45px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col relative overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-slate-50 text-emerald-500 rounded-2xl flex items-center justify-center border border-slate-100">
                                        <QrCode size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-[0.15em]">Pareamento Multi-Dispositivo</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest">Evolution v2</span>
                                            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Encriptação ponta-a-ponta</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col items-center justify-center min-h-[380px] bg-slate-50/80 rounded-[40px] border border-slate-100 relative group">
                                {status === 'CONNECTED' ? (
                                    <div className="text-center p-8">
                                        <motion.div
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="w-24 h-24 bg-emerald-500 text-white rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20"
                                        >
                                            <CheckCircle2 size={48} />
                                        </motion.div>
                                        <h4 className="text-2xl font-black text-slate-900 tracking-tight">Sincronizado!</h4>
                                        <p className="text-slate-400 text-sm font-bold mt-2">O canal de saída está pronto para disparos</p>
                                    </div>
                                ) : qrCode ? (
                                    <div className="relative p-10 bg-white rounded-[45px] shadow-2xl shadow-slate-200/50 border border-slate-100 group-hover:scale-[1.03] transition-transform duration-700">
                                        <img src={qrCode} alt="Scanner QR Code" className="w-[280px] h-[280px] object-contain" />
                                        {/* Scanner Line */}
                                        <div className="absolute left-8 right-8 top-8 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-[scan_4s_linear_infinite] opacity-40 z-10 pointer-events-none"></div>
                                    </div>
                                ) : (
                                    <div className="text-center p-12 opacity-60">
                                        <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-200/50">
                                            <Smartphone size={40} className="text-slate-200" />
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Canal em Standby</p>
                                        <p className="text-[10px] font-bold text-slate-300 mt-2 italic">Aguardando geração do token</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-between gap-4">
                                {[1, 2, 3].map((step) => (
                                    <div key={step} className="flex-1 flex gap-3 items-start p-4 bg-white rounded-[24px] border border-slate-50 shadow-sm transition-all hover:border-emerald-100">
                                        <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 border border-emerald-100/50">{step}</div>
                                        <span className="text-[10px] font-bold text-slate-500 leading-tight">
                                            {step === 1 && 'Abra o WhatsApp e toque em Menu'}
                                            {step === 2 && 'Selecione "Aparelhos Conectados"'}
                                            {step === 3 && 'Aponte a câmera para o QR Code'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>

                    {/* Features Detail Grid */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col gap-6 group hover:border-blue-200 transition-all">
                            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                <ShieldCheck size={28} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">Neural Guard</h4>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                                    Filtra e qualifica cada lead de acordo com as metas Bertolini.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col gap-6 group hover:border-emerald-200 transition-all">
                            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-500">
                                <Bot size={28} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">Deep Logic</h4>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                                    Respostas contextuais baseadas em dados históricos do Repseven.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white p-7 rounded-[40px] border border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] flex flex-col gap-6 group hover:border-teal-200 transition-all">
                            <div className="w-14 h-14 bg-teal-50 text-teal-500 rounded-2xl flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-500">
                                <Smartphone size={28} />
                            </div>
                            <div>
                                <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-2">Cloud Edge</h4>
                                <p className="text-[11px] font-bold text-slate-400 leading-relaxed italic">
                                    Motor Evolution ultra-veloz rodando em infra elástica Ubuntu.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Seção Explicativa - Sobre o Módulo */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-12 bg-white rounded-[45px] p-10 shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100 relative overflow-hidden"
                    >
                        {/* Accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-500"></div>

                        <div className="flex items-start gap-5 mb-8">
                            <div className="w-14 h-14 bg-gradient-to-br from-emerald-50 to-teal-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100/50">
                                <Info size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight mb-1">
                                    O que é o WhatsApp <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">Nexus IA</span>?
                                </h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                    O módulo de inteligência artificial integrado ao WhatsApp da sua empresa
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-50/80 rounded-[28px] p-7 mb-8 border border-slate-100">
                            <p className="text-[13px] text-slate-600 font-medium leading-[1.8]">
                                O <strong className="text-slate-800">WhatsApp Nexus IA</strong> é um módulo avançado que conecta o WhatsApp da sua empresa diretamente
                                ao cérebro de inteligência artificial do SalesMasters. Uma vez conectado através do QR Code acima, o sistema passa a
                                <strong className="text-emerald-600"> monitorar, interpretar e responder automaticamente</strong> as mensagens recebidas no WhatsApp,
                                utilizando o contexto do seu negócio — dados de clientes, histórico de pedidos, produtos e metas comerciais — para gerar
                                respostas inteligentes, precisas e personalizadas.
                            </p>
                            <p className="text-[13px] text-slate-600 font-medium leading-[1.8] mt-4">
                                O objetivo principal é <strong className="text-slate-800">eliminar o tempo de espera do cliente</strong> e garantir que cada lead receba
                                uma resposta qualificada em segundos, 24 horas por dia, 7 dias por semana — mesmo quando sua equipe comercial não estiver disponível.
                                Isso aumenta drasticamente a taxa de conversão e a satisfação do cliente.
                            </p>
                        </div>

                        {/* Grid de Benefícios */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-emerald-50/50 to-transparent rounded-[20px] border border-emerald-100/50">
                                <div className="p-2.5 bg-emerald-500 text-white rounded-xl shrink-0">
                                    <Clock size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Atendimento 24/7</h4>
                                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                        A IA nunca dorme. Responde instantaneamente a qualquer hora do dia ou da noite, finais de semana e feriados incluídos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-blue-50/50 to-transparent rounded-[20px] border border-blue-100/50">
                                <div className="p-2.5 bg-blue-500 text-white rounded-xl shrink-0">
                                    <BrainCircuit size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Qualificação Inteligente</h4>
                                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                        Cada mensagem é analisada em contexto. A IA identifica a intenção do cliente e direciona a conversa para a conversão.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-teal-50/50 to-transparent rounded-[20px] border border-teal-100/50">
                                <div className="p-2.5 bg-teal-500 text-white rounded-xl shrink-0">
                                    <BarChart3 size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Dados em Tempo Real</h4>
                                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                        A IA consulta o banco de dados do ERP para fornecer informações atualizadas sobre preços, estoque e status de pedidos.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-5 bg-gradient-to-br from-amber-50/50 to-transparent rounded-[20px] border border-amber-100/50">
                                <div className="p-2.5 bg-amber-500 text-white rounded-xl shrink-0">
                                    <Users size={18} />
                                </div>
                                <div>
                                    <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-1">Escalabilidade Total</h4>
                                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed">
                                        Atenda centenas de clientes simultaneamente sem precisar contratar mais atendentes. Sem fila, sem espera.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <Zap size={16} className="text-amber-500 shrink-0" />
                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                                <strong className="text-slate-500">Tecnologia:</strong> Este módulo utiliza a Evolution API v2 com encriptação ponta-a-ponta,
                                processamento via OpenAI GPT e infraestrutura cloud elástica para máxima performance e segurança dos dados.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
                
                @keyframes scan {
                    0% { top: 40px; }
                    50% { top: 320px; }
                    100% { top: 40px; }
                }
            `}} />
        </div>
    );
};

export default WhatsAppAdminPage;
