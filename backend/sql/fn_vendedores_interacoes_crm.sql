-- =====================================================
-- FUNÇÃO 4: ANÁLISE DE INTERAÇÕES CRM
-- =====================================================
-- Retorna análise de interações/contatos por vendedor
-- Para identificar produtividade e qualidade do CRM
-- =====================================================

CREATE OR REPLACE FUNCTION fn_vendedores_interacoes_crm(
    p_ano INTEGER,
    p_mes INTEGER,
    p_vendedor INTEGER DEFAULT NULL
)
RETURNS TABLE (
    vendedor_codigo INTEGER,
    vendedor_nome VARCHAR,
    total_interacoes INTEGER,
    interacoes_telefone INTEGER,
    interacoes_email INTEGER,
    interacoes_visita INTEGER,
    interacoes_whatsapp INTEGER,
    duracao_media_minutos NUMERIC,
    proximas_acoes_pendentes INTEGER,
    taxa_conversao NUMERIC,
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
        -- Calcula taxa de conversão: interações → vendas
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS clientes_vendidos
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND EXTRACT(MONTH FROM p.ped_data) = p_mes
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
          -- Cliente teve interação CRM antes da venda
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
        COALESCE(i.total, 0) AS total_interacoes,
        COALESCE(i.telefone, 0) AS interacoes_telefone,
        COALESCE(i.email, 0) AS interacoes_email,
        COALESCE(i.visita, 0) AS interacoes_visita,
        COALESCE(i.whatsapp, 0) AS interacoes_whatsapp,
        ROUND(COALESCE(i.duracao_media, 0)::NUMERIC, 2) AS duracao_media_minutos,
        COALESCE(i.acoes_pendentes, 0) AS proximas_acoes_pendentes,
        -- Taxa de conversão: % de interações que viraram vendas
        CASE 
            WHEN COALESCE(i.total, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(c.clientes_vendidos, 0)::NUMERIC / i.total * 100), 2)
        END AS taxa_conversao,
        i.ultima_interacao,
        -- Produtividade
        CASE 
            WHEN COALESCE(i.total, 0) >= 50 THEN '🔥 Alta'
            WHEN COALESCE(i.total, 0) >= 20 THEN '✅ Boa'
            WHEN COALESCE(i.total, 0) >= 10 THEN '⚠️ Baixa'
            ELSE '🔴 Muito Baixa'
        END AS produtividade
    FROM vendedores v
    LEFT JOIN interacoes i ON i.ven_codigo = v.ven_codigo
    LEFT JOIN conversoes c ON c.ped_vendedor = v.ven_codigo
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY total_interacoes DESC;
END;
$$;

-- =====================================================
-- EXEMPLO DE USO:
-- =====================================================
-- Interações de todos os vendedores em dez/2025:
-- SELECT * FROM fn_vendedores_interacoes_crm(2025, 12, NULL);

-- Interações de um vendedor específico:
-- SELECT * FROM fn_vendedores_interacoes_crm(2025, 12, 1);

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- vendedor | total_interacoes | telefone | email | visita | taxa_conversao | produtividade
-- RODRIGO  | 65               | 45       | 12    | 8      | 23.08          | 🔥 Alta
-- CAMILA   | 42               | 30       | 8     | 4      | 19.05          | ✅ Boa
-- RICARDO  | 8                | 5        | 2     | 1      | 12.50          | 🔴 Muito Baixa

-- =====================================================
-- USO PARA IA - RECOMENDAÇÕES:
-- =====================================================
/*
A IA pode usar estes dados para:
1. Identificar vendedores com baixa atividade CRM
2. Sugerir tipos de interação mais efetivos
3. Alertar sobre próximas ações pendentes
4. Comparar produtividade entre vendedores
5. Recomendar quantidade ideal de interações

Exemplo de prompt para IA:
"Este vendedor tem apenas 8 interações no mês, muito abaixo 
da média de 45. Taxa de conversão de 12.5% (média: 20%). 
Recomende ações para melhorar."
*/
