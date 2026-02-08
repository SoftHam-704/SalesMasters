const { Pool } = require('pg');

async function getLookups() {
    const pool = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
    });

    try {
        console.log('--- Lookups for NDSREP ---');

        const tipos = await pool.query("SELECT id, descricao FROM ndsrep.crm_tipo_interacao");
        console.log('Tipos:');
        console.table(tipos.rows);

        const canais = await pool.query("SELECT id, descricao FROM ndsrep.crm_canal");
        console.log('Canais:');
        console.table(canais.rows);

        const vendedores = await pool.query("SELECT ven_codigo, ven_nome FROM ndsrep.vendedores");
        console.log('Vendedores:');
        console.table(vendedores.rows);

        const industries = await pool.query("SELECT for_codigo, for_nomered FROM ndsrep.fornecedores");
        console.log('Industries:');
        console.table(industries.rows);

    } catch (err) {
        console.error('ERRO:', err.message);
    } finally {
        await pool.end();
    }
}

getLookups();
