// ============================================================================
// Price Tables API Endpoints
// ============================================================================
// Endpoints para gerenciar tabelas de preço e importação de produtos

const express = require('express');
const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');

module.exports = (pool) => {
    const router = express.Router();
    console.log('✅ price_tables_endpoints.js CARREGADO - VERSÃO CORRIGIDA (itab_idindustria + itab_datatabela)');


    // ============================================================================
    // GET /api/price-tables/ - Listar todas as tabelas de preço disponíveis
    // ============================================================================
    router.get('/', async (req, res) => {
        try {
            const userId = req.headers['x-user-id'];
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 't.itab_idindustria');

            const query = `
            SELECT DISTINCT 
                itab_tabela as nome_tabela,
                itab_idindustria as industria,
                f.for_nomered as industria_nome,
                COUNT(*) as total_produtos,
                MIN(itab_datatabela) as data_criacao,
                MAX(itab_datavencimento) as data_vencimento,
                BOOL_AND(itab_status) as todas_ativas
            FROM cad_tabelaspre t
            INNER JOIN fornecedores f ON f.for_codigo = t.itab_idindustria
            WHERE 1=1
              ${filterClause}
            GROUP BY itab_tabela, itab_idindustria, f.for_nomered
            ORDER BY itab_idindustria, itab_tabela
        `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao listar tabelas de preço:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar tabelas de preço: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/price-tables/:industria - Listar tabelas de uma indústria
    // ============================================================================
    router.get('/:industria', async (req, res) => {
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
            
            // Aqui passamos o array com o parâmetro já existente ($1 = cleanIndustria)
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'itab_idindustria', [cleanIndustria]);

            // DEBUG: Detectar chamadas incorretas (formato industria_tabela)
            if (industria && (String(industria).includes('_') || String(industria).includes('&'))) {
                console.warn(`⚠️ [PRICE-TABLES] Chamada suspeita detectada! industria="${industria}"`);
            }

            const query = `
            SELECT DISTINCT 
                itab_tabela as nome_tabela,
                COUNT(*) as total_produtos,
                MIN(itab_datatabela) as data_criacao,
                MAX(itab_datavencimento) as data_vencimento,
                BOOL_AND(itab_status) as todas_ativas
            FROM cad_tabelaspre
            WHERE itab_idindustria = $1
              ${filterClause}
            GROUP BY itab_tabela
            ORDER BY itab_tabela
        `;

            const result = await pool.query(query, params);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao listar tabelas da indústria:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar tabelas: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/price-tables/:industria/:tabela/products - Produtos de uma tabela
    // ============================================================================
    router.get('/:industria/:tabela/products', async (req, res) => {
        try {
            const { industria, tabela } = req.params;
            const { limit = 50, offset = 0 } = req.query;
            const userId = req.headers['x-user-id'];

            const cleanIndustria = parseInt(industria && String(industria).includes(':') ? String(industria).split(':')[0] : industria);
            if (isNaN(cleanIndustria)) {
                return res.status(400).json({ success: false, message: 'ID da indústria inválido' });
            }

            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'pro_industria', [cleanIndustria, tabela, limit, offset]);

            const query = `
            SELECT * FROM vw_produtos_precos
            WHERE pro_industria = $1 
              AND itab_tabela = $2
              ${filterClause}
            ORDER BY pro_nome
            LIMIT $3 OFFSET $4
        `;

            const countQuery = `
            SELECT COUNT(*) as total
            FROM cad_tabelaspre
            WHERE itab_idindustria = $1 AND itab_tabela = $2
              ${filterClause.replace('pro_industria', 'itab_idindustria')}
        `;

            const [dataResult, countResult] = await Promise.all([
                pool.query(query, params),
                pool.query(countQuery, params)
            ]);

            res.json({
                success: true,
                data: dataResult.rows,
                pagination: {
                    page: parseInt(req.query.page || 1), // Use original page from query or default to 1
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].total),
                    totalPages: Math.ceil(countResult.rows[0].total / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao listar produtos da tabela:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar produtos: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/price-tables/:industria/:tabela/products-full - TODA a tabela para memtable
    // ============================================================================
    router.get('/:industria/:tabela/products-full', async (req, res) => {
        console.log(`🚀 [PRODUCTS-FULL] Request recebido: ${req.method} ${req.originalUrl}`);
        try {
            let { industria, tabela } = req.params;

            // Suporte a passar tabela via query parameter (para evitar problemas com barras / na URL)
            if (req.query.tabela) {
                tabela = req.query.tabela;
            }
            const userId = req.headers['x-user-id'];

            const cleanIndustria = parseInt(industria && String(industria).includes(':') ? String(industria).split(':')[0] : industria);
            if (isNaN(cleanIndustria)) {
                return res.status(400).json({ success: false, message: 'ID da indústria inválido' });
            }

            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause, params } = buildIndustryFilterClause(sellerId, 'p.pro_industria', [cleanIndustria, tabela]);

            // Usar a função que foi corrigida para usar itab_idindustria
            // Incluindo p.pro_id para que o frontend tenha o ID do produto
            // Incluindo p.pro_peso e p.pro_mult para lógica de preço por peso/quantidade
            const query = `
                SELECT f.*, 
                       p.pro_id,
                       p.pro_codigonormalizado, 
                       p.pro_nome as pro_nome_prod,
                       p.pro_codprod,
                       p.pro_peso,
                       p.pro_embalagem as pro_mult,
                       p.pro_embalagem,
                       p.pro_conversao,
                       p.pro_codigooriginal,
                       p.pro_codbarras
                FROM fn_listar_produtos_tabela($1::integer, $2::text) f
                LEFT JOIN cad_prod p ON f.itab_idprod = p.pro_id
                WHERE 1=1
                  ${filterClause}
                ORDER BY f.pro_nome
            `;

            const result = await pool.query(query, params);

            // console.log(`📋 [MEMTABLE] Carregados ${result.rows.length} produtos`);

            res.json({
                success: true,
                data: result.rows,
                total: result.rows.length
            });
        } catch (error) {
            console.error('❌ [MEMTABLE] Erro ao carregar tabela completa:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao carregar tabela: ${error.message}`
            });
        }
    });

    // ============================================================================
    // POST /api/price-tables/import - Importar tabela de preço
    // ============================================================================
    router.post('/import', async (req, res) => {
        try {
            const {
                industria,
                nomeTabela,
                grupoDesconto, // Grupo de desconto fixo para toda a tabela
                produtos,
                dataTabela,
                dataVencimento
            } = req.body;

            if (!industria || !nomeTabela || !produtos || !Array.isArray(produtos)) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos obrigatórios: industria, nomeTabela, produtos (array)'
                });
            }

            const client = await pool.connect();

            try {
                await client.query('BEGIN');

                let produtosNovos = 0;
                let produtosAtualizados = 0;
                let precosInseridos = 0;
                let erros = [];

                for (const produto of produtos) {
                    try {
                        // Criar SAVEPOINT para isolar este produto
                        await client.query('SAVEPOINT sp_produto');

                        // 1. UPSERT do produto (dados fixos)
                        // Casting explícito para garantir tipos no Postgres
                        const upsertProdutoResult = await client.query(
                            `SELECT fn_upsert_produto($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                            [
                                Number(industria),
                                produto.codigo ? String(produto.codigo).substring(0, 100) : null,
                                produto.descricao ? String(produto.descricao).substring(0, 100) : null,
                                produto.peso ? Number(produto.peso) : null,
                                produto.embalagem ? Number(produto.embalagem) : null,
                                produto.grupo ? Number(produto.grupo) : null,
                                produto.setor || null,
                                produto.linha || null,
                                produto.ncm || null,
                                produto.origem || null,
                                produto.aplicacao || null,
                                produto.codbarras || null,
                                produto.conversao || null,
                                null, // p_linhaleve (null = preservar existente)
                                null, // p_linhapesada
                                null, // p_linhaagricola
                                null, // p_linhautilitarios
                                null, // p_motocicletas
                                null  // p_offroad
                            ]
                        );

                        const proId = upsertProdutoResult.rows[0].fn_upsert_produto;

                        // =================================================================================
                        // LOGICA DE SEGMENTAÇÃO AUTOMÁTICA (MULTI-LABEL)
                        // =================================================================================
                        const categoryText = (produto.categoria || '').toUpperCase();

                        if (categoryText) {
                            const flags = {
                                pro_linhaleve: false,
                                pro_linhapesada: false,
                                pro_linhaagricola: false,
                                pro_linhautilitarios: false,
                                pro_motocicletas: false,
                                pro_offroad: false
                            };

                            // 1. LINHA LEVE
                            if (categoryText.includes("LEVE") || categoryText.includes("PASSEIO") || categoryText.includes("AUTO")) {
                                flags.pro_linhaleve = true;
                            }
                            // 2. LINHA PESADA
                            if (categoryText.includes("PESAD") || categoryText.includes("CAMINHAO") || categoryText.includes("TRUCK") || categoryText.includes("CARRETA")) {
                                flags.pro_linhapesada = true;
                            }
                            // 3. AGRÍCOLA
                            if (categoryText.includes("AGR") || categoryText.includes("TRATOR") || categoryText.includes("RURAL")) {
                                flags.pro_linhaagricola = true;
                            }
                            // 4. UTILITÁRIOS
                            if (categoryText.includes("UTIL") || categoryText.includes("VANS") || categoryText.includes("PICK") || categoryText.includes("CAMIONETE")) {
                                flags.pro_linhautilitarios = true;
                            }
                            // 5. MOTOS
                            if (categoryText.includes("MOTO") || categoryText.includes("DUAS RODAS")) {
                                flags.pro_motocicletas = true;
                            }
                            // 6. OFF-ROAD
                            if (categoryText.includes("OFF") || categoryText.includes("TRILHA") || categoryText.includes("CROSS")) {
                                flags.pro_offroad = true;
                            }
                            // 7. UNIVERSAL
                            if (categoryText.includes("UNIVERSAL")) {
                                flags.pro_linhaleve = true;
                                flags.pro_linhapesada = true;
                                flags.pro_linhaagricola = true;
                                flags.pro_linhautilitarios = true;
                            }

                            if (Object.values(flags).some(v => v === true)) {
                                await client.query(`
                                    UPDATE cad_prod SET
                                        pro_linhaleve = CASE WHEN $2 = true THEN true ELSE pro_linhaleve END,
                                        pro_linhapesada = CASE WHEN $3 = true THEN true ELSE pro_linhapesada END,
                                        pro_linhaagricola = CASE WHEN $4 = true THEN true ELSE pro_linhaagricola END,
                                        pro_linhautilitarios = CASE WHEN $5 = true THEN true ELSE pro_linhautilitarios END,
                                        pro_motocicletas = CASE WHEN $6 = true THEN true ELSE pro_motocicletas END,
                                        pro_offroad = CASE WHEN $7 = true THEN true ELSE pro_offroad END
                                    WHERE pro_id = $1
                                `, [
                                    proId,
                                    flags.pro_linhaleve,
                                    flags.pro_linhapesada,
                                    flags.pro_linhaagricola,
                                    flags.pro_linhautilitarios,
                                    flags.pro_motocicletas,
                                    flags.pro_offroad
                                ]);
                            }
                        }
                        // =================================================================================

                        // Verificar se é novo ou atualizado (opcional, apenas para o resumo informativo)
                        const checkExisting = await client.query(
                            'SELECT pro_id FROM cad_prod WHERE pro_id = $1',
                            [proId]
                        );

                        if (checkExisting.rows.length > 0) {
                            produtosAtualizados++;
                        } else {
                            produtosNovos++;
                        }

                        // 2. UPSERT do preço (dados variáveis)
                        // Usa grupoDesconto do formulário se fornecido, senão usa do produto individual
                        const grupoDeDescontoValue = grupoDesconto && grupoDesconto !== 'none' ? grupoDesconto : produto.grupodesconto;
                        const grupoDescontoFinal = grupoDeDescontoValue ? Number(grupoDeDescontoValue) : null;

                        await client.query(
                            `SELECT fn_upsert_preco($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
                            [
                                Number(proId),
                                Number(industria),
                                nomeTabela,
                                Number(produto.precobruto || 0),
                                Number(produto.precopromo || 0),
                                Number(produto.precoespecial || 0),
                                Number(produto.ipi || 0),
                                Number(produto.st || 0),
                                grupoDescontoFinal,
                                Number(produto.descontoadd || 0),
                                dataTabela || new Date(),
                                dataVencimento || null,
                                Number(produto.prepeso || 0)
                            ]
                        );

                        precosInseridos++;

                        // Liberar SAVEPOINT se tudo deu certo
                        await client.query('RELEASE SAVEPOINT sp_produto');

                    } catch (produtoError) {
                        // Reverter apenas este produto, não a transação inteira
                        await client.query('ROLLBACK TO SAVEPOINT sp_produto');

                        erros.push({
                            codigo: produto.codigo,
                            descricao: produto.descricao || '',
                            erro: produtoError.message
                        });
                    }
                }

                await client.query('COMMIT');

                res.json({
                    success: true,
                    message: 'Importação concluída com sucesso!',
                    resumo: {
                        totalProdutos: produtos.length,
                        produtosNovos,
                        produtosAtualizados,
                        precosInseridos,
                        erros: erros.length,
                        detalhesErros: erros
                    }
                });

            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            } finally {
                client.release();
            }

        } catch (error) {
            console.error('Erro ao importar tabela de preço:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao importar: ${error.message}`
            });
        }
    });

    // ============================================================================
    // GET /api/products/:industria/:codigo/prices - Buscar preços de um produto
    // ============================================================================
    router.get('/products/:industria/:codigo/prices', async (req, res) => {
        try {
            const { industria, codigo } = req.params;

            const query = `
            SELECT * FROM vw_produtos_precos
            WHERE pro_industria = $1 
              AND (pro_codprod = $2 OR pro_codigonormalizado = fn_normalizar_codigo($2))
            ORDER BY itab_tabela
        `;

            const result = await pool.query(query, [industria, codigo]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado'
                });
            }

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao buscar preços do produto:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar preços: ${error.message}`
            });
        }
    });

    // ============================================================================
    // DELETE /api/price-tables/:industria/:tabela - Deletar tabela de preço
    // ============================================================================
    router.delete('/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;

            const result = await pool.query(
                'DELETE FROM cad_tabelaspre WHERE itab_idindustria = $1 AND itab_tabela = $2 RETURNING *',
                [industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tabela de preço não encontrada'
                });
            }

            res.json({
                success: true,
                message: `Tabela ${tabela} excluída com sucesso!`,
                totalExcluidos: result.rows.length
            });
        } catch (error) {
            console.error('Erro ao excluir tabela de preço:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao excluir: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/zero-discount-add/:industria/:tabela/:productId
    // Zerar desconto ADD de um produto específico
    // ============================================================================
    router.put('/products/zero-discount-add/:industria/:tabela/:productId', async (req, res) => {
        try {
            const { industria, tabela, productId } = req.params;

            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_descontoadd = 0 
                 WHERE itab_idprod = $1 
                   AND itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [productId, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: 'Desconto ADD zerado com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Erro ao zerar desconto ADD:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao zerar desconto ADD: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/zero-discount-special/:industria/:tabela/:productId
    // Zerar desconto especial de um produto específico
    // ============================================================================
    router.put('/products/zero-discount-special/:industria/:tabela/:productId', async (req, res) => {
        try {
            const { industria, tabela, productId } = req.params;

            // Zerando itab_descontoadd (pode ser ajustado se houver outro campo específico)
            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_descontoadd = 0 
                 WHERE itab_idprod = $1 
                   AND itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [productId, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: 'Desconto especial zerado com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Erro ao zerar desconto especial:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao zerar desconto especial: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/zero-promo-price/:industria/:tabela/:productId
    // Zerar preço promocional (preço 2) de um produto específico
    // ============================================================================
    router.put('/products/zero-promo-price/:industria/:tabela/:productId', async (req, res) => {
        try {
            const { industria, tabela, productId } = req.params;

            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_precopromo = 0 
                 WHERE itab_idprod = $1 
                   AND itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [productId, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: 'Preço promocional zerado com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Erro ao zerar preço promocional:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao zerar preço promocional: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/zero-special-price/:industria/:tabela/:productId
    // Zerar preço especial (preço 3) de um produto específico
    // ============================================================================
    router.put('/products/zero-special-price/:industria/:tabela/:productId', async (req, res) => {
        try {
            const { industria, tabela, productId } = req.params;

            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_precoespecial = 0 
                 WHERE itab_idprod = $1 
                   AND itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [productId, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: 'Preço especial zerado com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Erro ao zerar preço especial:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao zerar preço especial: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/set-discount-group/:industria/:tabela
    // Inserir ou atualizar grupo de desconto de TODOS os produtos da tabela
    // ============================================================================
    router.put('/products/set-discount-group/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;
            const { itab_grupodesconto } = req.body;

            if (!itab_grupodesconto) {
                return res.status(400).json({
                    success: false,
                    message: 'Grupo de desconto é obrigatório'
                });
            }

            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_grupodesconto = $1 
                 WHERE itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [itab_grupodesconto, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhum produto encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: `Grupo de desconto aplicado a ${result.rows.length} produtos!`,
                totalAtualizados: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao aplicar grupo de desconto:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao aplicar grupo de desconto: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/remove-discount-group/:industria/:tabela
    // Remover grupo de desconto de TODOS os produtos da tabela
    // ============================================================================
    router.put('/products/remove-discount-group/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;

            const result = await pool.query(
                `UPDATE cad_tabelaspre 
                 SET itab_grupodesconto = NULL 
                 WHERE itab_idindustria = $1 
                   AND itab_tabela = $2 
                 RETURNING *`,
                [industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhum produto encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: `Grupo de desconto removido de ${result.rows.length} produtos!`,
                totalAtualizados: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao remover grupo de desconto:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao remover grupo de desconto: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/update-ipi/:industria/:tabela
    // Atualizar IPI de todos os produtos da tabela com percentual informado
    // ============================================================================
    router.put('/products/update-ipi/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;
            const { percentage } = req.body;

            if (percentage === undefined || percentage === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Percentual de IPI é obrigatório'
                });
            }

            // Atualiza IPI de todos os produtos da tabela com o percentual informado
            const result = await pool.query(
                `UPDATE cad_tabelaspre
                 SET itab_ipi = $1
                 WHERE itab_idindustria = $2
                   AND itab_tabela = $3
                 RETURNING *`,
                [percentage, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhum produto encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: `IPI atualizado para ${percentage}% em ${result.rows.length} produtos!`,
                totalAtualizados: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao atualizar IPI:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao atualizar IPI: ${error.message}`
            });
        }
    });

    // ============================================================================
    // PUT /api/products/update-st/:industria/:tabela
    // Atualizar ST de todos os produtos da tabela com percentual informado
    // ============================================================================
    router.put('/products/update-st/:industria/:tabela', async (req, res) => {
        try {
            const { industria, tabela } = req.params;
            const { percentage } = req.body;

            if (percentage === undefined || percentage === null) {
                return res.status(400).json({
                    success: false,
                    message: 'Percentual de ST é obrigatório'
                });
            }

            // Atualiza ST de todos os produtos da tabela com o percentual informado
            const result = await pool.query(
                `UPDATE cad_tabelaspre
                 SET itab_st = $1
                 WHERE itab_idindustria = $2
                   AND itab_tabela = $3
                 RETURNING *`,
                [percentage, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Nenhum produto encontrado nesta tabela'
                });
            }

            res.json({
                success: true,
                message: `ST atualizado para ${percentage}% em ${result.rows.length} produtos!`,
                totalAtualizados: result.rows.length,
                data: result.rows
            });
        } catch (error) {
            console.error('Erro ao atualizar ST:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao atualizar ST: ${error.message}`
            });
        }
    });

    // ============================================================================
    // DELETE /api/price-tables/products/:industria/:tabela/:productId
    // Excluir um produto específico de uma tabela de preço
    // ============================================================================
    router.delete('/products/:industria/:tabela/:productId', async (req, res) => {
        try {
            const { industria, tabela, productId } = req.params;

            const result = await pool.query(
                `DELETE FROM cad_tabelaspre 
                 WHERE itab_idprod = $1 
                   AND itab_idindustria = $2 
                   AND itab_tabela = $3 
                 RETURNING *`,
                [productId, industria, tabela]
            );

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Produto não encontrado nesta tabela de preço'
                });
            }

            res.json({
                success: true,
                message: 'Produto excluído da tabela com sucesso!',
                data: result.rows[0]
            });
        } catch (error) {
            console.error('Erro ao excluir produto da tabela:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao excluir produto: ${error.message}`
            });
        }
    });

    return router;
};
