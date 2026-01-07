const { Pool } = require('pg');
require('dotenv').config();

// Pool dedicado ao banco MASTER (Central de Controle - NUVEM)
// O Master SEMPRE fica na nuvem para que todos os clientes possam acessar
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || 'ytAyO0u043'
});

// Cache de pools para os clientes (Tenants)
const tenantPools = {};

/**
 * Retorna ou cria um pool de conexão para uma empresa específica
 * @param {Object} config - Configurações do banco da empresa (host, nome, usuario, senha, porta)
 * @param {string} tenantKey - Chave única do cliente (ex: CNPJ ou ID)
 */
function getTenantPool(tenantKey, config = null) {
    // ============================================================
    // BYPASS PERMANENTE: CNPJ de TESTE → Conecta direto no banco LOCAL
    // Funciona mesmo se o servidor reiniciar (cache vazio)
    // ============================================================
    const CNPJ_TESTE = '00000000000191';
    if (tenantKey === CNPJ_TESTE && !tenantPools[tenantKey]) {
        console.log('🔧 [DB] MODO TESTE (Bypass): Criando pool LOCAL para CNPJ 00.000.000/0001-91');

        const newPool = new Pool({
            host: 'localhost',
            port: 5432,
            database: 'basesales',
            user: 'postgres',
            password: '@12Pilabo',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        tenantPools[tenantKey] = newPool;
        return newPool;
    }

    // Se temos config, SEMPRE recria o pool (para garantir dados atualizados)
    if (config) {
        // Remove pool antigo se existir
        if (tenantPools[tenantKey]) {
            console.log(`🔄 [DB] Removendo pool antigo para tenant: ${tenantKey}`);
            tenantPools[tenantKey].end().catch(() => { });
            delete tenantPools[tenantKey];
        }

        console.log(`🔍 [DB DEBUG] config.password = "${config.password}", env = "${process.env.DB_PASSWORD}"`);
        const finalPassword = String(config.password || '@12Pilabo');
        console.log(`📡 [DB] Criando pool para tenant: ${tenantKey} (${config.database} @ ${config.host}) - PWD: ${finalPassword.substring(0, 3)}***`);

        const newPool = new Pool({
            host: config.host || 'localhost',
            port: config.port || 5432,
            database: config.database,
            user: config.user || 'postgres',
            password: finalPassword,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
        });

        tenantPools[tenantKey] = newPool;
        return newPool;
    }

    // Se não temos config, tenta usar o cache
    if (tenantPools[tenantKey]) {
        return tenantPools[tenantKey];
    }

    throw new Error(`Configurações de banco não encontradas para o cliente: ${tenantKey}`);
}

module.exports = {
    masterPool,
    getTenantPool,
    tenantPools
};
