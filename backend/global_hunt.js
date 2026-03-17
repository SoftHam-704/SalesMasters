const { Pool } = require('pg');
require('dotenv').config();

async function globalHunt() {
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: false
    };

    const pool = new Pool(config);

    try {
        const schemasResult = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
        const schemas = schemasResult.rows.map(r => r.schema_name);

        const targetId = '907681'; // Um número de pedido que sabemos ser órfão no ro_consult
        console.log(`\n--- BUSCA GLOBAL PELO PEDIDO/NÚMERO ${targetId} ---`);

        for (const schema of schemas) {
            try {
                // Verificar na tabela pedidos do schema
                const pedRes = await pool.query(`
                    SELECT ped_pedido, ped_data 
                    FROM ${schema}.pedidos 
                    WHERE ped_pedido LIKE '%${targetId}%' OR ped_numero::text LIKE '%${targetId}%'
                `);

                if (pedRes.rows.length > 0) {
                    console.log(`[SCHEMA: ${schema}] CABEÇALHO encontrado: ${pedRes.rows[0].ped_pedido} (${pedRes.rows[0].ped_data.toISOString().split('T')[0]})`);
                }

                // Verificar na tabela itens_ped do schema
                const iteRes = await pool.query(`
                    SELECT ite_pedido, COUNT(*) as qtd
                    FROM ${schema}.itens_ped 
                    WHERE ite_pedido LIKE '%${targetId}%'
                    GROUP BY ite_pedido
                `);

                if (iteRes.rows.length > 0) {
                    console.log(`[SCHEMA: ${schema}] 🎯🎯🎯 ITENS encontrados: ite_pedido=${iteRes.rows[0].ite_pedido} (Qtd: ${iteRes.rows[0].qtd})`);
                }
            } catch (e) {
                // Algumas schemas podem não ter as tabelas
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

globalHunt();
