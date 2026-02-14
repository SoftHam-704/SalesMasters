// Reports Endpoints Module
module.exports = function (app, pool) {
    const getPool = (req) => req.pool || pool;

    // GET - Fetch active customers for reduced report
    app.get('/api/v2/reports/customers/reduced', async (req, res) => {
        try {
            const query = `
                SELECT 
                    cli_codigo, cli_nome, cli_nomred, cli_cidade, cli_uf, cli_fone1, cli_email
                FROM clientes
                WHERE cli_tipopes = 'A'
                ORDER BY cli_nome ASC
            `;
            const result = await getPool(req).query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [REPORT_CUSTOMERS] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Fetch product groups (Families)
    app.get('/api/v2/reports/groups', async (req, res) => {
        try {
            const result = await getPool(req).query('SELECT gru_codigo as id, gru_nome as nome FROM grupos ORDER BY gru_nome');
            res.json({ success: true, data: result.rows });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Report: Sales by Product Family (Group)
    app.get('/api/v2/reports/sales-by-family', async (req, res) => {
        const { groupId, startDate, endDate } = req.query;
        try {
            const query = `
                SELECT 
                    c.cli_nomred, 
                    MAX(p.ped_data) as ultima_compra,
                    CURRENT_DATE - MAX(p.ped_data) as dias_sem_compra,
                    c.cli_fone1
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                JOIN cad_prod pr ON i.ite_produto = pr.pro_codprod AND p.ped_industria = pr.pro_industria
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_data BETWEEN $1 AND $2
                AND p.ped_situacao IN ('P', 'F')
                ${groupId ? 'AND pr.pro_grupo = $3' : ''}
                GROUP BY c.cli_codigo, c.cli_nomred, c.cli_fone1
                ORDER BY ultima_compra DESC
            `;
            const params = groupId ? [startDate, endDate, groupId] : [startDate, endDate];
            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [SALES_BY_FAMILY] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Report: General Product Sales
    app.get('/api/v2/reports/sales-by-product', async (req, res) => {
        const { productCode, supplierId } = req.query;
        if (!productCode) return res.status(400).json({ success: false, message: 'productCode obrigatorio' });

        try {
            const query = `
                SELECT 
                    c.cli_nomred,
                    p.ped_data as data_compra,
                    CURRENT_DATE - p.ped_data as dias_sem_compra,
                    p.ped_pedido as ped_numero,
                    i.ite_quant as ite_quantidade,
                    i.ite_puni as ite_valorunit
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE i.ite_produto = $1
                AND p.ped_situacao IN ('P', 'F')
                ${supplierId ? 'AND p.ped_industria = $2' : ''}
                ORDER BY p.ped_data DESC
            `;
            const params = supplierId ? [productCode, supplierId] : [productCode];
            const result = await getPool(req).query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [SALES_BY_PRODUCT] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // GET - Quick search for products
    app.get('/api/v2/reports/products/search', async (req, res) => {
        const { q, supplierId } = req.query;
        if (!q || q.length < 2) return res.json({ success: true, data: [] });
        try {
            const query = `
                SELECT 
                    pro_codprod as id, 
                    pro_nome as nome, 
                    COALESCE(pro_codigonormalizado, pro_codprod) as referencia,
                    pro_codprod as codigo_original
                FROM cad_prod 
                WHERE (
                    pro_nome ILIKE $1 OR 
                    pro_codprod ILIKE $1 OR 
                    pro_codigonormalizado ILIKE $1
                )
                ${supplierId ? 'AND pro_industria = $2' : ''}
                ORDER BY pro_nome ASC
                LIMIT 50
            `;
            const cleanSupplierId = supplierId ? String(supplierId).split(':')[0] : null;
            const searchVal = `%${q}%`;
            const params = cleanSupplierId ? [searchVal, cleanSupplierId] : [searchVal];
            const result = await getPool(req).query(query, params);

            console.log(`🔎 [PRODUCT_SEARCH] Query for "${q}" (Supplier: ${cleanSupplierId}) returned ${result.rows.length} rows.`);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [PRODUCT_SEARCH] Error:', error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    });



};


