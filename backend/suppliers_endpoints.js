const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    const getPool = (req) => req.pool || pool;

    // 1. List All Suppliers (THE MISSING ONE)
    router.get('/', async (req, res) => {
        try {
            const { status } = req.query;
            let query = `
                SELECT f.*, 
                    (SELECT COUNT(*) FROM cad_prod p WHERE p.pro_industria = f.for_codigo) as total_produtos
                FROM fornecedores f
            `;
            const params = [];

            if (status) {
                query += ` WHERE f.for_tipo2 = $1 `;
                params.push(status);
            }

            query += ` ORDER BY f.for_nomered ASC `;

            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 2. Get segments
    router.get('/segments', async (req, res) => {
        try {
            const result = await getPool(req).query('SELECT * FROM fornecedores_segmentos ORDER BY seg_descricao');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 3. Get single supplier details
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const result = await getPool(req).query('SELECT * FROM fornecedores WHERE for_codigo = $1', [id]);
            if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Não encontrado' });
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 4. Get individual supplier goals (Horizontal ind_metas)
    router.get('/:supplierId/goals/:year', async (req, res) => {
        try {
            const { supplierId, year } = req.params;
            const query = `
                SELECT 
                    met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                    met_jul, met_ago, met_set, met_out, met_nov, met_dez
                FROM ind_metas 
                WHERE met_industria = $1 AND met_ano = $2
            `;
            const result = await getPool(req).query(query, [supplierId, parseInt(year)]);

            // Return empty object if no row found, otherwise the first row
            res.json({ success: true, data: result.rows[0] || {} });
        } catch (error) {
            console.error('❌ [SUPPLIERS] GET goals error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 5. Update/Upsert individual supplier goals
    router.put('/:supplierId/goals/:year', async (req, res) => {
        try {
            const { supplierId, year } = req.params;
            const goals = req.body; // Expects { met_jan: X, met_fev: Y, ... }

            const query = `
                INSERT INTO ind_metas (
                    met_industria, met_ano,
                    met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                    met_jul, met_ago, met_set, met_out, met_nov, met_dez
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT (met_industria, met_ano) DO UPDATE SET
                    met_jan = EXCLUDED.met_jan,
                    met_fev = EXCLUDED.met_fev,
                    met_mar = EXCLUDED.met_mar,
                    met_abr = EXCLUDED.met_abr,
                    met_mai = EXCLUDED.met_mai,
                    met_jun = EXCLUDED.met_jun,
                    met_jul = EXCLUDED.met_jul,
                    met_ago = EXCLUDED.met_ago,
                    met_set = EXCLUDED.met_set,
                    met_out = EXCLUDED.met_out,
                    met_nov = EXCLUDED.met_nov,
                    met_dez = EXCLUDED.met_dez
                RETURNING *
            `;

            const params = [
                supplierId, parseInt(year),
                goals.met_jan || 0, goals.met_fev || 0, goals.met_mar || 0, goals.met_abr || 0,
                goals.met_mai || 0, goals.met_jun || 0, goals.met_jul || 0, goals.met_ago || 0,
                goals.met_set || 0, goals.met_out || 0, goals.met_nov || 0, goals.met_dez || 0
            ];

            const result = await getPool(req).query(query, params);
            res.json({ success: true, message: 'Metas salvas com sucesso!', data: result.rows[0] });
        } catch (error) {
            console.error('❌ [SUPPLIERS] PUT goals error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 6. CREATE INDUSTRY (POST)
    router.post('/', async (req, res) => {
        const d = req.body;

        try {
            // 1. SINCRONIZAR SEQUENCE (REORDER) - Garante que o ID será único
            await getPool(req).query(`
                SELECT setval('gen_fornecedores_id', COALESCE((SELECT MAX(for_codigo) FROM fornecedores), 0) + 1, false)
            `);

            // 2. Obter próximo ID
            const seqRes = await getPool(req).query("SELECT nextval('gen_fornecedores_id') as next_num");
            const nextId = seqRes.rows[0].next_num;

            // 3. TRUNCAR CAMPOS (LIMITES RÍGIDOS DO BANCO LEGADO)
            // for_nomered: 15 chars, for_nome: 75 chars, for_cidade/bairro: 25 chars, for_endereco: 45 chars
            const cleanedNomered = (d.for_nomered || '').substring(0, 15);
            const cleanedNome = (d.for_nome || '').substring(0, 75);
            const cleanedEndereco = (d.for_endereco || '').substring(0, 45);
            const cleanedBairro = (d.for_bairro || '').substring(0, 25);
            const cleanedCidade = (d.for_cidade || '').substring(0, 25);

            const query = `
                INSERT INTO fornecedores (
                    for_codigo, for_nome, for_nomered, for_cgc, for_endereco, for_bairro,
                    for_cidade, for_uf, for_cep, for_fone, for_tipo2,
                    for_email, for_logotipo, for_des1, for_des2, for_des3,
                    for_des4, for_des5, for_des6, for_des7, for_des8,
                    for_des9, for_des10, for_percom, for_codrep, for_tipofrete,
                    observacoes, for_obs2
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
                    $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25, $26, $27, $28
                ) RETURNING *
            `;
            const values = [
                nextId,
                cleanedNome, cleanedNomered, d.for_cgc || '',
                cleanedEndereco, cleanedBairro, cleanedCidade,
                d.for_uf || '', d.for_cep || '', d.for_fone || '', d.for_tipo2 || 'A',
                d.for_email || '', d.for_logotipo || null,
                parseFloat(d.for_des1 || 0), parseFloat(d.for_des2 || 0), parseFloat(d.for_des3 || 0),
                parseFloat(d.for_des4 || 0), parseFloat(d.for_des5 || 0), parseFloat(d.for_des6 || 0),
                parseFloat(d.for_des7 || 0), parseFloat(d.for_des8 || 0), parseFloat(d.for_des9 || 0),
                parseFloat(d.for_des10 || 0), parseFloat(d.for_percom || 0),
                (d.for_codrep && d.for_codrep !== '') ? parseInt(d.for_codrep) : null,
                d.for_tipofrete || 'F', d.observacoes || '', d.for_obs2 || ''
            ];

            const result = await getPool(req).query(query, values);
            res.json({ success: true, data: result.rows[0], message: 'Indústria cadastrada com sucesso!' });

        } catch (error) {
            console.error('❌ [SUPPLIERS] POST Error Detail:', {
                message: error.message,
                detail: error.detail,
                code: error.code
            });
            res.status(500).json({
                success: false,
                message: 'Erro ao salvar. Verifique se os dados estão corretos.',
                error: error.message
            });
        }
    });

    // 7. UPDATE INDUSTRY (PUT)
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const d = req.body;
        try {
            // Truncar campos para evitar erros de overflow (Legacy DB constraints)
            const cleanedNomered = (d.for_nomered || '').substring(0, 15);

            const query = `
                UPDATE fornecedores SET
                    for_nome = $1, for_nomered = $2, for_cgc = $3,
                    for_endereco = $4, for_bairro = $5, for_cidade = $6,
                    for_uf = $7, for_cep = $8, for_fone = $9, for_tipo2 = $10,
                    for_email = $11, for_logotipo = $12,
                    for_des1 = $13, for_des2 = $14, for_des3 = $15, for_des4 = $16, for_des5 = $17,
                    for_des6 = $18, for_des7 = $19, for_des8 = $20, for_des9 = $21, for_des10 = $22,
                    for_percom = $23, for_codrep = $24, for_tipofrete = $25, 
                    observacoes = $26, for_obs2 = $27
                WHERE for_codigo = $28
                RETURNING *
            `;
            const values = [
                d.for_nome || '', cleanedNomered, d.for_cgc || '',
                d.for_endereco || '', d.for_bairro || '', d.for_cidade || '',
                d.for_uf || '', d.for_cep || '', d.for_fone || '', d.for_tipo2 || 'A',
                d.for_email || '', d.for_logotipo || null,
                parseFloat(d.for_des1 || 0), parseFloat(d.for_des2 || 0), parseFloat(d.for_des3 || 0),
                parseFloat(d.for_des4 || 0), parseFloat(d.for_des5 || 0), parseFloat(d.for_des6 || 0),
                parseFloat(d.for_des7 || 0), parseFloat(d.for_des8 || 0), parseFloat(d.for_des9 || 0),
                parseFloat(d.for_des10 || 0), parseFloat(d.for_percom || 0),
                (d.for_codrep && d.for_codrep !== '') ? parseInt(d.for_codrep) : null,
                d.for_tipofrete || 'F', d.observacoes || '', d.for_obs2 || '',
                id
            ];
            const result = await getPool(req).query(query, values);
            res.json({ success: true, data: result.rows[0], message: 'Indústria atualizada com sucesso!' });
        } catch (error) {
            console.error('❌ [SUPPLIERS] PUT Error Detail:', {
                message: error.message,
                detail: error.detail,
                hint: error.hint
            });
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar indústria.',
                error: error.message
            });
        }
    });

    return router;
};
