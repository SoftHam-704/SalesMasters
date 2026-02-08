import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from '@/config/api';

const ConditionRegistrationDialog = ({
    open,
    onOpenChange,
    formData,
    selectedIndustry,
    clientName,
    onSuccess
}) => {
    const [loading, setLoading] = useState(false);

    // Local state for editable fields
    const [localData, setLocalData] = useState({
        paymentTerm: '',
        priceTable: '',
        freightType: 'C',
        carrierCode: '',
        buyerName: '',
        buyerEmail: '',
        discounts: Array(9).fill(0)
    });

    // Initialize state when dialog opens
    useEffect(() => {
        if (open && formData) {
            setLocalData({
                paymentTerm: formData.ped_condpag || '',
                priceTable: formData.ped_tabela || '',
                freightType: formData.ped_tipofrete || 'C',
                carrierCode: formData.ped_transp || '',
                buyerName: formData.ped_comprador || '',
                buyerEmail: '', // Email starts empty as it's not in order form usually
                discounts: [
                    formData.ped_pri || 0,
                    formData.ped_seg || 0,
                    formData.ped_ter || 0,
                    formData.ped_qua || 0,
                    formData.ped_qui || 0,
                    formData.ped_sex || 0,
                    formData.ped_set || 0,
                    formData.ped_oit || 0,
                    formData.ped_nov || 0
                ]
            });
        }
    }, [open, formData]);

    const handleDiscountChange = (index, value) => {
        const newDiscounts = [...localData.discounts];
        // Replace comma with dot and parse
        let numVal = parseFloat(value.replace(',', '.'));
        if (isNaN(numVal)) numVal = 0;
        newDiscounts[index] = numVal;
        setLocalData({ ...localData, discounts: newDiscounts });
    };

    const handleSubmit = async () => {
        if (!formData.ped_cliente || !selectedIndustry?.for_codigo) {
            toast.error("Cliente e Indústria são obrigatórios para salvar condições.");
            return;
        }

        setLoading(true);
        try {
            // Map array back to object keys expected by backend logic
            const discountsObj = {};
            localData.discounts.forEach((val, idx) => {
                if (val > 0) discountsObj[`desc${idx + 1}`] = val;
            });

            const payload = {
                clientCode: formData.ped_cliente,
                supplierCode: selectedIndustry.for_codigo,
                discounts: discountsObj,
                paymentTerm: localData.paymentTerm,
                priceTable: localData.priceTable,
                carrierCode: localData.carrierCode,
                freightType: localData.freightType,
                buyerName: localData.buyerName,
                buyerEmail: localData.buyerEmail
            };

            const response = await fetch(`${API_BASE_URL}/cli-ind`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Condições salvas como padrão!', {
                    icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                });
                if (onSuccess) onSuccess();
                onOpenChange(false);
            } else {
                throw new Error(data.message || 'Erro ao salvar condições');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error(`Erro: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] border-emerald-100 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-1">
                        <Save className="h-5 w-5 text-emerald-600" />
                        <DialogTitle className="text-emerald-800 text-xl font-black">
                            Definir Padrão do Cliente
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-slate-500">
                        Revise e edite as condições comerciais que serão salvas como padrão para este cliente.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4 p-1 rounded-lg text-sm">
                    {/* Header Info (Read Only) */}
                    <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100 bg-emerald-50/50 p-3 rounded-md">
                        <div>
                            <Label className="text-gray-500 text-xs">Indústria</Label>
                            <div className="font-bold text-gray-800 text-base">{selectedIndustry?.for_nome || selectedIndustry?.for_codigo}</div>
                        </div>
                        <div>
                            <Label className="text-gray-500 text-xs">Cliente</Label>
                            <div className="font-bold text-gray-800 text-base">{clientName || formData.ped_cliente}</div>
                        </div>
                    </div>

                    <div className="space-y-4">

                        {/* Main Fields Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label htmlFor="prazo" className="text-xs font-semibold text-gray-600">Prazo de Pagamento</Label>
                                <Input
                                    id="prazo"
                                    value={localData.paymentTerm}
                                    onChange={(e) => setLocalData({ ...localData, paymentTerm: e.target.value })}
                                    className="h-8 text-xs"
                                    placeholder="Ex: 30/60/90"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="tabela" className="text-xs font-semibold text-gray-600">Tabela de Preço</Label>
                                <Input
                                    id="tabela"
                                    value={localData.priceTable}
                                    onChange={(e) => setLocalData({ ...localData, priceTable: e.target.value })}
                                    className="h-8 text-xs"
                                    placeholder="Código ou Nome"
                                />
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="frete" className="text-xs font-semibold text-gray-600">Tipo de Frete</Label>
                                <Select
                                    value={localData.freightType}
                                    onValueChange={(val) => setLocalData({ ...localData, freightType: val })}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="C">CIF (Pago)</SelectItem>
                                        <SelectItem value="F">FOB (A Pagar)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label htmlFor="transp" className="text-xs font-semibold text-gray-600">Cód. Transportadora</Label>
                                <Input
                                    id="transp"
                                    value={localData.carrierCode}
                                    onChange={(e) => setLocalData({ ...localData, carrierCode: e.target.value })}
                                    className="h-8 text-xs"
                                    placeholder="Código"
                                />
                            </div>
                        </div>

                        {/* Buyer Section */}
                        <div className="border rounded-md p-3 bg-gray-50/50 space-y-3">
                            <Label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Dados do Comprador</Label>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="comprador" className="text-xs text-gray-500">Nome</Label>
                                    <Input
                                        id="comprador"
                                        value={localData.buyerName}
                                        onChange={(e) => setLocalData({ ...localData, buyerName: e.target.value })}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="email" className="text-xs text-gray-500">Email</Label>
                                    <Input
                                        id="email"
                                        value={localData.buyerEmail}
                                        onChange={(e) => setLocalData({ ...localData, buyerEmail: e.target.value })}
                                        className="h-8 text-xs"
                                        placeholder="email@empresa.com"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Discounts Section */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Descontos Padrão (%)</Label>
                            <div className="grid grid-cols-5 gap-2 bg-emerald-50/30 p-2 rounded-md border border-emerald-100">
                                {localData.discounts.map((val, index) => (
                                    <div key={index} className="flex flex-col items-center">
                                        <Label className="text-[10px] text-gray-400 mb-0.5">{index + 1}º</Label>
                                        <Input
                                            type="text" // Using text to handle comma input gracefully before blur/parsing
                                            defaultValue={val > 0 ? val.toString().replace('.', ',') : ''}
                                            // Handle blur to update state to formatting if needed, but for simplicity let's stick to simple handling
                                            onBlur={(e) => handleDiscountChange(index, e.target.value)}
                                            className="h-7 text-center text-xs p-1"
                                            placeholder="0"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0 mt-4 border-t pt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading} className="text-gray-500">
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[150px]">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Salvar Padrão
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default ConditionRegistrationDialog;
