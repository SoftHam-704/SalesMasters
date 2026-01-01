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
CREATE OR REPLACE FUNCTION get_industry_alerts_stats(vIdFor INTEGER)
RETURNS TABLE (
    qtd_pendentes BIGINT,
    valor_total_pendente NUMERIC,
    dias_medio_aberto NUMERIC,
    prazo_medio_conversao NUMERIC,
    pedido_critico TEXT,
    valor_pedido_critico NUMERIC,
    dias_critico INTEGER,
    nivel_urgencia TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Pedidos pendentes de faturamento da indústria
    pedidos_pendentes AS (
        SELECT 
            p.ped_numero::TEXT,
            p.ped_data,
            p.ped_totliq,
            (CURRENT_DATE - p.ped_data::date)::INTEGER as dias_em_aberto
        FROM pedidos p
        WHERE p.ped_industria = vIdFor
          AND p.ped_situacao = 'P'
        ORDER BY p.ped_data ASC
    ),

    -- Resumo dos pedidos pendentes
    resumo_pendentes AS (
        SELECT 
            COUNT(*) as qtd_pendentes,
            COALESCE(SUM(ped_totliq), 0) as valor_total_pendente,
            ROUND(AVG(dias_em_aberto)::numeric, 0) as dias_medio_aberto
        FROM pedidos_pendentes
    ),

    -- Pedidos já faturados (para calcular prazo médio de conversão)
    pedidos_faturados AS (
        SELECT 
            AVG(p.ped_datafat::date - p.ped_data::date) as prazo_medio_conversao
        FROM pedidos p
        WHERE p.ped_industria = vIdFor
          AND p.ped_situacao = 'F'
          AND p.ped_datafat IS NOT NULL
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
    ),

    -- Pedido mais antigo pendente (alerta crítico)
    pedido_mais_antigo AS (
        SELECT 
            pp.ped_numero,
            pp.ped_totliq,
            pp.dias_em_aberto
        FROM pedidos_pendentes pp
        ORDER BY pp.dias_em_aberto DESC
        LIMIT 1
    )

    -- Resultado final
    SELECT 
        rp.qtd_pendentes,
        ROUND(rp.valor_total_pendente::numeric, 2) as valor_total_pendente,
        rp.dias_medio_aberto,
        
        -- Prazo médio de conversão histórico
        COALESCE(ROUND(pf.prazo_medio_conversao::numeric, 0), 0) as prazo_medio_conversao,
        
        -- Pedido crítico (mais antigo)
        COALESCE(pma.ped_numero, '—') as pedido_critico,
        COALESCE(ROUND(pma.ped_totliq::numeric, 2), 0) as valor_pedido_critico,
        COALESCE(pma.dias_em_aberto, 0) as dias_critico,
        
        -- Classificação de urgência
        CASE 
            WHEN pma.dias_em_aberto > 30 THEN 'URGENTE'
            WHEN pma.dias_em_aberto > 15 THEN 'ATENÇÃO'
            WHEN pma.dias_em_aberto IS NOT NULL THEN 'NORMAL'
            ELSE 'SEM PENDÊNCIAS'
        END as nivel_urgencia

    FROM resumo_pendentes rp
    LEFT JOIN pedidos_faturados pf ON true
    LEFT JOIN pedido_mais_antigo pma ON true;
END;
$$ LANGUAGE plpgsql;
`;

async function deploy() {
    try {
        await pool.query(createFunctionSQL);
        console.log('✅ Function get_industry_alerts_stats created successfully!');
    } catch (error) {
        console.error('❌ Error creating function:', error);
    } finally {
        await pool.end();
    }
}

deploy();
