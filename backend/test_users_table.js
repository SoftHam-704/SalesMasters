const { masterPool } = require('./utils/db');

async function testUsersTable() {
    try {
        console.log('Testing usuarios table structure...');
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios'
        `);
        console.log('Columns:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}

testUsersTable();
