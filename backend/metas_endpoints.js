/**
 * Metas Endpoints - Dashboard de Metas
 * Conecta às funções PostgreSQL para análise de metas
 */

module.exports = (pool) => {
    const express = require('express');
    const router = express.Router();

    // ==================== 1. RESUMO GERAL ====================
    // Cards de totais: M-1, Atual, Variação
    router.get('/resumo', async (req, res) => {
        try {
            const { ano, mes, industria } = req.query;

            if (!ano || !mes) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros ano e mes são obrigatórios'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_resumo_geral($1, $2, $3)`,
                [parseInt(ano), parseInt(mes), industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows[0] || { total_mes_anterior: 0, total_mes_atual: 0, variacao_percentual: 0 }
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /resumo:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 2. METAS POR MÊS ====================
    // Tabela principal de 12 meses
    router.get('/por-mes', async (req, res) => {
        try {
            const { ano, industria } = req.query;

            if (!ano) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro ano é obrigatório'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_por_mes($1, $2)`,
                [parseInt(ano), industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /por-mes:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 3. ATINGIMENTO POR INDÚSTRIA ====================
    // Gráfico de barras (% atingimento)
    router.get('/atingimento', async (req, res) => {
        try {
            const { ano, mes_ate, industria } = req.query;

            if (!ano) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro ano é obrigatório'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_atingimento_industria($1, $2, $3)`,
                [parseInt(ano), mes_ate ? parseInt(mes_ate) : 12, industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /atingimento:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 4. VARIAÇÃO DE VENDAS ====================
    // Tabela comparativa M-1 vs Atual
    router.get('/variacao', async (req, res) => {
        try {
            const { ano, mes, industria } = req.query;

            if (!ano || !mes) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros ano e mes são obrigatórios'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_variacao_vendas($1, $2, $3)`,
                [parseInt(ano), parseInt(mes), industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /variacao:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 5. ANÁLISE DIÁRIA ====================
    // Tabela dia a dia do mês
    router.get('/analise-diaria', async (req, res) => {
        try {
            const { ano, mes, industria } = req.query;

            if (!ano || !mes) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros ano e mes são obrigatórios'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_analise_diaria($1, $2, $3)`,
                [parseInt(ano), parseInt(mes), industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /analise-diaria:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 6. ANÁLISE SEMANAL (PIVOT) ====================
    // Tabela com semanas em colunas
    router.get('/analise-semanal', async (req, res) => {
        try {
            const { ano, mes } = req.query;

            if (!ano || !mes) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetros ano e mes são obrigatórios'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_analise_semanal_pivot($1, $2)`,
                [parseInt(ano), parseInt(mes)]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /analise-semanal:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 7. MATRIZ DE AÇÃO ====================
    // Scatter plot (quadrantes)
    router.get('/matriz-acao', async (req, res) => {
        try {
            const { ano, mes_ate, industria } = req.query;

            if (!ano) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro ano é obrigatório'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_matriz_acao($1, $2, $3)`,
                [parseInt(ano), mes_ate ? parseInt(mes_ate) : 12, industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /matriz-acao:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // ==================== 8. STATUS DAS INDÚSTRIAS ====================
    // Tabela de status (Atingida, Em Risco, Sem Meta)
    router.get('/status', async (req, res) => {
        try {
            const { ano, mes_ate, industria } = req.query;

            if (!ano) {
                return res.status(400).json({
                    success: false,
                    message: 'Parâmetro ano é obrigatório'
                });
            }

            const result = await pool.query(
                `SELECT * FROM fn_metas_status_industrias($1, $2, $3)`,
                [parseInt(ano), mes_ate ? parseInt(mes_ate) : 12, industria ? parseInt(industria) : null]
            );

            res.json({
                success: true,
                data: result.rows
            });
        } catch (error) {
            console.error('❌ [METAS] Erro em /status:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
