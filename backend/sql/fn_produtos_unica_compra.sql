CREATE OR REPLACE FUNCTION public.fn_produtos_unica_compra(
    p_data_ini date,
    p_data_fim date,
    p_industria integer
)
RETURNS TABLE(
    cliente_nome text,
    produto_codigo text,
    produto_desc text,
    quantidade numeric
) 
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.cli_nomred::text as cliente_nome,
        i.ite_produto::text as produto_codigo,
        i.ite_nomeprod::text as produto_desc,
        SUM(i.ite_quant)::numeric as quantidade
    FROM pedidos p
    JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
    JOIN clientes c ON p.ped_cliente = c.cli_codigo
    WHERE p.ped_data BETWEEN p_data_ini AND p_data_fim
      AND p.ped_industria = p_industria
      AND p.ped_situacao IN ('P', 'F')
    GROUP BY c.cli_codigo, c.cli_nomred, i.ite_produto, i.ite_nomeprod
    HAVING COUNT(DISTINCT p.ped_pedido) = 1
    ORDER BY c.cli_nomred, i.ite_produto;
END;
$function$;
