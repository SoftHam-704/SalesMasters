const { getTenantPool } = require('./utils/db');
const dbConfig = {
    host: 'localhost',
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo',
    port: 5432,
    schema: 'public'
};

async function checkUserNomes() {
    try {
        const pool = getTenantPool('99999999000199', dbConfig);
        const res = await pool.query("SELECT codigo, nome, sobrenome, usuario, senha, master FROM user_nomes");
        console.log('--- Conteúdo de user_nomes no schema PUBLIC ---');
        console.table(res.rows);
        process.exit(0);
    } catch (e) {
        console.error('❌ Erro ao ler user_nomes:', e.message);
        process.exit(1);
    }
}
checkUserNomes();
