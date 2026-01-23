// Orders Endpoints Module

module.exports = function (app, pool) {

    // GET - Gerar próximo número de pedido
    app.get('/api/orders/next-number', async (req, res) => {
        try {
            const userInitials = "HS";
            const seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
            const pedNumero = seqResult.rows[0].next_num;
            const pedPedido = userInitials + pedNumero.toString().padStart(6, '0');

            console.log(`📝 [ORDERS] Generated next order number: ${pedPedido}`);

            res.json({
                success: true,
                data: {
                    formatted_number: pedPedido,
                    sequence: pedNumero
                }
            });
        } catch (error) {
            console.error('❌ [ORDERS] Error generating order number:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar número do pedido: ${error.message}`
            });
        }
    });
    // POST - Criar novo pedido (cabeçalho)
    app.post('/api/orders', async (req, res) => {
        try {
            const {
                ped_cliente,
                ped_industria,
                ped_tabela,
                ped_totbruto,
                ped_totliq,
                ped_totalipi,
                ped_obs
            } = req.body;

            const query = `
                INSERT INTO pedidos (
                    ped_data,
                    ped_situacao,
                    ped_cliente,
                    ped_industria,
                    ped_tabela,
                    ped_totbruto,
                    ped_totliq,
                    ped_totalipi,
                    ped_obs
                ) VALUES (
                    CURRENT_DATE,
                    'R',
                    $1, $2, $3, $4, $5, $6, $7
                ) RETURNING *
            `;
            const values = [ped_cliente, ped_industria, ped_tabela, ped_totbruto, ped_totliq, ped_totalipi, ped_obs];
            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [ORDERS] Error creating order:', error);
            res.status(500).json({ success: false, message: `Erro ao criar pedido: ${error.message}` });
        }
    });

    // Narratives are now handled by narratives_endpoints.js
};
