// ============================================================================
// SalesMasters - Drop PEDIDOS Tables Script
// Execute this with: node drop_pedidos_script.js
// ============================================================================

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
});


async function dropPedidosTables() {
    const client = await pool.connect();

    try {
        console.log('\n========================================');
        console.log('  SalesMasters - Drop PEDIDOS Tables');
        console.log('========================================\n');

        console.log('⚠️  WARNING: This will permanently delete:');
        console.log('   - Table: pedidos');
        console.log('   - Table: itens_ped');
        console.log('   - All associated sequences and indexes\n');

        // Read and execute the SQL script
        const sqlPath = path.join(__dirname, '..', 'scripts_bancodedados', 'drop_pedidos_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');


        console.log('🔄 Executing DROP script...\n');

        await client.query(sql);

        console.log('✅ Tables PEDIDOS and ITENS_PED have been successfully removed!');
        console.log('✅ All associated indexes, foreign keys, and sequences have been dropped.\n');

        // Verify tables are gone
        const verifyQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('pedidos', 'itens_ped')
        `;

        const result = await client.query(verifyQuery);

        if (result.rows.length === 0) {
            console.log('✅ Verification: Tables successfully removed from database.\n');
        } else {
            console.log('⚠️  Warning: Some tables still exist:', result.rows);
        }

        console.log('========================================');
        console.log('  Operation completed successfully!');
        console.log('========================================\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

dropPedidosTables();
