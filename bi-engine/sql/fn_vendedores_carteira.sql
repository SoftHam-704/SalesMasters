-- =====================================================
-- FUNÇÕES PARA ANÁLISE DE CARTEIRA DE CLIENTES
-- Criado para redesign da aba Equipe
-- =====================================================

-- 1. Resumo de Carteira por Vendedor
-- Retorna: ativos (90d), inativos, total, % inativos, novos
CREATE OR REPLACE FUNCTION fn_vendedores_carteira_resumo(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    clientes_ativos_90d INTEGER,
    clientes_inativos_90d INTEGER,
    total_clientes INTEGER,
    perc_inativos NUMERIC,
    clientes_novos_periodo INTEGER
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_data_limite_ativo DATE;
BEGIN
    -- Calcular período
    v_data_inicio := make_date(p_ano, p_mes, 1);
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    v_data_limite_ativo := v_data_fim - INTERVAL '90 days';

    RETURN QUERY
    WITH vendas_periodo AS (
        SELECT DISTINCT
            ped.ped_vendedor,
            ped.ped_cliente
        FROM pedidos ped
        WHERE ped.ped_data BETWEEN v_data_inicio AND v_data_fim
          AND ped.ped_situacao NOT IN ('C', 'X')
          AND (p_vendedor IS NULL OR ped.ped_vendedor = p_vendedor)
    ),
    ultima_compra AS (
        SELECT 
            c.cli_codigo,
            c.cli_vendedor,
            MAX(p.ped_data) as ultimo_pedido
        FROM clientes c
        LEFT JOIN pedidos p ON p.ped_cliente = c.cli_codigo AND p.ped_situacao NOT IN ('C', 'X')
        WHERE (p_vendedor IS NULL OR c.cli_vendedor = p_vendedor)
        GROUP BY c.cli_codigo, c.cli_vendedor
    ),
    primeira_compra AS (
        SELECT 
            ped.ped_cliente,
            ped.ped_vendedor,
            MIN(ped.ped_data) as data_primeira
        FROM pedidos ped
        WHERE ped.ped_situacao NOT IN ('C', 'X')
        GROUP BY ped.ped_cliente, ped.ped_vendedor
    ),
    metricas AS (
        SELECT 
            v.ven_codigo,
            v.ven_nome,
            COUNT(DISTINCT CASE WHEN uc.ultimo_pedido >= v_data_limite_ativo THEN uc.cli_codigo END) as ativos,
            COUNT(DISTINCT CASE WHEN uc.ultimo_pedido < v_data_limite_ativo OR uc.ultimo_pedido IS NULL THEN uc.cli_codigo END) as inativos,
            COUNT(DISTINCT uc.cli_codigo) as total,
            COUNT(DISTINCT CASE 
                WHEN pc.data_primeira BETWEEN v_data_inicio AND v_data_fim 
                THEN pc.ped_cliente 
            END) as novos
        FROM vendedores v
        LEFT JOIN ultima_compra uc ON uc.cli_vendedor = v.ven_codigo
        LEFT JOIN primeira_compra pc ON pc.ped_vendedor = v.ven_codigo AND pc.ped_cliente = uc.cli_codigo
        WHERE v.ven_status = 'A'
          AND COALESCE(v.ven_cumpremetas, 'N') = 'S'
          AND (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
        GROUP BY v.ven_codigo, v.ven_nome
    )
    SELECT 
        m.ven_codigo::INTEGER,
        m.ven_nome::VARCHAR,
        m.ativos::INTEGER,
        m.inativos::INTEGER,
        m.total::INTEGER,
        CASE WHEN m.total > 0 THEN ROUND((m.inativos::NUMERIC / m.total) * 100, 2) ELSE 0 END,
        m.novos::INTEGER
    FROM metricas m
    ORDER BY m.ven_nome;
END;
$$;

-- 2. Clientes com Primeira Compra no Período
CREATE OR REPLACE FUNCTION fn_clientes_primeira_compra(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    cliente_codigo INTEGER,
    cliente_nome VARCHAR,
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    data_primeira_compra DATE,
    valor_primeira_compra NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
BEGIN
    v_data_inicio := make_date(p_ano, p_mes, 1);
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    RETURN QUERY
    WITH primeira_compra AS (
        SELECT 
            p.ped_cliente,
            p.ped_vendedor,
            MIN(p.ped_data) as data_primeira
        FROM pedidos p
        WHERE p.ped_situacao NOT IN ('C', 'X')
        GROUP BY p.ped_cliente, p.ped_vendedor
        HAVING MIN(p.ped_data) BETWEEN v_data_inicio AND v_data_fim
    ),
    valor_primeira AS (
        SELECT 
            pc.ped_cliente,
            pc.ped_vendedor,
            pc.data_primeira,
            SUM(p.ped_totliq) as valor
        FROM primeira_compra pc
        JOIN pedidos p ON p.ped_cliente = pc.ped_cliente 
                      AND p.ped_vendedor = pc.ped_vendedor 
                      AND p.ped_data = pc.data_primeira
                      AND p.ped_situacao NOT IN ('C', 'X')
        GROUP BY pc.ped_cliente, pc.ped_vendedor, pc.data_primeira
    )
    SELECT 
        c.cli_codigo::INTEGER,
        c.cli_nomred::VARCHAR,
        v.ven_codigo::INTEGER,
        v.ven_nome::VARCHAR,
        vp.data_primeira,
        ROUND(vp.valor::NUMERIC, 2)
    FROM valor_primeira vp
    JOIN clientes c ON c.cli_codigo = vp.ped_cliente
    JOIN vendedores v ON v.ven_codigo = vp.ped_vendedor
    WHERE (p_vendedor IS NULL OR vp.ped_vendedor = p_vendedor)
    ORDER BY vp.data_primeira DESC, vp.valor DESC
    LIMIT 20;
END;
$$;

-- Testar funções
-- SELECT * FROM fn_vendedores_carteira_resumo(2025, 12);
-- SELECT * FROM fn_clientes_primeira_compra(2025, 12);
