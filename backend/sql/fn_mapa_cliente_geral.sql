CREATE OR REPLACE FUNCTION public.fn_mapa_cliente_geral(
    p_data_ini date,
    p_data_fim date,
    p_industria integer,
    p_cliente integer,
    p_considerar_grupo boolean DEFAULT false
)
RETURNS TABLE(
    codigo text,
    descricao text,
    qtd_cliente numeric,
    qtd_geral numeric
) 
LANGUAGE plpgsql
AS $function$
DECLARE
    v_redeloja text;
BEGIN
    -- Se considerar grupo, buscar a rede do cliente selecionado
    IF p_considerar_grupo THEN
        SELECT cli_redeloja INTO v_redeloja FROM clientes WHERE cli_codigo = p_cliente;
    END IF;

    RETURN QUERY
    WITH vendas_base AS (
        -- Base bruta de vendas
        SELECT 
            ip.ite_produto as cod_prod,
            ip.ite_nomeprod as nome_prod,
            p.ped_cliente as cod_cli,
            ip.ite_quant as qtd
        FROM pedidos p
        JOIN itens_ped ip ON p.ped_pedido = ip.ite_pedido
        WHERE p.ped_data BETWEEN p_data_ini AND p_data_fim
          AND p.ped_situacao != 'C'
          AND ip.ite_industria = p_industria
    ),
    stats_vendas AS (
        -- Agrupa por produto e identifica se pertence ao cliente/grupo ou ao geral
        SELECT 
            vb.cod_prod,
            MAX(vb.nome_prod) as nome_prod,
            SUM(CASE WHEN (
                CASE 
                    WHEN p_considerar_grupo AND v_redeloja IS NOT NULL AND v_redeloja <> '' THEN c.cli_redeloja = v_redeloja
                    ELSE vb.cod_cli = p_cliente
                END
            ) THEN vb.qtd ELSE 0 END) as total_cliente,
            SUM(CASE WHEN NOT (
                CASE 
                    WHEN p_considerar_grupo AND v_redeloja IS NOT NULL AND v_redeloja <> '' THEN c.cli_redeloja = v_redeloja
                    ELSE vb.cod_cli = p_cliente
                END
            ) THEN vb.qtd ELSE 0 END) as total_geral
        FROM vendas_base vb
        LEFT JOIN clientes c ON vb.cod_cli = c.cli_codigo
        GROUP BY vb.cod_prod
    )
    SELECT 
        sv.cod_prod::text,
        COALESCE(sv.nome_prod, '')::text,
        COALESCE(sv.total_cliente, 0)::numeric,
        COALESCE(sv.total_geral, 0)::numeric
    FROM stats_vendas sv
    WHERE sv.total_cliente > 0 OR sv.total_geral > 0
    ORDER BY sv.total_cliente DESC, sv.total_geral DESC, sv.cod_prod ASC;
END;
$function$;
