// Order Items Endpoints Module

module.exports = function (app, pool) {

    // GET - Listar itens de um pedido
    app.get('/api/orders/:pedPedido/items', async (req, res) => {
        try {
            const { pedPedido } = req.params;
            const query = `
                SELECT * FROM itens_ped 
                WHERE TRIM(ite_pedido) = TRIM($1) 
                ORDER BY ite_seq
            `;
            const result = await pool.query(query, [pedPedido]);
            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [ORDER_ITEMS] Error listing items:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao listar itens: ${error.message}`
            });
        }
    });

    // POST - Adicionar/Atualizar item no pedido
    app.post('/api/orders/:pedPedido/items', async (req, res) => {
        const client = await pool.connect();
        try {
            const { pedPedido } = req.params;
            const item = req.body;

            await client.query('BEGIN');

            // Se ite_seq não for passado, pegar o próximo
            let ite_seq = item.ite_seq;
            if (!ite_seq) {
                const seqResult = await client.query(
                    'SELECT COALESCE(MAX(ite_seq), 0) + 1 as next_seq FROM itens_ped WHERE ite_pedido = $1',
                    [pedPedido]
                );
                ite_seq = seqResult.rows[0].next_seq;
            }

            const query = `
                INSERT INTO itens_ped (
                    ite_pedido, ite_seq, ite_industria, ite_idproduto, ite_produto, ite_embuch, ite_nomeprod,
                    ite_quant, ite_puni, ite_totbruto, ite_puniliq, ite_totliquido, ite_ipi,
                    ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                    ite_des6, ite_des7, ite_des8, ite_des9, ite_des10, ite_des11, ite_valcomipi,
                    ite_st, ite_valcomst, ite_promocao
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
                ON CONFLICT (ite_pedido, ite_seq) DO UPDATE SET
                    ite_industria = EXCLUDED.ite_industria,
                    ite_idproduto = EXCLUDED.ite_idproduto,
                    ite_produto = EXCLUDED.ite_produto,
                    ite_embuch = EXCLUDED.ite_embuch,
                    ite_nomeprod = EXCLUDED.ite_nomeprod,
                    ite_quant = EXCLUDED.ite_quant,
                    ite_puni = EXCLUDED.ite_puni,
                    ite_totbruto = EXCLUDED.ite_totbruto,
                    ite_puniliq = EXCLUDED.ite_puniliq,
                    ite_totliquido = EXCLUDED.ite_totliquido,
                    ite_ipi = EXCLUDED.ite_ipi,
                    ite_des1 = EXCLUDED.ite_des1,
                    ite_des2 = EXCLUDED.ite_des2,
                    ite_des3 = EXCLUDED.ite_des3,
                    ite_des4 = EXCLUDED.ite_des4,
                    ite_des5 = EXCLUDED.ite_des5,
                    ite_des6 = EXCLUDED.ite_des6,
                    ite_des7 = EXCLUDED.ite_des7,
                    ite_des8 = EXCLUDED.ite_des8,
                    ite_des9 = EXCLUDED.ite_des9,
                    ite_des10 = EXCLUDED.ite_des10,
                    ite_des11 = EXCLUDED.ite_des11,
                    ite_valcomipi = EXCLUDED.ite_valcomipi,
                    ite_st = EXCLUDED.ite_st,
                    ite_valcomst = EXCLUDED.ite_valcomst,
                    ite_promocao = EXCLUDED.ite_promocao
                RETURNING *
            `;

            const values = [
                pedPedido,
                ite_seq,
                item.ite_industria || null,
                item.ite_idproduto || null,
                item.ite_produto,
                item.ite_embuch || '',
                item.ite_nomeprod || '',
                item.ite_quant || 1,
                item.ite_puni || 0,
                item.ite_totbruto || 0,
                item.ite_puniliq || 0,
                item.ite_totliquido || 0,
                item.ite_ipi || 0,
                item.ite_des1 || 0,
                item.ite_des2 || 0,
                item.ite_des3 || 0,
                item.ite_des4 || 0,
                item.ite_des5 || 0,
                item.ite_des6 || 0,
                item.ite_des7 || 0,
                item.ite_des8 || 0,
                item.ite_des9 || 0,
                item.ite_des10 || 0, // % ADD
                item.ite_des11 || 0, // % ESP
                item.ite_valcomipi || 0,
                item.ite_st || 0,
                item.ite_valcomst || 0,
                item.ite_promocao || 'N'
            ];

            const result = await client.query(query, values);

            // Atualizar totais do cabeçalho
            await client.query(`
                UPDATE pedidos 
                SET ped_totbruto = (SELECT SUM(ite_totbruto) FROM itens_ped WHERE ite_pedido = $1),
                    ped_totliq = (SELECT SUM(ite_totliquido) FROM itens_ped WHERE ite_pedido = $1),
                    ped_totalipi = (SELECT SUM(ite_valcomipi - ite_totliquido) FROM itens_ped WHERE ite_pedido = $1)
                WHERE ped_pedido = $1
            `, [pedPedido]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Item salvo com sucesso',
                data: result.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [ORDER_ITEMS] Error saving item:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao salvar item: ${error.message}`
            });
        } finally {
            client.release();
        }
    });

    // POST - Sincronizar itens do pedido (Batch Sync)
    app.post('/api/orders/:pedPedido/items/sync', async (req, res) => {
        const client = await pool.connect();
        try {
            const { pedPedido } = req.params;
            const items = req.body; // Array de itens

            console.log(`🔄 [ORDER_ITEMS] Syncing ${items.length} items for order ${pedPedido}`);

            await client.query('BEGIN');

            // 1. Remover itens atuais
            await client.query('DELETE FROM itens_ped WHERE ite_pedido = $1', [pedPedido]);

            // 2. Inserir novos itens
            if (items && items.length > 0) {
                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    // 🛡️ Fallback: Tentar resolver ID do produto se vier nulo OU ZERO
                    let resolvedIdProduto = item.ite_idproduto;
                    // Considera inválido: null, undefined, 0, ''
                    const isInvalidId = !resolvedIdProduto || resolvedIdProduto === 0 || resolvedIdProduto === '0';

                    if (isInvalidId && item.ite_produto) {
                        try {
                            // Buscar primeiro pela indústria, depois global
                            let lookupQuery = `
                                SELECT pro_id FROM cad_prod 
                                WHERE (pro_codprod = $1 OR pro_codigonormalizado = $1)
                            `;
                            const params = [item.ite_produto.toString().trim()];

                            if (item.ite_industria) {
                                lookupQuery += ` AND pro_industria = $2`;
                                params.push(item.ite_industria);
                            }
                            lookupQuery += ` LIMIT 1`;

                            let lookupResult = await client.query(lookupQuery, params);

                            // Se não encontrou com indústria, tenta sem
                            if (lookupResult.rows.length === 0 && item.ite_industria) {
                                lookupResult = await client.query(
                                    `SELECT pro_id FROM cad_prod WHERE pro_codprod = $1 OR pro_codigonormalizado = $1 LIMIT 1`,
                                    [item.ite_produto.toString().trim()]
                                );
                            }

                            if (lookupResult.rows.length > 0) {
                                resolvedIdProduto = lookupResult.rows[0].pro_id;
                                console.log(`🔄 [SYNC-RESOLVE] Backend resolveu ${item.ite_produto} -> ID ${resolvedIdProduto}`);
                            } else {
                                console.warn(`⚠️ [SYNC-RESOLVE] Produto não encontrado: ${item.ite_produto}`);
                                resolvedIdProduto = null; // Mantém null se não encontrou
                            }
                        } catch (lookupErr) {
                            console.warn(`⚠️ [SYNC-RESOLVE] Falha ao buscar produto ${item.ite_produto}:`, lookupErr.message);
                            resolvedIdProduto = null;
                        }
                    }

                    const query = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_seq, ite_industria, ite_idproduto, ite_produto, ite_embuch, ite_nomeprod,
                            ite_quant, ite_puni, ite_totbruto, ite_puniliq, ite_totliquido, ite_ipi,
                            ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                            ite_des6, ite_des7, ite_des8, ite_des9, ite_des10, ite_des11, ite_valcomipi,
                            ite_st, ite_valcomst, ite_promocao
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28)
                    `;
                    const values = [
                        pedPedido,
                        item.ite_seq || (i + 1),
                        item.ite_industria || null,
                        resolvedIdProduto,
                        item.ite_produto,
                        item.ite_embuch || '',
                        item.ite_nomeprod || '',
                        item.ite_quant || 0,
                        item.ite_puni || 0,
                        item.ite_totbruto || 0,
                        item.ite_puniliq || 0,
                        item.ite_totliquido || 0,
                        item.ite_ipi || 0,
                        item.ite_des1 || 0,
                        item.ite_des2 || 0,
                        item.ite_des3 || 0,
                        item.ite_des4 || 0,
                        item.ite_des5 || 0,
                        item.ite_des6 || 0,
                        item.ite_des7 || 0,
                        item.ite_des8 || 0,
                        item.ite_des9 || 0,
                        item.ite_des10 || 0,
                        item.ite_des11 || 0,
                        item.ite_valcomipi || 0,
                        item.ite_st || 0,
                        item.ite_valcomst || 0,
                        item.ite_promocao || 'N'
                    ];
                    await client.query(query, values);
                }
            }

            // 3. Atualizar totais do cabeçalho
            const totalsQuery = `
                UPDATE pedidos 
                SET ped_totbruto = COALESCE((SELECT SUM(ite_totbruto * ite_quant) FROM itens_ped WHERE ite_pedido = $1), 0),
                    ped_totliq = COALESCE((SELECT SUM(ite_totliquido) FROM itens_ped WHERE ite_pedido = $1), 0),
                    ped_totalipi = COALESCE((SELECT SUM(ite_valcomipi - ite_totliquido) FROM itens_ped WHERE ite_pedido = $1), 0)
                WHERE ped_pedido = $1
                RETURNING ped_totbruto, ped_totliq, ped_totalipi
            `;
            const totalsResult = await client.query(totalsQuery, [pedPedido]);

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Itens sincronizados com sucesso',
                totals: totalsResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [ORDER_ITEMS] Error syncing items:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao sincronizar itens: ${error.message}`
            });
        } finally {
            client.release();
        }
    });

    // GET - Histórico de compras de um produto para um cliente específico
    // Retorna os últimos 10 pedidos do produto para o cliente, ordenados por data decrescente
    app.get('/api/orders/product-history/:produto/:cliente/:industria', async (req, res) => {
        try {
            const { produto, cliente, industria } = req.params;

            console.log(`📜 [HISTORY] Buscando histórico: produto=${produto}, cliente=${cliente}, industria=${industria}`);

            const query = `
                SELECT 
                    p.ped_pedido,
                    p.ped_data,
                    p.ped_situacao,
                    i.ite_quant,
                    i.ite_puni,
                    i.ite_puniliq,
                    i.ite_totliquido,
                    i.ite_des1, i.ite_des2, i.ite_des3, i.ite_des4, i.ite_des5,
                    i.ite_des6, i.ite_des7, i.ite_des8, i.ite_des9,
                    i.ite_ipi,
                    i.ite_st,
                    i.ite_valcomst
                FROM itens_ped i
                INNER JOIN pedidos p ON TRIM(p.ped_pedido) = TRIM(i.ite_pedido)
                WHERE TRIM(i.ite_produto) = TRIM($1)
                  AND p.ped_cliente = $2
                  AND p.ped_industria = $3
                  AND p.ped_situacao NOT IN ('E') -- Excluir pedidos excluídos
                ORDER BY p.ped_data DESC, p.ped_pedido DESC
                LIMIT 10
            `;

            const result = await pool.query(query, [produto, cliente, industria]);

            console.log(`📜 [HISTORY] Retornados ${result.rows.length} registros`);

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [HISTORY] Error fetching product history:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar histórico: ${error.message}`
            });
        }
    });

    // POST - Calcular Descontos de Grupo (Botão 3 - F5)
    app.post('/api/orders/calculate-group-discounts', async (req, res) => {
        try {
            const { clientId, industryId, tableId, items } = req.body;
            // items: array de objetos { ite_produto, ite_embuch, ... }

            const itemCodes = items.map(i => i.ite_produto);
            if (!itemCodes.length) return res.json({ success: true, data: {} });

            // 1. Buscar dados dos produtos (Grupos)
            // JOIN com cad_itens_tabelapre para pegar itab_grupodesconto
            const productsQuery = `
                SELECT 
                    p.pro_codprod,
                    p.pro_grupo,
                    it.itab_grupodesconto
                FROM cad_prod p
                LEFT JOIN cad_tabelaspre it 
                    ON it.itab_idprod = p.pro_id 
                    AND it.itab_tabela = $1
                    AND it.itab_idindustria = $2
                WHERE p.pro_codprod = ANY($3)
                  AND p.pro_industria = $2
            `;
            const productsResult = await pool.query(productsQuery, [tableId, industryId, itemCodes]);
            const productsMap = {};
            productsResult.rows.forEach(p => productsMap[p.pro_codprod] = p);

            // 2. Buscar descontos do CLIENTE (Prioridade 1)
            // Tabela: cli_descpro (cli_codigo, cli_forcodigo, cli_grupo)
            const clientDescQuery = `
                SELECT cli_grupo, cli_desc1, cli_desc2, cli_desc3, cli_desc4, cli_desc5, cli_desc6, cli_desc7, cli_desc8, cli_desc9
                FROM cli_descpro
                WHERE cli_codigo = $1 AND cli_forcodigo = $2
            `;
            const clientDescResult = await pool.query(clientDescQuery, [clientId, industryId]);
            const clientDescMap = {}; // Key: cli_grupo
            clientDescResult.rows.forEach(d => clientDescMap[d.cli_grupo] = d);

            // 3. Buscar descontos da TABELA DE PREÇO (Prioridade 2)
            // Tabela: grupo_desc (gid)
            const groupDescQuery = `
                SELECT gid, gde_desc1, gde_desc2, gde_desc3, gde_desc4, gde_desc5, gde_desc6, gde_desc7, gde_desc8, gde_desc9
                FROM grupo_desc
            `;
            const groupDescResult = await pool.query(groupDescQuery);
            const groupDescMap = {}; // Key: gid
            groupDescResult.rows.forEach(d => groupDescMap[d.gid] = d);

            // 4. Calcular descontos
            const results = {}; // Key: ite_produto -> { des1, des2... }

            items.forEach(item => {
                const code = item.ite_produto;
                const product = productsMap[code];

                if (!product) return; // Produto não encontrado

                let appliedDiscount = null;
                let source = null;

                // Prioridade 1: Cliente
                const clientDesc = clientDescMap[product.pro_grupo];
                if (clientDesc) {
                    appliedDiscount = {
                        ite_des1: clientDesc.cli_desc1,
                        ite_des2: clientDesc.cli_desc2,
                        ite_des3: clientDesc.cli_desc3,
                        ite_des4: clientDesc.cli_desc4,
                        ite_des5: clientDesc.cli_desc5,
                        ite_des6: clientDesc.cli_desc6,
                        ite_des7: clientDesc.cli_desc7,
                        ite_des8: clientDesc.cli_desc8,
                        ite_des9: clientDesc.cli_desc9
                    };
                    source = 'CLIENT_GROUP';
                }
                // Prioridade 2: Tabela (itab_grupodesconto)
                else if (product.itab_grupodesconto) {
                    const groupDesc = groupDescMap[product.itab_grupodesconto];
                    if (groupDesc) {
                        appliedDiscount = {
                            ite_des1: groupDesc.gde_desc1,
                            ite_des2: groupDesc.gde_desc2,
                            ite_des3: groupDesc.gde_desc3,
                            ite_des4: groupDesc.gde_desc4,
                            ite_des5: groupDesc.gde_desc5,
                            ite_des6: groupDesc.gde_desc6,
                            ite_des7: groupDesc.gde_desc7,
                            ite_des8: groupDesc.gde_desc8,
                            ite_des9: groupDesc.gde_desc9
                        };
                        source = 'TABLE_GROUP';
                    }
                }

                if (appliedDiscount) {
                    results[code] = { ...appliedDiscount, source };
                }
            });

            res.json({ success: true, data: results });

        } catch (error) {
            console.error('❌ [DISCOUNTS] Error calculating group discounts:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Buscar Últimos Preços em Lote (Botão 7 - F5)
    app.post('/api/orders/batch-last-prices', async (req, res) => {
        try {
            const { clientId, industryId, productCodes } = req.body;

            if (!productCodes || !productCodes.length) {
                return res.json({ success: true, data: {} });
            }

            // DISTINCT ON (i.ite_produto) garante um registro por produto
            // ORDER BY ... p.ped_data DESC garante que seja o último
            const query = `
                SELECT DISTINCT ON (i.ite_produto)
                    i.ite_produto, 
                    i.ite_puni
                FROM itens_ped i
                INNER JOIN pedidos p ON p.ped_pedido = i.ite_pedido
                WHERE p.ped_cliente = $1
                  AND p.ped_industria = $2
                  AND i.ite_produto = ANY($3)
                  AND p.ped_situacao NOT IN ('E')
                ORDER BY i.ite_produto, p.ped_data DESC, p.ped_pedido DESC
            `;

            const result = await pool.query(query, [clientId, industryId, productCodes]);

            const priceMap = {};
            result.rows.forEach(row => {
                priceMap[row.ite_produto] = row.ite_puni;
            });

            res.json({ success: true, data: priceMap });

        } catch (error) {
            console.error('❌ [LAST_PRICES] Error fetching batch last prices:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // POST - Buscar Código Original e Embalagem em Lote (Botão 0 e A)
    app.post('/api/orders/batch-original-codes', async (req, res) => {
        try {
            const { industryId, productCodes } = req.body;

            if (!productCodes || !productCodes.length) {
                return res.json({ success: true, data: {} });
            }

            const query = `
                SELECT 
                    pro_codprod, 
                    pro_codigooriginal,
                    pro_embalagem
                FROM cad_prod
                WHERE pro_industria = $1
                  AND pro_codprod = ANY($2)
            `;

            const result = await pool.query(query, [industryId, productCodes]);

            const dataMap = {};
            result.rows.forEach(row => {
                dataMap[row.pro_codprod] = {
                    originalCode: row.pro_codigooriginal,
                    packaging: row.pro_embalagem
                };
            });

            res.json({ success: true, data: dataMap });

        } catch (error) {
            console.error('❌ [PROD_INFO] Error fetching batch product info:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

};
