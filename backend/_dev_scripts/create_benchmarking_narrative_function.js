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
CREATE OR REPLACE FUNCTION get_industry_benchmarking_stats(varIdFor INTEGER)
RETURNS TABLE (
    industria TEXT,
    ticket_medio_industria NUMERIC,
    qtd_pedidos BIGINT,
    qtd_clientes BIGINT,
    ticket_medio_mercado NUMERIC,
    pedidos_medio_mercado NUMERIC,
    clientes_medio_mercado NUMERIC,
    diferenca_ticket_perc INTEGER,
    diferenca_volume_perc INTEGER,
    taxa_conversao INTEGER,
    tempo_fechamento_dias INTEGER,
    tempo_mercado_dias INTEGER,
    classificacao_ticket TEXT,
    classificacao_tempo TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Performance da indústria selecionada
    industria_performance AS (
        SELECT 
            f.for_codigo,
            f.for_nomered as for_nome,
            COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
            ROUND(AVG(p.ped_totliq)::numeric, 2) as ticket_medio,
            COUNT(DISTINCT p.ped_cliente) as qtd_clientes,
            ROUND(SUM(p.ped_totliq)::numeric, 2) as faturamento_total
        FROM pedidos p
        INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
        WHERE f.for_codigo = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY f.for_codigo, f.for_nomered
    ),

    -- Média geral de todas as indústrias (benchmark)
    media_geral AS (
        SELECT 
            ROUND(AVG(sub.ticket_medio)::numeric, 2) as ticket_medio_mercado,
            ROUND(AVG(sub.qtd_pedidos)::numeric, 0) as pedidos_medio_mercado,
            ROUND(AVG(sub.qtd_clientes)::numeric, 0) as clientes_medio_mercado
        FROM (
            SELECT 
                p.ped_industria,
                AVG(p.ped_totliq) as ticket_medio,
                COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
                COUNT(DISTINCT p.ped_cliente) as qtd_clientes
            FROM pedidos p
            WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_industria
        ) sub
    ),

    -- Tempo médio de fechamento (diferença entre data de criação e data de envio)
    tempo_fechamento AS (
        SELECT 
            ROUND(AVG(EXTRACT(DAY FROM (p.ped_dataenvio - p.ped_data)))::numeric, 0) as dias_medio_fechamento
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_dataenvio IS NOT NULL
    ),

    -- Tempo médio geral do mercado
    tempo_fechamento_mercado AS (
        SELECT 
            ROUND(AVG(EXTRACT(DAY FROM (p.ped_dataenvio - p.ped_data)))::numeric, 0) as dias_medio_mercado
        FROM pedidos p
        WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_dataenvio IS NOT NULL
    ),

    -- Taxa de conversão (Faturados vs Total)
    taxa_conversao_cte AS (
        SELECT 
            COUNT(DISTINCT CASE WHEN p.ped_situacao = 'F' THEN p.ped_numero END) as pedidos_convertidos,
            COUNT(DISTINCT p.ped_numero) as total_pedidos,
            ROUND(
                COUNT(DISTINCT CASE WHEN p.ped_situacao = 'F' THEN p.ped_numero END)::numeric * 100.0 / 
                NULLIF(COUNT(DISTINCT p.ped_numero)::numeric, 0),
                0
            )::INTEGER as taxa_conversao_perc
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
    )

    SELECT 
        -- Dados da indústria
        ip.for_nome::TEXT as industria,
        ip.ticket_medio as ticket_medio_industria,
        ip.qtd_pedidos,
        ip.qtd_clientes,
        
        -- Benchmark do mercado
        mg.ticket_medio_mercado,
        mg.pedidos_medio_mercado,
        mg.clientes_medio_mercado,
        
        -- Diferenças percentuais
        ROUND(
            ((ip.ticket_medio - mg.ticket_medio_mercado) / NULLIF(mg.ticket_medio_mercado, 0) * 100)::numeric,
            0
        )::INTEGER as diferenca_ticket_perc,
        
        ROUND(
            ((ip.qtd_pedidos::numeric - mg.pedidos_medio_mercado) / NULLIF(mg.pedidos_medio_mercado, 0) * 100)::numeric,
            0
        )::INTEGER as diferenca_volume_perc,
        
        -- Taxa de conversão
        COALESCE(tc.taxa_conversao_perc, 0)::INTEGER as taxa_conversao,
        
        -- Tempo médio de fechamento
        COALESCE(tf.dias_medio_fechamento, 0)::INTEGER as tempo_fechamento_dias,
        COALESCE(tfm.dias_medio_mercado, 0)::INTEGER as tempo_mercado_dias,
        
        -- Classificação de performance
        (CASE 
            WHEN ip.ticket_medio > mg.ticket_medio_mercado THEN '✅ Acima da Média'
            WHEN ip.ticket_medio = mg.ticket_medio_mercado THEN '➡️ Na Média'
            ELSE '⚠️ Abaixo da Média'
        END)::TEXT as classificacao_ticket,
        
        (CASE 
            WHEN COALESCE(tf.dias_medio_fechamento, 0) <= COALESCE(tfm.dias_medio_mercado, 0) THEN '✅ Eficiente'
            ELSE '⚠️ Pode Melhorar'
        END)::TEXT as classificacao_tempo

    FROM industria_performance ip
    CROSS JOIN media_geral mg
    LEFT JOIN tempo_fechamento tf ON true
    LEFT JOIN tempo_fechamento_mercado tfm ON true
    LEFT JOIN taxa_conversao_cte tc ON true;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
    try {
        await pool.query(createFunctionSQL);
        console.log('✅ Function get_industry_benchmarking_stats created successfully!');
    } catch (error) {
        console.error('❌ Error creating function:', error);
    } finally {
        await pool.end();
    }
}

deploy();
