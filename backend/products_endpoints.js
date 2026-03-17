// ============================================================================
// Products Endpoints - Using PostgreSQL Procedures
// ============================================================================

const express = require('express');
const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');

module.exports = (pool) => {
    const router = express.Router();

    // ========================================================================
    // GET /api/products/tables/:industria - Listar tabelas de uma indústria
    // ========================================================================
    router.get('/tables/:industria', async (req, res) => {
        try {
            const { industria } = req.params;
            const userId = req.headers['x-user-id'];

            // Handle composite IDs like "2:1" by taking only the first part
            const cleanIndustria = parseInt(industria && String(industria).includes(':') ? String(industria).split(':')[0] : industria);

            if (isNaN(cleanIndustria)) {
                return res.json({ success: true, data: [], message: 'ID da indústria inválido' });
            }

            // Verificar permissões do usuário
            const sellerId = await getLinkedSellerId(pool, userId);
            
            if (sellerId !== null) {
                // Verificar se o vendedor tem acesso a esta indústria específica
                const accessCheck = await pool.query(
                    'SELECT 1 FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2',
                    [sellerId, cleanIndustria]
                );
                
                if (accessCheck.rows.length === 0) {
                    console.warn(`🔐 [PRODUCTS] Acesso negado: Vendedor ${sellerId} tentou acessar indústria ${cleanIndustria}`);
                    return res.json({ success: true, data: [], message: 'Acesso negado a esta indústria' });
                }
            }

            const result = await pool.query(
                `SELECT * FROM fn_listar_tabelas_industria($1) ORDER BY 1`,
                [cleanIndustria]
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
    router.get('/catalog/:industria', async (req, res) => {
        try {
            const { industria } = req.params;
            const userId = req.headers['x-user-id'];
            const cleanIndustria = parseInt(industria && String(industria).includes(':') ? String(industria).split(':')[0] : industria);

            if (isNaN(cleanIndustria)) {
                return res.json({ success: true, data: [], message: 'ID da indústria inválido' });
            }

            // Verificar permissões do usuário
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'pro_industria', [cleanIndustria]);

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
                    pro_status,
                    pro_linhaleve,
                    pro_linhapesada,
                    pro_linhaagricola,
                    pro_linhautilitarios,
                    pro_motocicletas,
                    pro_offroad,
                    pro_origem,
                    pro_codigonormalizado,
                    pro_conversao
                FROM cad_prod
                WHERE pro_industria = $1
                  ${filterClause}
                ORDER BY pro_codprod`,
                params
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
    router.post('/save', async (req, res) => {
        const client = await pool.connect();
        try {
            const {
                codigo, codigoOriginal, codigoBarras, conversao,
                descricao, aplicacao, ncm, grupo, embalagem, peso,
                industria, tabela, precobruto, precopromo, precoespecial,
                ipi, st, descontoadd, grupodesconto, prepeso,
                linhaleve, linhapesada, linhaagricola, linhautilitarios,
                motocicletas, offroad,
                replicate // Flag para replicar em todas as tabelas
            } = req.body;

            const cleanIndustria = industria && String(industria).includes(':') ? String(industria).split(':')[0] : industria;

            await client.query('BEGIN');

            // 1. UPSERT dados fixos em cad_prod
            const resultProduto = await client.query(
                `SELECT fn_upsert_produto($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19) as pro_id`,
                [
                    cleanIndustria,      // 1: p_industria
                    codigo,              // 2: p_codprod
                    descricao,           // 3: p_nome
                    peso,                // 4: p_peso
                    embalagem,           // 5: p_embalagem
                    grupo,               // 6: p_grupo
                    null,                // 7: p_setor
                    null,                // 8: p_linha
                    ncm,                 // 9: p_ncm
                    null,                // 10: p_origem
                    aplicacao,           // 11: p_aplicacao
                    codigoBarras,        // 12: p_codbarras
                    conversao,           // 13: p_conversao
                    linhaleve || false,  // 14: p_linhaleve
                    linhapesada || false, // 15: p_linhapesada
                    linhaagricola || false, // 16: p_linhaagricola
                    linhautilitarios || false, // 17: p_linhautilitarios
                    motocicletas || false, // 18: p_motocicletas
                    offroad || false      // 19: p_offroad
                ]
            );

            const proId = resultProduto.rows[0].pro_id;

            // 2. UPSERT dados variáveis em cad_tabelaspre (SÓ SE HOUVER TABELA)
            if (tabela) {
                if (replicate) {
                    // Buscar todas as tabelas desta indústria
                    const tablesResult = await client.query(
                        'SELECT DISTINCT itab_tabela FROM cad_tabelaspre WHERE itab_idindustria = $1',
                        [cleanIndustria]
                    );

                    const tables = tablesResult.rows.map(r => r.itab_tabela);

                    // Se a tabela atual não estiver na lista (tabela nova), adiciona
                    if (!tables.includes(tabela)) {
                        tables.push(tabela);
                    }

                    console.log(`🔄 [REPLICATE] Replicando produto ${codigo} para ${tables.length} tabelas da indústria ${cleanIndustria}`);

                    for (const t of tables) {
                        await client.query(
                            `SELECT fn_upsert_preco($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                            [
                                proId,
                                cleanIndustria,
                                t,
                                precobruto,
                                precopromo,
                                precoespecial,
                                ipi,
                                st,
                                grupodesconto,
                                descontoadd,
                                new Date().toISOString().split('T')[0], // data tabela
                                null, // data vencimento
                                prepeso || 0
                            ]
                        );
                    }
                } else {
                    // Fluxo normal: apenas uma tabela
                    await client.query(
                        `SELECT fn_upsert_preco($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                        [
                            proId,
                            cleanIndustria,
                            tabela,
                            precobruto,
                            precopromo,
                            precoespecial,
                            ipi,
                            st,
                            grupodesconto,
                            descontoadd,
                            new Date().toISOString().split('T')[0], // data tabela
                            null, // data vencimento
                            prepeso || 0
                        ]
                    );
                }
            } else {
                console.log(`ℹ️ [PRODUCTS_SAVE] Apenas dados fixos salvos para o produto ${codigo} (Catálogo Mestre)`);
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: replicate ? 'Produto salvo e replicado com sucesso' : 'Produto salvo com sucesso',
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
    router.get('/:industria/:tabela', async (req, res) => {
        try {
            let { industria, tabela } = req.params;
            const cleanIndustria = industria && industria.includes(':') ? industria.split(':')[0] : industria;

            // Suporte a query parameter para evitar problemas com / e %
            if (req.query.tabela) {
                tabela = req.query.tabela;
            }

            // console.log(`📦 [PRODUCTS] Buscando produtos: industria=${cleanIndustria}, tabela="${tabela}"`);

            const result = await pool.query(
                `SELECT f.*, p.pro_codigonormalizado, p.pro_conversao, p.pro_embalagem
                 FROM fn_listar_produtos_tabela($1::integer, $2::text) f 
                 JOIN cad_prod p ON f.itab_idprod = p.pro_id`,
                [cleanIndustria, tabela]
            );

            // console.log(`📦 [PRODUCTS] Encontrados ${result.rows.length} produtos`);

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
    router.get('/sales-analysis/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;
            const { dataInicio, dataFim, situacao = 'F' } = req.query;
            const cleanIndustria = industria && industria.includes(':') ? industria.split(':')[0] : industria;

            console.log(`📊 [SALES_ANALYSIS] Analisando vendas: industria=${cleanIndustria}, produto="${produto}", período=${dataInicio} a ${dataFim}`);

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'dataInicio e dataFim são obrigatórios'
                });
            }

            // Buscar informações do produto
            const produtoInfo = await pool.query(
                'SELECT pro_codprod, pro_nome FROM cad_prod WHERE pro_industria = $1 AND (pro_codprod = $2 OR pro_codigonormalizado = fn_normalizar_codigo($2))',
                [cleanIndustria, produto]
            );

            // Buscar vendas por mês
            const vendasResult = await pool.query(
                'SELECT * FROM fn_analise_vendas_produto($1, $2, $3, $4, $5)',
                [cleanIndustria, produto, dataInicio, dataFim, situacao]
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
    router.get('/customers-bought/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;
            const { dataInicio, dataFim } = req.query;
            const cleanIndustria = industria && industria.includes(':') ? industria.split(':')[0] : industria;

            console.log(`👥 [CUSTOMERS_BOUGHT] Buscando clientes: industria=${cleanIndustria}, produto="${produto}"`);

            if (!dataInicio || !dataFim) {
                return res.status(400).json({
                    success: false,
                    message: 'dataInicio e dataFim são obrigatórios'
                });
            }

            const result = await pool.query(
                'SELECT * FROM fn_clientes_compraram_produto($1, $2, $3, $4)',
                [cleanIndustria, produto, dataInicio, dataFim]
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
    router.get('/customers-never-bought/:industria/:produto', async (req, res) => {
        try {
            const { industria, produto } = req.params;
            const cleanIndustria = industria && industria.includes(':') ? industria.split(':')[0] : industria;

            console.log(`👥 [CUSTOMERS_NEVER] Buscando clientes que nunca compraram: industria=${cleanIndustria}, produto="${produto}"`);

            const result = await pool.query(
                'SELECT * FROM fn_clientes_nunca_compraram_produto($1, $2)',
                [cleanIndustria, produto]
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

    // ========================================================================
    // DELETE /api/products/:proId - Excluir produto do catálogo (cad_prod)
    // ========================================================================
    router.delete('/:proId', async (req, res) => {
        try {
            const { proId } = req.params;

            // Tenta excluir (falhará se houver restrição de chave estrangeira em pedidos/itens)
            await pool.query('DELETE FROM cad_prod WHERE pro_id = $1', [proId]);

            res.json({
                success: true,
                message: 'Produto excluído com sucesso'
            });
        } catch (error) {
            console.error('❌ [PRODUCTS_DELETE] Erro:', error);
            
            // Tratar erro de chave estrangeira (produto em uso)
            if (error.code === '23503') {
                return res.status(400).json({
                    success: false,
                    message: 'Não é possível excluir este produto pois ele já possui movimentação ou vínculo com outras tabelas.'
                });
            }

            res.status(500).json({
                success: false,
                message: `Erro ao excluir produto: ${error.message}`
            });
        }
    });

    return router;
};
