// Order Print Endpoints Module

module.exports = function (app, pool) {

    // GET - Fetch full order data for printing
    app.get('/api/orders/:pedPedido/print-data', async (req, res) => {
        console.log(`🖨️ [PRINT_DATA] Request received for order: ${req.params.pedPedido}`);
        console.log(`🔍 [PRINT_DATA] Query params:`, req.query);
        try {
            const { pedPedido } = req.params;
            const { sortBy, industria } = req.query; // digitacao, codigo, alfabetica, industria

            if (!industria) {
                return res.status(400).json({ success: false, message: 'ID da Indústria (industria) é obrigatório' });
            }

            // 1. Fetch Order Master Data (exhaustively based on PROC_IMPRIMEPED)
            const masterQuery = `
                SELECT 
                    p.*,
                    p.ped_condpag as order_payment_type,
                    c.cli_nome, c.cli_nomred, c.cli_endereco, c.cli_numero, c.cli_bairro, 
                    c.cli_cidade, c.cli_uf, c.cli_cep, c.cli_cnpj as client_cnpj, c.cli_inscricao, 
                    c.cli_fone, c.cli_fax, c.cli_emailnfe, c.cli_compl, c.cli_cxpostal, c.cli_suframa,
                    f.*,
                    COALESCE(f.for_logotipo, f.for_locimagem, '') as industry_logotipo,
                    v.ven_nome, v.ven_fone1,
                    t.tra_nome, t.tra_endereco, t.tra_bairro, t.tra_cidade, t.tra_uf, t.tra_cep, t.tra_cgc, t.tra_inscricao, t.tra_fone, t.tra_email,
                    i.cli_obsparticular,
                    (SELECT ani_email FROM cli_aniv ca WHERE ca.ani_cliente = p.ped_cliente AND ca.ani_nome = p.ped_comprador LIMIT 1) as ped_emailcomp
                FROM pedidos p
                LEFT JOIN clientes c ON p.ped_cliente = c.cli_codigo
                LEFT JOIN fornecedores f ON p.ped_industria = f.for_codigo
                LEFT JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
                LEFT JOIN transportadora t ON p.ped_transp = t.tra_codigo
                LEFT JOIN cli_ind i ON (p.ped_cliente = i.cli_codigo AND p.ped_industria = i.cli_forcodigo)
                WHERE p.ped_pedido = $1 AND p.ped_industria = $2
            `;
            const masterResult = await pool.query(masterQuery, [pedPedido, industria]);

            if (masterResult.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }

            const orderData = masterResult.rows[0];
            console.log(`📦 [PRINT_DATA] Order found. Industry: ${orderData.for_nome} (Coding: ${orderData.for_codigo})`);
            console.log(`🖼️ [PRINT_DATA] Industry Logo present? ${!!orderData.for_logotipo}. Size: ${orderData.for_logotipo ? orderData.for_logotipo.length : 0} chars.`);

            // 2. Determine Order By clause for items
            let orderBy = 'ite_seq';
            if (sortBy === 'codigo') orderBy = 'ite_produto';
            else if (sortBy === 'alfabetica') orderBy = 'ite_nomeprod';

            // 3. Fetch Items with product application info
            // 3. Fetch Items with product application info
            const pedTabela = masterResult.rows[0].ped_tabela;
            let itemsQuery;
            let itemsParams;

            if (pedTabela) {
                // Fix for duplications: Filter cad_prod using the specific price table
                // Industries like IMA have multiple entries in cad_prod (one per table), causing cartesian product
                itemsQuery = `
                    SELECT ip.*, p.pro_aplicacao, p.pro_aplicacao2, p.pro_codigooriginal 
                    FROM itens_ped ip
                    LEFT JOIN (
                        SELECT cp.* 
                        FROM cad_prod cp
                        INNER JOIN cad_tabelaspre tp ON cp.pro_id = tp.itab_idprod
                        WHERE tp.itab_tabela = $3 AND tp.itab_idindustria = $2
                    ) p ON ip.ite_produto = p.pro_codprod AND ip.ite_industria = p.pro_industria
                    WHERE ip.ite_pedido = $1 AND ip.ite_industria = $2
                    ORDER BY ${orderBy}
                `;
                itemsParams = [pedPedido, industria, pedTabela];
            } else {
                // Fallback for orders without specific table
                itemsQuery = `
                    SELECT ip.*, p.pro_aplicacao, p.pro_aplicacao2, p.pro_codigooriginal 
                    FROM itens_ped ip
                    LEFT JOIN cad_prod p ON ip.ite_produto = p.pro_codprod AND ip.ite_industria = p.pro_industria
                    WHERE ip.ite_pedido = $1 AND ip.ite_industria = $2
                    ORDER BY ${orderBy}
                `;
                itemsParams = [pedPedido, industria];
            }

            const itemsResult = await pool.query(itemsQuery, itemsParams);

            res.json({
                success: true,
                data: {
                    order: masterResult.rows[0],
                    items: itemsResult.rows
                }
            });
        } catch (error) {
            console.error('❌ [PRINT_DATA] Error fetching print data:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao buscar dados de impressão: ${error.message}`
            });
        }
    });

};
