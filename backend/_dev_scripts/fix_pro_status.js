const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: 'localhost', port: 5432, database: 'basesales', user: 'postgres', password: '@12Pilabo'
});

async function checkStatus() {
    try {
        console.log('🔍 Checking pro_status for industry 23...');
        const res = await pool.query('SELECT pro_status, COUNT(*) FROM cad_prod WHERE pro_industria = 23 GROUP BY pro_status');
        console.log('Results:', res.rows);

        if (res.rows.length > 0) {
            console.log('🛠️ Fixing pro_status to TRUE for all products of industry 23...');
            await pool.query('UPDATE cad_prod SET pro_status = true WHERE pro_industria = 23');
            console.log('✅ Done!');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
checkStatus();
