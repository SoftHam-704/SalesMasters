
const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function resetSequences() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    const schema = 'repsoma';
    const sequences = ['gen_pedidos_id', 'gen_itens_ped_id'];

    try {
        console.log(`--- Resetando sequences no schema [${schema}] ---`);
        for (const seq of sequences) {
            try {
                // Verificar se a sequence existe no schema
                const checkRes = await pool.query(`
                    SELECT 1 FROM information_schema.sequences 
                    WHERE sequence_schema = $1 AND sequence_name = $2
                `, [schema, seq]);

                if (checkRes.rows.length > 0) {
                    await pool.query(`ALTER SEQUENCE ${schema}.${seq} RESTART WITH 1`);
                    console.log(`✅ Sequence ${schema}.${seq} resetada com sucesso.`);
                } else {
                    console.log(`⚠️ Sequence ${schema}.${seq} não encontrada.`);
                }
            } catch (err) {
                console.error(`❌ Erro ao resetar ${seq}:`, err.message);
            }
        }
    } finally {
        await pool.end();
    }
}

resetSequences();
