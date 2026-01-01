const express = require('express');
const router = express.Router();

module.exports = (pool) => {

    // --- Novo Relatório: Dashboard Summary (4 cards superiores) ---
    router.get('/dashboard-summary', async (req, res) => {
        try {
            const { mes, ano, trimestre, industria } = req.query;

            console.log(`🔎 [DASHBOARD SUMMARY] Ano=${ano}, Mes=${mes}, Trimestre=${trimestre}, Industria=${industria}`);

            if (!ano) {
                return res.status(400).json({ success: false, message: 'Ano é obrigatório' });
            }

            // Converter mes para NULL se for 'Todos'
            const p_month = (mes && mes !== 'Todos' && mes !== 'ALL') ? parseInt(mes) : null;
            const p_industry = (industria && industria !== 'Todos' && industria !== 'ALL') ? parseInt(industria) : null;

            // Note: get_dashboard_metrics accepts (year, month, industry_id)
            const query = `SELECT * FROM get_dashboard_metrics($1::integer, $2::integer, $3::integer)`;
            const params = [parseInt(ano), p_month, p_industry];

            const result = await pool.query(query, params);

            if (result.rows.length > 0) {
                res.json({ success: true, data: result.rows[0] });
            } else {
                res.json({ success: false, message: 'Nenhum dado encontrado' });
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
        try {
            const { start, end, industria, cliente, vendedor, grupo } = req.query;

            // Validação básica
            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

            // Filtro Indústria (Obrigatório segundo regra, mas vamos deixar flexível no código)
            if (industria && industria !== 'ALL') {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(industria);
                paramCounter++;
            }

            // Filtro Vendedor
            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(vendedor);
                paramCounter++;
            }

            // Lógica de Cliente e Grupo
            if (cliente && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    // Se considerar grupo, precisamos descobrir a rede do cliente primeiro
                    // e filtrar por ela.
                    // Para ser eficiente, podemos usar uma subquery na cláusula WHERE
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                    params.push(cliente);
                    paramCounter++;
                } else {
                    // Filtro simples por cliente
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                    params.push(cliente);
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

            const query = `
                SELECT 
                    ${clientCol} AS cliente_nome,
                    f.for_nomered AS industria_nome,
                    to_char(p.ped_data, 'MM/YYYY') AS mes,
                    SUM(ip.ite_totliquido) AS valor,
                    SUM(ip.ite_quant) AS qtd
                FROM pedidos p
                JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                JOIN fornecedores f ON p.ped_industria = f.for_codigo
                WHERE ${conditions.join(' AND ')}
                GROUP BY 1, 2, 3
                ORDER BY 2, 1, to_date(to_char(p.ped_data, 'MM/YYYY'), 'MM/YYYY')
            `;

            console.log("Executando relatório de vendas, params:", params);

            const result = await pool.query(query, params);

            // Formatar dados para garantir compatibilidade numérica
            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor),
                qtd: parseFloat(row.qtd)
            }));

            res.json({ success: true, data });

        } catch (error) {
            console.error('Erro no relatório de vendas:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
        }
    });

    // --- Novo Relatório: Mapa Cliente / Indústria (Hierárquico) ---
    // Baseado na procedure PROC_MAPAANOCLI
    router.get('/mapa_cliente_industria', async (req, res) => {
        try {
            const { start, end, industria, cliente, vendedor, grupo, detalhada } = req.query;

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

            // Filtros comuns
            if (industria && industria !== 'ALL') {
                conditions.push(`p.ped_industria = $${paramCounter}`);
                params.push(industria);
                paramCounter++;
            }
            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(vendedor);
                paramCounter++;
            }
            if (cliente && cliente !== 'ALL') {
                if (String(grupo) === 'true') {
                    conditions.push(`c.cli_redeloja = (SELECT cli_redeloja FROM clientes WHERE cli_codigo = $${paramCounter})`);
                } else {
                    conditions.push(`p.ped_cliente = $${paramCounter}`);
                }
                params.push(cliente);
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
                    JOIN pedidos p ON ip.ite_pedido = p.ped_pedido AND ip.ite_industria = p.ped_industria
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    JOIN fornecedores f ON p.ped_industria = f.for_codigo
                    WHERE ${conditions.join(' AND ')}
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
            res.status(500).json({ success: false, message: 'Erro ao gerar mapa' });
        }
    });

    // --- Novo Relatório: Mapa por Vendedor (Pivot) ---
    // Similar ao de vendas, mas agrupa por vendedor.
    router.get('/vendedor', async (req, res) => {
        try {
            const { start, end, vendedor } = req.query;

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            let params = [start, end];
            let paramCounter = 3;
            let conditions = [`p.ped_data BETWEEN $1 AND $2`, `p.ped_situacao IN ('P', 'F')`];

            // Filtro Vendedor (Obrigatório pela logica, mas validado no front)
            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
                params.push(vendedor);
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
            res.status(500).json({ success: false, message: 'Erro ao gerar relatório' });
        }
    });

    // --- Novo Relatório: Mapa por Produtos (Pivot) ---
    // Mostra vendas por produto/mês para uma indústria específica
    router.get('/produtos', async (req, res) => {
        try {
            const { start, end, industria, cliente } = req.query;

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            if (!industria || industria === 'ALL') {
                return res.status(400).json({ success: false, message: 'Indústria é obrigatória para este relatório' });
            }

            let params = [start, end, industria];
            let paramCounter = 4;
            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`,
                `p.ped_industria = $3`
            ];

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

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            if (!industria || industria === 'ALL') {
                return res.status(400).json({ success: false, message: 'Indústria é obrigatória para este relatório' });
            }

            let params = [start, end, industria];
            let paramCounter = 4;
            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`,
                `p.ped_industria = $3`
            ];

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

            // Filtro Vendedor
            if (vendedor && vendedor !== 'ALL') {
                conditions.push(`p.ped_vendedor = $${paramCounter}`);
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
                        SELECT DISTINCT ON (${groupCol})
                            ${groupCol} AS cliente,
                            ${isGrouped ? "NULL" : "c.cli_uf"} AS estado,
                            p.ped_totliq AS valor,
                            COALESCE((SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido), 0) AS qtd,
                            p.ped_data AS data_ultima,
                            CURRENT_DATE - p.ped_data::date AS dias
                        FROM pedidos p
                        JOIN clientes c ON p.ped_cliente = c.cli_codigo
                        WHERE ${conditions.join(' AND ')} ${groupFilter}
                        ORDER BY ${groupCol}, p.ped_data DESC
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
                        SUM(p.ped_totliq) AS valor,
                        SUM(COALESCE((SELECT SUM(ite_quant) FROM itens_ped WHERE ite_pedido = p.ped_pedido), 0)) AS qtd,
                        MAX(p.ped_data) AS data_ultima,
                        CURRENT_DATE - MAX(p.ped_data)::date AS dias
                    FROM pedidos p
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    WHERE ${conditions.join(' AND ')} ${groupFilter}
                    GROUP BY ${groupCol}${isGrouped ? '' : ', c.cli_uf'}
                    ORDER BY dias ASC, cliente
                `;
            }

            console.log("Executando relatório de últimas compras, modo:", modo, "params:", params);

            const result = await pool.query(query, params);

            const data = result.rows.map(row => ({
                ...row,
                valor: parseFloat(row.valor) || 0,
                qtd: parseInt(row.qtd) || 0,
                dias: parseInt(row.dias) || 0,
                data_ultima: row.data_ultima
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
            const { start, end, industria, cliente } = req.query;

            if (!start || !end) {
                return res.status(400).json({ success: false, message: 'Período é obrigatório' });
            }

            if (!industria || industria === 'ALL') {
                return res.status(400).json({ success: false, message: 'Indústria é obrigatória para este relatório' });
            }

            let params = [start, end, industria];
            let paramCounter = 4;
            let conditions = [
                `p.ped_data BETWEEN $1 AND $2`,
                `p.ped_situacao IN ('P', 'F')`,
                `p.ped_industria = $3`
            ];

            // Filtro Cliente (Opcional)
            if (cliente && cliente !== 'ALL') {
                conditions.push(`p.ped_cliente = $${paramCounter}`);
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

            if (!anoBase || !industria) {
                return res.status(400).json({
                    success: false,
                    message: 'Ano base e indústria são obrigatórios'
                });
            }

            const baseYear = parseInt(anoBase);
            const year1 = baseYear;
            const year2 = baseYear - 1;
            const year3 = baseYear - 2;

            // Montar query base
            let params = [industria];
            let paramCounter = 2;
            let conditions = [
                `p.ped_situacao IN ('P', 'F')`,
                `p.ped_industria = $1`,
                `EXTRACT(YEAR FROM p.ped_data) IN (${year1}, ${year2}, ${year3})`
            ];

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
                `SELECT * FROM fn_itens_nunca_comprados($1, $2)`,
                [industria, cliente]
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
                `SELECT * FROM fn_comparativo_clientes($1, $2, $3, $4, $5, $6)`,
                [industria, clienteRef, clienteAlvo, dataInicial, dataFinal, modo]
            );

            res.json({ success: true, data: result.rows });
        } catch (error) {
            console.error('❌ Erro no comparativo de clientes:', error);
            res.status(500).json({ success: false, message: 'Erro ao gerar comparativo', detail: error.message });
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

            const result = await pool.query(
                `SELECT * FROM fn_mapa_cliente_geral($1, $2, $3, $4, $5)`,
                [dataInicial, dataFinal, industria, cliente, grupo === 'true']
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

            console.log(`🔎 [GRUPO LOJAS] Ind=${industria}, Period=${dataInicial} to ${dataFinal}`);

            if (!industria || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
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

            console.log(`🔎 [UNICA COMPRA] Ind=${industria}, Period=${dataInicial} to ${dataFinal}`);

            if (!industria || !dataInicial || !dataFinal) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
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

            console.log(`🔎 [CLIENTES MOM] Ind=${industria}, Period=${mes}/${ano}, FullYear=${anoTodo}, GroupRede=${redeLojas}`);

            if (!industria || !mes || !ano) {
                return res.status(400).json({ success: false, message: 'Parâmetros obrigatórios faltando' });
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

    return router;
};
