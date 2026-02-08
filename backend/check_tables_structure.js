
const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043',
});

async function checkStructure() {
    try {
        console.log('--- cad_prod Columns ---');
        const resProd = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'cad_prod'`);
        console.log(resProd.rows.map(r => r.column_name).join(', '));

        console.log('\n--- cli_descpro Columns ---');
        const resDesc = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'cli_descpro'`);
        console.log(resDesc.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Sample Data cad_prod ---');
        const sampleProd = await pool.query(`SELECT pro_codprod, pro_grupo FROM ro_consult.cad_prod LIMIT 5`);
        console.table(sampleProd.rows);

        console.log('\n--- Sample Data cli_descpro ---');
        const sampleDesc = await pool.query(`SELECT cli_codigo, cli_forcodigo, cli_grupo FROM ro_consult.cli_descpro LIMIT 5`);
        console.table(sampleDesc.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkStructure();
