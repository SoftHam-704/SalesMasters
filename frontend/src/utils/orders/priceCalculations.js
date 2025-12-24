/**
 * Price Calculations - Funções de Cálculo de Preços
 * Funções puras para cálculos relacionados a preços, descontos e impostos
 */

/**
 * Aplica uma lista de descontos em cascata sobre um preço base
 * @param {number} basePrice - Preço base
 * @param {number[]} discounts - Array de percentuais de desconto
 * @returns {number} Preço final após todos os descontos
 */
export function applyDiscounts(basePrice, discounts) {
    let finalPrice = basePrice;

    discounts.forEach(discount => {
        if (discount > 0) {
            finalPrice = finalPrice * (1 - discount / 100);
        }
    });

    return finalPrice;
}

/**
 * Calcula o valor do IPI
 * @param {number} price - Preço base
 * @param {number} ipiPercentage - Percentual de IPI
 * @returns {number} Valor do IPI
 */
export function calculateIPI(price, ipiPercentage) {
    return price * (ipiPercentage / 100);
}

/**
 * Calcula o valor da Substituição Tributária (ST)
 * @param {number} price - Preço base
 * @param {number} stPercentage - Percentual de ST
 * @returns {number} Valor da ST
 */
export function calculateST(price, stPercentage) {
    return price * (stPercentage / 100);
}

/**
 * Calcula todos os totais de um item
 * @param {Object} item - Dados do item
 * @returns {Object} Objeto com todos os totais calculados
 */
export function calculateItemTotal(item) {
    const quant = parseFloat(item.ite_quant) || 0;
    const unitPrice = parseFloat(item.ite_vlrunit) || 0;
    const ipiPerc = parseFloat(item.ite_ipi) || 0;
    const stPerc = parseFloat(item.ite_st) || 0;

    // Total bruto (quantidade * preço unitário)
    const totBruto = quant * unitPrice;

    // Aplica descontos em cascata
    const discounts = [
        parseFloat(item.ite_pri) || 0,
        parseFloat(item.ite_seg) || 0,
        parseFloat(item.ite_ter) || 0,
        parseFloat(item.ite_qua) || 0,
        parseFloat(item.ite_qui) || 0,
        parseFloat(item.ite_sex) || 0,
        parseFloat(item.ite_set) || 0,
        parseFloat(item.ite_oit) || 0,
        parseFloat(item.ite_nov) || 0,
    ];

    const totLiquido = applyDiscounts(totBruto, discounts);
    const puniliq = quant > 0 ? totLiquido / quant : 0;

    // Calcula impostos
    const totIPI = calculateIPI(totLiquido, ipiPerc);
    const totST = calculateST(totLiquido, stPerc);

    // Preço unitário com IPI
    const puniIPI = puniliq + (puniliq * ipiPerc / 100);

    return {
        ite_totbruto: totBruto,
        ite_totliquido: totLiquido,
        ite_puniliq: puniliq,
        ite_totalipi: totIPI,
        ite_totalst: totST,
        ite_valcomipi: totLiquido + totIPI,
        ite_punitipi: puniIPI,
    };
}

/**
 * Calcula os totais de um pedido baseado em seus itens
 * @param {Array} items - Array de itens do pedido
 * @returns {Object} Totais do pedido
 */
export function calculateOrderTotals(items) {
    const totals = items.reduce(
        (acc, item) => {
            const itemTotals = calculateItemTotal(item);
            return {
                ped_totbruto: acc.ped_totbruto + itemTotals.ite_totbruto,
                ped_totliq: acc.ped_totliq + itemTotals.ite_totliquido,
                ped_totalipi: acc.ped_totalipi + itemTotals.ite_totalipi,
                ped_totalst: acc.ped_totalst + (itemTotals.ite_totalst || 0),
            };
        },
        {
            ped_totbruto: 0,
            ped_totliq: 0,
            ped_totalipi: 0,
            ped_totalst: 0,
        }
    );

    // Total com impostos
    totals.ped_totalcomimp = totals.ped_totliq + totals.ped_totalipi + totals.ped_totalst;

    return totals;
}

/**
 * Calcula o preço unitário líquido baseado no total líquido e quantidade
 * @param {number} totalLiquido - Total líquido
 * @param {number} quantidade - Quantidade
 * @returns {number} Preço unitário líquido
 */
export function calculateUnitPrice(totalLiquido, quantidade) {
    return quantidade > 0 ? totalLiquido / quantidade : 0;
}
