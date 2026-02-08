
const { Pool } = require('pg');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectionTimeoutMillis: 10000
};

console.log('Verificando acesso ao banco e schema markpress...');
console.log(`Host: ${config.host}, Port: ${config.port}, DB: ${config.database}`);

const pool = new Pool(config);

async function check() {
    try {
        const res = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'markpress'");
        if (res.rows.length > 0) {
            console.log('✅ SCHEMA "markpress" ENCONTRADO!');

            // List tables in markpress
            const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'markpress'");
            console.log(`Tabelas encontradas no schema markpress (${tables.rows.length}):`);
            tables.rows.forEach(row => console.log(` - ${row.table_name}`));
        } else {
            console.log('❌ SCHEMA "markpress" NÃO ENCONTRADO.');
        }
    } catch (err) {
        console.error('❌ ERRO NA CONEXÃO:', err.message);
    } finally {
        await pool.end();
    }
}

check();
