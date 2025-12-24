require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createPedidosSequence() {
    try {
        console.log('🔧 Criando sequência gen_pedidos_id...');

        // Verificar se a sequência já existe
        const checkSeq = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_sequences 
                WHERE schemaname = 'public' AND sequencename = 'gen_pedidos_id'
            ) as exists
        `);

        if (checkSeq.rows[0].exists) {
            console.log('⚠️  Sequência gen_pedidos_id já existe');

            // Mostrar o valor atual
            const currentVal = await pool.query("SELECT last_value FROM gen_pedidos_id");
            console.log(`📊 Valor atual da sequência: ${currentVal.rows[0].last_value}`);
        } else {
            // Criar a sequência começando em 1
            await pool.query(`
                CREATE SEQUENCE gen_pedidos_id
                START WITH 1
                INCREMENT BY 1
                NO MINVALUE
                NO MAXVALUE
                CACHE 1
            `);

            console.log('✅ Sequência gen_pedidos_id criada com sucesso!');
            console.log('📊 Sequência iniciada em: 1');
        }

        // Testar a sequência
        const testNext = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
        console.log(`🧪 Teste: Próximo número = ${testNext.rows[0].next_num}`);

        // Resetar para o valor anterior (já que foi só um teste)
        await pool.query("SELECT setval('gen_pedidos_id', currval('gen_pedidos_id') - 1)");
        console.log('✅ Sequência resetada após teste');

    } catch (error) {
        console.error('❌ Erro ao criar sequência:', error);
    } finally {
        await pool.end();
    }
}

createPedidosSequence();
