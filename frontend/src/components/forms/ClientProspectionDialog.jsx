import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'react-hot-toast';

export default function ClientProspectionDialog({ isOpen, onClose, clientId, onSave }) {
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchSuppliers();
            setSelectedSupplier('');
        }
    }, [isOpen]);

    const fetchSuppliers = async () => {
        try {
            const response = await fetch('https://salesmasters.softham.com.br/api/suppliers');
            if (!response.ok) throw new Error('Erro ao buscar fornecedores');
            const data = await response.json();
            setSuppliers(data.data || []);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Erro ao carregar fornecedores');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSupplier) {
            toast.error('Selecione uma indústria');
            return;
        }

        try {
            const response = await fetch(
                `https://salesmasters.softham.com.br/api/clients/${clientId}/industries`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ cli_forcodigo: parseInt(selectedSupplier) }),
                }
            );

            if (!response.ok) throw new Error('Erro ao adicionar indústria');

            toast.success('Indústria adicionada com sucesso!');
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving industry:', error);
            toast.error('Erro ao adicionar indústria');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-base">Adicionar Indústria</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="supplier" className="text-xs">
                            Indústria
                        </Label>
                        <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                            <SelectTrigger id="supplier" className="h-8 text-xs">
                                <SelectValue placeholder="Selecione uma indústria" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers.map((supplier) => (
                                    <SelectItem
                                        key={supplier.for_codigo}
                                        value={supplier.for_codigo.toString()}
                                        className="text-xs"
                                    >
                                        {supplier.for_nomered}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="h-7 text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                            Salvar
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
