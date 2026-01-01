CREATE OR REPLACE FUNCTION public.fn_mapa_grupo_lojas(
    p_data_ini date,
    p_data_fim date,
    p_industria integer
)
RETURNS TABLE(
    cliente text,
    pedido text,
    grupo text,
    total numeric,
    data date,
    quant numeric
) 
LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        c.cli_nomred::text as cliente,
        p.ped_pedido::text as pedido,
        c.cli_redeloja::text as grupo,
        p.ped_totliq::numeric as total,
        p.ped_data as data,
        SUM(i.ite_quant)::numeric as quant
    FROM pedidos p
    JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
    JOIN clientes c ON p.ped_cliente = c.cli_codigo
    WHERE p.ped_data BETWEEN p_data_ini AND p_data_fim
      AND p.ped_industria = p_industria
      AND p.ped_situacao IN ('P', 'F')
      AND c.cli_redeloja IS NOT NULL AND c.cli_redeloja <> ''
    GROUP BY c.cli_nomred, p.ped_pedido, c.cli_redeloja, p.ped_totliq, p.ped_data
    ORDER BY c.cli_redeloja, c.cli_nomred, p.ped_data DESC;
END;
$function$;
