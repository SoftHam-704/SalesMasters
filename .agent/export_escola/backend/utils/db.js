const { Pool } = require('pg');

// Pool para o banco MASTER (central de autenticação)
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'localhost',
    database: process.env.MASTER_DB_NAME || 'escola_master',
    user: process.env.MASTER_DB_USER || 'postgres',
    password: process.env.MASTER_DB_PASSWORD || 'postgres',
    port: parseInt(process.env.MASTER_DB_PORT) || 5432,
    max: 10,
    idleTimeoutMillis: 30000,
});

// Cache de pools de tenants
const tenantPools = new Map();

/**
 * Obtém ou cria um pool para um tenant específico
 */
function getTenantPool(dbConfig) {
    const key = `${dbConfig.host}:${dbConfig.database}`;

    if (!tenantPools.has(key)) {
        const pool = new Pool({
            host: dbConfig.host,
            database: dbConfig.database,
            user: dbConfig.user,
            password: dbConfig.password,
            port: dbConfig.port || 5432,
            max: 5,
            idleTimeoutMillis: 30000,
        });
        tenantPools.set(key, pool);
    }

    return tenantPools.get(key);
}

/**
 * Fecha todos os pools de tenants
 */
async function closeAllPools() {
    for (const [key, pool] of tenantPools) {
        await pool.end();
    }
    tenantPools.clear();
    await masterPool.end();
}

module.exports = {
    masterPool,
    getTenantPool,
    closeAllPools
};
