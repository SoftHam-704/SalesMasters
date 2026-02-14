const { masterPool } = require('./utils/db');

async function checkCols() {
    try {
        const res = await masterPool.query("SELECT * FROM sessoes_ativas LIMIT 1");
        console.log('Colunas:', Object.keys(res.rows[0] || {}).join(', '));
        process.exit(0);
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
}
checkCols();
