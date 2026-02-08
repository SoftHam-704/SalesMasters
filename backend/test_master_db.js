const { masterPool } = require('./utils/db');

async function testConnection() {
    try {
        console.log('Testing Master Pool connection...');
        const res = await masterPool.query('SELECT NOW()');
        console.log('Connection SUCCESS! Current time:', res.rows[0]);

        console.log('Testing Empresas table...');
        const resEmp = await masterPool.query('SELECT COUNT(*) FROM empresas');
        console.log('Count:', resEmp.rows[0].count);

        process.exit(0);
    } catch (err) {
        console.error('Connection FAILED:', err.message);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

testConnection();
