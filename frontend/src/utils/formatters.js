/**
 * Global formatters for the SalesMasters BI Dashboard
 * Follows pt-BR standard (thousand separator: ., decimal separator: ,)
 */

/**
 * Formats a number as BRL currency
 * @param {number|string} value 
 * @param {number} fractionDigits 
 * @returns {string}
 */
export const formatCurrency = (value, fractionDigits = 0) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: fractionDigits,
        minimumFractionDigits: fractionDigits
    }).format(num);
};

/**
 * Formats a number with thousand separators
 * @param {number|string} value 
 * @returns {string}
 */
export const formatNumber = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0';
    return num.toLocaleString('pt-BR');
};

/**
 * Formats a percentage value
 * @param {number|string} value 
 * @returns {string}
 */
export const formatPercent = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0%';
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(num) + '%';
};

/**
 * Formats a number to a compact string (e.g., 1.5M, 200k)
 * @param {number|string} value 
 * @returns {string}
 */
export const formatCompactCurrency = (value) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return 'R$ 0';

    if (num >= 1000000) {
        return `R$ ${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
        return `R$ ${(num / 1000).toFixed(0)}k`;
    } else {
        return formatCurrency(num);
    }
};
