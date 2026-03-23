const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    const getPool = (req) => req.pool || pool;

    // 1. List All Suppliers
    router.get('/', async (req, res) => {
        try {
            const { status, all } = req.query;
            const userId = req.headers['x-user-id'] || req.query.userId;
            const currentPool = getPool(req);

            let query = `
                SELECT f.*, 
                    (SELECT COUNT(*) FROM cad_prod p WHERE p.pro_industria = f.for_codigo) as total_produtos
                FROM fornecedores f
            `;
            const params = [];
            const filters = [];

            if (status) {
                filters.push(`f.for_tipo2 = $${params.length + 1}`);
                params.push(status);
            } else if (all !== 'true') {
                filters.push(`f.for_tipo2 = 'A'`);
            }

            if (userId && userId !== 'undefined') {
                try {
                    const userRes = await currentPool.query(
                        'SELECT master FROM user_nomes WHERE codigo = $1',
                        [parseInt(userId)]
                    );

                    if (userRes.rows.length > 0 && !userRes.rows[0].master) {
                        const sellerRes = await currentPool.query(
                            'SELECT ven_codigo FROM vendedores WHERE ven_codusu = $1',
                            [parseInt(userId)]
                        );

                        if (sellerRes.rows.length > 0) {
                            const sellerId = sellerRes.rows[0].ven_codigo;
                            filters.push(`f.for_codigo IN (SELECT vin_industria FROM vendedor_ind WHERE vin_codigo = $${params.length + 1})`);
                            params.push(sellerId);
                        } else {
                            filters.push('1=0');
                        }
                    }
                } catch (err) {
                    console.error('⚠️ [SUPPLIERS] Filter error:', err.message);
                }
            }

            if (filters.length > 0) {
                query += ` WHERE ${filters.join(' AND ')} `;
            }

            query += ` ORDER BY f.for_nomered ASC `;

            const result = await currentPool.query(query, params);
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

    // 4. Get goals
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
            res.json({ success: true, data: result.rows[0] || {} });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 5. Update goals
    router.put('/:supplierId/goals/:year', async (req, res) => {
        try {
            const { supplierId, year } = req.params;
            const goals = req.body;
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
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 6. Create supplier
    router.post('/', async (req, res) => {
        const d = req.body;
        try {
            await getPool(req).query(`SELECT setval('gen_fornecedores_id', COALESCE((SELECT MAX(for_codigo) FROM fornecedores), 0) + 1, false)`);
            const seqRes = await getPool(req).query("SELECT nextval('gen_fornecedores_id') as next_num");
            const nextId = seqRes.rows[0].next_num;

            const query = `
                INSERT INTO fornecedores (
                    for_codigo, for_nome, for_nomered, for_cgc, for_endereco, for_bairro,
                    for_cidade, for_uf, for_cep, for_fone, for_tipo2, for_email, for_tipofrete,
                    for_des1, for_des2, for_des3, for_des4, for_des5, for_des6, for_des7, for_des8, for_des9, for_des10,
                    for_percom, for_codrep, for_logotipo, observacoes, for_obs2
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
                    $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
                    $24, $25, $26, $27, $28
                ) RETURNING *
            `;
            const params = [
                nextId, d.for_nome || '', (d.for_nomered || '').substring(0, 15), d.for_cgc || '',
                d.for_endereco || '', d.for_bairro || '', d.for_cidade || '', d.for_uf || '', d.for_cep || '',
                d.for_fone || '', d.for_tipo2 || 'A', d.for_email || '', d.for_tipofrete || 'F',
                parseFloat(d.for_des1) || 0, parseFloat(d.for_des2) || 0, parseFloat(d.for_des3) || 0,
                parseFloat(d.for_des4) || 0, parseFloat(d.for_des5) || 0, parseFloat(d.for_des6) || 0,
                parseFloat(d.for_des7) || 0, parseFloat(d.for_des8) || 0, parseFloat(d.for_des9) || 0,
                parseFloat(d.for_des10) || 0, parseFloat(d.for_percom) || 0, 
                parseInt(d.for_codrep) || null, d.for_logotipo || null, d.observacoes || '', d.for_obs2 || ''
            ];
            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 7. Update supplier
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const d = req.body;
        try {
            const query = `
                UPDATE fornecedores SET
                    for_nome = $1, for_nomered = $2, for_cgc = $3,
                    for_endereco = $4, for_bairro = $5, for_cidade = $6,
                    for_uf = $7, for_cep = $8, for_fone = $9, for_tipo2 = $10,
                    for_email = $11, for_tipofrete = $12,
                    for_des1 = $13, for_des2 = $14, for_des3 = $15, for_des4 = $16, for_des5 = $17,
                    for_des6 = $18, for_des7 = $19, for_des8 = $20, for_des9 = $21, for_des10 = $22,
                    for_percom = $23, for_codrep = $24, for_logotipo = $25, 
                    observacoes = $26, for_obs2 = $27
                WHERE for_codigo = $28
                RETURNING *
            `;
            const params = [
                d.for_nome || '', (d.for_nomered || '').substring(0, 15), d.for_cgc || '',
                d.for_endereco || '', d.for_bairro || '', d.for_cidade || '',
                d.for_uf || '', d.for_cep || '', d.for_fone || '', d.for_tipo2 || 'A',
                d.for_email || '', d.for_tipofrete || 'F',
                parseFloat(d.for_des1) || 0, parseFloat(d.for_des2) || 0, parseFloat(d.for_des3) || 0,
                parseFloat(d.for_des4) || 0, parseFloat(d.for_des5) || 0, parseFloat(d.for_des6) || 0,
                parseFloat(d.for_des7) || 0, parseFloat(d.for_des8) || 0, parseFloat(d.for_des9) || 0,
                parseFloat(d.for_des10) || 0, parseFloat(d.for_percom) || 0, 
                parseInt(d.for_codrep) || null, d.for_logotipo || null, d.observacoes || '', d.for_obs2 || '',
                id
            ];
            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 8. IA Knowledge
    router.get('/:supplierId/ia-knowledge', async (req, res) => {
        try {
            const { supplierId } = req.params;
            const result = await getPool(req).query('SELECT * FROM ia_conhecimento WHERE for_codigo = $1', [supplierId]);
            res.json({ success: true, data: result.rows[0] || {} });
        } catch (error) {
            if (error.code === '42P01') return res.json({ success: true, data: {} });
            res.status(500).json({ success: false, message: error.message });
        }
    });

    router.post('/:supplierId/ia-knowledge', async (req, res) => {
        try {
            const { supplierId } = req.params;
            const { nome_marca, resumo_negocio, persona_ia, palavras_chave } = req.body;
            const fid = parseInt(supplierId);

            const check = await getPool(req).query('SELECT id FROM ia_conhecimento WHERE for_codigo = $1', [fid]);
            let query, params;

            if (check.rows.length > 0) {
                query = `UPDATE ia_conhecimento SET nome_marca=$1, resumo_negocio=$2, persona_ia=$3, palavras_chave=$4, updated_at=NOW() WHERE for_codigo=$5 RETURNING *`;
            } else {
                query = `INSERT INTO ia_conhecimento (nome_marca, resumo_negocio, persona_ia, palavras_chave, for_codigo) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
            }
            params = [nome_marca, resumo_negocio, persona_ia, palavras_chave, fid];
            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 9. Generate Iris Token (URL Safe)
    router.post('/admin/generate-token', async (req, res) => {
        try {
            const { cli_codigo: clientCode, industrias: industries } = req.body;
            const empresaId = req.headers['x-tenant-cnpj'];

            if (!clientCode || !empresaId) return res.status(400).json({ success: false, message: 'Dados incompletos' });

            const payload = {
                cli_codigo: clientCode,
                empresa_id: empresaId,
                industrias: industries || [],
                exp: Date.now() + (30 * 24 * 60 * 60 * 1000)
            };

            const token = Buffer.from(JSON.stringify(payload))
                .toString('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');
            
            res.json({ success: true, token, link: `/iris/?t=${token}`, expires_in: '30 dias' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
