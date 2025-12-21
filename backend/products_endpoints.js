// ============================================================================
// Products Endpoints - Using PostgreSQL Procedures
// ============================================================================

const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    // ========================================================================
    // GET /api/products/tables/:industria - Listar tabelas de uma indústria
    // ========================================================================
    router.get('/products/tables/:industria', async (req, res) => {
        try {
            const { industria } = req.params;

            const result = await pool.query(
                'SELECT * FROM fn_listar_tabelas_industria($1)',
                [industria]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao listar tabelas:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar tabelas: ${error.message}`
            });
        }
    });

    // ========================================================================
    // GET /api/products/catalog/:industria - Listar todos produtos do catálogo (cad_prod)
    // ========================================================================
    router.get('/products/catalog/:industria', async (req, res) => {
        try {
            const { industria } = req.params;

            const result = await pool.query(
                `SELECT 
                    pro_id,
                    pro_codprod,
                    pro_nome,
                    pro_ncm,
                    pro_peso,
                    pro_embalagem,
                    pro_grupo,
                    pro_aplicacao,
                    pro_codbarras,
                    pro_status
                FROM cad_prod
                WHERE pro_industria = $1
                ORDER BY pro_codprod`,
                [industria]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao listar catálogo:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar catálogo: ${error.message}`
            });
        }
    });

    // ========================================================================
    // POST /api/products/save - Salvar produto (UPSERT cad_prod + cad_tabelaspre)
    // ========================================================================
    router.post('/products/save', async (req, res) => {
        const client = await pool.connect();
        try {
            const {
                codigo, codigoOriginal, codigoBarras, conversao,
                descricao, aplicacao, ncm, grupo, embalagem, peso,
                industria, tabela, precobruto, precopromo, precoespecial,
                ipi, st, descontoadd, grupodesconto
            } = req.body;

            await client.query('BEGIN');

            // 1. UPSERT dados fixos em cad_prod
            const resultProduto = await client.query(
                `SELECT fn_upsert_produto($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) as pro_id`,
                [
                    industria,           // p_industria
                    codigo,              // p_codprod
                    descricao,           // p_nome
                    peso,                // p_peso
                    embalagem,           // p_embalagem
                    grupo,               // p_grupo
                    null,                // p_setor
                    null,                // p_linha
                    ncm,                 // p_ncm
                    null,                // p_origem
                    aplicacao,           // p_aplicacao
                    codigoBarras         // p_codbarras
                ]
            );

            const proId = resultProduto.rows[0].pro_id;

            // 2. UPSERT dados variáveis em cad_tabelaspre
            await client.query(
                `SELECT fn_upsert_preco($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                [
                    proId,
                    industria,
                    tabela,
                    precobruto,
                    precopromo,
                    precoespecial,
                    ipi,
                    st,
                    grupodesconto,
                    descontoadd,
                    new Date().toISOString().split('T')[0], // data tabela
                    null // data vencimento
                ]
            );

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Produto salvo com sucesso',
                pro_id: proId
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Erro ao salvar produto:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao salvar produto: ${error.message}`
            });
        } finally {
            client.release();
        }
    });

    // ========================================================================
    // GET /api/products/:industria/:tabela - Listar produtos de uma tabela
    // ========================================================================
    router.get('/products/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;

            console.log(`📦 [PRODUCTS] Buscando produtos: industria=${industria}, tabela="${tabela}"`);

            const result = await pool.query(
                'SELECT * FROM fn_listar_produtos_tabela($1, $2)',
                [industria, tabela]
            );

            console.log(`📦 [PRODUCTS] Encontrados ${result.rows.length} produtos`);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [PRODUCTS] Erro ao listar produtos:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar produtos: ${error.message}`
            });
        }
    });

    // ========================================================================
    // GET /api/products/sales-analysis/:industria/:produto - Análise de vendas
    // ========================================================================
    router.get('/products/sales-analysis/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;
            const { dataInicio, dataFim, situacao = 'F' } = req.query;

            console.log(`📊 [SALES_ANALYSIS] Analisando vendas: industria=${industria}, produto="${produto}", período=${dataInicio} a ${dataFim}`);

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'dataInicio e dataFim são obrigatórios'
                });
            }

            // Buscar informações do produto
            const produtoInfo = await pool.query(
                'SELECT pro_codprod, pro_nome FROM cad_prod WHERE pro_industria = $1 AND pro_codprod = $2',
                [industria, produto]
            );

            // Buscar vendas por mês
            const vendasResult = await pool.query(
                'SELECT * FROM fn_analise_vendas_produto($1, $2, $3, $4, $5)',
                [industria, produto, dataInicio, dataFim, situacao]
            );

            const totalVendido = vendasResult.rows.reduce((sum, row) => sum + parseFloat(row.quantidade || 0), 0);
            const valorTotal = vendasResult.rows.reduce((sum, row) => sum + parseFloat(row.valor_total || 0), 0);

            console.log(`📊 [SALES_ANALYSIS] Encontrados ${vendasResult.rows.length} períodos, total: ${totalVendido} unidades`);

            res.json({
                success: true,
                data: {
                    produto: produtoInfo.rows[0] || { pro_codprod: produto, pro_nome: 'Produto não encontrado' },
                    periodo: {
                        inicio: dataInicio,
                        fim: dataFim,
                        situacao
                    },
                    vendasPorMes: vendasResult.rows,
                    totalVendido,
                    valorTotal
                }
            });
        } catch (error) {
            console.error('❌ [SALES_ANALYSIS] Erro:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao analisar vendas: ${error.message}`
            });
        }
    });

    // ========================================================================
    // GET /api/products/customers-bought/:industria/:produto - Clientes que compraram
    // ========================================================================
    router.get('/products/customers-bought/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;
            const { dataInicio, dataFim } = req.query;

            console.log(`👥 [CUSTOMERS_BOUGHT] Buscando clientes: industria=${industria}, produto="${produto}"`);

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'dataInicio e dataFim são obrigatórios'
                });
            }

            const result = await pool.query(
                'SELECT * FROM fn_clientes_compraram_produto($1, $2, $3, $4)',
                [industria, produto, dataInicio, dataFim]
            );

            console.log(`👥 [CUSTOMERS_BOUGHT] Encontrados ${result.rows.length} clientes`);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [CUSTOMERS_BOUGHT] Erro:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar clientes: ${error.message}`
            });
        }
    });

    // ========================================================================
    // GET /api/products/customers-never-bought/:industria/:produto - Clientes que nunca compraram
    // ========================================================================
    router.get('/products/customers-never-bought/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;

            console.log(`👥 [CUSTOMERS_NEVER] Buscando clientes que nunca compraram: industria=${industria}, produto="${produto}"`);

            const result = await pool.query(
                'SELECT * FROM fn_clientes_nunca_compraram_produto($1, $2)',
                [industria, produto]
            );

            console.log(`👥 [CUSTOMERS_NEVER] Encontrados ${result.rows.length} clientes`);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [CUSTOMERS_NEVER] Erro:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar clientes: ${error.message}`
            });
        }
    });

    return router;
};
