import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mail, X, Send, Paperclip, Loader2, Users, FileText, Activity, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import OrderPdfReport from './OrderPdfReport';
import { NODE_API_URL, getApiUrl } from '../../utils/apiConfig';

const SendEmailDialog = ({ isOpen, onClose, orderData, onSend }) => {
    const [loading, setLoading] = useState(false);
    const [companyData, setCompanyData] = useState(null);
    const [recipients, setRecipients] = useState({
        cliente: { enabled: true, email: '' },
        industria: { enabled: true, email: '' },
        escritorio: { enabled: false, email: '' }
    });

    const [emailData, setEmailData] = useState({
        assunto: '',
        anexos: '',
        texto: ''
    });

    const [logs, setLogs] = useState([]);
    const [smtpInfo, setSmtpInfo] = useState({ host: '...', user: '...' });

    const isQuotation = orderData?.order?.ped_situacao === 'C';

    // Fetch user parameters and company data on mount
    useEffect(() => {
        if (isOpen) {
            const fetchData = async () => {
                try {
                    // Fetch SMTP Params
                    const userId = localStorage.getItem('userId') || 1;
                    const responseParams = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${userId}`));
                    const dataParams = await responseParams.json();

                    if (dataParams.success && dataParams.data) {
                        setSmtpInfo({
                            host: dataParams.data.par_emailserver || '...',
                            user: dataParams.data.par_emailuser || '...'
                        });
                        setRecipients(prev => ({
                            ...prev,
                            escritorio: { ...prev.escritorio, email: dataParams.data.par_email || '' }
                        }));
                    }

                    // Fetch Company Data for PDF
                    const responseCompany = await fetch(getApiUrl(NODE_API_URL, '/api/config/company'));
                    const dataCompany = await responseCompany.json();
                    if (dataCompany.success) {
                        setCompanyData(dataCompany.data);
                    }

                } catch (error) {
                    console.error('Erro ao buscar dados iniciais:', error);
                }
            };
            fetchData();
        }
    }, [isOpen]);

    useEffect(() => {
        if (orderData && isOpen) {
            setLogs([]);
            const order = orderData.order;
            const isQuo = order?.ped_situacao === 'C';

            setRecipients(prev => ({
                ...prev,
                cliente: { ...prev.cliente, email: order?.cli_email || order?.cli_emailnfe || '' },
                industria: {
                    enabled: !isQuo,
                    email: isQuo ? '' : (order?.for_email || '')
                }
            }));

            const now = new Date();
            const dateStr = now.toLocaleDateString('pt-BR');
            const timeStr = now.toLocaleTimeString('pt-BR');
            const userName = localStorage.getItem('userName') || 'USUÁRIO';

            setEmailData({
                assunto: `Ref. pedido nº ${order?.ped_pedido} do cliente: ${order?.cli_nomred || order?.cli_nome}`,
                anexos: `Pedido_${order?.ped_pedido}_${order?.cli_nomred || 'CLIENTE'}.pdf`,
                texto: `Pedido nº...............: ${order?.ped_pedido}\n` +
                    `Data do lançamento......: ${dateStr}\n` +
                    `Cliente.................: ${order?.cli_nome}\n` +
                    `Cidade..................: ${order?.cli_cidade || ''} - ${order?.cli_uf || ''}\n\n` +
                    `Enviado por.............: ${userName} ${dateStr} ${timeStr}\n\n` +
                    `ATENÇÃO: Nossa numeração de pedido é unívoca, portanto caso receba mais de uma mensagem com o\n` +
                    `mesmo número de pedido, favor desconsiderar as repetições.\n\n` +
                    `Favor responder confirmando o recebimento desta mensagem, que obrigatoriamente deverá conter\n` +
                    `um pedido em anexo.`
            });
        }
    }, [orderData, isOpen]);

    const addLog = (msg) => {
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    const handleSend = async () => {
        if (!orderData) {
            toast.error("Dados do pedido não carregados.");
            return;
        }

        setLoading(true);
        setLogs([]);
        addLog("Iniciando processo de envio...");

        try {
            addLog("Gerando PDF em alta fidelidade...");
            const model = localStorage.getItem('printModel') || '1';

            // NEW: Generate PDF using the high-fidelity engine directly!
            // No more iframes or html2canvas hacks.
            const blob = await pdf(
                <OrderPdfReport
                    model={model}
                    order={orderData.order}
                    items={orderData.items}
                    companyData={companyData}
                />
            ).toBlob();

            addLog("PDF gerado com sucesso (vetorial).");

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64data = reader.result.split(',')[1];
                await sendEmail(base64data);
            };

        } catch (error) {
            console.error('Erro ao processar PDF:', error);
            addLog(`❌ Erro: ${error.message}`);
            toast.error(`Erro ao gerar PDF: ${error.message}`);
            setLoading(false);
        }
    };

    const sendEmail = async (pdfBase64) => {
        addLog("Conectando ao servidor SMTP...");
        const selectedRecipients = Object.entries(recipients)
            .filter(([_, v]) => v.enabled && v.email)
            .map(([_, v]) => v.email);

        if (selectedRecipients.length === 0) {
            throw new Error("Selecione ao menos um destinatário válido.");
        }

        const payload = {
            recipients: selectedRecipients,
            subject: emailData.assunto,
            text: emailData.texto,
            userId: localStorage.getItem('userId') || 1,
            attachments: [
                {
                    filename: emailData.anexos,
                    content: pdfBase64
                }
            ]
        };

        addLog("Enviando e-mail...");
        const response = await fetch(getApiUrl(NODE_API_URL, `/api/email/send-order`), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            addLog("✅ E-mail enviado com sucesso!");
            toast.success("E-mail enviado com sucesso!");
            setTimeout(() => onClose(), 1500);
        } else {
            throw new Error(result.message || "Falha ao enviar e-mail");
        }

        setLoading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-[32px] bg-[#f8fafc]">
                {/* Premium Header */}
                <DialogHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <DialogTitle className="flex items-center gap-4 text-white relative z-10">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner border border-white/20">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="font-bold text-2xl tracking-tight">Envio de Pedido</span>
                            <div className="flex items-center gap-2 mt-1">
                                <p className="text-blue-100/90 text-sm font-medium">Pedido #{orderData?.order?.ped_pedido}</p>
                                <span className="w-1 h-1 bg-blue-300 rounded-full opacity-50" />
                                <p className="text-blue-100/90 text-sm font-medium">{orderData?.order?.cli_nomred}</p>
                            </div>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex h-[550px]">
                    {/* Left Pane - Content */}
                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-8">
                            {/* Destinatários Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Destinatários</h3>
                                </div>

                                <div className="grid gap-3">
                                    {[
                                        { key: 'cliente', label: 'Cliente', icon: Users, color: 'blue' },
                                        { key: 'industria', label: 'Indústria', icon: Building2, color: 'indigo', disabled: isQuotation },
                                        { key: 'escritorio', label: 'Escritório', icon: Building2, color: 'emerald' }
                                    ].map((dest) => (
                                        <div key={dest.key} className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${recipients[dest.key].enabled ? 'bg-white border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                                            <div className="flex items-center gap-3 min-w-[120px]">
                                                <Checkbox
                                                    id={`check-${dest.key}`}
                                                    checked={recipients[dest.key].enabled}
                                                    disabled={dest.disabled}
                                                    onCheckedChange={(val) => setRecipients(p => ({ ...p, [dest.key]: { ...p[dest.key], enabled: val } }))}
                                                    className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                />
                                                <Label htmlFor={`check-${dest.key}`} className={`text-sm font-bold ${dest.disabled ? 'text-slate-400' : 'text-slate-700 cursor-pointer'}`}>
                                                    {dest.label}
                                                </Label>
                                            </div>
                                            <div className="flex-1 relative">
                                                <Input
                                                    value={recipients[dest.key].email}
                                                    disabled={dest.disabled || !recipients[dest.key].enabled}
                                                    onChange={(e) => setRecipients(p => ({ ...p, [dest.key]: { ...p[dest.key], email: e.target.value } }))}
                                                    className="h-10 bg-transparent border-0 border-b border-slate-100 rounded-none px-0 text-sm focus:ring-0 focus:border-blue-500 transition-all font-medium"
                                                    placeholder={`E-mail do ${dest.label.toLowerCase()}...`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Conteúdo Section */}
                            <section className="space-y-4">
                                <div className="flex items-center gap-2 text-slate-800">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Dados da Mensagem</h3>
                                </div>

                                <div className="space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm text-sm">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 ml-1">Assunto do e-mail</Label>
                                        <Input
                                            value={emailData.assunto}
                                            onChange={(e) => setEmailData(p => ({ ...p, assunto: e.target.value }))}
                                            className="h-11 border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-colors font-medium"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 ml-1">Anexo gerado (PDF)</Label>
                                        <div className="flex items-center gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Paperclip className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <span className="text-sm font-semibold text-blue-700">{emailData.anexos}</span>
                                            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                                                <CheckCircle2 className="w-3 h-3" />
                                                PRONTO
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-slate-500 ml-1">Mensagem personalizada</Label>
                                        <Textarea
                                            value={emailData.texto}
                                            onChange={(e) => setEmailData(p => ({ ...p, texto: e.target.value }))}
                                            className="min-h-[160px] border-slate-200 rounded-2xl bg-[#fafafa] focus:bg-white transition-colors font-mono text-[11px] leading-relaxed p-4"
                                        />
                                    </div>
                                </div>
                            </section>
                        </div>
                    </ScrollArea>

                    {/* Right Pane - Logs (Premium Glass Dark) */}
                    <div className="w-80 bg-[#0f172a] p-6 flex flex-col border-l border-slate-800">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-emerald-500/10 rounded-xl">
                                    <Activity className="w-4 h-4 text-emerald-400" />
                                </div>
                                <span className="text-sm font-bold text-white tracking-wide uppercase">Status</span>
                            </div>
                            {loading && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
                        </div>

                        <ScrollArea className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-4">
                            <div className="space-y-3">
                                {logs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                                        <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                                            <Send className="w-5 h-5 text-slate-700" />
                                        </div>
                                        <p className="text-xs text-slate-600 font-medium">Aguardando envio...</p>
                                    </div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="group flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full ${log.includes('✅') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : log.includes('❌') ? 'bg-rose-500' : 'bg-blue-500'}`} />
                                        <span className="text-[11px] font-mono text-slate-400 leading-tight group-hover:text-slate-200 transition-colors">
                                            {log}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="mt-6 pt-6 border-t border-slate-800 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">SMTP Server</span>
                                <span className="text-[11px] text-slate-300 font-mono truncate max-w-[140px]">{smtpInfo.host}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Gateway</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    <span className="text-[11px] text-slate-300 font-mono">ONLINE</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-100 flex items-center justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl px-6 h-12 font-bold transition-all"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-8 h-12 rounded-2xl font-bold shadow-xl shadow-blue-900/20 flex items-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                        <span>ENVIAR E-MAIL AGORA</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailDialog;
