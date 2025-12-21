import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export default function DiscountGroupDialog({ open, onClose, onApply, product }) {
    const [discountGroups, setDiscountGroups] = useState([]);
    const [selectedGroupId, setSelectedGroupId] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchDiscountGroups();
        }
    }, [open]);

    useEffect(() => {
        if (selectedGroupId) {
            const group = discountGroups.find(g => g.gde_id === parseInt(selectedGroupId));
            setSelectedGroup(group);
        } else {
            setSelectedGroup(null);
        }
    }, [selectedGroupId, discountGroups]);

    const fetchDiscountGroups = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3005/api/v2/discount-groups');
            const result = await response.json();
            if (result.success) {
                setDiscountGroups(result.data);
            }
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (selectedGroupId) {
            onApply(parseInt(selectedGroupId));
            handleClose();
        }
    };

    const handleClose = () => {
        setSelectedGroupId('');
        setSelectedGroup(null);
        onClose();
    };

    const formatPercent = (value) => {
        return value ? `${parseFloat(value).toFixed(2)}%` : '0%';
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Inserir Grupo de Desconto</DialogTitle>
                    <DialogDescription>
                        Tabela: <span className="font-semibold">{product?.selectedTable}</span> ({product?.totalProducts} produtos)
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Select do Grupo */}
                    <div className="space-y-2">
                        <Label>Grupo de Desconto</Label>
                        <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Selecione um grupo..." />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                                {discountGroups.map((group) => (
                                    <SelectItem key={group.gde_id} value={group.gde_id.toString()}>
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span className="font-medium">{group.gid} - {group.gde_nome}</span>
                                            <span className="text-xs text-gray-500">
                                                {formatPercent(group.gde_desc1)} + {formatPercent(group.gde_desc2)} + {formatPercent(group.gde_desc3)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Detalhes do Grupo Selecionado */}
                    {selectedGroup && (
                        <div className="space-y-2">
                            <Label>Descontos do Grupo</Label>
                            <div className="border rounded-lg p-3 bg-gray-50">
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <span className="text-gray-600">Desc 1:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc1)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 2:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 3:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc3)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 4:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc4)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 5:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc5)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 6:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc6)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 7:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc7)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 8:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc8)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Desc 9:</span>{' '}
                                        <span className="font-semibold">{formatPercent(selectedGroup.gde_desc9)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Alerta */}
                    <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                        <p className="text-xs text-blue-800">
                            O grupo de desconto será aplicado a <strong>TODOS os {product?.totalProducts} produtos</strong> desta tabela. A coluna "Preço Líquido" será atualizada automaticamente.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleApply} disabled={!selectedGroupId}>
                        Aplicar Grupo
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
