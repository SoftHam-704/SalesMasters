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
                ped_data,
                // New Project Fields
                ped_ramoatv,
                ped_obra_nome,
                ped_obra_endereco,
                ped_obra_contato,
                ped_fase_projeto,
                ped_area_m2,
                ped_pe_direito,
                ped_tipo_piso,
                ped_obs_tecnicas
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
                    ped_pedindustria, ped_cliind, ped_condpag, ped_tipofrete, ped_comprador,
                    ped_ramoatv, ped_obra_nome, ped_obra_endereco, ped_obra_contato,
                    ped_fase_projeto, ped_area_m2, ped_pe_direito, ped_tipo_piso, ped_obs_tecnicas
                ) VALUES (
                    COALESCE($27, CURRENT_DATE), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                    $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26,
                    $28, $29, $30, $31, $32, $33, $34, $35, $36
                ) RETURNING *
            `;

            const values = [
                ped_situacao || 'P', ped_numero, ped_pedido, ped_cliente, ped_industria,
                ped_vendedor || 0, ped_transp || 0, ped_tabela || '', ped_totbruto || 0,
                ped_totliq || 0, ped_totalipi || 0, ped_obs || '',
                ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
                ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
                final_ped_indu, final_ped_cli, ped_condpag || '', ped_tipofrete || 'C', ped_comprador || '',
                ped_data || null,
                ped_ramoatv || '', ped_obra_nome || '', ped_obra_endereco || '', ped_obra_contato || '',
                ped_fase_projeto || 'Orçamento', ped_area_m2 || 0, ped_pe_direito || 0, ped_tipo_piso || '', ped_obs_tecnicas || ''
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
                ped_pedindustria, ped_pedindu, ped_pedcli, ped_condpag, ped_tipofrete, ped_comprador,
                // New Project Fields
                ped_ramoatv, ped_obra_nome, ped_obra_endereco, ped_obra_contato,
                ped_fase_projeto, ped_area_m2, ped_pe_direito, ped_tipo_piso, ped_obs_tecnicas
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
                    ped_condpag = $21, ped_tipofrete = $22, ped_comprador = $23,
                    ped_ramoatv = $25, ped_obra_nome = $26, ped_obra_endereco = $27, ped_obra_contato = $28,
                    ped_fase_projeto = $29, ped_area_m2 = $30, ped_pe_direito = $31, ped_tipo_piso = $32, ped_obs_tecnicas = $33
                WHERE TRIM(ped_pedido) = TRIM($10)
                RETURNING *
            `;
            const values = [
                ped_cliente, ped_vendedor || 0, ped_transp || 0, ped_tabela || '', ped_totbruto || 0,
                ped_totliq || 0, ped_totalipi || 0, ped_obs || '', ped_situacao || 'P', id,
                ped_pri || 0, ped_seg || 0, ped_ter || 0, ped_qua || 0, ped_qui || 0,
                ped_sex || 0, ped_set || 0, ped_oit || 0, ped_nov || 0,
                final_ped_indu, ped_condpag || '', ped_tipofrete || 'C', ped_comprador || '',
                final_ped_cli,
                ped_ramoatv || '', ped_obra_nome || '', ped_obra_endereco || '', ped_obra_contato || '',
                ped_fase_projeto || 'Orçamento', ped_area_m2 || 0, ped_pe_direito || 0, ped_tipo_piso || '', ped_obs_tecnicas || ''
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
    // POST - Clonar pedido (cabeçalho + itens)
    app.post('/api/orders/:pedPedido/clone', async (req, res) => {
        const client = await pool.connect();
        try {
            const { pedPedido } = req.params;
            const { initials } = req.body;
            const userInitials = initials || 'HS';

            await client.query('BEGIN');

            // 1. Buscar pedido original
            const origResult = await client.query(
                `SELECT * FROM pedidos WHERE TRIM(ped_pedido) = TRIM($1)`, [pedPedido]
            );
            if (origResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ success: false, message: 'Pedido original não encontrado' });
            }
            const orig = origResult.rows[0];

            // 2. Gerar novo número sequencial
            let seqResult;
            try {
                seqResult = await client.query("SELECT nextval('gen_pedidos_id') as next_num");
            } catch (e) {
                try {
                    seqResult = await client.query("SELECT nextval('pedidos_ped_numero_seq') as next_num");
                } catch (e2) {
                    throw new Error('Sequência de pedidos não encontrada');
                }
            }
            const newPedNumero = seqResult.rows[0].next_num;
            const newPedPedido = (userInitials + newPedNumero.toString().padStart(6, '0')).replace(/\s+/g, '');

            // 3. Inserir clone do cabeçalho (data = hoje, situação = P, limpa faturamento)
            const cloneQuery = `
                INSERT INTO pedidos (
                    ped_numero, ped_pedido, ped_data, ped_situacao,
                    ped_cliente, ped_industria, ped_vendedor, ped_transp,
                    ped_tabela, ped_totbruto, ped_totliq, ped_totalipi, ped_obs,
                    ped_pri, ped_seg, ped_ter, ped_qua, ped_qui, ped_sex, ped_set, ped_oit, ped_nov,
                    ped_pedindustria, ped_cliind, ped_condpag, ped_tipofrete, ped_comprador,
                    ped_ramoatv, ped_obra_nome, ped_obra_endereco, ped_obra_contato,
                    ped_fase_projeto, ped_area_m2, ped_pe_direito, ped_tipo_piso, ped_obs_tecnicas
                ) VALUES (
                    $1, $2, CURRENT_DATE, 'P',
                    $3, $4, $5, $6,
                    $7, $8, $9, $10, $11,
                    $12, $13, $14, $15, $16, $17, $18, $19, $20,
                    $21, $22, $23, $24, $25,
                    $26, $27, $28, $29,
                    $30, $31, $32, $33, $34
                ) RETURNING *
            `;
            const cloneValues = [
                newPedNumero, newPedPedido,
                orig.ped_cliente, orig.ped_industria, orig.ped_vendedor, orig.ped_transp,
                orig.ped_tabela, orig.ped_totbruto, orig.ped_totliq, orig.ped_totalipi, orig.ped_obs || '',
                orig.ped_pri || 0, orig.ped_seg || 0, orig.ped_ter || 0, orig.ped_qua || 0, orig.ped_qui || 0,
                orig.ped_sex || 0, orig.ped_set || 0, orig.ped_oit || 0, orig.ped_nov || 0,
                orig.ped_pedindustria || '', orig.ped_cliind || '', orig.ped_condpag || '',
                orig.ped_tipofrete || 'C', orig.ped_comprador || '',
                orig.ped_ramoatv || '', orig.ped_obra_nome || '', orig.ped_obra_endereco || '', orig.ped_obra_contato || '',
                orig.ped_fase_projeto || '', orig.ped_area_m2 || 0, orig.ped_pe_direito || 0,
                orig.ped_tipo_piso || '', orig.ped_obs_tecnicas || ''
            ];
            const clonedOrder = await client.query(cloneQuery, cloneValues);

            // 4. Copiar todos os itens do pedido original
            const itemsResult = await client.query(
                `SELECT * FROM itens_ped WHERE TRIM(ite_pedido) = TRIM($1) ORDER BY ite_seq`, [pedPedido]
            );

            let itemsCloned = 0;
            for (const item of itemsResult.rows) {
                await client.query(`
                    INSERT INTO itens_ped (
                        ite_pedido, ite_seq, ite_industria, ite_idproduto, ite_produto, ite_embuch, ite_nomeprod,
                        ite_quant, ite_puni, ite_totbruto, ite_puniliq, ite_totliquido, ite_ipi,
                        ite_des1, ite_des2, ite_des3, ite_des4, ite_des5,
                        ite_des6, ite_des7, ite_des8, ite_des9, ite_des10, ite_des11, ite_valcomipi,
                        ite_st, ite_valcomst, ite_promocao, ite_descontos,
                        ite_dimensoes, ite_acabamento, ite_carga_kg, ite_ambiente, ite_faturado, ite_qtdfat
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7,
                        $8, $9, $10, $11, $12, $13,
                        $14, $15, $16, $17, $18,
                        $19, $20, $21, $22, $23, $24, $25,
                        $26, $27, $28, $29,
                        $30, $31, $32, $33, 'N', 0
                    )
                `, [
                    newPedPedido, item.ite_seq, item.ite_industria, item.ite_idproduto, item.ite_produto,
                    item.ite_embuch, item.ite_nomeprod,
                    item.ite_quant, item.ite_puni, item.ite_totbruto, item.ite_puniliq, item.ite_totliquido, item.ite_ipi,
                    item.ite_des1 || 0, item.ite_des2 || 0, item.ite_des3 || 0, item.ite_des4 || 0, item.ite_des5 || 0,
                    item.ite_des6 || 0, item.ite_des7 || 0, item.ite_des8 || 0, item.ite_des9 || 0,
                    item.ite_des10 || 0, item.ite_des11 || 0, item.ite_valcomipi || 0,
                    item.ite_st || 0, item.ite_valcomst || 0, item.ite_promocao || false, item.ite_descontos || '',
                    item.ite_dimensoes || '', item.ite_acabamento || '', item.ite_carga_kg || 0, item.ite_ambiente || ''
                ]);
                itemsCloned++;
            }

            await client.query('COMMIT');

            console.log(`✅ [ORDERS] Pedido ${pedPedido} clonado → ${newPedPedido} (${itemsCloned} itens)`);

            res.json({
                success: true,
                data: clonedOrder.rows[0],
                message: `Pedido clonado com sucesso! Novo número: ${newPedPedido}`,
                newPedPedido,
                itemsCloned
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ [ORDERS] Error cloning order:', error);
            res.status(500).json({ success: false, message: `Erro ao clonar pedido: ${error.message}` });
        } finally {
            client.release();
        }
    });

    // Narratives are now handled by narratives_endpoints.js
};
