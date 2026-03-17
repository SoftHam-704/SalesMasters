const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });
const fs = require('fs');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'basesales',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: false
});

async function applySQL() {
    try {
        const schema = 'repsoma'; // Targeting repsoma where the data is
        let sql = fs.readFileSync('e:/Sistemas_ia/SalesMasters/backend/sql/fn_gerencial_clientes.sql', 'utf8');

        // Dynamically replace ro_consult with the target schema
        sql = sql.replace(/ro_consult\./g, `${schema}.`);

        await pool.query(sql);
        console.log(`✅ Função fn_gerencial_clientes aplicada com sucesso no schema ${schema}.`);
    } catch (err) {
        console.error("❌ Erro ao aplicar SQL:", err.message);
    } finally {
        await pool.end();
    }
}
applySQL();
