const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function simulateTenantAccess() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const tenantSchema = 'target'; // EXATAMENTE como deveria vir do frontend

    try {
        console.log(`--- Simulando Acesso Tenant: [${tenantSchema}] ---`);

        // 1. Simular configuração do search_path (Igual ao Python)
        await pool.query(`SET search_path TO ${tenantSchema}, public`);
        console.log(`✅ search_path definido para: ${tenantSchema}, public`);

        // 2. Tentar acessar a View sem prefixo (como o BI faz)
        console.log('🔍 Consultando vw_performance_mensal (Sem prefixo)...');
        const res = await pool.query(`
            SELECT 
                count(*) as qtd_registros, 
                sum(valor_total) as total_vendas 
            FROM vw_performance_mensal
        `);

        const row = res.rows[0];
        console.log('📊 Resultado:');
        console.table(row);

        if (parseInt(row.qtd_registros) > 0) {
            console.log('✅ SUCESSO: A view está acessível e retornando dados.');
        } else {
            console.log('⚠️ AVISO: A view existe mas retornou 0 registros.');
        }

    } catch (e) {
        console.error('❌ ERRO FATAL:', e.message);
        if (e.message.includes('does not exist')) {
            console.log('💡 DIAGNÓSTICO: O sistema não está encontrando a view no schema correto.');
        }
    } finally {
        pool.end();
    }
}

simulateTenantAccess();
