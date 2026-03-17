/**
 * Auxiliary Endpoints Module
 * Provides data for form dropdowns and common lookups
 */
const express = require('express');

module.exports = function (pool) {
    const router = express.Router();

    const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');

    // GET /api/aux/clientes - Listar clientes
    router.get('/clientes', async (req, res) => {
        try {
            const { status = 'A', pesquisa = '', limit = 1000 } = req.query;
            const dbPool = req.db || pool;
            
            let query = `
                SELECT 
                    c.cli_codigo, 
                    c.cli_nome, 
                    c.cli_nomred, 
                    c.cli_cnpj, 
                    c.cli_idcidade,
                    COALESCE(cid.cid_nome, '') AS cli_cidade,
                    c.cli_uf,
                    c.cli_vendedor,
                    c.cli_tipopes
                FROM clientes c
                LEFT JOIN cidades cid ON cid.cid_codigo = c.cli_idcidade
                WHERE 1=1
            `;
            const params = [];

            if (pesquisa) {
                params.push(`%${pesquisa}%`);
                query += ` AND (c.cli_nome ILIKE $${params.length} OR c.cli_nomred ILIKE $${params.length} OR c.cli_cnpj ILIKE $${params.length} OR c.cli_codigo::text ILIKE $${params.length})`;
            }

            query += ` ORDER BY c.cli_nomred, c.cli_nome LIMIT ${parseInt(limit)}`;

            const result = await dbPool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/CLIENTES] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/clientes/:id - Detalhes do cliente
    router.get('/clientes/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const dbPool = req.db || pool;
            // Usando SELECT * para garantir compatibilidade com diferentes versões do banco
            const query = `SELECT * FROM clientes WHERE cli_codigo = $1`;
            const result = await dbPool.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
            }

            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [AUX/CLIENTES/:ID] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/vendedores - Listar vendedores
    router.get('/vendedores', async (req, res) => {
        try {
            const { pesquisa = '' } = req.query;
            let query = 'SELECT ven_codigo, ven_nome FROM vendedores WHERE 1=1';
            const params = [];

            if (pesquisa) {
                params.push(`%${pesquisa}%`);
                query += ` AND (ven_nome ILIKE $${params.length})`;
            }

            query += ' ORDER BY ven_nome';

            const dbPool = req.db || pool;
            const result = await dbPool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/VENDEDORES] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/industrias - Listar fornecedores/indústrias ATIVAS
    router.get('/industrias', async (req, res) => {
        try {
            const { pesquisa = '', todas = 'false' } = req.query;
            const userId = req.headers['x-user-id'];
            const dbPool = req.db || pool;

            // Buscar o vendedor vinculado ao usuário (retorna null se master)
            const sellerId = await getLinkedSellerId(dbPool, userId);

            const initialParams = [];
            let whereClause = `WHERE for_tipo2 = 'A'`;

            if (pesquisa) {
                initialParams.push(`%${pesquisa}%`);
                whereClause += ` AND (for_nome ILIKE $${initialParams.length} OR for_nomered ILIKE $${initialParams.length})`;
            }

            // Filtro por indústrias permitidas via subquery IN
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'for_codigo', initialParams);

            const query = `
                SELECT for_codigo as value, for_nomered as label, for_nomered, for_nome, for_codigo 
                FROM fornecedores 
                ${whereClause}
                ${filterClause}
                ORDER BY for_nomered
            `;

            const result = await dbPool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/INDUSTRIAS] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/price-tables - Listar tabelas de preço
    router.get('/price-tables', async (req, res) => {
        try {
            const { for_codigo, pesquisa, limit = 50 } = req.query;
            const dbPool = req.db || pool;
            const userId = req.headers['x-user-id'];
            const sellerId = await getLinkedSellerId(dbPool, userId);

            const initialParams = [];
            let whereClause = `WHERE 1=1`;
            let paramIndex = 0;

            if (for_codigo && for_codigo !== 'all') {
                paramIndex++;
                initialParams.push(for_codigo);
                whereClause += ` AND itab_idindustria = $${paramIndex}`;
            }

            if (pesquisa) {
                paramIndex++;
                initialParams.push(`%${pesquisa}%`);
                whereClause += ` AND itab_tabela ILIKE $${paramIndex}`;
            }

            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'itab_idindustria', initialParams);

            let query = `
                SELECT DISTINCT 
                    itab_tabela as nome_tabela,
                    itab_idindustria as industria
                FROM cad_tabelaspre 
                ${whereClause}
                ${filterClause}
            `;

            query += ' ORDER BY itab_tabela';

            if (limit) {
                paramIndex++;
                params.push(limit);
                query += ` LIMIT $${params.length}`;
            }

            const result = await dbPool.query(query, params);

            const data = result.rows.map(row => ({
                nome_tabela: row.nome_tabela,
                industria: row.industria,
                label: row.nome_tabela,
                value: row.nome_tabela
            }));

            res.json({ success: true, data });
        } catch (error) {
            console.error('❌ [AUX/PRICE-TABLES] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/areas - Listar áreas de atuação
    router.get('/areas', async (req, res) => {
        try {
            const dbPool = req.db || pool;
            const result = await dbPool.query('SELECT atu_id, atu_descricao FROM area_atu ORDER BY atu_descricao');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/AREAS] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/regioes - Listar regiões
    router.get('/regioes', async (req, res) => {
        try {
            const dbPool = req.db || pool;
            const result = await dbPool.query('SELECT reg_codigo, reg_descricao FROM regioes ORDER BY reg_descricao');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/REGIOES] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/cidades - Buscar cidades
    router.get('/cidades', async (req, res) => {
        try {
            const { search, id } = req.query;
            let query = 'SELECT cid_codigo, cid_nome, cid_uf FROM cidades WHERE cid_ativo = true';
            const params = [];

            if (id) {
                query += ' AND cid_codigo = $1';
                params.push(parseInt(id));
            } else if (search) {
                query += ' AND cid_nome ILIKE $1';
                params.push(`%${search}%`);
                query += ' ORDER BY cid_nome ASC LIMIT 50';
            } else {
                query += ' ORDER BY cid_nome ASC LIMIT 10';
            }

            const dbPool = req.db || pool;
            const result = await dbPool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [AUX/CIDADES] Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET /api/aux/condpag - Listar condições de pagamento
    router.get('/condpag', async (req, res) => {
        try {
            const dbPool = req.db || pool;
            const result = await dbPool.query('SELECT cpg_codigo, cpg_descricao FROM cad_condpag ORDER BY cpg_descricao');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            try {
                const dbPool = req.db || pool;
                const result = await dbPool.query('SELECT cpg_codigo, cpg_descricao FROM condpag ORDER BY cpg_descricao');
                res.json({ success: true, data: result.rows });
            } catch (e2) {
                res.json({
                    success: true,
                    data: [
                        { cpg_codigo: 1, cpg_descricao: 'A VISTA' },
                        { cpg_codigo: 2, cpg_descricao: '30 DIAS' },
                        { cpg_codigo: 3, cpg_descricao: '30/60 DIAS' }
                    ]
                });
            }
        }
    });

    return router;
};
