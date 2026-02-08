import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Printer, Mail, FileSpreadsheet, X, MessageCircle, Info } from 'lucide-react';
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PrintOrderDialog = ({ isOpen, onClose, orderNumber, onPrint, onExportExcel, onSendEmail, defaultModel = 1, defaultSorting = 'digitacao', orderToPrintIndustryName, orderTotal }) => {
    const [sorting, setSorting] = useState(defaultSorting);
    const [selectedModel, setSelectedModel] = useState(defaultModel);

    // Update state when defaults change (e.g. when dialog opens and params are loaded)
    React.useEffect(() => {
        if (isOpen) {
            setSorting(defaultSorting);
            setSelectedModel(defaultModel);
        }
    }, [isOpen, defaultSorting, defaultModel]);

    // List of active models from Delphi validation
    const activeModels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

    const handlePrint = () => {
        onPrint(selectedModel, sorting);
    };

    const handleWhatsApp = () => {
        if (!orderNumber) return;
        const message = `Olá! Segue o pedido *${orderNumber}* da *${orderToPrintIndustryName || 'Nossa Indústria'}*.\n\n` +
            `Total: *${orderTotal || ''}*\n` +
            `Status: *Pendente*`;

        const encoded = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
        toast.info("WhatsApp aberto. Lembre-se de anexar o PDF baixado.");
    };

    const handleExportExcel = () => {
        if (onExportExcel) {
            onExportExcel(sorting);
        }
    };

    const handleSendEmail = () => {
        if (onSendEmail) {
            onSendEmail(sorting);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-white/20 dark:border-slate-800 shadow-2xl p-0 overflow-hidden rounded-[2rem]">
                <DialogHeader className="p-8 border-b border-slate-100 dark:border-slate-800 relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="space-y-1.5">
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
                                <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                                    <Printer className="w-6 h-6 text-emerald-600" />
                                </div>
                                Impressão de Pedido
                            </DialogTitle>
                            <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-black text-slate-500 uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    Pedido: <span className="text-emerald-600">{orderNumber}</span>
                                </span>
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Selecione o layout</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-10">
                    {/* Ordenação */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Ordenação dos Itens</span>
                            <div className="h-px w-full bg-gradient-to-r from-slate-100 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800" />
                        </div>

                        <RadioGroup
                            value={sorting}
                            onValueChange={setSorting}
                            className="flex justify-start gap-10 pl-2"
                        >
                            {[
                                { id: 'digitacao', label: 'Digitação' },
                                { id: 'codigo', label: 'Código' },
                                { id: 'alfabetica', label: 'Alfabética' }
                            ].map((opt) => (
                                <div key={opt.id} className="flex items-center space-x-3 cursor-pointer group">
                                    <RadioGroupItem value={opt.id} id={opt.id} className="text-emerald-500 border-slate-300 w-5 h-5" />
                                    <Label htmlFor={opt.id} className="cursor-pointer font-black text-[12px] uppercase tracking-wider text-slate-500 group-hover:text-emerald-600 transition-all">
                                        {opt.label}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>

                    {/* Modelos */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">Formatos Disponíveis</span>
                            <div className="h-px w-full bg-gradient-to-r from-slate-100 via-slate-100 to-transparent dark:from-slate-800 dark:via-slate-800" />
                        </div>

                        <div className="grid grid-cols-7 sm:grid-cols-10 gap-2.5">
                            {activeModels.map((m) => {
                                const isLandscape = m === 26 || m === 27;
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            setSelectedModel(m);
                                            onPrint(m, sorting);
                                        }}
                                        className={cn(
                                            "h-11 flex flex-col items-center justify-center rounded-xl border text-[13px] font-black transition-all duration-300 relative group/btn",
                                            selectedModel === m
                                                ? "bg-emerald-600 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105 z-10"
                                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 active:scale-95"
                                        )}
                                        title={`Imprimir no formato ${m}`}
                                    >
                                        {m}
                                        {(m === 26 || m === 27 || m === 22) && (
                                            <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-blue-500" title="Paisagem" />
                                        )}
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleExportExcel}
                                className="h-11 flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-95 group/excel"
                                title="Exportar para Excel"
                            >
                                <FileSpreadsheet className="w-5 h-5 group-hover/excel:scale-110 transition-transform" />
                            </button>
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-2">
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-100 dark:border-slate-800">
                                <Info className="w-3 h-3" />
                                Clique no número para abrir a pré-visualização
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50/80 dark:bg-slate-900/80 p-6 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-3 backdrop-blur-md">
                    <Button
                        variant="outline"
                        onClick={handleWhatsApp}
                        className="bg-[#25D366]/10 border-[#25D366]/20 text-[#25D366] hover:bg-[#25D366] hover:text-white rounded-xl font-black text-[11px] uppercase tracking-widest h-12 transition-all shadow-sm"
                    >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleSendEmail}
                        className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl font-black text-[11px] uppercase tracking-widest h-12 transition-all shadow-sm"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        E-mail
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 rounded-xl font-black text-[11px] uppercase tracking-widest h-12 col-span-2 sm:col-span-1"
                    >
                        <X className="w-4 h-4 mr-2" />
                        Fechar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PrintOrderDialog;
