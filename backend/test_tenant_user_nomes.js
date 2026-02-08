const { Pool } = require('pg');
require('dotenv').config();

const tenantPool = new Pool({
    host: process.env.DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.DB_PORT || 13062,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'webadmin',
    password: process.env.DB_PASSWORD
});

async function testUserNomes() {
    try {
        console.log('Testing user_nomes table in Tenant DB...');
        const res = await tenantPool.query("SELECT * FROM information_schema.tables WHERE table_name = 'user_nomes'");
        if (res.rows.length > 0) {
            console.log('Table user_nomes EXISTS.');
            const resCols = await tenantPool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'user_nomes'");
            console.log('Columns:', resCols.rows.map(r => r.column_name));
        } else {
            console.log('Table user_nomes DOES NOT EXIST.');
        }
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}

testUserNomes();
