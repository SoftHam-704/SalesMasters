// =====================================================
// 📅 SALESMASTER AGENDA PRO - Endpoints da API
// Criado em: 2026-01-15
// Usando schema PUBLIC para testes
// =====================================================

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // ==================== CRUD BÁSICO ====================

    // GET - Listar tarefas do usuário logado
    router.get('/', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const {
                data_inicio,
                data_fim,
                status,
                tipo,
                visualizacao
            } = req.query;

            const empresaId = req.headers['x-empresa-id'];
            if (!empresaId) {
                return res.status(401).json({ success: false, message: 'Empresa não identificada' });
            }

            let query = `
                SELECT 
                    a.*
                FROM agenda a
                WHERE a.usuario_id = $1 AND a.empresa_id = $2
            `;
            const params = [usuarioId, empresaId];
            let paramIndex = 3;

            // Filtro por período
            if (data_inicio) {
                query += ` AND a.data_inicio >= $${paramIndex}`;
                params.push(data_inicio);
                paramIndex++;
            }
            if (data_fim) {
                query += ` AND a.data_inicio <= $${paramIndex}`;
                params.push(data_fim);
                paramIndex++;
            }

            // Filtro por status
            if (status && status !== 'todos') {
                query += ` AND a.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }

            // Filtro por tipo
            if (tipo && tipo !== 'todos') {
                query += ` AND a.tipo = $${paramIndex}`;
                params.push(tipo);
                paramIndex++;
            }

            query += ` ORDER BY a.data_inicio ASC, a.hora_inicio ASC NULLS LAST`;

            console.log('🔍 [AGENDA QUERY] Executing:', { query, params }); // Debug
            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows,
                total: result.rowCount
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao listar tarefas:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Resumo para o Dashboard (painel de alertas)
    router.get('/resumo', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            const empresaId = req.headers['x-empresa-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            if (!empresaId) {
                return res.status(401).json({ success: false, message: 'Empresa não identificada' });
            }

            // Tarefas de hoje
            const tarefasHoje = await pool.query(`
                SELECT COUNT(*) as total 
                FROM agenda 
                WHERE usuario_id = $1 AND empresa_id = $2
                  AND status IN ('pendente', 'em_andamento')
                  AND data_inicio = CURRENT_DATE
            `, [usuarioId, empresaId]);

            // Tarefas atrasadas
            const atrasadas = await pool.query(`
                SELECT COUNT(*) as total 
                FROM agenda 
                WHERE usuario_id = $1 AND empresa_id = $2
                  AND status IN ('pendente', 'em_andamento')
                  AND data_inicio < CURRENT_DATE
            `, [usuarioId, empresaId]);

            // Próximo compromisso
            const proximo = await pool.query(`
                SELECT titulo, hora_inicio, tipo
                FROM agenda 
                WHERE usuario_id = $1 AND empresa_id = $2
                  AND status IN ('pendente', 'em_andamento')
                  AND data_inicio = CURRENT_DATE
                  AND (hora_inicio IS NULL OR hora_inicio >= CURRENT_TIME)
                ORDER BY hora_inicio ASC NULLS LAST
                LIMIT 1
            `, [usuarioId, empresaId]);

            // Aniversários de hoje (contatos de clientes)
            const aniversarios = await pool.query(`
                SELECT con_nome, c.cli_nomred as empresa
                FROM contato_cli cc
                JOIN clientes c ON c.cli_codigo = cc.con_codigo
                WHERE EXTRACT(MONTH FROM cc.con_dtnasc) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(DAY FROM cc.con_dtnasc) = EXTRACT(DAY FROM CURRENT_DATE)
                LIMIT 5
            `).catch(() => ({ rows: [] }));

            res.json({
                success: true,
                data: {
                    tarefas_hoje: parseInt(tarefasHoje.rows[0]?.total || 0),
                    atrasadas: parseInt(atrasadas.rows[0]?.total || 0),
                    proximo_compromisso: proximo.rows[0] || null,
                    aniversarios_hoje: aniversarios.rows
                }
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao buscar resumo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Buscar tarefa por ID
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            const empresaId = req.headers['x-empresa-id'];

            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            const result = await pool.query(`
                SELECT 
                    a.*,
                    c.cli_nomred as cliente_nome,
                    c.cli_fone as cliente_telefone,
                    f.for_nomered as fornecedor_nome
                FROM agenda a
                LEFT JOIN clientes c ON c.cli_codigo = a.cliente_id
                LEFT JOIN fornecedores f ON f.for_codigo = a.fornecedor_id
                WHERE a.id = $1 AND a.usuario_id = $2 AND a.empresa_id = $3
            `, [id, usuarioId, empresaId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao buscar tarefa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Criar nova tarefa
    router.post('/', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            const empresaId = req.headers['x-empresa-id'];

            if (!usuarioId || !empresaId) {
                return res.status(401).json({ success: false, message: 'Identificação necessária ausente' });
            }
            const tarefa = req.body;

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
                usuarioId,
                empresaId,
                tarefa.titulo,
                tarefa.descricao || null,
                tarefa.tipo || 'tarefa',
                tarefa.data_inicio,
                tarefa.hora_inicio || null,
                tarefa.data_fim || null,
                tarefa.hora_fim || null,
                tarefa.dia_inteiro || false,
                tarefa.status || 'pendente',
                tarefa.prioridade || 'M',
                tarefa.cliente_id || null,
                tarefa.contato_id || null,
                tarefa.pedido_codigo || null,
                tarefa.fornecedor_id || null,
                tarefa.recorrente || false,
                tarefa.tipo_recorrencia || null,
                tarefa.intervalo_recorrencia || 1,
                tarefa.lembrete_ativo !== false,
                tarefa.lembrete_antes || 15,
                tarefa.cor || null
            ];

            const result = await pool.query(query, values);

            console.log(`✅ [AGENDA] Tarefa criada: ${tarefa.titulo}`);

            res.status(201).json({
                success: true,
                message: 'Tarefa criada com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao criar tarefa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Atualizar tarefa
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const tarefa = req.body;

            const query = `
                UPDATE agenda SET
                    titulo = $1,
                    descricao = $2,
                    tipo = $3,
                    data_inicio = $4,
                    hora_inicio = $5,
                    data_fim = $6,
                    hora_fim = $7,
                    dia_inteiro = $8,
                    status = $9,
                    prioridade = $10,
                    cliente_id = $11,
                    contato_id = $12,
                    pedido_codigo = $13,
                    fornecedor_id = $14,
                    recorrente = $15,
                    tipo_recorrencia = $16,
                    lembrete_ativo = $17,
                    lembrete_antes = $18,
                    cor = $19
                WHERE id = $20 AND usuario_id = $21 AND empresa_id = $22
                RETURNING *
            `;

            const values = [
                tarefa.titulo,
                tarefa.descricao || null,
                tarefa.tipo || 'tarefa',
                tarefa.data_inicio,
                tarefa.hora_inicio || null,
                tarefa.data_fim || null,
                tarefa.hora_fim || null,
                tarefa.dia_inteiro || false,
                tarefa.status || 'pendente',
                tarefa.prioridade || 'M',
                tarefa.cliente_id || null,
                tarefa.contato_id || null,
                tarefa.pedido_codigo || null,
                tarefa.fornecedor_id || null,
                tarefa.recorrente || false,
                tarefa.tipo_recorrencia || null,
                tarefa.lembrete_ativo !== false,
                tarefa.lembrete_antes || 15,
                tarefa.cor || null,
                id,
                usuarioId,
                req.headers['x-empresa-id']
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
            }

            console.log(`✅ [AGENDA] Tarefa atualizada: ${tarefa.titulo}`);

            res.json({
                success: true,
                message: 'Tarefa atualizada com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao atualizar tarefa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Atualizar status (ação rápida)
    router.patch('/:id/status', async (req, res) => {
        try {
            const { id } = req.params;
            const { status, notas_conclusao } = req.body;
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            let query = `
                UPDATE agenda SET
                    status = $1,
                    notas_conclusao = $2
            `;
            const values = [status, notas_conclusao || null];

            // Se concluída, registra timestamp
            if (status === 'concluida') {
                query += `, concluido_em = NOW()`;
            }

            const empresaId = req.headers['x-empresa-id'];
            query += ` WHERE id = $${values.length + 1} AND usuario_id = $${values.length + 2} AND empresa_id = $${values.length + 3} RETURNING *`;
            values.push(id, usuarioId, empresaId);

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
            }

            const statusLabels = {
                'pendente': 'Pendente',
                'em_andamento': 'Em Andamento',
                'concluida': 'Concluída',
                'adiada': 'Adiada',
                'cancelada': 'Cancelada'
            };

            res.json({
                success: true,
                message: `Tarefa marcada como ${statusLabels[status]}!`,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao atualizar status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Adiar tarefa
    router.patch('/:id/adiar', async (req, res) => {
        try {
            const { id } = req.params;
            const { nova_data, nova_hora, motivo } = req.body;
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            const empresaId = req.headers['x-empresa-id'];
            // Buscar tarefa atual para salvar data original
            const tarefaAtual = await pool.query(
                'SELECT data_inicio, data_original, vezes_adiada FROM agenda WHERE id = $1 AND usuario_id = $2 AND empresa_id = $3',
                [id, usuarioId, empresaId]
            );

            if (tarefaAtual.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
            }

            const dataOriginal = tarefaAtual.rows[0].data_original || tarefaAtual.rows[0].data_inicio;
            const vezesAdiada = (tarefaAtual.rows[0].vezes_adiada || 0) + 1;

            const result = await pool.query(`
                UPDATE agenda SET
                    data_inicio = $1,
                    hora_inicio = $2,
                    data_original = $3,
                    vezes_adiada = $4,
                    status = 'adiada',
                    lembrete_enviado = false,
                    notas_conclusao = COALESCE(notas_conclusao, '') || E'\n[Adiada] ' || $5
                WHERE id = $6 AND usuario_id = $7 AND empresa_id = $8
                RETURNING *
            `, [nova_data, nova_hora || null, dataOriginal, vezesAdiada, motivo || '', id, usuarioId, empresaId]);

            res.json({
                success: true,
                message: `Tarefa adiada para ${nova_data}!`,
                data: result.rows[0]
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao adiar tarefa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Excluir tarefa
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            const empresaId = req.headers['x-empresa-id'];
            const result = await pool.query(
                'DELETE FROM agenda WHERE id = $1 AND usuario_id = $2 AND empresa_id = $3 RETURNING titulo',
                [id, usuarioId, empresaId]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tarefa não encontrada' });
            }

            res.json({
                success: true,
                message: `Tarefa "${result.rows[0].titulo}" excluída com sucesso!`
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao excluir tarefa:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== ESTATÍSTICAS ====================

    // GET - Estatísticas de produtividade
    router.get('/stats/produtividade', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const { periodo } = req.query; // 'semana', 'mes', 'ano'

            let intervalo = '30 days';
            if (periodo === 'semana') intervalo = '7 days';
            if (periodo === 'ano') intervalo = '365 days';

            const stats = await pool.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${intervalo}') as total_criadas,
                    COUNT(*) FILTER (WHERE status = 'concluida' AND concluido_em >= NOW() - INTERVAL '${intervalo}') as total_concluidas,
                    COUNT(*) FILTER (WHERE status IN ('pendente', 'em_andamento') AND data_inicio < CURRENT_DATE) as total_atrasadas,
                    ROUND(
                        COUNT(*) FILTER (WHERE status = 'concluida' AND concluido_em >= NOW() - INTERVAL '${intervalo}')::numeric / 
                        NULLIF(COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '${intervalo}'), 0) * 100, 
                        1
                    ) as taxa_conclusao
                FROM agenda
                WHERE usuario_id = $1 AND empresa_id = $2
            `, [usuarioId, req.headers['x-empresa-id']]);

            const porTipo = await pool.query(`
                SELECT tipo, COUNT(*) as total
                FROM agenda
                WHERE usuario_id = $1 AND empresa_id = $2 AND created_at >= NOW() - INTERVAL '${intervalo}'
                GROUP BY tipo
                ORDER BY total DESC
            `, [usuarioId, req.headers['x-empresa-id']]);

            res.json({
                success: true,
                data: {
                    ...stats.rows[0],
                    por_tipo: porTipo.rows
                }
            });
        } catch (error) {
            console.error('❌ [AGENDA] Erro ao buscar estatísticas:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
