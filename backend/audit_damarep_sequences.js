const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function auditSequences() {
    const schema = 'damarep';
    try {
        console.log(`--- AUDITANDO SEQUENCES NO SCHEMA: ${schema} ---`);

        const res = await pool.query(`
            SELECT 
                t.table_name, 
                c.column_name, 
                pg_get_serial_sequence(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name), c.column_name) as seq_name
            FROM information_schema.tables t
            JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
            WHERE t.table_schema = $1 
              AND t.table_type = 'BASE TABLE'
              AND pg_get_serial_sequence(quote_ident(t.table_schema) || '.' || quote_ident(t.table_name), c.column_name) IS NOT NULL
        `, [schema]);

        console.log(`Encontradas ${res.rows.length} colunas com auto-incremento.\n`);
        console.log('TABELA'.padEnd(30), 'COLUNA'.padEnd(20), 'MAX VAL'.padEnd(10), 'SEQ VAL'.padEnd(10), 'STATUS');
        console.log('-'.repeat(85));

        for (const row of res.rows) {
            const { table_name, column_name, seq_name } = row;

            // Valor máximo na tabela
            const maxRes = await pool.query(`SELECT MAX("${column_name}") FROM ${schema}."${table_name}"`);
            const maxVal = parseInt(maxRes.rows[0].max) || 0;

            // Valor atual da sequence
            const seqRes = await pool.query(`SELECT last_value FROM ${seq_name}`);
            const seqVal = parseInt(seqRes.rows[0].last_value);

            const status = seqVal >= maxVal ? '✅ OK' : '❌ FIX REQ';

            console.log(
                table_name.padEnd(30),
                column_name.padEnd(20),
                maxVal.toString().padEnd(10),
                seqVal.toString().padEnd(10),
                status
            );

            // Se estiver errado, já corrige
            if (seqVal < maxVal) {
                await pool.query(`SELECT setval('${seq_name}', ${maxVal})`);
                console.log(`   -> 🛠️ Sequence corrigida para ${maxVal}`);
            }
        }

    } catch (err) {
        console.error('❌ ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

auditSequences();
