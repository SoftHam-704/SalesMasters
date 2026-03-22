/**
 * billing_endpoints.js
 * Endpoints REST do módulo de Faturamento de Pedidos.
 * Tabela: FATURA_PED  |  Campos de itens: itens_ped.ite_qtdfat + ite_faturado
 */

const { v4: uuidv4 } = require('uuid');

module.exports = function (app, pool) {

    // ==================== HELPER: Sync situação do pedido ====================
    /**
     * Após cada mutação em fatura_ped, recalcula se o pedido está faturado.
     * - SUM(fat_valorfat) >= ped_totliq  →  ped_situacao = 'F'
     * - SUM(fat_valorfat) <  ped_totliq  →  reverte para 'P' (somente se estava 'F')
     */
    async function syncOrderStatus(pedido) {
        const sumRes = await pool.query(
            `SELECT COALESCE(SUM(fat_valorfat), 0) AS total_fat FROM fatura_ped WHERE TRIM(fat_pedido) = TRIM($1)`,
            [pedido]
        );
        const totalFat = parseFloat(sumRes.rows[0].total_fat) || 0;

        const pedRes = await pool.query(
            `SELECT ped_totliq, ped_situacao FROM pedidos WHERE TRIM(ped_pedido) = TRIM($1)`,
            [pedido]
        );
        if (pedRes.rows.length === 0) return;

        const { ped_totliq, ped_situacao } = pedRes.rows[0];
        const totalPedido = parseFloat(ped_totliq) || 0;

        if (totalFat >= totalPedido && totalPedido > 0) {
            // Faturamento concluído
            await pool.query(
                `UPDATE pedidos SET ped_situacao = 'F' WHERE TRIM(ped_pedido) = TRIM($1)`,
                [pedido]
            );
            console.log(`✅ [BILLING] Pedido ${pedido} marcado como FATURADO`);
        } else if (ped_situacao === 'F') {
            // Estorno: volta para Pedido
            await pool.query(
                `UPDATE pedidos SET ped_situacao = 'P' WHERE TRIM(ped_pedido) = TRIM($1)`,
                [pedido]
            );
            console.log(`⚠️ [BILLING] Pedido ${pedido} revertido para PENDENTE`);
        }
    }

    // ==================== HELPER: Sync itens_ped ====================
    /**
     * Atualiza ite_qtdfat e ite_faturado de um item após lançar/excluir faturamento.
     * Como os lançamentos não detalham item por item por NF (acumulamos em itens_ped),
     * o frontend envia {produto, qtdFat} e aqui fazemos o upsert acumulado.
     */
    async function updateItemFaturado(pedido, produto, delta) {
        // delta = quantidade a adicionar (positivo) ou subtrair (negativo)
        await pool.query(`
            UPDATE itens_ped
            SET
                ite_qtdfat   = GREATEST(0, COALESCE(ite_qtdfat, 0) + $3),
                ite_faturado = CASE
                    WHEN GREATEST(0, COALESCE(ite_qtdfat, 0) + $3) >= ite_qtde THEN 'S'
                    ELSE 'N'
                END
            WHERE TRIM(ite_pedido) = TRIM($1)
              AND TRIM(ite_produto) = TRIM($2)
        `, [pedido, produto, delta]);
    }

    // ==================== GET: Lançamentos de um pedido ====================
    app.get('/api/billing/:pedido', async (req, res) => {
        try {
            const { pedido } = req.params;

            // Busca lançamentos
            const fatRes = await pool.query(`
                SELECT
                    f.fat_lancto,
                    f.fat_pedido,
                    f.fat_datafat,
                    f.fat_valorfat,
                    f.fat_nf,
                    f.fat_obs,
                    f.fat_percent,
                    f.fat_comissao,
                    f.fat_industria,
                    f.fat_percomissind,
                    f.gid,
                    f.fat_items_json AS "_items"
                FROM fatura_ped f
                WHERE TRIM(f.fat_pedido) = TRIM($1)
                ORDER BY f.fat_lancto
            `, [pedido]);

            // Busca totais do pedido para calcular situação
            const pedRes = await pool.query(
                `SELECT ped_totliq, ped_situacao FROM pedidos WHERE TRIM(ped_pedido) = TRIM($1)`,
                [pedido]
            );

            const ped_totliq = pedRes.rows[0]?.ped_totliq || 0;
            const totalFaturado = fatRes.rows.reduce((acc, r) => acc + (parseFloat(r.fat_valorfat) || 0), 0);
            const saldo = Math.max(0, ped_totliq - totalFaturado);
            const situacao = totalFaturado >= ped_totliq && ped_totliq > 0 ? 'F' : 'P';

            res.json({
                success: true,
                lancamentos: fatRes.rows,
                summary: {
                    ped_totliq: parseFloat(ped_totliq),
                    total_faturado: totalFaturado,
                    saldo,
                    situacao,
                    situacao_label: situacao === 'F' ? 'Faturamento Concluído' : 'Faturamento Pendente'
                }
            });
        } catch (err) {
            console.error('❌ [BILLING] GET lançamentos:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // ==================== GET: Itens do pedido com qtd faturada ====================
    app.get('/api/billing/:pedido/items', async (req, res) => {
        try {
            const { pedido } = req.params;

            const result = await pool.query(`
                SELECT
                    i.ite_produto,
                    i.ite_nomeprod    AS ite_descricao,
                    i.ite_quant       AS ite_qtde,
                    COALESCE(i.ite_qtdfat, 0)    AS ite_qtdfat,
                    COALESCE(i.ite_faturado, 'N') AS ite_faturado,
                    GREATEST(0, i.ite_quant - COALESCE(i.ite_qtdfat, 0)) AS saldo_qtd,
                    i.ite_puni        AS ite_valunit,
                    i.ite_puniliq     AS ite_valliq,
                    i.ite_totliquido  AS ite_totliq,
                    i.ite_seq
                FROM itens_ped i
                WHERE TRIM(i.ite_pedido) = TRIM($1)
                ORDER BY i.ite_seq, i.ite_produto
            `, [pedido]);

            res.json({ success: true, items: result.rows });
        } catch (err) {
            console.error('❌ [BILLING] GET items:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // ==================== GET: Percentuais de comissão ====================
    app.get('/api/billing/:pedido/commission-rates', async (req, res) => {
        try {
            const { pedido } = req.params;

            // Busca indústria e vendedor do pedido
            const pedRes = await pool.query(
                `SELECT ped_industria, ped_vendedor FROM pedidos WHERE TRIM(ped_pedido) = TRIM($1)`,
                [pedido]
            );
            if (pedRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pedido não encontrado' });
            }

            const { ped_industria, ped_vendedor } = pedRes.rows[0];

            // Comissão do escritório (fornecedores.for_percom)
            const forRes = await pool.query(
                `SELECT for_percom FROM fornecedores WHERE for_codigo = $1`,
                [ped_industria]
            );

            // Comissão do vendedor para esta indústria (vendedor_ind.vin_percom)
            const venRes = await pool.query(
                `SELECT vin_percom FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2`,
                [ped_vendedor, ped_industria]
            );

            res.json({
                success: true,
                rates: {
                    escritorio: parseFloat(forRes.rows[0]?.for_percom) || 0,
                    vendedor: parseFloat(venRes.rows[0]?.vin_percom) || 0,
                    ped_industria,
                    ped_vendedor
                }
            });
        } catch (err) {
            console.error('❌ [BILLING] GET commission-rates:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // ==================== POST: Criar lançamento ====================
    app.post('/api/billing', async (req, res) => {
        try {
            const {
                fat_pedido,
                fat_industria,
                fat_datafat,
                fat_valorfat,
                fat_nf,
                fat_obs,
                fat_percent,
                fat_percomissind,
                items // array de { ite_produto, qtd_delta } para atualizar itens_ped
            } = req.body;

            if (!fat_pedido || !fat_industria) {
                return res.status(400).json({ success: false, message: 'Pedido e Indústria são obrigatórios' });
            }

            // Calcula comissão
            const valor = parseFloat(fat_valorfat) || 0;
            const percent = parseFloat(fat_percent) || 0;
            const fat_comissao = parseFloat((valor * percent / 100).toFixed(2));

            const gid = uuidv4();

            const result = await pool.query(`
                INSERT INTO fatura_ped (
                    fat_pedido, fat_industria, fat_datafat, fat_valorfat,
                    fat_nf, fat_obs, fat_percent, fat_comissao,
                    fat_percomissind, gid, fat_items_json
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                RETURNING *
            `, [
                fat_pedido.trim(),
                fat_industria,
                fat_datafat || new Date(),
                valor,
                fat_nf || '',
                fat_obs || '',
                percent,
                fat_comissao,
                fat_percomissind || 'E',
                gid,
                JSON.stringify(items || [])
            ]);

            // Atualiza quantidades nos itens do pedido
            if (items && Array.isArray(items)) {
                for (const item of items) {
                    if (item.ite_produto && item.qtd_delta) {
                        await updateItemFaturado(fat_pedido, item.ite_produto, parseFloat(item.qtd_delta));
                    }
                }
            }

            // Sincroniza situação do pedido
            await syncOrderStatus(fat_pedido);

            console.log(`✅ [BILLING] Lançamento criado: Pedido ${fat_pedido} | NF ${fat_nf} | R$ ${valor}`);
            res.status(201).json({ success: true, data: result.rows[0], message: 'Faturamento lançado com sucesso!' });

        } catch (err) {
            console.error('❌ [BILLING] POST lançamento:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // ==================== PUT: Atualizar lançamento ====================
    app.put('/api/billing/:pedido/:lancto', async (req, res) => {
        try {
            const { pedido, lancto } = req.params;
            const {
                fat_datafat,
                fat_valorfat,
                fat_nf,
                fat_obs,
                fat_percent,
                fat_percomissind,
                items_old, // array de { ite_produto, qtd_delta } — qtds antigas para estornar
                items_new  // array de { ite_produto, qtd_delta } — qtds novas para aplicar
            } = req.body;

            const valor = parseFloat(fat_valorfat) || 0;
            const percent = parseFloat(fat_percent) || 0;
            const fat_comissao = parseFloat((valor * percent / 100).toFixed(2));

            const result = await pool.query(`
                UPDATE fatura_ped SET
                    fat_datafat      = $1,
                    fat_valorfat     = $2,
                    fat_nf           = $3,
                    fat_obs          = $4,
                    fat_percent      = $5,
                    fat_comissao     = $6,
                    fat_percomissind = $7,
                    fat_items_json   = $8
                WHERE TRIM(fat_pedido) = TRIM($9)
                  AND fat_lancto = $10
                RETURNING *
            `, [
                fat_datafat || new Date(),
                valor,
                fat_nf || '',
                fat_obs || '',
                percent,
                fat_comissao,
                fat_percomissind || 'E',
                JSON.stringify(items_new || []),
                pedido.trim(),
                parseInt(lancto)
            ]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Lançamento não encontrado' });
            }

            // Estorna qtds antigas e aplica novas
            if (items_old && Array.isArray(items_old)) {
                for (const item of items_old) {
                    if (item.ite_produto && item.qtd_delta) {
                        await updateItemFaturado(pedido, item.ite_produto, -parseFloat(item.qtd_delta));
                    }
                }
            }
            if (items_new && Array.isArray(items_new)) {
                for (const item of items_new) {
                    if (item.ite_produto && item.qtd_delta) {
                        await updateItemFaturado(pedido, item.ite_produto, parseFloat(item.qtd_delta));
                    }
                }
            }

            await syncOrderStatus(pedido);

            res.json({ success: true, data: result.rows[0], message: 'Lançamento atualizado com sucesso!' });

        } catch (err) {
            console.error('❌ [BILLING] PUT lançamento:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });

    // ==================== DELETE: Excluir lançamento ====================
    app.delete('/api/billing/:pedido/:lancto', async (req, res) => {
        try {
            const { pedido, lancto } = req.params;
            // Se não vierem itens no body, tentamos pegar o snapshot salvo no banco para estornar
            let itemsToRevert = req.body?.items;
            if (!itemsToRevert || !Array.isArray(itemsToRevert) || itemsToRevert.length === 0) {
                const snapshotRes = await pool.query(
                    `SELECT fat_items_json FROM fatura_ped WHERE TRIM(fat_pedido) = TRIM($1) AND fat_lancto = $2`,
                    [pedido.trim(), parseInt(lancto)]
                );
                itemsToRevert = snapshotRes.rows[0]?.fat_items_json || [];
            }

            // Estorna quantidades nos itens antes de deletar
            if (itemsToRevert && Array.isArray(itemsToRevert)) {
                for (const item of itemsToRevert) {
                    if (item.ite_produto && item.qtd_delta) {
                        await updateItemFaturado(pedido, item.ite_produto, -parseFloat(item.qtd_delta));
                    }
                }
            }

            const result = await pool.query(`
                DELETE FROM fatura_ped
                WHERE TRIM(fat_pedido) = TRIM($1)
                  AND fat_lancto = $2
                RETURNING *
            `, [pedido.trim(), parseInt(lancto)]);

            if (result.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Lançamento não encontrado' });
            }

            await syncOrderStatus(pedido);

            console.log(`🗑️ [BILLING] Lançamento ${lancto} do pedido ${pedido} excluído`);
            res.json({ success: true, message: 'Lançamento excluído com sucesso!' });

        } catch (err) {
            console.error('❌ [BILLING] DELETE lançamento:', err.message);
            res.status(500).json({ success: false, message: err.message });
        }
    });
};
