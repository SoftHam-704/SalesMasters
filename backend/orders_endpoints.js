// Orders Endpoints Module

module.exports = function (app, pool) {

    // GET - Gerar próximo número de pedido
    app.get('/api/orders/next-number', async (req, res) => {
        try {
            const { initials } = req.query;
            const userInitials = initials || "HS";

            // Fallback for sequence
            let seqResult;
            try {
                seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
            } catch (e) {
                // Secondary fallback
                try {
                    seqResult = await pool.query("SELECT nextval('pedidos_ped_numero_seq') as next_num");
                } catch (e2) {
                    throw new Error('Sequência de pedidos não encontrada no banco (gen_pedidos_id / pedidos_ped_numero_seq)');
                }
            }

            const pedNumero = seqResult.rows[0].next_num;
            const pedPedido = (userInitials + pedNumero.toString().padStart(6, '0')).replace(/\s+/g, '');

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
                ped_situacao,
                ped_pri, ped_seg, ped_ter, ped_qua, ped_qui, ped_sex, ped_set, ped_oit, ped_nov,
                ped_pedindustria,
                ped_pedindu, // Suporte ao nome curto vindo do frontend
                ped_pedcli,  // Novo campo Pedido Cliente
                ped_condpag,
                ped_tipofrete,
                ped_comprador,
                ped_data
            } = req.body;

            // Normaliza nomes de campos vindo do frontend
            const final_ped_indu = ped_pedindustria || ped_pedindu || '';
            const final_ped_cli = ped_pedcli || '';

            // 1. GERAÇÃO AUTOMÁTICA DE NÚMERO (FALLBACK)
            if (!ped_pedido || ped_pedido === '(Novo)' || !ped_numero) {
                console.log('⚠️ [ORDERS] ped_pedido ou ped_numero ausente no POST. Gerando no backend para compatibilidade...');
                const { initials } = req.query;
                const userInitials = req.body.user_initials || initials || "HS";

                // Fallback for sequence
                let seqResult;
                try {
                    seqResult = await pool.query("SELECT nextval('gen_pedidos_id') as next_num");
                } catch (e) {
                    try {
                        seqResult = await pool.query("SELECT nextval('pedidos_ped_numero_seq') as next_num");
                    } catch (e2) {
                        throw new Error('Sequência de pedidos não encontrada no banco (gen_pedidos_id / pedidos_ped_numero_seq)');
                    }
                }

                ped_numero = seqResult.rows[0].next_num;
                ped_pedido = (userInitials + ped_numero.toString().padStart(6, '0')).replace(/\s+/g, '');
            }

            // 2. VALIDAÇÃO DE CAMPOS OBRIGATÓRIOS
            if (!ped_cliente || !ped_industria) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente e Indústria são obrigatórios para salvar o pedido.'
                });
            }

            const query = `
                INSERT INTO pedidos (
                    ped_data, ped_situacao, ped_numero, ped_pedido, ped_cliente, 
                    ped_industria, ped_vendedor, ped_transp, ped_tabela, ped_totbruto, 
                    ped_totliq, ped_totalipi, ped_obs,
                    ped_pri, ped_seg, ped_ter, ped_qua, ped_qui, ped_sex, ped_set, ped_oit, ped_nov,
                    ped_pedindustria, ped_cliind, ped_condpag, ped_tipofrete, ped_comprador
                ) VALUES (
                    COALESCE($27, CURRENT_DATE), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
                ) RETURNING *
            `;

            const values = [
                ped_situacao || 'P', ped_numero, ped_pedido, ped_cliente, ped_industria,
                ped_vendedor || 0, ped_transp || 0, ped_tabela || '', ped_totbruto || 0,
                ped_totliq || 0, ped_totalipi || 0, ped_obs || '',
                ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
                ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
                final_ped_indu, final_ped_cli, ped_condpag || '', ped_tipofrete || 'C', ped_comprador || '',
                ped_data || null
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
                ped_cliente, ped_vendedor, ped_transp, ped_tabela, ped_totbruto,
                ped_totliq, ped_totalipi, ped_obs, ped_situacao,
                ped_pri, ped_seg, ped_ter, ped_qua, ped_qui, ped_sex, ped_set, ped_oit, ped_nov,
                ped_pedindustria, ped_pedindu, ped_pedcli, ped_condpag, ped_tipofrete, ped_comprador
            } = req.body;

            const final_ped_indu = ped_pedindustria || ped_pedindu || '';
            const final_ped_cli = ped_pedcli || '';

            const query = `
                UPDATE pedidos SET
                    ped_cliente = $1, ped_vendedor = $2, ped_transp = $3, ped_tabela = $4,
                    ped_totbruto = $5, ped_totliq = $6, ped_totalipi = $7, ped_obs = $8,
                    ped_situacao = $9, ped_pri = $11, ped_seg = $12, ped_ter = $13,
                    ped_qua = $14, ped_qui = $15, ped_sex = $16, ped_set = $17,
                    ped_oit = $18, ped_nov = $19, ped_pedindustria = $20, ped_cliind = $24,
                    ped_condpag = $21, ped_tipofrete = $22, ped_comprador = $23
                WHERE TRIM(ped_pedido) = TRIM($10)
                RETURNING *
            `;
            const values = [
                ped_cliente, ped_vendedor, ped_transp, ped_tabela, ped_totbruto,
                ped_totliq, ped_totalipi, ped_obs, ped_situacao || 'P', id,
                ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
                ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
                final_ped_indu, ped_condpag || '', ped_tipofrete || 'C', ped_comprador || '',
                final_ped_cli
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
