// =====================================================
// 💬 SALESMASTER CHAT PRO - Endpoints da API
// Criado em: 2026-01-15
// =====================================================

const express = require('express');
const { masterPool } = require('./utils/db');

// Configuração de Limpeza Automática (Performance)
const MENSAGENS_DIAS_CONSERVAR = 30; // Guardar apenas as últimas 4 semanas

const runCleanup = async () => {
    try {
        console.log('🧹 [CHAT] Iniciando rotina de limpeza de mensagens antigas...');
        const resMsg = await masterPool.query('SELECT fn_cleanup_old_messages($1)', [MENSAGENS_DIAS_CONSERVAR]);
        const resPres = await masterPool.query('SELECT fn_cleanup_inactive_users()');

        console.log(`✅ [CHAT] Limpeza concluída: ${resMsg.rows[0].fn_cleanup_old_messages} mensagens removidas | ${resPres.rows[0].fn_cleanup_inactive_users} presenças resetadas`);
    } catch (error) {
        console.error('❌ [CHAT] Erro na rotina de limpeza:', error);
    }
};

// Executa limpeza a cada 24 horas e uma vez ao iniciar o servidor
setInterval(runCleanup, 1000 * 60 * 60 * 24);
runCleanup();

module.exports = (originalPool) => {
    const pool = masterPool; // Redireciona tudo para o Master Pool
    const router = express.Router();

    // ==================== CONVERSAS ====================

    // GET - Listar conversas do usuário
    router.get('/conversas', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
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
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

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
            // Silently handle missing tables to avoid spamming 500 errors on dashboard
            if (error.code === '42P01') { // undefined_table
                // console.warn('⚠️ [CHAT] Tabelas de chat não existem neste tenant.');
                return res.json({
                    success: true,
                    data: {
                        mensagens_nao_lidas: 0,
                        notificacoes_nao_lidas: 0,
                        total: 0
                    }
                });
            }
            console.error('❌ [CHAT] Erro ao buscar resumo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== PRESENÇA ONLINE ====================

    // GET - Listar usuários com status de presença
    router.get('/usuarios-online', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const { filter } = req.query; // 'online', 'all'

            let whereClause = 'WHERE u.ativo = true';
            if (filter === 'online') {
                whereClause += ` AND p.status = 'online' AND p.last_activity > NOW() - INTERVAL '2 minutes'`;
            }

            const result = await pool.query(`
                SELECT 
                    u.codigo as id,
                    u.nome,
                    u.sobrenome,
                    u.usuario,
                    COALESCE(p.status, 'offline') as status,
                    p.custom_message,
                    p.last_seen,
                    p.last_activity,
                    p.device_info,
                    CASE 
                        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '2 minutes' THEN 'online'
                        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '5 minutes' THEN 'away'
                        WHEN p.status IN ('away', 'busy') THEN p.status
                        ELSE 'offline'
                    END as effective_status,
                    CASE
                        WHEN p.last_seen IS NULL THEN NULL
                        WHEN p.last_seen > NOW() - INTERVAL '1 hour' THEN 
                            'Há ' || EXTRACT(MINUTE FROM NOW() - p.last_seen)::TEXT || ' min'
                        WHEN p.last_seen > NOW() - INTERVAL '1 day' THEN 
                            'Há ' || EXTRACT(HOUR FROM NOW() - p.last_seen)::TEXT || ' h'
                        WHEN p.last_seen > NOW() - INTERVAL '7 days' THEN 
                            'Há ' || EXTRACT(DAY FROM NOW() - p.last_seen)::TEXT || ' dias'
                        ELSE 'Há mais de uma semana'
                    END as last_seen_text
                FROM user_nomes u
                LEFT JOIN user_presence p ON p.usuario_id = u.codigo
                ${whereClause}
                AND u.codigo != $1
                ORDER BY 
                    CASE 
                        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '2 minutes' THEN 1
                        WHEN p.status = 'away' OR (p.status = 'online' AND p.last_activity > NOW() - INTERVAL '5 minutes') THEN 2
                        WHEN p.status = 'busy' THEN 3
                        ELSE 4
                    END,
                    u.nome
                LIMIT 200
            `, [usuarioId]);

            // Agrupar por status
            const online = result.rows.filter(u => u.effective_status === 'online');
            const away = result.rows.filter(u => u.effective_status === 'away');
            const busy = result.rows.filter(u => u.effective_status === 'busy');
            const offline = result.rows.filter(u => u.effective_status === 'offline');

            res.json({
                success: true,
                data: {
                    online,
                    away,
                    busy,
                    offline,
                    counts: {
                        online: online.length,
                        away: away.length,
                        busy: busy.length,
                        offline: offline.length,
                        total: result.rows.length
                    }
                }
            });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao listar usuários online:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Marcar usuário como online (ao fazer login)
    router.post('/presence/online', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const { device_info } = req.body;

            await pool.query(
                'SELECT fn_set_user_online($1, $2)',
                [usuarioId, device_info ? JSON.stringify(device_info) : null]
            );

            console.log(`🟢 [CHAT] Usuário ${usuarioId} marcado como ONLINE`);

            res.json({ success: true, message: 'Marcado como online' });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao marcar online:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Marcar usuário como offline (ao fazer logout ou fechar app)
    router.post('/presence/offline', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            await pool.query('SELECT fn_set_user_offline($1)', [usuarioId]);

            console.log(`⚪ [CHAT] Usuário ${usuarioId} marcado como OFFLINE`);

            res.json({ success: true, message: 'Marcado como offline' });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao marcar offline:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Atualizar heartbeat (manter vivo)
    router.post('/presence/heartbeat', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }

            await pool.query('SELECT fn_update_heartbeat($1)', [usuarioId]);

            res.json({ success: true, timestamp: new Date().toISOString() });
        } catch (error) {
            console.error('❌ [CHAT] Erro no heartbeat:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Atualizar status personalizado
    router.patch('/presence/status', async (req, res) => {
        try {
            const usuarioId = req.headers['x-user-id'];
            if (!usuarioId) {
                return res.status(401).json({ success: false, message: 'Usuário não identificado' });
            }
            const { status, custom_message } = req.body;

            // Validar status
            const validStatuses = ['online', 'offline', 'away', 'busy'];
            if (status && !validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido. Use: online, offline, away ou busy'
                });
            }

            await pool.query(`
                UPDATE user_presence 
                SET status = COALESCE($2, status),
                    custom_message = $3,
                    last_activity = NOW()
                WHERE usuario_id = $1
            `, [usuarioId, status, custom_message || null]);

            console.log(`🔄 [CHAT] Usuário ${usuarioId} alterou status para: ${status || 'sem mudança'}`);

            res.json({ success: true, message: 'Status atualizado' });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao atualizar status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Obter status de um usuário específico
    router.get('/presence/:userId', async (req, res) => {
        try {
            const { userId } = req.params;

            const result = await pool.query(`
                SELECT 
                    u.codigo as id,
                    u.nome,
                    COALESCE(p.status, 'offline') as status,
                    p.custom_message,
                    p.last_seen,
                    p.last_activity,
                    CASE 
                        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '2 minutes' THEN 'online'
                        WHEN p.status = 'online' AND p.last_activity > NOW() - INTERVAL '5 minutes' THEN 'away'
                        ELSE 'offline'
                    END as effective_status
                FROM user_nomes u
                LEFT JOIN user_presence p ON p.usuario_id = u.codigo
                WHERE u.codigo = $1
            `, [userId]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Usuário não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CHAT] Erro ao buscar status do usuário:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Limpar usuários inativos (para cron job ou chamada manual)
    router.post('/presence/cleanup', async (req, res) => {
        try {
            const result = await pool.query('SELECT fn_cleanup_inactive_users()');
            const affectedRows = result.rows[0].fn_cleanup_inactive_users;

            console.log(`🧹 [CHAT] ${affectedRows} usuários marcados como offline (inatividade)`);

            res.json({
                success: true,
                message: `${affectedRows} usuários inativos marcados como offline`
            });
        } catch (error) {
            console.error('❌ [CHAT] Erro no cleanup:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    console.log('💬 Chat Pro endpoints registered');
    console.log('🟢 Presence system endpoints registered');

    return router;
};

