const { Pool } = require('pg');

const pool = new Pool({
    host: 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: 13062,
    database: 'basesales',
    user: 'webadmin',
    password: 'ytAyO0u043'
});

async function simulateInsert() {
    try {
        console.log('--- Simulating Agenda INSERT for ro_consult ---');
        await pool.query('SET search_path TO ro_consult, public');

        const query = `
            INSERT INTO agenda (
                usuario_id, empresa_id, titulo, descricao, tipo,
                data_inicio, hora_inicio, data_fim, hora_fim, dia_inteiro,
                status, prioridade,
                cliente_id, contato_id, pedido_codigo, fornecedor_id,
                recorrente, tipo_recorrencia, intervalo_recorrencia,
                lembrete_ativo, lembrete_antes, cor
            ) VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10,
                $11, $12,
                $13, $14, $15, $16,
                $17, $18, $19,
                $20, $21, $22
            ) RETURNING *
        `;

        const values = [
            11, // Camila
            1,  // Empresa 1
            'TESTE ANTIGRAVITY 06-02',
            'Teste de inserção via script de debug',
            'tarefa',
            '2026-02-06',
            '12:00:00',
            null,
            null,
            false,
            'pendente',
            'M',
            null,
            null,
            null,
            null,
            false,
            null,
            1,
            true,
            15,
            '#000000'
        ];

        const result = await pool.query(query, values);
        console.log('✅ INSERT successful! ID:', result.rows[0].id);

        await pool.end();
    } catch (e) {
        console.error('❌ INSERT failed:', e.message);
        console.error(e);
        await pool.end();
    }
}

simulateInsert();
