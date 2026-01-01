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
CREATE OR REPLACE FUNCTION get_industry_performance_stats(varIdFor INTEGER)
RETURNS TABLE (
    industria TEXT,
    qtd_pedidos BIGINT,
    percentual_volume NUMERIC,
    ticket_medio_industria NUMERIC,
    ticket_medio_geral NUMERIC,
    diferenca_ticket_perc NUMERIC,
    crescimento_trimestral NUMERIC,
    faturamento_12m NUMERIC,
    faturamento_trim_atual NUMERIC,
    faturamento_trim_anterior NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Vendas totais dos últimos 12 meses
    vendas_12_meses AS (
        SELECT 
            COUNT(*) as total_pedidos,
            SUM(ped_totliq) as valor_total,
            AVG(ped_totliq) as ticket_medio_geral
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND ped_situacao IN ('P', 'F')
    ),

    -- Vendas da indústria específica nos últimos 12 meses
    vendas_industria_12m AS (
        SELECT 
            f.for_codigo,
            f.for_nomered as for_nome,
            COUNT(*) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total,
            AVG(p.ped_totliq) as ticket_medio
        FROM pedidos p
        INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
        WHERE f.for_codigo = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY f.for_codigo, f.for_nomered
    ),

    -- Vendas do trimestre atual
    vendas_trimestre_atual AS (
        SELECT 
            COALESCE(SUM(p.ped_totliq), 0) as valor_trimestre
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '3 months'
          AND p.ped_situacao IN ('P', 'F')
    ),

    -- Vendas do trimestre anterior (3-6 meses atrás)
    vendas_trimestre_anterior AS (
        SELECT 
            COALESCE(SUM(p.ped_totliq), 0) as valor_trimestre
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
          AND p.ped_data < CURRENT_DATE - INTERVAL '3 months'
          AND p.ped_situacao IN ('P', 'F')
    )

    -- Resultado final
    SELECT 
        vi.for_nome::TEXT as industria,
        vi.qtd_pedidos,
        
        -- Percentual do volume total (por quantidade de pedidos)
        ROUND((vi.qtd_pedidos::numeric * 100.0) / NULLIF(vt.total_pedidos, 0), 1) as percentual_volume,
        
        -- Ticket médio da indústria
        ROUND(vi.ticket_medio::numeric, 2) as ticket_medio_industria,
        
        -- Ticket médio geral
        ROUND(vt.ticket_medio_geral::numeric, 2) as ticket_medio_geral,
        
        -- Diferença percentual do ticket médio
        ROUND(((vi.ticket_medio - vt.ticket_medio_geral) / NULLIF(vt.ticket_medio_geral, 0) * 100)::numeric, 0) as diferenca_ticket_perc,
        
        -- Crescimento vs trimestre anterior
        CASE 
            WHEN vtp.valor_trimestre > 0 THEN
                ROUND(((vta.valor_trimestre - vtp.valor_trimestre) / vtp.valor_trimestre * 100)::numeric, 0)
            ELSE 0
        END as crescimento_trimestral,
        
        -- Valores absolutos para contexto
        ROUND(vi.valor_total::numeric, 2) as faturamento_12m,
        ROUND(vta.valor_trimestre::numeric, 2) as faturamento_trim_atual,
        ROUND(vtp.valor_trimestre::numeric, 2) as faturamento_trim_anterior
        
    FROM vendas_industria_12m vi
    CROSS JOIN vendas_12_meses vt
    CROSS JOIN vendas_trimestre_atual vta
    CROSS JOIN vendas_trimestre_anterior vtp;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
    try {
        await pool.query(createFunctionSQL);
        console.log('✅ Function get_industry_performance_stats created successfully!');
    } catch (error) {
        console.error('❌ Error creating function:', error);
    } finally {
        await pool.end();
    }
}

deploy();
