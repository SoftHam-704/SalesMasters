from services.database_native import db

def create_fn_validar_periodo():
    print("Creating function fn_validar_periodo...")
    
    db.execute_non_query("""
        CREATE OR REPLACE FUNCTION fn_validar_periodo(
            p_ano INTEGER,
            p_industria INTEGER,
            p_mes INTEGER DEFAULT NULL
        )
        RETURNS TABLE (
            tem_dados BOOLEAN,
            total_pedidos BIGINT,
            total_itens BIGINT,
            valor_total NUMERIC,
            primeira_venda DATE,
            ultima_venda DATE
        ) AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                COUNT(DISTINCT ped.ped_pedido) > 0 as tem_dados,
                COUNT(DISTINCT ped.ped_pedido) as total_pedidos,
                COUNT(i.ite_lancto) as total_itens,
                COALESCE(SUM(i.ite_totliquido), 0)::NUMERIC as valor_total,
                MIN(ped.ped_data) as primeira_venda,
                MAX(ped.ped_data) as ultima_venda
            FROM pedidos ped
            INNER JOIN itens_ped i ON ped.ped_pedido = i.ite_pedido
            WHERE ped.ped_situacao IN ('P', 'F')
                AND ped.ped_industria = p_industria
                AND EXTRACT(YEAR FROM ped.ped_data) = p_ano
                AND (p_mes IS NULL OR EXTRACT(MONTH FROM ped.ped_data) = p_mes);
        END;
        $$ LANGUAGE plpgsql;
    """)
    
    print("Function fn_validar_periodo created successfully!")

if __name__ == "__main__":
    create_fn_validar_periodo()
