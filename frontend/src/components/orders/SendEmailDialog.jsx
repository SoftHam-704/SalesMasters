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
import { Mail, X, Send, Paperclip, Loader2, Users, FileText, Activity } from 'lucide-react';
import { toast } from 'sonner';

const SendEmailDialog = ({ isOpen, onClose, orderData, onSend }) => {
    const [loading, setLoading] = useState(false);
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

    // Fetch user parameters on mount
    useEffect(() => {
        if (isOpen) {
            const fetchParams = async () => {
                try {
                    const userId = 1; // TODO: Get from auth context
                    const response = await fetch(`http://localhost:3005/api/parametros/${userId}`);
                    const data = await response.json();
                    if (data.success && data.data) {
                        setSmtpInfo({
                            host: data.data.par_emailserver || '...',
                            user: data.data.par_emailuser || '...'
                        });
                        setRecipients(prev => ({
                            ...prev,
                            escritorio: { ...prev.escritorio, email: data.data.par_email || '' }
                        }));
                    }
                } catch (error) {
                    console.error('Erro ao buscar parâmetros SMTP:', error);
                }
            };
            fetchParams();
        }
    }, [isOpen]);

    useEffect(() => {
        if (orderData && isOpen) {
            // Clear logs when dialog opens with new order
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
                anexos: `Pedido_${order?.ped_pedido}_${order?.cli_nomred}.pdf`,
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
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            addLog("Carregando formato de impressão...");

            const order = orderData.order;
            const industria = order.ped_industria;
            const pedido = order.ped_pedido;

            // Get model from localStorage or default to 1
            const model = localStorage.getItem('printModel') || '1';
            const sortBy = localStorage.getItem('printSortBy') || 'digitacao';

            // Create hidden iframe to render OrderReportEngine at 100% zoom for crisp capture
            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'position: absolute; left: -9999px; top: -9999px; width: 794px; height: 1123px; border: none;';
            document.body.appendChild(iframe);

            const printUrl = `/print/order/${pedido}?model=${model}&sortBy=${sortBy}&industria=${industria}`;
            addLog(`Renderizando formato ${model}...`);

            // Wait for iframe to load
            await new Promise((resolve, reject) => {
                iframe.onload = resolve;
                iframe.onerror = reject;
                iframe.src = printUrl;
            });

            // Give it extra time to render
            await new Promise(resolve => setTimeout(resolve, 2000));
            addLog("Capturando páginas...");

            // Access the iframe document
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

            // Force remove any transform scale on wrappers for crisp capture
            const styleOverride = iframeDoc.createElement('style');
            styleOverride.textContent = `
                * { transform: none !important; }
                .print-container { transform: none !important; }
                body > div { transform: none !important; }
            `;
            iframeDoc.head.appendChild(styleOverride);

            // Give it a moment to apply the CSS
            await new Promise(resolve => setTimeout(resolve, 500));

            const printPages = iframeDoc.querySelectorAll('.print-container');

            if (printPages.length === 0) {
                addLog("⚠️ Usando fallback - formato simplificado...");
                document.body.removeChild(iframe);

                // Fallback to simple PDF if no print pages found
                const doc = new jsPDF();
                const items = orderData.items;

                doc.setFontSize(18);
                doc.text(`Pedido: ${order.ped_pedido}`, 10, 20);
                doc.setFontSize(10);
                doc.text(`Data: ${new Date(order.ped_data).toLocaleDateString()}`, 10, 30);
                doc.text(`Cliente: ${order.cli_nome}`, 10, 40);
                doc.text(`Indústria: ${order.for_nomered}`, 10, 50);

                let y = 70;
                doc.setFont("helvetica", "bold");
                doc.text("Qtd", 10, y);
                doc.text("Produto", 30, y);
                doc.text("V. Unit", 130, y);
                doc.text("Total", 170, y);
                doc.line(10, y + 2, 200, y + 2);

                doc.setFont("helvetica", "normal");
                items.forEach((item) => {
                    y += 10;
                    if (y > 280) { doc.addPage(); y = 20; }
                    doc.text(String(item.ite_quant || 0), 10, y);
                    doc.text(item.ite_nomeprod || 'Produto', 30, y, { maxWidth: 90 });
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ite_puniliq || 0), 130, y);
                    doc.text(new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.ite_totliquido || 0), 170, y);
                });

                y += 15;
                doc.line(10, y - 5, 200, y - 5);
                doc.setFont("helvetica", "bold");
                doc.text(`TOTAL LÍQUIDO: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.ped_totliq || 0)}`, 140, y);

                addLog("PDF (fallback) gerado com sucesso.");
                const pdfBase64 = doc.output('datauristring').split(',')[1];

                await sendEmail(pdfBase64);
                return;
            }

            addLog(`Capturando ${printPages.length} página(s)...`);

            // A4 dimensions in mm
            const pdfWidth = 210;
            const pdfHeight = 297;

            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

            for (let i = 0; i < printPages.length; i++) {
                const page = printPages[i];

                // Capture the page with html2canvas at high resolution for crisp PDF
                const canvas = await html2canvas(page, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#ffffff',
                    windowWidth: 794,
                    windowHeight: 1123
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                // Calculate dimensions to fit A4
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;
                const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
                const finalWidth = imgWidth * ratio;
                const finalHeight = imgHeight * ratio;

                if (i > 0) {
                    doc.addPage();
                }

                doc.addImage(imgData, 'JPEG', 0, 0, finalWidth, finalHeight);
                addLog(`Página ${i + 1} capturada.`);
            }

            // Clean up iframe
            document.body.removeChild(iframe);

            addLog("PDF gerado com sucesso.");
            const pdfBase64 = doc.output('datauristring').split(',')[1];

            await sendEmail(pdfBase64);

        } catch (error) {
            console.error('Erro ao enviar email:', error);
            addLog(`❌ Erro: ${error.message}`);
            toast.error(`Erro ao enviar: ${error.message}`);
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
            userId: 1,
            attachments: [
                {
                    filename: emailData.anexos,
                    content: pdfBase64
                }
            ]
        };

        addLog("Enviando e-mail...");
        const response = await fetch(`http://localhost:3005/api/email/send-order`, {
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
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-gradient-to-br from-slate-50 to-slate-100">
                {/* Premium Header */}
                <DialogHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-60" />
                    <DialogTitle className="flex items-center gap-3 text-white relative z-10">
                        <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                            <Mail className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="font-bold text-lg">Envio de Pedidos por E-mail</span>
                            <p className="text-blue-100 text-xs font-medium mt-0.5">Pedido #{orderData?.order?.ped_pedido}</p>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex">
                    {/* Main Form */}
                    <div className="flex-1 p-6 space-y-6">
                        {/* Recipients Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Users className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Destinatários</span>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-sm">
                                {/* Cliente */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2.5 w-28">
                                        <Checkbox
                                            id="check-cliente"
                                            checked={recipients.cliente.enabled}
                                            onCheckedChange={(val) => setRecipients(p => ({ ...p, cliente: { ...p.cliente, enabled: val } }))}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label htmlFor="check-cliente" className="text-sm font-semibold text-slate-700">Cliente</Label>
                                    </div>
                                    <Input
                                        value={recipients.cliente.email}
                                        onChange={(e) => setRecipients(p => ({ ...p, cliente: { ...p.cliente, email: e.target.value } }))}
                                        className="h-9 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl"
                                        placeholder="email@cliente.com"
                                    />
                                </div>

                                {/* Indústria */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2.5 w-28">
                                        <Checkbox
                                            id="check-industria"
                                            checked={recipients.industria.enabled}
                                            disabled={isQuotation}
                                            onCheckedChange={(val) => setRecipients(p => ({ ...p, industria: { ...p.industria, enabled: val } }))}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label htmlFor="check-industria" className={`text-sm font-semibold ${isQuotation ? 'text-slate-400' : 'text-slate-700'}`}>Indústria</Label>
                                    </div>
                                    <Input
                                        value={recipients.industria.email}
                                        disabled={isQuotation}
                                        onChange={(e) => setRecipients(p => ({ ...p, industria: { ...p.industria, email: e.target.value } }))}
                                        className="h-9 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl disabled:bg-slate-50"
                                        placeholder="email@industria.com"
                                    />
                                </div>

                                {/* Escritório */}
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2.5 w-28">
                                        <Checkbox
                                            id="check-escritorio"
                                            checked={recipients.escritorio.enabled}
                                            onCheckedChange={(val) => setRecipients(p => ({ ...p, escritorio: { ...p.escritorio, enabled: val } }))}
                                            className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                                        />
                                        <Label htmlFor="check-escritorio" className="text-sm font-semibold text-slate-700">Escritório</Label>
                                    </div>
                                    <Input
                                        value={recipients.escritorio.email}
                                        onChange={(e) => setRecipients(p => ({ ...p, escritorio: { ...p.escritorio, email: e.target.value } }))}
                                        className="h-9 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl"
                                        placeholder="email@escritorio.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Email Data Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                </div>
                                <span className="text-sm font-bold text-slate-700">Conteúdo do E-mail</span>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-[80px_1fr] items-center gap-3">
                                    <Label className="text-sm font-semibold text-slate-600 text-right">Assunto:</Label>
                                    <Input
                                        value={emailData.assunto}
                                        onChange={(e) => setEmailData(p => ({ ...p, assunto: e.target.value }))}
                                        className="h-9 text-sm border-slate-200 focus:border-blue-400 focus:ring-blue-100 rounded-xl"
                                    />
                                </div>

                                <div className="grid grid-cols-[80px_1fr] items-start gap-3">
                                    <Label className="text-sm font-semibold text-slate-600 text-right pt-2.5">Anexos:</Label>
                                    <div className="bg-slate-100 border border-slate-200 rounded-xl p-3">
                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                            <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                                            {emailData.anexos}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[80px_1fr] items-start gap-3">
                                    <Label className="text-sm font-semibold text-slate-600 text-right pt-2.5">Mensagem:</Label>
                                    <Textarea
                                        value={emailData.texto}
                                        onChange={(e) => setEmailData(p => ({ ...p, texto: e.target.value }))}
                                        className="min-h-[140px] text-xs font-mono bg-amber-50 border-amber-200 focus:border-amber-400 focus:ring-amber-100 rounded-xl resize-none leading-relaxed"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Process Section (Premium Side Panel) */}
                    <div className="w-72 bg-slate-900 p-5 space-y-4 flex flex-col text-white rounded-br-3xl">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-white/10 rounded-lg">
                                <Activity className="w-4 h-4 text-emerald-400" />
                            </div>
                            <span className="text-sm font-bold">Log de Processo</span>
                        </div>

                        <ScrollArea className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 min-h-[200px]">
                            <div className="space-y-2">
                                {logs.length === 0 && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600 animate-pulse" />
                                        Aguardando comando...
                                    </div>
                                )}
                                {logs.map((log, i) => (
                                    <div key={i} className="text-[11px] font-mono text-slate-300 flex items-start gap-2">
                                        <span className="text-emerald-400">▸</span>
                                        <span>{log}</span>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="space-y-2 pt-2 border-t border-slate-700/50">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Servidor SMTP:</span>
                                <span className="text-slate-300 font-medium">{smtpInfo.host}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Usuário:</span>
                                <span className="text-slate-300 font-medium truncate ml-2 max-w-[140px]" title={smtpInfo.user}>{smtpInfo.user}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-white/80 backdrop-blur-sm p-5 border-t border-slate-200 gap-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-300 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200 rounded-xl px-5"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={loading}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[140px] shadow-lg shadow-blue-500/20 transition-all duration-200 rounded-xl px-6"
                    >
                        {loading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4 mr-2" />
                        )}
                        Enviar E-mail
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SendEmailDialog;
