module.exports = function (app, pool) {

    // GET - Sugestão Inteligente de Itens baseada no histórico de compras
    // Rota: /api/orders/smart-suggestions?clienteId=X&industriaId=Y&tabelaId=Z
    app.get('/api/orders/smart-suggestions', async (req, res) => {
        try {
            const { clienteId, industriaId, tabelaId } = req.query;

            if (!clienteId || !industriaId) {
                return res.status(400).json({
                    success: false,
                    message: 'clienteId e industriaId são obrigatórios.'
                });
            }

            console.log(`🤖 [SMART_SUGGESTION] Gerando sugestões para Cliente: ${clienteId}, Indústria: ${industriaId}`);

            const query = `
                WITH all_history AS (
                    SELECT 
                        i.ite_produto, 
                        i.ite_nomeprod,
                        i.ite_quant,
                        p.ped_data,
                        p.ped_pedido
                    FROM itens_ped i
                    INNER JOIN pedidos p ON TRIM(p.ped_pedido) = TRIM(i.ite_pedido)
                    WHERE p.ped_cliente = $1
                      AND p.ped_industria = $2
                      AND p.ped_situacao IN ('P', 'F', 'A', 'L')
                ),
                stats AS (
                    SELECT 
                        ite_produto,
                        MAX(ite_nomeprod) as nome_produto,
                        COUNT(*) as frequencia,
                        MAX(ped_data) as ultima_compra,
                        (CURRENT_DATE - MAX(ped_data)) as dias_sem_compra,
                        (ARRAY_AGG(ite_quant ORDER BY ped_data DESC, ped_pedido DESC))[1] as ultima_quantidade
                    FROM all_history
                    GROUP BY ite_produto
                )
                SELECT 
                    s.*,
                    p.pro_id,
                    p.pro_nome as pro_desc,
                    p.pro_embalagem as pro_unidade,
                    p.pro_embalagem,
                    tp.itab_precobruto as preco_tabela
                FROM stats s
                INNER JOIN cad_prod p ON TRIM(p.pro_codprod) = TRIM(s.ite_produto) AND p.pro_industria = $2
                LEFT JOIN cad_tabelaspre tp ON tp.itab_idprod = p.pro_id AND tp.itab_tabela = $3 AND tp.itab_idindustria = $2
                WHERE s.dias_sem_compra >= 90
                ORDER BY s.ultima_compra DESC
                LIMIT 200
            `;

            const cId = parseInt(clienteId);
            const iId = parseInt(industriaId);

            // Se tabelaId for algo como "undefined" ou "null" vindo do front, limpa
            const tId = (tabelaId === 'undefined' || tabelaId === 'null') ? '' : (tabelaId || '');

            const result = await pool.query(query, [cId, iId, tId]);

            res.json({
                success: true,
                data: result.rows
            });

        } catch (error) {
            console.error('❌ [SMART_SUGGESTION] Error generating suggestions:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar sugestões: ${error.message}`,
                error: error.message, // Expondo para o front ver no console
                stack: error.stack
            });
        }
    });

};
