const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkCadProdPK() {
    try {
        const schema = await pool.query(`
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'cad_prod'
            ORDER BY ordinal_position
            LIMIT 5
        `);
        console.log('Colunas iniciais de cad_prod:');
        schema.rows.forEach(r => console.log(`   ${r.column_name} (${r.data_type})`));

        const sample = await pool.query('SELECT * FROM cad_prod LIMIT 1');
        console.log('\nAmostra cad_prod:');
        console.log(sample.rows[0]);

    } catch (err) {
        console.error(err.message);
    } finally {
        await pool.end();
    }
}

checkCadProdPK();
