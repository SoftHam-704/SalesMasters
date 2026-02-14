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

    // ==================== 9. GESTÃO DE METAS (CRUD) ====================

    // Listar metas base para configuração
    router.get('/config', async (req, res) => {
        try {
            const { ano } = req.query;
            const query = `
                SELECT 
                    f.for_codigo, 
                    f.for_nomered as industria_nome,
                    m.met_codigo,
                    m.met_ano,
                    COALESCE(m.met_jan, 0) as met_jan,
                    COALESCE(m.met_fev, 0) as met_fev,
                    COALESCE(m.met_mar, 0) as met_mar,
                    COALESCE(m.met_abr, 0) as met_abr,
                    COALESCE(m.met_mai, 0) as met_mai,
                    COALESCE(m.met_jun, 0) as met_jun,
                    COALESCE(m.met_jul, 0) as met_jul,
                    COALESCE(m.met_ago, 0) as met_ago,
                    COALESCE(m.met_set, 0) as met_set,
                    COALESCE(m.met_out, 0) as met_out,
                    COALESCE(m.met_nov, 0) as met_nov,
                    COALESCE(m.met_dez, 0) as met_dez
                FROM fornecedores f
                LEFT JOIN ind_metas m ON m.met_industria = f.for_codigo AND m.met_ano = $1
                WHERE f.for_tipo2 <> 'I'
                ORDER BY f.for_nomered
            `;
            const result = await pool.query(query, [parseInt(ano || new Date().getFullYear())]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [METAS] Erro em /config:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // Salvar/Atualizar Meta (Upsert)
    router.post('/save', async (req, res) => {
        try {
            const {
                met_industria, met_ano,
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            } = req.body;

            if (!met_industria || !met_ano) {
                return res.status(400).json({ success: false, message: 'Indústria e Ano são obrigatórios' });
            }

            // Verificar se já existe
            const check = await pool.query(
                'SELECT met_codigo FROM ind_metas WHERE met_industria = $1 AND met_ano = $2',
                [met_industria, met_ano]
            );

            let query = '';
            let params = [
                met_industria, met_ano,
                met_jan || 0, met_fev || 0, met_mar || 0, met_abr || 0, met_mai || 0, met_jun || 0,
                met_jul || 0, met_ago || 0, met_set || 0, met_out || 0, met_nov || 0, met_dez || 0
            ];

            if (check.rows.length > 0) {
                // UPDATE
                query = `
                    UPDATE ind_metas SET
                        met_jan = $3, met_fev = $4, met_mar = $5, met_abr = $6, met_mai = $7, met_jun = $8,
                        met_jul = $9, met_ago = $10, met_set = $11, met_out = $12, met_nov = $13, met_dez = $14
                    WHERE met_industria = $1 AND met_ano = $2
                    RETURNING *
                `;
            } else {
                // INSERT
                query = `
                    INSERT INTO ind_metas (
                        met_industria, met_ano, 
                        met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                        met_jul, met_ago, met_set, met_out, met_nov, met_dez
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                    RETURNING *
                `;
            }

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows[0], message: 'Meta salva com sucesso!' });
        } catch (error) {
            console.error('❌ [METAS] Erro em /save:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
