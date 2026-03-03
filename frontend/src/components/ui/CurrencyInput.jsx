import React from 'react';
import { Input } from "./input";

export const CurrencyInput = React.forwardRef(({ value, onChange, className, ...props }, ref) => {

    // Formata o valor numérico para string de moeda pt-BR
    const formatCurrency = (val) => {
        if (val === undefined || val === null || val === '') return '';

        // Garante que o valor seja tratado como número
        const numValue = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;

        if (isNaN(numValue)) return '';

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(numValue);
    };

    const handleChange = (e) => {
        // Remove tudo que não é dígito
        let rawValue = e.target.value.replace(/\D/g, "");

        // Converte para centavos e depois para float
        const numericValue = rawValue ? (parseFloat(rawValue) / 100) : 0;

        // Retorna o valor numérico para o pai
        if (onChange) {
            onChange(numericValue);
        }
    };

    return (
        <Input
            {...props}
            ref={ref}
            className={className}
            value={formatCurrency(value)}
            onChange={handleChange}
        />
    );
});

CurrencyInput.displayName = "CurrencyInput";
