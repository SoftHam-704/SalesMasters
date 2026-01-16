// =====================================================
// 💬 SALESMASTER CHAT PRO - Endpoints da API
// Criado em: 2026-01-15
// =====================================================

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // ==================== CONVERSAS ====================

    // GET - Listar conversas do usuário
    router.get('/conversas', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;

            const result = await pool.query(`
                SELECT 
                    c.id,
                    c.tipo,
                    c.nome,
                    c.descricao,
                    c.avatar_url,
                    c.last_message_at,
                    c.industria_id,
                    p.last_read_at,
                    (
                        SELECT COUNT(*) 
                        FROM chat_mensagens m 
                        WHERE m.conversa_id = c.id 
                          AND m.created_at > COALESCE(p.last_read_at, '1970-01-01')
                          AND m.remetente_id != $1
                          AND m.is_deleted = false
                    ) as nao_lidas,
                    (
                        SELECT m.conteudo 
                        FROM chat_mensagens m 
                        WHERE m.conversa_id = c.id AND m.is_deleted = false
                        ORDER BY m.created_at DESC 
                        LIMIT 1
                    ) as ultima_mensagem,
                    (
                        SELECT json_build_object('id', u.codigo, 'nome', u.nome)
                        FROM chat_mensagens m
                        JOIN user_nomes u ON u.codigo = m.remetente_id
                        WHERE m.conversa_id = c.id AND m.is_deleted = false
                        ORDER BY m.created_at DESC 
                        LIMIT 1
                    ) as ultimo_remetente,
                    -- Para conversas diretas, pegar info do outro participante
                    CASE WHEN c.tipo = 'direct' THEN (
                        SELECT json_build_object('id', u.codigo, 'nome', u.nome)
                        FROM chat_participantes op
                        JOIN user_nomes u ON u.codigo = op.usuario_id
                        WHERE op.conversa_id = c.id AND op.usuario_id != $1
                        LIMIT 1
                    ) ELSE NULL END as outro_participante
                FROM chat_conversas c
                JOIN chat_participantes p ON p.conversa_id = c.id AND p.usuario_id = $1
                WHERE c.is_archived = false 
                  AND p.left_at IS NULL
                ORDER BY c.last_message_at DESC
            `, [usuarioId]);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao listar conversas:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Buscar ou criar conversa direta com outro usuário
    router.get('/conversas/direct/:outroUsuarioId', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { outroUsuarioId } = req.params;
            const empresaId = req.headers['x-empresa-id'] || 1;

            // Verificar se já existe conversa direta entre os dois
            const existente = await pool.query(`
                SELECT c.id
                FROM chat_conversas c
                JOIN chat_participantes p1 ON p1.conversa_id = c.id AND p1.usuario_id = $1
                JOIN chat_participantes p2 ON p2.conversa_id = c.id AND p2.usuario_id = $2
                WHERE c.tipo = 'direct'
                LIMIT 1
            `, [usuarioId, outroUsuarioId]);

            if (existente.rows.length > 0) {
                return res.json({ success: true, data: { id: existente.rows[0].id } });
            }

            // Criar nova conversa direta
            const novaConversa = await pool.query(`
                INSERT INTO chat_conversas (tipo, criado_por, empresa_id)
                VALUES ('direct', $1, $2)
                RETURNING id
            `, [usuarioId, empresaId]);

            const conversaId = novaConversa.rows[0].id;

            // Adicionar os dois participantes
            await pool.query(`
                INSERT INTO chat_participantes (conversa_id, usuario_id, role)
                VALUES ($1, $2, 'owner'), ($1, $3, 'member')
            `, [conversaId, usuarioId, outroUsuarioId]);

            res.json({ success: true, data: { id: conversaId }, created: true });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao criar conversa direta:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Criar canal
    router.post('/conversas/channel', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const empresaId = req.headers['x-empresa-id'] || 1;
            const { nome, descricao, industria_id, participantes } = req.body;

            // Criar canal
            const result = await pool.query(`
                INSERT INTO chat_conversas (tipo, nome, descricao, industria_id, criado_por, empresa_id)
                VALUES ('channel', $1, $2, $3, $4, $5)
                RETURNING *
            `, [nome, descricao, industria_id || null, usuarioId, empresaId]);

            const conversaId = result.rows[0].id;

            // Adicionar criador como owner
            await pool.query(`
                INSERT INTO chat_participantes (conversa_id, usuario_id, role)
                VALUES ($1, $2, 'owner')
            `, [conversaId, usuarioId]);

            // Adicionar outros participantes
            if (participantes && participantes.length > 0) {
                for (const pId of participantes) {
                    if (pId !== parseInt(usuarioId)) {
                        await pool.query(`
                            INSERT INTO chat_participantes (conversa_id, usuario_id, role)
                            VALUES ($1, $2, 'member')
                            ON CONFLICT DO NOTHING
                        `, [conversaId, pId]);
                    }
                }
            }

            // Mensagem de sistema
            await pool.query(`
                INSERT INTO chat_mensagens (conversa_id, remetente_id, tipo, conteudo)
                VALUES ($1, $2, 'system', $3)
            `, [conversaId, usuarioId, `🎉 Canal "${nome}" foi criado!`]);

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao criar canal:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== MENSAGENS ====================

    // GET - Listar mensagens de uma conversa
    router.get('/conversas/:conversaId/mensagens', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { conversaId } = req.params;
            const { before, limit = 50 } = req.query;

            // Verificar se usuário participa da conversa
            const participa = await pool.query(`
                SELECT 1 FROM chat_participantes 
                WHERE conversa_id = $1 AND usuario_id = $2 AND left_at IS NULL
            `, [conversaId, usuarioId]);

            if (participa.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Acesso negado' });
            }

            let query = `
                SELECT 
                    m.id,
                    m.remetente_id,
                    m.tipo,
                    m.conteudo,
                    m.metadata,
                    m.reply_to_id,
                    m.is_edited,
                    m.is_deleted,
                    m.created_at,
                    json_build_object('id', u.codigo, 'nome', u.nome) as remetente
                FROM chat_mensagens m
                LEFT JOIN user_nomes u ON u.codigo = m.remetente_id
                WHERE m.conversa_id = $1
            `;
            const params = [conversaId];

            if (before) {
                query += ` AND m.id < $${params.length + 1}`;
                params.push(before);
            }

            query += ` ORDER BY m.created_at DESC LIMIT $${params.length + 1}`;
            params.push(parseInt(limit));

            const result = await pool.query(query, params);

            // Marcar como lida
            await pool.query(`
                UPDATE chat_participantes 
                SET last_read_at = NOW()
                WHERE conversa_id = $1 AND usuario_id = $2
            `, [conversaId, usuarioId]);

            res.json({
                success: true,
                data: result.rows.reverse() // Ordenar do mais antigo para mais recente
            });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao listar mensagens:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Enviar mensagem
    router.post('/conversas/:conversaId/mensagens', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { conversaId } = req.params;
            const { tipo = 'text', conteudo, metadata, reply_to_id } = req.body;

            if (!conteudo || conteudo.trim() === '') {
                return res.status(400).json({ success: false, message: 'Conteúdo é obrigatório' });
            }

            // Verificar se usuário participa
            const participa = await pool.query(`
                SELECT 1 FROM chat_participantes 
                WHERE conversa_id = $1 AND usuario_id = $2 AND left_at IS NULL
            `, [conversaId, usuarioId]);

            if (participa.rows.length === 0) {
                return res.status(403).json({ success: false, message: 'Acesso negado' });
            }

            // Inserir mensagem
            const result = await pool.query(`
                INSERT INTO chat_mensagens (conversa_id, remetente_id, tipo, conteudo, metadata, reply_to_id)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [conversaId, usuarioId, tipo, conteudo.trim(), metadata ? JSON.stringify(metadata) : null, reply_to_id || null]);

            // Buscar info do remetente
            const remetente = await pool.query(`
                SELECT codigo as id, nome FROM user_nomes WHERE codigo = $1
            `, [usuarioId]);

            const mensagem = {
                ...result.rows[0],
                remetente: remetente.rows[0] || { id: usuarioId, nome: 'Usuário' }
            };

            console.log(`💬 [CHAT] Nova mensagem na conversa ${conversaId}`);

            res.status(201).json({ success: true, data: mensagem });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao enviar mensagem:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Excluir mensagem (soft delete)
    router.delete('/mensagens/:mensagemId', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { mensagemId } = req.params;

            const result = await pool.query(`
                UPDATE chat_mensagens 
                SET is_deleted = true, conteudo = '[Mensagem excluída]', updated_at = NOW()
                WHERE id = $1 AND remetente_id = $2
                RETURNING id
            `, [mensagemId, usuarioId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Mensagem não encontrada ou sem permissão' });
            }

            res.json({ success: true, message: 'Mensagem excluída' });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao excluir mensagem:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== NOTIFICAÇÕES ====================

    // GET - Listar notificações do usuário
    router.get('/notificacoes', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { apenas_nao_lidas } = req.query;

            let query = `
                SELECT * FROM chat_notificacoes
                WHERE usuario_id = $1
            `;
            if (apenas_nao_lidas === 'true') {
                query += ` AND lida = false`;
            }
            query += ` ORDER BY created_at DESC LIMIT 50`;

            const result = await pool.query(query, [usuarioId]);

            // Contar não lidas
            const naoLidas = await pool.query(`
                SELECT COUNT(*) as total FROM chat_notificacoes
                WHERE usuario_id = $1 AND lida = false
            `, [usuarioId]);

            res.json({
                success: true,
                data: result.rows,
                nao_lidas: parseInt(naoLidas.rows[0].total)
            });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao listar notificações:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Marcar notificação como lida
    router.patch('/notificacoes/:id/lida', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const { id } = req.params;

            await pool.query(`
                UPDATE chat_notificacoes SET lida = true
                WHERE id = $1 AND usuario_id = $2
            `, [id, usuarioId]);

            res.json({ success: true });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao marcar notificação:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Marcar todas notificações como lidas
    router.patch('/notificacoes/marcar-todas-lidas', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;

            await pool.query(`
                UPDATE chat_notificacoes SET lida = true
                WHERE usuario_id = $1 AND lida = false
            `, [usuarioId]);

            res.json({ success: true, message: 'Todas notificações marcadas como lidas' });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao marcar notificações:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== USUÁRIOS PARA CHAT ====================

    // GET - Listar usuários disponíveis para iniciar conversa
    router.get('/usuarios', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;
            const empresaId = req.headers['x-empresa-id'] || 1;

            const result = await pool.query(`
                SELECT codigo as id, nome, sobrenome
                FROM user_nomes
                WHERE codigo != $1 AND ativo = true
                ORDER BY nome
                LIMIT 100
            `, [usuarioId]);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao listar usuários:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== RESUMO ====================

    // GET - Contagem de não lidas (para badge no sidebar)
    router.get('/resumo', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'] || 1;

            // Total mensagens não lidas
            const mensagens = await pool.query(`
                SELECT COALESCE(SUM(
                    (SELECT COUNT(*) 
                     FROM chat_mensagens m 
                     WHERE m.conversa_id = c.id 
                       AND m.created_at > COALESCE(p.last_read_at, '1970-01-01')
                       AND m.remetente_id != $1
                       AND m.is_deleted = false)
                ), 0) as total
                FROM chat_conversas c
                JOIN chat_participantes p ON p.conversa_id = c.id AND p.usuario_id = $1
                WHERE c.is_archived = false AND p.left_at IS NULL
            `, [usuarioId]);

            // Total notificações não lidas
            const notificacoes = await pool.query(`
                SELECT COUNT(*) as total FROM chat_notificacoes
                WHERE usuario_id = $1 AND lida = false
            `, [usuarioId]);

            res.json({
                success: true,
                data: {
                    mensagens_nao_lidas: parseInt(mensagens.rows[0].total || 0),
                    notificacoes_nao_lidas: parseInt(notificacoes.rows[0].total || 0),
                    total: parseInt(mensagens.rows[0].total || 0) + parseInt(notificacoes.rows[0].total || 0)
                }
            });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao buscar resumo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    console.log('💬 Chat Pro endpoints registered');

    return router;
};
