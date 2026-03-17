const express = require('express');

module.exports = function (pool) {
    const router = express.Router();

    /**
     * POST /api/smart-importer/analyze
     * Analisa uma lista de códigos e quantidades para descobrir indústrias e preços
     */
    router.post('/analyze', async (req, res) => {
        const { cli_codigo, items } = req.body;

        if (!cli_codigo || !items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Parâmetros cli_codigo e items (array) são obrigatórios.'
            });
        }

        try {
            console.log(`🧠 [SMART_IMPORTER] Analisando ${items.length} itens para cliente ${cli_codigo}`);

            // 1. Buscar tabelas de preço do cliente por indústria (cli_ind)
            const cliIndQuery = `
                SELECT 
                    cli_forcodigo as for_codigo,
                    cli_tabela,
                    COALESCE(cli_desc1, 0) as desc1,
                    COALESCE(cli_desc2, 0) as desc2,
                    COALESCE(cli_desc3, 0) as desc3,
                    COALESCE(cli_desc4, 0) as desc4,
                    COALESCE(cli_desc5, 0) as desc5,
                    COALESCE(cli_desc6, 0) as desc6,
                    COALESCE(cli_desc7, 0) as desc7,
                    COALESCE(cli_desc8, 0) as desc8,
                    COALESCE(cli_desc9, 0) as desc9
                FROM cli_ind
                WHERE cli_codigo = $1
            `;
            const cliIndRes = await pool.query(cliIndQuery, [cli_codigo]);
            const clientConditions = {};
            cliIndRes.rows.forEach(row => {
                clientConditions[row.for_codigo] = row;
            });

            const results = [];
            const notFound = [];

            // 2. Processar cada item
            for (const item of items) {
                const searchCode = String(item.codigo).trim();
                const qty = parseFloat(item.quantidade) || 0;

                if (searchCode.length < 3) continue;

                // Busca o produto em CAD_PROD (todas as indústrias)
                // Usando normalização do banco se disponível, senão lógica simples
                const productQuery = `
                    SELECT 
                        p.pro_id, 
                        p.pro_industria, 
                        p.pro_codprod, 
                        p.pro_nome,
                        f.for_nomered as industria_nome,
                        f.for_cgc as industria_cnpj
                    FROM cad_prod p
                    JOIN fornecedores f ON p.pro_industria = f.for_codigo
                    WHERE p.pro_codprod = $1 
                       OR p.pro_codigonormalizado = fn_normalizar_codigo($1)
                       OR p.pro_conversao = $1
                       OR p.pro_codigooriginal = $1
                    LIMIT 5
                `;

                const productRes = await pool.query(productQuery, [searchCode]);

                if (productRes.rows.length === 0) {
                    notFound.push({ codigo: searchCode, quantidade: qty, motivo: 'Não encontrado no catálogo' });
                    continue;
                }

                // Removemos o filtro de tabela mandatória: o cliente pode comprar de qualquer indústria.
                // Agora o sistema apenas buscará o produto, identificará a indústria (fábrica), e procurará:
                // 1. Tabela específica se ele tiver (clientConditions).
                // 2. Tabela Zero/Padrao (tabela '0' ou nula) caso ele não tenha vínculo com a indústria.

                let matchedInAnyIndustry = false;

                for (const product of productRes.rows) {
                    const conditions = clientConditions[product.pro_industria] || { cli_tabela: '0' }; // Use tabela '0' (padrão) se não tiver vínculo

                    // Buscar preço na tabela específica ou na tabela zero
                    const priceQuery = `
                        SELECT 
                            itab_precobruto,
                            itab_precopromo,
                            itab_precoespecial,
                            itab_grupodesconto
                        FROM cad_tabelaspre
                        WHERE itab_idprod = $1 
                        ORDER BY (itab_tabela = $2) DESC, itab_precobruto DESC
                        LIMIT 1
                    `;
                    // O ORDER BY assegura que:
                    // 1º tenta a tabela exata do cliente ($2)
                    // Se não achar, pega o primeiro preço cadastrado no banco para esse produto.

                    const priceRes = await pool.query(priceQuery, [product.pro_id, conditions.cli_tabela]);

                    if (priceRes.rows.length > 0) {
                        const priceInfo = priceRes.rows[0];

                        // Determinar preço e promo
                        let precoUnitario = parseFloat(priceInfo.itab_precobruto || 0);
                        let isPromo = false;
                        const promoPrice = parseFloat(priceInfo.itab_precopromo || 0);

                        if (promoPrice > 0) {
                            precoUnitario = promoPrice;
                            isPromo = true;
                        }

                        results.push({
                            pro_id: product.pro_id,
                            codigo: product.pro_codprod,
                            descricao: product.pro_nome,
                            quantidade: qty,
                            preco_bruto: parseFloat(priceInfo.itab_precobruto || 0),
                            preco_unitario: precoUnitario,
                            total: qty * precoUnitario,
                            industria_id: product.pro_industria,
                            industria_nome: product.industria_nome,
                            industria_cnpj: product.industria_cnpj,
                            is_promo: isPromo,
                            tabela: conditions.cli_tabela === '0' ? 'Padrão' : conditions.cli_tabela,
                            descontos: conditions.cli_tabela === '0' ? {} : conditions // zeros se n for a tabela do cara
                        });
                        matchedInAnyIndustry = true;
                        break;
                    }
                }

                if (!matchedInAnyIndustry) {
                    notFound.push({
                        codigo: searchCode,
                        quantidade: qty,
                        motivo: 'Produto encontrado, mas sem preço castrado no sistema.'
                    });
                }
            }

            // 3. Agrupar por Indústria para o front facilitar a visualização
            const grouped = {};
            results.forEach(res => {
                const key = res.industria_id;
                if (!grouped[key]) {
                    grouped[key] = {
                        industria_id: res.industria_id,
                        industria_nome: res.industria_nome,
                        industria_cnpj: res.industria_cnpj,
                        items: [],
                        total: 0
                    };
                }
                grouped[key].items.push(res);
                grouped[key].total += res.total;
            });

            res.json({
                success: true,
                grouped: Object.values(grouped),
                notFound
            });

        } catch (error) {
            console.error('❌ [SMART_IMPORTER] Erro na análise:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao analisar itens: ${error.message}`
            });
        }
    });

    /**
     * GET /api/smart-importer/drafts/:vendedor_id
     * Busca todos os rascunhos salvos para um vendedor
     */
    router.get('/drafts/:vendedor_id', async (req, res) => {
        try {
            const { vendedor_id } = req.params;
            const query = `
                SELECT 
                    d.id, d.cli_codigo, d.industria_id, d.industria_nome, d.total, d.items,
                    c.cli_nome, c.cli_fantasia, c.cli_nomred, c.cli_cnpj
                FROM public.smart_importer_drafts d
                JOIN clientes c ON d.cli_codigo = c.cli_codigo
                WHERE d.vendedor_id = $1
                ORDER BY d.updated_at DESC
            `;
            const result = await pool.query(query, [vendedor_id]);

            // Formatar para o padrão de 'buckets' que o front espera
            const buckets = result.rows.map(row => {
                let items = row.items;
                if (typeof items === 'string') {
                    try {
                        items = JSON.parse(items);
                    } catch (e) {
                        console.error('❌ [SMART_IMPORTER] Erro ao parsear itens do rascunho:', e.message);
                        items = [];
                    }
                }

                return {
                    id: row.id,
                    industria_id: row.industria_id,
                    industria_nome: row.industria_nome,
                    total: parseFloat(row.total),
                    items: Array.isArray(items) ? items : [],
                    client: {
                        cli_codigo: row.cli_codigo,
                        cli_nome: row.cli_nome,
                        cli_fantasia: row.cli_fantasia,
                        cli_nomred: row.cli_nomred,
                        cli_cnpj: row.cli_cnpj
                    }
                };
            });

            res.json({ success: true, data: buckets });
        } catch (error) {
            console.error('❌ [SMART_IMPORTER] Erro ao buscar rascunhos:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * POST /api/smart-importer/drafts
     * Salva ou atualiza um rascunho de carrinho
     */
    router.post('/drafts', async (req, res) => {
        try {
            const { vendedor_id, cli_codigo, industria_id, industria_nome, items, total } = req.body;

            // Busca se já existe um rascunho para esse trio (vendedor, cliente, industria)
            const checkQuery = `
                SELECT id FROM public.smart_importer_drafts 
                WHERE vendedor_id = $1 AND cli_codigo = $2 AND industria_id = $3
            `;
            const checkRes = await pool.query(checkQuery, [vendedor_id, cli_codigo, industria_id]);

            if (checkRes.rows.length > 0) {
                // UPDATE
                const updateQuery = `
                    UPDATE public.smart_importer_drafts 
                    SET items = $1, total = $2, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $3
                `;
                await pool.query(updateQuery, [JSON.stringify(items), total, checkRes.rows[0].id]);
                res.json({ success: true, message: 'Rascunho atualizado.', id: checkRes.rows[0].id });
            } else {
                // INSERT
                const insertQuery = `
                    INSERT INTO public.smart_importer_drafts 
                    (vendedor_id, cli_codigo, industria_id, industria_nome, items, total)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING id
                `;
                const insertRes = await pool.query(insertQuery, [
                    vendedor_id, cli_codigo, industria_id, industria_nome, JSON.stringify(items), total
                ]);
                res.json({ success: true, message: 'Rascunho criado.', id: insertRes.rows[0].id });
            }
        } catch (error) {
            console.error('❌ [SMART_IMPORTER] Erro ao salvar rascunho:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * DELETE /api/smart-importer/drafts/:id
     * Remove um rascunho específico
     */
    router.delete('/drafts/:id', async (req, res) => {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM public.smart_importer_drafts WHERE id = $1', [id]);
            res.json({ success: true, message: 'Rascunho removido.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * DELETE /api/smart-importer/drafts/all/:vendedor_id
     * Remove todos os rascunhos de um vendedor
     */
    router.delete('/drafts/all/:vendedor_id', async (req, res) => {
        try {
            const { vendedor_id } = req.params;
            await pool.query('DELETE FROM public.smart_importer_drafts WHERE vendedor_id = $1', [vendedor_id]);
            res.json({ success: true, message: 'Todos os rascunhos removidos.' });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * POST /api/smart-importer/checkout
     * Transforma os carrinhos em pedidos reais no banco
     */
    router.post('/checkout', async (req, res) => {
        const { buckets, vendedor_id, user_initials } = req.body;

        if (!buckets || !Array.isArray(buckets) || buckets.length === 0) {
            return res.status(400).json({ success: false, message: 'Carrinhos vazios ou inválidos.' });
        }

        const client = await pool.connect();
        const createdOrders = [];

        try {
            await client.query('BEGIN');

            for (let bucket of buckets) {
                // Defensive parsing: Se o bucket vier de um rascunho antigo ou stringificado
                if (typeof bucket.items === 'string') {
                    try {
                        bucket.items = JSON.parse(bucket.items);
                    } catch (e) {
                        console.error('❌ [SMART_IMPORTER] Erro crítico ao parsear itens no checkout:', e.message);
                        continue; // Pula esse bucket corrompido
                    }
                }

                if (!Array.isArray(bucket.items) || bucket.items.length === 0) {
                    console.warn('⚠️ [SMART_IMPORTER] Pulando bucket sem itens.');
                    continue;
                }

                // 1. Gerar número de pedido
                let seqResult;
                try {
                    seqResult = await client.query("SELECT nextval('gen_pedidos_id') as next_num");
                } catch (e) {
                    try {
                        seqResult = await client.query("SELECT nextval('pedidos_ped_numero_seq') as next_num");
                    } catch (e2) {
                        throw new Error('Sequência de pedidos não encontrada no banco (gen_pedidos_id / pedidos_ped_numero_seq)');
                    }
                }

                const pedNumero = seqResult.rows[0].next_num;
                const initials = user_initials || "SM"; // Smart Importer default
                const pedPedido = (initials + pedNumero.toString().padStart(6, '0')).replace(/\s+/g, '');

                const cli_codigo = bucket.client?.cli_codigo || (bucket.items[0] ? bucket.items[0].cli_codigo : 0);
                const tabela = bucket.items[0]?.tabela || '';

                // Buscar Transportadora e Condição de Pagamento do Vínculo (cli_ind)
                let transportadora = 0;
                let condPag = '';
                let tipoFrete = 'C'; // CIF por padrão
                try {
                    const vinculoRes = await client.query(
                        'SELECT cli_transportadora, cli_prazopg, cli_frete FROM cli_ind WHERE cli_codigo = $1 AND cli_forcodigo = $2 LIMIT 1',
                        [cli_codigo, bucket.industria_id]
                    );
                    if (vinculoRes.rows.length > 0) {
                        transportadora = vinculoRes.rows[0].cli_transportadora || 0;
                        condPag = vinculoRes.rows[0].cli_prazopg || '';
                        tipoFrete = vinculoRes.rows[0].cli_frete === 'FOB' ? 'F' : 'C';
                    }
                } catch (eVinculo) {
                    console.warn('⚠️ [SMART_IMPORTER] Falha ao buscar vínculo cli_ind:', eVinculo.message);
                }

                // Calcular Totais da Sacola
                const totBrutoSacola = bucket.items.reduce((acc, item) => acc + (parseFloat(item.preco_bruto || 0) * parseFloat(item.quantidade || 0)), 0);
                const totLiqSacola = bucket.total; // Já calculado como unitário_liq * qtd na análise

                // 2. Inserir Pedido
                const orderQuery = `
                    INSERT INTO pedidos (
                        ped_data, ped_situacao, ped_numero, ped_pedido, ped_cliente, 
                        ped_industria, ped_vendedor, ped_transp, ped_tabela, ped_totbruto, ped_totliq,
                        ped_condpag, ped_tipofrete, ped_obs
                    ) VALUES (
                        CURRENT_DATE, 'P', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                    ) RETURNING *
                `;

                const orderValues = [
                    pedNumero,
                    pedPedido,
                    cli_codigo,
                    bucket.industria_id,
                    vendedor_id || 0,
                    transportadora || 0,
                    tabela,
                    totBrutoSacola,
                    totLiqSacola,
                    condPag,
                    tipoFrete,
                    'Pedido gerado via Carrinho Inteligente'
                ];

                await client.query(orderQuery, orderValues);

                // 3. Inserir Itens
                for (let i = 0; i < bucket.items.length; i++) {
                    const item = bucket.items[i];
                    const iteTotBruto = parseFloat(item.preco_bruto || 0) * parseFloat(item.quantidade || 0);
                    const iteTotLiquido = parseFloat(item.preco_unitario || 0) * parseFloat(item.quantidade || 0);

                    const itemQuery = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_seq, ite_industria, ite_idproduto, ite_produto, ite_nomeprod,
                            ite_quant, ite_puni, ite_totbruto, ite_puniliq, ite_totliquido,
                            ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                            ite_des6, ite_des7, ite_des8, ite_des9, ite_promocao
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    `;

                    await client.query(itemQuery, [
                        pedPedido,
                        i + 1,
                        bucket.industria_id,
                        item.pro_id,
                        item.codigo,
                        item.descricao,
                        item.quantidade,
                        item.preco_bruto || item.preco_unitario, // puni (Bruto Unitário)
                        iteTotBruto, // totbruto (puni * qtd)
                        item.preco_unitario, // puniliq (Líquido Unitário)
                        iteTotLiquido, // totliquido (puniliq * qtd)
                        item.descontos?.desc1 || 0,
                        item.descontos?.desc2 || 0,
                        item.descontos?.desc3 || 0,
                        item.descontos?.desc4 || 0,
                        item.descontos?.desc5 || 0,
                        item.descontos?.desc6 || 0,
                        item.descontos?.desc7 || 0,
                        item.descontos?.desc8 || 0,
                        item.descontos?.desc9 || 0,
                        item.is_promo ? 'S' : 'N'
                    ]);
                }

                createdOrders.push(pedPedido);
            }

            await client.query('COMMIT');

            // Limpar rascunhos do banco após sucesso no checkout
            try {
                const user_id = vendedor_id || 0;
                await pool.query('DELETE FROM public.smart_importer_drafts WHERE vendedor_id = $1', [user_id]);
            } catch (e) {
                console.warn('⚠️ [SMART_IMPORTER] Falha ao limpar rascunhos após checkout:', e.message);
            }

            res.json({
                success: true,
                message: `${createdOrders.length} pedidos gerados com sucesso!`,
                orders: createdOrders
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [SMART_IMPORTER] Erro no checkout:', error);
            res.status(500).json({ success: false, message: `Erro ao processar faturamento: ${error.message}` });
        } finally {
            client.release();
        }
    });

    return router;
};
