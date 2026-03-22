const express = require('express');
const { getLinkedSellerId, buildIndustryFilterClause } = require('./utils/permissions');
const router = express.Router();

module.exports = (pool) => {
    console.log("🚀 [REPORTS] Module Loaded - v2026-02-02-V2-ALIVE");
    // --- Novo Relatório: Dashboard Summary (4 cards superiores) ---
    router.get('/check-alive', (req, res) => {
        console.log("🟢 [REPORTS] ALIVE-CHECK HIT!");
        res.json({ success: true, message: "Reports V2 is active and listening" });
    });

    router.get('/dashboard-summary', async (req, res) => {
        try {
            const { mes, ano, trimestre, industria } = req.query;
            const userId = req.headers['x-user-id'];

            console.log(`🔎 [DASHBOARD SUMMARY] Ano=${ano}, Mes=${mes}, Trimestre=${trimestre}, Industria=${industria}`);

            if (!ano) {
                return res.status(400).json({ success: false, message: 'Ano é obrigatório' });
            }

            // Converter mes para NULL se for 'Todos'
            const p_month = (mes && mes !== 'Todos' && mes !== 'ALL') ? parseInt(mes) : null;
            const p_industry = (industria && industria !== 'Todos' && industria !== 'ALL') ? parseInt(industria) : null;

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause: metricsFilter } = buildIndustryFilterClause(sellerId, 'p.ped_industria');
            const { filterClause: metaFilter } = buildIndustryFilterClause(sellerId, 'met_industria');

            // Note: get_dashboard_metrics is a procedure, we need to check if it has internal filtering
            // For now, we apply the industry filter on the meta search if no specific industry is selected
            // or if the selected industry is not allowed.

            // Note: get_dashboard_metrics accepts (year, month, industry_id)
            let result;
            try {
                const query = `SELECT * FROM get_dashboard_metrics($1::integer, $2::integer, $3::integer)`;
                const params = [parseInt(ano), p_month, p_industry];
                result = await pool.query(query, params);
            } catch (fnError) {
                // Fallback: function may not exist in this tenant's schema
                console.warn('⚠️ [DASHBOARD] get_dashboard_metrics not found, using fallback query:', fnError.message);
                
                const currentYear = parseInt(ano);
                let currentStart, currentEnd, prevStart, prevEnd;
                
                if (p_month) {
                    currentStart = `${currentYear}-${String(p_month).padStart(2, '0')}-01`;
                    const lastDay = new Date(currentYear, p_month, 0).getDate();
                    currentEnd = `${currentYear}-${String(p_month).padStart(2, '0')}-${lastDay}`;
                    const prevMonth = p_month === 1 ? 12 : p_month - 1;
                    const prevYear = p_month === 1 ? currentYear - 1 : currentYear;
                    prevStart = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
                    const prevLastDay = new Date(prevYear, prevMonth, 0).getDate();
                    prevEnd = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${prevLastDay}`;
                } else {
                    currentStart = `${currentYear}-01-01`;
                    currentEnd = `${currentYear}-12-31`;
                    prevStart = `${currentYear - 1}-01-01`;
                    prevEnd = `${currentYear - 1}-12-31`;
                }

                const fallbackParams = [currentStart, currentEnd, prevStart, prevEnd];
                let industryFilter = '';
                if (p_industry) {
                    industryFilter = ` AND p.ped_industria = $5`;
                    fallbackParams.push(p_industry);
                }

                const fallbackQuery = `
                    WITH current_metrics AS (
                        SELECT 
                            COALESCE(SUM(i.ite_totliquido), 0) as total_vendido,
                            COALESCE(SUM(i.ite_quant), 0) as quantidade_vendida,
                            COUNT(DISTINCT p.ped_cliente) as clientes_atendidos,
                            COUNT(DISTINCT p.ped_pedido) as qtd_pedidos
                        FROM pedidos p
                        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
                        WHERE p.ped_data >= $1::date AND p.ped_data <= $2::date
                          AND p.ped_situacao IN ('P', 'F')
                          ${industryFilter}
                    ),
                    previous_metrics AS (
                        SELECT 
                            COALESCE(SUM(i.ite_totliquido), 0) as total_vendido
                        FROM pedidos p
                        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
                        WHERE p.ped_data >= $3::date AND p.ped_data <= $4::date
                          AND p.ped_situacao IN ('P', 'F')
                          ${industryFilter}
                    )
                    SELECT 
                        c.total_vendido as total_vendido_current,
                        c.quantidade_vendida as quantidade_vendida_current,
                        c.clientes_atendidos as clientes_atendidos_current,
                        c.qtd_pedidos as qtd_pedidos_current,
                        CASE WHEN prev.total_vendido = 0 THEN 
                            CASE WHEN c.total_vendido > 0 THEN 100.0 ELSE 0.0 END
                        ELSE 
                            ((c.total_vendido - prev.total_vendido) / prev.total_vendido * 100)
                        END as vendas_percent_change
                    FROM current_metrics c, previous_metrics prev
                `;
                result = await pool.query(fallbackQuery, fallbackParams);
            }

            // Buscar Meta Centralizada (se houver)
            let meta_total = 0;
            try {
                const monthName = p_month ? ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][p_month - 1] : null;
                let metaQuery = '';
                let metaParams = [parseInt(ano)];

                if (monthName) {
                    metaQuery = `SELECT SUM(met_${monthName}) as meta FROM ind_metas WHERE met_ano = $1 ${metaFilter}`;
                    if (p_industry) {
                        metaQuery += ` AND met_industria = $2`;
                        metaParams.push(p_industry);
                    }
                } else {
                    // Soma ano todo
                    metaQuery = `SELECT SUM(met_jan + met_fev + met_mar + met_abr + met_mai + met_jun + met_jul + met_ago + met_set + met_out + met_nov + met_dez) as meta FROM ind_metas WHERE met_ano = $1 ${metaFilter}`;
                    if (p_industry) {
                        metaQuery += ` AND met_industria = $2`;
                        metaParams.push(p_industry);
                    }
                }

                const metaRes = await pool.query(metaQuery, metaParams);
                meta_total = parseFloat(metaRes.rows[0]?.meta || 0);
            } catch (e) {
                console.error("⚠️ Erro ao buscar meta para dashboard:", e.message);
            }

            if (result.rows.length > 0) {
                const data = {
                    ...result.rows[0],
                    meta_total: meta_total
                };
                res.json({ success: true, data });
            } else {
                res.json({ success: true, data: { total_vendido_current: 0, meta_total: meta_total, vendas_percent_change: 0 } });
            }
        } catch (error) {
            console.error('❌ Erro no sumário do dashboard:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar sumário', detail: error.message });
        }
    });

    // --- Novo Relatório: TOP 6 Indústrias (para gráfico de bolhas no BI) ---
    router.get('/top-industries', async (req, res) => {
        try {
            const { mes, ano, trimestre, cliente, metrica } = req.query;

            console.log(`🔎 [TOP INDUSTRIES] Ano=${ano}, Mes=${mes}, Trimestre=${trimestre}, Cliente=${cliente}, Metrica=${metrica}`);

            if (!ano) {
                return res.status(400).json({ success: false, message: 'Ano é obrigatório' });
            }

            let dataInicial, dataFinal;
            let params = [];
            let paramCounter = 1;
            let conditions = [`p.ped_situacao IN ('P', 'F')`];

            // Lógica de período: Trimestre > Mês > Ano inteiro
            if (trimestre && trimestre !== 'ALL' && trimestre !== 'Todos') {
                // Trimestre: 1-4
                const tri = parseInt(trimestre);
                const mesInicio = (tri - 1) * 3 + 1;
                const mesFim = tri * 3;
                dataInicial = `${ano}-${String(mesInicio).padStart(2, '0')}-01`;
                const ultimoDia = new Date(ano, mesFim, 0).getDate();
                dataFinal = `${ano}-${String(mesFim).padStart(2, '0')}-${ultimoDia}`;
            } else if (mes && mes !== 'ALL' && mes !== 'Todos') {
                // Mês específico
                dataInicial = `${ano}-${String(mes).padStart(2, '0')}-01`;
                const ultimoDia = new Date(ano, mes, 0).getDate();
                dataFinal = `${ano}-${String(mes).padStart(2, '0')}-${ultimoDia}`;
            } else {
                // Ano inteiro
                dataInicial = `${ano}-01-01`;
                dataFinal = `${ano}-12-31`;
            }

            conditions.push(`p.ped_data BETWEEN $${paramCounter} AND $${paramCounter + 1}`);
            params.push(dataInicial, dataFinal);
            paramCounter += 2;

            // Filtro Cliente (Opcional)
            if (cliente && cliente !== 'ALL' && cliente !== 'Todos') {
                conditions.push(`p.ped_cliente = $${paramCounter}`);
                params.push(cliente);
                paramCounter++;
            }

            // Determinar métrica (valor ou quantidade)
            const campo = metrica === 'Quantidades' || metrica === 'quantidade'
                ? 'ip.ite_quant'
                : 'ip.ite_totliquido';

            const userId = req.headers['x-user-id'];
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

            const query = `
                SELECT 
                    f.for_codigo AS codigo,
                    f.for_nomered AS nome,
                    f.for_homepage AS imagem_url,
                    SUM(${campo}) AS total_vendas,
                    COUNT(DISTINCT p.ped_pedido) AS total_pedidos
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY f.for_codigo, f.for_nomered, f.for_homepage
                ORDER BY total_vendas DESC
                LIMIT 6
            `;

            const result = await pool.query(query, params);

            // Calcular total geral para percentuais
            const totalGeral = result.rows.reduce((sum, row) => sum + parseFloat(row.total_vendas), 0);

            const data = result.rows.map((row, index) => ({
                codigo: row.codigo,
                nome: row.nome,
                imagem_url: row.imagem_url || null,
                total_vendas: parseFloat(row.total_vendas),
                total_pedidos: parseInt(row.total_pedidos),
                percentual: totalGeral > 0 ? ((parseFloat(row.total_vendas) / totalGeral) * 100).toFixed(2) : 0,
                ranking: index + 1
            }));

            console.log(`✅ [TOP INDUSTRIES] Retornados ${data.length} indústrias (período: ${dataInicial} a ${dataFinal})`);

            res.json({ success: true, data });
        } catch (error) {
            console.error('❌ Erro no relatório TOP industries:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    // GET /api/reports/vendas
    // Parâmetros: start, end, industria, cliente, vendedor, grupo (boolean)
    router.get('/vendas', async (req, res) => {
        console.log("📍 [VENDAS_ROUTE] Request received:", req.query);
        try {
            const { start, end, industria, cliente, vendedor, grupo } = req.query;
            const userId = req.headers['x-user-id'];

            // Validação básica
            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

            // Helper para evitar NaN
            const safeInt = (val) => {
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };

            let params = [start, end];
            let paramCounter = 3;
            // TODO: Investigar os status de cada ambiente. 
            // Incluindo A (Aberto), L (Liberado), P (Processado), F (Faturado)
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F', 'A', 'L')`];

            // Filtro Indústria (Obrigatório segundo regra, mas vamos deixar flexível no código)
            // Filtro Indústria
            const indId = safeInt(industria);
            if (indId && industria !== 'ALL') {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(indId);
                paramCounter++;
            }

            // Filtro Vendedor
            const venId = safeInt(vendedor);
            if (venId && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(venId);
                paramCounter++;
            }

            // Lógica de Cliente e Grupo
            const cliId = safeInt(cliente);
            if (cliId && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                    params.push(cliId);
                    paramCounter++;
                } else {
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                    params.push(cliId);
                    paramCounter++;
                }
            }

            // Construir Query
            // Adaptando a lógica da procedure:
            // Retornar Cliente, Indústria, Mês/Ano, Total Valor, Total Qtd
            // O GROUP BY será feito aqui para entregar dados já consolidados por item/mês

            // Dynamic grouping column
            let clientCol = 'c.cli_nomred';
            if (String(grupo) === 'true') {
                clientCol = 'c.cli_redeloja';
                conditions.push("c.cli_redeloja IS NOT NULL AND TRIM(c.cli_redeloja) <> ''");
            }

            console.log("🚀 [REPORTS] Module Loaded - v2026-02-02-FIX"); // Force log check

            // ... existing code ...

            const query = `
                SELECT 
                    ${clientCol} AS cliente_nome,
                    f.for_nomered AS industria_nome,
                    to_char(p.ped_data, 'MM/YYYY') AS mes,
                    SUM(ip.ite_totliquido) AS valor,
                    SUM(ip.ite_quant) AS qtd
                FROM pedidos p
                JOIN itens_ped ip ON TRIM(p.ped_pedido) = TRIM(ip.ite_pedido)
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY 1, 2, 3
                ORDER BY 2, 1
            `;

            console.log("Executando relatório de vendas, params:", params);

            // DEBUG: Verificar Schema e Params
            const schemaCheck = await pool.query('SELECT current_schema()');
            console.log(`🔎 [DEBUG VENDAS] Schema Atual: ${schemaCheck.rows[0].current_schema}`);
            console.log(`🔎 [DEBUG VENDAS] Params:`, params);
            console.log(`🔎 [DEBUG VENDAS] Query (snippet):`, query.substring(0, 200));

            const result = await pool.query(query, params);
            console.log(`📊 [REPORT RESULTS] Query returned ${result.rows.length} rows.`);

            // Formatar dados para garantir compatibilidade numérica
            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor),
                qtd: parseFloat(row.qtd)
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no relatório de vendas:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar relatório: ${error.message}`,
                detail: error.stack
            });
        }
    });

    // --- Novo Relatório: Mapa Cliente / Indústria (Hierárquico) ---
    // Baseado na procedure PROC_MAPAANOCLI
    router.get('/mapa_cliente_industria', async (req, res) => {
        try {
            const { start, end, industria, cliente, vendedor, grupo, detalhada } = req.query;
            const userId = req.headers['x-user-id'];

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

            // Helper para evitar NaN
            const safeInt = (val) => {
                const parsed = parseInt(val);
                return isNaN(parsed) ? null : parsed;
            };

            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F', 'A', 'L')`];

            // Filtros comuns
            const indId = safeInt(industria);
            if (indId && industria !== 'ALL') {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(indId);
                paramCounter++;
            }
            const venId = safeInt(vendedor);
            if (venId && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(venId);
                paramCounter++;
            }
            const cliId = safeInt(cliente);
            if (cliId && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                } else {
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                }
                params.push(cliId);
                paramCounter++;
            }
            if (String(grupo) === 'true') {
                // Ensure valid groups
                conditions.push("c.cli_redeloja IS NOT NULL AND TRIM(c.cli_redeloja) <> ''");
            }

            let query = '';

            if (detalhada === 'true') {
                // Modo Detalhado: Lista de Pedidos
                // Procedure: select distinct p.ped_pedido, cli_nomred, f.for_nomered, p.ped_data, p.ped_totliq ...
                query = `
                    SELECT 
                        f.for_nomered AS industria,
                        p.ped_pedido AS pedido,
                        c.cli_nomred AS cliente,
                        p.ped_data AS data,
                        p.ped_totliq AS valor,
                        (SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido) AS qtd,
                        to_char(p.ped_data, 'MM/YYYY') AS mes_ref
                    FROM pedidos p
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE ${conditions.join(' AND ')}
                      ${filterClause}
                    ORDER BY f.for_nomered, p.ped_data DESC
                `;
            } else {
                // Modo Resumido: Agrupado por Cliente e Indústria (Um registro por periodo)
                // Procedure: group by 2,1 (Industria, Cliente)

                const isGrupo = String(grupo) === 'true';
                const clientCol = isGrupo ? 'c.cli_redeloja' : 'c.cli_nomred';

                query = `
                    SELECT 
                        MAX(f.for_nomered) AS industria,
                        ${clientCol} AS cliente,
                        MAX(p.ped_data) AS data,
                        SUM(ip.ite_totliquido) AS valor,
                        SUM(ip.ite_quant) AS qtd,
                        to_char(MAX(p.ped_data), 'MM/YYYY') AS mes_ref
                    FROM itens_ped ip
                    JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE ${conditions.join(' AND ')}
                      ${filterClause}
                    GROUP BY f.for_nomered, ${clientCol}
                    ORDER BY f.for_nomered, ${clientCol}
                `;
            }

            console.log("Executando Mapa Cli/Ind, detalhada:", detalhada, "grupo:", grupo);
            const result = await pool.query(query, params);

            // Parser numérico
            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor || 0),
                qtd: parseFloat(row.qtd || 0)
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no Mapa Cli/Ind:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar mapa: ${error.message}`,
                detail: error.stack
            });
        }
    });

    // --- Novo Relatório: Mapa por Vendedor (Pivot) ---
    // Similar ao de vendas, mas agrupa por vendedor.
    router.get('/vendedor', async (req, res) => {
        try {
            const { start, end, vendedor } = req.query;
            const userId = req.headers['x-user-id'];

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

            // Filtro Vendedor (Obrigatório pela logica, mas validado no front)
            const parsedVendor = parseInt(vendedor);
            if (vendedor && vendedor !== 'ALL' && !isNaN(parsedVendor)) {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(parsedVendor);
                paramCounter++;
            }

            const query = `
                SELECT 
                    f.for_nomered AS industria_nome,
                    to_char(p.ped_data, 'MM/YYYY') AS mes,
                    SUM(ip.ite_totliquido) AS valor,
                    SUM(ip.ite_quant) AS qtd
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY 1, 2
                ORDER BY 1, to_date(to_char(p.ped_data, 'MM/YYYY'), 'MM/YYYY')
            `;

            console.log("Executando relatório de vendedor, params:", params);

            const result = await pool.query(query, params);

            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor),
                qtd: parseFloat(row.qtd)
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no relatório de vendedor:', error);
            res.status(500).json({
                success: false,
                message: `Erro ao gerar relatório: ${error.message}`,
                detail: error.stack
            });
        }
    });

    // --- Novo Relatório: Mapa por Produtos (Pivot) ---
    // Mostra vendas por produto/mês para uma indústria específica
    router.get('/produtos', async (req, res) => {
        try {
            const { start, end, industria, cliente } = req.query;
            const userId = req.headers['x-user-id'];

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            const isAllIndustries = !industria || industria === 'ALL';
            let params = [start, end];

            // Add industria only if it's not 'ALL'
            if (!isAllIndustries) {
                params.push(industria);
            }

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria', params);

            let paramCounter = params.length + 1;

            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`
            ];

            if (!isAllIndustries) {
                conditions.push(`p.ped_industria = $3`);
            }

            // Filtro Cliente (Opcional)
            if (cliente && cliente !== 'ALL') {
                conditions.push(`p.ped_cliente = $${paramCounter}`);
                params.push(cliente);
                paramCounter++;
            }

            const query = `
                SELECT 
                    ip.ite_produto AS produto_codigo,
                    to_char(p.ped_data, 'MM/YYYY') AS mes,
                    SUM(ip.ite_quant) AS qtd
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY 1, 2
                ORDER BY 1, to_date(to_char(p.ped_data, 'MM/YYYY'), 'MM/YYYY')
            `;

            console.log("Executando relatório de produtos, params:", params);

            const result = await pool.query(query, params);

            const data = result.rows.map(row => ({
                ...row,
                qtd: parseInt(row.qtd) || 0
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no relatório de produtos:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
        }
    });

    // --- Novo Relatório: Últimas Compras Clientes ---
    // Modos: valor (soma valores), qtd (soma qtd), ultima (dados do último pedido)
    router.get('/ultimas-compras', async (req, res) => {
        try {
            const { start, end, industria, cliente, vendedor, grupo, modo } = req.query;
            const userId = req.headers['x-user-id'];

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            const isAllIndustries = !industria || industria === 'ALL';
            let params = [start, end];

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria', params);
            let paramCounter = params.length + 1;
            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`
            ];

            if (!isAllIndustries) {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(industria);
                paramCounter++;
            }

            // Filtro Cliente
            if (cliente && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                } else {
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                }
                params.push(cliente);
                paramCounter++;
            }

            // Filtro Vendedor (Baseado no Cadastro do Cliente conforme solicitado)
            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`c.cli_vendedor = $${paramCounter}`);
                params.push(vendedor);
                paramCounter++;
            }

            const isGrouped = String(grupo) === 'true';
            const groupCol = isGrouped ? 'c.cli_redeloja' : 'c.cli_nomred';
            const groupFilter = isGrouped ? "AND c.cli_redeloja IS NOT NULL AND TRIM(c.cli_redeloja) <> ''" : '';

            let query;

            if (modo === 'ultima') {
                // Modo "Última compra" - mostra dados do último pedido apenas
                query = `
                    WITH ultima_compra AS (
                        SELECT DISTINCT ON (${groupCol}${isAllIndustries ? ', f.for_nomered' : ''})
                            ${groupCol} AS cliente,
                            ${isGrouped ? "NULL" : "c.cli_uf"} AS estado,
                            ${isAllIndustries ? "f.for_nomered AS industria," : ""}
                            p.ped_totliq AS valor,
                            COALESCE((SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido), 0) AS qtd,
                            p.ped_data AS data_ultima,
                            CURRENT_DATE - p.ped_data::date AS dias
                        FROM pedidos p
                        JOIN clientes c ON p.ped_cliente = c.cli_codigo
                        ${isAllIndustries ? "JOIN fornecedores f ON p.ped_industria = f.for_codigo" : ""}
                        WHERE ${conditions.join(' AND ')} ${groupFilter}
                          ${filterClause}
                        ORDER BY ${groupCol}${isAllIndustries ? ', f.for_nomered' : ''}, p.ped_data DESC
                    )
                    SELECT * FROM ultima_compra
                    ORDER BY dias ASC, cliente
                `;
            } else {
                // Modo "Valores" ou "Quantidade" - soma e última data
                query = `
                    SELECT 
                        ${groupCol} AS cliente,
                        ${isGrouped ? "NULL" : "c.cli_uf"} AS estado,
                        ${isAllIndustries ? "f.for_nomered AS industria," : ""}
                        SUM(p.ped_totliq) AS valor,
                        SUM(COALESCE((SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido), 0)) AS qtd,
                        MAX(p.ped_data) AS data_ultima,
                        CURRENT_DATE - MAX(p.ped_data)::date AS dias
                    FROM pedidos p
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    ${isAllIndustries ? "JOIN fornecedores f ON p.ped_industria = f.for_codigo" : ""}
                    WHERE ${conditions.join(' AND ')} ${groupFilter}
                      ${filterClause}
                    GROUP BY ${groupCol}${isGrouped ? '' : ', c.cli_uf'}${isAllIndustries ? ', f.for_nomered' : ''}
                    ORDER BY dias ASC, cliente
                `;
            }

            console.log("Executando relatório de últimas compras, modo:", modo, "Industria:", industria, "params:", params);

            const result = await pool.query(query, params);

            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor) || 0,
                qtd: parseInt(row.qtd) || 0,
                dias: parseInt(row.dias) || 0,
                data_ultima: row.data_ultima,
                industria: row.industria || null
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no relatório de últimas compras:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
        }
    });

    // --- Novo Relatório: Mapa de Quantidade (Produto x Cliente) ---
    // Mostra quantidade vendida de cada produto para cada cliente
    router.get('/mapa-quantidade', async (req, res) => {
        console.log('🔵 [MAPA-QTD] Endpoint chamado com params:', req.query);
        try {
            const { start, end, industria, cliente, grupo } = req.query;
            const userId = req.headers['x-user-id'];

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            const isAllIndustries = !industria || industria === 'ALL';
            let params = [start, end];

            // Add industria only if it's not 'ALL'
            if (!isAllIndustries) {
                params.push(industria);
            }

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria', params);

            let paramCounter = params.length + 1;

            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`
            ];

            if (!isAllIndustries) {
                conditions.push(`p.ped_industria = $3`);
            }

            // Filtro Cliente (Opcional)
            if (cliente && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                } else {
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                }
                params.push(cliente);
                paramCounter++;
            }

            // Primeira query: buscar os dados brutos (produto x cliente x quantidade)
            const dataQuery = `
                SELECT 
                    ip.ite_produto AS produto_codigo,
                    c.cli_nomred AS cliente_nome,
                    c.cli_codigo AS cliente_codigo,
                    SUM(ip.ite_quant) AS quantidade
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY ip.ite_produto, c.cli_nomred, c.cli_codigo
                ORDER BY ip.ite_produto, c.cli_nomred
            `;

            console.log("Executando mapa de quantidade, params:", params);

            const result = await pool.query(dataQuery, params);

            // Processar dados para formato pivot (matriz)
            // Estrutura final: [{ produto: 'PROD1', CLI1: 100, CLI2: 200, ... }, ...]

            // 1. Extrair lista única de clientes (colunas)
            const clientesSet = new Set();
            result.rows.forEach(row => {
                clientesSet.add(row.cliente_nome);
            });
            const clientesList = Array.from(clientesSet).sort();

            // 2. Agrupar por produto
            const produtosMap = new Map();
            result.rows.forEach(row => {
                if (!produtosMap.has(row.produto_codigo)) {
                    produtosMap.set(row.produto_codigo, {
                        produto: row.produto_codigo,
                    });
                }
                // Adicionar quantidade do cliente
                const key = `cli_${row.cliente_codigo}`;
                produtosMap.get(row.produto_codigo)[key] = parseInt(row.quantidade) || 0;
            });

            // 3. Converter para array
            const data = Array.from(produtosMap.values());

            // 4. Criar lista de colunas (para o frontend saber quais colunas renderizar)
            const columns = clientesList.map((cli, idx) => {
                // Encontrar o código do cliente
                const clienteRow = result.rows.find(r => r.cliente_nome === cli);
                return {
                    key: `cli_${clienteRow.cliente_codigo}`,
                    label: cli
                };
            });

            res.json({ success: true, data, columns });

        } catch (error) {
            console.error('Erro no mapa de quantidade:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar mapa' });
        }
    });

    // --- Mapa 3 Anos ---
    // Retorna dados comparativos de 3 anos (ano base + 2 anos anteriores)
    // Agrupado por mês ou por código de produto
    router.get('/mapa-3-anos', async (req, res) => {
        try {
            const { anoBase, industria, cliente, modo, categoria } = req.query;
            const userId = req.headers['x-user-id'];

            if (!anoBase || !industria) {
                return res.status(400).json({
                    success: false,
                    message: 'Ano base e indústria são obrigatórios'
                });
            }

            const isAllIndustries = !industria || industria === 'ALL';
            let params = [];

            // Permission logic
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria', params);
            
            let paramCounter = params.length + 1;

            const baseYear = parseInt(anoBase);
            const year1 = baseYear;
            const year2 = baseYear - 1;
            const year3 = baseYear - 2;

            // Montar query base
            let conditions = [
                `p.ped_situacao IN ('P', 'F')`,
                `EXTRACT(YEAR FROM p.ped_data) IN (${year1}, ${year2}, ${year3})`
            ];

            if (!isAllIndustries) {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(industria);
                paramCounter++;
            }

            // Filtro Cliente (opcional)
            if (cliente && cliente !== 'ALL') {
                conditions.push(`p.ped_cliente = $${paramCounter}`);
                params.push(cliente);
                paramCounter++;
            }

            // Determinar agregação (valor ou quantidade)
            const campo = modo === 'quantidade' ? 'ip.ite_quant' : 'ip.ite_totliquido';

            // Determinar agrupamento (mês ou código)
            const groupBy = categoria === 'codigo'
                ? 'ip.ite_produto'
                : `TO_CHAR(p.ped_data, 'MM')`;

            const labelField = categoria === 'codigo'
                ? 'ip.ite_produto'
                : `TO_CHAR(p.ped_data, 'MM')`;

            const query = `
                SELECT 
                    ${labelField} AS chave,
                    EXTRACT(YEAR FROM p.ped_data)::INTEGER AS ano,
                    SUM(${campo}) AS valor
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                WHERE ${conditions.join(' AND ')}
                  ${filterClause}
                GROUP BY ${labelField}, EXTRACT(YEAR FROM p.ped_data)
                ORDER BY ${labelField}, ano DESC
            `;

            console.log('🔵 [MAPA-3-ANOS] Query:', query);
            console.log('🔵 [MAPA-3-ANOS] Params:', params);
            console.log('🔵 [MAPA-3-ANOS] Request params:', { anoBase, industria, cliente, modo, categoria });

            const result = await pool.query(query, params);

            // Pivotar dados
            const pivotMap = new Map();

            result.rows.forEach(row => {
                const key = row.chave;
                if (!pivotMap.has(key)) {
                    pivotMap.set(key, {
                        chave: key,
                        [`ano_${year1}`]: 0,
                        [`ano_${year2}`]: 0,
                        [`ano_${year3}`]: 0
                    });
                }
                pivotMap.get(key)[`ano_${row.ano}`] = parseFloat(row.valor) || 0;
            });

            const data = Array.from(pivotMap.values());

            // Calcular totais
            const totais = {
                [`ano_${year1}`]: 0,
                [`ano_${year2}`]: 0,
                [`ano_${year3}`]: 0
            };

            data.forEach(row => {
                totais[`ano_${year1}`] += row[`ano_${year1}`];
                totais[`ano_${year2}`] += row[`ano_${year2}`];
                totais[`ano_${year3}`] += row[`ano_${year3}`];
            });

            res.json({
                success: true,
                data,
                totais,
                anos: [year1, year2, year3]
            });

        } catch (error) {
            console.error('❌ [MAPA-3-ANOS] Erro:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao gerar relatório',
                error: error.message,
                detail: error.detail || ''
            });
        }
    });

    // --- Novo Relatório: Itens Nunca Comprados ---
    router.get('/itens-nunca-comprados', async (req, res) => {
        try {
            const { industria, cliente } = req.query;

            console.log(`🔎 [ITENS NUNCA COMPRADOS] Buscando: Indústria=${industria}, Cliente=${cliente}`);

            if (!industria || !cliente) {
                return res.status(400).json({ success: false, message: 'Indústria e Cliente são obrigatórios' });
            }

            const result = await pool.query(
                `SELECT * FROM fn_itens_nunca_comprados($1::integer, $2::integer)`,
                [parseInt(industria), parseInt(cliente)]
            );

            console.log(`✅ [ITENS NUNCA COMPRADOS] Retornados ${result.rows.length} produtos`);

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no relatório itens nunca comprados:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    // --- Novo Relatório: Comparativo entre 2 Clientes ---
    router.get('/comparativo-clientes', async (req, res) => {
        try {
            const { industria, clienteRef, clienteAlvo, dataInicial, dataFinal, modo } = req.query;

            console.log(`🔎 [COMPARATIVO] Ind=${industria}, Ref=${clienteRef}, Alvo=${clienteAlvo}, Modo=${modo}`);

            if (!industria || !clienteRef || !clienteAlvo || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
            }

            const result = await pool.query(
                `SELECT * FROM fn_comparativo_clientes($1::integer, $2::integer, $3::integer, $4::date, $5::date, $6::varchar)`,
                [parseInt(industria), parseInt(clienteRef), parseInt(clienteAlvo), dataInicial, dataFinal, modo]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no comparativo de clientes:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar comparativo', detail: error.message });
        }
    });

    // --- Novo Relatório: Clientes Inativos ---
    // Filtro por período (meses): 3 (Trimestre), 6 (Semestre), 12 (Anual) ou 0 (Totalmente Inativos)
    router.get('/clientes-inativos', async (req, res) => {
        try {
            const { periodo } = req.query;
            const months = parseInt(periodo || 0);

            console.log(`🔎 [CLIENTES INATIVOS] Período: ${months} meses`);

            let query = "";
            let params = [];

            if (months === -1) {
                // Todos os Clientes Ativos (Base de Cadastro)
                query = `
                    SELECT 
                        c.cli_codigo AS codigo,
                        c.cli_cnpj AS cnpj,
                        c.cli_nome AS nome,
                        c.cli_nomred AS nome_reduzido,
                        c.cli_fone1 AS telefone,
                        c.cli_email AS email,
                        cid.cid_nome AS cidade,
                        cid.cid_uf AS uf,
                        v.ven_nome AS vendedor,
                        (SELECT MAX(ped_data) FROM pedidos WHERE ped_cliente = c.cli_codigo AND ped_situacao <> 'C') AS ultima_compra
                    FROM clientes c
                    LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
                    LEFT JOIN vendedores v ON c.cli_vendedor = v.ven_codigo
                    WHERE c.cli_tipopes = 'A' OR c.cli_tipopes IS NULL
                    ORDER BY c.cli_nome ASC
                `;
            } else if (months === 0) {
                // Totalmente Inativos (Nunca compraram)
                query = `
                    SELECT 
                        c.cli_codigo AS codigo,
                        c.cli_cnpj AS cnpj,
                        c.cli_nome AS nome,
                        c.cli_nomred AS nome_reduzido,
                        c.cli_fone1 AS telefone,
                        c.cli_email AS email,
                        cid.cid_nome AS cidade,
                        cid.cid_uf AS uf,
                        v.ven_nome AS vendedor,
                        'NUNCA COMPROU' AS status_inatividade
                    FROM clientes c
                    LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
                    LEFT JOIN vendedores v ON c.cli_vendedor = v.ven_codigo
                    WHERE NOT EXISTS (
                        SELECT 1 FROM pedidos p WHERE p.ped_cliente = c.cli_codigo
                    )
                    ORDER BY c.cli_nome
                `;
            } else {
                // Inativos no período (Sem compras nos últimos X meses)
                const userId = req.headers['x-user-id'];
                const sellerId = await getLinkedSellerId(pool, userId);
                const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

                query = `
                    WITH stats AS (
                        SELECT 
                            p.ped_cliente,
                            -- Ticket Médio
                            AVG(p.ped_totliq) AS ticket_medio,
                            -- Data da primeira e última compra
                            MIN(p.ped_data) AS primeira_compra,
                            MAX(p.ped_data) AS ultima_compra,
                            -- Quantidade total de pedidos
                            COUNT(*) AS total_pedidos,
                            -- Frequência de compra (dias entre pedidos)
                            CASE 
                                WHEN COUNT(*) > 1 THEN 
                                    (EXTRACT(EPOCH FROM (MAX(p.ped_data)::timestamp - MIN(p.ped_data)::timestamp)) / 86400) / (COUNT(*) - 1)
                                ELSE NULL -- Cliente de compra única
                            END AS frequencia_dias
                        FROM pedidos p
                        WHERE p.ped_situacao <> 'C'
                          ${filterClause}
                        GROUP BY p.ped_cliente
                    )
                    SELECT 
                        c.cli_codigo AS codigo,
                        c.cli_cnpj AS cnpj,
                        c.cli_nome AS nome,
                        c.cli_nomred AS nome_reduzido,
                        c.cli_fone1 AS telefone,
                        c.cli_email AS email,
                        cid.cid_nome AS cidade,
                        cid.cid_uf AS uf,
                        v.ven_nome AS vendedor,
                        s.ultima_compra,
                        s.ticket_medio AS potential_ticket,
                        s.total_pedidos AS qtd_pedidos,
                        COALESCE(s.frequencia_dias, 0) AS frequencia_dias,
                        -- Dias de inatividade (subtração direta de datas no PG resulta em inteiro)
                        (CURRENT_DATE - s.ultima_compra::date) AS dias_inativo,
                        -- Pedidos Perdidos = FLOOR(Dias Inativo / Frequência)
                        CASE 
                            WHEN s.frequencia_dias > 0 THEN 
                                FLOOR((CURRENT_DATE - s.ultima_compra::date) / s.frequencia_dias)
                            ELSE 0 
                        END AS pedidos_perdidos,
                        -- Receita Potencial = Pedidos Perdidos * Ticket Médio
                        CASE 
                            WHEN s.frequencia_dias > 0 THEN 
                                FLOOR((CURRENT_DATE - s.ultima_compra::date) / s.frequencia_dias) * s.ticket_medio
                            ELSE 0
                        END AS receita_potencial
                    FROM clientes c
                    JOIN stats s ON c.cli_codigo = s.ped_cliente
                    LEFT JOIN cidades cid ON c.cli_idcidade = cid.cid_codigo
                    LEFT JOIN vendedores v ON c.cli_vendedor = v.ven_codigo
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM pedidos p 
                        WHERE p.ped_cliente = c.cli_codigo 
                        AND p.ped_data >= CURRENT_DATE - ($1 || ' months')::INTERVAL
                        AND p.ped_situacao <> 'C'
                    )
                    ORDER BY receita_potencial DESC, s.ultima_compra ASC
                `;
                params.push(months);
            }

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no relatório de clientes inativos:', error);
            res.status(500).json({ success: false, message: 'Erro ao buscar clientes inativos', detail: error.message });
        }
    });

    // --- Novo Relatório: Mapa Cliente/Geral ---
    router.get('/mapa-cliente-geral', async (req, res) => {
        try {
            const { dataInicial, dataFinal, industria, cliente, grupo } = req.query;

            console.log(`🔎 [CLIENTE/GERAL] Ind=${industria}, Cli=${cliente}, Grupo=${grupo}`);

            if (!industria || !cliente || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
            }

            // Permission check
            const userId = req.headers['x-user-id'];
            const sellerId = await getLinkedSellerId(pool, userId);
            if (sellerId !== null) {
                const allowedRes = await pool.query(
                    `SELECT 1 FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2`,
                    [sellerId, parseInt(industria)]
                );
                if (allowedRes.rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acesso negado para esta indústria' });
                }
            }



            const result = await pool.query(
                `SELECT * FROM fn_mapa_cliente_geral($1::date, $2::date, $3::integer, $4::integer, $5::boolean)`,
                [dataInicial, dataFinal, parseInt(industria), parseInt(cliente), grupo === 'true']
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no mapa cliente/geral:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar mapa', detail: error.message });
        }
    });

    // --- Novo Relatório: Grupo de Lojas ---
    router.get('/grupo-lojas', async (req, res) => {
        try {
            const { dataInicial, dataFinal, industria } = req.query;
            const userId = req.headers['x-user-id'];

            console.log(`🔎 [GRUPO LOJAS] Ind=${industria}, Period=${dataInicial} to ${dataFinal}`);

            if (!industria || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
            }

            // Permission check
            const sellerId = await getLinkedSellerId(pool, userId);
            if (sellerId !== null) {
                const allowedRes = await pool.query(
                    `SELECT 1 FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2`,
                    [sellerId, parseInt(industria)]
                );
                if (allowedRes.rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acesso negado para esta indústria' });
                }
            }

            const result = await pool.query(
                `SELECT * FROM fn_mapa_grupo_lojas($1, $2, $3)`,
                [dataInicial, dataFinal, parseInt(industria)]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no relatório grupo de lojas:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    // --- Novo Relatório: Produtos de Única Compra ---
    router.get('/produtos-unica-compra', async (req, res) => {
        try {
            const { dataInicial, dataFinal, industria } = req.query;
            const userId = req.headers['x-user-id'];

            console.log(`🔎 [UNICA COMPRA] Ind=${industria}, Period=${dataInicial} to ${dataFinal}`);

            if (!industria || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
            }

            // Permission check
            const sellerId = await getLinkedSellerId(pool, userId);
            if (sellerId !== null) {
                const allowedRes = await pool.query(
                    `SELECT 1 FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2`,
                    [sellerId, parseInt(industria)]
                );
                if (allowedRes.rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acesso negado para esta indústria' });
                }
            }

            const result = await pool.query(
                `SELECT * FROM fn_produtos_unica_compra($1, $2, $3)`,
                [dataInicial, dataFinal, parseInt(industria)]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no relatório produtos única compra:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    // --- Novo Relatório: Clientes MoM (Atual vs Anterior) ---
    router.get('/clientes-mom', async (req, res) => {
        try {
            const { mes, ano, industria, anoTodo, redeLojas } = req.query;
            const userId = req.headers['x-user-id'];

            console.log(`🔎 [CLIENTES MOM] Ind=${industria}, Period=${mes}/${ano}, FullYear=${anoTodo}, GroupRede=${redeLojas}`);

            if (!industria || !mes || !ano) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
            }

            // Permission check
            const sellerId = await getLinkedSellerId(pool, userId);
            if (sellerId !== null) {
                const allowedRes = await pool.query(
                    `SELECT 1 FROM vendedor_ind WHERE vin_codigo = $1 AND vin_industria = $2`,
                    [sellerId, parseInt(industria)]
                );
                if (allowedRes.rows.length === 0) {
                    return res.status(403).json({ success: false, message: 'Acesso negado para esta indústria' });
                }
            }



            const result = await pool.query(
                `SELECT * FROM fn_clientes_mom($1, $2, $3, $4, $5)`,
                [parseInt(mes), parseInt(ano), parseInt(industria), anoTodo === 'true', redeLojas === 'true']
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no relatório clientes mom:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    // --- Novo Relatório: Mapa Mensal por Item ---
    router.get('/mapa-item-mensal', async (req, res) => {
        try {
            const { ano, industria, cliente, grupo } = req.query;
            const userId = req.headers['x-user-id'];

            console.log(`🔎 [MAPA ITEM MENSAL] Ano=${ano}, Ind=${industria}, Cli=${cliente}, Group=${grupo}`);

            if (!ano || !industria) {
                return res.status(400).json({ success: false, message: 'Ano e Indústria são obrigatórios' });
            }

            // Permission check
            const sellerId = await getLinkedSellerId(pool, userId);
            const { filterClause } = buildIndustryFilterClause(sellerId, 'p.ped_industria');

            let params = [parseInt(ano), parseInt(industria)];
            let paramCounter = 3;
            let clientCondition = '';

            if (cliente && cliente !== 'ALL' && cliente !== 'Todos') {
                if (grupo === 'true') {
                    clientCondition = `AND c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`;
                } else {
                    clientCondition = `AND p.ped_cliente = $${paramCounter}`;
                }
                params.push(parseInt(cliente));
                paramCounter++;
            }

            const query = `
                SELECT 
                    ip.ite_produto AS codigo,
                    MAX(pr.pro_nome) AS descricao,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 1 THEN ip.ite_quant ELSE 0 END), 0) AS mes_01,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 2 THEN ip.ite_quant ELSE 0 END), 0) AS mes_02,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 3 THEN ip.ite_quant ELSE 0 END), 0) AS mes_03,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 4 THEN ip.ite_quant ELSE 0 END), 0) AS mes_04,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 5 THEN ip.ite_quant ELSE 0 END), 0) AS mes_05,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 6 THEN ip.ite_quant ELSE 0 END), 0) AS mes_06,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 7 THEN ip.ite_quant ELSE 0 END), 0) AS mes_07,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 8 THEN ip.ite_quant ELSE 0 END), 0) AS mes_08,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 9 THEN ip.ite_quant ELSE 0 END), 0) AS mes_09,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 10 THEN ip.ite_quant ELSE 0 END), 0) AS mes_10,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 11 THEN ip.ite_quant ELSE 0 END), 0) AS mes_11,
                    COALESCE(SUM(CASE WHEN EXTRACT(MONTH FROM p.ped_data) = 12 THEN ip.ite_quant ELSE 0 END), 0) AS mes_12,
                    SUM(ip.ite_quant) AS total_ano
                FROM pedidos p
                JOIN itens_ped ip ON ip.ite_pedido = p.ped_pedido
                JOIN clientes c ON c.cli_codigo = p.ped_cliente
                LEFT JOIN cad_prod pr ON TRIM(pr.pro_codprod) = TRIM(ip.ite_produto) AND pr.pro_industria = p.ped_industria
                WHERE EXTRACT(YEAR FROM p.ped_data) = $1
                  AND p.ped_industria = $2
                  AND p.ped_situacao IN ('P', 'F')
                  ${clientCondition}
                  ${filterClause}
                GROUP BY ip.ite_produto
                HAVING SUM(ip.ite_quant) > 0
                ORDER BY ip.ite_produto
            `;

            const result = await pool.query(query, params);
            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no mapa mensal por item:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório', detail: error.message });
        }
    });

    return router;
};
