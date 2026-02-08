const { Pool } = require('pg');
require('dotenv').config({ path: 'e:/Sistemas_ia/SalesMasters/backend/.env' });

async function fixGenerators() {
    const pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: 'basesales',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD
    });

    try {
        console.log('--- Ajustando Generators de Pedidos (Urgente) ---');

        // 1. Obter o maior ID de pedidos (Olhando em repsoma e public para garantir)
        let maxRepsoma = 0;
        try {
            const res = await pool.query('SELECT MAX(ped_numero) as m FROM repsoma.pedidos');
            maxRepsoma = parseInt(res.rows[0].m) || 0;
        } catch (e) {
            console.log(`⚠️  Repsoma pedidos inacessível: ${e.message}`);
        }

        let maxPublic = 0;
        try {
            const res = await pool.query('SELECT MAX(ped_numero) as m FROM public.pedidos');
            maxPublic = parseInt(res.rows[0].m) || 0;
        } catch (e) {
            console.log(`⚠️  Public pedidos inacessível: ${e.message}`);
        }

        const globalMax = Math.max(maxRepsoma, maxPublic, 0);

        console.log(`> Max ID em Repsoma: ${maxRepsoma}`);
        console.log(`> Max ID em Public:  ${maxPublic}`);
        console.log(`> Definindo generators para (current): ${globalMax} -> Next: ${globalMax + 1}`);

        // 2. Atualizar as sequences encontradas no schema Public (que parecem ser as globais)
        // Lista baseada no output do list_all_sequences.js
        const sequences = [
            'public.gen_pedidos_id',          // Generator estilo Firebird
            'public.pedidos_ped_numero_seq'   // Sequence padrão Postgres
        ];

        for (const seq of sequences) {
            try {
                // setval(seq, val) => nextval = val + 1
                await pool.query(`SELECT setval($1, $2)`, [seq, globalMax]);
                console.log(`✅ ${seq} sincronizada com sucesso.`);
            } catch (e) {
                console.log(`⚠️  ${seq} erro: ${e.message}`);
            }
        }

        // 3. Tentar também sequences no schema Repsoma se existirem (embora não listadas)
        // Só por garantia caso tenha sido criado recentemente
        const repsomaSequences = [
            'repsoma.gen_pedidos_id',
            'repsoma.pedidos_ped_numero_seq'
        ];

        for (const seq of repsomaSequences) {
            try {
                await pool.query(`SELECT setval($1, $2)`, [seq, globalMax]);
                console.log(`✅ ${seq} sincronizada com sucesso.`);
            } catch (e) {
                // Silencioso se não existir, pois sabemos que provavelmente não existem
            }
        }

    } catch (err) {
        console.error('❌ Erro Crítico:', err.message);
    } finally {
        await pool.end();
        console.log('🏁 Fim.');
    }
}

fixGenerators();
