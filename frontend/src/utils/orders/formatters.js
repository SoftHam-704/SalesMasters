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
export function formatOrderNumber(number, prefix = null) {
    if (!number) return '(Novo)';

    let finalPrefix = prefix;
    if (finalPrefix === null) {
        // Tenta obter as iniciais do usuário logado como fallback
        try {
            const userStr = sessionStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const first = user.nome ? user.nome.charAt(0) : '';
                const last = user.sobrenome ? user.sobrenome.charAt(0) : '';
                finalPrefix = (first + last).toUpperCase() || 'SM';
            } else {
                finalPrefix = 'HS'; // Fallback de compatibilidade se não houver usuário
            }
        } catch (e) {
            finalPrefix = 'HS';
        }
    }

    // Se já tem o prefixo (ou qualquer prefixo de 2 letras seguido de números), retorna como está
    if (typeof number === 'string' && /^[A-Z]{2}\d+/.test(number)) {
        return number;
    }

    // Adiciona o prefixo e formata com zeros à esquerda
    const numStr = String(number).padStart(6, '0');
    return `${finalPrefix}${numStr}`;
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

    let dateObj;
    if (typeof date === 'string') {
        let cleanStr = date;
        // Se a data veio do banco como ISO limpo de meia-noite UTC, limpe para apenas a data
        if (cleanStr.includes('T00:00:00.000Z') || cleanStr.includes('T00:00:00Z')) {
            cleanStr = cleanStr.split('T')[0];
        }

        // Formato 'YYYY-MM-DD' puro é tratado como UTC pelo JS por padrão. 
        // Adicionar 'T00:00:00' força tratar como data local (fuso horário atual).
        if (cleanStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
            dateObj = new Date(cleanStr + 'T00:00:00');
        } else {
            dateObj = new Date(cleanStr);
        }
    } else {
        dateObj = date; // Already a Date object
    }

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

    let dateObj;
    if (typeof date === 'string') {
        let cleanStr = date;
        if (cleanStr.includes('T00:00:00.000Z') || cleanStr.includes('T00:00:00Z')) {
            cleanStr = cleanStr.split('T')[0];
        }

        // Se já for YYYY-MM-DD limpo
        if (cleanStr.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
            return cleanStr;
        } else {
            dateObj = new Date(cleanStr);
        }
    } else {
        dateObj = date;
    }

    if (isNaN(dateObj.getTime())) return '';

    // Gera um ISO evitando pegar o equivalente de UTC que pode pular 1 dia
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
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
