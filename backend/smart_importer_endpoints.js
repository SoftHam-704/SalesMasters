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

                // Para cada indústra que tem esse produto, vamos ver se o cliente tem tabela
                let matchedInAnyIndustry = false;

                for (const product of productRes.rows) {
                    const conditions = clientConditions[product.pro_industria];
                    if (!conditions) continue; // Cliente não trabalha com essa indústria ou não tem tabela definida

                    // 3. Buscar preço na tabela específica
                    const priceQuery = `
                        SELECT 
                            itab_precobruto,
                            itab_precopromo,
                            itab_precoespecial,
                            itab_grupodesconto
                        FROM cad_tabelaspre
                        WHERE itab_idprod = $1 
                          AND itab_tabela = $2
                        LIMIT 1
                    `;
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
                            pro_id: product.pro_id, // Adicionado para facilitar o faturamento
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
                            tabela: conditions.cli_tabela,
                            descontos: conditions // Passamos os descontos do cliente para o front calcular
                        });
                        matchedInAnyIndustry = true;
                        break; // Se achou em uma indústria válida para o cliente, paramos (prioridade da primeira que der match)
                    }
                }

                if (!matchedInAnyIndustry) {
                    notFound.push({
                        codigo: searchCode,
                        quantidade: qty,
                        motivo: 'Produto existe mas cliente não tem tabela ativa para esta indústria'
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
     * POST /api/smart-importer/checkout
     * Transforma as sacolas em pedidos reais no banco
     */
    router.post('/checkout', async (req, res) => {
        const { buckets, vendedor_id, user_initials } = req.body;

        if (!buckets || !Array.isArray(buckets) || buckets.length === 0) {
            return res.status(400).json({ success: false, message: 'Sacolas vazias ou inválidas.' });
        }

        const client = await pool.connect();
        const createdOrders = [];

        try {
            await client.query('BEGIN');

            for (const bucket of buckets) {
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

                // Calcular Totais da Sacola
                const totBrutoSacola = bucket.items.reduce((acc, item) => acc + (parseFloat(item.preco_bruto || 0) * parseFloat(item.quantidade || 0)), 0);
                const totLiqSacola = bucket.total; // Já calculado como unitário_liq * qtd na análise

                // 2. Inserir Pedido
                const orderQuery = `
                    INSERT INTO pedidos (
                        ped_data, ped_situacao, ped_numero, ped_pedido, ped_cliente, 
                        ped_industria, ped_vendedor, ped_tabela, ped_totbruto, ped_totliq,
                        ped_obs
                    ) VALUES (
                        CURRENT_DATE, 'P', $1, $2, $3, $4, $5, $6, $7, $8, $9
                    ) RETURNING *
                `;

                const orderValues = [
                    pedNumero,
                    pedPedido,
                    cli_codigo,
                    bucket.industria_id,
                    vendedor_id || 0,
                    tabela,
                    totBrutoSacola,
                    totLiqSacola,
                    'Pedido gerado via Importador Inteligente'
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
