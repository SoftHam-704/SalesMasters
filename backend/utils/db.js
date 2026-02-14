const { Pool } = require('pg');
require('dotenv').config();

// Pool dedicado ao banco MASTER (Central de Controle - NUVEM)
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: parseInt(process.env.MASTER_DB_PORT || '13062'),
    database: process.env.MASTER_DB_DATABASE || 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043',
    max: parseInt(process.env.MASTER_DB_MAX_CONNS || '10'),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Verificação inicial de conexão do Master
masterPool.on('error', (err) => {
    console.error('❌ [DATABASE MASTER] Erro inesperado no pool:', err.message);
    if (err.code === 'ECONNREFUSED') {
        console.warn('⚠️ [DATABASE MASTER] Conexão recusada. Verifique se o IP/Porta estão corretos ou se o Banco Master está ativo.');
    }
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
            max: 15, // Aumentado para 15
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000
        };

        if (config.schema && config.schema !== 'public') {
            poolOptions.options = `-c search_path=${config.schema.replace(/[^a-zA-Z0-9_]/g, '')}`;
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
