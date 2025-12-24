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

};
