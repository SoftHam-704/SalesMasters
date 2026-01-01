const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432
});

async function run() {
    try {
        console.log('--- Checking CRM Data ---');

        const resTipos = await pool.query("SELECT COUNT(*) FROM crm_tipo_interacao");
        console.log(`Tipos: ${resTipos.rows[0].count}`);

        const resCanais = await pool.query("SELECT COUNT(*) FROM crm_canal");
        console.log(`Canais: ${resCanais.rows[0].count}`);

        const resResultados = await pool.query("SELECT COUNT(*) FROM crm_resultado");
        console.log(`Resultados: ${resResultados.rows[0].count}`);

        const resSuppliers = await pool.query("SELECT COUNT(*) FROM fornecedores");
        console.log(`Fornecedores (Suppliers): ${resSuppliers.rows[0].count}`);

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
