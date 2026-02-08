require('dotenv').config({ path: 'backend/.env' });
const { Pool } = require('pg');

async function checkTables() {
    const config = {
        host: process.env.MASTER_DB_HOST,
        port: process.env.MASTER_DB_PORT,
        user: process.env.MASTER_DB_USER,
        password: process.env.MASTER_DB_PASSWORD
    };

    const dbs = ['salesmasters_master', 'basesales'];
    for (const db of dbs) {
        console.log(`Checking DB: ${db}`);
        const pool = new Pool({ ...config, database: db });
        try {
            const res = await pool.query("SELECT COUNT(*) FROM empresas");
            console.log(`✅ ${db} HAS empresas table with ${res.rows[0].count} records.`);
        } catch (e) {
            console.log(`❌ ${db} does NOT have empresas table or error: ${e.message}`);
        }
        await pool.end();
    }
}

checkTables();
