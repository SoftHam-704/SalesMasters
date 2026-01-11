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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig';
import { Loader2, DollarSign, Calendar, FileText, User, Tag, Layers } from 'lucide-react';

const NovaContaModal = ({ open, onOpenChange, type = 'PAGAR', onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(false);

    // Data for selects
    const [entities, setEntities] = useState([]); // Clientes or Fornecedores
    const [planoContas, setPlanoContas] = useState([]);
    const [centrosCusto, setCentrosCusto] = useState([]);

    const [formData, setFormData] = useState({
        descricao: '',
        entityId: '',
        numero_documento: '',
        valor_total: '',
        data_emissao: new Date().toISOString().split('T')[0],
        data_vencimento: new Date().toISOString().split('T')[0],
        id_plano_contas: '',
        id_centro_custo: '',
        observacoes: '',
        numero_parcelas: '1',
        intervalo_dias: '30'
    });

    useEffect(() => {
        if (open) {
            fetchInitialData();
            // Reset form when opening
            setFormData({
                descricao: '',
                entityId: '',
                numero_documento: '',
                valor_total: '',
                data_emissao: new Date().toISOString().split('T')[0],
                data_vencimento: new Date().toISOString().split('T')[0],
                id_plano_contas: '',
                id_centro_custo: '',
                observacoes: '',
                numero_parcelas: '1',
                intervalo_dias: '30'
            });
        }
    }, [open, type]);

    const fetchInitialData = async () => {
        setFetchingData(true);
        try {
            const entityEndpoint = type === 'PAGAR' ? '/api/financeiro/fornecedores' : '/api/financeiro/clientes';

            const [entitiesRes, planoRes, centrosRes] = await Promise.all([
                fetch(getApiUrl(NODE_API_URL, entityEndpoint)).then(r => r.json()),
                fetch(getApiUrl(NODE_API_URL, '/api/financeiro/plano-contas')).then(r => r.json()),
                fetch(getApiUrl(NODE_API_URL, '/api/financeiro/centro-custo')).then(r => r.json())
            ]);

            if (entitiesRes.success) setEntities(entitiesRes.data);
            if (planoRes.success) {
                // Filter plan by category (Receita/Despesa)
                const targetTipo = type === 'PAGAR' ? 'D' : 'R';
                setPlanoContas(planoRes.data.filter(i => i.tipo === targetTipo));
            }
            if (centrosRes.success) setCentrosCusto(centrosRes.data);

        } catch (error) {
            console.error('Error fetching modal data:', error);
            toast.error('Erro ao carregar dados auxiliares');
        } finally {
            setFetchingData(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.descricao || !formData.entityId || !formData.valor_total || !formData.id_plano_contas) {
            toast.error('Por favor, preencha os campos obrigatórios');
            return;
        }

        setLoading(true);
        try {
            const endpoint = type === 'PAGAR' ? '/api/financeiro/contas-pagar' : '/api/financeiro/contas-receber';

            const payload = {
                descricao: formData.descricao,
                [type === 'PAGAR' ? 'id_fornecedor' : 'id_cliente']: parseInt(formData.entityId),
                numero_documento: formData.numero_documento,
                valor_total: parseFloat(formData.valor_total),
                data_emissao: formData.data_emissao,
                data_vencimento: formData.data_vencimento,
                observacoes: formData.observacoes,
                id_plano_contas: parseInt(formData.id_plano_contas),
                id_centro_custo: formData.id_centro_custo ? parseInt(formData.id_centro_custo) : null,
                numero_parcelas: parseInt(formData.numero_parcelas) || 1,
                intervalo_dias: parseInt(formData.intervalo_dias) || 30,
                criado_por: JSON.parse(sessionStorage.getItem('user'))?.nome || 'Sistema'
            };

            const response = await fetch(getApiUrl(NODE_API_URL, endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.success) {
                toast.success(type === 'PAGAR' ? 'Conta a pagar criada!' : 'Conta a receber criada!');
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.message || 'Erro ao criar conta');
            }
        } catch (error) {
            console.error('Error creating account:', error);
            toast.error('Erro de conexão ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const isPagar = type === 'PAGAR';
    const colorClass = isPagar ? "from-red-600 to-rose-600" : "from-emerald-600 to-teal-600";
    const labelEntity = isPagar ? "Fornecedor" : "Cliente";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className={`text-2xl font-bold bg-gradient-to-r ${colorClass} bg-clip-text text-transparent flex items-center gap-2`}>
                        <DollarSign className={isPagar ? "text-red-500" : "text-emerald-500"} />
                        Nova Conta a {isPagar ? 'Pagar' : 'Receber'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Descrição */}
                        <div className="col-span-2 space-y-2">
                            <Label className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-slate-400" />
                                Descrição *
                            </Label>
                            <Input
                                placeholder="Ex: Aluguel Mensal, Venda de Produtos..."
                                value={formData.descricao}
                                onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                required
                            />
                        </div>

                        {/* Entidade (Cliente/Fornecedor) */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <User className="w-4 h-4 text-slate-400" />
                                {labelEntity} *
                            </Label>
                            <Select
                                value={formData.entityId}
                                onValueChange={val => setFormData({ ...formData, entityId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={`Selecione o ${labelEntity.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {entities.map(e => (
                                        <SelectItem key={e.id} value={e.id.toString()}>
                                            {e.nome_razao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Plano de Contas */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-slate-400" />
                                Plano de Contas *
                            </Label>
                            <Select
                                value={formData.id_plano_contas}
                                onValueChange={val => setFormData({ ...formData, id_plano_contas: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {planoContas.map(p => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                            {p.codigo} - {p.descricao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Valor Total */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 text-rose-600 font-semibold">
                                <DollarSign className="w-4 h-4" />
                                Valor Total *
                            </Label>
                            <Input
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={formData.valor_total}
                                onChange={e => setFormData({ ...formData, valor_total: e.target.value })}
                                className="font-bold text-lg"
                                required
                            />
                        </div>

                        {/* Centro de Custo */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-slate-400" />
                                Centro de Custo
                            </Label>
                            <Select
                                value={formData.id_centro_custo}
                                onValueChange={val => setFormData({ ...formData, id_centro_custo: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Opcional" />
                                </SelectTrigger>
                                <SelectContent>
                                    {centrosCusto.map(c => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.descricao}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Data Emissão */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                Data Emissão
                            </Label>
                            <Input
                                type="date"
                                value={formData.data_emissao}
                                onChange={e => setFormData({ ...formData, data_emissao: e.target.value })}
                            />
                        </div>

                        {/* Data Vencimento */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2 font-semibold">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                1º Vencimento *
                            </Label>
                            <Input
                                type="date"
                                value={formData.data_vencimento}
                                onChange={e => setFormData({ ...formData, data_vencimento: e.target.value })}
                                required
                            />
                        </div>

                        {/* Numero Documento */}
                        <div className="space-y-2">
                            <Label>Nº Documento / NF</Label>
                            <Input
                                placeholder="Opcional"
                                value={formData.numero_documento}
                                onChange={e => setFormData({ ...formData, numero_documento: e.target.value })}
                            />
                        </div>

                        {/* Parcelamento */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label>Parcelas</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.numero_parcelas}
                                    onChange={e => setFormData({ ...formData, numero_parcelas: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Intervalo (dias)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.intervalo_dias}
                                    onChange={e => setFormData({ ...formData, intervalo_dias: e.target.value })}
                                    disabled={formData.numero_parcelas === '1'}
                                />
                            </div>
                        </div>

                        {/* Observações */}
                        <div className="col-span-2 space-y-2">
                            <Label>Observações</Label>
                            <Textarea
                                placeholder="Detalhes adicionais..."
                                value={formData.observacoes}
                                onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            className={`bg-gradient-to-r ${colorClass}`}
                            disabled={loading || fetchingData}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Processando...
                                </>
                            ) : (
                                'Salvar Conta'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default NovaContaModal;
