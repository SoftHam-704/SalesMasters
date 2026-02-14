const SmartIAAnalyticMotor = require('./smart_ia_suggestion_logic');
const SmartIASuggestionService = require('./smart_ia_suggestion_service');

module.exports = function (app, pool) {
    const motor = new SmartIAAnalyticMotor(pool);
    const iaService = new SmartIASuggestionService();

    // POST - Gerar sugestão inteligente com IA
    app.post('/api/intelligence/smart-ia-suggestion', async (req, res) => {
        const { clienteId, industriaId, forceRefresh } = req.body;

        if (!clienteId || !industriaId) {
            return res.status(400).json({ success: false, message: 'clienteId e industriaId são obrigatórios.' });
        }

        try {
            // 1. Verificar Cache (se não for forceRefresh e se existir sugestão < 7 dias)
            if (!forceRefresh) {
                const cacheResult = await pool.query(`
                    SELECT resposta_ia, data_geracao 
                    FROM sugestoes_ia 
                    WHERE cliente_id = $1 AND industria_id = $2
                    AND data_geracao > NOW() - INTERVAL '7 days'
                    ORDER BY data_geracao DESC LIMIT 1
                `, [clienteId, industriaId]);

                if (cacheResult.rows.length > 0) {
                    console.log(`♻️ [SMART_IA] Retornando sugestão do cache para Cliente: ${clienteId}`);
                    return res.json({
                        success: true,
                        cached: true,
                        data: cacheResult.rows[0].resposta_ia,
                        gerado_em: cacheResult.rows[0].data_geracao
                    });
                }
            }

            // 2. Coletar dados do Motor Analítico
            const context = await motor.getFullContext(clienteId, industriaId);

            // 3. Chamar IA
            console.log(`🤖 [SMART_IA] Chamando OpenAI para Cliente: ${clienteId}`);
            const plan = await iaService.generatePlan(context);

            // 4. Salvar no Banco (Cache/Log)
            await pool.query(`
                INSERT INTO sugestoes_ia (cliente_id, industria_id, dados_enviados, resposta_ia, modelo_usado)
                VALUES ($1, $2, $3, $4, $5)
            `, [clienteId, industriaId, context, plan, 'gpt-4o-mini']);

            res.json({
                success: true,
                cached: false,
                data: plan,
                gerado_em: new Date()
            });

        } catch (error) {
            console.error('❌ [SMART_IA_ENDPOINT] Error:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar sugestão com IA',
                error: error.message
            });
        }
    });

    // POST - Registrar feedback de sugestão
    app.post('/api/intelligence/smart-ia-feedback', async (req, res) => {
        const { sugestaoId, produtoId, aceita, pedidoId } = req.body;
        try {
            await pool.query(`
                INSERT INTO sugestoes_aceitas (sugestao_ia_id, produto_id, aceita, pedido_id)
                VALUES ($1, $2, $3, $4)
            `, [sugestaoId, produtoId, aceita, pedidoId]);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    });
};
