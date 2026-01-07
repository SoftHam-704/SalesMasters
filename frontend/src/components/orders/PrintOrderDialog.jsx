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
import { Printer, Mail, FileSpreadsheet, X } from 'lucide-react';
import { cn } from "@/lib/utils";

const PrintOrderDialog = ({ isOpen, onClose, orderNumber, onPrint, onExportExcel, onSendEmail, defaultModel = 1, defaultSorting = 'digitacao' }) => {
    const [sorting, setSorting] = useState(defaultSorting);
    const [selectedModel, setSelectedModel] = useState(defaultModel);

    // Update state when defaults change (e.g. when dialog opens and params are loaded)
    React.useEffect(() => {
        if (isOpen) {
            setSorting(defaultSorting);
            setSelectedModel(defaultModel);
        }
    }, [isOpen, defaultSorting, defaultModel]);

    const models = Array.from({ length: 28 }, (_, i) => i + 1);
    const disabledModels = [8, 9, 18, 19, 22, 23]; // Restoring disabled status for redundant/duplicate models

    const handlePrint = () => {
        onPrint(selectedModel, sorting);
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
            <DialogContent className="max-w-2xl bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Printer className="w-5 h-5 text-emerald-500" />
                                Impressão de Pedido
                            </DialogTitle>
                            <p className="text-sm text-slate-500 font-medium">
                                Pedido: <span className="text-emerald-600 font-bold">{orderNumber}</span>
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8">
                    {/* Ordenação */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            Ordenação dos Itens
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>

                        <RadioGroup
                            value={sorting}
                            onValueChange={setSorting}
                            className="flex justify-center gap-8"
                        >
                            <div className="flex items-center space-x-2 cursor-pointer group">
                                <RadioGroupItem value="digitacao" id="digitacao" className="text-emerald-500 border-slate-300" />
                                <Label htmlFor="digitacao" className="cursor-pointer font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Digitação
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 cursor-pointer group">
                                <RadioGroupItem value="codigo" id="codigo" className="text-emerald-500 border-slate-300" />
                                <Label htmlFor="codigo" className="cursor-pointer font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Código
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2 cursor-pointer group">
                                <RadioGroupItem value="alfabetica" id="alfabetica" className="text-emerald-500 border-slate-300" />
                                <Label htmlFor="alfabetica" className="cursor-pointer font-semibold text-slate-600 dark:text-slate-400 group-hover:text-emerald-500 transition-colors">
                                    Alfabética
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Modelos */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                            Formatos de Impressão
                            <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                        </div>

                        <div className="grid grid-cols-10 gap-2">
                            {models.map((m) => {
                                const isDisabled = disabledModels.includes(m);
                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            if (!isDisabled) {
                                                setSelectedModel(m);
                                                // Directly open print preview with this format
                                                onPrint(m, sorting);
                                            }
                                        }}
                                        disabled={isDisabled}
                                        className={cn(
                                            "h-10 flex items-center justify-center rounded-md border text-sm font-bold transition-all duration-200",
                                            isDisabled
                                                ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                                                : selectedModel === m
                                                    ? "bg-emerald-500 border-emerald-600 text-white shadow-lg scale-110 z-10"
                                                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-emerald-500 hover:text-emerald-500"
                                        )}
                                        title={`Imprimir no formato ${m}`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                            <button
                                onClick={handleExportExcel}
                                className="h-10 flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition-colors"
                                title="Exportar para Excel"
                            >
                                <FileSpreadsheet className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-400 text-center mt-2">
                            💡 Clique diretamente no número do formato para visualizar a impressão
                        </p>
                    </div>
                </div>

                <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 p-6 border-t border-slate-100 dark:border-slate-800 gap-3">
                    <Button
                        variant="outline"
                        onClick={handleSendEmail}
                        className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-100"
                    >
                        <Mail className="w-4 h-4 mr-2" />
                        Enviar por Email
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-200 dark:border-slate-800 text-slate-600"
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
