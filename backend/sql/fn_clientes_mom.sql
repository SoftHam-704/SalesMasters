CREATE OR REPLACE FUNCTION public.fn_clientes_mom(
    p_mes integer,
    p_ano integer,
    p_industria integer,
    p_ano_todo boolean,
    p_rede_lojas boolean
)
RETURNS TABLE(
    cliente_nome text,
    valor_prev numeric,
    qtd_prev numeric,
    valor_curr numeric,
    qtd_curr numeric,
    perc_valor numeric,
    perc_qtd numeric
) 
LANGUAGE plpgsql
AS $function$
DECLARE
    v_data_ini_curr date;
    v_data_fim_curr date;
    v_data_ini_prev date;
    v_data_fim_prev date;
BEGIN
    -- Define current period
    IF p_ano_todo THEN
        v_data_ini_curr := make_date(p_ano, 1, 1);
        v_data_fim_curr := make_date(p_ano, 12, 31);
        v_data_ini_prev := make_date(p_ano - 1, 1, 1);
        v_data_fim_prev := make_date(p_ano - 1, 12, 31);
    ELSE
        v_data_ini_curr := make_date(p_ano, p_mes, 1);
        v_data_fim_curr := (v_data_ini_curr + interval '1 month' - interval '1 day')::date;
        v_data_ini_prev := make_date(p_ano - 1, p_mes, 1);
        v_data_fim_prev := (v_data_ini_prev + interval '1 month' - interval '1 day')::date;
    END IF;

    RETURN QUERY
    WITH vendas AS (
        SELECT 
            CASE WHEN p_rede_lojas THEN COALESCE(NULLIF(c.cli_redeloja, ''), c.cli_nomred) ELSE c.cli_nomred END::text as cli_key,
            p.ped_data,
            p.ped_totliq,
            i.ite_quant
        FROM pedidos p
        JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_industria = p_industria
          AND p.ped_situacao IN ('P', 'F')
          AND (p.ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr OR p.ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev)
    ),
    agrupado AS (
        SELECT 
            cli_key,
            SUM(CASE WHEN ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev THEN ped_totliq ELSE 0 END)::numeric as v_prev,
            SUM(CASE WHEN ped_data BETWEEN v_data_ini_prev AND v_data_fim_prev THEN ite_quant ELSE 0 END)::numeric as q_prev,
            SUM(CASE WHEN ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr THEN ped_totliq ELSE 0 END)::numeric as v_curr,
            SUM(CASE WHEN ped_data BETWEEN v_data_ini_curr AND v_data_fim_curr THEN ite_quant ELSE 0 END)::numeric as q_curr
        FROM vendas
        GROUP BY cli_key
    )
    SELECT 
        cli_key,
        v_prev,
        q_prev,
        v_curr,
        q_curr,
        CASE 
            WHEN v_prev = 0 AND v_curr > 0 THEN 100.0
            WHEN v_prev = 0 AND v_curr = 0 THEN 0.0
            ELSE ROUND(((v_curr - v_prev) / v_prev) * 100.0, 2)
        END as p_valor,
        CASE 
            WHEN q_prev = 0 AND q_curr > 0 THEN 100.0
            WHEN q_prev = 0 AND q_curr = 0 THEN 0.0
            ELSE ROUND(((q_curr - q_prev) / q_prev) * 100.0, 2)
        END as p_qtd
    FROM agrupado
    WHERE v_prev <> 0 OR v_curr <> 0
    ORDER BY q_curr DESC, cli_key;
END;
$function$;
