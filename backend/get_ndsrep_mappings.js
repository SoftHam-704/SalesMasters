const { Pool } = require('pg');

async function getMappings() {
    const pool = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
    });

    try {
        console.log('--- Fetching mappings for NDSREP ---');

        const industries = await pool.query("SELECT for_codigo, for_nomered FROM ndsrep.fornecedores");
        console.log('Industries:');
        console.table(industries.rows);

        const sellers = await pool.query("SELECT ven_codigo, ven_nome FROM ndsrep.vendedores");
        console.log('Sellers:');
        console.table(sellers.rows);

        const clients = await pool.query("SELECT cli_codigo, cli_nomred FROM ndsrep.clientes LIMIT 10");
        console.log('Clients (First 10):');
        console.table(clients.rows);

        // Check crm_interacao columns to be sure
        const columns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ndsrep' AND table_name = 'crm_interacao'
            ORDER BY ordinal_position
        `);
        console.log('CRM Interacao Columns:');
        console.table(columns.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

getMappings();
