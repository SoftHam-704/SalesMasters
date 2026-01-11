import React, { useState } from 'react';
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { Loader2, DollarSign, Calendar, CheckCircle2 as CheckIcon } from 'lucide-react';

const BaixaParcelaModal = ({ open, onOpenChange, parcela, type, contaId, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        data_pagamento: new Date().toISOString().split('T')[0],
        valor_pago: parcela?.valor || '',
        juros: '0',
        desconto: '0',
        observacoes: '',
        gerar_residuo: true
    });

    const isPagar = type === 'PAGAR';
    const mainColorClass = isPagar ? "from-red-600 to-rose-600" : "from-emerald-600 to-teal-600";

    // Cálculo do resíduo em tempo real
    const valorOriginal = parseFloat(parcela?.valor || 0);
    const valorPago = parseFloat(formData.valor_pago || 0);
    const desconto = parseFloat(formData.desconto || 0);
    const juros = parseFloat(formData.juros || 0);
    const residuo = Math.max(0, valorOriginal - valorPago - desconto + juros);
    const isParcial = valorPago > 0 && valorPago < (valorOriginal + juros - desconto);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isPagar
                ? `/api/financeiro/contas-pagar/${contaId}/baixa`
                : `/api/financeiro/contas-receber/${contaId}/baixa`;

            const payload = {
                id_parcela: parcela.id,
                [isPagar ? 'data_pagamento' : 'data_recebimento']: formData.data_pagamento,
                [isPagar ? 'valor_pago' : 'valor_recebido']: valorPago,
                juros: juros,
                desconto: desconto,
                observacoes: formData.observacoes,
                gerar_residuo: formData.gerar_residuo
            };

            const response = await fetch(getApiUrl(NODE_API_URL, endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(residuo > 0 && formData.gerar_residuo
                    ? 'Baixa parcial realizada! Nova parcela de resíduo gerada.'
                    : 'Baixa realizada com sucesso!');
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.message || 'Erro ao realizar baixa');
            }
        } catch (error) {
            console.error('Error in baixa:', error);
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className={`text-xl font-bold bg-gradient-to-r ${mainColorClass} bg-clip-text text-transparent flex items-center gap-2`}>
                        <CheckIcon className={isPagar ? "text-red-500" : "text-emerald-500"} />
                        Confirmar Baixa {isParcial ? 'Parcial' : ''}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Parcela:</span>
                            <span className="font-bold">№ {parcela?.numero_parcela}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span className="text-slate-500">Valor Original:</span>
                            <span className="font-bold text-slate-700">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorOriginal)}
                            </span>
                        </div>
                        {residuo > 0.01 && (
                            <div className="flex justify-between text-sm mt-1 pt-1 border-t border-slate-200 border-dashed">
                                <span className={`${isPagar ? 'text-red-600' : 'text-emerald-600'} font-semibold`}>Saldo Remanescente:</span>
                                <span className={`${isPagar ? 'text-red-600' : 'text-emerald-600'} font-black`}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(residuo)}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Data do {isPagar ? 'Pagamento' : 'Recebimento'}
                        </Label>
                        <Input
                            type="date"
                            value={formData.data_pagamento}
                            onChange={e => setFormData({ ...formData, data_pagamento: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="flex items-center gap-1 font-bold">
                            <DollarSign className="w-3 h-3" />
                            Valor {isPagar ? 'Pago' : 'Recebido'}
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={formData.valor_pago}
                            onChange={e => setFormData({ ...formData, valor_pago: e.target.value })}
                            className="text-lg font-bold"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Juros/Multa</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.juros}
                                onChange={e => setFormData({ ...formData, juros: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Desconto</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.desconto}
                                onChange={e => setFormData({ ...formData, desconto: e.target.value })}
                            />
                        </div>
                    </div>

                    {residuo > 0.01 && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex items-start gap-2">
                            <input
                                type="checkbox"
                                id="chkResiduo"
                                className="mt-1"
                                checked={formData.gerar_residuo}
                                onChange={e => setFormData({ ...formData, gerar_residuo: e.target.checked })}
                            />
                            <Label htmlFor="chkResiduo" className="text-xs text-amber-800 leading-tight cursor-pointer">
                                <strong>Baixa Parcial detectada.</strong> Marque esta caixa para gerar uma nova parcela com o saldo restante (R$ {residuo.toFixed(2)}).
                            </Label>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Observações</Label>
                        <Textarea
                            placeholder="Ex: Pagamento parcial, aguardando resto..."
                            value={formData.observacoes}
                            onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                            rows={2}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button type="submit" className={`bg-gradient-to-r ${mainColorClass}`} disabled={loading}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            Confirmar {residuo > 0.01 ? 'Baixa Parcial' : 'Baixa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default BaixaParcelaModal;
