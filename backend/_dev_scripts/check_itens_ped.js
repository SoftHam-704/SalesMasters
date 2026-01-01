const { Pool } = require('pg');
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'basesales',
    user: 'postgres',
    password: '@12Pilabo'
});

async function checkItensPedSchema() {
    try {
        console.log('🔍 Verificando schema completo da tabela itens_ped...\n');

        const schema = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'itens_ped'
            ORDER BY ordinal_position
        `);

        schema.rows.forEach(((r, i) => {
            console.log(`${(i + 1).toString().padStart(2)}. ${r.column_name.padEnd(25)} ${r.data_type}`);
        }));

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await pool.end();
    }
}

checkItensPedSchema();
