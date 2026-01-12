const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function main() {
    try {
        const query = `
            SELECT n.nspname as schema, p.proname as name, pg_get_functiondef(p.oid) as definition
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE p.proname = 'get_dashboard_metrics';
        `;
        const res = await pool.query(query);
        if (res.rows.length === 0) {
            console.log("Função 'get_dashboard_metrics' não encontrada localmente.");
        } else {
            res.rows.forEach(row => {
                console.log(`--- SCHEMA: ${row.schema} ---`);
                console.log(row.definition);
                console.log('------------------------------');
            });
        }
    } catch (err) {
        console.error("Erro ao buscar função local:", err.message);
    } finally {
        await pool.end();
    }
}

main();
