// Order Items Endpoints Module

module.exports = function (app, pool) {

    // GET - Listar itens de um pedido
    app.get('/api/orders/:pedPedido/items', async (req, res) => {
        try {
            const { pedPedido } = req.params;
            const query = `
                SELECT * FROM itens_ped 
                WHERE ite_pedido = $1 
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
                    ite_pedido, ite_seq, ite_produto, ite_complemento, ite_nomeprod,
                    ite_quant, ite_totbruto, ite_puniliq, ite_totliquido, ite_ipi,
                    ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                    ite_des6, ite_des7, ite_des8, ite_des9, ite_valcomipi
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                ON CONFLICT (ite_pedido, ite_seq) DO UPDATE SET
                    ite_produto = EXCLUDED.ite_produto,
                    ite_complemento = EXCLUDED.ite_complemento,
                    ite_nomeprod = EXCLUDED.ite_nomeprod,
                    ite_quant = EXCLUDED.ite_quant,
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
                    ite_valcomipi = EXCLUDED.ite_valcomipi
                RETURNING *
            `;

            const values = [
                pedPedido,
                ite_seq,
                item.ite_produto,
                item.ite_complemento || '',
                item.ite_nomeprod || '',
                item.ite_quant || 1,
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
                item.ite_valcomipi || 0
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
                    const query = `
                        INSERT INTO itens_ped (
                            ite_pedido, ite_seq, ite_produto, ite_complemento, ite_nomeprod,
                            ite_quant, ite_totbruto, ite_puniliq, ite_totliquido, ite_ipi,
                            ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                            ite_des6, ite_des7, ite_des8, ite_des9, ite_valcomipi
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                    `;
                    const values = [
                        pedPedido,
                        item.ite_seq || (i + 1), // Usa o seq do item ou a ordem no array
                        item.ite_produto,
                        item.ite_complemento || '',
                        item.ite_nomeprod || '',
                        item.ite_quant || 0,
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
                        item.ite_valcomipi || 0
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

};
