const { masterPool } = require('./utils/db');

async function inspectPedidosTable() {
    try {
        console.log('Inspecting columns of "pedidos" table in Tenant DB...');
        // We'll use the tenant pool for the specific database mentioned in .env
        const { Pool } = require('pg');
        require('dotenv').config();
        const pool = new Pool({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD
        });

        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'pedidos'
            AND table_schema = 'public'
            AND is_nullable = 'NO'
            ORDER BY ordinal_position
        `);
        console.log('Columns found:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('FAILED to inspect table:', err.message);
        process.exit(1);
    }
}

inspectPedidosTable();
