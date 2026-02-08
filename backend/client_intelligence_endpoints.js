const express = require('express');

module.exports = (pool) => {
    const router = express.Router();

    /**
     * GET /api/intelligence/dashboard/inactive-scan
     */
    router.get('/dashboard/inactive-scan', async (req, res) => {
        try {
            const query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_nomred,
                    c.cli_cidade,
                    c.cli_uf,
                    lp.ultima_data as ultima_compra,
                    COALESCE(lp.ultimo_valor, 0) as ultimo_valor,
                    lp.ultima_industria,
                    COALESCE(CURRENT_DATE - lp.ultima_data::date, 999) as dias_inatividade
                FROM clientes c
                LEFT JOIN LATERAL (
                    SELECT p.ped_data as ultima_data, p.ped_totliq as ultimo_valor, f.for_nomered as ultima_industria
                    FROM pedidos p
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE p.ped_cliente = c.cli_codigo AND p.ped_situacao IN ('P', 'F')
                    ORDER BY p.ped_data DESC
                    LIMIT 1
                ) lp ON true
                WHERE c.cli_tipopes = 'A'
                AND (lp.ultima_data < CURRENT_DATE - INTERVAL '6 months' OR lp.ultima_data IS NULL)
                ORDER BY dias_inatividade DESC
                LIMIT 100
            `;

            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows.map(row => ({
                    ...row,
                    ultimo_valor: parseFloat(row.ultimo_valor || 0),
                    dias_inatividade: parseInt(row.dias_inatividade || 999)
                }))
            });
        } catch (error) {
            console.error('Error fetching inactive clients:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/inactive/:id/recovery-plan
     */
    router.get('/inactive/:id/recovery-plan', async (req, res) => {
        try {
            const { id } = req.params;
            const { gerarPlanoRecuperacao } = require('./openai-clients');

            const [clientRes, statsRes, indRes] = await Promise.all([
                pool.query('SELECT cli_nomred FROM clientes WHERE cli_codigo = $1', [id]),
                pool.query(`
                    SELECT 
                        MAX(ped_data) as ultima_compra_geral,
                        (CURRENT_DATE - MAX(ped_data)::date) as dias_inativo
                    FROM pedidos
                    WHERE ped_cliente = $1 AND ped_situacao IN ('P', 'F')
                `, [id]),
                pool.query(`
                    SELECT f.for_nomered as industria
                    FROM pedidos p
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE p.ped_cliente = $1 AND p.ped_situacao IN ('P', 'F')
                    GROUP BY 1 ORDER BY SUM(p.ped_totliq) DESC LIMIT 3
                `, [id])
            ]);

            if (clientRes.rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Cliente não encontrado' });
            }

            const result = await gerarPlanoRecuperacao({
                cliente: clientRes.rows[0],
                stats: statsRes.rows[0] || { dias_inativo: 999 },
                industrias: indRes.rows
            });

            res.json({ success: true, ...result });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/:id/summary
     */
    router.get('/:id/summary', async (req, res) => {
        try {
            const { id } = req.params;
            const historyQuery = `
                SELECT 
                    f.for_nomered as industria,
                    f.for_codigo as industria_id,
                    SUM(ip.ite_totliquido) as total_valor,
                    SUM(ip.ite_quant) as total_pecas,
                    MAX(p.ped_data) as data_ultima_compra
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido AND p.ped_industria = ip.ite_industria
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE p.ped_cliente = $1 
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY f.for_nomered, f.for_codigo
                ORDER BY total_valor DESC
            `;

            const missingIndustriesQuery = `
                SELECT for_codigo as id, for_nomered as nome
                FROM fornecedores
                WHERE for_tipo2 = 'A' AND for_codigo NOT IN (
                    SELECT DISTINCT ped_industria 
                    FROM pedidos 
                    WHERE ped_cliente = $1 AND ped_situacao IN ('P', 'F')
                )
                ORDER BY for_nomered
                LIMIT 50
            `;

            const [historyRes, missingRes] = await Promise.all([
                pool.query(historyQuery, [id]),
                pool.query(missingIndustriesQuery, [id])
            ]);

            res.json({
                success: true,
                data: {
                    history: historyRes.rows.map(row => ({
                        ...row,
                        total_valor: parseFloat(row.total_valor),
                        total_pecas: parseFloat(row.total_pecas)
                    })),
                    missing_industries: missingRes.rows
                }
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/:id/abc-opportunities
     */
    router.get('/:id/abc-opportunities', async (req, res) => {
        try {
            const { id } = req.params;
            const { industria_id } = req.query;
            const query = `
                WITH IndustryABC AS (
                    SELECT 
                        ip.ite_idproduto,
                        MAX(ip.ite_nomeprod) as ite_nomeprod,
                        SUM(ip.ite_totliquido) as total_vendas,
                        SUM(ip.ite_quant) as total_qtd,
                        PERCENT_RANK() OVER (ORDER BY SUM(ip.ite_totliquido) DESC) as ranking
                    FROM itens_ped ip
                    JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
                    WHERE p.ped_industria = $1 AND p.ped_situacao IN ('P', 'F')
                      AND p.ped_data >= CURRENT_DATE - INTERVAL '1 year'
                    GROUP BY ip.ite_idproduto
                )
                SELECT *, CASE WHEN ranking <= 0.2 THEN 'A' WHEN ranking <= 0.5 THEN 'B' ELSE 'C' END as curva
                FROM IndustryABC
                WHERE ite_idproduto NOT IN (
                    SELECT DISTINCT ite_idproduto FROM itens_ped JOIN pedidos ON ite_pedido = ped_pedido
                    WHERE ped_cliente = $2 AND ped_industria = $1
                )
                ORDER BY curva ASC, total_vendas DESC LIMIT 30
            `;
            const result = await pool.query(query, [industria_id, id]);
            res.json({
                success: true,
                data: result.rows.map(row => ({
                    ...row,
                    total_vendas: parseFloat(row.total_vendas),
                    total_qtd: parseFloat(row.total_qtd)
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/:id/competitor-comparison
     */
    router.get('/:id/competitor-comparison', async (req, res) => {
        try {
            const { id } = req.params;
            const { competitorId } = req.query;
            const query = `
                WITH ClientSales AS (
                    SELECT p.ped_industria, f.for_nomered as industria_nome, p.ped_cliente, SUM(ip.ite_quant) as total_pecas
                    FROM pedidos p
                    JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE p.ped_cliente IN ($1, $2) AND p.ped_situacao IN ('P', 'F')
                      AND p.ped_data >= CURRENT_DATE - INTERVAL '1 year'
                    GROUP BY p.ped_industria, f.for_nomered, p.ped_cliente
                )
                SELECT industria_nome,
                    SUM(CASE WHEN ped_cliente = $1 THEN total_pecas ELSE 0 END) as qtd_cliente,
                    SUM(CASE WHEN ped_cliente = $2 THEN total_pecas ELSE 0 END) as qtd_concorrente
                FROM ClientSales GROUP BY industria_nome ORDER BY industria_nome
            `;
            const result = await pool.query(query, [id, competitorId]);
            res.json({
                success: true,
                data: result.rows.map(row => ({
                    ...row,
                    qtd_cliente: parseFloat(row.qtd_cliente),
                    qtd_concorrente: parseFloat(row.qtd_concorrente)
                }))
            });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/crm-campaigns
     * Unifica Campanhas Manuais (ex: Copa do Mundo) com Gaps de Sell-Out Automáticos
     */
    router.get('/crm-campaigns', async (req, res) => {
        try {
            const query = `
                -- 1. Campanhas Manuais Ativas
                SELECT 
                    c.cli_codigo,
                    c.cli_nomred as cliente_fantasia,
                    f.for_nomered as industria,
                    f.for_codigo,
                    COALESCE(cp.cmp_meta_valor_total, 0) as sellout_vlr,
                    0 as sellin_vlr,
                    (COALESCE(cp.cmp_meta_valor_total, 0)) as gap_vlr,
                    cp.cmp_descricao as campanha_nome,
                    'MANUAL' as tipo
                FROM campanhas_promocionais cp
                JOIN clientes c ON c.cli_codigo = cp.cmp_cliente_id
                JOIN fornecedores f ON f.for_codigo = cp.cmp_industria_id
                WHERE cp.cmp_status IS NOT NULL -- Verificação permissiva para diagnóstico

                UNION ALL

                -- 2. Inteligência Automática (Gaps de Sell-Out)
                SELECT 
                    c.cli_codigo,
                    c.cli_nomred as cliente_fantasia,
                    f.for_nomered as industria,
                    f.for_codigo,
                    COALESCE(so.total_sellout, 0) as sellout_vlr,
                    COALESCE(si.total_sellin, 0) as sellin_vlr,
                    (COALESCE(so.total_sellout, 0) - COALESCE(si.total_sellin, 0)) as gap_vlr,
                    'Oportunidade de Giro' as campanha_nome,
                    'AUTO' as tipo
                FROM (
                    SELECT cli_codigo, for_codigo, SUM(valor) as total_sellout
                    FROM crm_sellout
                    WHERE periodo >= CURRENT_DATE - INTERVAL '90 days'
                    GROUP BY cli_codigo, for_codigo
                ) so
                JOIN clientes c ON c.cli_codigo = so.cli_codigo
                JOIN fornecedores f ON f.for_codigo = so.for_codigo
                LEFT JOIN (
                    SELECT ped_cliente, ped_industria, SUM(ped_totliq) as total_sellin
                    FROM pedidos
                    WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days' AND ped_situacao IN ('P', 'F')
                    GROUP BY ped_cliente, ped_industria
                ) si ON c.cli_codigo = si.ped_cliente AND f.for_codigo = si.ped_industria
                WHERE f.for_tipo2 = 'A'
                  AND (COALESCE(so.total_sellout, 0) - COALESCE(si.total_sellin, 0)) > 500
                  AND NOT EXISTS (
                      SELECT 1 FROM campanhas_promocionais cp2 
                      WHERE cp2.cmp_cliente_id = c.cli_codigo 
                        AND cp2.cmp_industria_id = f.for_codigo
                        AND cp2.cmp_status = 'ATIVA'
                  )
                
                ORDER BY gap_vlr DESC
                LIMIT 50
            `;
            const result = await pool.query(query);
            res.json({
                success: true,
                data: result.rows.map(row => ({
                    ...row,
                    sellout_vlr: parseFloat(row.sellout_vlr),
                    sellin_vlr: parseFloat(row.sellin_vlr),
                    gap_vlr: parseFloat(row.gap_vlr)
                }))
            });
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    /**
     * GET /api/intelligence/retention-alert
     * Identifies customers without purchases for > 180 days.
     */
    router.get('/retention-alert', async (req, res) => {
        try {
            const query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_nomred,
                    COALESCE(CURRENT_DATE - lp.ultima_data::date, 999) as dias_inatividade
                FROM clientes c
                LEFT JOIN LATERAL (
                    SELECT p.ped_data as ultima_data
                    FROM pedidos p
                    WHERE p.ped_cliente = c.cli_codigo AND p.ped_situacao IN ('P', 'F')
                    ORDER BY p.ped_data DESC
                    LIMIT 1
                ) lp ON true
                WHERE c.cli_tipopes = 'A'
                AND (lp.ultima_data <= CURRENT_DATE - INTERVAL '180 days' OR lp.ultima_data IS NULL)
                ORDER BY dias_inatividade DESC
            `;

            const result = await pool.query(query);
            res.json({
                success: true,
                count: result.rows.length,
                data: result.rows.map(row => ({
                    ...row,
                    dias_inatividade: parseInt(row.dias_inatividade)
                }))
            });
        } catch (error) {
            console.error('Error fetching retention alert data:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};