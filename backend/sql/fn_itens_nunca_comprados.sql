CREATE OR REPLACE FUNCTION fn_itens_nunca_comprados(
    p_industria INTEGER,
    p_cliente INTEGER
)
RETURNS TABLE (
    codigo VARCHAR,
    descricao VARCHAR,
    aplicacao VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.pro_codprod::VARCHAR AS codigo,
        p.pro_nome::VARCHAR AS descricao,
        COALESCE(p.pro_aplicacao, '')::VARCHAR AS aplicacao
    FROM cad_prod p
    WHERE p.pro_industria = p_industria
    AND p.pro_status = true
    AND NOT EXISTS (
        SELECT 1
        FROM itens_ped ip
        JOIN pedidos ped ON ip.ite_pedido = ped.ped_pedido
        WHERE ip.ite_produto = p.pro_codprod
        AND ped.ped_cliente = p_cliente
        AND ped.ped_industria = p_industria
        AND ped.ped_situacao != 'C'
    )
    ORDER BY p.pro_codprod;
END;
$$ LANGUAGE plpgsql;
