import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import {
    Loader2,
    Calendar,
    DollarSign,
    FileText,
    User,
    CheckCircle2,
    Clock,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import BaixaParcelaModal from './BaixaParcelaModal';

const DetalhesContaModal = ({ open, onOpenChange, contaId, type = 'PAGAR', onRefresh }) => {
    const [loading, setLoading] = useState(false);
    const [conta, setConta] = useState(null);
    const [baixaParcela, setBaixaParcela] = useState(null); // Parcela sendo baixada

    useEffect(() => {
        if (open && contaId) {
            fetchDetalhes();
        }
    }, [open, contaId]);

    const fetchDetalhes = async () => {
        setLoading(true);
        try {
            const endpoint = type === 'PAGAR' ? `/api/financeiro/contas-pagar/${contaId}` : `/api/financeiro/contas-receber/${contaId}`;
            const response = await fetch(getApiUrl(NODE_API_URL, endpoint));
            const data = await response.json();

            if (data.success) {
                setConta(data.data);
            } else {
                toast.error('Erro ao carregar detalhes');
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            toast.error('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusParcela = (status) => {
        switch (status) {
            case 'PAGO':
            case 'RECEBIDO':
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Pago</Badge>;
            case 'VENCIDO':
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Vencido</Badge>;
            default:
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Pendente</Badge>;
        }
    };

    if (!conta && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!conta) return null;

    const isPagar = type === 'PAGAR';
    const mainColor = isPagar ? "text-red-600" : "text-emerald-600";
    const bgHeader = isPagar ? "bg-red-50" : "bg-emerald-50";

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className={`text-xl font-bold flex items-center gap-2 ${mainColor}`}>
                            {isPagar ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                            Detalhes da Conta
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Info Principal */}
                        <div className={`p-4 rounded-xl border ${bgHeader} border-current/10 grid grid-cols-2 gap-4`}>
                            <div>
                                <label className="text-xs uppercase font-semibold text-slate-500">Descrição</label>
                                <p className="font-bold text-slate-800">{conta.descricao}</p>
                            </div>
                            <div className="text-right">
                                <label className="text-xs uppercase font-semibold text-slate-500">{isPagar ? 'Fornecedor' : 'Cliente'}</label>
                                <p className="font-bold text-slate-800">{isPagar ? conta.fornecedor_nome : conta.cliente_nome}</p>
                            </div>
                            <div>
                                <label className="text-xs uppercase font-semibold text-slate-500">Status Geral</label>
                                <div><Badge variant={conta.status === 'PAGO' || conta.status === 'RECEBIDO' ? 'success' : 'default'}>{conta.status}</Badge></div>
                            </div>
                            <div className="text-right">
                                <label className="text-xs uppercase font-semibold text-slate-500">Valor Total</label>
                                <p className={`text-xl font-black ${mainColor}`}>{formatCurrency(conta.valor_total)}</p>
                            </div>
                        </div>

                        {/* Detalhes Secundários */}
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Doc:
                                </span>
                                <span className="font-medium">{conta.numero_documento || 'N/A'}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Emissão:
                                </span>
                                <span className="font-medium">{formatDate(conta.data_emissao)}</span>
                            </div>
                            <div className="space-y-1">
                                <span className="text-slate-500 flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Vencimento:
                                </span>
                                <span className="font-medium">{formatDate(conta.data_vencimento)}</span>
                            </div>
                        </div>

                        {/* Tabela de Parcelas */}
                        <div className="space-y-3">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Cronograma de Parcelas
                            </h3>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Nº</th>
                                            <th className="px-3 py-2 text-left">Vencimento</th>
                                            <th className="px-3 py-2 text-right">Valor</th>
                                            <th className="px-3 py-2 text-center">Status</th>
                                            <th className="px-3 py-2 text-right">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {conta.parcelas?.map((p) => (
                                            <tr key={p.id} className="hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-medium">{p.numero_parcela}</td>
                                                <td className="px-3 py-2">{formatDate(p.data_vencimento)}</td>
                                                <td className="px-3 py-2 text-right font-semibold">{formatCurrency(p.valor)}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {getStatusParcela(p.status)}
                                                </td>
                                                <td className="px-3 py-2 text-right">
                                                    {p.status === 'ABERTO' || p.status === 'VENCIDO' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className={`${isPagar ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-emerald-50 hover:text-emerald-600'} h-7`}
                                                            onClick={() => setBaixaParcela(p)}
                                                        >
                                                            Baixar
                                                        </Button>
                                                    ) : (
                                                        <span className="text-emerald-500 flex items-center justify-end gap-1 text-xs font-bold">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            Concluído
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Baixa da Parcela */}
            {baixaParcela && (
                <BaixaParcelaModal
                    open={!!baixaParcela}
                    onOpenChange={(open) => !open && setBaixaParcela(null)}
                    parcela={baixaParcela}
                    type={type}
                    contaId={contaId}
                    onSuccess={() => {
                        fetchDetalhes();
                        if (onRefresh) onRefresh();
                    }}
                />
            )}
        </>
    );
};

export default DetalhesContaModal;
