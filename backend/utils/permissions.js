/**
 * Permissions Utility - Industry Restrictions
 * 
 * Fluxo por ID:
 *   user_nomes.codigo → vendedores.ven_codusu → vendedor_ind.vin_codigo
 * 
 * Retorna o ven_codigo do vendedor vinculado, para uso em subqueries com IN.
 */

/**
 * Retorna o ven_codigo do vendedor vinculado ao userId.
 * Retorna null se o usuário for master ou não tiver vendedor vinculado.
 */
async function getLinkedSellerId(dbPool, userId) {
    if (!userId) return null;

    try {
        // 1. Verificar se é master (boolean)
        const userCheck = await dbPool.query(
            'SELECT master FROM user_nomes WHERE codigo = $1',
            [parseInt(userId)]
        );

        if (userCheck.rows.length === 0) return null;
        if (userCheck.rows[0].master === true) return null;

        // 2. Buscar vendedor vinculado por ID
        const sellerRes = await dbPool.query(
            'SELECT ven_codigo FROM vendedores WHERE ven_codusu = $1',
            [parseInt(userId)]
        );

        if (sellerRes.rows.length === 0) {
            console.log(`🔐 [PERMISSIONS] User ${userId}: sem vendedor vinculado (ven_codusu)`);
            return null;
        }

        console.log(`🔐 [PERMISSIONS] User ${userId} → Vendedor ${sellerRes.rows[0].ven_codigo}`);
        return sellerRes.rows[0].ven_codigo;
    } catch (error) {
        console.error('❌ [PERMISSIONS] Error:', error.message);
        return null;
    }
}

/**
 * Retorna array de industry IDs permitidas, ou null se sem restrição.
 */
async function getAllowedIndustries(dbPool, userId) {
    const sellerId = await getLinkedSellerId(dbPool, userId);
    if (sellerId === null) return null;

    try {
        const result = await dbPool.query(
            'SELECT vin_industria FROM vendedor_ind WHERE vin_codigo = $1',
            [sellerId]
        );

        if (result.rows.length > 0) {
            const ids = result.rows.map(r => parseInt(r.vin_industria));
            console.log(`🔐 [PERMISSIONS] Indústrias permitidas: [${ids}]`);
            return ids;
        }

        return null;
    } catch (error) {
        console.error('❌ [PERMISSIONS] Error fetching industries:', error.message);
        return null;
    }
}

/**
 * Gera cláusula SQL com subquery IN para filtrar indústrias.
 * Usa subquery direto no banco, evitando problemas de tipo.
 * 
 * @param {number|null} sellerId - ven_codigo do vendedor
 * @param {string} columnName - coluna a filtrar (ex: 'for_codigo', 'ped_industria')
 * @param {Array} params - array de parâmetros SQL (opcional)
 * @returns {{ filterClause: string, params: Array }}
 */
function buildIndustryFilterClause(sellerId, columnName, params = []) {
    if (sellerId === null) {
        return { filterClause: '', params };
    }

    params.push(sellerId);
    return {
        filterClause: ` AND ${columnName} IN (SELECT vin_industria FROM vendedor_ind WHERE vin_codigo = $${params.length})`,
        params
    };
}

/**
 * Versão com array (ANY) para casos onde já temos a lista.
 */
function applyIndustryFilter(allowedIndustries, columnName, params) {
    if (!allowedIndustries || allowedIndustries.length === 0) {
        return { filterClause: '' };
    }

    params.push(allowedIndustries);
    return {
        filterClause: ` AND ${columnName} = ANY($${params.length})`
    };
}

module.exports = {
    getLinkedSellerId,
    getAllowedIndustries,
    buildIndustryFilterClause,
    applyIndustryFilter
};
