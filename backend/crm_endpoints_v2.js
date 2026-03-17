// CRM Endpoints Module
// Manages customer relationship interactions and pipeline
const { ensureCrmFollowupsTable } = require('./utils/migration');

module.exports = function (app, pool) {
    console.log("🚀 [CRM] Module Loaded - v2026-02-02-FIX-DATA-COLUMN");

    // --- PIPELINE / KANBAN ENDPOINTS ---

    // GET - List Pipeline Stages with Opportunities
    app.get('/api/crm/pipeline', async (req, res) => {
        try {
            const { ven_codigo, ven_nome } = req.query;

            // Definição das etapas (Hardcoded por enquanto para evitar erro)
            const stages = [
                { etapa_id: 1, descricao: 'Prospecção' },
                { etapa_id: 2, descricao: 'Qualificação' },
                { etapa_id: 3, descricao: 'Proposta' },
                { etapa_id: 4, descricao: 'Negociação' },
                { etapa_id: 5, descricao: 'Fechamento' }
            ];

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
                    (SELECT MAX(i.data_interacao) FROM crm_interacao i WHERE i.oportunidade_id = o.oportunidade_id) as ultima_interacao
                FROM crm_oportunidades o
                JOIN clientes c ON c.cli_codigo = o.cli_codigo
                LEFT JOIN fornecedores f ON f.for_codigo = o.for_codigo
                LEFT JOIN vendedores v ON v.ven_codigo = o.ven_codigo
            `;
            const params = [];
            let paramIndex = 1;

            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                query += ` WHERE o.ven_codigo = $${paramIndex++}`;
                params.push(parseInt(ven_codigo));
            } else if (ven_nome) {
                query += ` WHERE v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
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

            if (!titulo || !cli_codigo) {
                return res.status(400).json({ success: false, message: 'Título e cliente são obrigatórios' });
            }

            // Convert empty strings to null for optional numeric/integer fields
            const cleanValue = (val) => (val === '' || val === undefined) ? null : val;

            const result = await pool.query(`
                INSERT INTO crm_oportunidades 
                (titulo, cli_codigo, ven_codigo, valor_estimado, etapa_id, for_codigo, telefone_contato)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [
                titulo, 
                parseInt(cli_codigo), 
                parseInt(ven_codigo) || 1, 
                cleanValue(valor_estimado), 
                parseInt(etapa_id) || 1, 
                cleanValue(for_codigo), 
                telefone_contato || null
            ]);

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error creating opportunity:', error);
            if (error.code === '42703') { // Undefined column
                res.status(500).json({ success: false, message: 'Erro de Banco: Colunas ausentes. Execute migração.' });
            } else if (error.code === '23503') { // FK violation
                res.status(500).json({ success: false, message: 'Erro de integridade: Vendedor ou Cliente inválido.' });
            } else {
                res.status(500).json({ success: false, message: error.message });
            }
        }
    });

    // GET - List sellers (Simplified for lookups)
    app.get('/api/crm/vendedores', async (req, res) => {
        try {
            const result = await pool.query('SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_status = \'A\' OR ven_status IS NULL ORDER BY ven_nome');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM] Error fetching sellers:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT - Move Opportunity (Drag & Drop)
    app.put('/api/crm/oportunidades/:id/move', async (req, res) => {
        try {
            const { id } = req.params;
            const { etapa_id } = req.body;

            if (!etapa_id || isNaN(parseInt(etapa_id))) {
                return res.status(400).json({ success: false, message: 'Etapa inválida' });
            }

            await pool.query(
                'UPDATE crm_oportunidades SET etapa_id = $1, atualizado_em = CURRENT_TIMESTAMP WHERE oportunidade_id = $2',
                [parseInt(etapa_id), id]
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

            // Convert empty strings to null for optional numeric/integer fields
            const cleanValue = (val) => (val === '' || val === undefined) ? null : val;

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
            `, [
                titulo, 
                parseInt(cli_codigo), 
                parseInt(ven_codigo) || 1, 
                cleanValue(valor_estimado), 
                parseInt(etapa_id) || 1, 
                cleanValue(for_codigo), 
                telefone_contato || null, 
                id
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Oportunidade não encontrada' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM] Error updating opportunity:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // --- CLIENT 360 & INTELLIGENCE ENDPOINTS ---

    // GET - Client Penetration Matrix (GAPs)
    // Crosses suppliers with client orders across ALL history
    app.get('/api/crm/client-matrix/:id', async (req, res) => {
        try {
            const { id } = req.params; // cli_codigo

            const query = `
                WITH client_purchases AS (
                    SELECT 
                        ped_industria,
                        SUM(ped_totliq) as total_valor,
                        COUNT(*) as total_pedidos
                    FROM pedidos
                    WHERE ped_cliente = $1
                    GROUP BY ped_industria
                )
                SELECT 
                    f.for_codigo as id,
                    f.for_nomered as name,
                    CASE WHEN cp.ped_industria IS NOT NULL THEN 'active' ELSE 'gap' END as status,
                    COALESCE(cp.total_valor, 0) as value_raw,
                    COALESCE(cp.total_pedidos, 0) as pedidos_count
                FROM fornecedores f
                LEFT JOIN client_purchases cp ON cp.ped_industria = f.for_codigo
                WHERE f.for_tipo2 <> 'I' -- Exclude inactive industries
                ORDER BY status, name
            `;

            const result = await pool.query(query, [id]);

            // Format for frontend
            const formatted = result.rows.map(row => ({
                id: row.id,
                name: row.name,
                status: row.status,
                value: row.value_raw > 0 ? `R$ ${(row.value_raw / 1000).toFixed(1)}k` : 'R$ 0'
            }));

            res.json({ success: true, data: formatted });
        } catch (error) {
            console.error('❌ [CRM] Error fetching client matrix:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // --- CHECK-IN / GEOLOCATION ENDPOINTS ---

    // POST - Register Check-in
    app.post('/api/crm/checkin', async (req, res) => {
        try {
            const { ven_codigo, cli_codigo, latitude, longitude, precisao, observacao, tipo } = req.body;

            if (!ven_codigo || !cli_codigo) {
                return res.status(400).json({ success: false, message: 'ven_codigo e cli_codigo são obrigatórios' });
            }

            // Ensure table exists (Safe check-in creation logic)
            await pool.query(`
                CREATE TABLE IF NOT EXISTS crm_checkins (
                    id SERIAL PRIMARY KEY,
                    ven_codigo INTEGER,
                    cli_codigo INTEGER,
                    latitude NUMERIC,
                    longitude NUMERIC,
                    precisao NUMERIC,
                    observacao TEXT,
                    tipo VARCHAR(50) DEFAULT 'VISITA',
                    data_checkin TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            const result = await pool.query(`
                INSERT INTO crm_checkins 
                (ven_codigo, cli_codigo, latitude, longitude, precisao, observacao, tipo)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `, [ven_codigo, cli_codigo, latitude, longitude, precisao, observacao || null, tipo || 'VISITA']);

            res.json({ success: true, data: result.rows[0], message: 'Check-in realizado com sucesso!' });
        } catch (error) {
            console.error('❌ [CRM] Error on check-in:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // --- INTERACTIONS ENDPOINTS (EXISTING) ---

    // GET - List interactions for a seller
    app.get('/api/crm/interacoes', async (req, res) => {
        console.log('📋 [CRM] Fetching interactions');
        try {
            const { ven_codigo, ven_nome, cli_codigo, for_codigo, data_inicio, data_fim } = req.query;

            let query = `
                SELECT 
                    i.interacao_id,
                    i.data_interacao,
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
                LEFT JOIN vendedores v ON v.ven_codigo = i.ven_codigo
                WHERE 1=1
            `;

            const params = [];
            let paramIndex = 1;

            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                query += ` AND i.ven_codigo = $${paramIndex++}`;
                params.push(parseInt(ven_codigo));
            } else if (ven_nome) {
                query += ` AND v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
            }

            if (cli_codigo) {
                query += ` AND i.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }

            if (for_codigo) {
                query += ` AND EXISTS (
                    SELECT 1 FROM crm_interacao_industria ii 
                    WHERE ii.interacao_id = i.interacao_id AND ii.for_codigo = $${paramIndex++}
                )`;
                params.push(parseInt(for_codigo));
            }

            // New Date Filters - DATE type based filtering
            if (data_inicio) {
                query += ` AND i.data_interacao::date >= $${paramIndex++}::date`;
                params.push(data_inicio);
            }
            if (data_fim) {
                query += ` AND i.data_interacao::date <= $${paramIndex++}::date`;
                params.push(data_fim);
            }

            query += ` ORDER BY i.data_interacao DESC LIMIT 100`;

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
                data_interacao
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
                    data_interacao = $6
                WHERE interacao_id = $7
            `, [
                cli_codigo,
                tipo_interacao_id,
                canal_id || null,
                resultado_id || null,
                descricao || '',
                data_interacao || new Date(),
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
            const { for_codigo, cli_codigo, periodo } = req.query;

            // Base Date Logic
            const baseMonth = periodo ? periodo : new Date().toISOString().substring(0, 7) + '-01';
            const currentMonth = baseMonth.length === 7 ? baseMonth + '-01' : baseMonth;

            const dateObj = new Date(currentMonth);
            const lastMonth = new Date(dateObj.setMonth(dateObj.getMonth() - 1)).toISOString().substring(0, 7) + '-01';

            let whereClause = '';
            let params = [currentMonth, lastMonth];
            let paramCount = 3;

            if (for_codigo && for_codigo !== 'ALL') {
                whereClause += ` AND for_codigo = $${paramCount++}`;
                params.push(parseInt(for_codigo));
            }
            if (cli_codigo && cli_codigo !== 'ALL') {
                whereClause += ` AND cli_codigo = $${paramCount++}`;
                params.push(parseInt(cli_codigo));
            }

            const summaryQuery = `
                SELECT 
                    COALESCE(SUM(CASE WHEN periodo = $1 THEN valor ELSE 0 END), 0) as current_month_total,
                    COALESCE(SUM(CASE WHEN periodo = $2 THEN valor ELSE 0 END), 0) as last_month_total,
                    COUNT(DISTINCT cli_codigo) as total_customers,
                    COUNT(DISTINCT for_codigo) as total_industries
                FROM crm_sellout
                WHERE 1=1 ${whereClause}
            `;

            const result = await pool.query(summaryQuery, params);
            const stats = result.rows[0];

            // Calculate growth
            let growth = 0;
            if (parseFloat(stats.last_month_total) > 0) {
                growth = ((parseFloat(stats.current_month_total) - parseFloat(stats.last_month_total)) / parseFloat(stats.last_month_total)) * 100;
            }

            // Get trend (Quarterly view: 3 months before and 3 months after selected month)
            let trendParams = [currentMonth];
            let trendFilter = '';
            let trendIdx = 2;

            if (for_codigo && for_codigo !== 'ALL') {
                trendFilter += ` AND s.for_codigo = $${trendIdx++}`;
                trendParams.push(parseInt(for_codigo));
            }
            if (cli_codigo && cli_codigo !== 'ALL') {
                trendFilter += ` AND s.cli_codigo = $${trendIdx++}`;
                trendParams.push(parseInt(cli_codigo));
            }

            const trendResult = await pool.query(`
                WITH months AS (
                    SELECT generate_series(
                        $1::date - INTERVAL '3 months',
                        $1::date + INTERVAL '3 months',
                        '1 month'::interval
                    )::date as mes
                )
                SELECT 
                    TO_CHAR(m.mes, 'MM/YYYY') as label,
                    COALESCE(SUM(s.valor), 0) as value,
                    COALESCE(SUM(s.quantidade), 0) as volume
                FROM months m
                LEFT JOIN crm_sellout s ON s.periodo = m.mes ${trendFilter}
                GROUP BY m.mes
                ORDER BY m.mes ASC
            `, trendParams);

            // NEW: Performance by Client (Ranking do Mês)
            const buildRankingQuery = (useMaxPeriod = false) => {
                let rankingParams = [];
                let rankingWhere = '';
                let index = 1;

                if (useMaxPeriod) {
                    // O subquery do MAX deve respeitar os mesmos filtros
                    let subWhere = '1=1';
                    let subParams = [];
                    let subIndex = 1;
                    if (for_codigo && for_codigo !== 'ALL') {
                        subWhere += ` AND for_codigo = $${subIndex++}`;
                        subParams.push(parseInt(for_codigo));
                    }
                    if (cli_codigo && cli_codigo !== 'ALL') {
                        subWhere += ` AND cli_codigo = $${subIndex++}`;
                        subParams.push(parseInt(cli_codigo));
                    }

                    rankingWhere = `s.periodo = (SELECT MAX(periodo) FROM crm_sellout WHERE ${subWhere})`;
                    rankingParams = subParams;
                    index = subIndex;
                } else {
                    rankingWhere = `TO_CHAR(s.periodo, 'YYYY-MM') = TO_CHAR($${index++}::date, 'YYYY-MM')`;
                    rankingParams.push(currentMonth);
                }

                if (for_codigo && for_codigo !== 'ALL') {
                    rankingWhere += ` AND s.for_codigo = $${index++}`;
                    rankingParams.push(parseInt(for_codigo));
                }
                if (cli_codigo && cli_codigo !== 'ALL') {
                    rankingWhere += ` AND s.cli_codigo = $${index++}`;
                    rankingParams.push(parseInt(cli_codigo));
                }

                const sql = `
                    SELECT 
                        COALESCE(c.cli_nomred, c.cli_nome, 'Cli: ' || s.cli_codigo) as label,
                        SUM(s.valor) as value,
                        SUM(s.quantidade) as volume
                    FROM crm_sellout s
                    JOIN clientes c ON s.cli_codigo = c.cli_codigo
                    WHERE ${rankingWhere}
                    GROUP BY 1
                    ORDER BY value DESC
                    LIMIT 5
                `;
                return { sql, params: rankingParams };
            };

            const rankingObj = buildRankingQuery(false);
            let rankingResult = await pool.query(rankingObj.sql, rankingObj.params);

            // Se o ranking estiver vazio para o mês selecionado, buscamos o último mês com registros
            if (rankingResult.rows.length === 0) {
                const fallbackObj = buildRankingQuery(true);
                rankingResult = await pool.query(fallbackObj.sql, fallbackObj.params);
            }

            res.json({
                success: true,
                data: {
                    ...stats,
                    growth: growth.toFixed(2),
                    trend: trendResult.rows,
                    ranking: rankingResult.rows
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
                ON CONFLICT (cli_codigo, for_codigo, periodo) 
                DO UPDATE SET valor = EXCLUDED.valor, quantidade = EXCLUDED.quantidade
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

    // --- DASHBOARD & STATS ENDPOINTS ---

    app.get('/api/crm/stats/summary', async (req, res) => {
        try {
            const { ven_codigo, ven_nome, data_inicio, data_fim, for_codigo } = req.query;
            let params = [];
            let whereClause = ' WHERE 1=1';

            // Prioridade ao Nome (Operador) conforme pedido
            if (ven_nome) {
                whereClause += ' AND EXISTS (SELECT 1 FROM vendedores v WHERE v.ven_codigo = i.ven_codigo AND v.ven_nome ILIKE $1)';
                params.push(`%${ven_nome}%`);
            } else if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                whereClause += ' AND i.ven_codigo = $1';
                params.push(parseInt(ven_codigo));
            }

            if (for_codigo && for_codigo !== 'all' && !isNaN(parseInt(for_codigo))) {
                const fIdx = params.length + 1;
                // Check if interaction is linked to this industry
                whereClause += ` AND EXISTS (SELECT 1 FROM crm_interacao_industria ii WHERE ii.interacao_id = i.interacao_id AND ii.for_codigo = $${fIdx})`;
                params.push(parseInt(for_codigo));
            }

            // Inactivity Insight (Fixed logic)
            let inactivityWhere = '';
            let inactivityParams = [];
            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                inactivityWhere = ' AND c.cli_vendedor = $1';
                inactivityParams.push(parseInt(ven_codigo));
            }

            const inactivityQuery = `
                SELECT COUNT(*) as count
                FROM clientes c
                WHERE NOT EXISTS (
                    SELECT 1 FROM crm_interacao i 
                    WHERE i.cli_codigo = c.cli_codigo 
                    AND i.data_interacao >= CURRENT_DATE - INTERVAL '30 days'
                )
                ${inactivityWhere}
            `;

            const startDate = data_inicio ? `${data_inicio} 00:00:00` : null;
            const endDate = data_fim ? `${data_fim} 23:59:59` : null;

            const queryParams = [...params];
            const pIdx = queryParams.length;

            const statsQuery = `
                SELECT 
                    COUNT(*) FILTER (WHERE data_interacao::date = CURRENT_DATE) as total_hoje,
                    COUNT(*) FILTER (WHERE data_interacao >= date_trunc('month', CURRENT_DATE)) as total_mes,
                    COUNT(*) FILTER (WHERE data_interacao >= CURRENT_DATE - INTERVAL '30 days') as total_30d,
                    COUNT(*) FILTER (WHERE resultado_id IS NULL OR resultado_id = 1) as pendentes,
                    COUNT(*) FILTER (WHERE $${pIdx + 1}::timestamp IS NULL OR (data_interacao >= $${pIdx + 1} AND data_interacao <= $${pIdx + 2})) as total_periodo
                FROM crm_interacao i
                ${whereClause}
            `;

            queryParams.push(startDate, endDate);

            const [statsRes, inactRes] = await Promise.all([
                pool.query(statsQuery, queryParams),
                pool.query(inactivityQuery, inactivityParams)
            ]);

            const stats = statsRes.rows[0];
            const inactCount = inactRes.rows[0].count;

            res.json({
                success: true,
                data: {
                    totalHoje: parseInt(stats.total_hoje || 0),
                    totalMes: parseInt(stats.total_mes || 0),
                    total30d: parseInt(stats.total_30d || 0),
                    totalPeriodo: parseInt(stats.total_periodo || 0),
                    pendentes: parseInt(stats.pendentes || 0),
                    insights: {
                        inatividade: parseInt(inactCount || 0),
                        gap: stats.total_30d > 0 ? "Atividade recuperada via migração de dados" : "Sincronizando base histórica..."
                    }
                }
            });
        } catch (error) {
            console.error('❌ [CRM V2] Error fetching summary stats:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Team Live Feed / Real Time Operations
    // GET - Team Interaction Log with Filters
    app.get('/api/crm/stats/live-feed', async (req, res) => {
        try {
            const { ven_codigo, ven_nome, cli_codigo, for_codigo, data_inicio, data_fim } = req.query;
            let query = `
                SELECT 
                    i.*,
                    v.ven_nome as name,
                    c.cli_nomred as task,
                    i.data_interacao as last_sync,
                    'Ativo' as status
                FROM crm_interacao i
                JOIN vendedores v ON v.ven_codigo = i.ven_codigo
                JOIN clientes c ON c.cli_codigo = i.cli_codigo
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                query += ` AND i.ven_codigo = $${paramIndex++}`;
                params.push(parseInt(ven_codigo));
            } else if (ven_nome) {
                query += ` AND v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
            }
            if (cli_codigo) {
                query += ` AND i.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }
            if (for_codigo) {
                query += ` AND EXISTS (SELECT 1 FROM crm_interacao_industria ii WHERE ii.interacao_id = i.interacao_id AND ii.for_codigo = $${paramIndex++})`;
                params.push(for_codigo);
            }
            if (data_inicio) {
                query += ` AND i.data_interacao >= $${paramIndex++}::timestamp`;
                params.push(`${data_inicio} 00:00:00`);
            }
            if (data_fim) {
                query += ` AND i.data_interacao <= $${paramIndex++}::timestamp`;
                params.push(`${data_fim} 23:59:59`);
            }

            query += ` ORDER BY i.data_interacao DESC LIMIT 50`;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM V2] Error fetching interactions log:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Team Activity Ranking with Filters
    app.get('/api/crm/stats/team', async (req, res) => {
        try {
            const { ven_codigo, ven_nome, cli_codigo, for_codigo, data_inicio, data_fim } = req.query;
            let query = `
                SELECT 
                    v.ven_nome as operador,
                    COUNT(*) as total,
                    COUNT(*) as no_mes,
                    COUNT(*) FILTER (WHERE i.data_interacao::date = CURRENT_DATE) as no_dia
                FROM crm_interacao i
                JOIN vendedores v ON v.ven_codigo = i.ven_codigo
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                query += ` AND i.ven_codigo = $${paramIndex++}`;
                params.push(parseInt(ven_codigo));
            } else if (ven_nome) {
                query += ` AND v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
            }
            if (cli_codigo) {
                query += ` AND i.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }
            if (for_codigo) {
                query += ` AND EXISTS (SELECT 1 FROM crm_interacao_industria ii WHERE ii.interacao_id = i.interacao_id AND ii.for_codigo = $${paramIndex++})`;
                params.push(for_codigo);
            }
            if (data_inicio) {
                query += ` AND i.data_interacao >= $${paramIndex++}::timestamp`;
                params.push(`${data_inicio} 00:00:00`);
            }
            if (data_fim) {
                query += ` AND i.data_interacao <= $${paramIndex++}::timestamp`;
                params.push(`${data_fim} 23:59:59`);
            }

            query += ` GROUP BY v.ven_nome ORDER BY no_mes DESC LIMIT 10`;
            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM V2] Error fetching team stats:', error);
            res.json({ success: false, data: [] });
        }
    });

    // GET - Industry Activity Ranking with Filters (Horizontal Bar Data)
    app.get('/api/crm/stats/industries', async (req, res) => {
        try {
            const { ven_codigo, ven_nome, cli_codigo, for_codigo, data_inicio, data_fim } = req.query;
            let query = `
                SELECT 
                    f.for_nomered as name,
                    COUNT(*) as total
                FROM crm_interacao_industria ii
                JOIN crm_interacao i ON i.interacao_id = ii.interacao_id
                JOIN fornecedores f ON f.for_codigo = ii.for_codigo
                LEFT JOIN vendedores v ON v.ven_codigo = i.ven_codigo
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (ven_codigo && !isNaN(parseInt(ven_codigo))) {
                query += ` AND i.ven_codigo = $${paramIndex++}`;
                params.push(parseInt(ven_codigo));
            } else if (ven_nome) {
                query += ` AND v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
            }
            if (cli_codigo) {
                query += ` AND i.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }
            if (for_codigo) {
                query += ` AND ii.for_codigo = $${paramIndex++}`;
                params.push(for_codigo);
            }
            if (data_inicio) {
                query += ` AND i.data_interacao >= $${paramIndex++}::timestamp`;
                params.push(`${data_inicio} 00:00:00`);
            }
            if (data_fim) {
                query += ` AND i.data_interacao <= $${paramIndex++}::timestamp`;
                params.push(`${data_fim} 23:59:59`);
            }

            query += ` GROUP BY f.for_nomered ORDER BY total DESC LIMIT 10`;
            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM V2] Error fetching industry stats:', error);
            res.json({ success: false, data: [] });
        }
    });

    // GET - Last 10 purchases for a specific client
    app.get('/api/crm/client/:id/last-purchases', async (req, res) => {
        try {
            const { id } = req.params;
            const { for_codigo, data_inicio, data_fim } = req.query;
            console.log(`📦 [CRM V2] Fetching last purchases for client ${id}`);

            let query = `
                SELECT 
                    p.ped_pedido as id,
                    p.ped_data as date,
                    COALESCE(f.for_nomered, 'N/I') as industry,
                    p.ped_totliq as value,
                    p.ped_situacao as status,
                    COALESCE((SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido), 0) as quantity
                FROM pedidos p
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_cliente = $1
                AND p.ped_situacao IN ('P', 'F')
            `;
            const params = [id];
            let pIdx = 2;

            if (for_codigo && for_codigo !== 'all' && for_codigo !== '') {
                query += ` AND p.ped_industria = $${pIdx++}`;
                params.push(for_codigo);
            }

            if (data_inicio) {
                query += ` AND p.ped_data >= $${pIdx++}`;
                params.push(data_inicio);
            }

            if (data_fim) {
                query += ` AND p.ped_data <= $${pIdx++}`;
                params.push(data_fim);
            }

            query += ` ORDER BY p.ped_data DESC LIMIT 10`;

            const result = await pool.query(query, params);
            console.log(`✅ [CRM V2] Found ${result.rows.length} purchases for client ${id}`);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM V2] Error fetching last purchases:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== FOLLOW-UPS ENDPOINTS ====================

    // Helper to resolve ven_codigo if missing
    const resolveVendedor = async (req, bodyOrQuery) => {
        let ven = bodyOrQuery.ven_codigo;
        if (!ven || isNaN(parseInt(ven))) {
            const userId = req.headers['x-user-id'];
            if (userId) {
                const res = await pool.query('SELECT ven_codigo FROM vendedores WHERE ven_codusu = $1 LIMIT 1', [userId]);
                ven = res.rows[0]?.ven_codigo;
            }
        }
        return ven;
    };

    // GET - List follow-ups for a seller
    app.get('/api/crm/followups', async (req, res) => {
        try {
            const { ven_nome, status, periodo, cli_codigo } = req.query;
            let ven_codigo = await resolveVendedor(req, req.query);

            let query = `
                SELECT 
                    f.*,
                    c.cli_nomred,
                    c.cli_cidade,
                    c.cli_uf
                FROM crm_followups f
                LEFT JOIN clientes c ON c.cli_codigo = f.cli_codigo
                LEFT JOIN vendedores v ON v.ven_codigo = f.ven_codigo
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (ven_codigo) {
                query += ` AND f.ven_codigo = $${paramIndex++}`;
                params.push(ven_codigo);
            } else if (ven_nome) {
                query += ` AND v.ven_nome ILIKE $${paramIndex++}`;
                params.push(`%${ven_nome}%`);
            }

            if (status && status !== 'todos') {
                query += ` AND f.status = $${paramIndex++}`;
                params.push(status);
            }

            if (cli_codigo) {
                query += ` AND f.cli_codigo = $${paramIndex++}`;
                params.push(cli_codigo);
            }

            if (periodo === 'atrasados') {
                query += ` AND f.status = 'pendente' AND f.data_prevista < CURRENT_DATE`;
            } else if (periodo === 'hoje') {
                query += ` AND f.status = 'pendente' AND f.data_prevista = CURRENT_DATE`;
            } else if (periodo === 'semana') {
                query += ` AND f.status = 'pendente' AND f.data_prevista BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
            }

            query += ` ORDER BY 
                CASE f.status WHEN 'pendente' THEN 0 WHEN 'concluido' THEN 1 ELSE 2 END,
                CASE f.prioridade WHEN 'alta' THEN 0 WHEN 'media' THEN 1 ELSE 2 END,
                f.data_prevista ASC
                LIMIT 200
            `;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            if (error.message.includes('relation "crm_followups" does not exist')) {
                console.warn('⚠️ [CRM V2] Tabela crm_followups não encontrada. Iniciando migração automática...');
                await ensureCrmFollowupsTable(pool);
                
                try {
                    const retryResult = await pool.query(query, params);
                    return res.json({ success: true, data: retryResult.rows });
                } catch (retryErr) {
                    console.error('❌ [CRM V2] Erro persistente após migração automática (listagem):', retryErr.message);
                    return res.json({ success: true, data: [] });
                }
            }
            console.error('❌ [CRM V2] Error fetching follow-ups:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Follow-up counters (for dashboard widget)
    app.get('/api/crm/followups/count', async (req, res) => {
        try {
            const { ven_nome } = req.query;
            let ven_codigo = await resolveVendedor(req, req.query);

            let whereClause = ' WHERE 1=1';
            const params = [];
            let paramIndex = 1;

            if (ven_codigo) {
                whereClause += ` AND ven_codigo = $${paramIndex++}`;
                params.push(ven_codigo);
            } else if (ven_nome) {
                whereClause += ` AND EXISTS (SELECT 1 FROM vendedores v WHERE v.ven_codigo = crm_followups.ven_codigo AND v.ven_nome ILIKE $${paramIndex++})`;
                params.push(`%${ven_nome}%`);
            }

            const sqlCount = `
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'pendente' AND data_prevista < CURRENT_DATE) as atrasados,
                    COUNT(*) FILTER (WHERE status = 'pendente' AND data_prevista = CURRENT_DATE) as hoje,
                    COUNT(*) FILTER (WHERE status = 'pendente' AND data_prevista BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days') as semana,
                    COUNT(*) FILTER (WHERE status = 'pendente') as total_pendentes,
                    COUNT(*) FILTER (WHERE status = 'concluido' AND data_conclusao >= CURRENT_DATE - INTERVAL '30 days') as concluidos_mes
                FROM crm_followups
                ${whereClause}
            `;

            const result = await pool.query(sqlCount, params);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            if (error.message.includes('relation "crm_followups" does not exist')) {
                console.warn('⚠️ [CRM V2] Tabela crm_followups não encontrada. Iniciando migração automática...');
                await ensureCrmFollowupsTable(pool);
                
                try {
                    const retryCount = await pool.query(sqlCount, params);
                    return res.json({ success: true, data: retryCount.rows[0] });
                } catch (retryErr) {
                    console.error('❌ [CRM V2] Erro persistente após migração automática (contagem):', retryErr.message);
                    return res.json({ success: true, data: { atrasados: 0, hoje: 0, semana: 0, total_pendentes: 0, concluidos_mes: 0 } });
                }
            }
            console.error('❌ [CRM V2] Error fetching follow-up counts:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Create follow-up
    app.post('/api/crm/followups', async (req, res) => {
        try {
            const { cli_codigo, interacao_id, oportunidade_id, titulo, descricao, data_prevista, prioridade, tipo } = req.body;
            let ven_codigo = await resolveVendedor(req, req.body);

            if (!ven_codigo || !titulo || !data_prevista) {
                return res.status(400).json({ success: false, message: 'ven_codigo (ou vínculo de vendedor), titulo e data_prevista são obrigatórios' });
            }

            const result = await pool.query(`
                INSERT INTO crm_followups 
                (ven_codigo, cli_codigo, interacao_id, oportunidade_id, titulo, descricao, data_prevista, prioridade, tipo)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING *
            `, [
                ven_codigo,
                cli_codigo || null,
                interacao_id || null,
                oportunidade_id || null,
                titulo,
                descricao || null,
                data_prevista,
                prioridade || 'media',
                tipo || 'outro'
            ]);

            console.log(`✅ [CRM V2] Follow-up ${result.rows[0].id} created`);
            res.status(201).json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM V2] Error creating follow-up:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PATCH - Update follow-up (status, reschedule, edit)
    app.patch('/api/crm/followups/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { status, titulo, descricao, data_prevista, prioridade, tipo } = req.body;

            const setClauses = [];
            const params = [];
            let paramIndex = 1;

            if (status !== undefined) {
                setClauses.push(`status = $${paramIndex++}`);
                params.push(status);
                if (status === 'concluido') {
                    setClauses.push(`data_conclusao = NOW()`);
                }
            }
            if (titulo !== undefined) { setClauses.push(`titulo = $${paramIndex++}`); params.push(titulo); }
            if (descricao !== undefined) { setClauses.push(`descricao = $${paramIndex++}`); params.push(descricao); }
            if (data_prevista !== undefined) { setClauses.push(`data_prevista = $${paramIndex++}`); params.push(data_prevista); }
            if (prioridade !== undefined) { setClauses.push(`prioridade = $${paramIndex++}`); params.push(prioridade); }
            if (tipo !== undefined) { setClauses.push(`tipo = $${paramIndex++}`); params.push(tipo); }

            if (setClauses.length === 0) {
                return res.status(400).json({ success: false, message: 'Nenhum campo para atualizar' });
            }

            params.push(id);
            const result = await pool.query(
                `UPDATE crm_followups SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
                params
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Follow-up não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [CRM V2] Error updating follow-up:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // DELETE - Remove follow-up
    app.delete('/api/crm/followups/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await pool.query('DELETE FROM crm_followups WHERE id = $1 RETURNING id', [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Follow-up não encontrado' });
            }

            res.json({ success: true, message: 'Follow-up removido' });
        } catch (error) {
            console.error('❌ [CRM V2] Error deleting follow-up:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

};
