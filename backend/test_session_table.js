const { masterPool } = require('./utils/db');

async function testSessionTable() {
    try {
        console.log('Testing sessoes_ativas table structure...');
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'sessoes_ativas'
        `);
        console.log('Columns:', res.rows);
        process.exit(0);
    } catch (err) {
        console.error('FAILED:', err.message);
        process.exit(1);
    }
}

testSessionTable();
