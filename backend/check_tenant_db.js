
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function checkTenantSchemas() {
    try {
        console.log(`Verificando banco: ${process.env.DB_NAME} em ${process.env.DB_HOST}`);

        const schemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
        console.log('Schemas encontrados:', schemas.rows.map(r => r.nspname));

        for (const schema of schemas.rows) {
            const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1`, [schema.nspname]);
            console.log(`Tabelas no schema [${schema.nspname}]:`, tables.rows.length);
            if (schema.nspname === 'sevenrep') {
                console.log('Amostra de tabelas em sevenrep:', tables.rows.slice(0, 10).map(t => t.table_name));
            }
        }

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        await pool.end();
    }
}

checkTenantSchemas();
