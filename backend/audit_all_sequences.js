const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function auditAllSchemas() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Universal Sequence Audit ---');

        // 1. Get all schemas that are likely tenants (not system ones)
        const schemasRes = await pool.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast', 'public')
            AND schema_name NOT LIKE 'pg_temp_%'
            AND schema_name NOT LIKE 'pg_hash_%'
        `);
        const schemas = schemasRes.rows.map(r => r.schema_name);

        const auditResults = [];

        for (const schema of schemas) {
            const result = {
                schema,
                has_pedidos: false,
                ped_num_default: null,
                seq_ped_num_exists: false,
                seq_gen_ped_exists: false,
                max_ped_numero: 0,
                seq_ped_val: null,
                seq_gen_val: null,
                status: 'OK'
            };

            // Check table
            const tableRes = await pool.query(`SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'pedidos'`, [schema]);
            if (tableRes.rows.length === 0) {
                result.status = 'No pedidos table';
                auditResults.push(result);
                continue;
            }
            result.has_pedidos = true;

            // Check default
            const colRes = await pool.query(`
                SELECT column_default 
                FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = 'pedidos' AND column_name = 'ped_numero'
            `, [schema]);
            result.ped_num_default = colRes.rows[0]?.column_default || 'NONE';

            // Check sequences
            const seq1Res = await pool.query(`SELECT 1 FROM information_schema.sequences WHERE sequence_schema = $1 AND sequence_name = 'pedidos_ped_numero_seq'`, [schema]);
            result.seq_ped_num_exists = seq1Res.rows.length > 0;

            const seq2Res = await pool.query(`SELECT 1 FROM information_schema.sequences WHERE sequence_schema = $1 AND sequence_name = 'gen_pedidos_id'`, [schema]);
            result.seq_gen_ped_exists = seq2Res.rows.length > 0;

            // Check max value
            const maxRes = await pool.query(`SELECT MAX(ped_numero) as m FROM "${schema}".pedidos`);
            result.max_ped_numero = parseInt(maxRes.rows[0].m) || 0;

            // Get current sequence values if they exist
            if (result.seq_ped_num_exists) {
                try {
                    const valRes = await pool.query(`SELECT last_value FROM "${schema}"."pedidos_ped_numero_seq"`);
                    result.seq_ped_val = valRes.rows[0].last_value;
                } catch (e) {
                    // Maybe it was never used
                }
            }
            if (result.seq_gen_ped_exists) {
                try {
                    const valRes = await pool.query(`SELECT last_value FROM "${schema}"."gen_pedidos_id"`);
                    result.seq_gen_val = valRes.rows[0].last_value;
                } catch (e) { }
            }

            // Determine status
            if (!result.seq_ped_num_exists || !result.seq_gen_ped_exists) {
                result.status = 'MISSING SEQUENCES';
            } else if (result.max_ped_numero > result.seq_ped_val && result.seq_ped_val !== null) {
                result.status = 'OUT OF SYNC';
            }

            auditResults.push(result);
        }

        console.table(auditResults.map(r => ({
            Schema: r.schema,
            Status: r.status,
            MaxID: r.max_ped_numero,
            SeqVal: r.seq_ped_val,
            GenVal: r.seq_gen_val,
            Missing: (!r.seq_ped_num_exists ? 'ped_seq ' : '') + (!r.seq_gen_ped_exists ? 'gen_seq' : '')
        })));

    } catch (err) {
        console.error('Audit Error:', err);
    } finally {
        await pool.end();
    }
}

auditAllSchemas();
