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

            // Busca o total global para o frontend saber quantas páginas existem
            const countQuery = `SELECT COUNT(*) as total FROM vendedores ${whereClause}`;

            const [dataResult, countResult] = await Promise.all([
                pool.query(dataQuery, params),
                pool.query(countQuery, search ? [`%${search}%`] : [])
            ]);

            const total = parseInt(countResult.rows[0]?.total || 0);

            // RETORNO EXATO QUE O FRONTEND ESPERA
            res.json({
                success: true,
                data: dataResult.rows,
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit))
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

    return router;
};