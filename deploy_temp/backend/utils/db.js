const { Pool } = require('pg');
require('dotenv').config();

// Pool dedicado ao banco MASTER (Central de Controle - NUVEM)
const masterPool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'salesmasters_master',
    user: 'webadmin',
    password: 'ytAyO0u043',
    max: 10,
    idleTimeoutMillis: 30000
});

// Cache global persistente
const tenantPools = {};
const tenantConfigs = {};

/**
 * Retorna ou cria um pool de conexão para um cliente
 */
function getTenantPool(tenantKey, config = null) {
    if (config) {
        // Se informou config, atualiza o cache
        if (tenantPools[tenantKey]) {
            tenantPools[tenantKey].end().catch(() => { });
        }

        const poolOptions = {
            host: config.host,
            port: config.port || 5432,
            database: config.database,
            user: config.user,
            password: config.password,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        };

        if (config.schema && config.schema !== 'public') {
            poolOptions.options = `-c search_path=${config.schema.replace(/[^a-zA-Z0-9_]/g, '')},public`;
        }

        tenantPools[tenantKey] = new Pool(poolOptions);
        tenantConfigs[tenantKey] = config;
        return tenantPools[tenantKey];
    }

    return tenantPools[tenantKey] || null;
}

function getTenantConfig(tenantKey) {
    return tenantConfigs[tenantKey] || null;
}

module.exports = {
    masterPool,
    getTenantPool,
    getTenantConfig,
    tenantPools
};
