const { masterPool } = require('./utils/db');

async function checkSchema() {
    try {
        const res = await masterPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'usuarios'
        `);
        console.log('--- Colunas da tabela usuarios ---');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkSchema();
