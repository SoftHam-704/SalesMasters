const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false,
    connectionTimeoutMillis: 5000
});

async function explore() {
    try {
        console.log('--- Exploring NDSREP schema ---');

        // 1. Check if schema exists
        const schemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname = 'ndsrep'");
        if (schemas.rows.length === 0) {
            console.log('Schema ndsrep NOT found. Listing available schemas:');
            const allSchemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
            console.table(allSchemas.rows);
            return;
        }
        console.log('✅ Schema ndsrep exists.');

        // 2. Set search_path
        await pool.query('SET search_path TO ndsrep, public');
        console.log('Search path set to ndsrep.');

        // 3. List tables in ndsrep
        const tables = await pool.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'ndsrep'");
        console.log('Tables in ndsrep:');
        console.table(tables.rows);

        // 4. Get industries (fornecedores) mapping
        if (tables.rows.some(t => t.tablename === 'fornecedores')) {
            const industries = await pool.query("SELECT for_codigo, for_nomered, for_nome FROM fornecedores ORDER BY for_nomered");
            console.log('Industries (fornecedores) in ndsrep:');
            console.table(industries.rows);
        }

        // 5. Check crm_interacao structure in ndsrep
        if (tables.rows.some(t => t.tablename === 'crm_interacao')) {
            const columns = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = 'ndsrep' AND table_name = 'crm_interacao'
                ORDER BY ordinal_position
            `);
            console.log('Columns in crm_interacao:');
            console.table(columns.rows);
        }

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

explore();
