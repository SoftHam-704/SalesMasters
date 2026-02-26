import React, { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

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
import { generateOrderExcelData } from '../../utils/exportOrderToExcel';

const SendEmailDialog = ({ isOpen, onClose, orderData, onSend }) => {
    const [loading, setLoading] = useState(false);
    const [companyData, setCompanyData] = useState(null);
    const [attachExcel, setAttachExcel] = useState(false);
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
                    const userJson = sessionStorage.getItem('user');
                    const userData = userJson ? JSON.parse(userJson) : null;
                    const userId = userData?.id || 1;

                    const responseParams = await fetch(getApiUrl(NODE_API_URL, `/api/parametros/${userId}`));
                    const dataParams = await responseParams.json();

                    if (dataParams.success && dataParams.data) {
                        setSmtpInfo({
                            host: dataParams.data.par_emailserver || '...',
                            user: dataParams.data.par_emailuser || dataParams.data.par_email || '...'
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

            const userJson = sessionStorage.getItem('user');
            const userData = userJson ? JSON.parse(userJson) : null;
            const userName = userData ? `${userData.nome} ${userData.sobrenome || ''}`.trim() : 'USUÁRIO';

            const clientOrderNum = order?.ped_pedcli || order?.ped_pedindu || order?.ped_pedindustria || '';

            setEmailData({
                assunto: `Ref. pedido nº ${order?.ped_pedido}${clientOrderNum ? ` (Cli: ${clientOrderNum})` : ''} do cliente: ${order?.cli_nomred || order?.cli_nome}`,
                anexos: `${order?.ped_pedido}-${order?.cli_nomred || 'CLIENTE'}.pdf`,
                texto: `Pedido nº...............: ${order?.ped_pedido}\n` +
                    (clientOrderNum ? `Ped. Cliente nº.........: ${clientOrderNum}\n` : '') +
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

            // 1. Generate PDF
            const pdfBlob = await pdf(
                <OrderPdfReport
                    model={model}
                    order={orderData.order}
                    items={orderData.items}
                    companyData={companyData}
                />
            ).toBlob();
            addLog("PDF gerado com sucesso.");

            // 2. Prepare Attachments Array
            const finalAttachments = [];

            // Add PDF to attachments
            const pdfBase64 = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(',')[1]);
                reader.readAsDataURL(pdfBlob);
            });
            finalAttachments.push({
                filename: emailData.anexos,
                content: pdfBase64,
                contentType: 'application/pdf'
            });

            // 3. Conditional Excel Generation
            if (attachExcel) {
                addLog("Gerando Excel complementar...");
                const excelBuffer = await generateOrderExcelData(orderData.order, orderData.items);
                const excelBase64 = btoa(
                    new Uint8Array(excelBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
                );
                finalAttachments.push({
                    filename: `Pedido_${orderData.order.ped_pedido}.xlsx`,
                    content: excelBase64,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                });
                addLog("Excel incluído nos anexos.");
            }

            await sendEmail(finalAttachments);

        } catch (error) {
            console.error('Erro ao processar anexos:', error);
            addLog(`❌ Erro: ${error.message}`);
            toast.error(`Erro ao preparar envio: ${error.message}`);
            setLoading(false);
        }
    };

    const sendEmail = async (attachments) => {
        addLog("Conectando ao servidor SMTP...");
        try {
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
                userId: JSON.parse(sessionStorage.getItem('user'))?.id || 1,
                attachments: attachments
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
        } catch (error) {
            console.error('Erro no envio de e-mail:', error);
            addLog(`❌ Erro: ${error.message}`);
            toast.error(`Erro ao enviar: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-[32px] bg-[#f8fafc]">
                {/* Premium Header */}
                <DialogHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
                    <DialogTitle className="flex items-center gap-4 text-white relative z-10">
                        <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner border border-white/20">
                            <Mail className="w-5 h-5" />
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

                <div className="flex h-[620px]">
                    {/* Left Pane - Content */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-white">
                        <div className="p-6 flex-1 flex flex-col gap-6 overflow-hidden">
                            {/* Destinatários Row */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Destinatários</h3>
                                </div>
                                <div className="flex flex-col gap-2.5">
                                    {[
                                        { key: 'cliente', label: 'Cliente', icon: Users, color: 'blue' },
                                        { key: 'industria', label: 'Indústria', icon: Building2, color: 'indigo', disabled: isQuotation },
                                        { key: 'escritorio', label: 'Escritório', icon: Building2, color: 'emerald' }
                                    ].map((dest) => (
                                        <div key={dest.key} className={cn(
                                            "flex items-center gap-4 px-4 py-2.5 rounded-xl border transition-all duration-200",
                                            recipients[dest.key].enabled
                                                ? "bg-blue-50/50 border-blue-200 shadow-sm ring-1 ring-blue-100/50"
                                                : "bg-white border-slate-200 hover:border-blue-300"
                                        )}>
                                            <Checkbox
                                                id={`check-${dest.key}`}
                                                checked={recipients[dest.key].enabled}
                                                disabled={dest.disabled}
                                                onCheckedChange={(val) => setRecipients(p => ({ ...p, [dest.key]: { ...p[dest.key], enabled: val } }))}
                                                className="w-5 h-5 rounded-md border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                            />
                                            <Label
                                                htmlFor={`check-${dest.key}`}
                                                className={cn(
                                                    "text-sm font-bold min-w-[80px] transition-colors",
                                                    recipients[dest.key].enabled ? "text-blue-900" : "text-slate-500"
                                                )}
                                            >
                                                {dest.label}:
                                            </Label>
                                            <Input
                                                value={recipients[dest.key].email}
                                                disabled={dest.disabled || !recipients[dest.key].enabled}
                                                onChange={(e) => setRecipients(p => ({ ...p, [dest.key]: { ...p[dest.key], email: e.target.value } }))}
                                                className={cn(
                                                    "h-8 bg-transparent border-0 border-b border-slate-100 rounded-none px-0 text-sm font-medium focus:ring-0 focus:border-blue-500 flex-1 transition-all",
                                                    recipients[dest.key].enabled ? "text-blue-700" : "text-slate-400"
                                                )}
                                                placeholder={`E-mail não configurado...`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Subject and Attachments Row */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Assunto do e-mail</Label>
                                    <Input
                                        value={emailData.assunto}
                                        onChange={(e) => setEmailData(p => ({ ...p, assunto: e.target.value }))}
                                        className="h-10 border-slate-200 rounded-xl bg-slate-50/50 text-sm font-medium focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Anexos de Envio</Label>
                                    <div className="flex gap-3">
                                        <div className="flex-1 h-10 flex items-center justify-center gap-2 px-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-700">
                                            <CheckCircle2 className="w-4 h-4" /> PDF Pronto
                                        </div>
                                        <div
                                            onClick={() => setAttachExcel(!attachExcel)}
                                            className={cn(
                                                "flex-1 h-10 flex items-center justify-center gap-2 px-3 border rounded-xl text-xs font-bold cursor-pointer transition-all",
                                                attachExcel ? "bg-blue-600 border-blue-700 text-white shadow-lg active:scale-95" : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                                            )}
                                        >
                                            <Paperclip className="w-4 h-4" /> {attachExcel ? "+ EXCEL ADD" : "ADD EXCEL?"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Custom Message Area */}
                            <div className="flex-1 flex flex-col min-h-0 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
                                <div className="px-5 py-3 bg-slate-100/50 border-b border-slate-200 flex items-center justify-between">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">Corpo do E-mail</Label>
                                    <FileText className="w-4 h-4 text-slate-400" />
                                </div>
                                <Textarea
                                    value={emailData.texto}
                                    onChange={(e) => setEmailData(p => ({ ...p, texto: e.target.value }))}
                                    className="flex-1 resize-none border-0 rounded-none bg-transparent font-mono text-xs leading-relaxed p-5 focus:ring-0 text-slate-700"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Pane - Logs (Premium Glass Dark) */}
                    <div className="w-80 bg-[#0f172a] p-8 flex flex-col border-l border-slate-800">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                    <Activity className="w-5 h-5 text-blue-400" />
                                </div>
                                <span className="text-xs font-bold text-white tracking-widest uppercase">Monitor</span>
                            </div>
                            {loading && <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />}
                        </div>

                        <ScrollArea className="flex-1 bg-black/20 rounded-2xl border border-white/5 p-5">
                            <div className="space-y-4">
                                {logs.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                                        <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                                            <Send className="w-6 h-6 text-slate-700" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">Aguardando comando...</p>
                                    </div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="group flex items-start gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${log.includes('✅') ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : log.includes('❌') ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`} />
                                        <span className="text-[11px] font-mono text-slate-300 leading-tight group-hover:text-white transition-colors">
                                            {log}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="mt-8 pt-8 border-t border-white/10 space-y-5">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Servidor SMTP</span>
                                    <div className="flex items-center gap-2">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full",
                                            smtpInfo.host !== '...' ? "bg-emerald-500" : "bg-rose-500"
                                        )} />
                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
                                            {smtpInfo.host !== '...' ? 'Configurado' : 'Pendente'}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                    <span className="text-xs text-blue-50 font-mono font-bold break-all block">
                                        {smtpInfo.host}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">E-mail de Envio</span>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                                    <span className="text-xs text-blue-50 font-mono font-bold break-all block">
                                        {smtpInfo.user}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-6">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl px-8 h-12 font-bold transition-all text-sm"
                    >
                        CANCELAR
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-10 h-12 rounded-2xl font-bold shadow-xl shadow-blue-900/20 flex items-center gap-3 active:scale-95 transition-all text-sm"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5 text-white" />
                        )}
                        <span className="text-white">ENVIAR E-MAIL AGORA</span>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailDialog;
