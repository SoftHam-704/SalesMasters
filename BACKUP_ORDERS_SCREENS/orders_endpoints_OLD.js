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
            let {
                ped_numero,
                ped_pedido,
                ped_cliente,
                ped_industria,
                ped_vendedor,
                ped_transp,
                ped_tabela,
                ped_totbruto,
                ped_totliq,
                ped_totalipi,
                ped_obs,
                ped_situacao
            } = req.body;

            // 1. GERAÇÃO AUTOMÁTICA DE NÚMERO (FALLBACK)
            // Se o frontend (versão antiga ou cacheada) não enviar o número já gerado, geramos aqui.
            if (!ped_pedido || ped_pedido === '(Novo)' || !ped_numero) {
                console.log('⚠️ [ORDERS] ped_pedido ou ped_numero ausente no POST. Gerando no backend para compatibilidade...');
                const userInitials = "HS";
                const seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
                ped_numero = seqResult.rows[0].next_num;
                ped_pedido = userInitials + ped_numero.toString().padStart(6, '0');
            }

            // 2. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS DO BANCO (NOT NULL)
            if (!ped_cliente || !ped_industria) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente e Indústria são obrigatórios para salvar o pedido.'
                });
            }

            // 3. LOG DE DEBUG
            console.log(`📝 [ORDERS] Creating order: ${ped_pedido} (Num: ${ped_numero}) for client ${ped_cliente}`);

            const query = `
                INSERT INTO pedidos (
                    ped_data,
                    ped_situacao,
                    ped_numero,
                    ped_pedido,
                    ped_cliente,
                    ped_industria,
                    ped_vendedor,
                    ped_transp,
                    ped_tabela,
                    ped_totbruto,
                    ped_totliq,
                    ped_totalipi,
                    ped_obs
                ) VALUES (
                    CURRENT_DATE,
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
                ) RETURNING *
            `;

            const values = [
                ped_situacao || 'P',
                ped_numero,
                ped_pedido,
                ped_cliente,
                ped_industria,
                ped_vendedor || 0, // Fallback para 0 para evitar NOT NULL constraint
                ped_transp || 0,   // Fallback para 0 para evitar NOT NULL constraint
                ped_tabela || '',
                ped_totbruto || 0,
                ped_totliq || 0,
                ped_totalipi || 0,
                ped_obs || ''
            ];

            const result = await pool.query(query, values);
            res.json({ success: true, data: result.rows[0] });
        } catch (error) {
            console.error('❌ [ORDERS] Error creating order:', error);
            res.status(500).json({ success: false, message: `Erro ao criar pedido: ${error.message}` });
        }
    });

    // PUT - Atualizar pedido existente
    app.put('/api/orders/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const {
                ped_cliente,
                ped_vendedor,
                ped_transp,
                ped_tabela,
                ped_totbruto,
                ped_totliq,
                ped_totalipi,
                ped_obs,
                ped_situacao
            } = req.body;

            const query = `
                UPDATE pedidos SET
                    ped_cliente = $1,
                    ped_vendedor = $2,
                    ped_transp = $3,
                    ped_tabela = $4,
                    ped_totbruto = $5,
                    ped_totliq = $6,
                    ped_totalipi = $7,
                    ped_obs = $8,
                    ped_situacao = $9
                WHERE ped_pedido = $10
                RETURNING *
            `;
            const values = [
                ped_cliente,
                ped_vendedor,
                ped_transp,
                ped_tabela,
                ped_totbruto,
                ped_totliq,
                ped_totalipi,
                ped_obs,
                ped_situacao || 'P',
                id
            ];

            const result = await pool.query(query, values);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado no banco de dados' });
            }

            res.json({ success: true, data: result.rows[0], message: 'Pedido atualizado com sucesso!' });
        } catch (error) {
            console.error('❌ [ORDERS] Error updating order:', error);
            res.status(500).json({ success: false, message: `Erro ao atualizar pedido: ${error.message}` });
        }
    });

    // Narratives are now handled by narratives_endpoints.js
};
