
const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

const pool = new Pool(config);

async function check() {
    try {
        const tables = ['cad_prod', 'cad_tabelaspre', 'fornecedores', 'clientes'];
        for (const table of tables) {
            const res = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_schema = 'markpress' AND table_name = '${table}'`);
            console.log(`\nColunas de markpress.${table}:`);
            res.rows.forEach(row => console.log(` - ${row.column_name}`));
        }
    } catch (err) {
        console.error('Erro:', err.message);
    } finally {
        await pool.end();
    }
}

check();
