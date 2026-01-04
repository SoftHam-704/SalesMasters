-- =====================================================
-- SCRIPT COMPLETO - DASHBOARD DE COLABORADORES
-- =====================================================
-- Execute este script no pgAdmin para criar:
-- 1. Funções SQL (4 funções)
-- 2. Índices de performance (12 índices)
-- 3. Atualização de estatísticas
-- 
-- Data: 04/01/2026
-- Banco: basesales
-- =====================================================

-- =====================================================
-- PARTE 1: CRIAÇÃO DAS FUNÇÕES SQL
-- =====================================================

-- =====================================================
-- FUNÇÃO 1: PERFORMANCE COMPLETA DE VENDEDORES
-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_performance(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_performance(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    total_vendas_mes DOUBLE PRECISION,
    total_vendas_mes_anterior DOUBLE PRECISION,
    variacao_mom_percent DOUBLE PRECISION,
    qtd_pedidos INTEGER,
    ticket_medio DOUBLE PRECISION,
    meta_mes DOUBLE PRECISION,
    perc_atingimento_meta DOUBLE PRECISION,
    ranking INTEGER,
    clientes_ativos INTEGER,
    clientes_novos INTEGER,
    clientes_perdidos INTEGER,
    dias_desde_ultima_venda INTEGER,
    total_interacoes_crm INTEGER,
    status VARCHAR
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_mes_anterior INTEGER;
    v_ano_anterior INTEGER;
BEGIN
    -- Calcula mês e ano anterior
    IF p_mes = 1 THEN
        v_mes_anterior := 12;
        v_ano_anterior := p_ano - 1;
    ELSE
        v_mes_anterior := p_mes - 1;
        v_ano_anterior := p_ano;
    END IF;

    RETURN QUERY
    WITH vendas_mes_atual AS (
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_pedido) AS qtd_ped,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_cliente) AS clientes_unicos,
            MAX(ped_data) AS ultima_venda
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    vendas_mes_anterior AS (
        SELECT 
            ped_vendedor,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = v_ano_anterior
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = v_mes_anterior
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_ativos AS (
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_novos AS (
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS qtd
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM p.ped_data + INTERVAL '1 day') = p_mes
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
          AND NOT EXISTS (
              SELECT 1 FROM pedidos p2
              WHERE p2.ped_cliente = p.ped_cliente
                AND p2.ped_data < DATE_TRUNC('month', MAKE_DATE(p_ano, p_mes, 1))
                AND p2.ped_situacao IN ('P', 'F')
          )
        GROUP BY p.ped_vendedor
    ),
    clientes_perdidos AS (
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data < CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
          AND ped_cliente NOT IN (
              SELECT DISTINCT ped_cliente 
              FROM pedidos 
              WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
                AND ped_situacao IN ('P', 'F')
          )
        GROUP BY ped_vendedor
    ),
    metas AS (
        SELECT 
            met_vendedor,
            CASE p_mes
                WHEN 1 THEN met_jan
                WHEN 2 THEN met_fev
                WHEN 3 THEN met_mar
                WHEN 4 THEN met_abr
                WHEN 5 THEN met_mai
                WHEN 6 THEN met_jun
                WHEN 7 THEN met_jul
                WHEN 8 THEN met_ago
                WHEN 9 THEN met_set
                WHEN 10 THEN met_out
                WHEN 11 THEN met_nov
                WHEN 12 THEN met_dez
            END AS meta_mes
        FROM vend_metas
        WHERE met_ano = p_ano
          AND (p_vendedor IS NULL OR met_vendedor = p_vendedor)
    ),
    interacoes_crm AS (
        SELECT 
            ven_codigo,
            COUNT(*) AS total_interacoes
        FROM crm_interacao
        WHERE EXTRACT(YEAR FROM data_hora) = p_ano
          AND EXTRACT(MONTH FROM data_hora) = p_mes
          AND (p_vendedor IS NULL OR ven_codigo = p_vendedor)
        GROUP BY ven_codigo
    ),
    metricas AS (
        SELECT 
            v.ven_codigo,
            v.ven_nome,
            COALESCE(vma.total, 0) AS vendas_mes,
            COALESCE(vme.total, 0) AS vendas_mes_anterior,
            COALESCE(vma.qtd_ped, 0)::INTEGER AS qtd_ped,
            CASE 
                WHEN COALESCE(vma.qtd_ped, 0) = 0 THEN 0
                ELSE ROUND((COALESCE(vma.total, 0) / vma.qtd_ped)::NUMERIC, 2)
            END AS tck_medio,
            COALESCE(m.meta_mes, 0) AS meta_val,
            COALESCE(ca.qtd, 0) AS cli_ativos,
            COALESCE(cn.qtd, 0) AS cli_novos,
            COALESCE(cp.qtd, 0) AS cli_perdidos,
            COALESCE(CURRENT_DATE - vma.ultima_venda, 999) AS dias_sem_venda,
            COALESCE(crm.total_interacoes, 0) AS interacoes,
            CASE 
                WHEN COALESCE(vme.total, 0) = 0 THEN 
                    CASE WHEN COALESCE(vma.total, 0) > 0 THEN 100.0 ELSE 0.0 END
                ELSE 
                    ROUND(((COALESCE(vma.total, 0) - vme.total) / vme.total * 100)::NUMERIC, 2)
            END AS mom,
            CASE 
                WHEN COALESCE(m.meta_mes, 0) = 0 THEN 0
                ELSE ROUND((COALESCE(vma.total, 0) / m.meta_mes * 100)::NUMERIC, 2)
            END AS perc_meta_val
        FROM vendedores v
        LEFT JOIN vendas_mes_atual vma ON vma.ped_vendedor = v.ven_codigo
        LEFT JOIN vendas_mes_anterior vme ON vme.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_ativos ca ON ca.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_novos cn ON cn.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_perdidos cp ON cp.ped_vendedor = v.ven_codigo
        LEFT JOIN metas m ON m.met_vendedor = v.ven_codigo
        LEFT JOIN interacoes_crm crm ON crm.ven_codigo = v.ven_codigo
        WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    )
    SELECT 
        ven_codigo,
        ven_nome,
        vendas_mes::DOUBLE PRECISION,
        vendas_mes_anterior::DOUBLE PRECISION,
        mom::DOUBLE PRECISION AS variacao_mom_percent,
        qtd_ped AS qtd_pedidos,
        tck_medio::DOUBLE PRECISION AS ticket_medio,
        meta_val::DOUBLE PRECISION AS meta_mes,
        perc_meta_val::DOUBLE PRECISION AS perc_atingimento_meta,
        RANK() OVER (ORDER BY vendas_mes DESC)::INTEGER AS ranking,
        cli_ativos::INTEGER AS clientes_ativos,
        cli_novos::INTEGER AS clientes_novos,
        cli_perdidos::INTEGER AS clientes_perdidos,
        dias_sem_venda::INTEGER AS dias_desde_ultima_venda,
        interacoes::INTEGER AS total_interacoes_crm,
        (CASE 
            WHEN perc_meta_val >= 100 THEN '🏆 Acima da Meta'
            WHEN perc_meta_val >= 80 THEN '✅ Na Meta'
            WHEN perc_meta_val >= 60 THEN '⚠️ Em Risco'
            ELSE '🔴 Crítico'
        END)::VARCHAR AS status
    FROM metricas
    ORDER BY vendas_mes DESC;
END;
$$;

-- =====================================================
-- FUNÇÃO 2: CLIENTES EM RISCO POR VENDEDOR
-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_clientes_risco(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_clientes_risco(
    p_vendedor INTEGER DEFAULT NULL,
    p_dias_sem_comprar INTEGER DEFAULT 60
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    cliente_codigo INTEGER,
    cliente_nome VARCHAR,
    ultima_compra DATE,
    dias_sem_comprar INTEGER,
    total_compras_historico BIGINT,
    valor_total_historico DOUBLE PRECISION,
    ticket_medio DOUBLE PRECISION,
    nivel_risco VARCHAR,
    recomendacao VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH ultima_compra_cliente AS (
        SELECT 
            ped_vendedor,
            ped_cliente,
            MAX(ped_data) AS ultima_compra,
            COUNT(DISTINCT ped_pedido) AS total_pedidos,
            SUM(ped_totliq) AS valor_total
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor, ped_cliente
    ),
    clientes_em_risco AS (
        SELECT 
            uc.ped_vendedor,
            uc.ped_cliente,
            uc.ultima_compra,
            CURRENT_DATE - uc.ultima_compra AS dias_sem_compra,
            uc.total_pedidos,
            uc.valor_total,
            ROUND((uc.valor_total / NULLIF(uc.total_pedidos, 0))::NUMERIC, 2) AS ticket_medio
        FROM ultima_compra_cliente uc
        WHERE CURRENT_DATE - uc.ultima_compra >= p_dias_sem_comprar
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        c.cli_codigo,
        c.cli_nomred,
        cr.ultima_compra,
        cr.dias_sem_compra::INTEGER,
        cr.total_pedidos::BIGINT,
        cr.valor_total::DOUBLE PRECISION,
        cr.ticket_medio::DOUBLE PRECISION,
        (CASE 
            WHEN cr.dias_sem_compra >= 120 THEN '🔴 Alto'
            WHEN cr.dias_sem_compra >= 90 THEN '🟡 Médio'
            ELSE '🟢 Baixo'
        END)::VARCHAR AS nivel_risco,
        (CASE 
            WHEN cr.dias_sem_compra >= 120 AND cr.valor_total > 50000 THEN 
                '📞 URGENTE: Cliente VIP sem comprar há ' || cr.dias_sem_compra || ' dias. Ligar imediatamente.'
            WHEN cr.dias_sem_compra >= 90 THEN 
                '📧 Enviar campanha de reativação + ligar.'
            WHEN cr.dias_sem_compra >= 60 AND cr.total_pedidos > 10 THEN 
                '💡 Cliente recorrente está distante. Agendar visita.'
            ELSE 
                '📅 Agendar contato nos próximos 7 dias.'
        END)::VARCHAR AS recomendacao
    FROM clientes_em_risco cr
    INNER JOIN vendedores v ON v.ven_codigo = cr.ped_vendedor
    INNER JOIN clientes c ON c.cli_codigo = cr.ped_cliente
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY cr.valor_total DESC, cr.dias_sem_compra DESC;
END;
$$;

-- =====================================================
-- FUNÇÃO 3: HISTÓRICO MENSAL DE VENDAS
-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_historico_mensal(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_historico_mensal(
    p_vendedor INTEGER,
    p_meses_retroativos INTEGER DEFAULT 12
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    ano INTEGER,
    mes INTEGER,
    mes_nome VARCHAR,
    total_vendas DOUBLE PRECISION,
    qtd_pedidos BIGINT,
    qtd_clientes BIGINT,
    ticket_medio DOUBLE PRECISION,
    meta_mes DOUBLE PRECISION,
    perc_atingimento DOUBLE PRECISION,
    tendencia VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH meses_series AS (
        SELECT 
            date_trunc('month', CURRENT_DATE - (n || ' months')::interval) AS mes_ref,
            EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS ano,
            EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS mes
        FROM generate_series(0, p_meses_retroativos - 1) AS n
    ),
    vendas_por_mes AS (
        SELECT 
            ped_vendedor,
            EXTRACT(YEAR FROM ped_data + INTERVAL '1 day')::INTEGER AS ano,
            EXTRACT(MONTH FROM ped_data + INTERVAL '1 day')::INTEGER AS mes,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_pedido) AS qtd_pedidos,
            COUNT(DISTINCT ped_cliente) AS qtd_clientes
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
          AND ped_vendedor = p_vendedor
          AND ped_data >= CURRENT_DATE - (p_meses_retroativos || ' months')::interval
        GROUP BY ped_vendedor, EXTRACT(YEAR FROM ped_data + INTERVAL '1 day'), EXTRACT(MONTH FROM ped_data + INTERVAL '1 day')
    ),
    metas_por_mes AS (
        SELECT 
            met_vendedor,
            met_ano,
            UNNEST(ARRAY[
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ]) AS meta_valor,
            UNNEST(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]) AS mes
        FROM vend_metas
        WHERE met_vendedor = p_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        ms.ano,
        ms.mes,
        CASE ms.mes
            WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END AS mes_nome,
        COALESCE(vpm.total, 0)::DOUBLE PRECISION AS total_vendas,
        COALESCE(vpm.qtd_pedidos, 0)::BIGINT AS qtd_pedidos,
        COALESCE(vpm.qtd_clientes, 0)::BIGINT AS qtd_clientes,
        (CASE 
            WHEN COALESCE(vpm.qtd_pedidos, 0) = 0 THEN 0
            ELSE ROUND((vpm.total / vpm.qtd_pedidos)::NUMERIC, 2)
        END)::DOUBLE PRECISION AS ticket_medio,
        COALESCE(m.meta_valor, 0)::DOUBLE PRECISION AS meta_mes,
        (CASE 
            WHEN COALESCE(m.meta_valor, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(vpm.total, 0) / m.meta_valor * 100)::NUMERIC, 2)
        END)::DOUBLE PRECISION AS perc_atingimento,
        (CASE 
            WHEN LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) IS NULL THEN '→'
            WHEN vpm.total > LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 1.05 THEN '📈 Subindo'
            WHEN vpm.total < LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 0.95 THEN '📉 Caindo'
            ELSE '→ Estável'
        END)::VARCHAR AS tendencia
    FROM vendedores v
    CROSS JOIN meses_series ms
    LEFT JOIN vendas_por_mes vpm ON vpm.ped_vendedor = v.ven_codigo 
        AND vpm.ano = ms.ano AND vpm.mes = ms.mes
    LEFT JOIN metas_por_mes m ON m.met_vendedor = v.ven_codigo 
        AND m.met_ano = ms.ano AND m.mes = ms.mes
    WHERE v.ven_codigo = p_vendedor
    ORDER BY ms.ano DESC, ms.mes DESC;
END;
$$;

-- =====================================================
-- FUNÇÃO 4: ANÁLISE DE INTERAÇÕES CRM
-- =====================================================

DROP FUNCTION IF EXISTS fn_vendedores_interacoes_crm(INTEGER, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION fn_vendedores_interacoes_crm(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    total_interacoes BIGINT,
    interacoes_telefone BIGINT,
    interacoes_email BIGINT,
    interacoes_visita BIGINT,
    interacoes_whatsapp BIGINT,
    duracao_media_minutos DOUBLE PRECISION,
    proximas_acoes_pendentes BIGINT,
    taxa_conversao DOUBLE PRECISION,
    ultima_interacao TIMESTAMP,
    produtividade VARCHAR
) 
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH interacoes AS (
        SELECT 
            crm.ven_codigo,
            COUNT(*) AS total,
            SUM(CASE WHEN crm.tipo_interacao_id = 1 THEN 1 ELSE 0 END) AS telefone,
            SUM(CASE WHEN crm.tipo_interacao_id = 2 THEN 1 ELSE 0 END) AS email,
            SUM(CASE WHEN crm.tipo_interacao_id = 3 THEN 1 ELSE 0 END) AS visita,
            SUM(CASE WHEN crm.tipo_interacao_id = 4 THEN 1 ELSE 0 END) AS whatsapp,
            AVG(COALESCE(crm.duracao_minutos, 0)) AS duracao_media,
            MAX(crm.data_hora) AS ultima_interacao,
            COUNT(CASE WHEN crm.proxima_acao_em IS NOT NULL 
                         AND crm.proxima_acao_em >= CURRENT_DATE THEN 1 END) AS acoes_pendentes
        FROM crm_interacao crm
        WHERE EXTRACT(YEAR FROM crm.data_hora) = p_ano
          AND EXTRACT(MONTH FROM crm.data_hora) = p_mes
          AND (p_vendedor IS NULL OR crm.ven_codigo = p_vendedor)
        GROUP BY crm.ven_codigo
    ),
    conversoes AS (
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS clientes_vendidos
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM p.ped_data + INTERVAL '1 day') = p_mes
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
          AND EXISTS (
              SELECT 1 FROM crm_interacao crm
              WHERE crm.cli_codigo = p.ped_cliente
                AND crm.data_hora <= p.ped_data
                AND crm.data_hora >= p.ped_data - INTERVAL '30 days'
          )
        GROUP BY p.ped_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        COALESCE(i.total, 0)::BIGINT AS total_interacoes,
        COALESCE(i.telefone, 0)::BIGINT AS interacoes_telefone,
        COALESCE(i.email, 0)::BIGINT AS interacoes_email,
        COALESCE(i.visita, 0)::BIGINT AS interacoes_visita,
        COALESCE(i.whatsapp, 0)::BIGINT AS interacoes_whatsapp,
        ROUND(COALESCE(i.duracao_media, 0)::NUMERIC, 2)::DOUBLE PRECISION AS duracao_media_minutos,
        COALESCE(i.acoes_pendentes, 0)::BIGINT AS proximas_acoes_pendentes,
        (CASE 
            WHEN COALESCE(i.total, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(c.clientes_vendidos, 0)::NUMERIC / i.total * 100), 2)
        END)::DOUBLE PRECISION AS taxa_conversao,
        i.ultima_interacao,
        (CASE 
            WHEN COALESCE(i.total, 0) >= 50 THEN '🔥 Alta'
            WHEN COALESCE(i.total, 0) >= 20 THEN '✅ Boa'
            WHEN COALESCE(i.total, 0) >= 10 THEN '⚠️ Baixa'
            ELSE '🔴 Muito Baixa'
        END)::VARCHAR AS produtividade
    FROM vendedores v
    LEFT JOIN interacoes i ON i.ven_codigo = v.ven_codigo
    LEFT JOIN conversoes c ON c.ped_vendedor = v.ven_codigo
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY total_interacoes DESC;
END;
$$;

-- =====================================================
-- PARTE 2: CRIAÇÃO DOS ÍNDICES DE PERFORMANCE
-- =====================================================

-- ÍNDICE 1: COVERING INDEX PRINCIPAL
DROP INDEX IF EXISTS idx_pedidos_vendedor_situacao_data_covering;
CREATE INDEX idx_pedidos_vendedor_situacao_data_covering 
ON pedidos (ped_vendedor, ped_situacao, ped_data)
INCLUDE (ped_totliq, ped_pedido, ped_cliente, ped_industria)
WHERE ped_situacao IN ('P', 'F');

-- ÍNDICE 2: TEMPORAL (YEAR + MONTH)
DROP INDEX IF EXISTS idx_pedidos_year_month_vendedor;
CREATE INDEX idx_pedidos_year_month_vendedor 
ON pedidos (
    (EXTRACT(YEAR FROM ped_data)),
    (EXTRACT(MONTH FROM ped_data)),
    ped_vendedor
)
WHERE ped_situacao IN ('P', 'F');

-- ÍNDICE 3: CLIENTES EM RISCO
DROP INDEX IF EXISTS idx_pedidos_cliente_vendedor_data;
CREATE INDEX idx_pedidos_cliente_vendedor_data 
ON pedidos (ped_cliente, ped_vendedor, ped_data DESC)
WHERE ped_situacao IN ('P', 'F');

-- ÍNDICE 4: DATA RANGE
DROP INDEX IF EXISTS idx_pedidos_data_vendedor;
CREATE INDEX idx_pedidos_data_vendedor 
ON pedidos (ped_data DESC, ped_vendedor)
WHERE ped_situacao IN ('P', 'F');

-- ÍNDICE 5: VENDEDORES NOME
DROP INDEX IF EXISTS idx_vendedores_nome;
CREATE INDEX idx_vendedores_nome ON vendedores (ven_nome);

-- ÍNDICE 6: METAS (vendedor + ano)
DROP INDEX IF EXISTS idx_vend_metas_vendedor_ano;
CREATE INDEX idx_vend_metas_vendedor_ano ON vend_metas (met_vendedor, met_ano);

-- ÍNDICE 7: METAS (apenas ano)
DROP INDEX IF EXISTS idx_vend_metas_ano;
CREATE INDEX idx_vend_metas_ano ON vend_metas (met_ano);

-- ÍNDICE 8: CRM PRINCIPAL
DROP INDEX IF EXISTS idx_crm_vendedor_data;
CREATE INDEX idx_crm_vendedor_data 
ON crm_interacao (ven_codigo, data_hora DESC)
INCLUDE (tipo_interacao_id, duracao_minutos, cli_codigo);

-- ÍNDICE 9: CRM TEMPORAL
DROP INDEX IF EXISTS idx_crm_year_month_vendedor;
CREATE INDEX idx_crm_year_month_vendedor 
ON crm_interacao (
    (EXTRACT(YEAR FROM data_hora)),
    (EXTRACT(MONTH FROM data_hora)),
    ven_codigo
);

-- ÍNDICE 10: CRM CLIENTE + DATA
DROP INDEX IF EXISTS idx_crm_cliente_data;
CREATE INDEX idx_crm_cliente_data 
ON crm_interacao (cli_codigo, data_hora DESC)
WHERE cli_codigo IS NOT NULL;

-- ÍNDICE 11: CRM PRÓXIMAS AÇÕES (removido - CURRENT_DATE não é IMMUTABLE)
-- Não é possível criar índice parcial com função que muda (CURRENT_DATE)
-- O índice idx_crm_vendedor_data já cobre essas queries

-- =====================================================
-- PARTE 3: ATUALIZAÇÃO DE ESTATÍSTICAS
-- =====================================================

ANALYZE vendedores;
ANALYZE pedidos;
ANALYZE vend_metas;
ANALYZE crm_interacao;

-- =====================================================
-- PARTE 4: VERIFICAÇÃO
-- =====================================================

-- Verificar funções criadas
SELECT 
    routine_name AS "Função",
    routine_type AS "Tipo"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'fn_vendedores%'
ORDER BY routine_name;

-- Verificar índices criados
SELECT 
    tablename AS "Tabela",
    indexname AS "Índice",
    pg_size_pretty(pg_relation_size(indexname::regclass)) AS "Tamanho"
FROM pg_indexes
WHERE schemaname = 'public'
  AND (tablename IN ('vendedores', 'pedidos', 'vend_metas', 'crm_interacao'))
  AND indexname NOT LIKE 'pg_%'
ORDER BY tablename, indexname;

-- =====================================================
-- PARTE 5: TESTES RÁPIDOS
-- =====================================================

-- Testar função de performance
SELECT 'Testando fn_vendedores_performance...' AS status;
SELECT COUNT(*) AS total_vendedores FROM fn_vendedores_performance(2025, 12, NULL);

-- Testar função de clientes em risco
SELECT 'Testando fn_vendedores_clientes_risco...' AS status;
SELECT COUNT(*) AS total_clientes_risco FROM fn_vendedores_clientes_risco(NULL, 60);

-- =====================================================
-- SCRIPT FINALIZADO COM SUCESSO!
-- =====================================================

SELECT '✅ SCRIPT COMPLETO EXECUTADO COM SUCESSO!' AS resultado,
       'Funções: 4 criadas | Índices: 11 criados' AS detalhes;
