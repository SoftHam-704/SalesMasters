import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const PercentageInputDialog = ({
    open,
    onClose,
    onApply,
    title,
    description,
    currentTable,
    totalProducts
}) => {
    const [percentage, setPercentage] = useState('');
    const [error, setError] = useState('');

    const handlePercentageChange = (e) => {
        const value = e.target.value;

        // Permitir apenas números e vírgula
        if (value === '' || /^[0-9,]*$/.test(value)) {
            setPercentage(value);
            setError('');
        }
    };

    const handleApply = () => {
        // Validar entrada
        if (!percentage.trim()) {
            setError('Por favor, informe um percentual');
            return;
        }

        // Converter vírgula para ponto e validar número
        const numericValue = parseFloat(percentage.replace(',', '.'));

        if (isNaN(numericValue)) {
            setError('Valor inválido');
            return;
        }

        if (numericValue < 0) {
            setError('O percentual não pode ser negativo');
            return;
        }

        if (numericValue > 100) {
            setError('O percentual não pode ser maior que 100%');
            return;
        }

        // Aplicar o percentual
        onApply(numericValue);

        // Limpar e fechar
        setPercentage('');
        setError('');
        onClose();
    };

    const handleClose = () => {
        setPercentage('');
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Informações da tabela */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1">
                        <p className="text-sm font-semibold text-blue-900">
                            Tabela: {currentTable}
                        </p>
                        <p className="text-xs text-blue-700">
                            Total de produtos que serão atualizados: <strong>{totalProducts}</strong>
                        </p>
                    </div>

                    {/* Input de percentual */}
                    <div className="space-y-2">
                        <Label htmlFor="percentage" className="text-sm font-medium">
                            Percentual (%)
                        </Label>
                        <Input
                            id="percentage"
                            type="text"
                            value={percentage}
                            onChange={handlePercentageChange}
                            placeholder="Ex: 12,5 ou 18"
                            className="text-lg font-semibold text-center"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleApply();
                                }
                            }}
                        />
                        <p className="text-xs text-gray-500">
                            Use vírgula para valores decimais (ex: 12,5)
                        </p>
                    </div>

                    {/* Mensagem de erro */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        onClick={handleApply}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Aplicar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PercentageInputDialog;
