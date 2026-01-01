CREATE OR REPLACE FUNCTION fn_comparativo_clientes(
    p_industria INTEGER,
    p_cliente_ref INTEGER,
    p_cliente_alvo INTEGER,
    p_data_ini DATE,
    p_data_fim DATE,
    p_modo VARCHAR -- 'GAP' (Ref comprou, Alvo nao) ou 'FULL' (Ambos compraram - Interseção)
)
RETURNS TABLE (
    codigo VARCHAR,
    descricao VARCHAR,
    qtd_ref NUMERIC,
    qtd_alvo NUMERIC
) AS $$
BEGIN
    -- Mode 'GAP': Itens que Referência comprou mas Alvo NÃO comprou
    IF p_modo = 'GAP' THEN
        RETURN QUERY
        WITH xRef AS (
            SELECT 
                ip.ite_produto, 
                MAX(ip.ite_nomeprod) as nome_historico,
                SUM(ip.ite_quant) as quant
            FROM itens_ped ip
            JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
            WHERE p.ped_industria = p_industria
              AND p.ped_cliente = p_cliente_ref
              AND p.ped_data BETWEEN p_data_ini AND p_data_fim
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY ip.ite_produto
        ),
        xAlvo AS (
            SELECT 
                ip.ite_produto, 
                SUM(ip.ite_quant) as quant
            FROM itens_ped ip
            JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
            WHERE p.ped_industria = p_industria
              AND p.ped_cliente = p_cliente_alvo
              AND p.ped_data BETWEEN p_data_ini AND p_data_fim
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY ip.ite_produto
        )
        SELECT 
            x1.ite_produto::VARCHAR as codigo,
            COALESCE(x1.nome_historico, 'SEM DESCRIÇÃO')::VARCHAR as descricao,
            COALESCE(x1.quant, 0)::NUMERIC,
            COALESCE(x2.quant, 0)::NUMERIC
        FROM xRef x1
        LEFT JOIN xAlvo x2 ON x1.ite_produto = x2.ite_produto
        WHERE (x2.quant IS NULL OR x2.quant = 0)
        ORDER BY descricao;
        
    -- Mode 'FULL': Itens que AMBOS compraram (Interseção, conforme iflag=1 do usuario)
    ELSIF p_modo = 'FULL' THEN
        RETURN QUERY
        WITH xRef AS (
            SELECT 
                ip.ite_produto, 
                MAX(ip.ite_nomeprod) as nome_historico,
                SUM(ip.ite_quant) as quant
            FROM itens_ped ip
            JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
            WHERE p.ped_industria = p_industria
              AND p.ped_cliente = p_cliente_ref
              AND p.ped_data BETWEEN p_data_ini AND p_data_fim
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY ip.ite_produto
        ),
        xAlvo AS (
            SELECT 
                ip.ite_produto, 
                SUM(ip.ite_quant) as quant
            FROM itens_ped ip
            JOIN pedidos p ON ip.ite_pedido = p.ped_pedido
            WHERE p.ped_industria = p_industria
              AND p.ped_cliente = p_cliente_alvo
              AND p.ped_data BETWEEN p_data_ini AND p_data_fim
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY ip.ite_produto
        )
        SELECT 
            x1.ite_produto::VARCHAR as codigo,
            COALESCE(x1.nome_historico, 'SEM DESCRIÇÃO')::VARCHAR as descricao,
            COALESCE(x1.quant, 0)::NUMERIC,
            COALESCE(x2.quant, 0)::NUMERIC
        FROM xRef x1
        JOIN xAlvo x2 ON x1.ite_produto = x2.ite_produto
        ORDER BY descricao;
    END IF;
END;
$$ LANGUAGE plpgsql;
