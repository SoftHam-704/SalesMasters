const { Pool } = require('pg');
const fs = require('fs');

async function check() {
    const pool = new Pool({ connectionString: 'postgres://postgres:S0fth4m@localhost:5432/basesales' });
    try {
        const res = await pool.query('SELECT MAX(ped_data) as last_date FROM pedidos');
        fs.writeFileSync('e:\\Sistemas_ia\\SalesMasters\\backend\\sync_check.json', JSON.stringify(res.rows[0]));
        console.log('Success');
    } catch (err) {
        fs.writeFileSync('e:\\Sistemas_ia\\SalesMasters\\backend\\sync_check.json', JSON.stringify({ error: err.message }));
        console.log('Error');
    } finally {
        await pool.end();
    }
}
check();
