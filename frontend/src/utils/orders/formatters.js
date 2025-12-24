/**
 * Formatters - Funções de Formatação
 * Funções puras para formatação de dados
 */

/**
 * Formata um número de pedido
 * @param {string|number} number - Número do pedido
 * @param {string} prefix - Prefixo (ex: "HS")
 * @returns {string} Número formatado
 */
export function formatOrderNumber(number, prefix = 'HS') {
    if (!number) return '(Novo)';

    // Se já tem o prefixo, retorna como está
    if (typeof number === 'string' && number.startsWith(prefix)) {
        return number;
    }

    // Adiciona o prefixo e formata com zeros à esquerda
    const numStr = String(number).padStart(6, '0');
    return `${prefix}${numStr}`;
}

/**
 * Formata um valor monetário em Real Brasileiro
 * @param {number} value - Valor a formatar
 * @param {boolean} showSymbol - Se deve mostrar o símbolo R$
 * @returns {string} Valor formatado
 */
export function formatCurrency(value, showSymbol = true) {
    const numValue = parseFloat(value) || 0;

    if (showSymbol) {
        return numValue.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        });
    }

    return numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Formata um percentual
 * @param {number} value - Valor do percentual
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Percentual formatado
 */
export function formatPercentage(value, decimals = 2) {
    const numValue = parseFloat(value) || 0;
    return `${numValue.toFixed(decimals)}%`;
}

/**
 * Formata uma data no padrão brasileiro
 * @param {string|Date} date - Data a formatar
 * @param {boolean} includeTime - Se deve incluir hora
 * @returns {string} Data formatada
 */
export function formatDate(date, includeTime = false) {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    const options = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return dateObj.toLocaleString('pt-BR', options);
}

/**
 * Formata uma data para o formato ISO (YYYY-MM-DD) usado em inputs
 * @param {string|Date} date - Data a formatar
 * @returns {string} Data no formato ISO
 */
export function formatDateISO(date) {
    if (!date) return '';

    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) return '';

    return dateObj.toISOString().split('T')[0];
}

/**
 * Formata um número com casas decimais
 * @param {number} value - Valor a formatar
 * @param {number} decimals - Número de casas decimais
 * @returns {string} Número formatado
 */
export function formatNumber(value, decimals = 2) {
    const numValue = parseFloat(value) || 0;
    return numValue.toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
}

/**
 * Formata um CNPJ
 * @param {string} cnpj - CNPJ a formatar
 * @returns {string} CNPJ formatado
 */
export function formatCNPJ(cnpj) {
    if (!cnpj) return '';

    const cleaned = cnpj.replace(/\D/g, '');

    if (cleaned.length !== 14) return cnpj;

    return cleaned.replace(
        /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
        '$1.$2.$3/$4-$5'
    );
}

/**
 * Formata um CPF
 * @param {string} cpf - CPF a formatar
 * @returns {string} CPF formatado
 */
export function formatCPF(cpf) {
    if (!cpf) return '';

    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return cpf;

    return cleaned.replace(
        /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
        '$1.$2.$3-$4'
    );
}

/**
 * Formata um telefone
 * @param {string} phone - Telefone a formatar
 * @returns {string} Telefone formatado
 */
export function formatPhone(phone) {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    // Celular (11 dígitos)
    if (cleaned.length === 11) {
        return cleaned.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            '($1) $2-$3'
        );
    }

    // Fixo (10 dígitos)
    if (cleaned.length === 10) {
        return cleaned.replace(
            /^(\d{2})(\d{4})(\d{4})$/,
            '($1) $2-$3'
        );
    }

    return phone;
}
