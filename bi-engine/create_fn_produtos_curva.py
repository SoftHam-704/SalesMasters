from services.database_native import db

def create_fn_produtos_por_curva():
    print("Creating function fn_produtos_por_curva...")
    
    db.execute_non_query("""
        CREATE OR REPLACE FUNCTION fn_produtos_por_curva(
            p_ano INTEGER,
            p_industria INTEGER,
            p_curva VARCHAR(10),
            p_mes INTEGER DEFAULT NULL,
            p_limit INTEGER DEFAULT 100
        )
        RETURNS TABLE (
            pro_id INTEGER,
            pro_nome VARCHAR,
            valor_total NUMERIC,
            quantidade_vendida NUMERIC,
            qtd_pedidos BIGINT,
            ultima_venda DATE,
            dias_sem_venda INTEGER,
            percentual_individual NUMERIC,
            curva_abc VARCHAR
        ) AS $$
        BEGIN
            RETURN QUERY
            WITH vendas_produto AS (
                SELECT 
                    p.pro_id,
                    p.pro_nome,
                    SUM(i.ite_totliquido) as valor_total_produto,
                    SUM(i.ite_quant) as quantidade_vendida_total,
                    COUNT(DISTINCT i.ite_pedido) as qtd_pedidos_total,
                    MAX(ped.ped_data) as ultima_venda_data
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
                    COALESCE(vp.quantidade_vendida_total, 0) as quantidade_vendida_total,
                    COALESCE(vp.qtd_pedidos_total, 0) as qtd_pedidos_total,
                    vp.ultima_venda_data,
                    CASE 
                        WHEN vp.ultima_venda_data IS NULL THEN 999
                        ELSE (CURRENT_DATE - vp.ultima_venda_data)::INTEGER
                    END as dias_sem_venda_calc
                FROM cad_prod p
                LEFT JOIN vendas_produto vp ON p.pro_id = vp.pro_id
                WHERE p.pro_industria = p_industria
            ),
            total_geral AS (
                SELECT SUM(valor_total_produto) as total_vendas
                FROM todos_produtos
                WHERE valor_total_produto > 0
            ),
            produtos_percentual AS (
                SELECT 
                    tp.*,
                    tg.total_vendas,
                    CASE 
                        WHEN tg.total_vendas > 0 
                        THEN (tp.valor_total_produto / tg.total_vendas) * 100
                        ELSE 0 
                    END as percentual_individual_calc,
                    SUM(tp.valor_total_produto) OVER (
                        ORDER BY tp.valor_total_produto DESC 
                        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                    ) / NULLIF(tg.total_vendas, 0) * 100 as percentual_acumulado
                FROM todos_produtos tp
                CROSS JOIN total_geral tg
            ),
            produtos_classificados AS (
                SELECT 
                    pp.pro_id,
                    pp.pro_nome,
                    pp.valor_total_produto,
                    pp.quantidade_vendida_total,
                    pp.qtd_pedidos_total,
                    pp.ultima_venda_data,
                    pp.dias_sem_venda_calc,
                    pp.percentual_individual_calc,
                    CASE
                        WHEN pp.dias_sem_venda_calc > 90 OR pp.valor_total_produto = 0 
                        THEN 'OFF'
                        WHEN pp.percentual_acumulado <= 70 
                        THEN 'A'
                        WHEN pp.percentual_acumulado <= 85 
                        THEN 'B'
                        ELSE 'C'
                    END as curva
                FROM produtos_percentual pp
            )
            SELECT 
                pc.pro_id,
                pc.pro_nome,
                ROUND(pc.valor_total_produto::NUMERIC, 2) as valor_total,
                ROUND(pc.quantidade_vendida_total::NUMERIC, 2) as quantidade_vendida,
                pc.qtd_pedidos_total as qtd_pedidos,
                pc.ultima_venda_data as ultima_venda,
                pc.dias_sem_venda_calc as dias_sem_venda,
                ROUND(pc.percentual_individual_calc::NUMERIC, 2) as percentual_individual,
                pc.curva::VARCHAR as curva_abc
            FROM produtos_classificados pc
            WHERE pc.curva = p_curva
            ORDER BY pc.valor_total_produto DESC
            LIMIT p_limit;
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    print("Function fn_produtos_por_curva created successfully!")

if __name__ == "__main__":
    create_fn_produtos_por_curva()
