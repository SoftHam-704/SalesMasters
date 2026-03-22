import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Send, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';

const IrisActivationModal = ({ open, onOpenChange, client }) => {
    const [loading, setLoading] = useState(false);
    const [tokenData, setTokenData] = useState(null);
    const [copied, setCopied] = useState(false);

    const generateToken = async () => {
        setLoading(true);
        try {
            const url = getApiUrl(NODE_API_URL, '/api/suppliers/admin/generate-token');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-tenant-cnpj': localStorage.getItem('tenant_cnpj') || '' // CNPJ do representante
                },
                body: JSON.stringify({
                    cli_codigo: client.codigo,
                    industrias: [] // Futuramente permitir selecionar
                })
            });

            const result = await response.json();
            if (result.success) {
                // Montar link completo (domínio atual + path)
                const fullLink = `${window.location.origin}${result.link}`;
                setTokenData({ ...result, fullLink });
                toast.success("Acesso Iris gerado com sucesso!");
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Erro ao conectar com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!tokenData) return;
        navigator.clipboard.writeText(tokenData.fullLink);
        setCopied(true);
        toast.info("Link copiado!");
        setTimeout(() => setCopied(false), 2000);
    };

    const sendWhatsApp = () => {
        if (!tokenData) return;
        const msg = encodeURIComponent(`Olá! Aqui está seu acesso exclusivo à Iris, sua nova assistente de voz para pedidos: ${tokenData.fullLink}`);
        const phone = client._original?.cli_fone || '';
        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${msg}`, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-slate-900 text-white border-emerald-500/20 shadow-2xl">
                <DialogHeader>
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                        <Sparkles className="text-emerald-400 w-6 h-6 animate-pulse" />
                    </div>
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        Ativar Iris para {client?.nomered}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Gere um link de acesso exclusivo para que seu cliente possa realizar pedidos e cotações por voz.
                    </DialogDescription>
                </DialogHeader>

                {!tokenData ? (
                    <div className="py-6 flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-slate-500 italic">
                            O cliente terá acesso ao catálogo de produtos e poderá montar o carrinho conversando com a IA.
                        </p>
                        <Button 
                            onClick={generateToken} 
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full py-6 rounded-xl shadow-lg shadow-emerald-500/10"
                        >
                            {loading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2 w-4 h-4" />}
                            Gerar Link de Acesso Premium
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-slate-950 rounded-xl border border-white/5 space-y-2">
                            <label className="text-[10px] uppercase font-bold text-emerald-400">Link Iris Gerado</label>
                            <div className="flex gap-2">
                                <Input 
                                    readOnly 
                                    value={tokenData.fullLink} 
                                    className="bg-transparent border-white/10 text-xs font-mono h-10 ring-0 focus-visible:ring-0"
                                />
                                <Button onClick={copyToClipboard} size="icon" variant="ghost" className="hover:bg-white/5">
                                    {copied ? <Check className="text-emerald-400 w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                            <Button 
                                onClick={sendWhatsApp} 
                                className="bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-12 rounded-xl flex items-center gap-2"
                            >
                                <Send className="w-4 h-4" />
                                Enviar via WhatsApp
                            </Button>
                        </div>
                    </div>
                )}
                
                <DialogFooter className="sm:justify-start">
                    <p className="text-[10px] text-slate-500 text-center w-full">
                        Powered by Iris Intelligent Ordering • SalesMasters AI
                    </p>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default IrisActivationModal;
