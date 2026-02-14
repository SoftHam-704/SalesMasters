/* ARQUIVO: vendedores_endpoints.js - VERSÃO FINAL 100% CORRIGIDA */
const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET /api/sellers - Listagem com Paginação e Busca
    router.get('/', async (req, res) => {
        try {
            const { page = 1, limit = 10, search = '' } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let whereClause = "WHERE ven_nome IS NOT NULL";
            const params = [parseInt(limit), parseInt(offset)];

            if (search) {
                params.push(`%${search}%`);
                whereClause += ` AND (ven_nome ILIKE $3 OR ven_email ILIKE $3 OR ven_nomeusu ILIKE $3)`;
            }

            // Busca os dados da página atual
            const dataQuery = `
                SELECT 
                    ven_codigo,
                    ven_codigo as id,
                    ven_nome,
                    ven_nomeusu,
                    ven_fone1 as telefone,
                    ven_email as email
                FROM vendedores
                ${whereClause}
                ORDER BY ven_nome
                LIMIT $1 OFFSET $2
            `;

            // Para o count, precisamos de uma cópia da whereClause que use $1 ao invés de $3 se search existir
            const countWhereClause = search
                ? "WHERE ven_nome IS NOT NULL AND (ven_nome ILIKE $1 OR ven_email ILIKE $1 OR ven_nomeusu ILIKE $1)"
                : "WHERE ven_nome IS NOT NULL";

            const countQuery = `SELECT COUNT(*) as total FROM vendedores ${countWhereClause}`;

            const [dataResult, countResult] = await Promise.all([
                pool.query(dataQuery, params),
                pool.query(countQuery, search ? [`%${search}%`] : [])
            ]);

            const total = parseInt(countResult.rows[0]?.total || 0);

            // RETORNO EXATO QUE O FRONTEND ESPERA (com objeto pagination)
            res.json({
                success: true,
                data: dataResult.rows,
                pagination: {
                    total: total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            });
        } catch (error) {
            console.error('Error fetching sellers:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar vendedores' });
        }
    });

    // POST /api/sellers
    router.post('/', async (req, res) => {
        try {
            const body = req.body;
            const query = `
                INSERT INTO vendedores (
                    ven_nome, ven_endereco, ven_bairro, ven_cidade, ven_cep, ven_uf,
                    ven_fone1, ven_fone2, ven_aniversario, ven_cpf, ven_rg, ven_ctps,
                    ven_email, ven_nomeusu, ven_dtadmissao, ven_dtdemissao, ven_status,
                    ven_cumpremetas, ven_filiacao, ven_obs, ven_codusu
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                RETURNING *
            `;
            const values = [
                body.ven_nome || body.nome, body.ven_endereco || body.endereco, body.ven_bairro || body.bairro,
                body.ven_cidade || body.cidade, body.ven_cep || body.cep, body.ven_uf || body.uf,
                body.ven_fone1 || body.ven_telefone || body.telefone, body.ven_fone2 || body.ven_celular || body.celular,
                body.ven_aniversario || body.aniversario, body.ven_cpf || body.cpf, body.ven_rg || body.rg, body.ven_ctps || body.ctps,
                body.ven_email || body.email, body.ven_nomeusu || body.usuario || null,
                body.ven_dtadmissao || body.ven_dataadm || null, body.ven_dtdemissao || body.ven_datadem || null,
                body.ven_status || body.ven_situacao || 'A', body.ven_cumpremetas || body.ven_cumpremeta || 'S',
                body.ven_filiacao, body.ven_obs || body.ven_observacao, body.ven_codusu || body.usuario_id || null
            ];
            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows[0], message: 'Salvo com sucesso!' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // PUT /api/sellers/:id
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const body = req.body;
            const query = `
                UPDATE vendedores SET
                    ven_nome = $1, ven_endereco = $2, ven_bairro = $3, ven_cidade = $4, ven_cep = $5, ven_uf = $6,
                    ven_fone1 = $7, ven_fone2 = $8, ven_aniversario = $9, ven_cpf = $10, ven_rg = $11, ven_ctps = $12,
                    ven_email = $13, ven_nomeusu = $14, ven_dtadmissao = $15, ven_dtdemissao = $16, ven_status = $17,
                    ven_cumpremetas = $18, ven_filiacao = $19, ven_obs = $20, ven_codusu = $21
                WHERE ven_codigo = $22
                RETURNING *
            `;
            const values = [
                body.ven_nome, body.ven_endereco, body.ven_bairro, body.ven_cidade, body.ven_cep, body.ven_uf,
                body.ven_fone1, body.ven_fone2, body.ven_aniversario, body.ven_cpf, body.ven_rg, body.ven_ctps,
                body.ven_email, body.ven_nomeusu, body.ven_dtadmissao, body.ven_dtdemissao, body.ven_status,
                body.ven_cumpremetas, body.ven_filiacao, body.ven_obs, body.ven_codusu, id
            ];
            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== METAS ROUTES ====================

    // GET - Listar metas de um vendedor (por ano ou todos)
    router.get('/:id/metas', async (req, res) => {
        try {
            const { id } = req.params;
            const { ano } = req.query;

            let query = `
                SELECT 
                    vm.met_id,
                    vm.met_ano,
                    vm.met_industria,
                    vm.met_vendedor,
                    vm.met_jan, vm.met_fev, vm.met_mar, vm.met_abr,
                    vm.met_mai, vm.met_jun, vm.met_jul, vm.met_ago,
                    vm.met_set, vm.met_out, vm.met_nov, vm.met_dez,
                    f.for_nomered as industria_nome
                FROM vend_metas vm
                LEFT JOIN fornecedores f ON f.for_codigo = vm.met_industria
                WHERE vm.met_vendedor = $1
            `;
            const params = [id]; // Mantendo original para suportar leading zeros se for string

            if (ano) {
                query += ` AND vm.met_ano = $2`;
                params.push(parseInt(ano));
            }

            query += ` ORDER BY vm.met_ano DESC, f.for_nomered`;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Error fetching seller metas:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar metas: ${error.message}`
            });
        }
    });

    // POST - Criar nova meta
    router.post('/:id/metas', async (req, res) => {
        try {
            const { id } = req.params;
            const meta = req.body;

            const targetId = id; // Mantendo string
            const targetYear = parseInt(meta.met_ano);
            const targetIndustry = parseInt(meta.met_industria);

            // Verificar se já existe meta para este vendedor/ano/indústria
            const existCheck = await pool.query(
                'SELECT met_id FROM vend_metas WHERE met_vendedor = $1 AND met_ano = $2 AND met_industria = $3',
                [targetId, targetYear, targetIndustry]
            );

            if (existCheck.rows.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Já existe uma meta para este vendedor/ano/indústria'
                });
            }

            const query = `
                INSERT INTO vend_metas (
                    met_vendedor, met_ano, met_industria,
                    met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                    met_jul, met_ago, met_set, met_out, met_nov, met_dez
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                ) RETURNING *
            `;

            const values = [
                targetId, targetYear, targetIndustry,
                parseFloat(meta.met_jan) || 0, parseFloat(meta.met_fev) || 0, parseFloat(meta.met_mar) || 0,
                parseFloat(meta.met_abr) || 0, parseFloat(meta.met_mai) || 0, parseFloat(meta.met_jun) || 0,
                parseFloat(meta.met_jul) || 0, parseFloat(meta.met_ago) || 0, parseFloat(meta.met_set) || 0,
                parseFloat(meta.met_out) || 0, parseFloat(meta.met_nov) || 0, parseFloat(meta.met_dez) || 0
            ];

            const result = await pool.query(query, values);

            res.status(201).json({
                success: true,
                data: result.rows[0],
                message: 'Meta criada com sucesso!'
            });
        } catch (error) {
            console.error('Error creating seller meta:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao criar meta: ${error.message}`
            });
        }
    });

    // PUT - Atualizar meta existente
    router.put('/:id/metas/:metaId', async (req, res) => {
        try {
            const { id, metaId } = req.params;
            const meta = req.body;

            const query = `
                UPDATE vend_metas SET
                    met_ano = $1, met_industria = $2,
                    met_jan = $3, met_fev = $4, met_mar = $5, met_abr = $6,
                    met_mai = $7, met_jun = $8, met_jul = $9, met_ago = $10,
                    met_set = $11, met_out = $12, met_nov = $13, met_dez = $14
                WHERE met_id = $15 AND met_vendedor = $16
                RETURNING *
            `;

            const values = [
                parseInt(meta.met_ano), parseInt(meta.met_industria),
                parseFloat(meta.met_jan) || 0, parseFloat(meta.met_fev) || 0, parseFloat(meta.met_mar) || 0,
                parseFloat(meta.met_abr) || 0, parseFloat(meta.met_mai) || 0, parseFloat(meta.met_jun) || 0,
                parseFloat(meta.met_jul) || 0, parseFloat(meta.met_ago) || 0, parseFloat(meta.met_set) || 0,
                parseFloat(meta.met_out) || 0, parseFloat(meta.met_nov) || 0, parseFloat(meta.met_dez) || 0,
                metaId, id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Meta não encontrada' });
            }

            res.json({ success: true, data: result.rows[0], message: 'Meta atualizada com sucesso!' });
        } catch (error) {
            console.error('Error updating seller meta:', error);
            res.status(500).json({ success: false, message: `Erro ao atualizar meta: ${error.message}` });
        }
    });

    // DELETE - Remover meta
    router.delete('/:id/metas/:metaId', async (req, res) => {
        try {
            const { id, metaId } = req.params;

            const result = await pool.query(
                'DELETE FROM vend_metas WHERE met_id = $1 AND met_vendedor = $2 RETURNING *',
                [metaId, id]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Meta não encontrada' });
            }

            res.json({ success: true, message: 'Meta excluída com sucesso!' });
        } catch (error) {
            console.error('Error deleting seller meta:', error);
            res.status(500).json({ success: false, message: `Erro ao excluir meta: ${error.message}` });
        }
    });

    return router;
};
