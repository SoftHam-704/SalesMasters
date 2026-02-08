const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function verify() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const tenants = ['markpress', 'rimef', 'target']; // Exemplos de outros tenants

    try {
        console.log('--- Verificação Final de Views de BI (Smoke Test) ---');

        for (const tenant of tenants) {
            // Verificar se view existe e traz dados
            try {
                const res = await pool.query(`SELECT count(*) as qtd, sum(valor_total) as total FROM ${tenant}.vw_performance_mensal`);
                const row = res.rows[0];

                if (row) {
                    console.log(`✅ [${tenant}] View OK! ${row.qtd} registros sumarizados. Total Vendas: $${parseFloat(row.total || 0).toFixed(2)}`);
                }
            } catch (e) {
                console.log(`❌ [${tenant}] Erro: ${e.message} (Talvez schema não exista ou view falhou)`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
verify();
