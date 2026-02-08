const { masterPool } = require('./utils/db');

async function testUserNomes() {
    try {
        console.log('Testing user_nomes table...');
        const res = await masterPool.query("SELECT * FROM information_schema.tables WHERE table_name = 'user_nomes'");
        if (res.rows.length > 0) {
            console.log('Table user_nomes EXISTS.');
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
