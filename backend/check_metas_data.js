const { Pool } = require('pg');
const fs = require('fs');

async function check() {
    const pool = new Pool({
        host: 'localhost',
        port: 5432,
        database: 'basesales',
        user: 'postgres',
        password: '@12Pilabo'
    });
    try {
        const res = await pool.query('SELECT met_ano, count(*) FROM ind_metas GROUP BY met_ano');
        fs.writeFileSync('e:\\Sistemas_ia\\SalesMasters\\backend\\metas_check.json', JSON.stringify(res.rows));
        console.log('Success');
    } catch (err) {
        fs.writeFileSync('e:\\Sistemas_ia\\SalesMasters\\backend\\metas_check.json', JSON.stringify({ error: err.message }));
        console.log('Error');
    } finally {
        await pool.end();
    }
}
check();
