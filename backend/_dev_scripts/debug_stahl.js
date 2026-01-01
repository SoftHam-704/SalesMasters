require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

async function checkStahl() {
    try {
        console.log('Searching for STAHL...');
        // Only use for_nomered as for_razsoc failed
        const supplierRes = await pool.query("SELECT * FROM fornecedores WHERE for_nomered ILIKE '%STAHL%'");

        if (supplierRes.rows.length === 0) {
            console.log('No supplier found matching STAHL');
            // List all suppliers to see what we have
            const allSuppliers = await pool.query("SELECT for_codigo, for_nomered FROM fornecedores LIMIT 10");
            console.log('First 10 suppliers:', allSuppliers.rows);
            return;
        }

        const supplier = supplierRes.rows[0];
        console.log('Found Supplier:', supplier.for_codigo, supplier.for_nomered);

        console.log('Checking price tables for this supplier in cad_tabelaspre...');

        const tablesQuery = `
            SELECT DISTINCT itab_tabela, itab_idindustria 
            FROM cad_tabelaspre 
            WHERE itab_idindustria = $1
        `;

        const tablesRes = await pool.query(tablesQuery, [supplier.for_codigo]);
        console.log(`Found ${tablesRes.rows.length} price tables:`, tablesRes.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkStahl();
