const express = require('express');
const router = express.Router();

module.exports = (pool) => {

    // 1. Resumo do Pipeline (Cards do Dashboard)
    router.get('/summary', async (req, res) => {
        try {
            const { start, end, vendedor } = req.query;
            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`ped_data BETWEEN $1 AND $2`, `tipo = 'projeto'`];

            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`ped_vendedor = $${paramCounter++}`);
                params.push(vendedor);
            }

            const query = `
                SELECT 
                    COUNT(*) as total_projetos,
                    SUM(ped_totliq) as valor_total,
                    COUNT(*) FILTER (WHERE fase_projeto = 'aprovado' OR fase_projeto = 'concluido') as total_ganhos,
                    SUM(ped_totliq) FILTER (WHERE fase_projeto = 'aprovado' OR fase_projeto = 'concluido') as valor_ganhos,
                    COUNT(*) FILTER (WHERE fase_projeto = 'perdido' OR fase_projeto = 'cancelado') as total_perdidos
                FROM pedidos
                WHERE ${conditions.join(' AND ')}
            `;

            const result = await pool.query(query, params);
            const data = result.rows[0];

            // Cálculo de conversão simples
            const total = parseInt(data.total_projetos) || 0;
            const ganhos = parseInt(data.total_ganhos) || 0;
            data.taxa_conversao = total > 0 ? ((ganhos / total) * 100).toFixed(1) : 0;

            res.json({ success: true, data });
        } catch (error) {
            console.error('❌ [CRM-REP REPORT] Summary Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 2. Dados para o Gráfico de Funil / Kanban (Valor por Fase)
    router.get('/pipeline-fases', async (req, res) => {
        try {
            const { start, end, vendedor } = req.query;
            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`ped_data BETWEEN $1 AND $2`, `tipo = 'projeto'`];

            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`ped_vendedor = $${paramCounter++}`);
                params.push(vendedor);
            }

            const query = `
                SELECT 
                    fase_projeto as fase,
                    COUNT(*) as quantidade,
                    SUM(ped_totliq) as valor
                FROM pedidos
                WHERE ${conditions.join(' AND ')}
                GROUP BY fase_projeto
                ORDER BY CASE fase_projeto
                    WHEN 'prospeccao' THEN 1
                    WHEN 'visita_tecnica' THEN 2
                    WHEN 'orcamento' THEN 3
                    WHEN 'negociacao' THEN 4
                    WHEN 'proposta_enviada' THEN 5
                    WHEN 'aprovado' THEN 6
                    WHEN 'em_execucao' THEN 7
                    WHEN 'concluido' THEN 8
                    WHEN 'cancelado' THEN 9
                    WHEN 'perdido' THEN 10
                    ELSE 99
                END;
            `;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM-REP REPORT] Pipeline Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 3. Relatórios de Clientes Selecionáveis
    router.get('/selectable-customers', async (req, res) => {
        try {
            const { mode, status, region, city, seller, area, industry, state, start, end } = req.query;
            let params = [];
            let paramCounter = 1;
            let conditions = ['1=1'];

            // 1. Status Filter
            if (status === 'active') {
                conditions.push(`c.cli_tipopes = 'A'`);
            } else if (status === 'inactive') {
                conditions.push(`c.cli_tipopes = 'I'`);
            }

            // 2. Mode-specific filters
            switch (mode) {
                case 'region':
                    if (region && region !== 'all') {
                        conditions.push(`c.cli_regiao2 = $${paramCounter++}`);
                        params.push(parseInt(region));
                    }
                    break;
                case 'city':
                    if (city && city !== 'all') {
                        // Support both ID and Name if needed, but usually ID
                        if (!isNaN(city)) {
                            conditions.push(`c.cli_idcidade = $${paramCounter++}`);
                            params.push(parseInt(city));
                        } else {
                            conditions.push(`cid.cid_nome ILIKE $${paramCounter++}`);
                            params.push(`%${city}%`);
                        }
                    }
                    break;
                case 'seller':
                    if (seller && seller !== 'all') {
                        conditions.push(`c.cli_vendedor = $${paramCounter++}`);
                        params.push(parseInt(seller));
                    }
                    break;
                case 'state':
                    if (state && state !== 'all') {
                        conditions.push(`c.cli_uf = $${paramCounter++}`);
                        params.push(state.toUpperCase());
                    }
                    break;
                case 'area':
                    if (area && area !== 'all') {
                        conditions.push(`c.cli_atuacaoprincipal = $${paramCounter++}`);
                        params.push(parseInt(area));
                    }
                    break;
                case 'industry':
                    if (industry && industry !== 'all') {
                        // Customers who have orders for this industry
                        conditions.push(`EXISTS (SELECT 1 FROM pedidos p2 WHERE p2.ped_cliente = c.cli_codigo AND p2.ped_industria = $${paramCounter++})`);
                        params.push(parseInt(industry));
                    }
                    break;
                case 'period':
                    if (start && end) {
                        conditions.push(`EXISTS (SELECT 1 FROM pedidos p3 WHERE p3.ped_cliente = c.cli_codigo AND p3.ped_data BETWEEN $${paramCounter} AND $${paramCounter + 1})`);
                        params.push(start, end);
                        paramCounter += 2;
                    }
                    break;
                case 'all':
                default:
                    // No extra conditions for 'all'
                    break;
            }

            const query = `
                SELECT 
                    c.cli_codigo,
                    c.cli_nome,
                    c.cli_nomred,
                    c.cli_cnpj,
                    coalesce(cid.cid_nome, c.cli_cidade) as cli_cidade,
                    coalesce(cid.cid_uf, c.cli_uf) as cli_uf,
                    c.cli_tipopes,
                    c.cli_vendedor
                FROM clientes c
                LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
                WHERE ${conditions.join(' AND ')}
                ORDER BY c.cli_nomred, c.cli_nome
                LIMIT 500
            `;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM-REP REPORT] Selectable Customers Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 4. Relatório de Projetos por Indústria
    router.get('/por-industria', async (req, res) => {
        try {
            const { start, end } = req.query;
            const query = `
                SELECT 
                    f.for_nomered as industria,
                    COUNT(*) as qtd,
                    SUM(p.ped_totliq) as valor
                FROM pedidos p
                JOIN fornecedores f ON f.for_codigo = p.ped_industria
                WHERE p.ped_data BETWEEN $1 AND $2 AND p.tipo = 'projeto'
                GROUP BY f.for_nomered
                ORDER BY valor DESC
            `;
            const result = await pool.query(query, [start, end]);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM-REP REPORT] Industry Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    // 5. Client Insight (Visão 360 do Cliente)
    router.get('/client-insight', async (req, res) => {
        try {
            const query = `SELECT * FROM fn_gerencial_clientes()`;
            const result = await pool.query(query);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ [CRM-REP REPORT] Client Insight Error:', error);
            res.status(500).json({ success: false, message: error.message });
        }
    });

    return router;
};
