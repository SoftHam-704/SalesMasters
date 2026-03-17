const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function universalRepairSequences() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- STARTING UNIVERSAL SEQUENCE REPAIR ---');

        // 1. Get all tenant schemas
        const schemasRes = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
            AND schema_name NOT LIKE 'pg_temp_%'
            AND schema_name NOT LIKE 'pg_hash_%'
        `);
        const schemas = schemasRes.rows.map(r => r.schema_name);

        for (const schema of schemas) {
            process.stdout.write(`Repairing schema [${schema}]... `);

            // Check if pedidos table exists
            const tableRes = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'pedidos'`, [schema]);
            if (tableRes.rows.length === 0) {
                console.log('Skipped (no pedidos table).');
                continue;
            }

            // Get max ped_numero
            const maxRes = await pool.query(`SELECT MAX(ped_numero) as m FROM "${schema}".pedidos`);
            const maxVal = parseInt(maxRes.rows[0].m) || 0;

            // 2. Ensure gen_pedidos_id exists
            const check1 = await pool.query(`SELECT 1 FROM information_schema.sequences WHERE sequence_schema = $1 AND sequence_name = 'gen_pedidos_id'`, [schema]);
            if (check1.rows.length === 0) {
                await pool.query(`CREATE SEQUENCE "${schema}"."gen_pedidos_id"`);
            }
            await pool.query(`SELECT setval('"${schema}"."gen_pedidos_id"', $1, $2)`, [maxVal > 0 ? maxVal : 1, maxVal > 0]);

            // 3. Ensure pedidos_ped_numero_seq exists
            const check2 = await pool.query(`SELECT 1 FROM information_schema.sequences WHERE sequence_schema = $1 AND sequence_name = 'pedidos_ped_numero_seq'`, [schema]);
            if (check2.rows.length === 0) {
                await pool.query(`CREATE SEQUENCE "${schema}"."pedidos_ped_numero_seq"`);
            }
            await pool.query(`SELECT setval('"${schema}"."pedidos_ped_numero_seq"', $1, $2)`, [maxVal > 0 ? maxVal : 1, maxVal > 0]);

            console.log(`DONE. Synced to ${maxVal}.`);
        }

        console.log('--- ALL SCHEMAS REPAIRED ---');

    } catch (err) {
        console.error('Repair Error:', err);
    } finally {
        await pool.end();
    }
}

universalRepairSequences();
