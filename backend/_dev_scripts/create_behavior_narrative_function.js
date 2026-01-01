const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'basesales',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '@12Pilabo',
});

const createFunctionSQL = `
CREATE OR REPLACE FUNCTION get_industry_behavior_stats(varIdFor INTEGER)
RETURNS TABLE (
    mes_pico TEXT,
    percentual_mes_pico INTEGER,
    total_clientes BIGINT,
    taxa_recorrencia INTEGER,
    cliente_principal TEXT,
    concentracao_principal INTEGER,
    pedidos_cliente_principal BIGINT,
    clientes_baixo_ticket BIGINT,
    clientes_medio_ticket BIGINT,
    clientes_alto_ticket BIGINT,
    clientes_premium BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Análise de sazonalidade (picos mensais) nos últimos 12 meses
    pedidos_por_mes AS (
        SELECT 
            TO_CHAR(p.ped_data, 'TMMonth') as mes_nome,
            TO_CHAR(p.ped_data, 'MM') as mes_num,
            EXTRACT(MONTH FROM p.ped_data) as mes_ordem,
            COUNT(*) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 
            TO_CHAR(p.ped_data, 'TMMonth'),
            TO_CHAR(p.ped_data, 'MM'),
            EXTRACT(MONTH FROM p.ped_data)
    ),

    -- Identificar mês com maior volume
    mes_pico_cte AS (
        SELECT 
            ppm.mes_nome,
            ppm.qtd_pedidos,
            ROUND((ppm.qtd_pedidos::numeric * 100.0) / NULLIF((SELECT SUM(pm.qtd_pedidos)::numeric FROM pedidos_por_mes pm), 0), 0)::INTEGER as percentual_volume
        FROM pedidos_por_mes ppm
        ORDER BY ppm.qtd_pedidos DESC
        LIMIT 1
    ),

    -- Análise de clientes: quantidade e recorrência
    clientes_analise AS (
        SELECT 
            p.ped_cliente,
            c.cli_nomred,
            COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total,
            MIN(p.ped_data) as primeira_compra,
            MAX(p.ped_data) as ultima_compra,
            CASE WHEN COUNT(DISTINCT p.ped_numero) > 1 THEN 1 ELSE 0 END as eh_recorrente
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY p.ped_cliente, c.cli_nomred
    ),

    -- Resumo de clientes
    resumo_clientes AS (
        SELECT 
            COUNT(*) as total_clientes,
            SUM(ca.eh_recorrente) as clientes_recorrentes,
            COALESCE(ROUND((SUM(ca.eh_recorrente)::numeric * 100.0) / NULLIF(COUNT(*)::numeric, 0), 0), 0)::INTEGER as taxa_recorrencia
        FROM clientes_analise ca
    ),

    -- Faturamento total da indústria
    faturamento_total AS (
        SELECT SUM(ca.valor_total) as total
        FROM clientes_analise ca
    ),

    -- Cliente que mais fatura (oportunidade de concentração)
    cliente_principal_cte AS (
        SELECT 
            ca.cli_nomred,
            ca.valor_total,
            COALESCE(ROUND((ca.valor_total::numeric * 100.0) / NULLIF((SELECT ft.total::numeric FROM faturamento_total ft), 0), 0), 0)::INTEGER as percentual_faturamento,
            ca.qtd_pedidos
        FROM clientes_analise ca
        ORDER BY ca.valor_total DESC
        LIMIT 1
    ),

    -- Distribuição de clientes por faixa de ticket
    distribuicao_ticket AS (
        SELECT 
            CASE 
                WHEN ca.valor_total < 5000 THEN 'Baixo'
                WHEN ca.valor_total < 20000 THEN 'Médio'
                WHEN ca.valor_total < 50000 THEN 'Alto'
                ELSE 'Premium'
            END as faixa_ticket,
            COUNT(*) as qtd_clientes
        FROM clientes_analise ca
        GROUP BY 
            CASE 
                WHEN ca.valor_total < 5000 THEN 'Baixo'
                WHEN ca.valor_total < 20000 THEN 'Médio'
                WHEN ca.valor_total < 50000 THEN 'Alto'
                ELSE 'Premium'
            END
    )

    -- Resultado consolidado
    SELECT 
        -- Padrão de sazonalidade
        COALESCE(mp.mes_nome, 'N/A')::TEXT as mes_pico,
        COALESCE(mp.percentual_volume, 0) as percentual_mes_pico,
        
        -- Dados de clientes
        COALESCE(rc.total_clientes, 0) as total_clientes,
        COALESCE(rc.taxa_recorrencia, 0) as taxa_recorrencia,
        
        -- Cliente principal
        COALESCE(cp.cli_nomred, 'N/A')::TEXT as cliente_principal,
        COALESCE(cp.percentual_faturamento, 0) as concentracao_principal,
        COALESCE(cp.qtd_pedidos, 0) as pedidos_cliente_principal,
        
        -- Oportunidade: quantidade de clientes em cada faixa
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Baixo'), 0) as clientes_baixo_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Médio'), 0) as clientes_medio_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Alto'), 0) as clientes_alto_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Premium'), 0) as clientes_premium

    FROM mes_pico_cte mp
    CROSS JOIN resumo_clientes rc
    CROSS JOIN cliente_principal_cte cp;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
    try {
        await pool.query(createFunctionSQL);
        console.log('✅ Function get_industry_behavior_stats created successfully!');
    } catch (error) {
        console.error('❌ Error creating function:', error);
    } finally {
        await pool.end();
    }
}

deploy();
