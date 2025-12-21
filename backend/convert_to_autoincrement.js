require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function convertToAutoIncrement() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log("Converting clientes.cli_codigo...");
        await client.query("CREATE SEQUENCE IF NOT EXISTS clientes_cli_codigo_seq");
        await client.query("ALTER TABLE clientes ALTER COLUMN cli_codigo SET DEFAULT nextval('clientes_cli_codigo_seq')");
        await client.query("SELECT setval('clientes_cli_codigo_seq', (SELECT COALESCE(MAX(cli_codigo), 0) FROM clientes))");

        console.log("Converting transportadora.tra_codigo...");
        await client.query("CREATE SEQUENCE IF NOT EXISTS transportadora_tra_codigo_seq");
        await client.query("ALTER TABLE transportadora ALTER COLUMN tra_codigo SET DEFAULT nextval('transportadora_tra_codigo_seq')");
        await client.query("SELECT setval('transportadora_tra_codigo_seq', (SELECT COALESCE(MAX(tra_codigo), 0) FROM transportadora))");

        console.log("Converting cli_ind.cli_lancamento...");
        await client.query("CREATE SEQUENCE IF NOT EXISTS cli_ind_cli_lancamento_seq");
        await client.query("ALTER TABLE cli_ind ALTER COLUMN cli_lancamento SET DEFAULT nextval('cli_ind_cli_lancamento_seq')");
        await client.query("SELECT setval('cli_ind_cli_lancamento_seq', (SELECT COALESCE(MAX(cli_lancamento), 0) FROM cli_ind))");

        await client.query('COMMIT');
        console.log("All tables keys converted to auto-increment successfully.");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Error converting tables:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

convertToAutoIncrement();
