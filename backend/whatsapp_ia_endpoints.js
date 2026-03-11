const { getTenantFromInstance, processarMensagemIA } = require('./whatsapp_ia_logic');
const axios = require('axios');
const express = require('express');

module.exports = function (pool) {
    const router = express.Router();
    console.log("📱 [WHATSAPP IA] Módulo carregado - v1.2.0 (Router Pattern)");

    /**
     * Webhook recebido da Evolution API
     * POST /api/whatsapp/webhook
     */
    router.post('/webhook', async (req, res) => {
        // Resposta imediata para evitar timeout da Evolution API
        res.status(200).send({ status: 'received' });

        try {
            const { event, instance, data } = req.body;

            // Só processamos mensagens recebidas de outros
            if (event !== 'messages.upsert') return;
            if (!data || data.key.fromMe) return;

            const phone = data.key.remoteJid.split('@')[0];
            const content = data.message?.conversation || data.message?.extendedTextMessage?.text || '';
            const pushName = data.pushName || 'Visitante';

            if (!content) return;

            console.log(`📩 [WPP] Mensagem de ${phone} na instância ${instance}: ${content.substring(0, 50)}`);

            // 1. Resolver Tenant
            const tenantContext = await getTenantFromInstance(instance);

            // 2. Processar Lógica (IA + DB)
            const respostaTexto = await processarMensagemIA(tenantContext, { phone, content, pushName });

            // 3. Enviar resposta de volta via Evolution API
            const evolutionUrl = (process.env.EVOLUTION_API_URL || 'http://localhost:8081').replace(/\/$/, '');
            const apiKey = process.env.EVOLUTION_API_KEY || 'soft-ham-secret-key-2026';

            console.log(`📤 [WPP] Enviando resposta para ${phone} via ${evolutionUrl}/message/sendText/${instance}...`);

            await axios.post(`${evolutionUrl}/message/sendText/${instance}`, {
                number: phone,
                options: {
                    delay: 1200,
                    presence: "composing",
                    linkPreview: false
                },
                text: respostaTexto
            }, {
                headers: { 'apikey': apiKey }
            });

            console.log(`✅ [WPP] Resposta enviada para ${phone}`);

        } catch (error) {
            console.error(`❌ [WPP-WEBHOOK] Erro:`, error.message);
            if (error.response) console.error(`🔍 Detalhes API:`, JSON.stringify(error.response.data));
        }
    });

    /**
     * Endpoint para gerar QR Code (Proxy para Evolution API)
     * GET /api/whatsapp/connect/:instance
     */
    router.get('/connect/:instance', async (req, res) => {
        const { instance } = req.params;
        const evolutionUrl = (process.env.EVOLUTION_API_URL || 'http://localhost:8081').replace(/\/$/, '');
        const apiKey = process.env.EVOLUTION_API_KEY || 'soft-ham-secret-key-2026';

        console.log(`🔌 [WPP-CONNECT] Handshake iniciado para: ${instance}`);
        console.log(`🔗 [WPP-CONNECT] Alvo URL: ${evolutionUrl}`);

        try {
            // 1. Tenta obter o estado da conexão
            let state;
            try {
                const stateRes = await axios.get(`${evolutionUrl}/instance/connectionState/${instance}`, {
                    headers: { 'apikey': apiKey },
                    timeout: 5000
                });

                // Log detalhado para diagnóstico
                console.log(`📡 [WPP-CONNECT] Resposta State:`, JSON.stringify(stateRes.data));

                state = stateRes.data?.instance?.state || stateRes.data?.state;
                console.log(`📡 [WPP-CONNECT] Estado Interpretado: ${state}`);
            } catch (e) {
                console.log(`⚠️ [WPP-CONNECT] Check inicial falhou ou porta fechada: ${e.message}`);
                state = 'RECREATE';
            }

            // Se o estado não for "open", vamos forçar uma limpeza e criação
            if (state !== 'open' && state !== 'CONNECTED') {
                try {
                    console.log(`🗑️ [WPP-CONNECT] Resetando instância ${instance}...`);
                    await axios.delete(`${evolutionUrl}/instance/delete/${instance}`, {
                        headers: { 'apikey': apiKey },
                        timeout: 5000
                    }).catch(() => { });

                    console.log(`✨ [WPP-CONNECT] Criando nova instância ${instance}...`);
                    const createRes = await axios.post(`${evolutionUrl}/instance/create`, {
                        instanceName: instance,
                        token: apiKey, // Algumas versões da v2 pedem o token aqui
                        qrcode: true,
                        integration: "WHATSAPP-BAILEYS"
                    }, {
                        headers: { 'apikey': apiKey },
                        timeout: 10000
                    });

                    console.log(`✅ [WPP-CONNECT] Criação enviada:`, createRes.status);

                    // Espera MAIS tempo (5s) para o motor processar a criação
                    console.log(`⏳ [WPP-CONNECT] Aguardando 5s para estabilização...`);
                    await new Promise(r => setTimeout(r, 5000));
                } catch (err) {
                    console.error(`❌ [WPP-CONNECT] Falha no ciclo de criação/delete: ${err.message}`);
                }
            }

            // 2. Solicita o QR Code
            console.log(`📸 [WPP-CONNECT] Solicitando QR Code Final em ${evolutionUrl}/instance/connect/${instance}...`);
            let qrRes = await axios.get(`${evolutionUrl}/instance/connect/${instance}`, {
                headers: { 'apikey': apiKey },
                timeout: 15000
            });

            if (qrRes.data && typeof qrRes.data === 'object' && (qrRes.data.base64 || qrRes.data.code || (qrRes.data.instance && qrRes.data.instance.base64))) {
                console.log(`🖼️ [WPP-CONNECT] Sucesso! QR Code Capturado.`);
                const qrcodeData = qrRes.data.base64 || qrRes.data.code || (qrRes.data.instance && qrRes.data.instance.base64);
                return res.json({
                    success: true,
                    status: 'QR_CODE',
                    qrcode: qrcodeData
                });
            } else {
                const isHtml = typeof qrRes.data === 'string' && qrRes.data.includes('<!DOCTYPE html>');
                console.log(`⚠️ [WPP-CONNECT] Resposta ${isHtml ? 'HTML (Inválida)' : 'Incompleta'} da API em ${evolutionUrl}`);

                if (isHtml) {
                    console.error(`❌ [WPP-CONFIG-ERROR] A URL ${evolutionUrl} retornou uma página HTML em vez da API do WhatsApp. Verifique se a porta 80 está correta para este nó.`);
                }

                return res.json({
                    success: false,
                    status: 'BUSY',
                    message: isHtml ? 'Erro de configuração na URL da API.' : 'O motor está carregando. Tente novamente em 5 segundos.'
                });
            }

        } catch (error) {
            console.error(`❌ [WPP-CONNECT] Erro Fatal:`, error.message);
            res.status(500).json({
                success: false,
                message: `Falha na Evolution API: ${error.message}`,
                details: error.response?.data || null
            });
        }
    });

    /**
     * Endpoint para Dashboard: Retorna conversas ativas e leads qualificados
     * GET /api/wpp-service/dashboard-stats
     */
    router.get('/dashboard-stats', async (req, res) => {
        try {
            // A query usa o 'pool' que já é injetado com o contexto do tenant (via server.js proxy)
            const query = `
                SELECT 
                    c.id as conversa_id,
                    ct.nome_push,
                    ct.telefone,
                    c.estado,
                    c.ultima_msg_at,
                    m.conteudo as ultima_mensagem,
                    m.direcao as ultima_direcao,
                    i.nome_marca,
                    i.id as marca_id
                FROM wpp_conversa c
                JOIN wpp_contato ct ON c.contato_id = ct.id
                LEFT JOIN wpp_mensagem m ON m.conversa_id = c.id
                LEFT JOIN ia_conhecimento i ON c.contexto_industria_id = i.id
                WHERE c.estado NOT IN ('convertida', 'perdida', 'encerrada')
                  AND m.id = (
                      SELECT MAX(id) 
                      FROM wpp_mensagem 
                      WHERE conversa_id = c.id
                  )
                ORDER BY c.ultima_msg_at DESC
                LIMIT 15
            `;

            const result = await pool.query(query);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('❌ [WPP-STATS] Erro ao buscar stats:', error.message);
            // Se a tabela ainda não existir (migração pendente), retorna vazio sem erro 500
            if (error.message.includes('relation "wpp_conversa" does not exist')) {
                return res.json({ success: true, data: [] });
            }
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar estatísticas do WhatsApp',
                error: error.message
            });
        }
    });

    return router;
};
