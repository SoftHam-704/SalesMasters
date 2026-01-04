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

const MetaDialog = ({ open, onClose, meta, suppliers, onSave }) => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

    const [formData, setFormData] = useState({
        met_ano: currentYear,
        met_industria: '',
        met_jan: 0, met_fev: 0, met_mar: 0, met_abr: 0,
        met_mai: 0, met_jun: 0, met_jul: 0, met_ago: 0,
        met_set: 0, met_out: 0, met_nov: 0, met_dez: 0
    });

    useEffect(() => {
        if (meta) {
            setFormData({
                met_ano: meta.met_ano || currentYear,
                met_industria: meta.met_industria?.toString() || '',
                met_jan: meta.met_jan || 0,
                met_fev: meta.met_fev || 0,
                met_mar: meta.met_mar || 0,
                met_abr: meta.met_abr || 0,
                met_mai: meta.met_mai || 0,
                met_jun: meta.met_jun || 0,
                met_jul: meta.met_jul || 0,
                met_ago: meta.met_ago || 0,
                met_set: meta.met_set || 0,
                met_out: meta.met_out || 0,
                met_nov: meta.met_nov || 0,
                met_dez: meta.met_dez || 0
            });
        } else {
            setFormData({
                met_ano: currentYear,
                met_industria: '',
                met_jan: 0, met_fev: 0, met_mar: 0, met_abr: 0,
                met_mai: 0, met_jun: 0, met_jul: 0, met_ago: 0,
                met_set: 0, met_out: 0, met_nov: 0, met_dez: 0
            });
        }
    }, [meta, currentYear]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMonthChange = (month, value) => {
        // Parse as float, defaulting to 0 if invalid
        const numValue = parseFloat(value) || 0;
        setFormData(prev => ({ ...prev, [month]: numValue }));
    };

    const handleSave = () => {
        if (!formData.met_industria) {
            alert('Selecione uma indústria');
            return;
        }
        onSave({
            ...formData,
            met_industria: parseInt(formData.met_industria)
        });
    };

    const totalAnual = Object.keys(formData)
        .filter(k => k.startsWith('met_') && k !== 'met_ano' && k !== 'met_industria')
        .reduce((sum, k) => sum + (parseFloat(formData[k]) || 0), 0);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const months = [
        { key: 'met_jan', label: 'Janeiro' },
        { key: 'met_fev', label: 'Fevereiro' },
        { key: 'met_mar', label: 'Março' },
        { key: 'met_abr', label: 'Abril' },
        { key: 'met_mai', label: 'Maio' },
        { key: 'met_jun', label: 'Junho' },
        { key: 'met_jul', label: 'Julho' },
        { key: 'met_ago', label: 'Agosto' },
        { key: 'met_set', label: 'Setembro' },
        { key: 'met_out', label: 'Outubro' },
        { key: 'met_nov', label: 'Novembro' },
        { key: 'met_dez', label: 'Dezembro' },
    ];

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {meta ? 'Editar Meta' : 'Nova Meta'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Ano e Indústria */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label className="text-xs font-semibold">Ano</Label>
                            <Select
                                value={formData.met_ano.toString()}
                                onValueChange={(value) => handleChange('met_ano', parseInt(value))}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {years.map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-semibold">Indústria</Label>
                            <Select
                                value={formData.met_industria}
                                onValueChange={(value) => handleChange('met_industria', value)}
                                disabled={!!meta} // Desabilita edição da indústria se for edição
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Selecione uma indústria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map(s => (
                                        <SelectItem key={s.for_codigo} value={s.for_codigo.toString()}>
                                            {s.for_nomered || s.for_nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Metas Mensais */}
                    <div className="border rounded-lg p-3 bg-gray-50">
                        <h4 className="text-sm font-semibold mb-3">Metas Mensais</h4>
                        <div className="grid grid-cols-4 gap-3">
                            {months.map(({ key, label }) => (
                                <div key={key}>
                                    <Label className="text-xs text-gray-600">{label}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData[key] || ''}
                                        onChange={(e) => handleMonthChange(key, e.target.value)}
                                        className="h-8 text-sm text-right"
                                        placeholder="0,00"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Anual */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                        <span className="text-sm text-blue-700 font-medium">Total Anual: </span>
                        <span className="text-lg font-bold text-blue-900">{formatCurrency(totalAnual)}</span>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave}>
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MetaDialog;
