-- =====================================================
-- FUNÇÃO 2: CLIENTES EM RISCO POR VENDEDOR
-- =====================================================
-- Identifica clientes que estão em risco de churn
-- Para alimentar a IA com recomendações de ação
-- =====================================================

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
    total_compras_historico INTEGER,
    valor_total_historico NUMERIC,
    ticket_medio NUMERIC,
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
        c.cli_nomered,
        cr.ultima_compra,
        cr.dias_sem_compra,
        cr.total_pedidos,
        cr.valor_total,
        cr.ticket_medio,
        -- Nível de risco
        CASE 
            WHEN cr.dias_sem_compra >= 120 THEN '🔴 Alto'
            WHEN cr.dias_sem_compra >= 90 THEN '🟡 Médio'
            ELSE '🟢 Baixo'
        END AS nivel_risco,
        -- Recomendação baseada em padrão
        CASE 
            WHEN cr.dias_sem_compra >= 120 AND cr.valor_total > 50000 THEN 
                '📞 URGENTE: Cliente VIP sem comprar há ' || cr.dias_sem_compra || ' dias. Ligar imediatamente.'
            WHEN cr.dias_sem_compra >= 90 THEN 
                '📧 Enviar campanha de reativação + ligar.'
            WHEN cr.dias_sem_compra >= 60 AND cr.total_pedidos > 10 THEN 
                '💡 Cliente recorrente está distante. Agendar visita.'
            ELSE 
                '📅 Agendar contato nos próximos 7 dias.'
        END AS recomendacao
    FROM clientes_em_risco cr
    INNER JOIN vendedores v ON v.ven_codigo = cr.ped_vendedor
    INNER JOIN clientes c ON c.cli_codigo = cr.ped_cliente
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY cr.valor_total DESC, cr.dias_sem_compra DESC;
END;
$$;

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
-- Todos os clientes em risco (60+ dias):
-- SELECT * FROM fn_vendedores_clientes_risco(NULL, 60);

-- Clientes de um vendedor específico em risco:
-- SELECT * FROM fn_vendedores_clientes_risco(1, 60);

-- Clientes muito em risco (90+ dias):
-- SELECT * FROM fn_vendedores_clientes_risco(NULL, 90);

-- =====================================================
-- RESULTADO ESPERADO (para alimentar IA):
-- =====================================================
-- vendedor_codigo | cliente_codigo | dias_sem_comprar | nivel_risco | recomendacao
-- 1               | 123            | 87               | 🟡 Médio    | 📧 Enviar campanha...
-- 1               | 456            | 125              | 🔴 Alto     | 📞 URGENTE: Cliente VIP...
