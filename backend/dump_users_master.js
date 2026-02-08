
const { masterPool } = require('./utils/db');

async function check() {
    try {
        const res = await masterPool.query(`
            SELECT id, nome, sobrenome, email, e_admin, ativo 
            FROM usuarios
        `);
        console.log('Usuários no Master DB:');
        console.table(res.rows);
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await masterPool.end();
        process.exit(0);
    }
}

check();
