/**
 * BuyerRegistrationDialog Component
 * Dialog para cadastrar novo comprador na tabela CLI_ANIV
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';

export function BuyerRegistrationDialog({ open, onOpenChange, clientCode, buyerName, onSuccess }) {
    const [formData, setFormData] = useState({
        email: '',
        birthDay: '',
        birthMonth: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        // Validação básica
        if (!formData.email) {
            toast.error('Por favor, informe o email do comprador');
            return;
        }

        if (!formData.birthDay || !formData.birthMonth) {
            toast.error('Por favor, informe o dia e mês de aniversário');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/cli-aniv/buyer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientCode: parseInt(clientCode),
                    buyerName: buyerName,
                    email: formData.email,
                    birthDay: parseInt(formData.birthDay),
                    birthMonth: parseInt(formData.birthMonth),
                    phone: formData.phone || null
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success('Comprador cadastrado com sucesso!');
                setFormData({ email: '', birthDay: '', birthMonth: '', phone: '' });
                onOpenChange(false);
                if (onSuccess) onSuccess();
            } else {
                toast.error(data.message || 'Erro ao cadastrar comprador');
            }
        } catch (error) {
            console.error('Erro ao cadastrar comprador:', error);
            toast.error('Erro ao cadastrar comprador');
        } finally {
            setLoading(false);
        }
    };

    // Gera opções de dia (1-31)
    const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

    // Meses do ano
    const months = [
        { value: 1, label: 'Janeiro' },
        { value: 2, label: 'Fevereiro' },
        { value: 3, label: 'Março' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Maio' },
        { value: 6, label: 'Junho' },
        { value: 7, label: 'Julho' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Setembro' },
        { value: 10, label: 'Outubro' },
        { value: 11, label: 'Novembro' },
        { value: 12, label: 'Dezembro' }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Cadastrar Comprador</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Cliente Info (readonly) */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-slate-600">Cliente</Label>
                        <Input value={clientCode || ''} disabled className="text-sm" />
                    </div>

                    {/* Buyer Name (readonly) */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-slate-600">Nome do Comprador</Label>
                        <Input value={buyerName || ''} disabled className="text-sm" />
                    </div>

                    {/* Email */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-slate-600">
                            Email <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            type="email"
                            placeholder="email@exemplo.com"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="text-sm"
                        />
                    </div>

                    {/* Birth Day and Month */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="grid gap-2">
                            <Label className="text-xs font-semibold text-slate-600">
                                Dia Aniversário <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.birthDay}
                                onValueChange={(value) => handleChange('birthDay', value)}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Dia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {dayOptions.map(day => (
                                        <SelectItem key={day} value={day.toString()}>
                                            {day}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs font-semibold text-slate-600">
                                Mês <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.birthMonth}
                                onValueChange={(value) => handleChange('birthMonth', value)}
                            >
                                <SelectTrigger className="text-sm">
                                    <SelectValue placeholder="Mês" />
                                </SelectTrigger>
                                <SelectContent>
                                    {months.map(month => (
                                        <SelectItem key={month.value} value={month.value.toString()}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Phone (optional) */}
                    <div className="grid gap-2">
                        <Label className="text-xs font-semibold text-slate-600">Telefone (opcional)</Label>
                        <Input
                            type="tel"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="text-sm"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
