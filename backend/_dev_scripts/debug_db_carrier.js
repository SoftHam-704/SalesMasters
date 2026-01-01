const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTransportadoras() {
    try {
        console.log('Connecting to DB...');
        const res = await pool.query('SELECT * FROM transportadora LIMIT 5');
        console.log('Query successful!');
        console.log('Row count:', res.rowCount);
        if (res.rowCount > 0) {
            console.log('First row columns:', Object.keys(res.rows[0]));
            console.log('First row data:', res.rows[0]);
        } else {
            console.log('Table is empty.');
        }
    } catch (err) {
        console.error('Error executing query:', err);
    } finally {
        await pool.end();
    }
}

checkTransportadoras();
