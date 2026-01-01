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
                    c.*,
                    f.*,
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

            // 2. Determine Order By clause for items
            let orderBy = 'ite_seq';
            if (sortBy === 'codigo') orderBy = 'ite_produto';
            else if (sortBy === 'alfabetica') orderBy = 'ite_nomeprod';

            // 3. Fetch Items with product application info
            const itemsQuery = `
                SELECT ip.*, p.pro_aplicacao2 
                FROM itens_ped ip
                LEFT JOIN cad_prod p ON ip.ite_produto = p.pro_codprod AND ip.ite_industria = p.pro_industria
                WHERE ip.ite_pedido = $1 AND ip.ite_industria = $2
                ORDER BY ${orderBy}
            `;
            const itemsResult = await pool.query(itemsQuery, [pedPedido, industria]);

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
