from services.database_native import db

def create_analytics_views():
    print("Creating/Updating views using execute_non_query...")
    
    # Drop existing views to avoid type mismatch errors
    db.execute_non_query("DROP VIEW IF EXISTS vw_analise_portfolio CASCADE;")
    db.execute_non_query("DROP VIEW IF EXISTS vw_metricas_cliente CASCADE;")
    db.execute_non_query("DROP VIEW IF EXISTS vw_performance_mensal CASCADE;")
    db.execute_non_query("DROP VIEW IF EXISTS vw_itens_ped_fixed CASCADE;")
    
    # 0. Fixed items view (Crucial for performance)
    print("Progress: vw_itens_ped_fixed...")
    db.execute_non_query("""
        CREATE OR REPLACE VIEW vw_itens_ped_fixed AS
        SELECT *, 
               CASE 
                   WHEN ite_pedido ~ '^[Ff]?[0-9]+$' THEN CAST(REGEXP_REPLACE(ite_pedido, '[^0-9]', '', 'g') AS INTEGER)
                   ELSE NULL 
               END as ite_pedido_int
        FROM itens_ped
        WHERE ite_pedido ~ '^[Ff]?[0-9]+$';
    """)

    # 1. Métricas por Cliente (Simplificada para Performance)
    print("Progress: vw_metricas_cliente...")
    db.execute_non_query("""
        CREATE OR REPLACE VIEW vw_metricas_cliente AS
        SELECT 
            p.ped_cliente as cliente_id,
            c.cli_nomred as cliente_nome,
            p.ped_industria as industry_id,
            (CURRENT_DATE - MAX(p.ped_data)::date) as dias_sem_compra,
            SUM(p.ped_totliq) as valor_total,
            COUNT(p.ped_numero) as total_pedidos,
            AVG(p.ped_totliq) as ticket_medio
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_situacao IN ('P', 'F')
        GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;
    """)

    # 2. Performance Mensal
    print("Progress: vw_performance_mensal...")
    db.execute_non_query("""
        CREATE OR REPLACE VIEW vw_performance_mensal AS
        SELECT 
            EXTRACT(YEAR FROM ped_data) as ano,
            EXTRACT(MONTH FROM ped_data) as mes,
            ped_industria as industry_id,
            SUM(ped_totliq) as valor_total,
            COUNT(DISTINCT ped_numero) as qtd_pedidos,
            COUNT(DISTINCT ped_cliente) as clientes_ativos,
            AVG(ped_totliq) as ticket_medio
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
        GROUP BY 1, 2, 3;
    """)

    # 3. Análise de Portfólio (ABC + Dead Stock) - Per Industry logic
    print("Progress: vw_analise_portfolio...")
    # Drop view if exists
    db.execute_non_query("DROP VIEW IF EXISTS vw_analise_portfolio CASCADE;")
    
    # NOTE: The following SQL string contains '%' characters in comments. 
    # To avoid pscopg2 formatting errors, we should escape them or remove them.
    # However, I don't see any actual % symbols in the code I pasted.
    # Let me check if I used % in similar LIKE clauses... no.

    print("Creating function fn_analise_curva_abc...")
    db.execute_non_query("""
        CREATE OR REPLACE FUNCTION fn_analise_curva_abc(
            p_ano INTEGER,
            p_mes INTEGER DEFAULT NULL,
            p_industria INTEGER DEFAULT NULL
        )
        RETURNS TABLE (
            curva_abc VARCHAR(10),
            qtd_itens BIGINT,
            valor_total NUMERIC,
            quantidade_total NUMERIC,
            percentual_itens NUMERIC,
            percentual_faturamento NUMERIC
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH vendas_produto AS (
                SELECT 
                    p.pro_id,
                    p.pro_nome,
                    SUM(i.ite_totliquido) as valor_total_produto,
                    SUM(i.ite_quant) as quantidade_vendida,
                    COUNT(DISTINCT i.ite_pedido) as qtd_pedidos,
                    MAX(ped.ped_data) as ultima_venda
                FROM cad_prod p
                INNER JOIN itens_ped i ON p.pro_id = i.ite_idproduto
                INNER JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
                WHERE ped.ped_situacao IN ('P', 'F')
                    AND ped.ped_industria = p_industria
                    AND EXTRACT(YEAR FROM ped.ped_data) = p_ano
                    AND (p_mes IS NULL OR EXTRACT(MONTH FROM ped.ped_data) = p_mes)
                GROUP BY p.pro_id, p.pro_nome
            ),
            todos_produtos AS (
                SELECT 
                    p.pro_id,
                    p.pro_nome,
                    COALESCE(vp.valor_total_produto, 0) as valor_total_produto,
                    COALESCE(vp.quantidade_vendida, 0) as quantidade_vendida,
                    COALESCE(vp.qtd_pedidos, 0) as qtd_pedidos,
                    vp.ultima_venda,
                    CASE 
                        WHEN vp.ultima_venda IS NULL THEN 999
                        ELSE (CURRENT_DATE - vp.ultima_venda)::INTEGER
                    END as dias_sem_venda
                FROM cad_prod p
                LEFT JOIN vendas_produto vp ON p.pro_id = vp.pro_id
                WHERE p.pro_industria = p_industria
            ),
            total_geral AS (
                SELECT 
                    SUM(valor_total_produto) as total_vendas,
                    SUM(quantidade_vendida) as total_quantidade
                FROM todos_produtos
                WHERE valor_total_produto > 0
            ),
            produtos_percentual AS (
                SELECT 
                    tp.*,
                    tg.total_vendas,
                    tg.total_quantidade,
                    SUM(tp.valor_total_produto) OVER (
                        ORDER BY tp.valor_total_produto DESC 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) / NULLIF(tg.total_vendas, 0) * 100 as percentual_acumulado
                FROM todos_produtos tp
                CROSS JOIN total_geral tg
            ),
            produtos_classificados AS (
                SELECT 
                    *,
                    CASE
                        WHEN dias_sem_venda > 90 OR valor_total_produto = 0 
                        THEN 'OFF'
                        WHEN percentual_acumulado <= 70 
                        THEN 'A'
                        WHEN percentual_acumulado <= 85 
                        THEN 'B'
                        ELSE 'C'
                    END as curva
                FROM produtos_percentual
            ),
            resumo_curvas AS (
                SELECT 
                    pc.curva as curva_abc,
                    COUNT(*) as qtd_itens,
                    SUM(pc.valor_total_produto) as valor_total,
                    SUM(pc.quantidade_vendida) as quantidade_total,
                    COUNT(*) * 100.0 / SUM(COUNT(*)) OVER () as percentual_itens,
                    CASE 
                        WHEN SUM(SUM(pc.valor_total_produto)) OVER () > 0 
                        THEN SUM(pc.valor_total_produto) * 100.0 / SUM(SUM(pc.valor_total_produto)) OVER ()
                        ELSE 0 
                    END as percentual_faturamento
                FROM produtos_classificados pc
                GROUP BY pc.curva
            )
            SELECT 
                rc.curva_abc::VARCHAR,
                rc.qtd_itens,
                ROUND(rc.valor_total::NUMERIC, 2) as valor_total,
                ROUND(rc.quantidade_total::NUMERIC, 2) as quantidade_total,
                ROUND(rc.percentual_itens::NUMERIC, 2) as percentual_itens,
                ROUND(rc.percentual_faturamento::NUMERIC, 2) as percentual_faturamento
            FROM resumo_curvas rc
            ORDER BY 
                CASE rc.curva_abc
                    WHEN 'A' THEN 1
                    WHEN 'B' THEN 2
                    WHEN 'C' THEN 3
                    WHEN 'OFF' THEN 4
                END;
        END;
        $$ LANGUAGE plpgsql;
    """)

    print("All views created successfully.")

if __name__ == "__main__":
    create_analytics_views()
