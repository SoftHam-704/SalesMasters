// Verificar usuários
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.MASTER_DB_HOST,
    port: process.env.MASTER_DB_PORT,
    database: process.env.MASTER_DB_DATABASE,
    user: process.env.MASTER_DB_USER,
    password: process.env.MASTER_DB_PASSWORD,
    ssl: false
});

pool.query('SELECT codigo, nome, sobrenome, senha, master FROM user_nomes')
    .then(r => {
        console.log('\nUsuários no banco:');
        r.rows.forEach(u => console.log(`  [${u.codigo}] ${u.nome} ${u.sobrenome} - Senha: "${u.senha}" ${u.master ? '⭐' : ''}`));
        pool.end();
    })
    .catch(e => { console.error(e); pool.end(); });
