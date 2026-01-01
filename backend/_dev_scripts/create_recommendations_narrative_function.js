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
CREATE OR REPLACE FUNCTION get_industry_recommendations_stats(varIdFor INTEGER)
RETURNS TABLE (
    qtd_pendentes BIGINT,
    valor_pendente NUMERIC,
    pedidos_urgentes BIGINT,
    qtd_alto_valor BIGINT,
    valor_total_alto NUMERIC,
    clientes_inativos BIGINT,
    potencial_reativacao NUMERIC,
    clientes_baixo_ticket BIGINT,
    ticket_medio_atual NUMERIC,
    clientes_concentrados BIGINT,
    percentual_concentrado NUMERIC,
    prioridade_acao TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Pedidos pendentes que precisam de atenção
    pedidos_pendentes AS (
        SELECT 
            COUNT(*) as qtd_pendentes,
            ROUND(COALESCE(SUM(p.ped_totliq), 0)::numeric, 2) as valor_pendente
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_situacao = 'P'
          AND p.ped_data >= CURRENT_DATE - INTERVAL '90 days'
    ),

    -- 2. Pedidos de alto valor (risco financeiro)
    pedidos_alto_valor AS (
        SELECT 
            COUNT(*) as qtd_alto_valor,
            ROUND(COALESCE(SUM(p.ped_totliq), 0)::numeric, 2) as valor_total_alto
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_totliq > 10000
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
          AND p.ped_situacao = 'P'
    ),

    -- 3. Clientes inativos (oportunidade de reativação)
    clientes_inativos_cte AS (
        SELECT 
            COUNT(DISTINCT historico.ped_cliente) as qtd_inativos,
            ROUND(COALESCE(SUM(historico.valor_historico), 0)::numeric, 2) as potencial_reativacao
        FROM (
            SELECT 
                p.ped_cliente,
                MAX(p.ped_data) as ultima_compra,
                AVG(p.ped_totliq) as valor_historico
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '18 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING MAX(p.ped_data) < CURRENT_DATE - INTERVAL '90 days'
        ) historico
    ),

    -- 4. Pedidos com prazo crítico (urgência)
    pedidos_criticos AS (
        SELECT 
            COUNT(*) as qtd_criticos
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_situacao = 'P'
          AND CURRENT_DATE - p.ped_data::date > 30
    ),

    -- 5. Oportunidade de upsell (clientes com baixo ticket)
    ticket_medio_geral AS (
        SELECT AVG(p.ped_totliq) * 0.7 as limite_baixo
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
    ),
    
    oportunidade_upsell AS (
        SELECT 
            COUNT(DISTINCT sub.ped_cliente) as clientes_baixo_ticket,
            ROUND(COALESCE(AVG(sub.valor_cliente), 0)::numeric, 2) as ticket_medio_atual
        FROM (
            SELECT 
                p.ped_cliente,
                AVG(p.ped_totliq) as valor_cliente
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING AVG(p.ped_totliq) < (SELECT limite_baixo FROM ticket_medio_geral)
        ) sub
    ),

    -- 6. Análise de concentração de clientes
    faturamento_total AS (
        SELECT SUM(p.ped_totliq) as total
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
    ),
    
    concentracao_risco AS (
        SELECT 
            COUNT(*) as clientes_concentrados,
            ROUND(COALESCE(SUM(sub.percentual_faturamento), 0)::numeric, 1) as percentual_concentrado
        FROM (
            SELECT 
                p.ped_cliente,
                SUM(p.ped_totliq) * 100.0 / NULLIF((SELECT total FROM faturamento_total), 0) as percentual_faturamento
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING SUM(p.ped_totliq) * 100.0 / NULLIF((SELECT total FROM faturamento_total), 0) > 20
        ) sub
    )

    SELECT 
        -- Recomendação 1: Pedidos pendentes
        COALESCE(pp.qtd_pendentes, 0) as qtd_pendentes,
        COALESCE(pp.valor_pendente, 0) as valor_pendente,
        COALESCE(pc.qtd_criticos, 0) as pedidos_urgentes,
        
        -- Recomendação 2: Pedidos alto valor
        COALESCE(pav.qtd_alto_valor, 0) as qtd_alto_valor,
        COALESCE(pav.valor_total_alto, 0) as valor_total_alto,
        
        -- Recomendação 3: Clientes inativos
        COALESCE(ci.qtd_inativos, 0) as clientes_inativos,
        COALESCE(ci.potencial_reativacao, 0) as potencial_reativacao,
        
        -- Recomendação 4: Oportunidade upsell
        COALESCE(ou.clientes_baixo_ticket, 0) as clientes_baixo_ticket,
        COALESCE(ou.ticket_medio_atual, 0) as ticket_medio_atual,
        
        -- Recomendação 5: Risco de concentração
        COALESCE(cr.clientes_concentrados, 0) as clientes_concentrados,
        COALESCE(cr.percentual_concentrado, 0) as percentual_concentrado,
        
        -- Priorização de ações
        (CASE 
            WHEN COALESCE(pc.qtd_criticos, 0) > 0 THEN '🔴 URGENTE: Pedidos críticos'
            WHEN COALESCE(pp.qtd_pendentes, 0) > 5 THEN '🟡 ATENÇÃO: Muitos pendentes'
            WHEN COALESCE(ci.qtd_inativos, 0) > 10 THEN '🟠 IMPORTANTE: Reativar clientes'
            ELSE '🟢 NORMAL: Monitorar'
        END)::TEXT as prioridade_acao

    FROM pedidos_pendentes pp
    CROSS JOIN pedidos_alto_valor pav
    CROSS JOIN clientes_inativos_cte ci
    CROSS JOIN pedidos_criticos pc
    CROSS JOIN oportunidade_upsell ou
    CROSS JOIN concentracao_risco cr;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
    try {
        await pool.query(createFunctionSQL);
        console.log('✅ Function get_industry_recommendations_stats created successfully!');
    } catch (error) {
        console.error('❌ Error creating function:', error);
    } finally {
        await pool.end();
    }
}

deploy();
