// CRM Endpoints Module
// Manages customer relationship interactions and pipeline

module.exports = function (app, pool) {

    // --- PIPELINE / KANBAN ENDPOINTS ---

    // GET - List Pipeline Stages with Opportunities
    app.get('/api/crm/pipeline', async (req, res) => {
        try {
            const { ven_codigo } = req.query;

            // 1. Get Stages
            const stagesRes = await pool.query('SELECT * FROM crm_funil_etapas ORDER BY ordem');
            const stages = stagesRes.rows;

            // 2. Get Opportunities
            // Note: We are now joining with fornecedores (industries) and vendedores (promoters)
            // If the columns don't exist yet, this query might fail. We should ideally run a migration.
            // Assuming for_codigo was added to crm_oportunidades.
            let query = `
                SELECT 
                    o.*, 
                    o.telefone_contato,
                    c.cli_nomred, 
                    c.cli_cidade, 
                    c.cli_uf,
                    c.cli_fone1,
                    f.for_nomered as industria_nome,
                    v.ven_nome as promotor_nome,
                    (SELECT COUNT(*) FROM crm_interacao i WHERE i.oportunidade_id = o.oportunidade_id) as interacoes_count,
                    (SELECT MAX(data_hora) FROM crm_interacao i WHERE i.oportunidade_id = o.oportunidade_id) as ultima_interacao
                FROM crm_oportunidades o
                JOIN clientes c ON c.cli_codigo = o.cli_codigo
                LEFT JOIN fornecedores f ON f.for_codigo = o.for_codigo
                LEFT JOIN vendedores v ON v.ven_codigo = o.ven_codigo
            `;
            const params = [];

            if (ven_codigo) {
                // Determine if we filter strictly by seller or show all if manager
                // For now, let's keep it open or filter if param passed
                query += ' WHERE o.ven_codigo = $1';
                params.push(ven_codigo);
            }

            const oppsRes = await pool.query(query, params);
            const opportunities = oppsRes.rows;

            // 3. Merge
            const pipeline = stages.map(stage => ({
                ...stage,
                items: opportunities.filter(o => o.etapa_id === stage.etapa_id)
            }));

            res.json({ success: true, data: pipeline });
        } catch (error) {
            console.error('❌ [CRM] Error fetching pipeline:', error);
            // Fallback for missing columns if migration didn't run
            if (error.code === '42703') { // Undefined column
                res.status(500).json({ success: false, message: 'Colunas novas (for_codigo/ven_codigo) não encontradas. Execute a migração.' });
            } else {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    });

    // POST - Create Opportunity
    app.post('/api/crm/oportunidades', async (req, res) => {
        try {
            const { titulo, cli_codigo, ven_codigo, valor_estimado, etapa_id, for_codigo, telefone_contato } = req.body;

            // Check if for_codigo column exists implicitly by trying to insert
            // If table doesn't have the column yet, we should add it.
            // For safety in this environment, I'll assume the migration script I'll provide next will be run.

            const result = await pool.query(`
                INSERT INTO crm_oportunidades 
                (titulo, cli_codigo, ven_codigo, valor_estimado, etapa_id, for_codigo, telefone_contato)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [titulo, cli_codigo, ven_codigo || 1, valor_estimado, etapa_id || 1, for_codigo || null, telefone_contato || null]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating opportunity:', error);
            if (error.code === '42703') { // Undefined column
                // Auto-fix attempt (DANGEROUS but requested for "learning system")
                // Ideally we send a 500 and ask user to run migration.
                res.status(500).json({ success: false, message: 'Erro de Banco: Coluna for_codigo ausente. Execute migração.' });
            } else {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    });

    // PUT - Move Opportunity (Drag & Drop)
    app.put('/api/crm/oportunidades/:id/move', async (req, res) => {
        try {
            const { id } = req.params;
            const { etapa_id } = req.body;

            await pool.query(
                'UPDATE crm_oportunidades SET etapa_id = $1, atualizado_em = CURRENT_TIMESTAMP WHERE oportunidade_id = $2',
                [etapa_id, id]
            );

            res.json({ success: true });
        } catch (error) {
            console.error('❌ [CRM] Error moving opportunity:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update full Opportunity details
    app.put('/api/crm/oportunidades/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { titulo, cli_codigo, ven_codigo, valor_estimado, etapa_id, for_codigo, telefone_contato } = req.body;

            const result = await pool.query(`
                UPDATE crm_oportunidades 
                SET titulo = $1, 
                    cli_codigo = $2, 
                    ven_codigo = $3, 
                    valor_estimado = $4, 
                    etapa_id = $5, 
                    for_codigo = $6,
                    telefone_contato = $7,
                    atualizado_em = CURRENT_TIMESTAMP
                WHERE oportunidade_id = $8
                RETURNING *
            `, [titulo, cli_codigo, ven_codigo, valor_estimado, etapa_id, for_codigo, telefone_contato || null, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Oportunidade não encontrada' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating opportunity:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // --- INTERACTIONS ENDPOINTS (EXISTING) ---

    // GET - List interactions for a seller
    app.get('/api/crm/interacoes', async (req, res) => {
        console.log('📋 [CRM] Fetching interactions');
        try {
            const { ven_codigo, cli_codigo, for_codigo } = req.query;

            if (!ven_codigo) {
                return res.status(400).json({
                    success: false,
                    message: 'ven_codigo é obrigatório'
                });
            }

            let query = `
                SELECT 
                    i.interacao_id,
                    i.data_hora AS data_interacao,
                    i.descricao,
                    c.cli_nomred,
                    c.cli_codigo,
                    t.descricao AS tipo,
                    t.id AS tipo_interacao_id,
                    r.descricao AS resultado,
                    r.id AS resultado_id,
                    cn.descricao AS canal,
                    cn.id AS canal_id,
                    (SELECT array_agg(ii.for_codigo) 
                     FROM crm_interacao_industria ii 
                     WHERE ii.interacao_id = i.interacao_id) as industrias
                FROM crm_interacao i
                JOIN clientes c ON c.cli_codigo = i.cli_codigo
                JOIN crm_tipo_interacao t ON t.id = i.tipo_interacao_id
                LEFT JOIN crm_resultado r ON r.id = i.resultado_id
                LEFT JOIN crm_canal cn ON cn.id = i.canal_id
                WHERE i.ven_codigo = $1
            `;

            const params = [ven_codigo];
            let paramIndex = 2;

            if (cli_codigo) {
                query += ` AND i.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }

            if (for_codigo) {
                query += ` AND EXISTS (
                    SELECT 1 FROM crm_interacao_industria ii 
                    WHERE ii.interacao_id = i.interacao_id AND ii.for_codigo = $${paramIndex++}
                )`;
                params.push(for_codigo);
            }

            query += ` ORDER BY i.data_hora DESC LIMIT 100`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [CRM] Error fetching interactions:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar interações: ${error.message}`
            });
        }
    });

    // GET - Single interaction
    app.get('/api/crm/interacoes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query(`
                SELECT 
                    i.*,
                    (SELECT array_agg(for_codigo) FROM crm_interacao_industria WHERE interacao_id = i.interacao_id) as industrias
                FROM crm_interacao i
                WHERE i.interacao_id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Interação não encontrada' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error fetching single interaction:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create new interaction
    app.post('/api/crm/interacoes', async (req, res) => {
        console.log('➕ [CRM] Creating new interaction');
        const client = await pool.connect();

        try {
            const {
                cli_codigo,
                ven_codigo,
                tipo_interacao_id,
                canal_id,
                resultado_id,
                descricao,
                industrias
            } = req.body;

            if (!cli_codigo || !ven_codigo || !tipo_interacao_id) {
                return res.status(400).json({
                    success: false,
                    message: 'cli_codigo, ven_codigo e tipo_interacao_id são obrigatórios'
                });
            }

            await client.query('BEGIN');

            const { rows } = await client.query(`
                INSERT INTO crm_interacao
                (cli_codigo, ven_codigo, tipo_interacao_id, canal_id, resultado_id, descricao)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING interacao_id
            `, [
                cli_codigo,
                ven_codigo,
                tipo_interacao_id,
                canal_id || null,
                resultado_id || null,
                descricao || ''
            ]);

            const interacaoId = rows[0].interacao_id;

            // Associate industries if provided
            if (industrias && Array.isArray(industrias) && industrias.length > 0) {
                for (const for_codigo of industrias) {
                    await client.query(`
                        INSERT INTO crm_interacao_industria (interacao_id, for_codigo)
                        VALUES ($1, $2)
                    `, [interacaoId, for_codigo]);
                }
            }

            await client.query('COMMIT');

            console.log(`✅ [CRM] Interaction ${interacaoId} created`);
            res.status(201).json({
                success: true,
                interacao_id: interacaoId
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [CRM] Error creating interaction:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao criar interação: ${error.message}`
            });
        } finally {
            client.release();
        }
    });

    // PUT - Update interaction
    app.put('/api/crm/interacoes/:id', async (req, res) => {
        const { id } = req.params;
        console.log(`📝 [CRM] Updating interaction ${id}`);
        const client = await pool.connect();

        try {
            const {
                cli_codigo,
                tipo_interacao_id,
                canal_id,
                resultado_id,
                descricao,
                industrias,
                data_hora
            } = req.body;

            await client.query('BEGIN');

            // 1. Update main record
            await client.query(`
                UPDATE crm_interacao SET
                    cli_codigo = $1,
                    tipo_interacao_id = $2,
                    canal_id = $3,
                    resultado_id = $4,
                    descricao = $5,
                    data_hora = $6
                WHERE interacao_id = $7
            `, [
                cli_codigo,
                tipo_interacao_id,
                canal_id || null,
                resultado_id || null,
                descricao || '',
                data_hora || new Date(),
                id
            ]);

            // 2. Refresh industries
            await client.query('DELETE FROM crm_interacao_industria WHERE interacao_id = $1', [id]);
            if (industrias && Array.isArray(industrias) && industrias.length > 0) {
                for (const for_codigo of industrias) {
                    await client.query(`
                        INSERT INTO crm_interacao_industria (interacao_id, for_codigo)
                        VALUES ($1, $2)
                    `, [id, for_codigo]);
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'Interação atualizada com sucesso' });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [CRM] Error updating interaction:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    // GET - List interaction types
    app.get('/api/crm/tipos', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, descricao 
                FROM crm_tipo_interacao 
                WHERE ativo = true 
                ORDER BY descricao
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching tipos:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - List channels
    app.get('/api/crm/canais', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, descricao 
                FROM crm_canal 
                WHERE ativo = true 
                ORDER BY descricao
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching canais:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - List results/outcomes
    app.get('/api/crm/resultados', async (req, res) => {
        try {
            const result = await pool.query(`
                SELECT id, descricao, ordem
                FROM crm_resultado 
                WHERE ativo = true 
                ORDER BY ordem, descricao
            `);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching resultados:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== TIPOS DE INTERAÇÃO CRUD ====================

    // POST - Create new interaction type
    app.post('/api/crm/tipos', async (req, res) => {
        console.log('➕ [CRM] Creating new tipo de interação');
        try {
            const { descricao } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'INSERT INTO crm_tipo_interacao (descricao, ativo) VALUES ($1, true) RETURNING *',
                [descricao.trim()]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating tipo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update interaction type
    app.put('/api/crm/tipos/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { descricao } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'UPDATE crm_tipo_interacao SET descricao = $1 WHERE id = $2 RETURNING *',
                [descricao.trim(), id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tipo não encontrado' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating tipo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Soft delete interaction type
    app.delete('/api/crm/tipos/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query(
                'UPDATE crm_tipo_interacao SET ativo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Tipo não encontrado' });
            }
            res.json({ success: true, message: 'Tipo removido com sucesso' });
        } catch (error) {
            console.error('❌ [CRM] Error deleting tipo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== CANAIS CRUD ====================

    // POST - Create new channel
    app.post('/api/crm/canais', async (req, res) => {
        console.log('➕ [CRM] Creating new canal');
        try {
            const { descricao } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'INSERT INTO crm_canal (descricao, ativo) VALUES ($1, true) RETURNING *',
                [descricao.trim()]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating canal:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update channel
    app.put('/api/crm/canais/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { descricao } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'UPDATE crm_canal SET descricao = $1 WHERE id = $2 RETURNING *',
                [descricao.trim(), id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Canal não encontrado' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating canal:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Soft delete channel
    app.delete('/api/crm/canais/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query(
                'UPDATE crm_canal SET ativo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Canal não encontrado' });
            }
            res.json({ success: true, message: 'Canal removido com sucesso' });
        } catch (error) {
            console.error('❌ [CRM] Error deleting canal:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== RESULTADOS CRUD ====================

    // POST - Create new result
    app.post('/api/crm/resultados', async (req, res) => {
        console.log('➕ [CRM] Creating new resultado');
        try {
            const { descricao, ordem } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'INSERT INTO crm_resultado (descricao, ordem, ativo) VALUES ($1, $2, true) RETURNING *',
                [descricao.trim(), ordem || 0]
            );
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating resultado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update result
    app.put('/api/crm/resultados/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { descricao, ordem } = req.body;
            if (!descricao || !descricao.trim()) {
                return res.status(400).json({ success: false, message: 'Descrição é obrigatória' });
            }
            const result = await pool.query(
                'UPDATE crm_resultado SET descricao = $1, ordem = $2 WHERE id = $3 RETURNING *',
                [descricao.trim(), ordem || 0, id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Resultado não encontrado' });
            }
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating resultado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Soft delete result
    app.delete('/api/crm/resultados/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query(
                'UPDATE crm_resultado SET ativo = false WHERE id = $1 RETURNING *',
                [id]
            );
            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Resultado não encontrado' });
            }
            res.json({ success: true, message: 'Resultado removido com sucesso' });
        } catch (error) {
            console.error('❌ [CRM] Error deleting resultado:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Seed initial CRM data
    app.post('/api/crm/seed', async (req, res) => {
        console.log('🌱 [CRM] Seeding lookup data with user specific values');
        try {
            // Clear and insert tipos de interação (Tipo Visita)
            await pool.query(`DELETE FROM crm_tipo_interacao`);
            await pool.query(`
                INSERT INTO crm_tipo_interacao (id, descricao, ativo) VALUES 
                (1, 'Promocional Nacional', true),
                (2, 'Promocional Regional', true),
                (3, 'Comercial', true),
                (4, 'Divergências', true),
                (5, 'Prospecção', true),
                (6, 'Garantia', true),
                (7, 'Treinamento', true),
                (8, 'Suporte', true)
            `);

            // Clear and insert canais (Forma de interação)
            await pool.query(`DELETE FROM crm_canal`);
            await pool.query(`
                INSERT INTO crm_canal (id, descricao, ativo) VALUES 
                (1, 'Ligação telefônica', true),
                (2, 'Visita', true),
                (3, 'E-mail', true),
                (4, 'Whatsapp/Skype', true),
                (5, 'Reunião', true),
                (6, 'Outros', true)
            `);

            // Clear and insert resultados (Status/Resultado)
            // Using common sense for these as they weren't in the images but are needed
            await pool.query(`DELETE FROM crm_resultado`);
            await pool.query(`
                INSERT INTO crm_resultado (id, descricao, ativo, ordem) VALUES 
                (1, 'Em aberto', true, 1),
                (2, 'Agendado', true, 2),
                (3, 'Realizado', true, 3),
                (4, 'Cancelado', true, 4),
                (5, 'Positivo', true, 5),
                (6, 'Negativo', true, 6)
            `);

            console.log('✅ [CRM] Seed data updated successfully');
            res.json({ success: true, message: 'Dados iniciais atualizados com sucesso' });
        } catch (error) {
            console.error('❌ [CRM] Error seeding data:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== SELL-OUT ENDPOINTS ====================

    // GET - List sell-out records with filters
    app.get('/api/crm/sellout', async (req, res) => {
        try {
            const { cli_codigo, for_codigo, periodo_inicio, periodo_fim } = req.query;

            let query = `
                SELECT 
                    s.id,
                    s.cli_codigo,
                    c.cli_nomred,
                    s.for_codigo,
                    f.for_nome,
                    s.periodo,
                    s.valor,
                    s.quantidade,
                    s.criado_em
                FROM crm_sellout s
                JOIN clientes c ON c.cli_codigo = s.cli_codigo
                JOIN fornecedores f ON f.for_codigo = s.for_codigo
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (cli_codigo) {
                query += ` AND s.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }
            if (for_codigo) {
                query += ` AND s.for_codigo = $${paramIndex++}`;
                params.push(for_codigo);
            }
            if (periodo_inicio) {
                query += ` AND s.periodo >= $${paramIndex++}`;
                params.push(periodo_inicio);
            }
            if (periodo_fim) {
                query += ` AND s.periodo <= $${paramIndex++}`;
                params.push(periodo_fim);
            }

            query += ' ORDER BY s.periodo DESC, c.cli_nomred LIMIT 500';

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching sell-out:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Sell-out Summary Metrics
    app.get('/api/crm/sellout/summary', async (req, res) => {
        try {
            const currentMonth = new Date().toISOString().substring(0, 7) + '-01';
            const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().substring(0, 7) + '-01';

            const summaryQuery = `
                SELECT 
                    COALESCE(SUM(CASE WHEN periodo = $1 THEN valor ELSE 0 END), 0) as current_month_total,
                    COALESCE(SUM(CASE WHEN periodo = $2 THEN valor ELSE 0 END), 0) as last_month_total,
                    COUNT(DISTINCT cli_codigo) as total_customers,
                    COUNT(DISTINCT for_codigo) as total_industries
                FROM crm_sellout
            `;

            const result = await pool.query(summaryQuery, [currentMonth, lastMonth]);
            const stats = result.rows[0];

            // Calculate growth
            let growth = 0;
            if (parseFloat(stats.last_month_total) > 0) {
                growth = ((parseFloat(stats.current_month_total) - parseFloat(stats.last_month_total)) / parseFloat(stats.last_month_total)) * 100;
            }

            // Get trend (last 6 months)
            const trendResult = await pool.query(`
                SELECT 
                    TO_CHAR(periodo, 'MM/YYYY') as label,
                    SUM(valor) as value
                FROM crm_sellout
                WHERE periodo >= CURRENT_DATE - INTERVAL '6 months'
                GROUP BY periodo
                ORDER BY periodo ASC
            `);

            res.json({
                success: true,
                data: {
                    ...stats,
                    growth: growth.toFixed(2),
                    trend: trendResult.rows
                }
            });
        } catch (error) {
            console.error('❌ [CRM] Error fetching sell-out summary:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Sell-out Pendencies (Who didn't report)
    app.get('/api/crm/sellout/pendencies', async (req, res) => {
        try {
            const { periodo } = req.query; // YYYY-MM-01
            const targetPeriodo = periodo || new Date().toISOString().substring(0, 7) + '-01';

            // Find customers who have reported in the past (active in sell-out routine)
            // but didn't report in the target period.
            const query = `
                SELECT DISTINCT
                    c.cli_codigo,
                    c.cli_nomred,
                    c.cli_cidade,
                    c.cli_uf,
                    v.ven_nome as promotor
                FROM clientes c
                JOIN crm_sellout s_old ON s_old.cli_codigo = c.cli_codigo
                LEFT JOIN vendedores v ON v.ven_codigo = c.cli_vendedor
                WHERE NOT EXISTS (
                    SELECT 1 FROM crm_sellout s_new 
                    WHERE s_new.cli_codigo = c.cli_codigo 
                    AND s_new.periodo = $1
                )
                ORDER BY c.cli_nomred
            `;

            const result = await pool.query(query, [targetPeriodo]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching sell-out pendencies:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create single sell-out record
    app.post('/api/crm/sellout', async (req, res) => {
        console.log('➕ [CRM] Creating sell-out record');
        try {
            const { cli_codigo, for_codigo, periodo, valor, quantidade } = req.body;

            if (!cli_codigo || !for_codigo || !periodo) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente, Indústria e Período são obrigatórios'
                });
            }

            const result = await pool.query(`
                INSERT INTO crm_sellout (cli_codigo, for_codigo, periodo, valor, quantidade)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [cli_codigo, for_codigo, periodo, valor || 0, quantidade || 0]);

            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating sell-out:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Update sell-out record
    app.put('/api/crm/sellout/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { cli_codigo, for_codigo, periodo, valor, quantidade } = req.body;

            const result = await pool.query(`
                UPDATE crm_sellout 
                SET cli_codigo = $1, for_codigo = $2, periodo = $3, valor = $4, quantidade = $5
                WHERE id = $6
                RETURNING *
            `, [cli_codigo, for_codigo, periodo, valor || 0, quantidade || 0, id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Registro não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating sell-out:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Delete sell-out record
    app.delete('/api/crm/sellout/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM crm_sellout WHERE id = $1 RETURNING *', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Registro não encontrado' });
            }

            res.json({ success: true, message: 'Registro removido com sucesso' });
        } catch (error) {
            console.error('❌ [CRM] Error deleting sell-out:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Bulk import from spreadsheet
    app.post('/api/crm/sellout/import', async (req, res) => {
        console.log('📥 [CRM] Importing sell-out data');
        const client = await pool.connect();

        try {
            const { data } = req.body; // Array of { cli_codigo, for_codigo, periodo, valor, quantidade }

            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).json({ success: false, message: 'Nenhum dado para importar' });
            }

            await client.query('BEGIN');

            let imported = 0;
            let errors = [];

            for (const row of data) {
                try {
                    const { cli_codigo, for_codigo, periodo, valor, quantidade } = row;

                    if (!cli_codigo || !for_codigo || !periodo) {
                        errors.push(`Linha inválida: CLI=${cli_codigo}, FOR=${for_codigo}, PERIODO=${periodo}`);
                        continue;
                    }

                    // Upsert - update if exists, insert if not
                    await client.query(`
                        INSERT INTO crm_sellout (cli_codigo, for_codigo, periodo, valor, quantidade)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (cli_codigo, for_codigo, periodo) 
                        DO UPDATE SET valor = $4, quantidade = $5
                    `, [cli_codigo, for_codigo, periodo, valor || 0, quantidade || 0]);

                    imported++;
                } catch (rowError) {
                    errors.push(`Erro na linha CLI=${row.cli_codigo}: ${rowError.message}`);
                }
            }

            await client.query('COMMIT');

            console.log(`✅ [CRM] Imported ${imported} sell-out records`);
            res.json({
                success: true,
                imported,
                total: data.length,
                errors: errors.length > 0 ? errors.slice(0, 10) : undefined
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [CRM] Error importing sell-out:', error);
            res.status(500).json({ success: false, message: error.message });
        } finally {
            client.release();
        }
    });

    console.log('📋 CRM endpoints registered');

    // --- DASHBOARD ENDPOINTS ---

    // GET - Birthdays of the Month
    app.get('/api/crm/stats/birthdays', async (req, res) => {
        try {
            // Correct Logic: fetch from cli_aniv (legacy table) linked to clientes
            // Using EXTRACT(MONTH) ignores the year (2001 or otherwise), which is perfect.
            const query = `
                SELECT
                    c.cli_codigo,
                    c.cli_nomred,
                    c.cli_cidade,
                    c.cli_fone1,
                    a.ani_niver AS cli_datanasc,
                    a.ani_nome,
                    a.ani_funcao,
                    a.ani_fone,
                    a.ani_diaaniv,
                    a.ani_mes,
                    a.ani_timequetorce,
                    a.ani_esportepreferido,
                    a.ani_hobby
                FROM cli_aniv a
                JOIN clientes c ON c.cli_codigo = a.ani_cliente
                WHERE a.ani_niver BETWEEN
                      make_date(2001, EXTRACT(MONTH FROM CURRENT_DATE)::int, 1)
                  AND (make_date(2001, EXTRACT(MONTH FROM CURRENT_DATE)::int, 1)
                       + INTERVAL '1 month - 1 day')
                ORDER BY a.ani_niver ASC, c.cli_nomred ASC
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching birthdays:', error);
            res.json({ success: false, message: 'Table cli_aniv error', data: [] });
        }
    });

    // GET - Top Industries Activity
    app.get('/api/crm/stats/industries', async (req, res) => {
        try {
            // Count interactions joined with opportunities -> suppliers
            // Or if interactions table has for_codigo directly (from our Modal update)
            // Our NovaInteracaoModal didn't save for_codigo in interaction directly yet, 
            // but we can join via Opportunity if linked, OR we check if we added for_codigo column to interactions.
            // Let's assume we look at 'opportunities' created this month for now as a proxy for "Activity" 
            // OR we count interactions if we can link them.

            // Simpler approach: Count Opportunities by Industry (Pipeline Activity)
            const query = `
                SELECT 
                    f.for_nomered as industria,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE o.criado_em >= date_trunc('month', CURRENT_DATE)) as no_mes
                FROM crm_oportunidades o
                JOIN fornecedores f ON f.for_codigo = o.for_codigo
                GROUP BY f.for_nomered
                ORDER BY no_mes DESC, total DESC
                LIMIT 10
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching industry stats:', error);
            res.json({ success: false, data: [] });
        }
    });

    // GET - Team Activity Ranking
    app.get('/api/crm/stats/team', async (req, res) => {
        try {
            const query = `
                SELECT 
                    v.ven_nome as operador,
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE i.data_interacao >= date_trunc('month', CURRENT_DATE)) as no_mes,
                    COUNT(*) FILTER (WHERE i.data_interacao::date = CURRENT_DATE) as no_dia
                FROM crm_interacao i
                JOIN vendedores v ON v.ven_codigo = i.ven_codigo
                GROUP BY v.ven_nome
                ORDER BY no_mes DESC
                LIMIT 10
            `;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching team stats:', error);
            res.json({ success: false, data: [] });
        }
    });

};
