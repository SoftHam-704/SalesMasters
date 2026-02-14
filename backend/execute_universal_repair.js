const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function runRepair() {
    const pool = new Pool({
        host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
        port: 13062,
        database: 'basesales',
        user: 'webadmin',
        password: 'ytAyO0u043',
        ssl: false
    });

    try {
        console.log('🚀 Executing universal repair script...');
        const sqlPath = path.join(__dirname, 'sql', 'repair_suppliers_and_stats.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        const res = await pool.query(sql);
        console.log('✅ Repair completed successfully!');

    } catch (err) {
        console.error('❌ Error during repair:', err.message);
    } finally {
        await pool.end();
    }
}

runRepair();
