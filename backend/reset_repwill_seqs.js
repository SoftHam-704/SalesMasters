const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
    connectionTimeoutMillis: 10000
});

const schema = 'repwill';

const tables = [
    { name: 'pedidos', pk: 'ped_numero' }, // or ped_id? Let's check. Default usually numeric PK.
    // If ped_numero IS the PK and it's manual, sequence might not matter unless it's a serial.
    // However, if there's a ped_id serial column, we must reset that.
    // Let's assume standard serial usage for specific columns.
];

// Better approach: Find all sequences in the schema and reset them to MAX(column)
// But we need to know WHICH column the sequence belongs to.
// PostgreSQL has `pg_get_serial_sequence` but it requires table name and column name.

async function resetSequences() {
    try {
        console.log(`🚀 Resetting Sequences for schema: ${schema}...`);

        // 1. Get all tables in schema
        const tablesRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = $1 AND table_type = 'BASE TABLE'
        `, [schema]);

        const tableNames = tablesRes.rows.map(r => r.table_name);

        for (const table of tableNames) {
            // Find columns with default nextval() - these use sequences
            const colsRes = await pool.query(`
                SELECT column_name, column_default
                FROM information_schema.columns
                WHERE table_schema = $1 AND table_name = $2
                AND column_default LIKE 'nextval%'
            `, [schema, table]);

            for (const col of colsRes.rows) {
                const colName = col.column_name;
                const seqExpr = col.column_default;

                // Extract sequence name from "nextval('schema.seq_name'::regclass)"
                const match = seqExpr.match(/'([^']+)'/);
                const seqName = match ? match[1] : null;

                if (seqName) {
                    // Get Max Value
                    const maxRes = await pool.query(`SELECT MAX("${colName}") as max_val FROM "${schema}"."${table}"`);
                    const maxVal = maxRes.rows[0].max_val || 0;
                    const nextVal = parseInt(maxVal) + 1;

                    console.log(`🔧 Table: ${table}, Col: ${colName} -> Max: ${maxVal}. Resetting sequence...`);

                    // Reset Sequence
                    // Handle schema buffer in setval if seqName includes schema or not.
                    // Usually seqName from default string includes schema if it's explicitly set, or might be text.
                    // Safest to use strict SQL with identifiers.

                    // Actually, if we use setval with the string from nextval, it should work.
                    // But seqName might be "repwill.pedidos_ped_id_seq".

                    await pool.query(`SELECT setval($1, $2)`, [seqName, nextVal]);
                    console.log(`✅  Sequence ${seqName} set to ${nextVal}`);
                }
            }
        }

        console.log('🎉 All sequences synchronized!');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        pool.end();
    }
}

resetSequences();
