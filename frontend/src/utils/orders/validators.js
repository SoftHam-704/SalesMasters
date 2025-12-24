/**
 * Validators - Funções de Validação
 * Funções puras para validação de dados de pedidos e itens
 */

/**
 * Valida os dados de um pedido
 * @param {Object} orderData - Dados do pedido
 * @returns {{valid: boolean, errors: string[]}} Resultado da validação
 */
export function validateOrder(orderData) {
    const errors = [];

    // Validações obrigatórias
    if (!orderData.ped_cliente) {
        errors.push('Cliente é obrigatório');
    }

    if (!orderData.ped_vendedor) {
        errors.push('Vendedor é obrigatório');
    }

    if (!orderData.ped_tabela) {
        errors.push('Tabela de preço é obrigatória');
    }

    if (!orderData.ped_data) {
        errors.push('Data do pedido é obrigatória');
    }

    // Validação de data
    if (orderData.ped_data) {
        const orderDate = new Date(orderData.ped_data);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (orderDate > today) {
            errors.push('Data do pedido não pode ser futura');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Valida os dados de um item
 * @param {Object} itemData - Dados do item
 * @returns {{valid: boolean, errors: string[]}} Resultado da validação
 */
export function validateItem(itemData) {
    const errors = [];

    // Validações obrigatórias
    if (!itemData.ite_produto) {
        errors.push('Código do produto é obrigatório');
    }

    if (!itemData.ite_quant || itemData.ite_quant <= 0) {
        errors.push('Quantidade deve ser maior que zero');
    }

    if (!itemData.ite_vlrunit || itemData.ite_vlrunit <= 0) {
        errors.push('Preço unitário deve ser maior que zero');
    }

    // Validação de percentuais
    const percentFields = [
        'ite_pri', 'ite_seg', 'ite_ter', 'ite_qua', 'ite_qui',
        'ite_sex', 'ite_set', 'ite_oit', 'ite_nov', 'ite_ipi', 'ite_st'
    ];

    percentFields.forEach(field => {
        const value = parseFloat(itemData[field]) || 0;
        if (value < 0 || value > 100) {
            errors.push(`${field} deve estar entre 0 e 100`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Valida se a quantidade é múltipla da embalagem
 * @param {number} quantity - Quantidade pedida
 * @param {number} packaging - Embalagem do produto
 * @returns {{valid: boolean, message: string}} Resultado da validação
 */
export function validatePackaging(quantity, packaging) {
    if (!packaging || packaging === 0) {
        return { valid: true, message: '' };
    }

    const isMultiple = quantity % packaging === 0;

    return {
        valid: isMultiple,
        message: isMultiple
            ? ''
            : `Quantidade deve ser múltipla de ${packaging}`,
    };
}

/**
 * Verifica se um produto já existe nos itens do pedido
 * @param {Array} items - Itens do pedido
 * @param {string} productCode - Código do produto
 * @param {number} currentItemId - ID do item atual (para edição)
 * @returns {{isDuplicate: boolean, message: string}} Resultado da verificação
 */
export function validateDuplicateProduct(items, productCode, currentItemId = null) {
    const duplicate = items.find(
        item => item.ite_produto === productCode && item.ite_id !== currentItemId
    );

    return {
        isDuplicate: !!duplicate,
        message: duplicate ? `Produto ${productCode} já existe no pedido` : '',
    };
}

/**
 * Valida condições de pagamento
 * @param {string} paymentCondition - Condição de pagamento (ex: "30-60-90")
 * @returns {{valid: boolean, message: string}} Resultado da validação
 */
export function validatePaymentCondition(paymentCondition) {
    if (!paymentCondition) {
        return { valid: false, message: 'Condição de pagamento é obrigatória' };
    }

    // Formato esperado: números separados por hífen (ex: "30-60-90" ou "30/60")
    const pattern = /^(\d+[-/])*\d+$/;

    if (!pattern.test(paymentCondition)) {
        return {
            valid: false,
            message: 'Formato inválido. Use números separados por hífen ou barra (ex: 30-60-90)',
        };
    }

    return { valid: true, message: '' };
}
