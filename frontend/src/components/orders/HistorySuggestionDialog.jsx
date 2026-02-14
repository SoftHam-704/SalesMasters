import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    History,
    Plus,
    ShoppingCart,
    Calendar,
    Package,
    Trash2,
    AlertCircle,
    TrendingUp,
    CheckCircle2,
    Loader2,
    Search,
    FileDown,
    Share2
} from "lucide-react";
import * as XLSX from 'xlsx';
import { toast } from "sonner";
import { orderService } from "@/services/orders";
import { formatCurrency } from "@/utils/orders";
import { cn } from "@/lib/utils";

export const HistorySuggestionDialog = ({
    isOpen,
    onClose,
    clienteId,
    industriaId,
    tabelaId,
    onAddItems
}) => {
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [selectedItems, setSelectedItems] = useState({}); // { ite_produto: quantity }
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen && clienteId && industriaId) {
            fetchSuggestions();
        }
    }, [isOpen, clienteId, industriaId, tabelaId]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const res = await orderService.getSmartSuggestions(clienteId, industriaId, tabelaId);
            if (res.success) {
                setSuggestions(res.data);
                // Inicializa com a última quantidade comprada como sugestão
                const initialSelected = {};
                res.data.forEach(item => {
                    initialSelected[item.ite_produto] = item.ultima_quantidade || 1;
                });
                setSelectedItems(initialSelected);
            }
        } catch (error) {
            console.error("Erro ao buscar sugestões:", error);
            toast.error("Erro ao carregar sugestões do histórico.");
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (code, val) => {
        const numValue = parseFloat(val) || 0;
        setSelectedItems(prev => ({
            ...prev,
            [code]: numValue
        }));
    };

    const handleToggleItem = (code) => {
        setSelectedItems(prev => {
            const newState = { ...prev };
            if (newState.hasOwnProperty(code)) {
                delete newState[code];
            } else {
                const item = suggestions.find(s => s.ite_produto === code);
                newState[code] = item?.ultima_quantidade || 1;
            }
            return newState;
        });
    };

    const handleConfirm = () => {
        const itemsToAdd = suggestions
            .filter(s => selectedItems.hasOwnProperty(s.ite_produto) && selectedItems[s.ite_produto] > 0)
            .map(s => ({
                ite_produto: s.ite_produto,
                ite_idproduto: s.pro_id,
                ite_nomeprod: s.pro_desc || s.nome_produto,
                ite_quant: selectedItems[s.ite_produto],
                ite_puni: 0, // Envia 0 para que o OrderItemEntry use o preço da tabela e aplique descontos
                ite_ipi: s.ite_ipi || 0,
                ite_st: s.ite_st || 0,
                ite_embuch: '',
                ite_industria: industriaId
            }));

        if (itemsToAdd.length === 0) {
            toast.warning("Selecione pelo menos um item com quantidade positiva.");
            return;
        }

        onAddItems(itemsToAdd);
        onClose();
    };

    const handleExportExcel = () => {
        const itemsToExport = suggestions
            .filter(s => selectedItems.hasOwnProperty(s.ite_produto) && selectedItems[s.ite_produto] > 0)
            .map(s => ({
                'Código': s.ite_produto,
                'Produto': s.pro_desc || s.nome_produto,
                'Quantidade Sugerida': selectedItems[s.ite_produto],
                'Preço Tabela': s.preco_tabela,
                'Frequência': s.frequencia,
                'Última Compra': new Date(s.ultima_compra).toLocaleDateString(),
                'Dias sem Compra': s.dias_sem_compra || 0
            }));

        if (itemsToExport.length === 0) {
            toast.warning("Selecione itens para exportar.");
            return;
        }

        const ws = XLSX.utils.json_to_sheet(itemsToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Sugestões");
        XLSX.writeFile(wb, `Sugestoes_Compra_${clienteId}.xlsx`);
        toast.success("Excel gerado com sucesso!");
    };

    const handleShareWhatsApp = () => {
        const itemsToShare = suggestions
            .filter(s => selectedItems.hasOwnProperty(s.ite_produto) && selectedItems[s.ite_produto] > 0);

        if (itemsToShare.length === 0) {
            toast.warning("Selecione itens para compartilhar.");
            return;
        }

        let message = `*Sugestão de Compra - Histórico*\n\n`;
        itemsToShare.forEach(s => {
            message += `🔹 *${s.ite_produto}* - ${s.pro_desc || s.nome_produto}\n`;
            message += `   Qtd Sugerida: ${selectedItems[s.ite_produto]}\n`;
            message += `   Última compra: ${new Date(s.ultima_compra).toLocaleDateString()} (${s.dias_sem_compra || 0} dias atrás)\n\n`;
        });

        const encodedMessage = encodeURIComponent(message);
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    };

    const filteredSuggestions = suggestions.filter(s =>
        (s.ite_produto?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.nome_produto?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none bg-slate-50/95 backdrop-blur-xl shadow-2xl">
                <DialogHeader className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-md">
                            <TrendingUp className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-black tracking-tight text-white">Histórico de Compras do Cliente</DialogTitle>
                            <DialogDescription className="text-emerald-100 font-medium">
                                Itens já comprados pelo cliente nesta indústria anteriormente.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-4 border-b border-slate-200 bg-white/50 flex items-center gap-3 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Filtrar sugestões por código ou descrição..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 h-10 bg-white border-slate-200 focus:ring-emerald-500 rounded-xl font-medium"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 custom-scrollbar">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                                <p className="font-bold animate-pulse">Analisando histórico de compras...</p>
                            </div>
                        ) : filteredSuggestions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 text-center">
                                <div className="p-4 bg-slate-100 rounded-full">
                                    <AlertCircle className="h-10 w-10" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-600 text-lg">Nenhuma sugestão encontrada</p>
                                    <p className="text-sm">Este cliente ainda não comprou itens desta indústria ou o histórico não está disponível.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {filteredSuggestions.map((item) => (
                                    <div
                                        key={item.ite_produto}
                                        className={cn(
                                            "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                                            selectedItems.hasOwnProperty(item.ite_produto)
                                                ? "bg-white border-emerald-500 shadow-md shadow-emerald-500/10 scale-[1.01]"
                                                : "bg-white/50 border-slate-200 hover:border-emerald-300 hover:bg-white"
                                        )}
                                    >
                                        {/* Select Indicator */}
                                        <button
                                            onClick={() => handleToggleItem(item.ite_produto)}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                                                selectedItems.hasOwnProperty(item.ite_produto)
                                                    ? "bg-emerald-500 border-emerald-500 text-white"
                                                    : "border-slate-300 text-transparent"
                                            )}
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                        </button>

                                        {/* Product Info */}
                                        <div className="flex-1 min-w-0" onClick={() => handleToggleItem(item.ite_produto)}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-black font-mono tracking-tighter uppercase whitespace-nowrap">
                                                    {item.ite_produto}
                                                </span>
                                                <h4 className="font-bold text-slate-800 text-sm truncate">{item.pro_desc || item.nome_produto}</h4>
                                            </div>

                                            <div className="flex items-center gap-4 text-[11px]">
                                                <div className="flex items-center gap-1.5 text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-lg whitespace-nowrap">
                                                    <TrendingUp className="h-3 w-3" />
                                                    <span>{item.frequencia}x Pedidos</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 font-medium whitespace-nowrap">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Último: {new Date(item.ultima_compra).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-slate-500 font-medium whitespace-nowrap">
                                                    <Package className="h-3 w-3" />
                                                    <span>Últ. Qtd: {item.ultima_quantidade}</span>
                                                    {item.dias_sem_compra > 0 && (
                                                        <span className="text-red-600 font-black ml-1">({item.dias_sem_compra} dias)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price & Quantity */}
                                        <div className="flex items-center gap-4 shrink-0">
                                            <div className="text-right flex flex-col">
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Preço Atual</span>
                                                <span className="text-sm font-black text-slate-700 font-mono tracking-tighter">
                                                    {formatCurrency(item.preco_tabela || 0)}
                                                </span>
                                            </div>

                                            <div className="w-24">
                                                <Input
                                                    type="number"
                                                    disabled={!selectedItems.hasOwnProperty(item.ite_produto)}
                                                    value={selectedItems[item.ite_produto] || ""}
                                                    onChange={(e) => handleQuantityChange(item.ite_produto, e.target.value)}
                                                    className={cn(
                                                        "h-10 text-center font-black rounded-xl border-2 transition-all",
                                                        selectedItems.hasOwnProperty(item.ite_produto)
                                                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 focus:ring-emerald-500"
                                                            : "border-slate-200 bg-slate-100 text-slate-400"
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 bg-white border-t border-slate-200 shrink-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm font-bold text-slate-500">
                            {Object.keys(selectedItems).length} item(ns) selecionado(s)
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleExportExcel}
                                disabled={Object.keys(selectedItems).length === 0}
                                className="rounded-xl font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                            >
                                <FileDown className="h-4 w-4 mr-2" />
                                Excel
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleShareWhatsApp}
                                disabled={Object.keys(selectedItems).length === 0}
                                className="rounded-xl font-bold border-green-200 text-green-700 hover:bg-green-50"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                WhatsApp
                            </Button>
                            <div className="w-px h-10 bg-slate-200 mx-2" />
                            <Button variant="outline" onClick={onClose} className="rounded-xl font-bold border-slate-200 hover:bg-slate-100">
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                disabled={Object.keys(selectedItems).length === 0}
                                className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white px-8 shadow-lg shadow-emerald-600/20 active:scale-95 transition-all premium-shine"
                            >
                                <Plus className="h-5 w-5 mr-2 stroke-[3px]" />
                                Adicionar Selecionados
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
