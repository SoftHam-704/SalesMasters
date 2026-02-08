--
-- PostgreSQL database dump
--

\restrict tm7SPGryh9BaI3OhPzUdLeE10mPxHyVdN8G5X2iwmI61kAAKDclLMNZbzLoBShG

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

-- Started on 2026-01-16 16:55:07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5 (class 2615 OID 18787)
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- TOC entry 689 (class 1255 OID 18788)
-- Name: atualizar_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.atualizar_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


--
-- TOC entry 690 (class 1255 OID 18789)
-- Name: fn_analise_curva_abc(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_analise_curva_abc(p_ano integer, p_mes integer DEFAULT NULL::integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(curva_abc character varying, qtd_itens bigint, valor_total numeric, quantidade_total numeric, percentual_itens numeric, percentual_faturamento numeric)
    LANGUAGE plpgsql
    AS $$
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
        $$;


--
-- TOC entry 691 (class 1255 OID 18790)
-- Name: fn_analise_vendas_produto(integer, character varying, date, date, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_analise_vendas_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date, p_situacao character varying DEFAULT 'F'::character varying) RETURNS TABLE(ano integer, mes integer, quantidade double precision, valor_total double precision, qtd_pedidos integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(YEAR FROM p.ped_data)::INTEGER AS ano,
        EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
        SUM(i.ite_quant) AS quantidade,
        SUM(i.ite_totliquido) AS valor_total,
        COUNT(DISTINCT p.ped_pedido)::INTEGER AS qtd_pedidos
    FROM pedidos p
    INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_industria = p_industria
      AND p.ped_data BETWEEN p_data_inicio AND p_data_fim
      AND p.ped_situacao = p_situacao
      AND i.ite_produto = p_produto
    GROUP BY EXTRACT(YEAR FROM p.ped_data), EXTRACT(MONTH FROM p.ped_data)
    ORDER BY ano, mes;
END;
$$;


--
-- TOC entry 5239 (class 0 OID 0)
-- Dependencies: 691
-- Name: FUNCTION fn_analise_vendas_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date, p_situacao character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_analise_vendas_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date, p_situacao character varying) IS 'Retorna análise de vendas de um produto agrupada por mês/ano dentro de um período';


--
-- TOC entry 692 (class 1255 OID 18791)
-- Name: fn_anomalias_ticket(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_anomalias_ticket() RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, semana date, ticket_medio numeric, ticket_historico numeric, variacao_pct numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH client_stats AS (
        SELECT 
            c.cli_nomred,
            c.cli_codigo,
            DATE_TRUNC('week', p.ped_data)::DATE as sem,
            COUNT(*) as qtd,
            AVG(p.ped_totliq) as ticket_avg,
            SUM(p.ped_totliq) as total
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 weeks'
        GROUP BY c.cli_nomred, c.cli_codigo, DATE_TRUNC('week', p.ped_data)
    ),
    client_avg AS (
        SELECT 
            cli_codigo,
            cli_nomred,
            AVG(ticket_avg) as ticket_hist,
            STDDEV(ticket_avg) as desvio
        FROM client_stats
        GROUP BY cli_codigo, cli_nomred
    )
    SELECT 
        cs.cli_codigo::INTEGER,
        cs.cli_nomred::VARCHAR,
        cs.sem::DATE,
        ROUND(cs.ticket_avg::NUMERIC, 2),
        ROUND(ca.ticket_hist::NUMERIC, 2),
        ROUND(((cs.ticket_avg - ca.ticket_hist) / ca.ticket_hist * 100)::NUMERIC, 1)
    FROM client_stats cs
    INNER JOIN client_avg ca ON cs.cli_codigo = ca.cli_codigo
    WHERE ABS(cs.ticket_avg - ca.ticket_hist) > (ca.desvio * 2)
      AND cs.sem >= CURRENT_DATE - INTERVAL '4 weeks'
    ORDER BY ABS(cs.ticket_avg - ca.ticket_hist) DESC
    LIMIT 10;
END;
$$;


--
-- TOC entry 5240 (class 0 OID 0)
-- Dependencies: 692
-- Name: FUNCTION fn_anomalias_ticket(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_anomalias_ticket() IS 'Detecta variacoes anormais no ticket medio por cliente';


--
-- TOC entry 693 (class 1255 OID 18792)
-- Name: fn_buscar_preco(integer, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_buscar_preco(p_industria integer, p_codigo_produto character varying, p_tabela character varying DEFAULT 'PADRAO'::character varying) RETURNS TABLE(pro_id integer, pro_nome character varying, pro_codprod character varying, tabela character varying, preco_bruto double precision, preco_promo double precision, preco_especial double precision, ipi double precision, st double precision, grupo_desconto integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_codigo_normalizado VARCHAR(50);
BEGIN
    v_codigo_normalizado := fn_normalizar_codigo(p_codigo_produto);
    
    RETURN QUERY
    SELECT 
        p.pro_id,
        p.pro_nome,
        p.pro_codprod,
        t.itab_tabela,
        t.itab_precobruto,
        t.itab_precopromo,
        t.itab_precoespecial,
        t.itab_ipi,
        t.itab_st,
        t.itab_grupodesconto
    FROM cad_prod p
    INNER JOIN cad_tabelaspre t ON t.itab_idprod = p.pro_id
    WHERE p.pro_industria = p_industria
      AND p.pro_codigonormalizado = v_codigo_normalizado
      AND t.itab_tabela = p_tabela
      AND t.itab_status = true;
END;
$$;


--
-- TOC entry 5241 (class 0 OID 0)
-- Dependencies: 693
-- Name: FUNCTION fn_buscar_preco(p_industria integer, p_codigo_produto character varying, p_tabela character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_buscar_preco(p_industria integer, p_codigo_produto character varying, p_tabela character varying) IS 'Busca o preço de um produto em uma tabela específica. Retorna NULL se não encontrado.';


--
-- TOC entry 695 (class 1255 OID 18793)
-- Name: fn_churn_preditivo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_churn_preditivo() RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, dias_inativo integer, freq_compra_dias numeric, total_pedidos bigint, ticket_medio numeric, valor_total numeric, perda_mensal_est numeric, nivel_risco character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH client_behavior AS (
        SELECT 
            c.cli_codigo,
            c.cli_nomred,
            MAX(p.ped_data) as ultima_compra,
            CURRENT_DATE - MAX(p.ped_data) as dias_sem_comprar,
            COUNT(*) as qtd_pedidos,
            AVG(p.ped_totliq) as avg_ticket,
            SUM(p.ped_totliq) as lifetime_val,
            CASE 
                WHEN COUNT(*) > 1 THEN 
                    EXTRACT(DAYS FROM (MAX(p.ped_data) - MIN(p.ped_data))) / (COUNT(*) - 1)
                ELSE NULL
            END as frequencia
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        GROUP BY c.cli_codigo, c.cli_nomred
    )
    SELECT 
        cli_codigo::INTEGER,
        cli_nomred::VARCHAR,
        dias_sem_comprar::INTEGER,
        ROUND(frequencia::NUMERIC, 0),
        qtd_pedidos::BIGINT,
        ROUND(avg_ticket::NUMERIC, 2),
        ROUND(lifetime_val::NUMERIC, 2),
        ROUND((lifetime_val / 12.0)::NUMERIC, 2),
        CASE 
            WHEN dias_sem_comprar > (frequencia * 2) THEN 'CRITICO'
            WHEN dias_sem_comprar > frequencia THEN 'ALERTA'
            ELSE 'OK'
        END::VARCHAR
    FROM client_behavior
    WHERE frequencia IS NOT NULL
      AND qtd_pedidos >= 5
      AND dias_sem_comprar > 30
    ORDER BY 
        CASE 
            WHEN dias_sem_comprar > (frequencia * 2) THEN 1
            WHEN dias_sem_comprar > frequencia THEN 2
            ELSE 3
        END,
        lifetime_val DESC;
END;
$$;


--
-- TOC entry 5242 (class 0 OID 0)
-- Dependencies: 695
-- Name: FUNCTION fn_churn_preditivo(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_churn_preditivo() IS 'Identifica clientes em risco de churn baseado em frequencia de compra';


--
-- TOC entry 696 (class 1255 OID 18794)
-- Name: fn_clientes_compraram_produto(integer, character varying, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clientes_compraram_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date) RETURNS TABLE(cli_codigo integer, cli_nome character varying, quantidade_total double precision, valor_total double precision, ultima_compra date, qtd_pedidos integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.cli_codigo,
        c.cli_nome,
        SUM(i.ite_quant) AS quantidade_total,
        SUM(i.ite_totliquido) AS valor_total,
        MAX(p.ped_data)::DATE AS ultima_compra,
        COUNT(DISTINCT p.ped_pedido)::INTEGER AS qtd_pedidos
    FROM pedidos p
    INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
    WHERE p.ped_industria = p_industria
      AND p.ped_data BETWEEN p_data_inicio AND p_data_fim
      AND p.ped_situacao = 'F'
      AND i.ite_produto = p_produto
    GROUP BY c.cli_codigo, c.cli_nome
    ORDER BY quantidade_total DESC;
END;
$$;


--
-- TOC entry 5243 (class 0 OID 0)
-- Dependencies: 696
-- Name: FUNCTION fn_clientes_compraram_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_clientes_compraram_produto(p_industria integer, p_produto character varying, p_data_inicio date, p_data_fim date) IS 'Lista clientes que compraram um produto específico no período com totais';


--
-- TOC entry 697 (class 1255 OID 18795)
-- Name: fn_clientes_mom(integer, integer, integer, boolean, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clientes_mom(p_mes integer, p_ano integer, p_industria integer, p_ano_todo boolean, p_rede_lojas boolean) RETURNS TABLE(cliente_nome text, valor_prev numeric, qtd_prev numeric, valor_curr numeric, qtd_curr numeric, perc_valor numeric, perc_qtd numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 698 (class 1255 OID 18796)
-- Name: fn_clientes_nunca_compraram_produto(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clientes_nunca_compraram_produto(p_industria integer, p_produto character varying) RETURNS TABLE(cli_codigo integer, cli_nome character varying, cli_cidade character varying, cli_uf character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.cli_codigo,
        c.cli_nome,
        c.cli_cidade,
        c.cli_uf
    FROM clientes c
    WHERE NOT EXISTS (
          SELECT 1
          FROM pedidos p
          INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
          WHERE p.ped_cliente = c.cli_codigo
            AND p.ped_industria = p_industria
            AND i.ite_produto = p_produto
      )
    ORDER BY c.cli_nome
    LIMIT 100;
END;
$$;


--
-- TOC entry 5244 (class 0 OID 0)
-- Dependencies: 698
-- Name: FUNCTION fn_clientes_nunca_compraram_produto(p_industria integer, p_produto character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_clientes_nunca_compraram_produto(p_industria integer, p_produto character varying) IS 'Lista clientes ativos que nunca compraram um produto específico';


--
-- TOC entry 699 (class 1255 OID 18797)
-- Name: fn_clientes_primeira_compra(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_clientes_primeira_compra(p_ano integer, p_mes integer, p_vendedor integer DEFAULT NULL::integer) RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, vendedor_codigo integer, vendedor_nome character varying, data_primeira_compra date, valor_primeira_compra numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
BEGIN
    v_data_inicio := make_date(p_ano, p_mes, 1);
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;

    RETURN QUERY
    WITH primeira_compra AS (
        SELECT 
            p.ped_cliente,
            p.ped_vendedor,
            MIN(p.ped_data) as data_primeira
        FROM pedidos p
        WHERE p.ped_situacao NOT IN ('C', 'X')
        GROUP BY p.ped_cliente, p.ped_vendedor
        HAVING MIN(p.ped_data) BETWEEN v_data_inicio AND v_data_fim
    ),
    valor_primeira AS (
        SELECT 
            pc.ped_cliente,
            pc.ped_vendedor,
            pc.data_primeira,
            SUM(p.ped_totliq) as valor
        FROM primeira_compra pc
        JOIN pedidos p ON p.ped_cliente = pc.ped_cliente 
                      AND p.ped_vendedor = pc.ped_vendedor 
                      AND p.ped_data = pc.data_primeira
                      AND p.ped_situacao NOT IN ('C', 'X')
        GROUP BY pc.ped_cliente, pc.ped_vendedor, pc.data_primeira
    )
    SELECT 
        c.cli_codigo::INTEGER,
        c.cli_nomred::VARCHAR,
        v.ven_codigo::INTEGER,
        v.ven_nome::VARCHAR,
        vp.data_primeira,
        ROUND(vp.valor::NUMERIC, 2)
    FROM valor_primeira vp
    JOIN clientes c ON c.cli_codigo = vp.ped_cliente
    JOIN vendedores v ON v.ven_codigo = vp.ped_vendedor
    WHERE (p_vendedor IS NULL OR vp.ped_vendedor = p_vendedor)
    ORDER BY vp.data_primeira DESC, vp.valor DESC
    LIMIT 20;
END;
$$;


--
-- TOC entry 694 (class 1255 OID 18798)
-- Name: fn_comparacao_quantidades_mensais(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_comparacao_quantidades_mensais(p_ano_atual integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer, p_ano_anterior integer DEFAULT ((EXTRACT(year FROM CURRENT_DATE) - (1)::numeric))::integer) RETURNS TABLE(mes integer, mes_nome character varying, quantidade_ano_atual double precision, quantidade_ano_anterior double precision, variacao_percentual double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH quantidades_atual AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_quant) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    quantidades_anterior AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_quant) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    meses AS (
        SELECT generate_series(1, 12) AS mes
    )
    SELECT
        m.mes,
        (CASE m.mes
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END)::VARCHAR(20) AS mes_nome,
        COALESCE(qa.total, 0) AS quantidade_ano_atual,
        COALESCE(qant.total, 0) AS quantidade_ano_anterior,
        CASE
            WHEN COALESCE(qant.total, 0) = 0 THEN 0
            ELSE ((COALESCE(qa.total, 0) - COALESCE(qant.total, 0)) / COALESCE(qant.total, 1)) * 100
        END AS variacao_percentual
    FROM meses m
    LEFT JOIN quantidades_atual qa ON qa.mes = m.mes
    LEFT JOIN quantidades_anterior qant ON qant.mes = m.mes
    ORDER BY m.mes;
END;
$$;


--
-- TOC entry 5245 (class 0 OID 0)
-- Dependencies: 694
-- Name: FUNCTION fn_comparacao_quantidades_mensais(p_ano_atual integer, p_ano_anterior integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_comparacao_quantidades_mensais(p_ano_atual integer, p_ano_anterior integer) IS 'Retorna comparação de QUANTIDADES vendidas mensais entre dois anos (padrão: ano atual vs ano anterior)';


--
-- TOC entry 701 (class 1255 OID 18799)
-- Name: fn_comparacao_vendas_mensais(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_comparacao_vendas_mensais(p_ano_atual integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer, p_ano_anterior integer DEFAULT ((EXTRACT(year FROM CURRENT_DATE) - (1)::numeric))::integer) RETURNS TABLE(mes integer, mes_nome character varying, vendas_ano_atual double precision, vendas_ano_anterior double precision, variacao_percentual double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH vendas_atual AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_totliquido) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    vendas_anterior AS (
        SELECT
            EXTRACT(MONTH FROM p.ped_data)::INTEGER AS mes,
            SUM(i.ite_totliquido) AS total
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_anterior
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    meses AS (
        SELECT generate_series(1, 12) AS mes
    )
    SELECT
        m.mes,
        (CASE m.mes
            WHEN 1 THEN 'Janeiro'
            WHEN 2 THEN 'Fevereiro'
            WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril'
            WHEN 5 THEN 'Maio'
            WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho'
            WHEN 8 THEN 'Agosto'
            WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro'
            WHEN 11 THEN 'Novembro'
            WHEN 12 THEN 'Dezembro'
        END)::VARCHAR(20) AS mes_nome,
        COALESCE(va.total, 0) AS vendas_ano_atual,
        COALESCE(vant.total, 0) AS vendas_ano_anterior,
        CASE
            WHEN COALESCE(vant.total, 0) = 0 THEN 0
            ELSE ((COALESCE(va.total, 0) - COALESCE(vant.total, 0)) / COALESCE(vant.total, 1)) * 100
        END AS variacao_percentual
    FROM meses m
    LEFT JOIN vendas_atual va ON va.mes = m.mes
    LEFT JOIN vendas_anterior vant ON vant.mes = m.mes
    ORDER BY m.mes;
END;
$$;


--
-- TOC entry 5246 (class 0 OID 0)
-- Dependencies: 701
-- Name: FUNCTION fn_comparacao_vendas_mensais(p_ano_atual integer, p_ano_anterior integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_comparacao_vendas_mensais(p_ano_atual integer, p_ano_anterior integer) IS 'Retorna comparação de vendas mensais entre dois anos (padrão: ano atual vs ano anterior)';


--
-- TOC entry 702 (class 1255 OID 18800)
-- Name: fn_comparativo_clientes(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_comparativo_clientes(p_ano_atual integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer) RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, ano_anterior bigint, ano_atual bigint, ultima_compra date, variacao numeric, status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH current_year AS (
        SELECT 
            c.cli_codigo,
            c.cli_nomred,
            COUNT(*) as pedidos,
            MAX(p.ped_data)::DATE as ult_compra
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual
        GROUP BY c.cli_codigo, c.cli_nomred
    ),
    previous_year AS (
        SELECT 
            c.cli_codigo,
            COUNT(*) as pedidos
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano_atual - 1
        GROUP BY c.cli_codigo
    )
    SELECT 
        COALESCE(cy.cli_codigo, py.cli_codigo)::INTEGER,
        COALESCE(cy.cli_nomred, 'Cliente Perdido')::VARCHAR,
        COALESCE(py.pedidos, 0)::BIGINT,
        COALESCE(cy.pedidos, 0)::BIGINT,
        cy.ult_compra,
        CASE 
            WHEN COALESCE(py.pedidos, 0) = 0 AND COALESCE(cy.pedidos, 0) > 0 THEN 100
            WHEN COALESCE(cy.pedidos, 0) = 0 THEN -100
            ELSE ROUND(((cy.pedidos::NUMERIC - py.pedidos) / py.pedidos * 100), 0)
        END,
        CASE
            WHEN COALESCE(cy.pedidos, 0) = 0 THEN 'Perdido'
            WHEN COALESCE(py.pedidos, 0) = 0 THEN 'Novo'
            WHEN cy.pedidos::NUMERIC / py.pedidos >= 1.5 THEN 'Destaque'
            WHEN cy.pedidos > py.pedidos THEN 'Crescendo'
            WHEN cy.pedidos < py.pedidos THEN 'Em Queda'
            ELSE 'Estável'
        END::VARCHAR
    FROM current_year cy
    FULL OUTER JOIN previous_year py ON cy.cli_codigo = py.cli_codigo
    WHERE COALESCE(cy.pedidos, 0) + COALESCE(py.pedidos, 0) >= 5
    ORDER BY 
        CASE 
            WHEN COALESCE(cy.pedidos, 0) = 0 THEN 1
            WHEN cy.pedidos::NUMERIC / NULLIF(py.pedidos, 0) >= 1.5 THEN 2
            ELSE 3
        END,
        6 DESC
    LIMIT 50;
END;
$$;


--
-- TOC entry 703 (class 1255 OID 18801)
-- Name: fn_comparativo_clientes(integer, integer, integer, date, date, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_comparativo_clientes(p_industria integer, p_cliente_ref integer, p_cliente_alvo integer, p_data_ini date, p_data_fim date, p_modo character varying) RETURNS TABLE(codigo character varying, descricao character varying, qtd_ref numeric, qtd_alvo numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 704 (class 1255 OID 18802)
-- Name: fn_correlacao_produtos(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_correlacao_produtos(p_meses_atras integer DEFAULT 6) RETURNS TABLE(produto_a_id integer, produto_a_nome character varying, produto_b_id integer, produto_b_nome character varying, vezes_juntos bigint, taxa_conversao numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH product_pairs AS (
        SELECT 
            i1.ite_produto as prod_a,
            i2.ite_produto as prod_b,
            COUNT(DISTINCT i1.ite_pedido) as freq
        FROM itens_ped i1
        INNER JOIN itens_ped i2 ON i1.ite_pedido = i2.ite_pedido 
            AND i1.ite_produto < i2.ite_produto
        INNER JOIN pedidos p ON i1.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= CURRENT_DATE - (p_meses_atras || ' months')::INTERVAL
        GROUP BY i1.ite_produto, i2.ite_produto
        HAVING COUNT(DISTINCT i1.ite_pedido) >= 3
    )
    SELECT 
        pp.prod_a::INTEGER,
        p1.pro_nome::VARCHAR,
        pp.prod_b::INTEGER,
        p2.pro_nome::VARCHAR,
        pp.freq::BIGINT,
        ROUND((pp.freq::NUMERIC / NULLIF((
            SELECT COUNT(DISTINCT ite_pedido) 
            FROM itens_ped 
            WHERE ite_produto = pp.prod_a
        ), 0) * 100), 0)
    FROM product_pairs pp
    INNER JOIN cad_prod p1 ON pp.prod_a = p1.pro_id
    INNER JOIN cad_prod p2 ON pp.prod_b = p2.pro_id
    ORDER BY pp.freq DESC
    LIMIT 10;
END;
$$;


--
-- TOC entry 5247 (class 0 OID 0)
-- Dependencies: 704
-- Name: FUNCTION fn_correlacao_produtos(p_meses_atras integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_correlacao_produtos(p_meses_atras integer) IS 'Identifica produtos frequentemente comprados juntos';


--
-- TOC entry 705 (class 1255 OID 18803)
-- Name: fn_curva_abc(integer, text, text, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_curva_abc(p_ano integer DEFAULT (EXTRACT(year FROM CURRENT_DATE))::integer, p_meses text DEFAULT 'todos'::text, p_industria text DEFAULT 'todos'::text, p_clientes text DEFAULT 'todos'::text, p_metrica text DEFAULT 'valor'::text) RETURNS TABLE(produto_id integer, produto_nome character varying, total numeric, qtd_clientes integer, percentual numeric, percentual_acum numeric, curva character, ranking integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    -----------------------------------------------------------------
    -- 1️⃣  Agrupamento por produto (usando a FK correta)
    -----------------------------------------------------------------
    WITH produto_totais AS (
        SELECT
            i.ite_idproduto                     AS ite_prod,
            pr.pro_nome,
            CASE
                WHEN p_metrica = 'quantidade' THEN SUM(i.ite_quant)
                WHEN p_metrica = 'unidades'   THEN COUNT(DISTINCT i.ite_pedido)::NUMERIC
                ELSE SUM(i.ite_totliquido)
            END                                 AS total_calc,
            COUNT(DISTINCT p.ped_cliente)       AS clientes
        FROM itens_ped i
        INNER JOIN pedidos p      ON i.ite_pedido = p.ped_pedido
        INNER JOIN cad_prod pr    ON i.ite_idproduto = pr.pro_id          -- <‑‑ CORREÇÃO
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND (p_meses = 'todos'
               OR EXTRACT(MONTH FROM p.ped_data)::TEXT = ANY(string_to_array(p_meses, ',')))
          AND (p_industria = 'todos' OR p.ped_industria::TEXT = p_industria)
          AND (p_clientes = 'todos' OR p.ped_cliente::TEXT = ANY(string_to_array(p_clientes, ',')))
        GROUP BY i.ite_idproduto, pr.pro_nome
    ),

    -----------------------------------------------------------------
    -- 2️⃣  Acumulação para cálculo da curva ABC
    -----------------------------------------------------------------
    produto_acumulado AS (
        SELECT
            ite_prod,
            pro_nome,
            total_calc,
            clientes,
            SUM(total_calc) OVER ()                         AS total_geral,
            SUM(total_calc) OVER (ORDER BY total_calc DESC) AS acumulado,
            ROW_NUMBER() OVER (ORDER BY total_calc DESC)    AS rank_num
        FROM produto_totais
    )
    -----------------------------------------------------------------
    -- 3️⃣  Resultado final (já com percentuais e classificação)
    -----------------------------------------------------------------
    SELECT
        ite_prod::INTEGER,
        pro_nome::VARCHAR,
        ROUND(total_calc::NUMERIC, 2)                                 AS total,
        clientes::INTEGER,
        ROUND((total_calc / NULLIF(total_geral, 0) * 100)::NUMERIC, 2) AS percentual,
        ROUND((acumulado / NULLIF(total_geral, 0) * 100)::NUMERIC, 2) AS percentual_acum,
        CASE
            WHEN acumulado / NULLIF(total_geral, 0) <= 0.80 THEN 'A'
            WHEN acumulado / NULLIF(total_geral, 0) <= 0.95 THEN 'B'
            ELSE 'C'
        END::CHAR(1)                                                   AS curva,
        rank_num::INTEGER
    FROM produto_acumulado
    ORDER BY total_calc DESC;
END;
$$;


--
-- TOC entry 5248 (class 0 OID 0)
-- Dependencies: 705
-- Name: FUNCTION fn_curva_abc(p_ano integer, p_meses text, p_industria text, p_clientes text, p_metrica text); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_curva_abc(p_ano integer, p_meses text, p_industria text, p_clientes text, p_metrica text) IS 'Calcula Curva ABC por Valor, Quantidade ou Pedidos com filtros dinamicos';


--
-- TOC entry 706 (class 1255 OID 18804)
-- Name: fn_eficiencia_comercial(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_eficiencia_comercial() RETURNS TABLE(metrica character varying, valor_atual numeric, valor_anterior numeric, variacao_pct numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'Ticket Medio'::VARCHAR,
        ROUND((SELECT AVG(ped_totliq) FROM pedidos 
               WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE))::NUMERIC, 2),
        ROUND((SELECT AVG(ped_totliq) FROM pedidos 
               WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                 AND ped_data < DATE_TRUNC('month', CURRENT_DATE))::NUMERIC, 2),
        ROUND((
            (SELECT AVG(ped_totliq) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE)) -
            (SELECT AVG(ped_totliq) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND ped_data < DATE_TRUNC('month', CURRENT_DATE))
        ) / NULLIF((SELECT AVG(ped_totliq) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND ped_data < DATE_TRUNC('month', CURRENT_DATE)), 0) * 100, 1)
    
    UNION ALL
    
    SELECT 
        'Pedidos/Cliente'::VARCHAR,
        ROUND((SELECT AVG(qtd) FROM (
            SELECT COUNT(*) as qtd FROM pedidos 
            WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY ped_cliente
        ) t)::NUMERIC, 1),
        ROUND((SELECT AVG(qtd) FROM (
            SELECT COUNT(*) as qtd FROM pedidos 
            WHERE ped_data >= CURRENT_DATE - INTERVAL '15 months'
              AND ped_data < CURRENT_DATE - INTERVAL '12 months'
            GROUP BY ped_cliente
        ) t)::NUMERIC, 1),
        0::NUMERIC;
END;
$$;


--
-- TOC entry 5249 (class 0 OID 0)
-- Dependencies: 706
-- Name: FUNCTION fn_eficiencia_comercial(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_eficiencia_comercial() IS 'Metricas de eficiencia comercial com comparativos';


--
-- TOC entry 707 (class 1255 OID 18805)
-- Name: fn_formatar_periodo(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_formatar_periodo(p_ano integer, p_mes integer DEFAULT NULL::integer) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
        DECLARE
            v_mes_nome VARCHAR;
        BEGIN
            IF p_mes IS NOT NULL THEN
                v_mes_nome := CASE p_mes
                    WHEN 1 THEN 'Janeiro'
                    WHEN 2 THEN 'Fevereiro'
                    WHEN 3 THEN 'Março'
                    WHEN 4 THEN 'Abril'
                    WHEN 5 THEN 'Maio'
                    WHEN 6 THEN 'Junho'
                    WHEN 7 THEN 'Julho'
                    WHEN 8 THEN 'Agosto'
                    WHEN 9 THEN 'Setembro'
                    WHEN 10 THEN 'Outubro'
                    WHEN 11 THEN 'Novembro'
                    WHEN 12 THEN 'Dezembro'
                END;
                RETURN v_mes_nome || '/' || p_ano::VARCHAR;
            ELSE
                RETURN 'Ano completo ' || p_ano::VARCHAR;
            END IF;
        END;
        $$;


--
-- TOC entry 708 (class 1255 OID 18806)
-- Name: fn_itens_nunca_comprados(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_itens_nunca_comprados(p_industria integer, p_cliente integer) RETURNS TABLE(codigo character varying, descricao character varying, aplicacao character varying)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 709 (class 1255 OID 18807)
-- Name: fn_lista_industrias(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_lista_industrias() RETURNS TABLE(codigo integer, nome character varying)
    LANGUAGE plpgsql
    AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                f.for_codigo as codigo,
                f.for_nomered as nome
            FROM fornecedores f
            WHERE f.for_tipo2 = 'A'
            ORDER BY f.for_nomered;
        END;
        $$;


--
-- TOC entry 710 (class 1255 OID 18808)
-- Name: fn_listar_produtos_tabela(integer, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_listar_produtos_tabela(p_industria integer, p_tabela character varying) RETURNS TABLE(itab_idprod integer, itab_idindustria integer, itab_tabela character varying, pro_codprod character varying, pro_nome character varying, itab_grupodesconto integer, itab_descontoadd double precision, itab_ipi double precision, itab_st double precision, itab_prepeso double precision, itab_precobruto double precision, itab_precopromo double precision, itab_precoespecial double precision, preco_liquido double precision, itab_datatabela date, itab_datavencimento date, itab_status boolean)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        ct.itab_idprod,
        ct.itab_idindustria,
        ct.itab_tabela,
        cp.pro_codprod,
        cp.pro_nome,
        ct.itab_grupodesconto,
        ct.itab_descontoadd,
        ct.itab_ipi,
        ct.itab_st,
        ct.itab_prepeso,
        ct.itab_precobruto,
        ct.itab_precopromo,
        ct.itab_precoespecial,
        -- Cálculo do preço líquido com descontos em cascata
        CASE 
            WHEN ct.itab_grupodesconto > 0 AND gd.gde_id IS NOT NULL THEN
                -- Aplica os 9 descontos em cascata sobre o preço bruto
                CAST(
                    ROUND(
                        CAST(
                            ct.itab_precobruto *
                            (1 - COALESCE(gd.gde_desc1, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc2, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc3, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc4, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc5, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc6, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc7, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc8, 0) / 100) *
                            (1 - COALESCE(gd.gde_desc9, 0) / 100)
                        AS NUMERIC), 2)
                AS DOUBLE PRECISION)
            ELSE
                NULL  -- Retorna NULL se não houver grupo de desconto
        END AS preco_liquido,
        ct.itab_datatabela,
        ct.itab_datavencimento,
        ct.itab_status
    FROM cad_tabelaspre ct
    LEFT JOIN cad_prod cp ON ct.itab_idprod = cp.pro_id
    LEFT JOIN grupo_desc gd ON ct.itab_grupodesconto = gd.gde_id
    WHERE ct.itab_idindustria = p_industria 
      AND ct.itab_tabela = p_tabela
    ORDER BY cp.pro_codprod;
END;
$$;


--
-- TOC entry 5250 (class 0 OID 0)
-- Dependencies: 710
-- Name: FUNCTION fn_listar_produtos_tabela(p_industria integer, p_tabela character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_listar_produtos_tabela(p_industria integer, p_tabela character varying) IS 'Lista todos os produtos com seus preços de uma tabela específica de uma indústria. 
Inclui cálculo de preço líquido aplicando descontos do grupo em cascata (gde_desc1 a gde_desc9).';


--
-- TOC entry 711 (class 1255 OID 18809)
-- Name: fn_listar_tabelas_industria(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_listar_tabelas_industria(p_industria integer) RETURNS TABLE(itab_idindustria integer, itab_tabela character varying, itab_datatabela date, itab_datavencimento date, itab_status boolean)
    LANGUAGE plpgsql
    AS $$
            BEGIN
                RETURN QUERY
                SELECT
                    ct.itab_idindustria,
                    ct.itab_tabela,
                    MAX(ct.itab_datatabela) AS itab_datatabela,
                    MAX(ct.itab_datavencimento) AS itab_datavencimento,
                    BOOL_AND(ct.itab_status) AS itab_status
                FROM cad_tabelaspre ct
                WHERE ct.itab_idindustria = p_industria
                GROUP BY ct.itab_idindustria, ct.itab_tabela
                ORDER BY ct.itab_tabela;
            END;
            $$;


--
-- TOC entry 700 (class 1255 OID 18810)
-- Name: fn_mapa_cliente_geral(date, date, integer, integer, boolean); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_mapa_cliente_geral(p_data_ini date, p_data_fim date, p_industria integer, p_cliente integer, p_considerar_grupo boolean DEFAULT false) RETURNS TABLE(codigo text, descricao text, qtd_cliente numeric, qtd_geral numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 712 (class 1255 OID 18811)
-- Name: fn_mapa_grupo_lojas(date, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_mapa_grupo_lojas(p_data_ini date, p_data_fim date, p_industria integer) RETURNS TABLE(cliente text, pedido text, grupo text, total numeric, data date, quant numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 713 (class 1255 OID 18812)
-- Name: fn_metas_analise_diaria(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_analise_diaria(p_ano integer, p_mes integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(dia integer, mes_anterior numeric, mes_atual numeric, variacao_percentual numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mes_ant INTEGER;
    v_ano_ant INTEGER;
    v_ultimo_dia INTEGER;
BEGIN
    IF p_mes = 1 THEN
        v_mes_ant := 12;
        v_ano_ant := p_ano - 1;
    ELSE
        v_mes_ant := p_mes - 1;
        v_ano_ant := p_ano;
    END IF;

    v_ultimo_dia := EXTRACT(DAY FROM (DATE_TRUNC('MONTH', MAKE_DATE(p_ano, p_mes, 1)) + INTERVAL '1 MONTH - 1 DAY'))::INTEGER;

    RETURN QUERY
    WITH dias AS (
        SELECT generate_series(1, v_ultimo_dia) AS num_dia
    ),
    vendas_ant AS (
        SELECT EXTRACT(DAY FROM ped_data + INTERVAL '1 day')::INTEGER AS num_dia, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = v_ano_ant
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = v_mes_ant
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY EXTRACT(DAY FROM ped_data + INTERVAL '1 day')
    ),
    vendas_atu AS (
        SELECT EXTRACT(DAY FROM ped_data + INTERVAL '1 day')::INTEGER AS num_dia, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY EXTRACT(DAY FROM ped_data + INTERVAL '1 day')
    )
    SELECT 
        d.num_dia::INTEGER,
        COALESCE(va.total, 0)::NUMERIC,
        COALESCE(vt.total, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(va.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vt.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vt.total, 0) - va.total) / va.total * 100)::NUMERIC, 2)
        END::NUMERIC
    FROM dias d
    LEFT JOIN vendas_ant va ON va.num_dia = d.num_dia
    LEFT JOIN vendas_atu vt ON vt.num_dia = d.num_dia
    ORDER BY d.num_dia;
END;
$$;


--
-- TOC entry 714 (class 1255 OID 18813)
-- Name: fn_metas_analise_semanal_pivot(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_analise_semanal_pivot(p_ano integer, p_mes integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, semana_1 numeric, semana_2 numeric, semana_3 numeric, semana_4 numeric, total numeric)
    LANGUAGE sql
    AS $$
    WITH vendas_semanal AS (
        SELECT 
            ped_industria,
            CASE 
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 7 THEN 1
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 14 THEN 2
                WHEN EXTRACT(DAY FROM ped_data + INTERVAL '1 day') <= 21 THEN 3
                ELSE 4
            END AS semana,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM ped_data + INTERVAL '1 day') = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria, semana
    ),
    pivot AS (
        SELECT 
            f.for_codigo,
            f.for_nomered,
            COALESCE(SUM(CASE WHEN vs.semana = 1 THEN vs.total ELSE 0 END), 0) AS s1,
            COALESCE(SUM(CASE WHEN vs.semana = 2 THEN vs.total ELSE 0 END), 0) AS s2,
            COALESCE(SUM(CASE WHEN vs.semana = 3 THEN vs.total ELSE 0 END), 0) AS s3,
            COALESCE(SUM(CASE WHEN vs.semana = 4 THEN vs.total ELSE 0 END), 0) AS s4
        FROM fornecedores f
        LEFT JOIN vendas_semanal vs ON vs.ped_industria = f.for_codigo
        WHERE f.for_tipo2 <> 'I'
          AND (p_industria IS NULL OR f.for_codigo = p_industria)
        GROUP BY f.for_codigo, f.for_nomered
    )
    SELECT 
        for_codigo::INTEGER,
        for_nomered::VARCHAR,
        s1::NUMERIC,
        s2::NUMERIC,
        s3::NUMERIC,
        s4::NUMERIC,
        (s1 + s2 + s3 + s4)::NUMERIC AS total
    FROM pivot
    WHERE s1 + s2 + s3 + s4 > 0
    ORDER BY total DESC;
$$;


--
-- TOC entry 715 (class 1255 OID 18814)
-- Name: fn_metas_atingimento_industria(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_atingimento_industria(p_ano integer, p_mes_ate integer DEFAULT 12, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, meta_total numeric, realizado_total numeric, percentual_atingimento numeric, status character varying)
    LANGUAGE sql
    AS $_$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1
          AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_calc AS (
        SELECT 
            ped_industria,
            SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo::INTEGER,
        f.for_nomered::VARCHAR,
        COALESCE(mc.soma_meta, 0)::NUMERIC,
        COALESCE(vc.soma_vendas, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
        END::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vc.soma_vendas, 0) < mc.soma_meta * 0.90 THEN 'Abaixo'
            WHEN COALESCE(vc.soma_vendas, 0) >= mc.soma_meta THEN 'Acima'
            ELSE 'Na Meta'
        END::VARCHAR
    FROM fornecedores f
    LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
    LEFT JOIN vendas_calc vc ON vc.ped_industria = f.for_codigo
    WHERE ($3 IS NULL OR f.for_codigo = $3)
      AND f.for_tipo2 <> 'I'
      AND (mc.soma_meta IS NOT NULL OR vc.soma_vendas IS NOT NULL)
    ORDER BY CASE 
        WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
        ELSE (COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)
    END DESC;
$_$;


--
-- TOC entry 716 (class 1255 OID 18815)
-- Name: fn_metas_matriz_acao(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_matriz_acao(p_ano integer, p_mes_ate integer DEFAULT 12, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, meta_total numeric, realizado_total numeric, percentual_meta numeric, valor_realizado numeric, quadrante character varying, prioridade character varying)
    LANGUAGE sql
    AS $_$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1 AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_calc AS (
        SELECT ped_industria, SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    dados AS (
        SELECT 
            f.for_codigo,
            f.for_nomered,
            COALESCE(mc.soma_meta, 0) AS mt,
            COALESCE(vc.soma_vendas, 0) AS vd,
            CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
                 ELSE ROUND((COALESCE(vc.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
            END AS perc
        FROM fornecedores f
        LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
        LEFT JOIN vendas_calc vc ON vc.ped_industria = f.for_codigo
        WHERE ($3 IS NULL OR f.for_codigo = $3)
          AND f.for_tipo2 <> 'I'
          AND (mc.soma_meta IS NOT NULL OR vc.soma_vendas IS NOT NULL)
    ),
    avg_vendas AS (SELECT AVG(vd) AS media FROM dados)
    SELECT 
        d.for_codigo::INTEGER,
        d.for_nomered::VARCHAR,
        d.mt::NUMERIC,
        d.vd::NUMERIC,
        d.perc::NUMERIC,
        d.vd::NUMERIC,
        CASE 
            WHEN d.perc >= 100 AND d.vd >= av.media THEN 'Q1: Alta Meta + Alto Valor'
            WHEN d.perc >= 100 AND d.vd < av.media THEN 'Q2: Alta Meta + Baixo Valor'
            WHEN d.perc < 100 AND d.vd >= av.media THEN 'Q3: Baixa Meta + Alto Valor'
            ELSE 'Q4: Baixa Meta + Baixo Valor'
        END::VARCHAR,
        CASE 
            WHEN d.perc < 70 THEN 'CRÍTICO'
            WHEN d.perc < 90 THEN 'ATENÇÃO'
            WHEN d.perc >= 100 THEN 'OK'
            ELSE 'MONITORAR'
        END::VARCHAR
    FROM dados d
    CROSS JOIN avg_vendas av
    ORDER BY d.perc ASC, d.vd DESC;
$_$;


--
-- TOC entry 717 (class 1255 OID 18816)
-- Name: fn_metas_por_mes(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_por_mes(p_ano integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, mes integer, mes_nome character varying, ano_anterior numeric, meta_ano_corrente numeric, vendas_ano_corrente numeric, perc_atingimento numeric, perc_relacao_ano_ant numeric)
    LANGUAGE sql
    AS $_$
    WITH meses AS (
        SELECT 
            m.num AS mes,
            CASE m.num
                WHEN 1 THEN 'janeiro'
                WHEN 2 THEN 'fevereiro'
                WHEN 3 THEN 'março'
                WHEN 4 THEN 'abril'
                WHEN 5 THEN 'maio'
                WHEN 6 THEN 'junho'
                WHEN 7 THEN 'julho'
                WHEN 8 THEN 'agosto'
                WHEN 9 THEN 'setembro'
                WHEN 10 THEN 'outubro'
                WHEN 11 THEN 'novembro'
                WHEN 12 THEN 'dezembro'
            END AS mes_nome
        FROM generate_series(1, 12) AS m(num)
    ),
    industrias AS (
        SELECT 
            f.for_codigo,
            f.for_nomered
        FROM fornecedores f
        WHERE ($2 IS NULL OR f.for_codigo = $2)
          AND f.for_tipo2 <> 'I'
    ),
    vendas_ano_ant AS (
        SELECT 
            ped_industria,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1 - 1
          AND ped_situacao IN ('P', 'F')
          AND ($2 IS NULL OR ped_industria = $2)
        GROUP BY ped_industria, EXTRACT(MONTH FROM ped_data)
    ),
    vendas_ano_cor AS (
        SELECT 
            ped_industria,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND ped_situacao IN ('P', 'F')
          AND ($2 IS NULL OR ped_industria = $2)
        GROUP BY ped_industria, EXTRACT(MONTH FROM ped_data)
    ),
    metas_data AS (
        SELECT 
            met_industria,
            UNNEST(ARRAY[met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                         met_jul, met_ago, met_set, met_out, met_nov, met_dez]) AS meta_valor,
            UNNEST(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]) AS mes
        FROM ind_metas
        WHERE met_ano = $1
          AND ($2 IS NULL OR met_industria = $2)
    )
    SELECT 
        i.for_codigo::INTEGER,
        i.for_nomered::VARCHAR,
        m.mes::INTEGER,
        m.mes_nome::VARCHAR,
        COALESCE(vaa.total, 0)::NUMERIC,
        COALESCE(mt.meta_valor, 0)::NUMERIC,
        COALESCE(vac.total, 0)::NUMERIC,
        CASE 
            WHEN COALESCE(mt.meta_valor, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(vac.total, 0) / mt.meta_valor * 100)::NUMERIC, 2)
        END::NUMERIC,
        CASE 
            WHEN COALESCE(vaa.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vac.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vac.total, 0) - vaa.total) / vaa.total * 100)::NUMERIC, 2)
        END::NUMERIC
    FROM industrias i
    CROSS JOIN meses m
    LEFT JOIN vendas_ano_ant vaa ON vaa.ped_industria = i.for_codigo AND vaa.mes = m.mes
    LEFT JOIN vendas_ano_cor vac ON vac.ped_industria = i.for_codigo AND vac.mes = m.mes
    LEFT JOIN metas_data mt ON mt.met_industria = i.for_codigo AND mt.mes = m.mes
    ORDER BY i.for_nomered, m.mes;
$_$;


--
-- TOC entry 718 (class 1255 OID 18817)
-- Name: fn_metas_resumo_geral(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_resumo_geral(p_ano integer, p_mes integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(total_mes_anterior numeric, total_mes_atual numeric, variacao_percentual numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mes_anterior INTEGER;
    v_ano_anterior INTEGER;
    v_total_ant NUMERIC;
    v_total_atu NUMERIC;
BEGIN
    IF p_mes = 1 THEN
        v_mes_anterior := 12;
        v_ano_anterior := p_ano - 1;
    ELSE
        v_mes_anterior := p_mes - 1;
        v_ano_anterior := p_ano;
    END IF;

    -- Mês anterior
    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_ant
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = v_ano_anterior
      AND EXTRACT(MONTH FROM ped_data) = v_mes_anterior
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    -- Mês atual
    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_atu
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = p_ano
      AND EXTRACT(MONTH FROM ped_data) = p_mes
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    RETURN QUERY
    SELECT 
        v_total_ant,
        v_total_atu,
        CASE 
            WHEN v_total_ant = 0 THEN 
                CASE WHEN v_total_atu > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((v_total_atu - v_total_ant) / v_total_ant * 100)::NUMERIC, 2)
        END;
END;
$$;


--
-- TOC entry 719 (class 1255 OID 18818)
-- Name: fn_metas_status_industrias(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_status_industrias(p_ano integer, p_mes_ate integer DEFAULT 12, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, meta_total numeric, atual numeric, percentual_meta numeric, saldo numeric, status character varying, tendencia character varying)
    LANGUAGE sql
    AS $_$
    WITH metas_calc AS (
        SELECT 
            met_industria,
            (CASE WHEN $2 >= 1 THEN COALESCE(met_jan, 0) ELSE 0 END +
             CASE WHEN $2 >= 2 THEN COALESCE(met_fev, 0) ELSE 0 END +
             CASE WHEN $2 >= 3 THEN COALESCE(met_mar, 0) ELSE 0 END +
             CASE WHEN $2 >= 4 THEN COALESCE(met_abr, 0) ELSE 0 END +
             CASE WHEN $2 >= 5 THEN COALESCE(met_mai, 0) ELSE 0 END +
             CASE WHEN $2 >= 6 THEN COALESCE(met_jun, 0) ELSE 0 END +
             CASE WHEN $2 >= 7 THEN COALESCE(met_jul, 0) ELSE 0 END +
             CASE WHEN $2 >= 8 THEN COALESCE(met_ago, 0) ELSE 0 END +
             CASE WHEN $2 >= 9 THEN COALESCE(met_set, 0) ELSE 0 END +
             CASE WHEN $2 >= 10 THEN COALESCE(met_out, 0) ELSE 0 END +
             CASE WHEN $2 >= 11 THEN COALESCE(met_nov, 0) ELSE 0 END +
             CASE WHEN $2 >= 12 THEN COALESCE(met_dez, 0) ELSE 0 END) AS soma_meta
        FROM ind_metas
        WHERE met_ano = $1 AND ($3 IS NULL OR met_industria = $3)
    ),
    vendas_periodo AS (
        SELECT ped_industria, SUM(ped_totliq) AS soma_vendas
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) <= $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    vendas_mes_ant AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) = GREATEST($2 - 1, 1)
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    ),
    vendas_mes_atu AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = $1
          AND EXTRACT(MONTH FROM ped_data) = $2
          AND ped_situacao IN ('P', 'F')
          AND ($3 IS NULL OR ped_industria = $3)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo::INTEGER,
        f.for_nomered::VARCHAR,
        COALESCE(mc.soma_meta, 0)::NUMERIC,
        COALESCE(vp.soma_vendas, 0)::NUMERIC,
        CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
             ELSE ROUND((COALESCE(vp.soma_vendas, 0) / mc.soma_meta * 100)::NUMERIC, 2)
        END::NUMERIC,
        (COALESCE(mc.soma_meta, 0) - COALESCE(vp.soma_vendas, 0))::NUMERIC,
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta THEN 'Atingida'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta * 0.80 THEN 'Em Risco'
            ELSE 'Abaixo'
        END::VARCHAR,
        CASE 
            WHEN COALESCE(vmu.total, 0) > COALESCE(vma.total, 0) * 1.05 THEN '↗'
            WHEN COALESCE(vmu.total, 0) < COALESCE(vma.total, 0) * 0.95 THEN '↘'
            ELSE '→'
        END::VARCHAR
    FROM fornecedores f
    LEFT JOIN metas_calc mc ON mc.met_industria = f.for_codigo
    LEFT JOIN vendas_periodo vp ON vp.ped_industria = f.for_codigo
    LEFT JOIN vendas_mes_ant vma ON vma.ped_industria = f.for_codigo
    LEFT JOIN vendas_mes_atu vmu ON vmu.ped_industria = f.for_codigo
    WHERE ($3 IS NULL OR f.for_codigo = $3)
      AND f.for_tipo2 <> 'I'
      AND (mc.soma_meta IS NOT NULL OR vp.soma_vendas IS NOT NULL)
    ORDER BY 
        CASE 
            WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 'Sem Meta'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta THEN 'Atingida'
            WHEN COALESCE(vp.soma_vendas, 0) >= mc.soma_meta * 0.80 THEN 'Em Risco'
            ELSE 'Abaixo'
        END,
        CASE WHEN COALESCE(mc.soma_meta, 0) = 0 THEN 0
             ELSE (COALESCE(vp.soma_vendas, 0) / mc.soma_meta * 100)
        END DESC;
$_$;


--
-- TOC entry 720 (class 1255 OID 18819)
-- Name: fn_metas_variacao_vendas(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_metas_variacao_vendas(p_ano integer, p_mes integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(industria_codigo integer, industria_nome character varying, mes_anterior numeric, mes_atual numeric, variacao_absoluta numeric, variacao_percentual numeric, participacao_percentual numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mes_ant INTEGER;
    v_ano_ant INTEGER;
    v_total_geral NUMERIC;
BEGIN
    IF p_mes = 1 THEN
        v_mes_ant := 12;
        v_ano_ant := p_ano - 1;
    ELSE
        v_mes_ant := p_mes - 1;
        v_ano_ant := p_ano;
    END IF;

    SELECT COALESCE(SUM(ped_totliq), 0) INTO v_total_geral
    FROM pedidos
    WHERE EXTRACT(YEAR FROM ped_data) = p_ano
      AND EXTRACT(MONTH FROM ped_data) = p_mes
      AND ped_situacao IN ('P', 'F')
      AND (p_industria IS NULL OR ped_industria = p_industria);

    RETURN QUERY
    WITH vendas_ant AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = v_ano_ant
          AND EXTRACT(MONTH FROM ped_data) = v_mes_ant
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria
    ),
    vendas_atu AS (
        SELECT ped_industria, SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = p_ano
          AND EXTRACT(MONTH FROM ped_data) = p_mes
          AND ped_situacao IN ('P', 'F')
          AND (p_industria IS NULL OR ped_industria = p_industria)
        GROUP BY ped_industria
    )
    SELECT 
        f.for_codigo,
        f.for_nomered,
        COALESCE(va.total, 0),
        COALESCE(vt.total, 0),
        COALESCE(vt.total, 0) - COALESCE(va.total, 0),
        CASE 
            WHEN COALESCE(va.total, 0) = 0 THEN 
                CASE WHEN COALESCE(vt.total, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ROUND(((COALESCE(vt.total, 0) - va.total) / va.total * 100)::NUMERIC, 2)
        END,
        CASE 
            WHEN v_total_geral = 0 THEN 0
            ELSE ROUND((COALESCE(vt.total, 0) / v_total_geral * 100)::NUMERIC, 2)
        END
    FROM fornecedores f
    LEFT JOIN vendas_ant va ON va.ped_industria = f.for_codigo
    LEFT JOIN vendas_atu vt ON vt.ped_industria = f.for_codigo
    WHERE (p_industria IS NULL OR f.for_codigo = p_industria)
      AND f.for_tipo2 <> 'I'
      AND (va.total IS NOT NULL OR vt.total IS NOT NULL)
    ORDER BY COALESCE(vt.total, 0) DESC;
END;
$$;


--
-- TOC entry 721 (class 1255 OID 18820)
-- Name: fn_normalizar_codigo(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_normalizar_codigo(codigo character varying) RETURNS character varying
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    resultado VARCHAR(50);
BEGIN
    -- Retorna NULL se o código for NULL ou vazio
    IF codigo IS NULL OR TRIM(codigo) = '' THEN
        RETURN NULL;
    END IF;
    
    -- Remove caracteres especiais e converte para maiúsculas
    -- Mantém apenas letras (A-Z) e números (0-9)
    resultado := UPPER(REGEXP_REPLACE(codigo, '[^A-Z0-9]', '', 'g'));
    
    -- Remove zeros à esquerda
    resultado := REGEXP_REPLACE(resultado, '^0+', '');
    
    -- Se ficou vazio (era tudo zero ou caracteres especiais), retorna '0'
    IF resultado = '' THEN
        resultado := '0';
    END IF;
    
    RETURN resultado;
END;
$$;


--
-- TOC entry 5251 (class 0 OID 0)
-- Dependencies: 721
-- Name: FUNCTION fn_normalizar_codigo(codigo character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_normalizar_codigo(codigo character varying) IS 'Normaliza códigos de produtos: remove caracteres especiais, converte para maiúsculas e remove zeros à esquerda. Exemplos: "ABC-0001" → "ABC1", "XYZ 0123" → "XYZ123", "000" → "0"';


--
-- TOC entry 722 (class 1255 OID 18821)
-- Name: fn_oportunidades_perdidas(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_oportunidades_perdidas() RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, produtos_distintos bigint, total_gasto numeric, produtos_top_nao_comprados bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH recent_buyers AS (
        SELECT DISTINCT ped_cliente
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months'
    ),
    category_buyers AS (
        SELECT 
            p.ped_cliente,
            COUNT(DISTINCT i.ite_produto) as prods,
            SUM(i.ite_totliquido) as valor
        FROM pedidos p
        INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
        WHERE p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY p.ped_cliente
    ),
    top_products AS (
        SELECT ite_produto
        FROM itens_ped i
        INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= CURRENT_DATE - INTERVAL '3 months'
        GROUP BY ite_produto
        ORDER BY SUM(ite_totliquido) DESC
        LIMIT 10
    )
    SELECT 
        cb.ped_cliente::INTEGER,
        c.cli_nomred::VARCHAR,
        cb.prods::BIGINT,
        ROUND(cb.valor::NUMERIC, 2),
        (
            SELECT COUNT(*) 
            FROM top_products tp
            WHERE NOT EXISTS (
                SELECT 1 FROM itens_ped i2
                INNER JOIN pedidos p2 ON i2.ite_pedido = p2.ped_pedido
                WHERE p2.ped_cliente = cb.ped_cliente 
                  AND i2.ite_produto = tp.ite_produto
                  AND p2.ped_data >= CURRENT_DATE - INTERVAL '6 months'
            )
        )::BIGINT
    FROM category_buyers cb
    INNER JOIN clientes c ON cb.ped_cliente = c.cli_codigo
    INNER JOIN recent_buyers rb ON cb.ped_cliente = rb.ped_cliente
    WHERE cb.prods >= 3
    ORDER BY 5 DESC, cb.valor DESC
    LIMIT 10;
END;
$$;


--
-- TOC entry 5252 (class 0 OID 0)
-- Dependencies: 722
-- Name: FUNCTION fn_oportunidades_perdidas(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_oportunidades_perdidas() IS 'Clientes ativos que nao compram produtos top sellers';


--
-- TOC entry 723 (class 1255 OID 18822)
-- Name: fn_produtos_clientes(integer, boolean, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_clientes(p_produto_id integer, p_compraram boolean, p_ano integer DEFAULT NULL::integer, p_mes_inicio integer DEFAULT 1, p_mes_fim integer DEFAULT 12) RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, qtd_comprada double precision, ultima_compra timestamp without time zone, status character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF p_compraram THEN
        -- Retorna quem COMPROU no período
        RETURN QUERY
        SELECT 
            c.cli_codigo,
            CAST(c.cli_nomred AS VARCHAR) as nome,
            SUM(i.ite_quant)::DOUBLE PRECISION as total,
            MAX(p.ped_data)::TIMESTAMP as ult_compra,
            CAST('Ativo' AS VARCHAR)
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND (p_ano IS NULL OR EXTRACT(YEAR FROM p.ped_data) = p_ano)
          AND (p_ano IS NULL OR EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim)
        GROUP BY c.cli_codigo, c.cli_nomred
        ORDER BY total DESC;
    ELSE
        -- Retorna quem NÃO comprou (mas comprou qualquer outra coisa no ano => base ativa)
        RETURN QUERY
        SELECT DISTINCT
            c.cli_codigo,
            CAST(c.cli_nomred AS VARCHAR) as nome,
            0::DOUBLE PRECISION as total,
            NULL::TIMESTAMP as ult_compra,
            CAST('Oportunidade' AS VARCHAR) as status
        FROM pedidos p
        INNER JOIN clientes c ON c.cli_codigo = p.ped_cliente
        WHERE p.ped_situacao IN ('P', 'F')
          AND (p_ano IS NULL OR EXTRACT(YEAR FROM p.ped_data) = p_ano)
          AND c.cli_codigo NOT IN (
              -- Subquery: Clientes que compraram este produto
              SELECT DISTINCT p2.ped_cliente
              FROM pedidos p2
              INNER JOIN itens_ped i2 ON i2.ite_pedido = p2.ped_pedido
              WHERE i2.ite_idproduto = p_produto_id
                AND p2.ped_situacao IN ('P', 'F')
                AND (p_ano IS NULL OR EXTRACT(YEAR FROM p2.ped_data) = p_ano)
                AND (p_ano IS NULL OR EXTRACT(MONTH FROM p2.ped_data) BETWEEN p_mes_inicio AND p_mes_fim)
          )
        ORDER BY nome;
    END IF;
END;
$$;


--
-- TOC entry 724 (class 1255 OID 18823)
-- Name: fn_produtos_desempenho_mensal(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_desempenho_mensal(p_produto_id integer, p_ano integer) RETURNS TABLE(mes_num integer, mes_nome text, qtd_atual double precision, qtd_anterior double precision, variacao double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH mes_series AS (
        SELECT generate_series(1, 12) as m
    ),
    vendas_atual AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            SUM(i.ite_quant) as qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    ),
    vendas_anterior AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            SUM(i.ite_quant) as qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE i.ite_idproduto = p_produto_id
          AND p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano - 1
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    )
    SELECT 
        CAST(ms.m AS INTEGER),
        CAST(to_char(to_date(ms.m::text, 'MM'), 'TMMon') AS TEXT),
        COALESCE(va.qtd, 0)::DOUBLE PRECISION,
        COALESCE(van.qtd, 0)::DOUBLE PRECISION,
        CAST(CASE 
            WHEN COALESCE(van.qtd, 0) = 0 THEN 0 
            ELSE ((COALESCE(va.qtd, 0) - van.qtd) / van.qtd * 100) 
        END AS DOUBLE PRECISION)
    FROM mes_series ms
    LEFT JOIN vendas_atual va ON ms.m = va.m
    LEFT JOIN vendas_anterior van ON ms.m = van.m
    ORDER BY ms.m;
END;
$$;


--
-- TOC entry 725 (class 1255 OID 18824)
-- Name: fn_produtos_familias(integer, integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_familias(p_ano integer, p_mes_inicio integer DEFAULT 1, p_mes_fim integer DEFAULT 12, p_industria integer DEFAULT NULL::integer, p_cliente integer DEFAULT NULL::integer) RETURNS TABLE(familia_codigo integer, familia_nome character varying, qtd_total double precision, skus_vendidos bigint, percentual double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH vendas_familia AS (
        SELECT 
            g.gru_codigo,
            g.gru_nome,
            SUM(i.ite_quant) AS qtd,
            COUNT(DISTINCT i.ite_idproduto) as skus
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN cad_prod cp ON cp.pro_id = i.ite_idproduto
        LEFT JOIN grupos g ON g.gru_codigo = cp.pro_grupo
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
          AND (p_cliente IS NULL OR p.ped_cliente = p_cliente)
        GROUP BY g.gru_codigo, g.gru_nome
    ),
    total_geral AS (
        SELECT SUM(qtd) as total FROM vendas_familia
    )
    SELECT 
        COALESCE(gru_codigo, 0),
        CAST(COALESCE(gru_nome, 'SEM GRUPO') AS VARCHAR),
        CAST(qtd AS DOUBLE PRECISION),
        skus,
        ROUND(CAST(qtd / NULLIF((SELECT total FROM total_geral), 0) * 100 AS NUMERIC), 2)::DOUBLE PRECISION
    FROM vendas_familia
    ORDER BY qtd DESC;
END;
$$;


--
-- TOC entry 726 (class 1255 OID 18825)
-- Name: fn_produtos_por_curva(integer, integer, character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_por_curva(p_ano integer, p_industria integer, p_curva character varying, p_mes integer DEFAULT NULL::integer, p_limit integer DEFAULT 100) RETURNS TABLE(pro_id integer, pro_nome character varying, valor_total numeric, quantidade_vendida numeric, qtd_pedidos bigint, ultima_venda date, dias_sem_venda integer, percentual_individual numeric, curva_abc character varying)
    LANGUAGE plpgsql
    AS $$
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
                pc.curva as curva_abc
            FROM produtos_classificados pc
            WHERE pc.curva = p_curva
            ORDER BY pc.valor_total_produto DESC
            LIMIT p_limit;
        END;
        $$;


--
-- TOC entry 727 (class 1255 OID 18826)
-- Name: fn_produtos_portfolio_vendas(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_portfolio_vendas(p_ano integer, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(mes_num integer, mes_nome text, portfolio_total bigint, itens_vendidos bigint, percentual_cobertura double precision)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH mes_series AS (
        SELECT generate_series(1, 12) as m
    ),
    portfolio AS (
        SELECT COUNT(*) as total_skus
        FROM cad_prod cp
        WHERE cp.pro_status = true
          AND (p_industria IS NULL OR cp.pro_industria = p_industria)
    ),
    vendas_mes AS (
        SELECT 
            EXTRACT(MONTH FROM p.ped_data)::INTEGER as m,
            COUNT(DISTINCT i.ite_idproduto) as skus_vendidos
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        INNER JOIN cad_prod cp ON cp.pro_id = i.ite_idproduto
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
    )
    SELECT 
        CAST(ms.m AS INTEGER),
        CAST(to_char(to_date(ms.m::text, 'MM'), 'TMMon') AS TEXT), -- Jan, Fev...
        (SELECT total_skus FROM portfolio),
        COALESCE(vm.skus_vendidos, 0),
        ROUND(CAST(COALESCE(vm.skus_vendidos, 0)::numeric / NULLIF((SELECT total_skus FROM portfolio), 0) * 100 AS NUMERIC), 1)::DOUBLE PRECISION
    FROM mes_series ms
    LEFT JOIN vendas_mes vm ON ms.m = vm.m
    ORDER BY ms.m;
END;
$$;


--
-- TOC entry 728 (class 1255 OID 18827)
-- Name: fn_produtos_ranking(integer, integer, integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_ranking(p_ano integer, p_mes_inicio integer DEFAULT 1, p_mes_fim integer DEFAULT 12, p_industria integer DEFAULT NULL::integer, p_cliente integer DEFAULT NULL::integer) RETURNS TABLE(produto_id integer, produto_codigo character varying, produto_nome character varying, grupo_codigo integer, grupo_nome character varying, qtd_total double precision, percentual_acumulado double precision, classificacao_abc character varying, ranking bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH vendas AS (
        SELECT 
            i.ite_idproduto,
            SUM(i.ite_quant) AS qtd
        FROM pedidos p
        INNER JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND EXTRACT(MONTH FROM p.ped_data) BETWEEN p_mes_inicio AND p_mes_fim
          AND (p_industria IS NULL OR p.ped_industria = p_industria)
          AND (p_cliente IS NULL OR p.ped_cliente = p_cliente)
        GROUP BY i.ite_idproduto
    ),
    totais AS (
        SELECT 
            v.ite_idproduto,
            v.qtd,
            SUM(v.qtd) OVER () AS total_geral,
            SUM(v.qtd) OVER (ORDER BY v.qtd DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS qtd_acumulada
        FROM vendas v
    )
    SELECT 
        cp.pro_id,
        CAST(cp.pro_codprod AS VARCHAR),
        CAST(cp.pro_nome AS VARCHAR),
        g.gru_codigo,
        CAST(g.gru_nome AS VARCHAR),
        CAST(t.qtd AS DOUBLE PRECISION),
        ROUND(CAST(t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100 AS NUMERIC), 2)::DOUBLE PRECISION AS perc_acum,
        CAST(CASE 
            WHEN (t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100) <= 80 THEN 'A'
            WHEN (t.qtd_acumulada / NULLIF(t.total_geral, 0) * 100) <= 95 THEN 'B'
            ELSE 'C'
        END AS VARCHAR) AS abc,
        ROW_NUMBER() OVER (ORDER BY t.qtd DESC) AS rank
    FROM totais t
    INNER JOIN cad_prod cp ON cp.pro_id = t.ite_idproduto
    LEFT JOIN grupos g ON g.gru_codigo = cp.pro_grupo
    ORDER BY t.qtd DESC;
END;
$$;


--
-- TOC entry 729 (class 1255 OID 18828)
-- Name: fn_produtos_unica_compra(date, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_produtos_unica_compra(p_data_ini date, p_data_fim date, p_industria integer) RETURNS TABLE(cliente_nome text, produto_codigo text, produto_desc text, quantidade numeric)
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- TOC entry 730 (class 1255 OID 18829)
-- Name: fn_resumo_executivo(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_resumo_executivo() RETURNS TABLE(total_clientes_ativos bigint, total_faturamento numeric, ticket_medio numeric, total_pedidos bigint, produtos_ativos bigint, clientes_em_risco bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT ped_cliente) 
         FROM pedidos 
         WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months')::BIGINT,
        
        (SELECT ROUND(SUM(ped_totliq)::NUMERIC, 2) 
         FROM pedidos 
         WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::NUMERIC,
        
        (SELECT ROUND(AVG(ped_totliq)::NUMERIC, 2) 
         FROM pedidos 
         WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::NUMERIC,
        
        (SELECT COUNT(*) 
         FROM pedidos 
         WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::BIGINT,
        
        (SELECT COUNT(DISTINCT ite_produto) 
         FROM itens_ped i
         INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido
         WHERE p.ped_data >= CURRENT_DATE - INTERVAL '3 months')::BIGINT,
        
        (SELECT COUNT(*) 
         FROM fn_churn_preditivo() 
         WHERE nivel_risco IN ('CRITICO', 'ALERTA'))::BIGINT;
END;
$$;


--
-- TOC entry 5253 (class 0 OID 0)
-- Dependencies: 730
-- Name: FUNCTION fn_resumo_executivo(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_resumo_executivo() IS 'Resumo executivo de KPIs principais';


--
-- TOC entry 731 (class 1255 OID 18830)
-- Name: fn_sazonalidade(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_sazonalidade() RETURNS TABLE(mes integer, nome_mes character varying, faturamento_medio numeric, volatilidade_pct numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH monthly_sales AS (
        SELECT 
            EXTRACT(MONTH FROM ped_data)::INTEGER as m,
            TO_CHAR(ped_data, 'Month') as nm,
            EXTRACT(YEAR FROM ped_data) as ano,
            SUM(ped_totliq) as fat
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '24 months'
        GROUP BY EXTRACT(MONTH FROM ped_data), TO_CHAR(ped_data, 'Month'), EXTRACT(YEAR FROM ped_data)
    ),
    avg_by_month AS (
        SELECT 
            m,
            nm,
            AVG(fat) as media,
            STDDEV(fat) as desvio
        FROM monthly_sales
        GROUP BY m, nm
    )
    SELECT 
        m::INTEGER,
        TRIM(nm)::VARCHAR,
        ROUND(media::NUMERIC, 2),
        ROUND((desvio / NULLIF(media, 0) * 100)::NUMERIC, 1)
    FROM avg_by_month
    ORDER BY media DESC;
END;
$$;


--
-- TOC entry 5254 (class 0 OID 0)
-- Dependencies: 731
-- Name: FUNCTION fn_sazonalidade(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_sazonalidade() IS 'Analise de padroes sazonais por mes';


--
-- TOC entry 732 (class 1255 OID 18831)
-- Name: fn_upsert_preco(integer, integer, character varying, double precision, double precision, double precision, double precision, double precision, integer, double precision, date, date); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_upsert_preco(p_pro_id integer, p_industria integer, p_tabela character varying, p_precobruto double precision, p_precopromo double precision DEFAULT NULL::double precision, p_precoespecial double precision DEFAULT NULL::double precision, p_ipi double precision DEFAULT 0, p_st double precision DEFAULT 0, p_grupodesconto integer DEFAULT NULL::integer, p_descontoadd double precision DEFAULT 0, p_datatbela date DEFAULT CURRENT_DATE, p_datavencimento date DEFAULT NULL::date, p_prepeso double precision DEFAULT 0) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- UPSERT: insere ou atualiza
    INSERT INTO public.cad_tabelaspre (
        itab_idprod,
        itab_idindustria,
        itab_tabela,
        itab_precobruto,
        itab_precopromo,
        itab_precoespecial,
        itab_ipi,
        itab_st,
        itab_grupodesconto,
        itab_descontoadd,
        itab_datatabela,
        itab_datavencimento,
        itab_prepeso,
        itab_status
    ) VALUES (
        p_pro_id,
        p_industria,
        p_tabela,
        p_precobruto,
        p_precopromo,
        p_precoespecial,
        p_ipi,
        p_st,
        p_grupodesconto,
        p_descontoadd,
        p_datatbela,
        p_datavencimento,
        p_prepeso,
        true
    )
    ON CONFLICT (itab_idprod, itab_tabela) 
    DO UPDATE SET
        itab_precobruto = EXCLUDED.itab_precobruto,
        itab_precopromo = EXCLUDED.itab_precopromo,
        itab_precoespecial = EXCLUDED.itab_precoespecial,
        itab_ipi = EXCLUDED.itab_ipi,
        itab_st = EXCLUDED.itab_st,
        itab_grupodesconto = EXCLUDED.itab_grupodesconto,
        itab_descontoadd = EXCLUDED.itab_descontoadd,
        itab_datatabela = EXCLUDED.itab_datatabela,
        itab_datavencimento = EXCLUDED.itab_datavencimento,
        itab_prepeso = EXCLUDED.itab_prepeso,
        itab_status = EXCLUDED.itab_status;
END;
$$;


--
-- TOC entry 733 (class 1255 OID 18832)
-- Name: fn_upsert_produto(integer, character varying, character varying, double precision, integer, integer, character varying, character varying, character varying, character, character varying, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_upsert_produto(p_industria integer, p_codprod character varying, p_nome character varying, p_peso double precision DEFAULT NULL::double precision, p_embalagem integer DEFAULT NULL::integer, p_grupo integer DEFAULT NULL::integer, p_setor character varying DEFAULT NULL::character varying, p_linha character varying DEFAULT NULL::character varying, p_ncm character varying DEFAULT NULL::character varying, p_origem character DEFAULT NULL::bpchar, p_aplicacao character varying DEFAULT NULL::character varying, p_codbarras character varying DEFAULT NULL::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_pro_id INTEGER;
    v_codigo_normalizado VARCHAR(50);
BEGIN
    -- Normaliza o código
    v_codigo_normalizado := fn_normalizar_codigo(p_codprod);
    
    -- Tenta buscar o produto existente
    SELECT pro_id INTO v_pro_id
    FROM cad_prod
    WHERE pro_industria = p_industria 
      AND pro_codigonormalizado = v_codigo_normalizado;
    
    IF v_pro_id IS NOT NULL THEN
        -- Produto existe: ATUALIZA apenas campos fixos (não-nulos)
        UPDATE cad_prod SET
            pro_nome = COALESCE(p_nome, pro_nome),
            pro_peso = COALESCE(p_peso, pro_peso),
            pro_embalagem = COALESCE(p_embalagem, pro_embalagem),
            pro_grupo = COALESCE(p_grupo, pro_grupo),
            pro_setor = COALESCE(p_setor, pro_setor),
            pro_linha = COALESCE(p_linha, pro_linha),
            pro_ncm = COALESCE(p_ncm, pro_ncm),
            pro_origem = COALESCE(p_origem, pro_origem),
            pro_aplicacao = COALESCE(p_aplicacao, pro_aplicacao),
            pro_codbarras = COALESCE(p_codbarras, pro_codbarras),
            pro_codprod = p_codprod -- Atualiza código original se mudou formatação
        WHERE pro_id = v_pro_id;
    ELSE
        -- Produto NÃO existe: INSERE novo
        INSERT INTO cad_prod (
            pro_industria,
            pro_codprod,
            pro_codigonormalizado,
            pro_codigooriginal,
            pro_nome,
            pro_peso,
            pro_embalagem,
            pro_grupo,
            pro_setor,
            pro_linha,
            pro_ncm,
            pro_origem,
            pro_aplicacao,
            pro_codbarras,
            pro_status
        ) VALUES (
            p_industria,
            p_codprod,
            v_codigo_normalizado,
            p_codprod,
            p_nome,
            p_peso,
            p_embalagem,
            p_grupo,
            p_setor,
            p_linha,
            p_ncm,
            p_origem,
            p_aplicacao,
            p_codbarras,
            true
        )
        RETURNING pro_id INTO v_pro_id;
    END IF;
    
    RETURN v_pro_id;
END;
$$;


--
-- TOC entry 5255 (class 0 OID 0)
-- Dependencies: 733
-- Name: FUNCTION fn_upsert_produto(p_industria integer, p_codprod character varying, p_nome character varying, p_peso double precision, p_embalagem integer, p_grupo integer, p_setor character varying, p_linha character varying, p_ncm character varying, p_origem character, p_aplicacao character varying, p_codbarras character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.fn_upsert_produto(p_industria integer, p_codprod character varying, p_nome character varying, p_peso double precision, p_embalagem integer, p_grupo integer, p_setor character varying, p_linha character varying, p_ncm character varying, p_origem character, p_aplicacao character varying, p_codbarras character varying) IS 'Insere ou atualiza produto em cad_prod. Retorna o pro_id. Atualiza apenas dados fixos do produto.';


--
-- TOC entry 734 (class 1255 OID 18833)
-- Name: fn_validar_periodo(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_validar_periodo(p_ano integer, p_industria integer, p_mes integer DEFAULT NULL::integer) RETURNS TABLE(tem_dados boolean, total_pedidos bigint, total_itens bigint, valor_total numeric, primeira_venda date, ultima_venda date)
    LANGUAGE plpgsql
    AS $$
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
        $$;


--
-- TOC entry 735 (class 1255 OID 18834)
-- Name: fn_vendedores_carteira_resumo(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_vendedores_carteira_resumo(p_ano integer, p_mes integer, p_vendedor integer DEFAULT NULL::integer) RETURNS TABLE(vendedor_codigo integer, vendedor_nome character varying, clientes_ativos_90d integer, clientes_inativos_90d integer, total_clientes integer, perc_inativos numeric, clientes_novos_periodo integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_data_limite_ativo DATE;
BEGIN
    -- Calcular perÃ­odo
    v_data_inicio := make_date(p_ano, p_mes, 1);
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    v_data_limite_ativo := v_data_fim - INTERVAL '90 days';

    RETURN QUERY
    WITH vendas_periodo AS (
        SELECT DISTINCT
            ped.ped_vendedor,
            ped.ped_cliente
        FROM pedidos ped
        WHERE ped.ped_data BETWEEN v_data_inicio AND v_data_fim
          AND ped.ped_situacao NOT IN ('C', 'X')
          AND (p_vendedor IS NULL OR ped.ped_vendedor = p_vendedor)
    ),
    ultima_compra AS (
        SELECT 
            c.cli_codigo,
            c.cli_vendedor,
            MAX(p.ped_data) as ultimo_pedido
        FROM clientes c
        LEFT JOIN pedidos p ON p.ped_cliente = c.cli_codigo AND p.ped_situacao NOT IN ('C', 'X')
        WHERE (p_vendedor IS NULL OR c.cli_vendedor = p_vendedor)
        GROUP BY c.cli_codigo, c.cli_vendedor
    ),
    primeira_compra AS (
        SELECT 
            ped.ped_cliente,
            ped.ped_vendedor,
            MIN(ped.ped_data) as data_primeira
        FROM pedidos ped
        WHERE ped.ped_situacao NOT IN ('C', 'X')
        GROUP BY ped.ped_cliente, ped.ped_vendedor
    ),
    metricas AS (
        SELECT 
            v.ven_codigo,
            v.ven_nome,
            COUNT(DISTINCT CASE WHEN uc.ultimo_pedido >= v_data_limite_ativo THEN uc.cli_codigo END) as ativos,
            COUNT(DISTINCT CASE WHEN uc.ultimo_pedido < v_data_limite_ativo OR uc.ultimo_pedido IS NULL THEN uc.cli_codigo END) as inativos,
            COUNT(DISTINCT uc.cli_codigo) as total,
            COUNT(DISTINCT CASE 
                WHEN pc.data_primeira BETWEEN v_data_inicio AND v_data_fim 
                THEN pc.ped_cliente 
            END) as novos
        FROM vendedores v
        LEFT JOIN ultima_compra uc ON uc.cli_vendedor = v.ven_codigo
        LEFT JOIN primeira_compra pc ON pc.ped_vendedor = v.ven_codigo AND pc.ped_cliente = uc.cli_codigo
        WHERE v.ven_status = 'A'
          AND COALESCE(v.ven_cumpremetas, 'N') = 'S'
          AND (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
        GROUP BY v.ven_codigo, v.ven_nome
    )
    SELECT 
        m.ven_codigo::INTEGER,
        m.ven_nome::VARCHAR,
        m.ativos::INTEGER,
        m.inativos::INTEGER,
        m.total::INTEGER,
        CASE WHEN m.total > 0 THEN ROUND((m.inativos::NUMERIC / m.total) * 100, 2) ELSE 0 END,
        m.novos::INTEGER
    FROM metricas m
    ORDER BY m.ven_nome;
END;
$$;


--
-- TOC entry 737 (class 1255 OID 18835)
-- Name: fn_vendedores_clientes_risco(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_vendedores_clientes_risco(p_vendedor integer DEFAULT NULL::integer, p_dias_sem_comprar integer DEFAULT 60) RETURNS TABLE(vendedor_codigo integer, vendedor_nome character varying, cliente_codigo integer, cliente_nome character varying, ultima_compra date, dias_sem_comprar integer, total_compras_historico bigint, valor_total_historico double precision, ticket_medio double precision, nivel_risco character varying, recomendacao character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH ultima_compra_cliente AS (
        SELECT 
            ped_vendedor,
            ped_cliente,
            MAX(ped_data) AS ultima_compra,
            COUNT(DISTINCT ped_pedido) AS total_pedidos,
            SUM(ped_totliq) AS valor_total
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor, ped_cliente
    ),
    clientes_em_risco AS (
        SELECT 
            uc.ped_vendedor,
            uc.ped_cliente,
            uc.ultima_compra,
            CURRENT_DATE - uc.ultima_compra AS dias_sem_compra,
            uc.total_pedidos,
            uc.valor_total,
            ROUND((uc.valor_total / NULLIF(uc.total_pedidos, 0))::NUMERIC, 2) AS ticket_medio
        FROM ultima_compra_cliente uc
        WHERE CURRENT_DATE - uc.ultima_compra >= p_dias_sem_comprar
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        c.cli_codigo,
        c.cli_nomred,
        cr.ultima_compra,
        cr.dias_sem_compra::INTEGER,
        cr.total_pedidos::BIGINT,
        cr.valor_total::DOUBLE PRECISION,
        cr.ticket_medio::DOUBLE PRECISION,
        (CASE 
            WHEN cr.dias_sem_compra >= 120 THEN '🔴 Alto'
            WHEN cr.dias_sem_compra >= 90 THEN '🟡 Médio'
            ELSE '🟢 Baixo'
        END)::VARCHAR AS nivel_risco,
        (CASE 
            WHEN cr.dias_sem_compra >= 120 AND cr.valor_total > 50000 THEN 
                '📞 URGENTE: Cliente VIP sem comprar há ' || cr.dias_sem_compra || ' dias. Ligar imediatamente.'
            WHEN cr.dias_sem_compra >= 90 THEN 
                '📧 Enviar campanha de reativação + ligar.'
            WHEN cr.dias_sem_compra >= 60 AND cr.total_pedidos > 10 THEN 
                '💡 Cliente recorrente está distante. Agendar visita.'
            ELSE 
                '📅 Agendar contato nos próximos 7 dias.'
        END)::VARCHAR AS recomendacao
    FROM clientes_em_risco cr
    INNER JOIN vendedores v ON v.ven_codigo = cr.ped_vendedor
    INNER JOIN clientes c ON c.cli_codigo = cr.ped_cliente
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY cr.valor_total DESC, cr.dias_sem_compra DESC;
END;
$$;


--
-- TOC entry 738 (class 1255 OID 18836)
-- Name: fn_vendedores_historico_mensal(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_vendedores_historico_mensal(p_vendedor integer, p_meses_retroativos integer DEFAULT 12) RETURNS TABLE(vendedor_codigo integer, vendedor_nome character varying, ano integer, mes integer, mes_nome character varying, total_vendas numeric, qtd_pedidos integer, qtd_clientes integer, ticket_medio numeric, meta_mes numeric, perc_atingimento numeric, tendencia character varying)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH meses_series AS (
        SELECT 
            date_trunc('month', CURRENT_DATE - (n || ' months')::interval) AS mes_ref,
            EXTRACT(YEAR FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS ano,
            EXTRACT(MONTH FROM date_trunc('month', CURRENT_DATE - (n || ' months')::interval))::INTEGER AS mes
        FROM generate_series(0, p_meses_retroativos - 1) AS n
    ),
    vendas_por_mes AS (
        SELECT 
            ped_vendedor,
            EXTRACT(YEAR FROM ped_data)::INTEGER AS ano,
            EXTRACT(MONTH FROM ped_data)::INTEGER AS mes,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_pedido) AS qtd_pedidos,
            COUNT(DISTINCT ped_cliente) AS qtd_clientes
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
          AND ped_vendedor = p_vendedor
          AND ped_data >= CURRENT_DATE - (p_meses_retroativos || ' months')::interval
        GROUP BY ped_vendedor, EXTRACT(YEAR FROM ped_data), EXTRACT(MONTH FROM ped_data)
    ),
    metas_por_mes AS (
        SELECT 
            met_vendedor,
            met_ano,
            UNNEST(ARRAY[
                met_jan, met_fev, met_mar, met_abr, met_mai, met_jun,
                met_jul, met_ago, met_set, met_out, met_nov, met_dez
            ]) AS meta_valor,
            UNNEST(ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]) AS mes
        FROM vend_metas
        WHERE met_vendedor = p_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome::VARCHAR,
        ms.ano,
        ms.mes,
        CAST(CASE ms.mes
            WHEN 1 THEN 'Janeiro' WHEN 2 THEN 'Fevereiro' WHEN 3 THEN 'Março'
            WHEN 4 THEN 'Abril' WHEN 5 THEN 'Maio' WHEN 6 THEN 'Junho'
            WHEN 7 THEN 'Julho' WHEN 8 THEN 'Agosto' WHEN 9 THEN 'Setembro'
            WHEN 10 THEN 'Outubro' WHEN 11 THEN 'Novembro' WHEN 12 THEN 'Dezembro'
        END AS VARCHAR) AS mes_nome,
        COALESCE(vpm.total, 0)::NUMERIC AS total_vendas,
        COALESCE(vpm.qtd_pedidos, 0)::INTEGER AS qtd_pedidos,
        COALESCE(vpm.qtd_clientes, 0)::INTEGER AS qtd_clientes,
        CASE 
            WHEN COALESCE(vpm.qtd_pedidos, 0) = 0 THEN 0::NUMERIC
            ELSE ROUND((vpm.total / vpm.qtd_pedidos)::NUMERIC, 2)
        END AS ticket_medio,
        COALESCE(m.meta_valor, 0)::NUMERIC AS meta_mes,
        CASE 
            WHEN COALESCE(m.meta_valor, 0) = 0 THEN 0::NUMERIC
            ELSE ROUND((COALESCE(vpm.total, 0) / m.meta_valor * 100)::NUMERIC, 2)
        END AS perc_atingimento,
        -- Tendência comparando com mês anterior
        CAST(CASE 
            WHEN LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) IS NULL THEN '→'
            WHEN vpm.total > LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 1.05 THEN '📈 Subindo'
            WHEN vpm.total < LAG(vpm.total) OVER (ORDER BY ms.ano, ms.mes) * 0.95 THEN '📉 Caindo'
            ELSE '→ Estável'
        END AS VARCHAR) AS tendencia
    FROM vendedores v
    CROSS JOIN meses_series ms
    LEFT JOIN vendas_por_mes vpm ON vpm.ped_vendedor = v.ven_codigo 
        AND vpm.ano = ms.ano AND vpm.mes = ms.mes
    LEFT JOIN metas_por_mes m ON m.met_vendedor = v.ven_codigo 
        AND m.met_ano = ms.ano AND m.mes = ms.mes
    WHERE v.ven_codigo = p_vendedor
    ORDER BY ms.ano DESC, ms.mes DESC;
END;
$$;


--
-- TOC entry 739 (class 1255 OID 18837)
-- Name: fn_vendedores_interacoes_crm(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_vendedores_interacoes_crm(p_ano integer, p_mes integer, p_vendedor integer DEFAULT NULL::integer) RETURNS TABLE(vendedor_codigo integer, vendedor_nome character varying, total_interacoes bigint, interacoes_telefone bigint, interacoes_email bigint, interacoes_visita bigint, interacoes_whatsapp bigint, duracao_media_minutos double precision, proximas_acoes_pendentes bigint, taxa_conversao double precision, ultima_interacao timestamp without time zone, produtividade character varying)
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
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS clientes_vendidos
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data + INTERVAL '1 day') = p_ano
          AND EXTRACT(MONTH FROM p.ped_data + INTERVAL '1 day') = p_mes
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
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
        COALESCE(i.total, 0)::BIGINT AS total_interacoes,
        COALESCE(i.telefone, 0)::BIGINT AS interacoes_telefone,
        COALESCE(i.email, 0)::BIGINT AS interacoes_email,
        COALESCE(i.visita, 0)::BIGINT AS interacoes_visita,
        COALESCE(i.whatsapp, 0)::BIGINT AS interacoes_whatsapp,
        ROUND(COALESCE(i.duracao_media, 0)::NUMERIC, 2)::DOUBLE PRECISION AS duracao_media_minutos,
        COALESCE(i.acoes_pendentes, 0)::BIGINT AS proximas_acoes_pendentes,
        (CASE 
            WHEN COALESCE(i.total, 0) = 0 THEN 0
            ELSE ROUND((COALESCE(c.clientes_vendidos, 0)::NUMERIC / i.total * 100), 2)
        END)::DOUBLE PRECISION AS taxa_conversao,
        i.ultima_interacao,
        (CASE 
            WHEN COALESCE(i.total, 0) >= 50 THEN '🔥 Alta'
            WHEN COALESCE(i.total, 0) >= 20 THEN '✅ Boa'
            WHEN COALESCE(i.total, 0) >= 10 THEN '⚠️ Baixa'
            ELSE '🔴 Muito Baixa'
        END)::VARCHAR AS produtividade
    FROM vendedores v
    LEFT JOIN interacoes i ON i.ven_codigo = v.ven_codigo
    LEFT JOIN conversoes c ON c.ped_vendedor = v.ven_codigo
    WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    ORDER BY total_interacoes DESC;
END;
$$;


--
-- TOC entry 740 (class 1255 OID 18838)
-- Name: fn_vendedores_performance(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.fn_vendedores_performance(p_ano integer, p_mes integer, p_vendedor integer DEFAULT NULL::integer) RETURNS TABLE(vendedor_codigo integer, vendedor_nome character varying, total_vendas_mes numeric, total_vendas_mes_anterior numeric, variacao_mom_percent numeric, qtd_pedidos integer, ticket_medio numeric, meta_mes numeric, perc_atingimento_meta numeric, ranking integer, clientes_ativos integer, clientes_novos integer, clientes_perdidos integer, dias_desde_ultima_venda integer, total_interacoes_crm integer, status character varying)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_mes_anterior INTEGER;
    v_ano_anterior INTEGER;
BEGIN
    -- Calcula mês e ano anterior
    IF p_mes = 1 THEN
        v_mes_anterior := 12;
        v_ano_anterior := p_ano - 1;
    ELSE
        v_mes_anterior := p_mes - 1;
        v_ano_anterior := p_ano;
    END IF;

    RETURN QUERY
    WITH vendas_mes_atual AS (
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_pedido) AS qtd_pedidos,
            SUM(ped_totliq) AS total,
            COUNT(DISTINCT ped_cliente) AS clientes_unicos,
            MAX(ped_data) AS ultima_venda
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM ped_data) = p_mes)  -- p_mes=0 means all months
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    vendas_mes_anterior AS (
        SELECT 
            ped_vendedor,
            SUM(ped_totliq) AS total
        FROM pedidos
        WHERE EXTRACT(YEAR FROM ped_data) = v_ano_anterior
          AND (p_mes = 0 OR EXTRACT(MONTH FROM ped_data) = v_mes_anterior)  -- p_mes=0 means compare full years
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_ativos AS (
        -- Clientes que compraram nos últimos 90 dias
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
        GROUP BY ped_vendedor
    ),
    clientes_novos AS (
        -- Clientes que fizeram primeira compra neste período
        SELECT 
            p.ped_vendedor,
            COUNT(DISTINCT p.ped_cliente) AS qtd
        FROM pedidos p
        WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM p.ped_data) = p_mes)  -- p_mes=0 means full year
          AND p.ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR p.ped_vendedor = p_vendedor)
          AND NOT EXISTS (
              SELECT 1 FROM pedidos p2
              WHERE p2.ped_cliente = p.ped_cliente
                AND p2.ped_data < DATE_TRUNC('year', MAKE_DATE(p_ano, COALESCE(NULLIF(p_mes, 0), 1), 1))
                AND p2.ped_situacao IN ('P', 'F')
          )
        GROUP BY p.ped_vendedor
    ),
    clientes_perdidos AS (
        -- Clientes que não compram há mais de 90 dias
        SELECT 
            ped_vendedor,
            COUNT(DISTINCT ped_cliente) AS qtd
        FROM pedidos
        WHERE ped_data < CURRENT_DATE - INTERVAL '90 days'
          AND ped_situacao IN ('P', 'F')
          AND (p_vendedor IS NULL OR ped_vendedor = p_vendedor)
          AND ped_cliente NOT IN (
              SELECT DISTINCT ped_cliente 
              FROM pedidos 
              WHERE ped_data >= CURRENT_DATE - INTERVAL '90 days'
                AND ped_situacao IN ('P', 'F')
          )
        GROUP BY ped_vendedor
    ),
    metas AS (
        SELECT 
            met_vendedor,
            CASE 
                WHEN p_mes = 0 THEN  -- Full year: sum all months
                    SUM(COALESCE(met_jan, 0) + COALESCE(met_fev, 0) + COALESCE(met_mar, 0) + 
                        COALESCE(met_abr, 0) + COALESCE(met_mai, 0) + COALESCE(met_jun, 0) +
                        COALESCE(met_jul, 0) + COALESCE(met_ago, 0) + COALESCE(met_set, 0) +
                        COALESCE(met_out, 0) + COALESCE(met_nov, 0) + COALESCE(met_dez, 0))
                ELSE
                    SUM(CASE p_mes
                        WHEN 1 THEN met_jan
                        WHEN 2 THEN met_fev
                        WHEN 3 THEN met_mar
                        WHEN 4 THEN met_abr
                        WHEN 5 THEN met_mai
                        WHEN 6 THEN met_jun
                        WHEN 7 THEN met_jul
                        WHEN 8 THEN met_ago
                        WHEN 9 THEN met_set
                        WHEN 10 THEN met_out
                        WHEN 11 THEN met_nov
                        WHEN 12 THEN met_dez
                    END)
            END AS meta_mes
        FROM vend_metas
        WHERE met_ano = p_ano
          AND (p_vendedor IS NULL OR met_vendedor = p_vendedor)
        GROUP BY met_vendedor
    ),
    interacoes_crm AS (
        SELECT 
            ven_codigo,
            COUNT(*) AS total_interacoes
        FROM crm_interacao
        WHERE EXTRACT(YEAR FROM data_hora) = p_ano
          AND (p_mes = 0 OR EXTRACT(MONTH FROM data_hora) = p_mes)  -- p_mes=0 means full year
          AND (p_vendedor IS NULL OR ven_codigo = p_vendedor)
        GROUP BY ven_codigo
    ),
    metricas AS (
        SELECT 
            v.ven_codigo,
            v.ven_nome,
            CAST(COALESCE(vma.total, 0) AS NUMERIC) AS vendas_mes,
            CAST(COALESCE(vme.total, 0) AS NUMERIC) AS vendas_mes_anterior,
            CAST(COALESCE(vma.qtd_pedidos, 0) AS INTEGER) AS qtd_pedidos,
            CASE 
                WHEN COALESCE(vma.qtd_pedidos, 0) = 0 THEN 0::NUMERIC
                ELSE ROUND(CAST(COALESCE(vma.total, 0) / vma.qtd_pedidos AS NUMERIC), 2)
            END AS ticket_medio,
            CAST(COALESCE(m.meta_mes, 0) AS NUMERIC) AS meta,
            CAST(COALESCE(ca.qtd, 0) AS INTEGER) AS clientes_ativos,
            CAST(COALESCE(cn.qtd, 0) AS INTEGER) AS clientes_novos,
            CAST(COALESCE(cp.qtd, 0) AS INTEGER) AS clientes_perdidos,
            CAST(COALESCE(CURRENT_DATE - vma.ultima_venda, 999) AS INTEGER) AS dias_sem_venda,
            CAST(COALESCE(crm.total_interacoes, 0) AS INTEGER) AS interacoes,
            -- Variação MoM
            CASE 
                WHEN COALESCE(vme.total, 0) = 0 THEN 
                    CASE WHEN COALESCE(vma.total, 0) > 0 THEN 100.0::NUMERIC ELSE 0.0::NUMERIC END
                ELSE 
                    ROUND(CAST((COALESCE(vma.total, 0) - vme.total) / vme.total * 100 AS NUMERIC), 2)
            END AS mom,
            -- % Atingimento
            CASE 
                WHEN COALESCE(m.meta_mes, 0) = 0 THEN 0::NUMERIC
                ELSE ROUND(CAST(COALESCE(vma.total, 0) / m.meta_mes * 100 AS NUMERIC), 2)
            END AS perc_meta
        FROM vendedores v
        LEFT JOIN vendas_mes_atual vma ON vma.ped_vendedor = v.ven_codigo
        LEFT JOIN vendas_mes_anterior vme ON vme.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_ativos ca ON ca.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_novos cn ON cn.ped_vendedor = v.ven_codigo
        LEFT JOIN clientes_perdidos cp ON cp.ped_vendedor = v.ven_codigo
        LEFT JOIN metas m ON m.met_vendedor = v.ven_codigo
        LEFT JOIN interacoes_crm crm ON crm.ven_codigo = v.ven_codigo
        WHERE (p_vendedor IS NULL OR v.ven_codigo = p_vendedor)
    )
    SELECT 
        metricas.ven_codigo,
        metricas.ven_nome,
        metricas.vendas_mes,
        metricas.vendas_mes_anterior,
        metricas.mom AS variacao_mom_percent,
        metricas.qtd_pedidos,
        metricas.ticket_medio,
        metricas.meta,
        metricas.perc_meta AS perc_atingimento_meta,
        CAST(RANK() OVER (ORDER BY metricas.vendas_mes DESC) AS INTEGER) AS ranking,
        metricas.clientes_ativos,
        metricas.clientes_novos,
        metricas.clientes_perdidos,
        metricas.dias_sem_venda AS dias_desde_ultima_venda,
        metricas.interacoes AS total_interacoes_crm,
        -- Status baseado em performance
        CAST(CASE 
            WHEN metricas.perc_meta >= 100 THEN '🏆 Acima da Meta'
            WHEN metricas.perc_meta >= 80 THEN '✅ Na Meta'
            WHEN metricas.perc_meta >= 60 THEN '⚠️ Em Risco'
            ELSE '🔴 Crítico'
        END AS VARCHAR) AS status
    FROM metricas
    ORDER BY metricas.vendas_mes DESC;
END;
$$;


--
-- TOC entry 763 (class 1255 OID 21769)
-- Name: get_dashboard_metrics(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_metrics(p_year integer, p_month integer) RETURNS TABLE(total_vendido_current numeric, vendas_percent_change numeric, quantidade_vendida_current numeric, quantidade_percent_change numeric, clientes_atendidos_current bigint, clientes_percent_change numeric, total_pedidos_current bigint, pedidos_percent_change numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_total_vendido_curr numeric := 0;
    v_quantidade_curr numeric := 0;
    v_clientes_curr bigint := 0;
    v_pedidos_curr bigint := 0;
    v_total_vendido_prev numeric := 0;
    v_quantidade_prev numeric := 0;
    v_clientes_prev bigint := 0;
    v_pedidos_prev bigint := 0;
    v_date_start date;
    v_date_end date;
    v_prev_start date;
    v_prev_end date;
BEGIN
    IF p_month IS NULL OR p_month = 0 THEN
        v_date_start := make_date(p_year, 1, 1);
        v_date_end := make_date(p_year, 12, 31);
        v_prev_start := make_date(p_year - 1, 1, 1);
        v_prev_end := make_date(p_year - 1, 12, 31);
    ELSE
        v_date_start := make_date(p_year, p_month, 1);
        v_date_end := (v_date_start + interval '1 month' - interval '1 day')::date;
        v_prev_start := (v_date_start - interval '1 month')::date;
        v_prev_end := (v_date_start - interval '1 day')::date;
    END IF;

    -- BUSCA SEM PREFIXO 'public.' PARA PEGAR OS DADOS DA EMPRESA LOGADA
    SELECT COALESCE(SUM(ped_totliq), 0), COUNT(DISTINCT ped_cliente), COUNT(ped_pedido)
    INTO v_total_vendido_curr, v_clientes_curr, v_pedidos_curr
    FROM pedidos WHERE ped_data BETWEEN v_date_start AND v_date_end AND ped_situacao <> 'C';

    SELECT COALESCE(SUM(i.ite_quant), 0) INTO v_quantidade_curr
    FROM itens_ped i JOIN pedidos p ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data BETWEEN v_date_start AND v_date_end AND p.ped_situacao <> 'C';

    SELECT COALESCE(SUM(ped_totliq), 0), COUNT(DISTINCT ped_cliente), COUNT(ped_pedido)
    INTO v_total_vendido_prev, v_clientes_prev, v_pedidos_prev
    FROM pedidos WHERE ped_data BETWEEN v_prev_start AND v_prev_end AND ped_situacao <> 'C';

    SELECT COALESCE(SUM(i.ite_quant), 0) INTO v_quantidade_prev
    FROM itens_ped i JOIN pedidos p ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data BETWEEN v_prev_start AND v_prev_end AND p.ped_situacao <> 'C';

    RETURN QUERY SELECT 
        v_total_vendido_curr,
        CASE WHEN v_total_vendido_prev > 0 THEN ((v_total_vendido_curr - v_total_vendido_prev) / v_total_vendido_prev * 100) ELSE 0 END,
        v_quantidade_curr,
        CASE WHEN v_quantidade_prev > 0 THEN ((v_quantidade_prev - v_quantidade_prev) / v_quantidade_prev * 100) ELSE 0 END,
        v_clientes_curr,
        CASE WHEN v_clientes_prev > 0 THEN ((v_clientes_curr::numeric - v_clientes_prev::numeric) / v_clientes_prev::numeric * 100) ELSE 0 END,
        v_pedidos_curr,
        CASE WHEN v_pedidos_prev > 0 THEN ((v_pedidos_curr::numeric - v_pedidos_prev::numeric) / v_pedidos_prev::numeric * 100) ELSE 0 END;
END;
$$;


--
-- TOC entry 764 (class 1255 OID 21773)
-- Name: get_dashboard_metrics(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dashboard_metrics(p_year integer, p_month integer DEFAULT NULL::integer, p_industry_id integer DEFAULT NULL::integer) RETURNS TABLE(total_vendido_current numeric, vendas_percent_change numeric, quantidade_vendida_current numeric, quantidade_percent_change numeric, clientes_atendidos_current bigint, clientes_percent_change numeric, total_pedidos_current bigint, pedidos_percent_change numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_current_start_date DATE; v_current_end_date DATE;
    v_previous_start_date DATE; v_previous_end_date DATE;
    v_total_curr numeric := 0; v_qty_curr numeric := 0;
    v_cli_curr bigint := 0; v_ped_curr bigint := 0;
    v_total_prev numeric := 0; v_qty_prev numeric := 0;
    v_cli_prev bigint := 0; v_ped_prev bigint := 0;
BEGIN
    -- Lógica de Períodos Identica ao seu Local
    IF p_month IS NULL OR p_month = 0 THEN
        v_current_start_date := make_date(p_year, 1, 1);
        v_current_end_date := make_date(p_year, 12, 31);
        v_previous_start_date := make_date(p_year - 1, 1, 1);
        v_previous_end_date := make_date(p_year - 1, 12, 31);
    ELSE
        v_current_start_date := make_date(p_year, p_month, 1);
        v_current_end_date := (v_current_start_date + INTERVAL '1 month - 1 day')::DATE;
        IF p_month = 1 THEN
            v_previous_start_date := make_date(p_year - 1, 12, 1);
            v_previous_end_date := make_date(p_year - 1, 12, 31);
        ELSE
            v_previous_start_date := make_date(p_year, p_month - 1, 1);
            v_previous_end_date := (v_previous_start_date + INTERVAL '1 month - 1 day')::DATE;
        END IF;
    END IF;

    -- Período Atual (Soma de ITENS para precisão total)
    SELECT COALESCE(SUM(i.ite_totliquido), 0), COALESCE(SUM(i.ite_quant), 0), COUNT(DISTINCT p.ped_cliente), COUNT(DISTINCT p.ped_pedido)
    INTO v_total_curr, v_qty_curr, v_cli_curr, v_ped_curr
    FROM pedidos p LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data >= v_current_start_date AND p.ped_data <= v_current_end_date
      AND p.ped_situacao IN ('P', 'F') AND (p_industry_id IS NULL OR p_industry_id = 0 OR p.ped_industria = p_industry_id);

    -- Período Anterior
    SELECT COALESCE(SUM(i.ite_totliquido), 0), COALESCE(SUM(i.ite_quant), 0), COUNT(DISTINCT p.ped_cliente), COUNT(DISTINCT p.ped_pedido)
    INTO v_total_prev, v_qty_prev, v_cli_prev, v_ped_prev
    FROM pedidos p LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
    WHERE p.ped_data >= v_previous_start_date AND p.ped_data <= v_previous_end_date
      AND p.ped_situacao IN ('P', 'F') AND (p_industry_id IS NULL OR p_industry_id = 0 OR p.ped_industria = p_industry_id);

    RETURN QUERY SELECT
        v_total_curr,
        CASE WHEN v_total_prev > 0 THEN ((v_total_curr - v_total_prev) / v_total_prev * 100) ELSE (CASE WHEN v_total_curr > 0 THEN 100.0 ELSE 0.0 END) END,
        v_qty_curr,
        CASE WHEN v_qty_prev > 0 THEN ((v_qty_curr - v_qty_prev) / v_qty_prev * 100) ELSE (CASE WHEN v_qty_curr > 0 THEN 100.0 ELSE 0.0 END) END,
        v_cli_curr,
        CASE WHEN v_cli_prev > 0 THEN ((v_cli_curr::numeric - v_cli_prev::numeric) / v_cli_prev::numeric * 100) ELSE (CASE WHEN v_cli_curr > 0 THEN 100.0 ELSE 0.0 END) END,
        v_ped_curr,
        CASE WHEN v_ped_prev > 0 THEN ((v_ped_curr::numeric - v_ped_prev::numeric) / v_ped_prev::numeric * 100) ELSE (CASE WHEN v_ped_curr > 0 THEN 100.0 ELSE 0.0 END) END;
END;
$$;


--
-- TOC entry 741 (class 1255 OID 18841)
-- Name: get_dre_simples(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_dre_simples(p_mes integer, p_ano integer) RETURNS TABLE(tipo character, nivel integer, codigo character varying, descricao character varying, valor numeric, percentual numeric)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_data_inicio DATE;
    v_data_fim DATE;
    v_total_receitas DECIMAL(15,2);
BEGIN
    -- Definir período
    v_data_inicio := DATE(p_ano || '-' || LPAD(p_mes::TEXT, 2, '0') || '-01');
    v_data_fim := (v_data_inicio + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Calcular total de receitas para percentuais
    SELECT COALESCE(SUM(pr.valor_recebido), 0)
    INTO v_total_receitas
    FROM fin_parcelas_receber pr
    WHERE pr.status = 'RECEBIDO'
    AND pr.data_recebimento BETWEEN v_data_inicio AND v_data_fim;
    
    -- Se não houver receitas, evitar divisão por zero
    IF v_total_receitas = 0 THEN
        v_total_receitas := 1;
    END IF;
    
    RETURN QUERY
    WITH movimentacoes_periodo AS (
        -- Receitas
        SELECT 
            pc.id,
            pc.tipo,
            pc.nivel,
            pc.codigo,
            pc.descricao,
            COALESCE(SUM(pr.valor_recebido), 0) as valor
        FROM fin_plano_contas pc
        LEFT JOIN fin_contas_receber cr ON cr.id_plano_contas = pc.id
        LEFT JOIN fin_parcelas_receber pr ON pr.id_conta_receber = cr.id 
            AND pr.status = 'RECEBIDO'
            AND pr.data_recebimento BETWEEN v_data_inicio AND v_data_fim
        WHERE pc.tipo = 'R' AND pc.ativo = true
        GROUP BY pc.id, pc.tipo, pc.nivel, pc.codigo, pc.descricao
        
        UNION ALL
        
        -- Despesas
        SELECT 
            pc.id,
            pc.tipo,
            pc.nivel,
            pc.codigo,
            pc.descricao,
            COALESCE(SUM(pp.valor_pago), 0) as valor
        FROM fin_plano_contas pc
        LEFT JOIN fin_contas_pagar cp ON cp.id_plano_contas = pc.id
        LEFT JOIN fin_parcelas_pagar pp ON pp.id_conta_pagar = cp.id 
            AND pp.status = 'PAGO'
            AND pp.data_pagamento BETWEEN v_data_inicio AND v_data_fim
        WHERE pc.tipo = 'D' AND pc.ativo = true
        GROUP BY pc.id, pc.tipo, pc.nivel, pc.codigo, pc.descricao
    )
    SELECT 
        m.tipo,
        m.nivel,
        m.codigo,
        m.descricao,
        m.valor,
        ROUND((m.valor / v_total_receitas * 100)::NUMERIC, 2)::DECIMAL(5,2) as percentual
    FROM movimentacoes_periodo m
    WHERE m.valor > 0 OR m.nivel <= 2  -- Mostrar contas com valor ou contas pai
    ORDER BY m.tipo DESC, m.codigo;
END;
$$;


--
-- TOC entry 5256 (class 0 OID 0)
-- Dependencies: 741
-- Name: FUNCTION get_dre_simples(p_mes integer, p_ano integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_dre_simples(p_mes integer, p_ano integer) IS 'Demonstração de Resultado do Exercício simplificada';


--
-- TOC entry 742 (class 1255 OID 18842)
-- Name: get_fluxo_caixa(date, date, character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_fluxo_caixa(p_data_inicio date, p_data_fim date, p_agrupamento character varying DEFAULT 'DIARIO'::character varying) RETURNS TABLE(periodo character varying, data_ref date, entradas numeric, saidas numeric, saldo numeric, saldo_acumulado numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH movimentacoes AS (
        -- Entradas (Contas a Receber)
        SELECT 
            pr.data_recebimento as data,
            pr.valor_recebido as valor,
            'E' as tipo
        FROM fin_parcelas_receber pr
        WHERE pr.status = 'RECEBIDO'
        AND pr.data_recebimento BETWEEN p_data_inicio AND p_data_fim
        
        UNION ALL
        
        -- Saídas (Contas a Pagar)
        SELECT 
            pp.data_pagamento as data,
            pp.valor_pago as valor,
            'S' as tipo
        FROM fin_parcelas_pagar pp
        WHERE pp.status = 'PAGO'
        AND pp.data_pagamento BETWEEN p_data_inicio AND p_data_fim
    ),
    agrupado AS (
        SELECT 
            CASE 
                WHEN p_agrupamento = 'DIARIO' THEN TO_CHAR(m.data, 'DD/MM/YYYY')
                WHEN p_agrupamento = 'SEMANAL' THEN 
                    'Semana ' || TO_CHAR(DATE_TRUNC('week', m.data), 'WW/YYYY')
                WHEN p_agrupamento = 'MENSAL' THEN TO_CHAR(m.data, 'MM/YYYY')
            END as periodo,
            CASE 
                WHEN p_agrupamento = 'DIARIO' THEN m.data
                WHEN p_agrupamento = 'SEMANAL' THEN DATE_TRUNC('week', m.data)::DATE
                WHEN p_agrupamento = 'MENSAL' THEN DATE_TRUNC('month', m.data)::DATE
            END as data_ref,
            COALESCE(SUM(CASE WHEN m.tipo = 'E' THEN m.valor ELSE 0 END), 0) as entradas,
            COALESCE(SUM(CASE WHEN m.tipo = 'S' THEN m.valor ELSE 0 END), 0) as saidas
        FROM movimentacoes m
        GROUP BY periodo, data_ref
        ORDER BY data_ref
    )
    SELECT 
        a.periodo,
        a.data_ref,
        a.entradas,
        a.saidas,
        (a.entradas - a.saidas) as saldo,
        SUM(a.entradas - a.saidas) OVER (ORDER BY a.data_ref)::DECIMAL(15,2) as saldo_acumulado
    FROM agrupado a;
END;
$$;


--
-- TOC entry 5257 (class 0 OID 0)
-- Dependencies: 742
-- Name: FUNCTION get_fluxo_caixa(p_data_inicio date, p_data_fim date, p_agrupamento character varying); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_fluxo_caixa(p_data_inicio date, p_data_fim date, p_agrupamento character varying) IS 'Relatório de fluxo de caixa com agrupamento personalizável';


--
-- TOC entry 743 (class 1255 OID 18843)
-- Name: get_industry_alerts_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_alerts_stats(vidfor integer) RETURNS TABLE(qtd_pendentes bigint, valor_total_pendente numeric, dias_medio_aberto numeric, prazo_medio_conversao numeric, pedido_critico text, valor_pedido_critico numeric, dias_critico integer, nivel_urgencia text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Pedidos pendentes de faturamento da indústria
    pedidos_pendentes AS (
        SELECT 
            p.ped_numero::TEXT,
            p.ped_data,
            p.ped_totliq,
            (CURRENT_DATE - p.ped_data::date)::INTEGER as dias_em_aberto
        FROM pedidos p
        WHERE p.ped_industria = vIdFor
          AND p.ped_situacao = 'P'
        ORDER BY p.ped_data ASC
    ),

    -- Resumo dos pedidos pendentes
    resumo_pendentes AS (
        SELECT 
            COUNT(*) as qtd_pendentes,
            COALESCE(SUM(ped_totliq), 0) as valor_total_pendente,
            ROUND(AVG(dias_em_aberto)::numeric, 0) as dias_medio_aberto
        FROM pedidos_pendentes
    ),

    -- Pedidos já faturados (para calcular prazo médio de conversão)
    pedidos_faturados AS (
        SELECT 
            AVG(p.ped_datafat::date - p.ped_data::date) as prazo_medio_conversao
        FROM pedidos p
        WHERE p.ped_industria = vIdFor
          AND p.ped_situacao = 'F'
          AND p.ped_datafat IS NOT NULL
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
    ),

    -- Pedido mais antigo pendente (alerta crítico)
    pedido_mais_antigo AS (
        SELECT 
            pp.ped_numero,
            pp.ped_totliq,
            pp.dias_em_aberto
        FROM pedidos_pendentes pp
        ORDER BY pp.dias_em_aberto DESC
        LIMIT 1
    )

    -- Resultado final
    SELECT 
        rp.qtd_pendentes,
        ROUND(rp.valor_total_pendente::numeric, 2) as valor_total_pendente,
        rp.dias_medio_aberto,
        
        -- Prazo médio de conversão histórico
        COALESCE(ROUND(pf.prazo_medio_conversao::numeric, 0), 0) as prazo_medio_conversao,
        
        -- Pedido crítico (mais antigo)
        COALESCE(pma.ped_numero, '—') as pedido_critico,
        COALESCE(ROUND(pma.ped_totliq::numeric, 2), 0) as valor_pedido_critico,
        COALESCE(pma.dias_em_aberto, 0) as dias_critico,
        
        -- Classificação de urgência
        CASE 
            WHEN pma.dias_em_aberto > 30 THEN 'URGENTE'
            WHEN pma.dias_em_aberto > 15 THEN 'ATENÇÃO'
            WHEN pma.dias_em_aberto IS NOT NULL THEN 'NORMAL'
            ELSE 'SEM PENDÊNCIAS'
        END as nivel_urgencia

    FROM resumo_pendentes rp
    LEFT JOIN pedidos_faturados pf ON true
    LEFT JOIN pedido_mais_antigo pma ON true;
END;
$$;


--
-- TOC entry 745 (class 1255 OID 18844)
-- Name: get_industry_behavior_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_behavior_stats(varidfor integer) RETURNS TABLE(mes_pico text, percentual_mes_pico integer, total_clientes bigint, taxa_recorrencia integer, cliente_principal text, concentracao_principal integer, pedidos_cliente_principal bigint, clientes_baixo_ticket bigint, clientes_medio_ticket bigint, clientes_alto_ticket bigint, clientes_premium bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Análise de sazonalidade (picos mensais) nos últimos 12 meses
    pedidos_por_mes AS (
        SELECT 
            TO_CHAR(p.ped_data, 'TMMonth') as mes_nome,
            TO_CHAR(p.ped_data, 'MM') as mes_num,
            EXTRACT(MONTH FROM p.ped_data) as mes_ordem,
            COUNT(*) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 
            TO_CHAR(p.ped_data, 'TMMonth'),
            TO_CHAR(p.ped_data, 'MM'),
            EXTRACT(MONTH FROM p.ped_data)
    ),

    -- Identificar mês com maior volume
    mes_pico_cte AS (
        SELECT 
            ppm.mes_nome,
            ppm.qtd_pedidos,
            ROUND((ppm.qtd_pedidos::numeric * 100.0) / NULLIF((SELECT SUM(pm.qtd_pedidos)::numeric FROM pedidos_por_mes pm), 0), 0)::INTEGER as percentual_volume
        FROM pedidos_por_mes ppm
        ORDER BY ppm.qtd_pedidos DESC
        LIMIT 1
    ),

    -- Análise de clientes: quantidade e recorrência
    clientes_analise AS (
        SELECT 
            p.ped_cliente,
            c.cli_nomred,
            COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total,
            MIN(p.ped_data) as primeira_compra,
            MAX(p.ped_data) as ultima_compra,
            CASE WHEN COUNT(DISTINCT p.ped_numero) > 1 THEN 1 ELSE 0 END as eh_recorrente
        FROM pedidos p
        INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY p.ped_cliente, c.cli_nomred
    ),

    -- Resumo de clientes
    resumo_clientes AS (
        SELECT 
            COUNT(*) as total_clientes,
            SUM(ca.eh_recorrente) as clientes_recorrentes,
            COALESCE(ROUND((SUM(ca.eh_recorrente)::numeric * 100.0) / NULLIF(COUNT(*)::numeric, 0), 0), 0)::INTEGER as taxa_recorrencia
        FROM clientes_analise ca
    ),

    -- Faturamento total da indústria
    faturamento_total AS (
        SELECT SUM(ca.valor_total) as total
        FROM clientes_analise ca
    ),

    -- Cliente que mais fatura (oportunidade de concentração)
    cliente_principal_cte AS (
        SELECT 
            ca.cli_nomred,
            ca.valor_total,
            COALESCE(ROUND((ca.valor_total::numeric * 100.0) / NULLIF((SELECT ft.total::numeric FROM faturamento_total ft), 0), 0), 0)::INTEGER as percentual_faturamento,
            ca.qtd_pedidos
        FROM clientes_analise ca
        ORDER BY ca.valor_total DESC
        LIMIT 1
    ),

    -- Distribuição de clientes por faixa de ticket
    distribuicao_ticket AS (
        SELECT 
            CASE 
                WHEN ca.valor_total < 5000 THEN 'Baixo'
                WHEN ca.valor_total < 20000 THEN 'Médio'
                WHEN ca.valor_total < 50000 THEN 'Alto'
                ELSE 'Premium'
            END as faixa_ticket,
            COUNT(*) as qtd_clientes
        FROM clientes_analise ca
        GROUP BY 
            CASE 
                WHEN ca.valor_total < 5000 THEN 'Baixo'
                WHEN ca.valor_total < 20000 THEN 'Médio'
                WHEN ca.valor_total < 50000 THEN 'Alto'
                ELSE 'Premium'
            END
    )

    -- Resultado consolidado
    SELECT 
        -- Padrão de sazonalidade
        COALESCE(mp.mes_nome, 'N/A')::TEXT as mes_pico,
        COALESCE(mp.percentual_volume, 0) as percentual_mes_pico,
        
        -- Dados de clientes
        COALESCE(rc.total_clientes, 0) as total_clientes,
        COALESCE(rc.taxa_recorrencia, 0) as taxa_recorrencia,
        
        -- Cliente principal
        COALESCE(cp.cli_nomred, 'N/A')::TEXT as cliente_principal,
        COALESCE(cp.percentual_faturamento, 0) as concentracao_principal,
        COALESCE(cp.qtd_pedidos, 0) as pedidos_cliente_principal,
        
        -- Oportunidade: quantidade de clientes em cada faixa
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Baixo'), 0) as clientes_baixo_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Médio'), 0) as clientes_medio_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Alto'), 0) as clientes_alto_ticket,
        COALESCE((SELECT dt.qtd_clientes FROM distribuicao_ticket dt WHERE dt.faixa_ticket = 'Premium'), 0) as clientes_premium

    FROM mes_pico_cte mp
    CROSS JOIN resumo_clientes rc
    CROSS JOIN cliente_principal_cte cp;
END;
$$;


--
-- TOC entry 746 (class 1255 OID 18845)
-- Name: get_industry_benchmarking_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_benchmarking_stats(varidfor integer) RETURNS TABLE(industria text, ticket_medio_industria numeric, qtd_pedidos bigint, qtd_clientes bigint, ticket_medio_mercado numeric, pedidos_medio_mercado numeric, clientes_medio_mercado numeric, diferenca_ticket_perc integer, diferenca_volume_perc integer, taxa_conversao integer, tempo_fechamento_dias integer, tempo_mercado_dias integer, classificacao_ticket text, classificacao_tempo text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Performance da indústria selecionada
    industria_performance AS (
        SELECT 
            f.for_codigo,
            f.for_nomered as for_nome,
            COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
            ROUND(AVG(p.ped_totliq)::numeric, 2) as ticket_medio,
            COUNT(DISTINCT p.ped_cliente) as qtd_clientes,
            ROUND(SUM(p.ped_totliq)::numeric, 2) as faturamento_total
        FROM pedidos p
        INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
        WHERE f.for_codigo = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY f.for_codigo, f.for_nomered
    ),

    -- Média geral de todas as indústrias (benchmark)
    media_geral AS (
        SELECT 
            ROUND(AVG(sub.ticket_medio)::numeric, 2) as ticket_medio_mercado,
            ROUND(AVG(sub.qtd_pedidos)::numeric, 0) as pedidos_medio_mercado,
            ROUND(AVG(sub.qtd_clientes)::numeric, 0) as clientes_medio_mercado
        FROM (
            SELECT 
                p.ped_industria,
                AVG(p.ped_totliq) as ticket_medio,
                COUNT(DISTINCT p.ped_numero) as qtd_pedidos,
                COUNT(DISTINCT p.ped_cliente) as qtd_clientes
            FROM pedidos p
            WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_industria
        ) sub
    ),

    -- Tempo médio de fechamento (diferença entre data de criação e data de envio)
    tempo_fechamento AS (
        SELECT 
            ROUND(AVG(EXTRACT(DAY FROM (p.ped_dataenvio - p.ped_data)))::numeric, 0) as dias_medio_fechamento
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_dataenvio IS NOT NULL
    ),

    -- Tempo médio geral do mercado
    tempo_fechamento_mercado AS (
        SELECT 
            ROUND(AVG(EXTRACT(DAY FROM (p.ped_dataenvio - p.ped_data)))::numeric, 0) as dias_medio_mercado
        FROM pedidos p
        WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_dataenvio IS NOT NULL
    ),

    -- Taxa de conversão (Faturados vs Total)
    taxa_conversao_cte AS (
        SELECT 
            COUNT(DISTINCT CASE WHEN p.ped_situacao = 'F' THEN p.ped_numero END) as pedidos_convertidos,
            COUNT(DISTINCT p.ped_numero) as total_pedidos,
            ROUND(
                COUNT(DISTINCT CASE WHEN p.ped_situacao = 'F' THEN p.ped_numero END)::numeric * 100.0 / 
                NULLIF(COUNT(DISTINCT p.ped_numero)::numeric, 0),
                0
            )::INTEGER as taxa_conversao_perc
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
    )

    SELECT 
        -- Dados da indústria
        ip.for_nome::TEXT as industria,
        ip.ticket_medio as ticket_medio_industria,
        ip.qtd_pedidos,
        ip.qtd_clientes,
        
        -- Benchmark do mercado
        mg.ticket_medio_mercado,
        mg.pedidos_medio_mercado,
        mg.clientes_medio_mercado,
        
        -- Diferenças percentuais
        ROUND(
            ((ip.ticket_medio - mg.ticket_medio_mercado) / NULLIF(mg.ticket_medio_mercado, 0) * 100)::numeric,
            0
        )::INTEGER as diferenca_ticket_perc,
        
        ROUND(
            ((ip.qtd_pedidos::numeric - mg.pedidos_medio_mercado) / NULLIF(mg.pedidos_medio_mercado, 0) * 100)::numeric,
            0
        )::INTEGER as diferenca_volume_perc,
        
        -- Taxa de conversão
        COALESCE(tc.taxa_conversao_perc, 0)::INTEGER as taxa_conversao,
        
        -- Tempo médio de fechamento
        COALESCE(tf.dias_medio_fechamento, 0)::INTEGER as tempo_fechamento_dias,
        COALESCE(tfm.dias_medio_mercado, 0)::INTEGER as tempo_mercado_dias,
        
        -- Classificação de performance
        (CASE 
            WHEN ip.ticket_medio > mg.ticket_medio_mercado THEN '✅ Acima da Média'
            WHEN ip.ticket_medio = mg.ticket_medio_mercado THEN '➡️ Na Média'
            ELSE '⚠️ Abaixo da Média'
        END)::TEXT as classificacao_ticket,
        
        (CASE 
            WHEN COALESCE(tf.dias_medio_fechamento, 0) <= COALESCE(tfm.dias_medio_mercado, 0) THEN '✅ Eficiente'
            ELSE '⚠️ Pode Melhorar'
        END)::TEXT as classificacao_tempo

    FROM industria_performance ip
    CROSS JOIN media_geral mg
    LEFT JOIN tempo_fechamento tf ON true
    LEFT JOIN tempo_fechamento_mercado tfm ON true
    LEFT JOIN taxa_conversao_cte tc ON true;
END;
$$;


--
-- TOC entry 747 (class 1255 OID 18846)
-- Name: get_industry_performance_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_performance_stats(varidfor integer) RETURNS TABLE(industria text, qtd_pedidos bigint, percentual_volume numeric, ticket_medio_industria numeric, ticket_medio_geral numeric, diferenca_ticket_perc numeric, crescimento_trimestral numeric, faturamento_12m numeric, faturamento_trim_atual numeric, faturamento_trim_anterior numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- Vendas totais dos últimos 12 meses
    vendas_12_meses AS (
        SELECT 
            COUNT(*) as total_pedidos,
            SUM(ped_totliq) as valor_total,
            AVG(ped_totliq) as ticket_medio_geral
        FROM pedidos
        WHERE ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND ped_situacao IN ('P', 'F')
    ),

    -- Vendas da indústria específica nos últimos 12 meses
    vendas_industria_12m AS (
        SELECT 
            f.for_codigo,
            f.for_nomered as for_nome,
            COUNT(*) as qtd_pedidos,
            SUM(p.ped_totliq) as valor_total,
            AVG(p.ped_totliq) as ticket_medio
        FROM pedidos p
        INNER JOIN fornecedores f ON p.ped_industria = f.for_codigo
        WHERE f.for_codigo = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY f.for_codigo, f.for_nomered
    ),

    -- Vendas do trimestre atual
    vendas_trimestre_atual AS (
        SELECT 
            COALESCE(SUM(p.ped_totliq), 0) as valor_trimestre
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '3 months'
          AND p.ped_situacao IN ('P', 'F')
    ),

    -- Vendas do trimestre anterior (3-6 meses atrás)
    vendas_trimestre_anterior AS (
        SELECT 
            COALESCE(SUM(p.ped_totliq), 0) as valor_trimestre
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
          AND p.ped_data < CURRENT_DATE - INTERVAL '3 months'
          AND p.ped_situacao IN ('P', 'F')
    )

    -- Resultado final
    SELECT 
        vi.for_nome::TEXT as industria,
        vi.qtd_pedidos,
        
        -- Percentual do volume total (por quantidade de pedidos)
        ROUND((vi.qtd_pedidos::numeric * 100.0) / NULLIF(vt.total_pedidos, 0), 1) as percentual_volume,
        
        -- Ticket médio da indústria
        ROUND(vi.ticket_medio::numeric, 2) as ticket_medio_industria,
        
        -- Ticket médio geral
        ROUND(vt.ticket_medio_geral::numeric, 2) as ticket_medio_geral,
        
        -- Diferença percentual do ticket médio
        ROUND(((vi.ticket_medio - vt.ticket_medio_geral) / NULLIF(vt.ticket_medio_geral, 0) * 100)::numeric, 0) as diferenca_ticket_perc,
        
        -- Crescimento vs trimestre anterior
        CASE 
            WHEN vtp.valor_trimestre > 0 THEN
                ROUND(((vta.valor_trimestre - vtp.valor_trimestre) / vtp.valor_trimestre * 100)::numeric, 0)
            ELSE 0
        END as crescimento_trimestral,
        
        -- Valores absolutos para contexto
        ROUND(vi.valor_total::numeric, 2) as faturamento_12m,
        ROUND(vta.valor_trimestre::numeric, 2) as faturamento_trim_atual,
        ROUND(vtp.valor_trimestre::numeric, 2) as faturamento_trim_anterior
        
    FROM vendas_industria_12m vi
    CROSS JOIN vendas_12_meses vt
    CROSS JOIN vendas_trimestre_atual vta
    CROSS JOIN vendas_trimestre_anterior vtp;
END;
$$;


--
-- TOC entry 748 (class 1255 OID 18847)
-- Name: get_industry_recommendations_stats(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_recommendations_stats(varidfor integer) RETURNS TABLE(qtd_pendentes bigint, valor_pendente numeric, pedidos_urgentes bigint, qtd_alto_valor bigint, valor_total_alto numeric, clientes_inativos bigint, potencial_reativacao numeric, clientes_baixo_ticket bigint, ticket_medio_atual numeric, clientes_concentrados bigint, percentual_concentrado numeric, prioridade_acao text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH 
    -- 1. Pedidos pendentes que precisam de atenção
    pedidos_pendentes AS (
        SELECT 
            COUNT(*) as qtd_pendentes,
            ROUND(COALESCE(SUM(p.ped_totliq), 0)::numeric, 2) as valor_pendente
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_situacao = 'P'
          AND p.ped_data >= CURRENT_DATE - INTERVAL '90 days'
    ),

    -- 2. Pedidos de alto valor (risco financeiro)
    pedidos_alto_valor AS (
        SELECT 
            COUNT(*) as qtd_alto_valor,
            ROUND(COALESCE(SUM(p.ped_totliq), 0)::numeric, 2) as valor_total_alto
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_totliq > 10000
          AND p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
          AND p.ped_situacao = 'P'
    ),

    -- 3. Clientes inativos (oportunidade de reativação)
    clientes_inativos_cte AS (
        SELECT 
            COUNT(DISTINCT historico.ped_cliente) as qtd_inativos,
            ROUND(COALESCE(SUM(historico.valor_historico), 0)::numeric, 2) as potencial_reativacao
        FROM (
            SELECT 
                p.ped_cliente,
                MAX(p.ped_data) as ultima_compra,
                AVG(p.ped_totliq) as valor_historico
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '18 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING MAX(p.ped_data) < CURRENT_DATE - INTERVAL '90 days'
        ) historico
    ),

    -- 4. Pedidos com prazo crítico (urgência)
    pedidos_criticos AS (
        SELECT 
            COUNT(*) as qtd_criticos
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_situacao = 'P'
          AND CURRENT_DATE - p.ped_data::date > 30
    ),

    -- 5. Oportunidade de upsell (clientes com baixo ticket)
    ticket_medio_geral AS (
        SELECT AVG(p.ped_totliq) * 0.7 as limite_baixo
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
    ),
    
    oportunidade_upsell AS (
        SELECT 
            COUNT(DISTINCT sub.ped_cliente) as clientes_baixo_ticket,
            ROUND(COALESCE(AVG(sub.valor_cliente), 0)::numeric, 2) as ticket_medio_atual
        FROM (
            SELECT 
                p.ped_cliente,
                AVG(p.ped_totliq) as valor_cliente
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING AVG(p.ped_totliq) < (SELECT limite_baixo FROM ticket_medio_geral)
        ) sub
    ),

    -- 6. Análise de concentração de clientes
    faturamento_total AS (
        SELECT SUM(p.ped_totliq) as total
        FROM pedidos p
        WHERE p.ped_industria = varIdFor
          AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
          AND p.ped_situacao IN ('P', 'F')
    ),
    
    concentracao_risco AS (
        SELECT 
            COUNT(*) as clientes_concentrados,
            ROUND(COALESCE(SUM(sub.percentual_faturamento), 0)::numeric, 1) as percentual_concentrado
        FROM (
            SELECT 
                p.ped_cliente,
                SUM(p.ped_totliq) * 100.0 / NULLIF((SELECT total FROM faturamento_total), 0) as percentual_faturamento
            FROM pedidos p
            WHERE p.ped_industria = varIdFor
              AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY p.ped_cliente
            HAVING SUM(p.ped_totliq) * 100.0 / NULLIF((SELECT total FROM faturamento_total), 0) > 20
        ) sub
    )

    SELECT 
        -- Recomendação 1: Pedidos pendentes
        COALESCE(pp.qtd_pendentes, 0) as qtd_pendentes,
        COALESCE(pp.valor_pendente, 0) as valor_pendente,
        COALESCE(pc.qtd_criticos, 0) as pedidos_urgentes,
        
        -- Recomendação 2: Pedidos alto valor
        COALESCE(pav.qtd_alto_valor, 0) as qtd_alto_valor,
        COALESCE(pav.valor_total_alto, 0) as valor_total_alto,
        
        -- Recomendação 3: Clientes inativos
        COALESCE(ci.qtd_inativos, 0) as clientes_inativos,
        COALESCE(ci.potencial_reativacao, 0) as potencial_reativacao,
        
        -- Recomendação 4: Oportunidade upsell
        COALESCE(ou.clientes_baixo_ticket, 0) as clientes_baixo_ticket,
        COALESCE(ou.ticket_medio_atual, 0) as ticket_medio_atual,
        
        -- Recomendação 5: Risco de concentração
        COALESCE(cr.clientes_concentrados, 0) as clientes_concentrados,
        COALESCE(cr.percentual_concentrado, 0) as percentual_concentrado,
        
        -- Priorização de ações
        (CASE 
            WHEN COALESCE(pc.qtd_criticos, 0) > 0 THEN '🔴 URGENTE: Pedidos críticos'
            WHEN COALESCE(pp.qtd_pendentes, 0) > 5 THEN '🟡 ATENÇÃO: Muitos pendentes'
            WHEN COALESCE(ci.qtd_inativos, 0) > 10 THEN '🟠 IMPORTANTE: Reativar clientes'
            ELSE '🟢 NORMAL: Monitorar'
        END)::TEXT as prioridade_acao

    FROM pedidos_pendentes pp
    CROSS JOIN pedidos_alto_valor pav
    CROSS JOIN clientes_inativos_cte ci
    CROSS JOIN pedidos_criticos pc
    CROSS JOIN oportunidade_upsell ou
    CROSS JOIN concentracao_risco cr;
END;
$$;


--
-- TOC entry 688 (class 1255 OID 18849)
-- Name: get_industry_revenue(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_industry_revenue(p_ano integer, p_mes integer DEFAULT NULL::integer) RETURNS TABLE(industria_id integer, industria_nome character varying, total_faturamento numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.for_codigo AS industria_id,
        f.for_nomered AS industria_nome,
        COALESCE(SUM(p.ped_totliq), 0)::NUMERIC AS total_faturamento
    FROM 
        fornecedores f
    LEFT JOIN 
        pedidos p ON f.for_codigo = p.ped_industria
        AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
        AND p.ped_situacao IN ('P', 'F')
    WHERE 
        f.for_tipo2 = 'A' -- Fixed column name from tipo_tipo2 to for_tipo2
    GROUP BY 
        f.for_codigo, f.for_nomered
    ORDER BY 
        total_faturamento DESC;
END;
$$;


--
-- TOC entry 736 (class 1255 OID 18850)
-- Name: get_orders_stats(date, date, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_orders_stats(p_data_inicio date, p_data_fim date, p_industria integer DEFAULT NULL::integer) RETURNS TABLE(total_vendido numeric, total_quantidade numeric, total_clientes bigint, ticket_medio numeric)
    LANGUAGE plpgsql
    AS $$
            BEGIN
                RETURN QUERY
                WITH pedidos_filtrados AS (
                    -- Filtra pedidos P ou F no período
                    SELECT 
                        p.ped_pedido,
                        p.ped_cliente,
                        p.ped_totliq
                    FROM pedidos p
                    WHERE p.ped_data BETWEEN p_data_inicio AND p_data_fim
                      AND (p.ped_situacao = 'P' OR p.ped_situacao = 'F')
                      AND (p_industria IS NULL OR p.ped_industria = p_industria)
                ),
                quantidades AS (
                    -- Agrega quantidades por pedido
                    SELECT 
                        i.ite_pedido,
                        SUM(i.ite_quant) as total_quant_pedido
                    FROM itens_ped i
                    WHERE EXISTS (
                        SELECT 1 FROM pedidos_filtrados pf 
                        WHERE pf.ped_pedido = i.ite_pedido
                    )
                    GROUP BY i.ite_pedido
                )
                SELECT 
                    COALESCE(SUM(pf.ped_totliq), 0)::NUMERIC as total_vendido,
                    COALESCE(SUM(q.total_quant_pedido), 0)::NUMERIC as total_quantidade,
                    COUNT(DISTINCT pf.ped_cliente)::BIGINT as total_clientes,
                    CASE 
                        WHEN COUNT(DISTINCT pf.ped_cliente) > 0 
                        THEN (COALESCE(SUM(pf.ped_totliq), 0) / COUNT(DISTINCT pf.ped_cliente))::NUMERIC
                        ELSE 0::NUMERIC
                    END as ticket_medio
                FROM pedidos_filtrados pf
                LEFT JOIN quantidades q ON pf.ped_pedido = q.ite_pedido;
            END;
            $$;


--
-- TOC entry 744 (class 1255 OID 18851)
-- Name: get_relatorio_contas_pagar(date, date, character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_relatorio_contas_pagar(p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date, p_status character varying DEFAULT NULL::character varying, p_id_fornecedor integer DEFAULT NULL::integer, p_id_centro_custo integer DEFAULT NULL::integer) RETURNS TABLE(id_conta integer, descricao character varying, numero_documento character varying, fornecedor_nome character varying, fornecedor_cpf_cnpj character varying, plano_contas character varying, centro_custo character varying, valor_total numeric, valor_pago numeric, saldo numeric, data_emissao date, data_vencimento date, data_pagamento date, status character varying, dias_atraso integer, id_parcela integer, numero_parcela integer, valor_parcela numeric, vencimento_parcela date, pagamento_parcela date, status_parcela character varying, juros numeric, desconto numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.id,
        cp.descricao,
        cp.numero_documento,
        f.nome_razao,
        f.cpf_cnpj,
        pc.descricao,
        cc.descricao,
        cp.valor_total,
        cp.valor_pago,
        (cp.valor_total - cp.valor_pago)::DECIMAL(15,2),
        cp.data_emissao,
        cp.data_vencimento,
        cp.data_pagamento,
        cp.status,
        CASE 
            WHEN cp.status IN ('ABERTO', 'VENCIDO') AND cp.data_vencimento < CURRENT_DATE 
            THEN (CURRENT_DATE - cp.data_vencimento)
            ELSE 0
        END as dias_atraso,
        pp.id,
        pp.numero_parcela,
        pp.valor,
        pp.data_vencimento,
        pp.data_pagamento,
        pp.status,
        pp.juros,
        pp.desconto
    FROM fin_contas_pagar cp
    LEFT JOIN fin_fornecedores f ON cp.id_fornecedor = f.id
    LEFT JOIN fin_plano_contas pc ON cp.id_plano_contas = pc.id
    LEFT JOIN fin_centro_custo cc ON cp.id_centro_custo = cc.id
    LEFT JOIN fin_parcelas_pagar pp ON pp.id_conta_pagar = cp.id
    WHERE 
        (p_data_inicio IS NULL OR cp.data_vencimento >= p_data_inicio)
        AND (p_data_fim IS NULL OR cp.data_vencimento <= p_data_fim)
        AND (p_status IS NULL OR cp.status = p_status)
        AND (p_id_fornecedor IS NULL OR cp.id_fornecedor = p_id_fornecedor)
        AND (p_id_centro_custo IS NULL OR cp.id_centro_custo = p_id_centro_custo)
    ORDER BY cp.data_vencimento DESC, cp.id, pp.numero_parcela;
END;
$$;


--
-- TOC entry 5258 (class 0 OID 0)
-- Dependencies: 744
-- Name: FUNCTION get_relatorio_contas_pagar(p_data_inicio date, p_data_fim date, p_status character varying, p_id_fornecedor integer, p_id_centro_custo integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_relatorio_contas_pagar(p_data_inicio date, p_data_fim date, p_status character varying, p_id_fornecedor integer, p_id_centro_custo integer) IS 'Relatório detalhado de contas a pagar com parcelas';


--
-- TOC entry 749 (class 1255 OID 18852)
-- Name: get_relatorio_contas_receber(date, date, character varying, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_relatorio_contas_receber(p_data_inicio date DEFAULT NULL::date, p_data_fim date DEFAULT NULL::date, p_status character varying DEFAULT NULL::character varying, p_id_cliente integer DEFAULT NULL::integer, p_id_centro_custo integer DEFAULT NULL::integer) RETURNS TABLE(id_conta integer, descricao character varying, numero_documento character varying, cliente_nome character varying, cliente_cpf_cnpj character varying, plano_contas character varying, centro_custo character varying, valor_total numeric, valor_recebido numeric, saldo numeric, data_emissao date, data_vencimento date, data_recebimento date, status character varying, dias_atraso integer, id_parcela integer, numero_parcela integer, valor_parcela numeric, vencimento_parcela date, recebimento_parcela date, status_parcela character varying, juros numeric, desconto numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cr.id,
        cr.descricao,
        cr.numero_documento,
        c.nome_razao,
        c.cpf_cnpj,
        pc.descricao,
        cc.descricao,
        cr.valor_total,
        cr.valor_recebido,
        (cr.valor_total - cr.valor_recebido)::DECIMAL(15,2),
        cr.data_emissao,
        cr.data_vencimento,
        cr.data_recebimento,
        cr.status,
        CASE 
            WHEN cr.status IN ('ABERTO', 'VENCIDO') AND cr.data_vencimento < CURRENT_DATE 
            THEN (CURRENT_DATE - cr.data_vencimento)
            ELSE 0
        END as dias_atraso,
        pr.id,
        pr.numero_parcela,
        pr.valor,
        pr.data_vencimento,
        pr.data_recebimento,
        pr.status,
        pr.juros,
        pr.desconto
    FROM fin_contas_receber cr
    LEFT JOIN fin_clientes c ON cr.id_cliente = c.id
    LEFT JOIN fin_plano_contas pc ON cr.id_plano_contas = pc.id
    LEFT JOIN fin_centro_custo cc ON cr.id_centro_custo = cc.id
    LEFT JOIN fin_parcelas_receber pr ON pr.id_conta_receber = cr.id
    WHERE 
        (p_data_inicio IS NULL OR cr.data_vencimento >= p_data_inicio)
        AND (p_data_fim IS NULL OR cr.data_vencimento <= p_data_fim)
        AND (p_status IS NULL OR cr.status = p_status)
        AND (p_id_cliente IS NULL OR cr.id_cliente = p_id_cliente)
        AND (p_id_centro_custo IS NULL OR cr.id_centro_custo = p_id_centro_custo)
    ORDER BY cr.data_vencimento DESC, cr.id, pr.numero_parcela;
END;
$$;


--
-- TOC entry 5259 (class 0 OID 0)
-- Dependencies: 749
-- Name: FUNCTION get_relatorio_contas_receber(p_data_inicio date, p_data_fim date, p_status character varying, p_id_cliente integer, p_id_centro_custo integer); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.get_relatorio_contas_receber(p_data_inicio date, p_data_fim date, p_status character varying, p_id_cliente integer, p_id_centro_custo integer) IS 'Relatório detalhado de contas a receber com parcelas';


--
-- TOC entry 750 (class 1255 OID 18853)
-- Name: get_sales_performance(integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_sales_performance(p_year integer, p_month integer DEFAULT NULL::integer) RETURNS TABLE(ven_codigo integer, ven_nome character varying, total_value_current numeric, total_value_previous numeric, mom_value_percent numeric, total_qty_current numeric, total_qty_previous numeric, mom_qty_percent numeric, clients_previous integer, clients_current integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_current_start_date DATE;
    v_current_end_date DATE;
    v_previous_start_date DATE;
    v_previous_end_date DATE;
BEGIN
    -- Calculate date ranges based on parameters
    IF p_month IS NULL THEN
        -- Full year comparison
        v_current_start_date := make_date(p_year, 1, 1);
        v_current_end_date := make_date(p_year, 12, 31);
        v_previous_start_date := make_date(p_year - 1, 1, 1);
        v_previous_end_date := make_date(p_year - 1, 12, 31);
    ELSE
        -- Month comparison
        v_current_start_date := make_date(p_year, p_month, 1);
        v_current_end_date := (v_current_start_date + INTERVAL '1 month - 1 day')::DATE;
        
        -- Previous month (handle year rollover)
        IF p_month = 1 THEN
            v_previous_start_date := make_date(p_year - 1, 12, 1);
            v_previous_end_date := make_date(p_year - 1, 12, 31);
        ELSE
            v_previous_start_date := make_date(p_year, p_month - 1, 1);
            v_previous_end_date := (v_previous_start_date + INTERVAL '1 month - 1 day')::DATE;
        END IF;
    END IF;

    RETURN QUERY
    WITH current_period AS (
        SELECT 
            p.ped_vendedor,
            COALESCE(SUM(i.ite_totliquido), 0) as total_value,
            COALESCE(SUM(i.ite_quant), 0) as total_qty,
            COUNT(DISTINCT p.ped_cliente) as unique_clients
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_current_start_date
          AND p.ped_data <= v_current_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_vendedor IS NOT NULL
        GROUP BY p.ped_vendedor
    ),
    previous_period AS (
        SELECT 
            p.ped_vendedor,
            COALESCE(SUM(i.ite_totliquido), 0) as total_value,
            COALESCE(SUM(i.ite_quant), 0) as total_qty,
            COUNT(DISTINCT p.ped_cliente) as unique_clients
        FROM pedidos p
        LEFT JOIN itens_ped i ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= v_previous_start_date
          AND p.ped_data <= v_previous_end_date
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_vendedor IS NOT NULL
        GROUP BY p.ped_vendedor
    )
    SELECT 
        v.ven_codigo,
        v.ven_nome,
        COALESCE(cp.total_value, 0)::NUMERIC as total_value_current,
        COALESCE(pp.total_value, 0)::NUMERIC as total_value_previous,
        CASE 
            WHEN COALESCE(pp.total_value, 0) = 0 THEN 
                CASE WHEN COALESCE(cp.total_value, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((COALESCE(cp.total_value, 0) - COALESCE(pp.total_value, 0)) / COALESCE(pp.total_value, 1) * 100)::NUMERIC
        END as mom_value_percent,
        COALESCE(cp.total_qty, 0)::NUMERIC as total_qty_current,
        COALESCE(pp.total_qty, 0)::NUMERIC as total_qty_previous,
        CASE 
            WHEN COALESCE(pp.total_qty, 0) = 0 THEN 
                CASE WHEN COALESCE(cp.total_qty, 0) > 0 THEN 100.0 ELSE 0.0 END
            ELSE 
                ((COALESCE(cp.total_qty, 0) - COALESCE(pp.total_qty, 0)) / COALESCE(pp.total_qty, 1) * 100)::NUMERIC
        END as mom_qty_percent,
        COALESCE(pp.unique_clients, 0)::INTEGER as clients_previous,
        COALESCE(cp.unique_clients, 0)::INTEGER as clients_current
    FROM vendedores v
    LEFT JOIN current_period cp ON v.ven_codigo = cp.ped_vendedor
    LEFT JOIN previous_period pp ON v.ven_codigo = pp.ped_vendedor
    WHERE COALESCE(cp.total_value, 0) > 0 OR COALESCE(pp.total_value, 0) > 0
    ORDER BY COALESCE(cp.total_value, 0) DESC;
END;
$$;


--
-- TOC entry 751 (class 1255 OID 18854)
-- Name: get_top_clients(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_top_clients(p_ano integer, p_mes integer DEFAULT NULL::integer, p_limit integer DEFAULT 10) RETURNS TABLE(cliente_codigo integer, cliente_nome character varying, total_vendido numeric, quantidade_pedidos bigint)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.ped_cliente as cliente_codigo,
        c.cli_nomred as cliente_nome,
        SUM(p.ped_totliq)::NUMERIC as total_vendido,
        COUNT(p.ped_pedido) as quantidade_pedidos
    FROM pedidos p
    INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
    WHERE 
        p.ped_situacao IN ('P', 'F')
        AND EXTRACT(YEAR FROM p.ped_data) = p_ano
        AND (p_mes IS NULL OR EXTRACT(MONTH FROM p.ped_data) = p_mes)
    GROUP BY p.ped_cliente, c.cli_nomred
    ORDER BY total_vendido DESC
    LIMIT p_limit;
END;
$$;


--
-- TOC entry 752 (class 1255 OID 18855)
-- Name: sp_atualizar_estatisticas_portfolio(); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.sp_atualizar_estatisticas_portfolio()
    LANGUAGE plpgsql
    AS $$
        BEGIN
            -- Atualizar estatísticas das tabelas principais
            ANALYZE cad_prod;
            ANALYZE pedidos;
            ANALYZE itens_ped;
            ANALYZE fornecedores;
            
            RAISE NOTICE 'Estatísticas atualizadas com sucesso';
        END;
        $$;


--
-- TOC entry 753 (class 1255 OID 18856)
-- Name: trg_normalizar_codigo_produto(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.trg_normalizar_codigo_produto() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Auto-preenche o código normalizado ao inserir/atualizar
    IF NEW.pro_codprod IS NOT NULL THEN
        NEW.pro_codigonormalizado := fn_normalizar_codigo(NEW.pro_codprod);
    ELSE
        NEW.pro_codigonormalizado := NULL;
    END IF;
    
    RETURN NEW;
END;
$$;


--
-- TOC entry 5260 (class 0 OID 0)
-- Dependencies: 753
-- Name: FUNCTION trg_normalizar_codigo_produto(); Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON FUNCTION public.trg_normalizar_codigo_produto() IS 'Trigger function que auto-normaliza o código do produto antes de inserir/atualizar';


--
-- TOC entry 757 (class 1255 OID 23114)
-- Name: update_agenda_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_agenda_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


--
-- TOC entry 761 (class 1255 OID 23288)
-- Name: update_conversa_last_message(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_conversa_last_message() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE chat_conversas 
    SET last_message_at = NOW(), updated_at = NOW()
    WHERE id = NEW.conversa_id;
    RETURN NEW;
END;
$$;


--
-- TOC entry 754 (class 1255 OID 18857)
-- Name: update_parametros_timestamp(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_parametros_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 575 (class 1259 OID 23043)
-- Name: agenda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    empresa_id integer,
    titulo character varying(255) NOT NULL,
    descricao text,
    tipo character varying(20) DEFAULT 'tarefa'::character varying,
    data_inicio date NOT NULL,
    hora_inicio time without time zone,
    data_fim date,
    hora_fim time without time zone,
    dia_inteiro boolean DEFAULT false,
    status character varying(20) DEFAULT 'pendente'::character varying,
    prioridade character(1) DEFAULT 'M'::bpchar,
    cliente_id integer,
    contato_id integer,
    pedido_codigo character varying(20),
    fornecedor_id integer,
    crm_interacao_id integer,
    financeiro_id integer,
    recorrente boolean DEFAULT false,
    tipo_recorrencia character varying(20),
    intervalo_recorrencia integer DEFAULT 1,
    dias_semana character varying(20),
    dia_do_mes integer,
    recorrencia_fim date,
    tarefa_pai_id integer,
    lembrete_ativo boolean DEFAULT true,
    lembrete_antes integer DEFAULT 15,
    lembrete_enviado boolean DEFAULT false,
    vezes_adiada integer DEFAULT 0,
    data_original date,
    concluido_em timestamp without time zone,
    notas_conclusao text,
    cor character varying(7),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 579 (class 1259 OID 23088)
-- Name: agenda_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_config (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    hora_inicio_padrao time without time zone DEFAULT '08:00:00'::time without time zone,
    hora_fim_padrao time without time zone DEFAULT '18:00:00'::time without time zone,
    lembrete_padrao integer DEFAULT 15,
    visualizacao_padrao character varying(20) DEFAULT 'semana'::character varying,
    notificar_email boolean DEFAULT false,
    notificar_sistema boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 578 (class 1259 OID 23087)
-- Name: agenda_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agenda_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5261 (class 0 OID 0)
-- Dependencies: 578
-- Name: agenda_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agenda_config_id_seq OWNED BY public.agenda_config.id;


--
-- TOC entry 577 (class 1259 OID 23073)
-- Name: agenda_historico; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.agenda_historico (
    id integer NOT NULL,
    agenda_id integer,
    usuario_id integer,
    acao character varying(50),
    dados_anteriores jsonb,
    dados_novos jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 576 (class 1259 OID 23072)
-- Name: agenda_historico_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agenda_historico_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5262 (class 0 OID 0)
-- Dependencies: 576
-- Name: agenda_historico_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agenda_historico_id_seq OWNED BY public.agenda_historico.id;


--
-- TOC entry 574 (class 1259 OID 23042)
-- Name: agenda_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.agenda_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5263 (class 0 OID 0)
-- Dependencies: 574
-- Name: agenda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.agenda_id_seq OWNED BY public.agenda.id;


--
-- TOC entry 219 (class 1259 OID 18858)
-- Name: area_atu; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.area_atu (
    atu_id integer NOT NULL,
    atu_descricao character varying(60) NOT NULL,
    atu_sel character varying(1),
    gid character varying(38)
);


--
-- TOC entry 220 (class 1259 OID 18861)
-- Name: area_atu_atu_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.area_atu_atu_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5264 (class 0 OID 0)
-- Dependencies: 220
-- Name: area_atu_atu_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.area_atu_atu_id_seq OWNED BY public.area_atu.atu_id;


--
-- TOC entry 221 (class 1259 OID 18862)
-- Name: atua_cli; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.atua_cli (
    atu_idcli integer NOT NULL,
    atu_atuaid integer NOT NULL,
    atu_sel character varying(1),
    gid character varying(38)
);


--
-- TOC entry 222 (class 1259 OID 18865)
-- Name: gen_bandeira_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_bandeira_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 223 (class 1259 OID 18866)
-- Name: bandeira; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bandeira (
    codigo integer DEFAULT nextval('public.gen_bandeira_id'::regclass) NOT NULL,
    descricao character varying(50),
    ativo character varying(1)
);


--
-- TOC entry 5265 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE bandeira; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.bandeira IS 'Bandeiras de cartão de crédito/débito';


--
-- TOC entry 224 (class 1259 OID 18870)
-- Name: gen_cad_prod_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_cad_prod_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5266 (class 0 OID 0)
-- Dependencies: 224
-- Name: SEQUENCE gen_cad_prod_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE public.gen_cad_prod_id IS 'Sequence para tabela CAD_PROD';


--
-- TOC entry 225 (class 1259 OID 18871)
-- Name: cad_prod; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_prod (
    pro_id integer DEFAULT nextval('public.gen_cad_prod_id'::regclass) NOT NULL,
    pro_industria integer NOT NULL,
    pro_codprod character varying(25),
    pro_codigooriginal character varying(50),
    pro_codigonormalizado character varying(40),
    pro_nome character varying(100),
    pro_produtolancamento boolean,
    pro_datalancamento date,
    pro_curvaindustria character(1),
    pro_codbarras character varying(13),
    pro_grupo integer,
    pro_setor character varying(30),
    pro_linha character varying(50),
    pro_embalagem integer,
    pro_peso double precision,
    pro_conversao character varying(300),
    pro_ncm character varying(10),
    pro_aplicacao character varying(300),
    pro_aplicacao2 character varying(800),
    pro_linhaleve boolean,
    pro_linhapesada boolean,
    pro_linhaagricola boolean,
    pro_linhautilitarios boolean,
    pro_offroad boolean,
    pro_status boolean,
    pro_motocicletas boolean,
    pro_origem character(1)
);


--
-- TOC entry 5267 (class 0 OID 0)
-- Dependencies: 225
-- Name: TABLE cad_prod; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.cad_prod IS 'Cadastro de produtos das indústrias';


--
-- TOC entry 5268 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN cad_prod.pro_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cad_prod.pro_id IS 'ID único do produto';


--
-- TOC entry 5269 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN cad_prod.pro_industria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cad_prod.pro_industria IS 'Código da indústria/fornecedor';


--
-- TOC entry 5270 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN cad_prod.pro_codprod; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cad_prod.pro_codprod IS 'Código do produto';


--
-- TOC entry 5271 (class 0 OID 0)
-- Dependencies: 225
-- Name: COLUMN cad_prod.pro_nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cad_prod.pro_nome IS 'Descrição do produto';


--
-- TOC entry 226 (class 1259 OID 18877)
-- Name: cad_tabelaspre; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cad_tabelaspre (
    itab_idprod integer NOT NULL,
    itab_idindustria integer NOT NULL,
    itab_tabela character varying(20) NOT NULL,
    itab_grupodesconto integer,
    itab_descontoadd double precision,
    itab_ipi double precision,
    itab_st double precision,
    itab_prepeso double precision,
    itab_precobruto double precision,
    itab_precopromo double precision,
    itab_precoespecial double precision,
    itab_datatabela date,
    itab_datavencimento date,
    itab_status boolean
);


--
-- TOC entry 663 (class 1259 OID 24754)
-- Name: campanhas_promocionais; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.campanhas_promocionais (
    cmp_codigo integer NOT NULL,
    cmp_descricao character varying(150) NOT NULL,
    cmp_cliente_id integer NOT NULL,
    cmp_industria_id integer NOT NULL,
    cmp_promotor_id integer,
    cmp_status character varying(20) DEFAULT 'SIMULACAO'::character varying,
    cmp_data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cmp_data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cmp_periodo_base_ini date,
    cmp_periodo_base_fim date,
    cmp_campanha_ini date NOT NULL,
    cmp_campanha_fim date NOT NULL,
    cmp_base_dias_kpi integer DEFAULT 0,
    cmp_base_valor_total numeric(15,2) DEFAULT 0,
    cmp_base_qtd_total numeric(15,4) DEFAULT 0,
    cmp_base_media_diaria_val numeric(15,2) DEFAULT 0,
    cmp_base_media_diaria_qtd numeric(15,4) DEFAULT 0,
    cmp_perc_crescimento numeric(5,2) DEFAULT 0,
    cmp_meta_valor_total numeric(15,2) DEFAULT 0,
    cmp_meta_qtd_total numeric(15,4) DEFAULT 0,
    cmp_meta_diaria_val numeric(15,2) DEFAULT 0,
    cmp_meta_diaria_qtd numeric(15,4) DEFAULT 0,
    cmp_real_valor_total numeric(15,2) DEFAULT 0,
    cmp_real_qtd_total numeric(15,4) DEFAULT 0,
    cmp_percentual_atingido_val numeric(5,2) DEFAULT 0,
    cmp_percentual_atingido_qtd numeric(5,2) DEFAULT 0,
    cmp_observacao text,
    cmp_ai_insight text
);


--
-- TOC entry 662 (class 1259 OID 24753)
-- Name: campanhas_promocionais_cmp_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.campanhas_promocionais_cmp_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5272 (class 0 OID 0)
-- Dependencies: 662
-- Name: campanhas_promocionais_cmp_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.campanhas_promocionais_cmp_codigo_seq OWNED BY public.campanhas_promocionais.cmp_codigo;


--
-- TOC entry 227 (class 1259 OID 18880)
-- Name: categoria_prod; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categoria_prod (
    cat_id integer NOT NULL,
    cat_descricao character varying(255) NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 18883)
-- Name: categoria_prod_cat_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categoria_prod_cat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5273 (class 0 OID 0)
-- Dependencies: 228
-- Name: categoria_prod_cat_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categoria_prod_cat_id_seq OWNED BY public.categoria_prod.cat_id;


--
-- TOC entry 229 (class 1259 OID 18884)
-- Name: gen_ccustos_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_ccustos_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 230 (class 1259 OID 18885)
-- Name: ccustos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ccustos (
    cc_id integer DEFAULT nextval('public.gen_ccustos_id'::regclass) NOT NULL,
    cc_descricao character varying(60)
);


--
-- TOC entry 5274 (class 0 OID 0)
-- Dependencies: 230
-- Name: TABLE ccustos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.ccustos IS 'Centros de custo';


--
-- TOC entry 591 (class 1259 OID 23194)
-- Name: chat_conversas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_conversas (
    id integer NOT NULL,
    tipo character varying(20) DEFAULT 'direct'::character varying NOT NULL,
    nome character varying(100),
    descricao text,
    industria_id integer,
    criado_por integer NOT NULL,
    empresa_id integer NOT NULL,
    avatar_url character varying(500),
    is_archived boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    last_message_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 590 (class 1259 OID 23193)
-- Name: chat_conversas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_conversas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5275 (class 0 OID 0)
-- Dependencies: 590
-- Name: chat_conversas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_conversas_id_seq OWNED BY public.chat_conversas.id;


--
-- TOC entry 597 (class 1259 OID 23250)
-- Name: chat_leituras; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_leituras (
    id integer NOT NULL,
    mensagem_id integer NOT NULL,
    usuario_id integer NOT NULL,
    lido_em timestamp without time zone DEFAULT now()
);


--
-- TOC entry 596 (class 1259 OID 23249)
-- Name: chat_leituras_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_leituras_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5276 (class 0 OID 0)
-- Dependencies: 596
-- Name: chat_leituras_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_leituras_id_seq OWNED BY public.chat_leituras.id;


--
-- TOC entry 595 (class 1259 OID 23226)
-- Name: chat_mensagens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_mensagens (
    id integer NOT NULL,
    conversa_id integer NOT NULL,
    remetente_id integer NOT NULL,
    tipo character varying(20) DEFAULT 'text'::character varying,
    conteudo text NOT NULL,
    metadata jsonb,
    reply_to_id integer,
    is_edited boolean DEFAULT false,
    is_deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 594 (class 1259 OID 23225)
-- Name: chat_mensagens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_mensagens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5277 (class 0 OID 0)
-- Dependencies: 594
-- Name: chat_mensagens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_mensagens_id_seq OWNED BY public.chat_mensagens.id;


--
-- TOC entry 599 (class 1259 OID 23265)
-- Name: chat_notificacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_notificacoes (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    empresa_id integer NOT NULL,
    tipo character varying(50) NOT NULL,
    titulo character varying(200) NOT NULL,
    mensagem text,
    link character varying(500),
    metadata jsonb,
    lida boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 598 (class 1259 OID 23264)
-- Name: chat_notificacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_notificacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5278 (class 0 OID 0)
-- Dependencies: 598
-- Name: chat_notificacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_notificacoes_id_seq OWNED BY public.chat_notificacoes.id;


--
-- TOC entry 593 (class 1259 OID 23208)
-- Name: chat_participantes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_participantes (
    id integer NOT NULL,
    conversa_id integer NOT NULL,
    usuario_id integer NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    is_muted boolean DEFAULT false,
    last_read_at timestamp without time zone DEFAULT now(),
    joined_at timestamp without time zone DEFAULT now(),
    left_at timestamp without time zone
);


--
-- TOC entry 592 (class 1259 OID 23207)
-- Name: chat_participantes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_participantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5279 (class 0 OID 0)
-- Dependencies: 592
-- Name: chat_participantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_participantes_id_seq OWNED BY public.chat_participantes.id;


--
-- TOC entry 231 (class 1259 OID 18889)
-- Name: cidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cidades (
    cid_codigo integer NOT NULL,
    cid_nome character varying(100) NOT NULL,
    cid_uf character(2) NOT NULL,
    cid_ibge character varying(7),
    cid_ativo boolean DEFAULT true,
    cid_cod_origem integer
);


--
-- TOC entry 232 (class 1259 OID 18893)
-- Name: cidades_cid_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cidades_cid_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5280 (class 0 OID 0)
-- Dependencies: 232
-- Name: cidades_cid_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cidades_cid_codigo_seq OWNED BY public.cidades.cid_codigo;


--
-- TOC entry 233 (class 1259 OID 18894)
-- Name: cidades_regioes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cidades_regioes (
    reg_id integer NOT NULL,
    cid_id integer NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 18897)
-- Name: cli_aniv; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cli_aniv (
    ani_lancto integer,
    ani_cliente integer NOT NULL,
    ani_nome character varying(55) NOT NULL,
    ani_funcao character varying(35) NOT NULL,
    ani_fone character varying(15),
    ani_email character varying(60),
    ani_diaaniv smallint,
    ani_mes smallint,
    ani_niver date,
    ani_obs character varying(600),
    ani_sel character varying(1) DEFAULT ' '::character varying,
    gid character varying(38),
    ani_timequetorce character varying(50),
    ani_esportepreferido character varying(50),
    ani_hobby character varying(50)
);


--
-- TOC entry 235 (class 1259 OID 18903)
-- Name: cli_aniv_ani_lancto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cli_aniv_ani_lancto_seq
    START WITH 759
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5281 (class 0 OID 0)
-- Dependencies: 235
-- Name: cli_aniv_ani_lancto_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cli_aniv_ani_lancto_seq OWNED BY public.cli_aniv.ani_lancto;


--
-- TOC entry 236 (class 1259 OID 18904)
-- Name: cli_descpro; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cli_descpro (
    cli_codigo integer NOT NULL,
    cli_forcodigo integer NOT NULL,
    cli_grupo integer NOT NULL,
    cli_desc1 double precision,
    cli_desc2 double precision,
    cli_desc3 double precision,
    cli_desc4 double precision,
    cli_desc5 double precision,
    cli_desc6 double precision,
    cli_desc7 double precision,
    cli_desc8 double precision,
    cli_desc9 double precision,
    gid character varying(38)
);


--
-- TOC entry 237 (class 1259 OID 18907)
-- Name: cli_ind_cli_lancamento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cli_ind_cli_lancamento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 238 (class 1259 OID 18908)
-- Name: cli_ind; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cli_ind (
    cli_lancamento integer DEFAULT nextval('public.cli_ind_cli_lancamento_seq'::regclass) NOT NULL,
    cli_codigo integer NOT NULL,
    cli_forcodigo integer NOT NULL,
    cli_desc1 numeric(10,2),
    cli_desc2 numeric(10,2),
    cli_desc3 numeric(10,2),
    cli_desc4 numeric(10,2),
    cli_desc5 numeric(10,2),
    cli_desc6 numeric(10,2),
    cli_desc7 numeric(10,2),
    cli_desc8 numeric(10,2),
    cli_desc9 numeric(10,2),
    cli_desc10 numeric(10,2),
    cli_transportadora integer,
    cli_prazopg character varying(100),
    cli_ipi character varying(10),
    cli_tabela character varying(50),
    cli_codcliind character varying(100),
    cli_obsparticular text,
    cli_comprador character varying(100),
    cli_frete character varying(50),
    cli_emailcomprador character varying(200),
    cli_desc11 numeric(10,2),
    cli_grupodesc integer
);


--
-- TOC entry 239 (class 1259 OID 18914)
-- Name: clientes_cli_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clientes_cli_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 240 (class 1259 OID 18915)
-- Name: clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clientes (
    cli_codigo integer DEFAULT nextval('public.clientes_cli_codigo_seq'::regclass) NOT NULL,
    cli_cnpj character varying(20),
    cli_inscricao character varying(20),
    cli_tipopes character varying(1),
    cli_nome character varying(255),
    cli_nomred character varying(255),
    cli_fantasia character varying(255),
    cli_endereco character varying(255),
    cli_endnum character varying(20),
    cli_bairro character varying(100),
    cli_cidade character varying(100),
    cli_uf character varying(2),
    cli_cep character varying(20),
    cli_ptoref character varying(255),
    cli_fone1 character varying(50),
    cli_endcob character varying(255),
    cli_baicob character varying(100),
    cli_cidcob character varying(100),
    cli_cepcob character varying(20),
    cli_ufcob character varying(2),
    cli_email character varying(255),
    cli_emailnfe character varying(255),
    cli_vencsuf integer,
    cli_emailfinanc character varying(255),
    cli_vendedor integer,
    cli_regimeemp character varying(10),
    cli_regiao2 integer,
    cli_atuacao character varying(10),
    cli_redeloja character varying(255),
    cli_datacad date,
    cli_usuario character varying(50),
    cli_dataalt date,
    cli_idcidade integer,
    gid character varying(50),
    cli_fone2 character varying(20),
    cli_fone3 character varying(20),
    cli_skype character varying(100),
    cli_suframa character varying(50),
    cli_obs text,
    cli_dtabertura date,
    cli_cxpostal character varying(50),
    cli_obspedido text,
    cli_refcom text,
    cli_complemento character varying(100),
    cli_atuacaoprincipal integer,
    cli_latitude numeric(10,8),
    cli_longitude numeric(11,8),
    cli_raio_permitido integer DEFAULT 300
);


--
-- TOC entry 5282 (class 0 OID 0)
-- Dependencies: 240
-- Name: COLUMN clientes.cli_latitude; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.clientes.cli_latitude IS 'Latitude oficial da loja para validação de visitas';


--
-- TOC entry 241 (class 1259 OID 18921)
-- Name: gen_contas_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_contas_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 242 (class 1259 OID 18922)
-- Name: contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contas (
    con_codigo integer DEFAULT nextval('public.gen_contas_id'::regclass) NOT NULL,
    con_descricao character varying(60),
    con_tipo character varying(1),
    con_saldo double precision
);


--
-- TOC entry 5283 (class 0 OID 0)
-- Dependencies: 242
-- Name: TABLE contas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contas IS 'Plano de contas contábil';


--
-- TOC entry 243 (class 1259 OID 18926)
-- Name: gen_contato_for_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_contato_for_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 244 (class 1259 OID 18927)
-- Name: contato_for; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contato_for (
    con_codigo integer DEFAULT nextval('public.gen_contato_for_id'::regclass) NOT NULL,
    con_fornec integer NOT NULL,
    con_nome character varying(60) NOT NULL,
    con_cargo character varying(50) NOT NULL,
    con_telefone character varying(20),
    con_celular character varying(20),
    con_email character varying(100),
    con_dtnasc date,
    con_obs character varying(300),
    gid character varying(38),
    con_timequetorce character varying(50),
    con_esportepreferido character varying(50),
    con_hobby character varying(100)
);


--
-- TOC entry 5284 (class 0 OID 0)
-- Dependencies: 244
-- Name: TABLE contato_for; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.contato_for IS 'Contatos dos fornecedores/indústrias';


--
-- TOC entry 5285 (class 0 OID 0)
-- Dependencies: 244
-- Name: COLUMN contato_for.con_fornec; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.contato_for.con_fornec IS 'Código do fornecedor (FK)';


--
-- TOC entry 245 (class 1259 OID 18933)
-- Name: crm_agenda; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_agenda (
    id bigint NOT NULL,
    cli_codigo integer NOT NULL,
    ven_codigo integer NOT NULL,
    tipo_interacao_id integer NOT NULL,
    data_agendada date NOT NULL,
    observacao character varying(200),
    concluida boolean DEFAULT false NOT NULL,
    data_conclusao timestamp without time zone,
    criado_em timestamp without time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 246 (class 1259 OID 18938)
-- Name: crm_agenda_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_agenda_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5286 (class 0 OID 0)
-- Dependencies: 246
-- Name: crm_agenda_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_agenda_id_seq OWNED BY public.crm_agenda.id;


--
-- TOC entry 247 (class 1259 OID 18939)
-- Name: crm_alerta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_alerta (
    id integer NOT NULL,
    usuario_id integer,
    tipo character varying(50),
    referencia_id integer,
    mensagem text,
    lido boolean DEFAULT false,
    criado_em timestamp without time zone DEFAULT now()
);


--
-- TOC entry 248 (class 1259 OID 18946)
-- Name: crm_alerta_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_alerta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5287 (class 0 OID 0)
-- Dependencies: 248
-- Name: crm_alerta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_alerta_id_seq OWNED BY public.crm_alerta.id;


--
-- TOC entry 339 (class 1259 OID 19809)
-- Name: crm_canal; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_canal (
    id integer NOT NULL,
    descricao character varying(50) NOT NULL,
    ativo boolean DEFAULT true
);


--
-- TOC entry 338 (class 1259 OID 19808)
-- Name: crm_canal_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_canal_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5288 (class 0 OID 0)
-- Dependencies: 338
-- Name: crm_canal_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_canal_id_seq OWNED BY public.crm_canal.id;


--
-- TOC entry 333 (class 1259 OID 19776)
-- Name: crm_funil_etapas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_funil_etapas (
    etapa_id integer NOT NULL,
    nome character varying(50) NOT NULL,
    descricao text,
    ordem integer DEFAULT 0,
    cor character varying(20) DEFAULT '#007bff'::character varying
);


--
-- TOC entry 332 (class 1259 OID 19775)
-- Name: crm_funil_etapas_etapa_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_funil_etapas_etapa_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5289 (class 0 OID 0)
-- Dependencies: 332
-- Name: crm_funil_etapas_etapa_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_funil_etapas_etapa_id_seq OWNED BY public.crm_funil_etapas.etapa_id;


--
-- TOC entry 344 (class 1259 OID 19827)
-- Name: crm_interacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_interacao (
    id integer NOT NULL,
    interacao_id integer NOT NULL,
    cli_codigo integer NOT NULL,
    ven_codigo integer NOT NULL,
    tipo_interacao_id integer,
    canal_id integer,
    resultado_id integer,
    oportunidade_id integer,
    data_hora timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    observacao text
);


--
-- TOC entry 342 (class 1259 OID 19825)
-- Name: crm_interacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_interacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5290 (class 0 OID 0)
-- Dependencies: 342
-- Name: crm_interacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_interacao_id_seq OWNED BY public.crm_interacao.id;


--
-- TOC entry 345 (class 1259 OID 19857)
-- Name: crm_interacao_industria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_interacao_industria (
    interacao_id integer NOT NULL,
    for_codigo integer NOT NULL
);


--
-- TOC entry 343 (class 1259 OID 19826)
-- Name: crm_interacao_interacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_interacao_interacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5291 (class 0 OID 0)
-- Dependencies: 343
-- Name: crm_interacao_interacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_interacao_interacao_id_seq OWNED BY public.crm_interacao.interacao_id;


--
-- TOC entry 335 (class 1259 OID 19787)
-- Name: crm_oportunidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_oportunidades (
    oportunidade_id integer NOT NULL,
    titulo character varying(100) NOT NULL,
    cli_codigo integer NOT NULL,
    ven_codigo integer NOT NULL,
    valor_estimado numeric(15,2),
    etapa_id integer,
    for_codigo integer,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    telefone_contato character varying(20)
);


--
-- TOC entry 334 (class 1259 OID 19786)
-- Name: crm_oportunidades_oportunidade_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_oportunidades_oportunidade_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5292 (class 0 OID 0)
-- Dependencies: 334
-- Name: crm_oportunidades_oportunidade_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_oportunidades_oportunidade_id_seq OWNED BY public.crm_oportunidades.oportunidade_id;


--
-- TOC entry 341 (class 1259 OID 19817)
-- Name: crm_resultado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_resultado (
    id integer NOT NULL,
    descricao character varying(50) NOT NULL,
    ordem integer DEFAULT 0,
    ativo boolean DEFAULT true
);


--
-- TOC entry 340 (class 1259 OID 19816)
-- Name: crm_resultado_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_resultado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5293 (class 0 OID 0)
-- Dependencies: 340
-- Name: crm_resultado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_resultado_id_seq OWNED BY public.crm_resultado.id;


--
-- TOC entry 347 (class 1259 OID 19868)
-- Name: crm_sellout; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_sellout (
    id integer NOT NULL,
    cli_codigo integer NOT NULL,
    for_codigo integer NOT NULL,
    periodo date NOT NULL,
    valor numeric(15,2) DEFAULT 0,
    quantidade numeric(15,2) DEFAULT 0,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 346 (class 1259 OID 19867)
-- Name: crm_sellout_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_sellout_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5294 (class 0 OID 0)
-- Dependencies: 346
-- Name: crm_sellout_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_sellout_id_seq OWNED BY public.crm_sellout.id;


--
-- TOC entry 337 (class 1259 OID 19801)
-- Name: crm_tipo_interacao; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crm_tipo_interacao (
    id integer NOT NULL,
    descricao character varying(50) NOT NULL,
    ativo boolean DEFAULT true
);


--
-- TOC entry 336 (class 1259 OID 19800)
-- Name: crm_tipo_interacao_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crm_tipo_interacao_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5295 (class 0 OID 0)
-- Dependencies: 336
-- Name: crm_tipo_interacao_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crm_tipo_interacao_id_seq OWNED BY public.crm_tipo_interacao.id;


--
-- TOC entry 249 (class 1259 OID 18994)
-- Name: gen_descontos_ind_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_descontos_ind_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 250 (class 1259 OID 18995)
-- Name: descontos_ind; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.descontos_ind (
    des_id integer DEFAULT nextval('public.gen_descontos_ind_id'::regclass) NOT NULL,
    des_codind integer NOT NULL,
    des_descricao character varying(100),
    des_desc1 double precision,
    des_desc2 double precision,
    des_desc3 double precision,
    des_desc4 double precision,
    des_desc5 double precision,
    des_desc6 double precision,
    des_desc7 double precision,
    des_desc8 double precision,
    des_desc9 double precision,
    des_desc10 double precision,
    des_ativo boolean,
    gid character varying(38)
);


--
-- TOC entry 5296 (class 0 OID 0)
-- Dependencies: 250
-- Name: TABLE descontos_ind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.descontos_ind IS 'Política de descontos por indústria';


--
-- TOC entry 5297 (class 0 OID 0)
-- Dependencies: 250
-- Name: COLUMN descontos_ind.des_codind; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.descontos_ind.des_codind IS 'Código da indústria (FK)';


--
-- TOC entry 251 (class 1259 OID 18999)
-- Name: empresa_status; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresa_status (
    emp_id integer NOT NULL,
    emp_situacao character(1) DEFAULT 'A'::bpchar,
    emp_nome character varying(100),
    emp_endereco character varying(200),
    emp_bairro character varying(100),
    emp_cidade character varying(100),
    emp_uf character(2),
    emp_cep character varying(15),
    emp_cnpj character varying(20),
    emp_inscricao character varying(30),
    emp_fones character varying(50),
    emp_logotipo text,
    emp_basedadoslocal character varying(500),
    emp_host character varying(100),
    emp_porta integer,
    emp_username character varying(50),
    emp_password character varying(100),
    emp_pastabasica character varying(500),
    emp_datacriacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    emp_dataatualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT empresa_status_emp_situacao_check CHECK ((emp_situacao = ANY (ARRAY['A'::bpchar, 'B'::bpchar]))),
    CONSTRAINT empresa_status_single_row CHECK ((emp_id = 1))
);


--
-- TOC entry 252 (class 1259 OID 19009)
-- Name: empresa_status_emp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empresa_status_emp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5298 (class 0 OID 0)
-- Dependencies: 252
-- Name: empresa_status_emp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empresa_status_emp_id_seq OWNED BY public.empresa_status.emp_id;


--
-- TOC entry 331 (class 1259 OID 19761)
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id integer NOT NULL,
    cnpj character varying(20) NOT NULL,
    razao_social character varying(200) NOT NULL,
    nome_fantasia character varying(200),
    status character varying(20) DEFAULT 'ATIVO'::character varying,
    db_host character varying(200),
    db_nome character varying(100),
    db_usuario character varying(100),
    db_senha character varying(200),
    db_porta integer DEFAULT 5432,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    limite_sessoes integer DEFAULT 3,
    limite_usuarios integer DEFAULT 5,
    bloqueio_ativo character(1) DEFAULT 'N'::bpchar,
    email_contato character varying(150),
    telefone character varying(50),
    data_vencimento date,
    valor_mensalidade numeric(10,2) DEFAULT 0
);


--
-- TOC entry 330 (class 1259 OID 19760)
-- Name: empresas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empresas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5299 (class 0 OID 0)
-- Dependencies: 330
-- Name: empresas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empresas_id_seq OWNED BY public.empresas.id;


--
-- TOC entry 253 (class 1259 OID 19010)
-- Name: fin_centro_custo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_centro_custo (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    descricao character varying(100) NOT NULL,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 5300 (class 0 OID 0)
-- Dependencies: 253
-- Name: TABLE fin_centro_custo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_centro_custo IS 'Centros de custo para rateio de despesas/receitas';


--
-- TOC entry 254 (class 1259 OID 19016)
-- Name: fin_centro_custo_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_centro_custo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5301 (class 0 OID 0)
-- Dependencies: 254
-- Name: fin_centro_custo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_centro_custo_id_seq OWNED BY public.fin_centro_custo.id;


--
-- TOC entry 255 (class 1259 OID 19017)
-- Name: fin_clientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_clientes (
    id integer NOT NULL,
    tipo_pessoa character(1) NOT NULL,
    cpf_cnpj character varying(18),
    nome_razao character varying(200) NOT NULL,
    nome_fantasia character varying(200),
    endereco character varying(200),
    numero character varying(20),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    uf character(2),
    cep character varying(10),
    telefone character varying(20),
    celular character varying(20),
    email character varying(100),
    observacoes text,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_clientes_tipo_pessoa_check CHECK ((tipo_pessoa = ANY (ARRAY['F'::bpchar, 'J'::bpchar])))
);


--
-- TOC entry 5302 (class 0 OID 0)
-- Dependencies: 255
-- Name: TABLE fin_clientes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_clientes IS 'Clientes do módulo financeiro (SEPARADO da representação)';


--
-- TOC entry 256 (class 1259 OID 19026)
-- Name: fin_clientes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_clientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5303 (class 0 OID 0)
-- Dependencies: 256
-- Name: fin_clientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_clientes_id_seq OWNED BY public.fin_clientes.id;


--
-- TOC entry 257 (class 1259 OID 19027)
-- Name: fin_contas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_contas_pagar (
    id integer NOT NULL,
    descricao character varying(200) NOT NULL,
    id_fornecedor integer,
    numero_documento character varying(50),
    valor_total numeric(15,2) NOT NULL,
    valor_pago numeric(15,2) DEFAULT 0,
    data_emissao date NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    status character varying(20) DEFAULT 'ABERTO'::character varying,
    observacoes text,
    id_plano_contas integer,
    id_centro_custo integer,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por character varying(100),
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_contas_pagar_status_check CHECK (((status)::text = ANY (ARRAY[('ABERTO'::character varying)::text, ('PAGO'::character varying)::text, ('VENCIDO'::character varying)::text, ('CANCELADO'::character varying)::text]))),
    CONSTRAINT fin_contas_pagar_valor_pago_check CHECK ((valor_pago >= (0)::numeric)),
    CONSTRAINT fin_contas_pagar_valor_total_check CHECK ((valor_total >= (0)::numeric))
);


--
-- TOC entry 5304 (class 0 OID 0)
-- Dependencies: 257
-- Name: TABLE fin_contas_pagar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_contas_pagar IS 'Contas a pagar e obrigações';


--
-- TOC entry 258 (class 1259 OID 19039)
-- Name: fin_contas_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_contas_pagar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5305 (class 0 OID 0)
-- Dependencies: 258
-- Name: fin_contas_pagar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_contas_pagar_id_seq OWNED BY public.fin_contas_pagar.id;


--
-- TOC entry 259 (class 1259 OID 19040)
-- Name: fin_contas_receber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_contas_receber (
    id integer NOT NULL,
    descricao character varying(200) NOT NULL,
    id_cliente integer,
    numero_documento character varying(50),
    valor_total numeric(15,2) NOT NULL,
    valor_recebido numeric(15,2) DEFAULT 0,
    data_emissao date NOT NULL,
    data_vencimento date NOT NULL,
    data_recebimento date,
    status character varying(20) DEFAULT 'ABERTO'::character varying,
    observacoes text,
    id_plano_contas integer,
    id_centro_custo integer,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por character varying(100),
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_contas_receber_status_check CHECK (((status)::text = ANY (ARRAY[('ABERTO'::character varying)::text, ('RECEBIDO'::character varying)::text, ('VENCIDO'::character varying)::text, ('CANCELADO'::character varying)::text]))),
    CONSTRAINT fin_contas_receber_valor_recebido_check CHECK ((valor_recebido >= (0)::numeric)),
    CONSTRAINT fin_contas_receber_valor_total_check CHECK ((valor_total >= (0)::numeric))
);


--
-- TOC entry 5306 (class 0 OID 0)
-- Dependencies: 259
-- Name: TABLE fin_contas_receber; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_contas_receber IS 'Contas a receber e direitos';


--
-- TOC entry 260 (class 1259 OID 19052)
-- Name: fin_contas_receber_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_contas_receber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5307 (class 0 OID 0)
-- Dependencies: 260
-- Name: fin_contas_receber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_contas_receber_id_seq OWNED BY public.fin_contas_receber.id;


--
-- TOC entry 261 (class 1259 OID 19053)
-- Name: fin_fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_fornecedores (
    id integer NOT NULL,
    tipo_pessoa character(1) NOT NULL,
    cpf_cnpj character varying(18),
    nome_razao character varying(200) NOT NULL,
    nome_fantasia character varying(200),
    endereco character varying(200),
    numero character varying(20),
    complemento character varying(100),
    bairro character varying(100),
    cidade character varying(100),
    uf character(2),
    cep character varying(10),
    telefone character varying(20),
    celular character varying(20),
    email character varying(100),
    observacoes text,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_fornecedores_tipo_pessoa_check CHECK ((tipo_pessoa = ANY (ARRAY['F'::bpchar, 'J'::bpchar])))
);


--
-- TOC entry 5308 (class 0 OID 0)
-- Dependencies: 261
-- Name: TABLE fin_fornecedores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_fornecedores IS 'Fornecedores do módulo financeiro (SEPARADO das indústrias)';


--
-- TOC entry 262 (class 1259 OID 19062)
-- Name: fin_fornecedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_fornecedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5309 (class 0 OID 0)
-- Dependencies: 262
-- Name: fin_fornecedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_fornecedores_id_seq OWNED BY public.fin_fornecedores.id;


--
-- TOC entry 263 (class 1259 OID 19063)
-- Name: fin_movimentacoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_movimentacoes (
    id integer NOT NULL,
    tipo character(1) NOT NULL,
    descricao character varying(200) NOT NULL,
    valor numeric(15,2) NOT NULL,
    data date NOT NULL,
    id_plano_contas integer,
    id_centro_custo integer,
    id_conta_pagar integer,
    id_conta_receber integer,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_por character varying(100),
    CONSTRAINT fin_movimentacoes_tipo_check CHECK ((tipo = ANY (ARRAY['E'::bpchar, 'S'::bpchar]))),
    CONSTRAINT fin_movimentacoes_valor_check CHECK ((valor >= (0)::numeric))
);


--
-- TOC entry 5310 (class 0 OID 0)
-- Dependencies: 263
-- Name: TABLE fin_movimentacoes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_movimentacoes IS 'Movimentações de caixa (entradas e saídas)';


--
-- TOC entry 264 (class 1259 OID 19071)
-- Name: fin_movimentacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_movimentacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5311 (class 0 OID 0)
-- Dependencies: 264
-- Name: fin_movimentacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_movimentacoes_id_seq OWNED BY public.fin_movimentacoes.id;


--
-- TOC entry 265 (class 1259 OID 19072)
-- Name: fin_parcelas_pagar; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_parcelas_pagar (
    id integer NOT NULL,
    id_conta_pagar integer NOT NULL,
    numero_parcela integer NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_pagamento date,
    valor_pago numeric(15,2),
    juros numeric(15,2) DEFAULT 0,
    desconto numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'ABERTO'::character varying,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_parcelas_pagar_desconto_check CHECK ((desconto >= (0)::numeric)),
    CONSTRAINT fin_parcelas_pagar_juros_check CHECK ((juros >= (0)::numeric)),
    CONSTRAINT fin_parcelas_pagar_numero_parcela_check CHECK ((numero_parcela > 0)),
    CONSTRAINT fin_parcelas_pagar_status_check CHECK (((status)::text = ANY (ARRAY[('ABERTO'::character varying)::text, ('PAGO'::character varying)::text, ('VENCIDO'::character varying)::text, ('CANCELADO'::character varying)::text]))),
    CONSTRAINT fin_parcelas_pagar_valor_check CHECK ((valor >= (0)::numeric)),
    CONSTRAINT fin_parcelas_pagar_valor_pago_check CHECK ((valor_pago >= (0)::numeric))
);


--
-- TOC entry 5312 (class 0 OID 0)
-- Dependencies: 265
-- Name: TABLE fin_parcelas_pagar; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_parcelas_pagar IS 'Parcelas das contas a pagar';


--
-- TOC entry 266 (class 1259 OID 19087)
-- Name: fin_parcelas_pagar_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_parcelas_pagar_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5313 (class 0 OID 0)
-- Dependencies: 266
-- Name: fin_parcelas_pagar_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_parcelas_pagar_id_seq OWNED BY public.fin_parcelas_pagar.id;


--
-- TOC entry 267 (class 1259 OID 19088)
-- Name: fin_parcelas_receber; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_parcelas_receber (
    id integer NOT NULL,
    id_conta_receber integer NOT NULL,
    numero_parcela integer NOT NULL,
    valor numeric(15,2) NOT NULL,
    data_vencimento date NOT NULL,
    data_recebimento date,
    valor_recebido numeric(15,2),
    juros numeric(15,2) DEFAULT 0,
    desconto numeric(15,2) DEFAULT 0,
    status character varying(20) DEFAULT 'ABERTO'::character varying,
    observacoes text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_parcelas_receber_desconto_check CHECK ((desconto >= (0)::numeric)),
    CONSTRAINT fin_parcelas_receber_juros_check CHECK ((juros >= (0)::numeric)),
    CONSTRAINT fin_parcelas_receber_numero_parcela_check CHECK ((numero_parcela > 0)),
    CONSTRAINT fin_parcelas_receber_status_check CHECK (((status)::text = ANY (ARRAY[('ABERTO'::character varying)::text, ('RECEBIDO'::character varying)::text, ('VENCIDO'::character varying)::text, ('CANCELADO'::character varying)::text]))),
    CONSTRAINT fin_parcelas_receber_valor_check CHECK ((valor >= (0)::numeric)),
    CONSTRAINT fin_parcelas_receber_valor_recebido_check CHECK ((valor_recebido >= (0)::numeric))
);


--
-- TOC entry 5314 (class 0 OID 0)
-- Dependencies: 267
-- Name: TABLE fin_parcelas_receber; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_parcelas_receber IS 'Parcelas das contas a receber';


--
-- TOC entry 268 (class 1259 OID 19103)
-- Name: fin_parcelas_receber_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_parcelas_receber_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5315 (class 0 OID 0)
-- Dependencies: 268
-- Name: fin_parcelas_receber_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_parcelas_receber_id_seq OWNED BY public.fin_parcelas_receber.id;


--
-- TOC entry 269 (class 1259 OID 19104)
-- Name: fin_plano_contas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fin_plano_contas (
    id integer NOT NULL,
    codigo character varying(20) NOT NULL,
    descricao character varying(200) NOT NULL,
    tipo character(1) NOT NULL,
    nivel integer NOT NULL,
    id_pai integer,
    ativo boolean DEFAULT true,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    atualizado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fin_plano_contas_nivel_check CHECK (((nivel >= 1) AND (nivel <= 3))),
    CONSTRAINT fin_plano_contas_tipo_check CHECK ((tipo = ANY (ARRAY['R'::bpchar, 'D'::bpchar])))
);


--
-- TOC entry 5316 (class 0 OID 0)
-- Dependencies: 269
-- Name: TABLE fin_plano_contas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.fin_plano_contas IS 'Plano de contas hierárquico (Receitas e Despesas)';


--
-- TOC entry 270 (class 1259 OID 19112)
-- Name: fin_plano_contas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fin_plano_contas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5317 (class 0 OID 0)
-- Dependencies: 270
-- Name: fin_plano_contas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fin_plano_contas_id_seq OWNED BY public.fin_plano_contas.id;


--
-- TOC entry 271 (class 1259 OID 19113)
-- Name: gen_forma_pagamento_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_forma_pagamento_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 272 (class 1259 OID 19114)
-- Name: forma_pagamento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.forma_pagamento (
    fpg_codigo integer DEFAULT nextval('public.gen_forma_pagamento_id'::regclass) NOT NULL,
    fpg_descricao character varying(30),
    fpg_parcelas integer,
    fpg_intervalo integer,
    fpg_entrada integer,
    fpg_bandeira integer,
    fpg_ativo character varying(1),
    gid character varying(38)
);


--
-- TOC entry 5318 (class 0 OID 0)
-- Dependencies: 272
-- Name: TABLE forma_pagamento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.forma_pagamento IS 'Formas e condições de pagamento';


--
-- TOC entry 273 (class 1259 OID 19118)
-- Name: fornecedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fornecedores (
    for_codigo integer NOT NULL,
    for_nome character varying(75),
    for_endereco character varying(45),
    for_bairro character varying(25),
    for_cidade character varying(25),
    for_uf character varying(2),
    for_cep character varying(10),
    for_fone character varying(25),
    for_fone2 character varying(25),
    for_fax character varying(15),
    for_cgc character varying(18) NOT NULL,
    for_inscricao character varying(20),
    for_email character varying(120),
    for_codrep integer,
    for_tipo2 character varying(1),
    for_percom double precision,
    for_des1 double precision,
    for_des2 double precision,
    for_des3 double precision,
    for_des4 double precision,
    for_des5 double precision,
    for_des6 double precision,
    for_des7 double precision,
    for_des8 double precision,
    for_des9 double precision,
    for_des10 double precision,
    for_homepage character varying(150),
    for_contatorep character varying(50),
    observacoes text,
    for_obs2 text,
    for_nomered character varying(15) NOT NULL,
    for_locimagem text,
    for_tipofrete character(1),
    gid character varying(38),
    for_logotipo text
);


--
-- TOC entry 274 (class 1259 OID 19123)
-- Name: gen_agenda_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_agenda_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 275 (class 1259 OID 19124)
-- Name: gen_area_atu_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_area_atu_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 276 (class 1259 OID 19125)
-- Name: gen_caixa_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_caixa_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 277 (class 1259 OID 19126)
-- Name: gen_cli_aniv_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_cli_aniv_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 278 (class 1259 OID 19127)
-- Name: gen_cli_ind_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_cli_ind_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 279 (class 1259 OID 19128)
-- Name: gen_clientes_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_clientes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5319 (class 0 OID 0)
-- Dependencies: 279
-- Name: SEQUENCE gen_clientes_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE public.gen_clientes_id IS 'Sequence para tabela CLIENTES';


--
-- TOC entry 280 (class 1259 OID 19129)
-- Name: gen_contaspgrec_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_contaspgrec_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 281 (class 1259 OID 19130)
-- Name: gen_cred_dev_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_cred_dev_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 282 (class 1259 OID 19131)
-- Name: gen_crm_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_crm_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 283 (class 1259 OID 19132)
-- Name: gen_crm_interacoes_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_crm_interacoes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 284 (class 1259 OID 19133)
-- Name: gen_curvaabc_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_curvaabc_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 285 (class 1259 OID 19134)
-- Name: gen_fatura_ped_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_fatura_ped_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 286 (class 1259 OID 19135)
-- Name: gen_fornecedores_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_fornecedores_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5320 (class 0 OID 0)
-- Dependencies: 286
-- Name: SEQUENCE gen_fornecedores_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE public.gen_fornecedores_id IS 'Sequence para tabela FORNECEDORES';


--
-- TOC entry 287 (class 1259 OID 19136)
-- Name: gen_fracrecebimentos_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_fracrecebimentos_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 288 (class 1259 OID 19137)
-- Name: gen_grupo_desc_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_grupo_desc_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 289 (class 1259 OID 19138)
-- Name: gen_grupos_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_grupos_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 290 (class 1259 OID 19139)
-- Name: gen_lote_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_lote_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 291 (class 1259 OID 19140)
-- Name: gen_parametros_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_parametros_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 292 (class 1259 OID 19141)
-- Name: gen_pedidos_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_pedidos_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 293 (class 1259 OID 19142)
-- Name: gen_produtos_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_produtos_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 294 (class 1259 OID 19143)
-- Name: gen_regioes_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_regioes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 295 (class 1259 OID 19144)
-- Name: gen_rgbcores_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_rgbcores_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 296 (class 1259 OID 19145)
-- Name: gen_saldo_pgrec_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_saldo_pgrec_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 297 (class 1259 OID 19146)
-- Name: gen_tabelas_preco_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_tabelas_preco_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 298 (class 1259 OID 19147)
-- Name: gen_telemkt_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_telemkt_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 299 (class 1259 OID 19148)
-- Name: gen_transportadora_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_transportadora_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 300 (class 1259 OID 19149)
-- Name: gen_user_nomes_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_user_nomes_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 301 (class 1259 OID 19150)
-- Name: gen_vendedores_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gen_vendedores_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5321 (class 0 OID 0)
-- Dependencies: 301
-- Name: SEQUENCE gen_vendedores_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON SEQUENCE public.gen_vendedores_id IS 'Sequence para tabela VENDEDORES';


--
-- TOC entry 302 (class 1259 OID 19151)
-- Name: grupo_desc; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupo_desc (
    gde_id integer DEFAULT nextval('public.gen_grupo_desc_id'::regclass) NOT NULL,
    gde_nome character varying(50),
    gde_desc1 double precision,
    gde_desc2 double precision,
    gde_desc3 double precision,
    gde_desc4 double precision,
    gde_desc5 double precision,
    gde_desc6 double precision,
    gde_desc7 double precision,
    gde_desc8 double precision,
    gde_desc9 double precision,
    gid character varying(38)
);


--
-- TOC entry 5322 (class 0 OID 0)
-- Dependencies: 302
-- Name: TABLE grupo_desc; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.grupo_desc IS 'Grupos de desconto por indústria';


--
-- TOC entry 610 (class 1259 OID 23365)
-- Name: grupos_gru_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.grupos_gru_codigo_seq
    START WITH 4
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 303 (class 1259 OID 19155)
-- Name: grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grupos (
    gru_codigo integer DEFAULT nextval('public.grupos_gru_codigo_seq'::regclass) NOT NULL,
    gru_nome character varying(50),
    gru_percomiss double precision,
    gid character varying(38)
);


--
-- TOC entry 304 (class 1259 OID 19158)
-- Name: ind_metas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ind_metas (
    met_ano integer NOT NULL,
    met_industria integer NOT NULL,
    met_jan double precision,
    met_fev double precision,
    met_mar double precision,
    met_abr double precision,
    met_mai double precision,
    met_jun double precision,
    met_jul double precision,
    met_ago double precision,
    met_set double precision,
    met_out double precision,
    met_nov double precision,
    met_dez double precision
);


--
-- TOC entry 305 (class 1259 OID 19161)
-- Name: indclientes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.indclientes (
    cli_id integer NOT NULL,
    cli_indid integer NOT NULL,
    gid character varying(38)
);


--
-- TOC entry 306 (class 1259 OID 19164)
-- Name: itens_ped_ite_lancto_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.itens_ped_ite_lancto_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 307 (class 1259 OID 19165)
-- Name: itens_ped; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.itens_ped (
    ite_lancto integer DEFAULT nextval('public.itens_ped_ite_lancto_seq'::regclass) NOT NULL,
    ite_pedido character varying(10) NOT NULL,
    ite_industria integer NOT NULL,
    ite_idproduto integer NOT NULL,
    ite_produto character varying(25) NOT NULL,
    ite_normalizado character varying(25),
    ite_embuch character varying(15),
    ite_nomeprod character varying(100),
    ite_grupo smallint,
    ite_data timestamp without time zone,
    ite_quant double precision,
    ite_puni double precision,
    ite_puniliq double precision,
    ite_totliquido double precision,
    ite_des1 double precision,
    ite_des2 double precision,
    ite_des3 double precision,
    ite_des4 double precision,
    ite_des5 double precision,
    ite_des6 double precision,
    ite_des7 double precision,
    ite_des8 double precision,
    ite_des9 double precision,
    ite_des10 double precision,
    ite_des11 double precision,
    ite_descadic double precision,
    ite_descontos character varying(200),
    ite_totbruto double precision,
    ite_valcomipi double precision,
    ite_ipi numeric(7,2),
    ite_st double precision,
    ite_valcomst double precision,
    ite_puniliqcomimposto double precision,
    ite_faturado character varying(1),
    ite_qtdfat integer,
    ite_exportado character varying(1),
    ite_promocao character varying(1),
    ite_status character(1),
    ite_numpedcli character varying(25),
    ite_seq smallint,
    gid character varying(38),
    ite_codigonormalizado character varying(50)
);


--
-- TOC entry 571 (class 1259 OID 23007)
-- Name: log_tentativas_excedentes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.log_tentativas_excedentes (
    id integer NOT NULL,
    empresa_id integer,
    data_tentativa timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ip character varying(50),
    motivo text
);


--
-- TOC entry 570 (class 1259 OID 23006)
-- Name: log_tentativas_excedentes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.log_tentativas_excedentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5323 (class 0 OID 0)
-- Dependencies: 570
-- Name: log_tentativas_excedentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.log_tentativas_excedentes_id_seq OWNED BY public.log_tentativas_excedentes.id;


--
-- TOC entry 308 (class 1259 OID 19171)
-- Name: parametros; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parametros (
    par_id integer NOT NULL,
    par_usuario integer,
    par_ordemped character(1),
    par_qtdenter integer,
    par_itemduplicado character(1),
    par_ordemimpressao character(1),
    par_descontogrupo character(1),
    par_separalinhas character(1),
    par_usadecimais character(1),
    par_fmtpesquisa character(1),
    par_zerapromo character(1),
    par_tipopesquisa character(1),
    par_validapromocao character(1),
    par_salvapedidoauto character(1),
    par_mostracodori character(1),
    par_solicitarconfemail character(1),
    par_mostrapednovos character(1),
    par_mostraimpostos character(1),
    par_qtddecimais integer,
    par_pedidopadrao integer,
    par_telemkttipo character(1),
    par_iniciapedido character(1),
    par_tipofretepadrao character(1),
    par_emailserver character varying(80),
    par_email character varying(80),
    par_emailuser character varying(80),
    par_emailporta integer,
    par_emailpassword character varying(15),
    par_emailtls boolean DEFAULT false,
    par_emailssl boolean DEFAULT false,
    par_emailalternativo character varying(80),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 5324 (class 0 OID 0)
-- Dependencies: 308
-- Name: TABLE parametros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.parametros IS 'Configurações e preferências do sistema por usuário';


--
-- TOC entry 5325 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_usuario IS 'ID do usuário (FK para tabela de usuários)';


--
-- TOC entry 5326 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_ordemped; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_ordemped IS 'Ordem de exibição dos pedidos';


--
-- TOC entry 5327 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_qtdenter; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_qtdenter IS 'Quantidade ao pressionar Enter';


--
-- TOC entry 5328 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_itemduplicado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_itemduplicado IS 'Permitir item duplicado (S/N)';


--
-- TOC entry 5329 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_salvapedidoauto; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_salvapedidoauto IS 'Salvar pedido automaticamente (S/N)';


--
-- TOC entry 5330 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_emailtls; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_emailtls IS 'Usar TLS para email';


--
-- TOC entry 5331 (class 0 OID 0)
-- Dependencies: 308
-- Name: COLUMN parametros.par_emailssl; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.parametros.par_emailssl IS 'Usar SSL para email';


--
-- TOC entry 309 (class 1259 OID 19178)
-- Name: parametros_par_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parametros_par_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5332 (class 0 OID 0)
-- Dependencies: 309
-- Name: parametros_par_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parametros_par_id_seq OWNED BY public.parametros.par_id;


--
-- TOC entry 310 (class 1259 OID 19179)
-- Name: pedidos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pedidos (
    ped_numero integer NOT NULL,
    ped_pedido character varying(10) NOT NULL,
    ped_tabela character varying(25) NOT NULL,
    ped_data date,
    ped_industria integer NOT NULL,
    ped_cliente integer NOT NULL,
    ped_transp integer NOT NULL,
    ped_vendedor smallint NOT NULL,
    ped_cliind character varying(15),
    ped_situacao character varying(1),
    ped_pri double precision,
    ped_seg double precision,
    ped_ter double precision,
    ped_qua double precision,
    ped_qui double precision,
    ped_sex double precision,
    ped_set double precision,
    ped_oit double precision,
    ped_nov double precision,
    ped_dez double precision,
    ped_descadic double precision,
    ped_coeficiente double precision,
    ped_condpag character varying(100),
    ped_tipofrete character varying(1),
    ped_totliq double precision,
    ped_totbruto double precision,
    ped_acrescimo double precision,
    ped_totalipi double precision,
    ped_comprador character varying(30),
    ped_emailcomp character varying(60),
    ped_datafat date,
    ped_nffat character varying(15),
    ped_obs character varying(600),
    ped_obsfora character varying(6000),
    ped_exportado character varying(1),
    ped_enviado character varying(1),
    ped_dataenvio timestamp without time zone,
    gid character varying(38),
    ped_pedindustria character varying(50)
);


--
-- TOC entry 311 (class 1259 OID 19184)
-- Name: pedidos_ped_numero_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pedidos_ped_numero_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5333 (class 0 OID 0)
-- Dependencies: 311
-- Name: pedidos_ped_numero_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pedidos_ped_numero_seq OWNED BY public.pedidos.ped_numero;


--
-- TOC entry 312 (class 1259 OID 19185)
-- Name: regioes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regioes (
    reg_codigo integer NOT NULL,
    reg_descricao character varying(255) NOT NULL
);


--
-- TOC entry 313 (class 1259 OID 19188)
-- Name: regioes_reg_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.regioes_reg_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5334 (class 0 OID 0)
-- Dependencies: 313
-- Name: regioes_reg_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.regioes_reg_codigo_seq OWNED BY public.regioes.reg_codigo;


--
-- TOC entry 669 (class 1259 OID 24832)
-- Name: registro_visitas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.registro_visitas (
    vis_codigo integer NOT NULL,
    vis_datahora timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    vis_promotor_id integer NOT NULL,
    vis_cliente_id integer NOT NULL,
    vis_itinerario_id integer,
    vis_latitude_checkin numeric(10,8) NOT NULL,
    vis_longitude_checkin numeric(11,8) NOT NULL,
    vis_distancia_metros integer,
    vis_valido boolean DEFAULT false,
    vis_observacao text,
    vis_tipo character varying(10) DEFAULT 'CHECKIN'::character varying
);


--
-- TOC entry 5335 (class 0 OID 0)
-- Dependencies: 669
-- Name: COLUMN registro_visitas.vis_distancia_metros; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.registro_visitas.vis_distancia_metros IS 'Distância em metros do ponto de checkin até o cadastro do cliente';


--
-- TOC entry 668 (class 1259 OID 24831)
-- Name: registro_visitas_vis_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.registro_visitas_vis_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5336 (class 0 OID 0)
-- Dependencies: 668
-- Name: registro_visitas_vis_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.registro_visitas_vis_codigo_seq OWNED BY public.registro_visitas.vis_codigo;


--
-- TOC entry 314 (class 1259 OID 19189)
-- Name: repl_itens_gen_id; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.repl_itens_gen_id
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 569 (class 1259 OID 22989)
-- Name: sessoes_ativas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessoes_ativas (
    id integer NOT NULL,
    empresa_id integer,
    usuario_id integer,
    token_sessao uuid DEFAULT gen_random_uuid(),
    ip character varying(50),
    user_agent text,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ultima_atividade timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ativo boolean DEFAULT true
);


--
-- TOC entry 568 (class 1259 OID 22988)
-- Name: sessoes_ativas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessoes_ativas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5337 (class 0 OID 0)
-- Dependencies: 568
-- Name: sessoes_ativas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessoes_ativas_id_seq OWNED BY public.sessoes_ativas.id;


--
-- TOC entry 315 (class 1259 OID 19190)
-- Name: transportadora_tra_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transportadora_tra_codigo_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 316 (class 1259 OID 19191)
-- Name: transportadora; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transportadora (
    tra_codigo integer DEFAULT nextval('public.transportadora_tra_codigo_seq'::regclass) NOT NULL,
    tra_nome character varying(255),
    tra_endereco character varying(255),
    tra_bairro character varying(100),
    tra_cidade character varying(100),
    tra_uf character varying(2),
    tra_cep character varying(20),
    tra_fone character varying(50),
    tra_contato character varying(100),
    tra_email character varying(255),
    tra_cgc character varying(50),
    tra_inscricao character varying(50),
    tra_obs text
);


--
-- TOC entry 317 (class 1259 OID 19197)
-- Name: user_grupos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_grupos (
    grupo character varying(4) NOT NULL,
    descricao character varying(20)
);


--
-- TOC entry 318 (class 1259 OID 19200)
-- Name: user_menu_superior; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_menu_superior (
    opcao integer NOT NULL,
    grupo character varying(4) NOT NULL,
    indice integer,
    porsenha boolean,
    invisivel boolean,
    incluir boolean,
    modificar boolean,
    excluir boolean,
    descricao character varying(40)
);


--
-- TOC entry 319 (class 1259 OID 19203)
-- Name: user_nomes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_nomes (
    codigo integer NOT NULL,
    nome character varying(20) NOT NULL,
    sobrenome character varying(20) NOT NULL,
    senha character varying(20),
    grupo character varying(4),
    imagem bytea,
    master boolean DEFAULT false,
    gerencia boolean DEFAULT false,
    usuario character varying(20)
);


--
-- TOC entry 5338 (class 0 OID 0)
-- Dependencies: 319
-- Name: TABLE user_nomes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.user_nomes IS 'Tabela de usuários do sistema SalesMasters';


--
-- TOC entry 5339 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.codigo IS 'Código único do usuário (auto-incremento)';


--
-- TOC entry 5340 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.nome IS 'Nome do usuário';


--
-- TOC entry 5341 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.sobrenome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.sobrenome IS 'Sobrenome do usuário';


--
-- TOC entry 5342 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.senha; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.senha IS 'Senha do usuário (deve ser criptografada)';


--
-- TOC entry 5343 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.grupo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.grupo IS 'Grupo/perfil do usuário';


--
-- TOC entry 5344 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.imagem; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.imagem IS 'Foto/avatar do usuário em formato binário';


--
-- TOC entry 5345 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.master; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.master IS 'Indica se o usuário é administrador master';


--
-- TOC entry 5346 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.gerencia; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.gerencia IS 'Indica se o usuário tem permissões de gerência';


--
-- TOC entry 5347 (class 0 OID 0)
-- Dependencies: 319
-- Name: COLUMN user_nomes.usuario; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_nomes.usuario IS 'Nome de usuário para login';


--
-- TOC entry 320 (class 1259 OID 19210)
-- Name: user_nomes_codigo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_nomes_codigo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5348 (class 0 OID 0)
-- Dependencies: 320
-- Name: user_nomes_codigo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_nomes_codigo_seq OWNED BY public.user_nomes.codigo;


--
-- TOC entry 573 (class 1259 OID 23022)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    empresa_id integer,
    nome character varying(100),
    sobrenome character varying(100),
    email character varying(150),
    senha character varying(200),
    e_admin boolean DEFAULT false,
    ativo boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 572 (class 1259 OID 23021)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5349 (class 0 OID 0)
-- Dependencies: 572
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 580 (class 1259 OID 23104)
-- Name: v_agenda_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_agenda_resumo AS
 SELECT usuario_id,
    count(*) FILTER (WHERE (((status)::text = 'pendente'::text) AND (data_inicio = CURRENT_DATE))) AS tarefas_hoje,
    count(*) FILTER (WHERE (((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying])::text[])) AND (data_inicio < CURRENT_DATE))) AS atrasadas,
    count(*) FILTER (WHERE (((tipo)::text = 'aniversario'::text) AND (data_inicio = CURRENT_DATE))) AS aniversarios_hoje,
    ( SELECT (((a2.titulo)::text || ' - '::text) || COALESCE(to_char((a2.hora_inicio)::interval, 'HH24:MI'::text), 'Dia todo'::text))
           FROM public.agenda a2
          WHERE ((a2.usuario_id = agenda.usuario_id) AND ((a2.status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying])::text[])) AND (a2.data_inicio = CURRENT_DATE) AND (a2.hora_inicio IS NOT NULL))
          ORDER BY a2.hora_inicio
         LIMIT 1) AS proximo_compromisso
   FROM public.agenda
  WHERE ((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying])::text[]))
  GROUP BY usuario_id;


--
-- TOC entry 600 (class 1259 OID 23283)
-- Name: v_chat_conversas_resumo; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_chat_conversas_resumo AS
 SELECT c.id,
    c.tipo,
    c.nome,
    c.descricao,
    c.industria_id,
    c.avatar_url,
    c.last_message_at,
    p.usuario_id,
    p.last_read_at,
    ( SELECT count(*) AS count
           FROM public.chat_mensagens m
          WHERE ((m.conversa_id = c.id) AND (m.created_at > COALESCE(p.last_read_at, '1970-01-01 00:00:00'::timestamp without time zone)) AND (m.remetente_id <> p.usuario_id))) AS nao_lidas,
    ( SELECT m.conteudo
           FROM public.chat_mensagens m
          WHERE (m.conversa_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS ultima_mensagem,
    ( SELECT m.remetente_id
           FROM public.chat_mensagens m
          WHERE (m.conversa_id = c.id)
          ORDER BY m.created_at DESC
         LIMIT 1) AS ultimo_remetente_id
   FROM (public.chat_conversas c
     JOIN public.chat_participantes p ON ((p.conversa_id = c.id)))
  WHERE ((c.is_archived = false) AND (p.left_at IS NULL));


--
-- TOC entry 581 (class 1259 OID 23109)
-- Name: v_proximos_lembretes; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_proximos_lembretes AS
 SELECT id,
    usuario_id,
    titulo,
    descricao,
    tipo,
    data_inicio,
    hora_inicio,
    lembrete_antes,
    cliente_id,
    pedido_codigo
   FROM public.agenda a
  WHERE (((status)::text = ANY ((ARRAY['pendente'::character varying, 'em_andamento'::character varying])::text[])) AND (lembrete_ativo = true) AND (lembrete_enviado = false) AND (data_inicio = CURRENT_DATE) AND ((hora_inicio IS NULL) OR (((hora_inicio - ((lembrete_antes || ' minutes'::text))::interval))::time with time zone <= CURRENT_TIME)));


--
-- TOC entry 321 (class 1259 OID 19211)
-- Name: vend_metas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vend_metas (
    met_id integer NOT NULL,
    met_ano integer NOT NULL,
    met_industria integer NOT NULL,
    met_vendedor integer NOT NULL,
    met_jan numeric(15,2) DEFAULT 0,
    met_fev numeric(15,2) DEFAULT 0,
    met_mar numeric(15,2) DEFAULT 0,
    met_abr numeric(15,2) DEFAULT 0,
    met_mai numeric(15,2) DEFAULT 0,
    met_jun numeric(15,2) DEFAULT 0,
    met_jul numeric(15,2) DEFAULT 0,
    met_ago numeric(15,2) DEFAULT 0,
    met_set numeric(15,2) DEFAULT 0,
    met_out numeric(15,2) DEFAULT 0,
    met_nov numeric(15,2) DEFAULT 0,
    met_dez numeric(15,2) DEFAULT 0,
    gid character varying(255)
);


--
-- TOC entry 322 (class 1259 OID 19226)
-- Name: vend_metas_met_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.vend_metas_met_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 5350 (class 0 OID 0)
-- Dependencies: 322
-- Name: vend_metas_met_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.vend_metas_met_id_seq OWNED BY public.vend_metas.met_id;


--
-- TOC entry 323 (class 1259 OID 19227)
-- Name: vendedor_ind; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendedor_ind (
    vin_industria smallint NOT NULL,
    vin_codigo integer NOT NULL,
    vin_percom double precision,
    gid character varying(38)
);


--
-- TOC entry 324 (class 1259 OID 19230)
-- Name: vendedor_reg; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendedor_reg (
    vin_regiao smallint NOT NULL,
    vin_codigo integer NOT NULL,
    gid character varying(38)
);


--
-- TOC entry 325 (class 1259 OID 19233)
-- Name: vendedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vendedores (
    ven_codigo integer DEFAULT nextval('public.gen_vendedores_id'::regclass) NOT NULL,
    ven_nome character varying(45),
    ven_endereco character varying(50),
    ven_bairro character varying(25),
    ven_cidade character varying(25),
    ven_cep character varying(11),
    ven_uf character varying(2),
    ven_fone1 character varying(20),
    ven_fone2 character varying(20),
    ven_obs character varying(400),
    ven_cpf character varying(14),
    ven_comissao double precision,
    ven_email character varying(60),
    ven_nomeusu character varying(50),
    ven_aniversario character varying(6),
    ven_rg character varying(30),
    ven_ctps character varying(30),
    ven_filiacao character varying(100),
    ven_pis character varying(20),
    ven_filhos integer,
    ven_codusu integer,
    ven_imagem character varying(200),
    gid character varying(38),
    ven_dtadmissao date,
    ven_dtdemissao date,
    ven_status character(1) DEFAULT 'A'::bpchar,
    ven_cumpremetas character(1) DEFAULT 'S'::bpchar
);


--
-- TOC entry 5351 (class 0 OID 0)
-- Dependencies: 325
-- Name: TABLE vendedores; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.vendedores IS 'Cadastro de vendedores/representantes comerciais';


--
-- TOC entry 5352 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_codigo; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_codigo IS 'Código único do vendedor';


--
-- TOC entry 5353 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_comissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_comissao IS 'Percentual de comissão padrão';


--
-- TOC entry 5354 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_dtadmissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_dtadmissao IS 'Data de admissão do vendedor';


--
-- TOC entry 5355 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_dtdemissao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_dtdemissao IS 'Data de demissão do vendedor';


--
-- TOC entry 5356 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_status IS 'Status: A=Ativo, I=Inativo';


--
-- TOC entry 5357 (class 0 OID 0)
-- Dependencies: 325
-- Name: COLUMN vendedores.ven_cumpremetas; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.vendedores.ven_cumpremetas IS 'Cumpre metas: S=Sim, N=Não';


--
-- TOC entry 326 (class 1259 OID 19241)
-- Name: vw_itens_ped_fixed; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_itens_ped_fixed AS
 SELECT ite_lancto,
    ite_pedido,
    ite_industria,
    ite_idproduto,
    ite_produto,
    ite_normalizado,
    ite_embuch,
    ite_nomeprod,
    ite_grupo,
    ite_data,
    ite_quant,
    ite_puni,
    ite_puniliq,
    ite_totliquido,
    ite_des1,
    ite_des2,
    ite_des3,
    ite_des4,
    ite_des5,
    ite_des6,
    ite_des7,
    ite_des8,
    ite_des9,
    ite_des10,
    ite_des11,
    ite_descadic,
    ite_descontos,
    ite_totbruto,
    ite_valcomipi,
    ite_ipi,
    ite_st,
    ite_valcomst,
    ite_puniliqcomimposto,
    ite_faturado,
    ite_qtdfat,
    ite_exportado,
    ite_promocao,
    ite_status,
    ite_numpedcli,
    ite_seq,
    gid,
    ite_codigonormalizado,
        CASE
            WHEN ((ite_pedido)::text ~ '^[Ff]?[0-9]+$'::text) THEN (regexp_replace((ite_pedido)::text, '[^0-9]'::text, ''::text, 'g'::text))::integer
            ELSE NULL::integer
        END AS ite_pedido_int
   FROM public.itens_ped
  WHERE ((ite_pedido)::text ~ '^[Ff]?[0-9]+$'::text);


--
-- TOC entry 327 (class 1259 OID 19246)
-- Name: vw_metricas_cliente; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_metricas_cliente AS
 SELECT p.ped_cliente AS cliente_id,
    c.cli_nomred AS cliente_nome,
    p.ped_industria AS industry_id,
    (CURRENT_DATE - max(p.ped_data)) AS dias_sem_compra,
    sum(p.ped_totliq) AS valor_total,
    count(p.ped_numero) AS total_pedidos,
    avg(p.ped_totliq) AS ticket_medio
   FROM (public.pedidos p
     JOIN public.clientes c ON ((p.ped_cliente = c.cli_codigo)))
  WHERE ((p.ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]))
  GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;


--
-- TOC entry 328 (class 1259 OID 19251)
-- Name: vw_performance_mensal; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_performance_mensal AS
 SELECT EXTRACT(year FROM ped_data) AS ano,
    EXTRACT(month FROM ped_data) AS mes,
    ped_industria AS industry_id,
    sum(ped_totliq) AS valor_total,
    count(DISTINCT ped_numero) AS qtd_pedidos,
    count(DISTINCT ped_cliente) AS clientes_ativos,
    avg(ped_totliq) AS ticket_medio
   FROM public.pedidos
  WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]))
  GROUP BY (EXTRACT(year FROM ped_data)), (EXTRACT(month FROM ped_data)), ped_industria;


--
-- TOC entry 329 (class 1259 OID 19754)
-- Name: vw_produtos_precos; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.vw_produtos_precos AS
 SELECT p.pro_id,
    p.pro_industria,
    COALESCE(f.for_nomered, (('Indústria '::text || p.pro_industria))::character varying) AS industria_nome,
    p.pro_codprod,
    p.pro_codigonormalizado,
    p.pro_nome,
    p.pro_grupo,
    p.pro_ncm,
    t.itab_tabela,
    t.itab_precobruto,
    t.itab_precopromo,
    t.itab_precoespecial,
    t.itab_ipi,
    t.itab_st,
    t.itab_prepeso,
    t.itab_grupodesconto,
    t.itab_datatabela,
    t.itab_datavencimento,
    t.itab_status,
    round(((t.itab_precobruto * ((1)::double precision + (COALESCE(t.itab_ipi, (0)::double precision) / (100)::double precision))))::numeric, 2) AS preco_com_ipi
   FROM ((public.cad_tabelaspre t
     JOIN public.cad_prod p ON ((p.pro_id = t.itab_idprod)))
     LEFT JOIN public.fornecedores f ON ((f.for_codigo = p.pro_industria)));


--
-- TOC entry 5358 (class 0 OID 0)
-- Dependencies: 329
-- Name: VIEW vw_produtos_precos; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.vw_produtos_precos IS 'View consolidada de produtos com preços - Versão corrigida sem filtro de status';


--
-- TOC entry 4646 (class 2604 OID 23046)
-- Name: agenda id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda ALTER COLUMN id SET DEFAULT nextval('public.agenda_id_seq'::regclass);


--
-- TOC entry 4661 (class 2604 OID 23091)
-- Name: agenda_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_config ALTER COLUMN id SET DEFAULT nextval('public.agenda_config_id_seq'::regclass);


--
-- TOC entry 4659 (class 2604 OID 23076)
-- Name: agenda_historico id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_historico ALTER COLUMN id SET DEFAULT nextval('public.agenda_historico_id_seq'::regclass);


--
-- TOC entry 4512 (class 2604 OID 19261)
-- Name: area_atu atu_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_atu ALTER COLUMN atu_id SET DEFAULT nextval('public.area_atu_atu_id_seq'::regclass);


--
-- TOC entry 4692 (class 2604 OID 24757)
-- Name: campanhas_promocionais cmp_codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_promocionais ALTER COLUMN cmp_codigo SET DEFAULT nextval('public.campanhas_promocionais_cmp_codigo_seq'::regclass);


--
-- TOC entry 4515 (class 2604 OID 19262)
-- Name: categoria_prod cat_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_prod ALTER COLUMN cat_id SET DEFAULT nextval('public.categoria_prod_cat_id_seq'::regclass);


--
-- TOC entry 4670 (class 2604 OID 23197)
-- Name: chat_conversas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversas ALTER COLUMN id SET DEFAULT nextval('public.chat_conversas_id_seq'::regclass);


--
-- TOC entry 4687 (class 2604 OID 23253)
-- Name: chat_leituras id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_leituras ALTER COLUMN id SET DEFAULT nextval('public.chat_leituras_id_seq'::regclass);


--
-- TOC entry 4681 (class 2604 OID 23229)
-- Name: chat_mensagens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_mensagens ALTER COLUMN id SET DEFAULT nextval('public.chat_mensagens_id_seq'::regclass);


--
-- TOC entry 4689 (class 2604 OID 23268)
-- Name: chat_notificacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notificacoes ALTER COLUMN id SET DEFAULT nextval('public.chat_notificacoes_id_seq'::regclass);


--
-- TOC entry 4676 (class 2604 OID 23211)
-- Name: chat_participantes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participantes ALTER COLUMN id SET DEFAULT nextval('public.chat_participantes_id_seq'::regclass);


--
-- TOC entry 4517 (class 2604 OID 19263)
-- Name: cidades cid_codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades ALTER COLUMN cid_codigo SET DEFAULT nextval('public.cidades_cid_codigo_seq'::regclass);


--
-- TOC entry 4519 (class 2604 OID 19264)
-- Name: cli_aniv ani_lancto; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_aniv ALTER COLUMN ani_lancto SET DEFAULT nextval('public.cli_aniv_ani_lancto_seq'::regclass);


--
-- TOC entry 4526 (class 2604 OID 19265)
-- Name: crm_agenda id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_agenda ALTER COLUMN id SET DEFAULT nextval('public.crm_agenda_id_seq'::regclass);


--
-- TOC entry 4529 (class 2604 OID 19266)
-- Name: crm_alerta id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_alerta ALTER COLUMN id SET DEFAULT nextval('public.crm_alerta_id_seq'::regclass);


--
-- TOC entry 4623 (class 2604 OID 19812)
-- Name: crm_canal id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_canal ALTER COLUMN id SET DEFAULT nextval('public.crm_canal_id_seq'::regclass);


--
-- TOC entry 4615 (class 2604 OID 19779)
-- Name: crm_funil_etapas etapa_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_funil_etapas ALTER COLUMN etapa_id SET DEFAULT nextval('public.crm_funil_etapas_etapa_id_seq'::regclass);


--
-- TOC entry 4628 (class 2604 OID 19830)
-- Name: crm_interacao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao ALTER COLUMN id SET DEFAULT nextval('public.crm_interacao_id_seq'::regclass);


--
-- TOC entry 4629 (class 2604 OID 19831)
-- Name: crm_interacao interacao_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao ALTER COLUMN interacao_id SET DEFAULT nextval('public.crm_interacao_interacao_id_seq'::regclass);


--
-- TOC entry 4618 (class 2604 OID 19790)
-- Name: crm_oportunidades oportunidade_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_oportunidades ALTER COLUMN oportunidade_id SET DEFAULT nextval('public.crm_oportunidades_oportunidade_id_seq'::regclass);


--
-- TOC entry 4625 (class 2604 OID 19820)
-- Name: crm_resultado id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_resultado ALTER COLUMN id SET DEFAULT nextval('public.crm_resultado_id_seq'::regclass);


--
-- TOC entry 4631 (class 2604 OID 19871)
-- Name: crm_sellout id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sellout ALTER COLUMN id SET DEFAULT nextval('public.crm_sellout_id_seq'::regclass);


--
-- TOC entry 4621 (class 2604 OID 19804)
-- Name: crm_tipo_interacao id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tipo_interacao ALTER COLUMN id SET DEFAULT nextval('public.crm_tipo_interacao_id_seq'::regclass);


--
-- TOC entry 4533 (class 2604 OID 19275)
-- Name: empresa_status emp_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_status ALTER COLUMN emp_id SET DEFAULT nextval('public.empresa_status_emp_id_seq'::regclass);


--
-- TOC entry 4606 (class 2604 OID 19764)
-- Name: empresas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas ALTER COLUMN id SET DEFAULT nextval('public.empresas_id_seq'::regclass);


--
-- TOC entry 4537 (class 2604 OID 19276)
-- Name: fin_centro_custo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_centro_custo ALTER COLUMN id SET DEFAULT nextval('public.fin_centro_custo_id_seq'::regclass);


--
-- TOC entry 4541 (class 2604 OID 19277)
-- Name: fin_clientes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_clientes ALTER COLUMN id SET DEFAULT nextval('public.fin_clientes_id_seq'::regclass);


--
-- TOC entry 4545 (class 2604 OID 19278)
-- Name: fin_contas_pagar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_pagar ALTER COLUMN id SET DEFAULT nextval('public.fin_contas_pagar_id_seq'::regclass);


--
-- TOC entry 4550 (class 2604 OID 19279)
-- Name: fin_contas_receber id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_receber ALTER COLUMN id SET DEFAULT nextval('public.fin_contas_receber_id_seq'::regclass);


--
-- TOC entry 4555 (class 2604 OID 19280)
-- Name: fin_fornecedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fornecedores ALTER COLUMN id SET DEFAULT nextval('public.fin_fornecedores_id_seq'::regclass);


--
-- TOC entry 4559 (class 2604 OID 19281)
-- Name: fin_movimentacoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes ALTER COLUMN id SET DEFAULT nextval('public.fin_movimentacoes_id_seq'::regclass);


--
-- TOC entry 4561 (class 2604 OID 19282)
-- Name: fin_parcelas_pagar id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_pagar ALTER COLUMN id SET DEFAULT nextval('public.fin_parcelas_pagar_id_seq'::regclass);


--
-- TOC entry 4566 (class 2604 OID 19283)
-- Name: fin_parcelas_receber id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_receber ALTER COLUMN id SET DEFAULT nextval('public.fin_parcelas_receber_id_seq'::regclass);


--
-- TOC entry 4571 (class 2604 OID 19284)
-- Name: fin_plano_contas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas ALTER COLUMN id SET DEFAULT nextval('public.fin_plano_contas_id_seq'::regclass);


--
-- TOC entry 4640 (class 2604 OID 23010)
-- Name: log_tentativas_excedentes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_tentativas_excedentes ALTER COLUMN id SET DEFAULT nextval('public.log_tentativas_excedentes_id_seq'::regclass);


--
-- TOC entry 4579 (class 2604 OID 19285)
-- Name: parametros par_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros ALTER COLUMN par_id SET DEFAULT nextval('public.parametros_par_id_seq'::regclass);


--
-- TOC entry 4584 (class 2604 OID 19286)
-- Name: pedidos ped_numero; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos ALTER COLUMN ped_numero SET DEFAULT nextval('public.pedidos_ped_numero_seq'::regclass);


--
-- TOC entry 4585 (class 2604 OID 19287)
-- Name: regioes reg_codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regioes ALTER COLUMN reg_codigo SET DEFAULT nextval('public.regioes_reg_codigo_seq'::regclass);


--
-- TOC entry 4710 (class 2604 OID 24835)
-- Name: registro_visitas vis_codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_visitas ALTER COLUMN vis_codigo SET DEFAULT nextval('public.registro_visitas_vis_codigo_seq'::regclass);


--
-- TOC entry 4635 (class 2604 OID 22992)
-- Name: sessoes_ativas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_ativas ALTER COLUMN id SET DEFAULT nextval('public.sessoes_ativas_id_seq'::regclass);


--
-- TOC entry 4587 (class 2604 OID 19288)
-- Name: user_nomes codigo; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nomes ALTER COLUMN codigo SET DEFAULT nextval('public.user_nomes_codigo_seq'::regclass);


--
-- TOC entry 4642 (class 2604 OID 23025)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 4590 (class 2604 OID 19289)
-- Name: vend_metas met_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vend_metas ALTER COLUMN met_id SET DEFAULT nextval('public.vend_metas_met_id_seq'::regclass);


--
-- TOC entry 4998 (class 2606 OID 23101)
-- Name: agenda_config agenda_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_config
    ADD CONSTRAINT agenda_config_pkey PRIMARY KEY (id);


--
-- TOC entry 5000 (class 2606 OID 23103)
-- Name: agenda_config agenda_config_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_config
    ADD CONSTRAINT agenda_config_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 4996 (class 2606 OID 23081)
-- Name: agenda_historico agenda_historico_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_historico
    ADD CONSTRAINT agenda_historico_pkey PRIMARY KEY (id);


--
-- TOC entry 4990 (class 2606 OID 23062)
-- Name: agenda agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_pkey PRIMARY KEY (id);


--
-- TOC entry 4746 (class 2606 OID 19294)
-- Name: bandeira bandeira_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bandeira
    ADD CONSTRAINT bandeira_pkey PRIMARY KEY (codigo);


--
-- TOC entry 4748 (class 2606 OID 19296)
-- Name: cad_prod cad_prod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_prod
    ADD CONSTRAINT cad_prod_pkey PRIMARY KEY (pro_id);


--
-- TOC entry 5024 (class 2606 OID 24778)
-- Name: campanhas_promocionais campanhas_promocionais_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.campanhas_promocionais
    ADD CONSTRAINT campanhas_promocionais_pkey PRIMARY KEY (cmp_codigo);


--
-- TOC entry 4771 (class 2606 OID 19298)
-- Name: categoria_prod categoria_prod_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categoria_prod
    ADD CONSTRAINT categoria_prod_pkey PRIMARY KEY (cat_id);


--
-- TOC entry 4773 (class 2606 OID 19300)
-- Name: ccustos ccustos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ccustos
    ADD CONSTRAINT ccustos_pkey PRIMARY KEY (cc_id);


--
-- TOC entry 5002 (class 2606 OID 23206)
-- Name: chat_conversas chat_conversas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_conversas
    ADD CONSTRAINT chat_conversas_pkey PRIMARY KEY (id);


--
-- TOC entry 5017 (class 2606 OID 23258)
-- Name: chat_leituras chat_leituras_mensagem_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_leituras
    ADD CONSTRAINT chat_leituras_mensagem_id_usuario_id_key UNIQUE (mensagem_id, usuario_id);


--
-- TOC entry 5019 (class 2606 OID 23256)
-- Name: chat_leituras chat_leituras_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_leituras
    ADD CONSTRAINT chat_leituras_pkey PRIMARY KEY (id);


--
-- TOC entry 5012 (class 2606 OID 23238)
-- Name: chat_mensagens chat_mensagens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_mensagens
    ADD CONSTRAINT chat_mensagens_pkey PRIMARY KEY (id);


--
-- TOC entry 5021 (class 2606 OID 23274)
-- Name: chat_notificacoes chat_notificacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_notificacoes
    ADD CONSTRAINT chat_notificacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 5006 (class 2606 OID 23219)
-- Name: chat_participantes chat_participantes_conversa_id_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participantes
    ADD CONSTRAINT chat_participantes_conversa_id_usuario_id_key UNIQUE (conversa_id, usuario_id);


--
-- TOC entry 5008 (class 2606 OID 23217)
-- Name: chat_participantes chat_participantes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participantes
    ADD CONSTRAINT chat_participantes_pkey PRIMARY KEY (id);


--
-- TOC entry 4775 (class 2606 OID 19302)
-- Name: cidades cidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades
    ADD CONSTRAINT cidades_pkey PRIMARY KEY (cid_codigo);


--
-- TOC entry 4782 (class 2606 OID 19304)
-- Name: cidades_regioes cidades_regioes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades_regioes
    ADD CONSTRAINT cidades_regioes_pkey PRIMARY KEY (reg_id, cid_id);


--
-- TOC entry 4789 (class 2606 OID 19306)
-- Name: cli_ind cli_ind_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_ind
    ADD CONSTRAINT cli_ind_pkey PRIMARY KEY (cli_lancamento);


--
-- TOC entry 4793 (class 2606 OID 19308)
-- Name: clientes clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clientes
    ADD CONSTRAINT clientes_pkey PRIMARY KEY (cli_codigo);


--
-- TOC entry 4799 (class 2606 OID 19310)
-- Name: contas contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contas
    ADD CONSTRAINT contas_pkey PRIMARY KEY (con_codigo);


--
-- TOC entry 4801 (class 2606 OID 19312)
-- Name: contato_for contato_for_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contato_for
    ADD CONSTRAINT contato_for_pkey PRIMARY KEY (con_fornec, con_nome, con_cargo);


--
-- TOC entry 4805 (class 2606 OID 19314)
-- Name: crm_agenda crm_agenda_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_agenda
    ADD CONSTRAINT crm_agenda_pkey PRIMARY KEY (id);


--
-- TOC entry 4809 (class 2606 OID 19316)
-- Name: crm_alerta crm_alerta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_alerta
    ADD CONSTRAINT crm_alerta_pkey PRIMARY KEY (id);


--
-- TOC entry 4970 (class 2606 OID 19815)
-- Name: crm_canal crm_canal_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_canal
    ADD CONSTRAINT crm_canal_pkey PRIMARY KEY (id);


--
-- TOC entry 4964 (class 2606 OID 19785)
-- Name: crm_funil_etapas crm_funil_etapas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_funil_etapas
    ADD CONSTRAINT crm_funil_etapas_pkey PRIMARY KEY (etapa_id);


--
-- TOC entry 4976 (class 2606 OID 19861)
-- Name: crm_interacao_industria crm_interacao_industria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao_industria
    ADD CONSTRAINT crm_interacao_industria_pkey PRIMARY KEY (interacao_id, for_codigo);


--
-- TOC entry 4974 (class 2606 OID 19836)
-- Name: crm_interacao crm_interacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao
    ADD CONSTRAINT crm_interacao_pkey PRIMARY KEY (id);


--
-- TOC entry 4966 (class 2606 OID 19794)
-- Name: crm_oportunidades crm_oportunidades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_oportunidades
    ADD CONSTRAINT crm_oportunidades_pkey PRIMARY KEY (oportunidade_id);


--
-- TOC entry 4972 (class 2606 OID 19824)
-- Name: crm_resultado crm_resultado_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_resultado
    ADD CONSTRAINT crm_resultado_pkey PRIMARY KEY (id);


--
-- TOC entry 4978 (class 2606 OID 19878)
-- Name: crm_sellout crm_sellout_cli_codigo_for_codigo_periodo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sellout
    ADD CONSTRAINT crm_sellout_cli_codigo_for_codigo_periodo_key UNIQUE (cli_codigo, for_codigo, periodo);


--
-- TOC entry 4980 (class 2606 OID 19876)
-- Name: crm_sellout crm_sellout_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_sellout
    ADD CONSTRAINT crm_sellout_pkey PRIMARY KEY (id);


--
-- TOC entry 4968 (class 2606 OID 19807)
-- Name: crm_tipo_interacao crm_tipo_interacao_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_tipo_interacao
    ADD CONSTRAINT crm_tipo_interacao_pkey PRIMARY KEY (id);


--
-- TOC entry 4815 (class 2606 OID 19334)
-- Name: descontos_ind descontos_ind_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.descontos_ind
    ADD CONSTRAINT descontos_ind_pkey PRIMARY KEY (des_id);


--
-- TOC entry 4819 (class 2606 OID 19336)
-- Name: empresa_status empresa_status_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresa_status
    ADD CONSTRAINT empresa_status_pkey PRIMARY KEY (emp_id);


--
-- TOC entry 4960 (class 2606 OID 19774)
-- Name: empresas empresas_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_cnpj_key UNIQUE (cnpj);


--
-- TOC entry 4962 (class 2606 OID 19772)
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- TOC entry 4821 (class 2606 OID 19338)
-- Name: fin_centro_custo fin_centro_custo_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_centro_custo
    ADD CONSTRAINT fin_centro_custo_codigo_key UNIQUE (codigo);


--
-- TOC entry 4823 (class 2606 OID 19340)
-- Name: fin_centro_custo fin_centro_custo_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_centro_custo
    ADD CONSTRAINT fin_centro_custo_pkey PRIMARY KEY (id);


--
-- TOC entry 4826 (class 2606 OID 19342)
-- Name: fin_clientes fin_clientes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_clientes
    ADD CONSTRAINT fin_clientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4831 (class 2606 OID 19344)
-- Name: fin_contas_pagar fin_contas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_pagar
    ADD CONSTRAINT fin_contas_pagar_pkey PRIMARY KEY (id);


--
-- TOC entry 4838 (class 2606 OID 19346)
-- Name: fin_contas_receber fin_contas_receber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_receber
    ADD CONSTRAINT fin_contas_receber_pkey PRIMARY KEY (id);


--
-- TOC entry 4845 (class 2606 OID 19348)
-- Name: fin_fornecedores fin_fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_fornecedores
    ADD CONSTRAINT fin_fornecedores_pkey PRIMARY KEY (id);


--
-- TOC entry 4850 (class 2606 OID 19350)
-- Name: fin_movimentacoes fin_movimentacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes
    ADD CONSTRAINT fin_movimentacoes_pkey PRIMARY KEY (id);


--
-- TOC entry 4856 (class 2606 OID 19352)
-- Name: fin_parcelas_pagar fin_parcelas_pagar_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_pagar
    ADD CONSTRAINT fin_parcelas_pagar_pkey PRIMARY KEY (id);


--
-- TOC entry 4861 (class 2606 OID 19354)
-- Name: fin_parcelas_receber fin_parcelas_receber_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_receber
    ADD CONSTRAINT fin_parcelas_receber_pkey PRIMARY KEY (id);


--
-- TOC entry 4866 (class 2606 OID 19356)
-- Name: fin_plano_contas fin_plano_contas_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_codigo_key UNIQUE (codigo);


--
-- TOC entry 4868 (class 2606 OID 19358)
-- Name: fin_plano_contas fin_plano_contas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 19360)
-- Name: forma_pagamento forma_pagamento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.forma_pagamento
    ADD CONSTRAINT forma_pagamento_pkey PRIMARY KEY (fpg_codigo);


--
-- TOC entry 4875 (class 2606 OID 19362)
-- Name: fornecedores fornecedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fornecedores
    ADD CONSTRAINT fornecedores_pkey PRIMARY KEY (for_codigo);


--
-- TOC entry 4883 (class 2606 OID 19364)
-- Name: grupo_desc grupo_desc_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grupo_desc
    ADD CONSTRAINT grupo_desc_pkey PRIMARY KEY (gde_id);


--
-- TOC entry 4888 (class 2606 OID 19366)
-- Name: ind_metas ind_metas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ind_metas
    ADD CONSTRAINT ind_metas_pkey PRIMARY KEY (met_ano, met_industria);


--
-- TOC entry 4984 (class 2606 OID 23015)
-- Name: log_tentativas_excedentes log_tentativas_excedentes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_tentativas_excedentes
    ADD CONSTRAINT log_tentativas_excedentes_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 19368)
-- Name: parametros parametros_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parametros
    ADD CONSTRAINT parametros_pkey PRIMARY KEY (par_id);


--
-- TOC entry 4744 (class 2606 OID 19370)
-- Name: atua_cli pk_atua_cli; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.atua_cli
    ADD CONSTRAINT pk_atua_cli PRIMARY KEY (atu_idcli, atu_atuaid);


--
-- TOC entry 4769 (class 2606 OID 19372)
-- Name: cad_tabelaspre pk_cad_tabelaspre; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cad_tabelaspre
    ADD CONSTRAINT pk_cad_tabelaspre PRIMARY KEY (itab_idprod, itab_tabela);


--
-- TOC entry 4784 (class 2606 OID 19374)
-- Name: cli_aniv pk_cli_aniv; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_aniv
    ADD CONSTRAINT pk_cli_aniv PRIMARY KEY (ani_cliente, ani_nome, ani_funcao);


--
-- TOC entry 4787 (class 2606 OID 19376)
-- Name: cli_descpro pk_cli_descpro; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_descpro
    ADD CONSTRAINT pk_cli_descpro PRIMARY KEY (cli_codigo, cli_forcodigo, cli_grupo);


--
-- TOC entry 4892 (class 2606 OID 19378)
-- Name: indclientes pk_indclientes; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.indclientes
    ADD CONSTRAINT pk_indclientes PRIMARY KEY (cli_id, cli_indid);


--
-- TOC entry 4904 (class 2606 OID 19380)
-- Name: itens_ped pk_itens_ped; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.itens_ped
    ADD CONSTRAINT pk_itens_ped PRIMARY KEY (ite_lancto, ite_pedido, ite_idproduto, ite_industria);


--
-- TOC entry 4934 (class 2606 OID 19382)
-- Name: pedidos pk_pedidos; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pedidos
    ADD CONSTRAINT pk_pedidos PRIMARY KEY (ped_pedido, ped_industria);


--
-- TOC entry 4941 (class 2606 OID 19384)
-- Name: user_grupos pk_user_grupos; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_grupos
    ADD CONSTRAINT pk_user_grupos PRIMARY KEY (grupo);


--
-- TOC entry 4951 (class 2606 OID 19386)
-- Name: vendedor_ind pk_vendedor_ind; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendedor_ind
    ADD CONSTRAINT pk_vendedor_ind PRIMARY KEY (vin_codigo, vin_industria);


--
-- TOC entry 4936 (class 2606 OID 19388)
-- Name: regioes regioes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regioes
    ADD CONSTRAINT regioes_pkey PRIMARY KEY (reg_codigo);


--
-- TOC entry 5033 (class 2606 OID 24842)
-- Name: registro_visitas registro_visitas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.registro_visitas
    ADD CONSTRAINT registro_visitas_pkey PRIMARY KEY (vis_codigo);


--
-- TOC entry 4982 (class 2606 OID 23000)
-- Name: sessoes_ativas sessoes_ativas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_ativas
    ADD CONSTRAINT sessoes_ativas_pkey PRIMARY KEY (id);


--
-- TOC entry 4939 (class 2606 OID 19390)
-- Name: transportadora transportadora_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transportadora
    ADD CONSTRAINT transportadora_pkey PRIMARY KEY (tra_codigo);


--
-- TOC entry 4945 (class 2606 OID 19394)
-- Name: user_nomes user_nomes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_nomes
    ADD CONSTRAINT user_nomes_pkey PRIMARY KEY (codigo);


--
-- TOC entry 4986 (class 2606 OID 23034)
-- Name: usuarios usuarios_email_empresa_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_email_empresa_id_key UNIQUE (email, empresa_id);


--
-- TOC entry 4988 (class 2606 OID 23032)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 19396)
-- Name: vend_metas vend_metas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vend_metas
    ADD CONSTRAINT vend_metas_pkey PRIMARY KEY (met_id);


--
-- TOC entry 4958 (class 2606 OID 19398)
-- Name: vendedores vendedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vendedores
    ADD CONSTRAINT vendedores_pkey PRIMARY KEY (ven_codigo);


--
-- TOC entry 4740 (class 1259 OID 19399)
-- Name: atua_cli_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX atua_cli_idx1 ON public.atua_cli USING btree (atu_idcli);


--
-- TOC entry 4741 (class 1259 OID 19400)
-- Name: atua_cli_idx2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX atua_cli_idx2 ON public.atua_cli USING btree (atu_atuaid);


--
-- TOC entry 4742 (class 1259 OID 19401)
-- Name: atua_cli_idx3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX atua_cli_idx3 ON public.atua_cli USING btree (gid);


--
-- TOC entry 4760 (class 1259 OID 19402)
-- Name: cad_tabelaspre_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cad_tabelaspre_idx1 ON public.cad_tabelaspre USING btree (itab_idprod);


--
-- TOC entry 4761 (class 1259 OID 19403)
-- Name: cad_tabelaspre_idx2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cad_tabelaspre_idx2 ON public.cad_tabelaspre USING btree (itab_tabela);


--
-- TOC entry 4785 (class 1259 OID 19404)
-- Name: cli_descpro_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cli_descpro_idx1 ON public.cli_descpro USING btree (gid);


--
-- TOC entry 4806 (class 1259 OID 19405)
-- Name: idx_agenda_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_data ON public.crm_agenda USING btree (data_agendada);


--
-- TOC entry 4991 (class 1259 OID 23069)
-- Name: idx_agenda_lembretes; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_lembretes ON public.agenda USING btree (lembrete_ativo, lembrete_enviado, data_inicio, hora_inicio);


--
-- TOC entry 4992 (class 1259 OID 23070)
-- Name: idx_agenda_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_status ON public.agenda USING btree (status, data_inicio);


--
-- TOC entry 4993 (class 1259 OID 23071)
-- Name: idx_agenda_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_tipo ON public.agenda USING btree (tipo, usuario_id);


--
-- TOC entry 4994 (class 1259 OID 23068)
-- Name: idx_agenda_usuario_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_usuario_data ON public.agenda USING btree (usuario_id, data_inicio, status);


--
-- TOC entry 4807 (class 1259 OID 19406)
-- Name: idx_agenda_vendedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_agenda_vendedor ON public.crm_agenda USING btree (ven_codigo);


--
-- TOC entry 4749 (class 1259 OID 19407)
-- Name: idx_cad_prod_codprod; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_prod_codprod ON public.cad_prod USING btree (pro_codprod);


--
-- TOC entry 4750 (class 1259 OID 19408)
-- Name: idx_cad_prod_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_prod_grupo ON public.cad_prod USING btree (pro_grupo);


--
-- TOC entry 4751 (class 1259 OID 19409)
-- Name: idx_cad_prod_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_prod_industria ON public.cad_prod USING btree (pro_industria);


--
-- TOC entry 4752 (class 1259 OID 19410)
-- Name: idx_cad_prod_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_prod_nome ON public.cad_prod USING btree (pro_nome);


--
-- TOC entry 4753 (class 1259 OID 19411)
-- Name: idx_cad_prod_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cad_prod_status ON public.cad_prod USING btree (pro_status);


--
-- TOC entry 5003 (class 1259 OID 23275)
-- Name: idx_chat_conversas_empresa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversas_empresa ON public.chat_conversas USING btree (empresa_id);


--
-- TOC entry 5004 (class 1259 OID 23276)
-- Name: idx_chat_conversas_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_conversas_tipo ON public.chat_conversas USING btree (tipo);


--
-- TOC entry 5013 (class 1259 OID 23279)
-- Name: idx_chat_mensagens_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_mensagens_conversa ON public.chat_mensagens USING btree (conversa_id);


--
-- TOC entry 5014 (class 1259 OID 23281)
-- Name: idx_chat_mensagens_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_mensagens_created ON public.chat_mensagens USING btree (created_at DESC);


--
-- TOC entry 5015 (class 1259 OID 23280)
-- Name: idx_chat_mensagens_remetente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_mensagens_remetente ON public.chat_mensagens USING btree (remetente_id);


--
-- TOC entry 5022 (class 1259 OID 23282)
-- Name: idx_chat_notificacoes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_notificacoes_usuario ON public.chat_notificacoes USING btree (usuario_id, lida);


--
-- TOC entry 5009 (class 1259 OID 23278)
-- Name: idx_chat_participantes_conversa; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participantes_conversa ON public.chat_participantes USING btree (conversa_id);


--
-- TOC entry 5010 (class 1259 OID 23277)
-- Name: idx_chat_participantes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_participantes_usuario ON public.chat_participantes USING btree (usuario_id);


--
-- TOC entry 4776 (class 1259 OID 19412)
-- Name: idx_cidades_cid_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cidades_cid_codigo ON public.cidades USING btree (cid_codigo);


--
-- TOC entry 4777 (class 1259 OID 19413)
-- Name: idx_cidades_cid_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cidades_cid_nome ON public.cidades USING btree (cid_nome);


--
-- TOC entry 4778 (class 1259 OID 19414)
-- Name: idx_cidades_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cidades_nome ON public.cidades USING btree (cid_nome);


--
-- TOC entry 4779 (class 1259 OID 19415)
-- Name: idx_cidades_nome_uf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cidades_nome_uf ON public.cidades USING btree (cid_nome, cid_uf);


--
-- TOC entry 4780 (class 1259 OID 19416)
-- Name: idx_cidades_uf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cidades_uf ON public.cidades USING btree (cid_uf);


--
-- TOC entry 4790 (class 1259 OID 19417)
-- Name: idx_cli_ind_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cli_ind_cliente ON public.cli_ind USING btree (cli_codigo);


--
-- TOC entry 4791 (class 1259 OID 19418)
-- Name: idx_cli_ind_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cli_ind_fornecedor ON public.cli_ind USING btree (cli_forcodigo);


--
-- TOC entry 4794 (class 1259 OID 19419)
-- Name: idx_clientes_cli_atuacaoprincipal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cli_atuacaoprincipal ON public.clientes USING btree (cli_atuacaoprincipal);


--
-- TOC entry 4795 (class 1259 OID 19420)
-- Name: idx_clientes_cli_idcidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cli_idcidade ON public.clientes USING btree (cli_idcidade);


--
-- TOC entry 4796 (class 1259 OID 19421)
-- Name: idx_clientes_cli_regiao2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cli_regiao2 ON public.clientes USING btree (cli_regiao2);


--
-- TOC entry 4797 (class 1259 OID 19422)
-- Name: idx_clientes_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_clientes_cnpj ON public.clientes USING btree (cli_cnpj);


--
-- TOC entry 5025 (class 1259 OID 24779)
-- Name: idx_cmp_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmp_cliente ON public.campanhas_promocionais USING btree (cmp_cliente_id);


--
-- TOC entry 5026 (class 1259 OID 24780)
-- Name: idx_cmp_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmp_industria ON public.campanhas_promocionais USING btree (cmp_industria_id);


--
-- TOC entry 5027 (class 1259 OID 24782)
-- Name: idx_cmp_periodo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmp_periodo ON public.campanhas_promocionais USING btree (cmp_campanha_ini, cmp_campanha_fim);


--
-- TOC entry 5028 (class 1259 OID 24781)
-- Name: idx_cmp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cmp_status ON public.campanhas_promocionais USING btree (cmp_status);


--
-- TOC entry 4802 (class 1259 OID 19423)
-- Name: idx_contato_for_fornec; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contato_for_fornec ON public.contato_for USING btree (con_fornec);


--
-- TOC entry 4803 (class 1259 OID 19424)
-- Name: idx_contato_for_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_contato_for_nome ON public.contato_for USING btree (con_nome);


--
-- TOC entry 4810 (class 1259 OID 19425)
-- Name: idx_crm_alerta_criado_em; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_alerta_criado_em ON public.crm_alerta USING btree (criado_em DESC);


--
-- TOC entry 4811 (class 1259 OID 19426)
-- Name: idx_crm_alerta_nao_lido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_alerta_nao_lido ON public.crm_alerta USING btree (usuario_id) WHERE (lido = false);


--
-- TOC entry 4812 (class 1259 OID 19427)
-- Name: idx_crm_alerta_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_alerta_tipo ON public.crm_alerta USING btree (tipo);


--
-- TOC entry 4813 (class 1259 OID 19428)
-- Name: idx_crm_alerta_usuario_lido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crm_alerta_usuario_lido ON public.crm_alerta USING btree (usuario_id, lido);


--
-- TOC entry 4816 (class 1259 OID 19438)
-- Name: idx_descontos_ind_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_descontos_ind_ativo ON public.descontos_ind USING btree (des_ativo);


--
-- TOC entry 4817 (class 1259 OID 19439)
-- Name: idx_descontos_ind_codind; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_descontos_ind_codind ON public.descontos_ind USING btree (des_codind);


--
-- TOC entry 4824 (class 1259 OID 19440)
-- Name: idx_fin_centro_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_centro_ativo ON public.fin_centro_custo USING btree (ativo);


--
-- TOC entry 4827 (class 1259 OID 19441)
-- Name: idx_fin_cli_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cli_ativo ON public.fin_clientes USING btree (ativo);


--
-- TOC entry 4828 (class 1259 OID 19442)
-- Name: idx_fin_cli_cpf_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cli_cpf_cnpj ON public.fin_clientes USING btree (cpf_cnpj);


--
-- TOC entry 4829 (class 1259 OID 19443)
-- Name: idx_fin_cli_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cli_nome ON public.fin_clientes USING btree (nome_razao);


--
-- TOC entry 4832 (class 1259 OID 19444)
-- Name: idx_fin_cp_centro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cp_centro ON public.fin_contas_pagar USING btree (id_centro_custo);


--
-- TOC entry 4833 (class 1259 OID 19445)
-- Name: idx_fin_cp_fornecedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cp_fornecedor ON public.fin_contas_pagar USING btree (id_fornecedor);


--
-- TOC entry 4834 (class 1259 OID 19446)
-- Name: idx_fin_cp_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cp_plano ON public.fin_contas_pagar USING btree (id_plano_contas);


--
-- TOC entry 4835 (class 1259 OID 19447)
-- Name: idx_fin_cp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cp_status ON public.fin_contas_pagar USING btree (status);


--
-- TOC entry 4836 (class 1259 OID 19448)
-- Name: idx_fin_cp_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cp_vencimento ON public.fin_contas_pagar USING btree (data_vencimento);


--
-- TOC entry 4839 (class 1259 OID 19449)
-- Name: idx_fin_cr_centro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cr_centro ON public.fin_contas_receber USING btree (id_centro_custo);


--
-- TOC entry 4840 (class 1259 OID 19450)
-- Name: idx_fin_cr_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cr_cliente ON public.fin_contas_receber USING btree (id_cliente);


--
-- TOC entry 4841 (class 1259 OID 19451)
-- Name: idx_fin_cr_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cr_plano ON public.fin_contas_receber USING btree (id_plano_contas);


--
-- TOC entry 4842 (class 1259 OID 19452)
-- Name: idx_fin_cr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cr_status ON public.fin_contas_receber USING btree (status);


--
-- TOC entry 4843 (class 1259 OID 19453)
-- Name: idx_fin_cr_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_cr_vencimento ON public.fin_contas_receber USING btree (data_vencimento);


--
-- TOC entry 4846 (class 1259 OID 19454)
-- Name: idx_fin_for_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_for_ativo ON public.fin_fornecedores USING btree (ativo);


--
-- TOC entry 4847 (class 1259 OID 19455)
-- Name: idx_fin_for_cpf_cnpj; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_for_cpf_cnpj ON public.fin_fornecedores USING btree (cpf_cnpj);


--
-- TOC entry 4848 (class 1259 OID 19456)
-- Name: idx_fin_for_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_for_nome ON public.fin_fornecedores USING btree (nome_razao);


--
-- TOC entry 4851 (class 1259 OID 19457)
-- Name: idx_fin_mov_centro; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mov_centro ON public.fin_movimentacoes USING btree (id_centro_custo);


--
-- TOC entry 4852 (class 1259 OID 19458)
-- Name: idx_fin_mov_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mov_data ON public.fin_movimentacoes USING btree (data);


--
-- TOC entry 4853 (class 1259 OID 19459)
-- Name: idx_fin_mov_plano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mov_plano ON public.fin_movimentacoes USING btree (id_plano_contas);


--
-- TOC entry 4854 (class 1259 OID 19460)
-- Name: idx_fin_mov_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_mov_tipo ON public.fin_movimentacoes USING btree (tipo);


--
-- TOC entry 4869 (class 1259 OID 19461)
-- Name: idx_fin_plano_ativo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_plano_ativo ON public.fin_plano_contas USING btree (ativo);


--
-- TOC entry 4870 (class 1259 OID 19462)
-- Name: idx_fin_plano_pai; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_plano_pai ON public.fin_plano_contas USING btree (id_pai);


--
-- TOC entry 4871 (class 1259 OID 19463)
-- Name: idx_fin_plano_tipo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_plano_tipo ON public.fin_plano_contas USING btree (tipo);


--
-- TOC entry 4857 (class 1259 OID 19464)
-- Name: idx_fin_pp_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pp_conta ON public.fin_parcelas_pagar USING btree (id_conta_pagar);


--
-- TOC entry 4858 (class 1259 OID 19465)
-- Name: idx_fin_pp_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pp_status ON public.fin_parcelas_pagar USING btree (status);


--
-- TOC entry 4859 (class 1259 OID 19466)
-- Name: idx_fin_pp_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pp_vencimento ON public.fin_parcelas_pagar USING btree (data_vencimento);


--
-- TOC entry 4862 (class 1259 OID 19467)
-- Name: idx_fin_pr_conta; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pr_conta ON public.fin_parcelas_receber USING btree (id_conta_receber);


--
-- TOC entry 4863 (class 1259 OID 19468)
-- Name: idx_fin_pr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pr_status ON public.fin_parcelas_receber USING btree (status);


--
-- TOC entry 4864 (class 1259 OID 19469)
-- Name: idx_fin_pr_vencimento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_pr_vencimento ON public.fin_parcelas_receber USING btree (data_vencimento);


--
-- TOC entry 4876 (class 1259 OID 19470)
-- Name: idx_fornecedores_cgc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_cgc ON public.fornecedores USING btree (for_cgc);


--
-- TOC entry 4877 (class 1259 OID 19471)
-- Name: idx_fornecedores_cidade; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_cidade ON public.fornecedores USING btree (for_cidade);


--
-- TOC entry 4878 (class 1259 OID 19472)
-- Name: idx_fornecedores_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_codigo ON public.fornecedores USING btree (for_codigo);


--
-- TOC entry 4879 (class 1259 OID 19473)
-- Name: idx_fornecedores_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_nome ON public.fornecedores USING btree (for_nome);


--
-- TOC entry 5359 (class 0 OID 0)
-- Dependencies: 4879
-- Name: INDEX idx_fornecedores_nome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_fornecedores_nome IS 'Otimiza ordenação por nome de fornecedor';


--
-- TOC entry 4880 (class 1259 OID 19474)
-- Name: idx_fornecedores_nomered; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_nomered ON public.fornecedores USING btree (for_nomered);


--
-- TOC entry 4881 (class 1259 OID 19475)
-- Name: idx_fornecedores_tipo2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fornecedores_tipo2 ON public.fornecedores USING btree (for_tipo2);


--
-- TOC entry 4884 (class 1259 OID 19476)
-- Name: idx_grupos_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_grupos_codigo ON public.grupos USING btree (gru_codigo);


--
-- TOC entry 4885 (class 1259 OID 19477)
-- Name: idx_ind_metas_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ind_metas_ano ON public.ind_metas USING btree (met_ano);


--
-- TOC entry 5360 (class 0 OID 0)
-- Dependencies: 4885
-- Name: INDEX idx_ind_metas_ano; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_ind_metas_ano IS 'Otimiza filtros apenas por ano';


--
-- TOC entry 4886 (class 1259 OID 19478)
-- Name: idx_ind_metas_ano_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ind_metas_ano_industria ON public.ind_metas USING btree (met_ano, met_industria);


--
-- TOC entry 5361 (class 0 OID 0)
-- Dependencies: 4886
-- Name: INDEX idx_ind_metas_ano_industria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_ind_metas_ano_industria IS 'Otimiza lookup de metas por ano e indústria';


--
-- TOC entry 4893 (class 1259 OID 19482)
-- Name: idx_itens_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_industria ON public.itens_ped USING btree (ite_industria);


--
-- TOC entry 4894 (class 1259 OID 19483)
-- Name: idx_itens_ped_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_ped_industria ON public.itens_ped USING btree (ite_industria);


--
-- TOC entry 4895 (class 1259 OID 19484)
-- Name: idx_itens_ped_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_ped_pedido ON public.itens_ped USING btree (ite_pedido);


--
-- TOC entry 4896 (class 1259 OID 19485)
-- Name: idx_itens_ped_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_ped_produto ON public.itens_ped USING btree (ite_produto);


--
-- TOC entry 4897 (class 1259 OID 19486)
-- Name: idx_itens_pedido; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_pedido ON public.itens_ped USING btree (ite_pedido);


--
-- TOC entry 4898 (class 1259 OID 19487)
-- Name: idx_itens_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_itens_produto ON public.itens_ped USING btree (ite_idproduto);


--
-- TOC entry 4905 (class 1259 OID 19488)
-- Name: idx_parametros_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parametros_usuario ON public.parametros USING btree (par_usuario);


--
-- TOC entry 4908 (class 1259 OID 19489)
-- Name: idx_pedidos_analytics; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_analytics ON public.pedidos USING btree (ped_industria, ped_situacao, ped_data) INCLUDE (ped_totliq, ped_pedido);


--
-- TOC entry 5362 (class 0 OID 0)
-- Dependencies: 4908
-- Name: INDEX idx_pedidos_analytics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_pedidos_analytics IS 'Índice composto otimizado para analytics de metas - PRINCIPAL';


--
-- TOC entry 4909 (class 1259 OID 19490)
-- Name: idx_pedidos_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_cliente ON public.pedidos USING btree (ped_cliente);


--
-- TOC entry 4910 (class 1259 OID 19491)
-- Name: idx_pedidos_cliente_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_cliente_data ON public.pedidos USING btree (ped_cliente, ped_data DESC);


--
-- TOC entry 4911 (class 1259 OID 19492)
-- Name: idx_pedidos_cliente_vendedor_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_cliente_vendedor_data ON public.pedidos USING btree (ped_cliente, ped_vendedor, ped_data DESC) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4912 (class 1259 OID 19493)
-- Name: idx_pedidos_composto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_composto ON public.pedidos USING btree (ped_industria, ped_data, ped_situacao);


--
-- TOC entry 4913 (class 1259 OID 19494)
-- Name: idx_pedidos_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data ON public.pedidos USING btree (ped_data);


--
-- TOC entry 4914 (class 1259 OID 19495)
-- Name: idx_pedidos_data_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data_cliente ON public.pedidos USING btree (ped_data, ped_cliente);


--
-- TOC entry 4915 (class 1259 OID 19496)
-- Name: idx_pedidos_data_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data_situacao ON public.pedidos USING btree (ped_data, ped_situacao);


--
-- TOC entry 4916 (class 1259 OID 19497)
-- Name: idx_pedidos_data_vendedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data_vendedor ON public.pedidos USING btree (ped_data DESC, ped_vendedor) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4917 (class 1259 OID 19498)
-- Name: idx_pedidos_data_year_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_data_year_month ON public.pedidos USING btree (EXTRACT(year FROM ped_data), EXTRACT(month FROM ped_data), ped_data);


--
-- TOC entry 5363 (class 0 OID 0)
-- Dependencies: 4917
-- Name: INDEX idx_pedidos_data_year_month; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_pedidos_data_year_month IS 'Otimiza queries que filtram por ano e mês nas funções de metas';


--
-- TOC entry 4918 (class 1259 OID 19499)
-- Name: idx_pedidos_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_industria ON public.pedidos USING btree (ped_industria);


--
-- TOC entry 5364 (class 0 OID 0)
-- Dependencies: 4918
-- Name: INDEX idx_pedidos_industria; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_pedidos_industria IS 'Otimiza JOINs e filtros por indústria';


--
-- TOC entry 4919 (class 1259 OID 19500)
-- Name: idx_pedidos_industria_situacao_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_industria_situacao_data ON public.pedidos USING btree (ped_industria, ped_situacao, ped_data DESC);


--
-- TOC entry 4920 (class 1259 OID 19501)
-- Name: idx_pedidos_situacao; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_situacao ON public.pedidos USING btree (ped_situacao);


--
-- TOC entry 5365 (class 0 OID 0)
-- Dependencies: 4920
-- Name: INDEX idx_pedidos_situacao; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_pedidos_situacao IS 'Otimiza filtros por situação do pedido (P/F)';


--
-- TOC entry 4921 (class 1259 OID 19502)
-- Name: idx_pedidos_vendedor_situacao_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_vendedor_situacao_data ON public.pedidos USING btree (ped_vendedor, ped_situacao, ped_data) INCLUDE (ped_totliq, ped_pedido, ped_cliente) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4922 (class 1259 OID 19503)
-- Name: idx_pedidos_vendedor_situacao_data_covering; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_vendedor_situacao_data_covering ON public.pedidos USING btree (ped_vendedor, ped_situacao, ped_data) INCLUDE (ped_totliq, ped_pedido, ped_cliente, ped_industria) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4923 (class 1259 OID 19504)
-- Name: idx_pedidos_week; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_week ON public.pedidos USING btree (EXTRACT(week FROM ped_data), ped_data);


--
-- TOC entry 5366 (class 0 OID 0)
-- Dependencies: 4923
-- Name: INDEX idx_pedidos_week; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON INDEX public.idx_pedidos_week IS 'Otimiza análise semanal (função 6)';


--
-- TOC entry 4924 (class 1259 OID 19505)
-- Name: idx_pedidos_year_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_year_month ON public.pedidos USING btree (EXTRACT(year FROM ped_data), EXTRACT(month FROM ped_data), ped_vendedor) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4925 (class 1259 OID 19506)
-- Name: idx_pedidos_year_month_vendedor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pedidos_year_month_vendedor ON public.pedidos USING btree (EXTRACT(year FROM ped_data), EXTRACT(month FROM ped_data), ped_vendedor) WHERE ((ped_situacao)::text = ANY (ARRAY[('P'::character varying)::text, ('F'::character varying)::text]));


--
-- TOC entry 4754 (class 1259 OID 19507)
-- Name: idx_prod_codigo_normalizado; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_codigo_normalizado ON public.cad_prod USING btree (pro_codigonormalizado);


--
-- TOC entry 4755 (class 1259 OID 19508)
-- Name: idx_prod_codprod; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_codprod ON public.cad_prod USING btree (pro_codprod);


--
-- TOC entry 4756 (class 1259 OID 19509)
-- Name: idx_prod_industria_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_industria_codigo ON public.cad_prod USING btree (pro_industria, pro_codprod);


--
-- TOC entry 4757 (class 1259 OID 19510)
-- Name: idx_prod_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_prod_status ON public.cad_prod USING btree (pro_status);


--
-- TOC entry 4758 (class 1259 OID 19511)
-- Name: idx_produtos_industria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_produtos_industria ON public.cad_prod USING btree (pro_industria);


--
-- TOC entry 4762 (class 1259 OID 19512)
-- Name: idx_tabelaspre_grupodesc; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_grupodesc ON public.cad_tabelaspre USING btree (itab_grupodesconto) WHERE (itab_grupodesconto IS NOT NULL);


--
-- TOC entry 4763 (class 1259 OID 19513)
-- Name: idx_tabelaspre_idindustria_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_idindustria_tabela ON public.cad_tabelaspre USING btree (itab_idindustria, itab_tabela);


--
-- TOC entry 4764 (class 1259 OID 19514)
-- Name: idx_tabelaspre_idprod; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_idprod ON public.cad_tabelaspre USING btree (itab_idprod);


--
-- TOC entry 4765 (class 1259 OID 19515)
-- Name: idx_tabelaspre_industria_tabela; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_industria_tabela ON public.cad_tabelaspre USING btree (itab_idindustria, itab_tabela);


--
-- TOC entry 4766 (class 1259 OID 19516)
-- Name: idx_tabelaspre_produto; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_produto ON public.cad_tabelaspre USING btree (itab_idprod);


--
-- TOC entry 4767 (class 1259 OID 19517)
-- Name: idx_tabelaspre_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tabelaspre_status ON public.cad_tabelaspre USING btree (itab_status);


--
-- TOC entry 4937 (class 1259 OID 19518)
-- Name: idx_trans_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trans_nome ON public.transportadora USING btree (tra_nome);


--
-- TOC entry 4942 (class 1259 OID 19519)
-- Name: idx_user_nomes_grupo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_nomes_grupo ON public.user_nomes USING btree (grupo);


--
-- TOC entry 4943 (class 1259 OID 19520)
-- Name: idx_user_nomes_usuario; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_nomes_usuario ON public.user_nomes USING btree (usuario);


--
-- TOC entry 4946 (class 1259 OID 19521)
-- Name: idx_vend_metas_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vend_metas_ano ON public.vend_metas USING btree (met_ano);


--
-- TOC entry 4947 (class 1259 OID 19522)
-- Name: idx_vend_metas_vendedor_ano; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vend_metas_vendedor_ano ON public.vend_metas USING btree (met_vendedor, met_ano);


--
-- TOC entry 4953 (class 1259 OID 19523)
-- Name: idx_vendedores_codigo; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendedores_codigo ON public.vendedores USING btree (ven_codigo);


--
-- TOC entry 4954 (class 1259 OID 19524)
-- Name: idx_vendedores_cpf; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendedores_cpf ON public.vendedores USING btree (ven_cpf);


--
-- TOC entry 4955 (class 1259 OID 19525)
-- Name: idx_vendedores_nome; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vendedores_nome ON public.vendedores USING btree (ven_nome);


--
-- TOC entry 4956 (class 1259 OID 19526)
-- Name: idx_vendedores_pk; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_vendedores_pk ON public.vendedores USING btree (ven_codigo);


--
-- TOC entry 5029 (class 1259 OID 24843)
-- Name: idx_vis_cliente; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vis_cliente ON public.registro_visitas USING btree (vis_cliente_id);


--
-- TOC entry 5030 (class 1259 OID 24845)
-- Name: idx_vis_data; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vis_data ON public.registro_visitas USING btree (vis_datahora);


--
-- TOC entry 5031 (class 1259 OID 24844)
-- Name: idx_vis_promotor; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vis_promotor ON public.registro_visitas USING btree (vis_promotor_id);


--
-- TOC entry 4889 (class 1259 OID 19527)
-- Name: indclientes_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX indclientes_idx1 ON public.indclientes USING btree (cli_id);


--
-- TOC entry 4890 (class 1259 OID 19528)
-- Name: indclientes_idx2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX indclientes_idx2 ON public.indclientes USING btree (gid);


--
-- TOC entry 4899 (class 1259 OID 19529)
-- Name: itens_ped_idx2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX itens_ped_idx2 ON public.itens_ped USING btree (ite_industria);


--
-- TOC entry 4900 (class 1259 OID 19530)
-- Name: itens_ped_idx3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX itens_ped_idx3 ON public.itens_ped USING btree (ite_idproduto);


--
-- TOC entry 4901 (class 1259 OID 19531)
-- Name: itens_ped_idx4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX itens_ped_idx4 ON public.itens_ped USING btree (ite_pedido);


--
-- TOC entry 4902 (class 1259 OID 19532)
-- Name: itens_ped_idx5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX itens_ped_idx5 ON public.itens_ped USING btree (gid);


--
-- TOC entry 4926 (class 1259 OID 19533)
-- Name: pedidos_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx1 ON public.pedidos USING btree (ped_pedido);


--
-- TOC entry 4927 (class 1259 OID 19534)
-- Name: pedidos_idx2; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx2 ON public.pedidos USING btree (ped_industria);


--
-- TOC entry 4928 (class 1259 OID 19535)
-- Name: pedidos_idx3; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx3 ON public.pedidos USING btree (ped_cliente);


--
-- TOC entry 4929 (class 1259 OID 19536)
-- Name: pedidos_idx4; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx4 ON public.pedidos USING btree (ped_data);


--
-- TOC entry 4930 (class 1259 OID 19537)
-- Name: pedidos_idx5; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx5 ON public.pedidos USING btree (gid);


--
-- TOC entry 4931 (class 1259 OID 19538)
-- Name: pedidos_idx6; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx6 ON public.pedidos USING btree (ped_data DESC);


--
-- TOC entry 4932 (class 1259 OID 19539)
-- Name: pedidos_idx7; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX pedidos_idx7 ON public.pedidos USING btree (ped_numero DESC);


--
-- TOC entry 4759 (class 1259 OID 19540)
-- Name: uk_prod_industria_normalizado; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX uk_prod_industria_normalizado ON public.cad_prod USING btree (pro_industria, pro_codigonormalizado) WHERE (pro_codigonormalizado IS NOT NULL);


--
-- TOC entry 4952 (class 1259 OID 19542)
-- Name: vendedor_ind_idx1; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX vendedor_ind_idx1 ON public.vendedor_ind USING btree (gid);


--
-- TOC entry 5068 (class 2620 OID 19543)
-- Name: cad_prod trg_cad_prod_normalizar; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_cad_prod_normalizar BEFORE INSERT OR UPDATE OF pro_codprod ON public.cad_prod FOR EACH ROW EXECUTE FUNCTION public.trg_normalizar_codigo_produto();


--
-- TOC entry 5069 (class 2620 OID 19544)
-- Name: fin_centro_custo trg_fin_centro_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_centro_atualizado BEFORE UPDATE ON public.fin_centro_custo FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5070 (class 2620 OID 19545)
-- Name: fin_clientes trg_fin_clientes_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_clientes_atualizado BEFORE UPDATE ON public.fin_clientes FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5071 (class 2620 OID 19546)
-- Name: fin_contas_pagar trg_fin_cp_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_cp_atualizado BEFORE UPDATE ON public.fin_contas_pagar FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5072 (class 2620 OID 19547)
-- Name: fin_contas_receber trg_fin_cr_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_cr_atualizado BEFORE UPDATE ON public.fin_contas_receber FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5073 (class 2620 OID 19548)
-- Name: fin_fornecedores trg_fin_fornecedores_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_fornecedores_atualizado BEFORE UPDATE ON public.fin_fornecedores FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5074 (class 2620 OID 19549)
-- Name: fin_plano_contas trg_fin_plano_atualizado; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_fin_plano_atualizado BEFORE UPDATE ON public.fin_plano_contas FOR EACH ROW EXECUTE FUNCTION public.atualizar_timestamp();


--
-- TOC entry 5077 (class 2620 OID 24367)
-- Name: chat_mensagens trg_update_last_message; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_last_message AFTER INSERT ON public.chat_mensagens FOR EACH ROW EXECUTE FUNCTION public.update_conversa_last_message();


--
-- TOC entry 5076 (class 2620 OID 23293)
-- Name: agenda trigger_agenda_updated; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_agenda_updated BEFORE UPDATE ON public.agenda FOR EACH ROW EXECUTE FUNCTION public.update_agenda_timestamp();


--
-- TOC entry 5075 (class 2620 OID 19550)
-- Name: parametros trigger_parametros_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_parametros_updated_at BEFORE UPDATE ON public.parametros FOR EACH ROW EXECUTE FUNCTION public.update_parametros_timestamp();


--
-- TOC entry 5063 (class 2606 OID 23082)
-- Name: agenda_historico agenda_historico_agenda_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda_historico
    ADD CONSTRAINT agenda_historico_agenda_id_fkey FOREIGN KEY (agenda_id) REFERENCES public.agenda(id) ON DELETE CASCADE;


--
-- TOC entry 5062 (class 2606 OID 23063)
-- Name: agenda agenda_tarefa_pai_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.agenda
    ADD CONSTRAINT agenda_tarefa_pai_id_fkey FOREIGN KEY (tarefa_pai_id) REFERENCES public.agenda(id) ON DELETE SET NULL;


--
-- TOC entry 5067 (class 2606 OID 23259)
-- Name: chat_leituras chat_leituras_mensagem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_leituras
    ADD CONSTRAINT chat_leituras_mensagem_id_fkey FOREIGN KEY (mensagem_id) REFERENCES public.chat_mensagens(id) ON DELETE CASCADE;


--
-- TOC entry 5065 (class 2606 OID 23239)
-- Name: chat_mensagens chat_mensagens_conversa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_mensagens
    ADD CONSTRAINT chat_mensagens_conversa_id_fkey FOREIGN KEY (conversa_id) REFERENCES public.chat_conversas(id) ON DELETE CASCADE;


--
-- TOC entry 5066 (class 2606 OID 23244)
-- Name: chat_mensagens chat_mensagens_reply_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_mensagens
    ADD CONSTRAINT chat_mensagens_reply_to_id_fkey FOREIGN KEY (reply_to_id) REFERENCES public.chat_mensagens(id);


--
-- TOC entry 5064 (class 2606 OID 23220)
-- Name: chat_participantes chat_participantes_conversa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_participantes
    ADD CONSTRAINT chat_participantes_conversa_id_fkey FOREIGN KEY (conversa_id) REFERENCES public.chat_conversas(id) ON DELETE CASCADE;


--
-- TOC entry 5034 (class 2606 OID 19551)
-- Name: cidades_regioes cidades_regioes_cid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades_regioes
    ADD CONSTRAINT cidades_regioes_cid_id_fkey FOREIGN KEY (cid_id) REFERENCES public.cidades(cid_codigo) ON DELETE CASCADE;


--
-- TOC entry 5035 (class 2606 OID 19556)
-- Name: cidades_regioes cidades_regioes_reg_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cidades_regioes
    ADD CONSTRAINT cidades_regioes_reg_id_fkey FOREIGN KEY (reg_id) REFERENCES public.regioes(reg_codigo) ON DELETE CASCADE;


--
-- TOC entry 5037 (class 2606 OID 19561)
-- Name: cli_ind cli_ind_cli_grupodesc_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_ind
    ADD CONSTRAINT cli_ind_cli_grupodesc_fkey FOREIGN KEY (cli_grupodesc) REFERENCES public.grupo_desc(gde_id);


--
-- TOC entry 5054 (class 2606 OID 19842)
-- Name: crm_interacao crm_interacao_canal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao
    ADD CONSTRAINT crm_interacao_canal_id_fkey FOREIGN KEY (canal_id) REFERENCES public.crm_canal(id);


--
-- TOC entry 5058 (class 2606 OID 19862)
-- Name: crm_interacao_industria crm_interacao_industria_interacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao_industria
    ADD CONSTRAINT crm_interacao_industria_interacao_id_fkey FOREIGN KEY (interacao_id) REFERENCES public.crm_interacao(id);


--
-- TOC entry 5055 (class 2606 OID 19852)
-- Name: crm_interacao crm_interacao_oportunidade_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao
    ADD CONSTRAINT crm_interacao_oportunidade_id_fkey FOREIGN KEY (oportunidade_id) REFERENCES public.crm_oportunidades(oportunidade_id);


--
-- TOC entry 5056 (class 2606 OID 19847)
-- Name: crm_interacao crm_interacao_resultado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao
    ADD CONSTRAINT crm_interacao_resultado_id_fkey FOREIGN KEY (resultado_id) REFERENCES public.crm_resultado(id);


--
-- TOC entry 5057 (class 2606 OID 19837)
-- Name: crm_interacao crm_interacao_tipo_interacao_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_interacao
    ADD CONSTRAINT crm_interacao_tipo_interacao_id_fkey FOREIGN KEY (tipo_interacao_id) REFERENCES public.crm_tipo_interacao(id);


--
-- TOC entry 5053 (class 2606 OID 19795)
-- Name: crm_oportunidades crm_oportunidades_etapa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crm_oportunidades
    ADD CONSTRAINT crm_oportunidades_etapa_id_fkey FOREIGN KEY (etapa_id) REFERENCES public.crm_funil_etapas(etapa_id);


--
-- TOC entry 5038 (class 2606 OID 19581)
-- Name: fin_contas_pagar fin_contas_pagar_id_centro_custo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_pagar
    ADD CONSTRAINT fin_contas_pagar_id_centro_custo_fkey FOREIGN KEY (id_centro_custo) REFERENCES public.fin_centro_custo(id);


--
-- TOC entry 5039 (class 2606 OID 19586)
-- Name: fin_contas_pagar fin_contas_pagar_id_fornecedor_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_pagar
    ADD CONSTRAINT fin_contas_pagar_id_fornecedor_fkey FOREIGN KEY (id_fornecedor) REFERENCES public.fin_fornecedores(id);


--
-- TOC entry 5040 (class 2606 OID 19591)
-- Name: fin_contas_pagar fin_contas_pagar_id_plano_contas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_pagar
    ADD CONSTRAINT fin_contas_pagar_id_plano_contas_fkey FOREIGN KEY (id_plano_contas) REFERENCES public.fin_plano_contas(id);


--
-- TOC entry 5041 (class 2606 OID 19596)
-- Name: fin_contas_receber fin_contas_receber_id_centro_custo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_receber
    ADD CONSTRAINT fin_contas_receber_id_centro_custo_fkey FOREIGN KEY (id_centro_custo) REFERENCES public.fin_centro_custo(id);


--
-- TOC entry 5042 (class 2606 OID 19601)
-- Name: fin_contas_receber fin_contas_receber_id_cliente_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_receber
    ADD CONSTRAINT fin_contas_receber_id_cliente_fkey FOREIGN KEY (id_cliente) REFERENCES public.fin_clientes(id);


--
-- TOC entry 5043 (class 2606 OID 19606)
-- Name: fin_contas_receber fin_contas_receber_id_plano_contas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_contas_receber
    ADD CONSTRAINT fin_contas_receber_id_plano_contas_fkey FOREIGN KEY (id_plano_contas) REFERENCES public.fin_plano_contas(id);


--
-- TOC entry 5044 (class 2606 OID 19611)
-- Name: fin_movimentacoes fin_movimentacoes_id_centro_custo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes
    ADD CONSTRAINT fin_movimentacoes_id_centro_custo_fkey FOREIGN KEY (id_centro_custo) REFERENCES public.fin_centro_custo(id);


--
-- TOC entry 5045 (class 2606 OID 19616)
-- Name: fin_movimentacoes fin_movimentacoes_id_conta_pagar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes
    ADD CONSTRAINT fin_movimentacoes_id_conta_pagar_fkey FOREIGN KEY (id_conta_pagar) REFERENCES public.fin_contas_pagar(id);


--
-- TOC entry 5046 (class 2606 OID 19621)
-- Name: fin_movimentacoes fin_movimentacoes_id_conta_receber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes
    ADD CONSTRAINT fin_movimentacoes_id_conta_receber_fkey FOREIGN KEY (id_conta_receber) REFERENCES public.fin_contas_receber(id);


--
-- TOC entry 5047 (class 2606 OID 19626)
-- Name: fin_movimentacoes fin_movimentacoes_id_plano_contas_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_movimentacoes
    ADD CONSTRAINT fin_movimentacoes_id_plano_contas_fkey FOREIGN KEY (id_plano_contas) REFERENCES public.fin_plano_contas(id);


--
-- TOC entry 5048 (class 2606 OID 19631)
-- Name: fin_parcelas_pagar fin_parcelas_pagar_id_conta_pagar_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_pagar
    ADD CONSTRAINT fin_parcelas_pagar_id_conta_pagar_fkey FOREIGN KEY (id_conta_pagar) REFERENCES public.fin_contas_pagar(id) ON DELETE CASCADE;


--
-- TOC entry 5049 (class 2606 OID 19636)
-- Name: fin_parcelas_receber fin_parcelas_receber_id_conta_receber_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_parcelas_receber
    ADD CONSTRAINT fin_parcelas_receber_id_conta_receber_fkey FOREIGN KEY (id_conta_receber) REFERENCES public.fin_contas_receber(id) ON DELETE CASCADE;


--
-- TOC entry 5050 (class 2606 OID 19641)
-- Name: fin_plano_contas fin_plano_contas_id_pai_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fin_plano_contas
    ADD CONSTRAINT fin_plano_contas_id_pai_fkey FOREIGN KEY (id_pai) REFERENCES public.fin_plano_contas(id);


--
-- TOC entry 5036 (class 2606 OID 19646)
-- Name: cli_aniv fk_cliente; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cli_aniv
    ADD CONSTRAINT fk_cliente FOREIGN KEY (ani_cliente) REFERENCES public.clientes(cli_codigo);


--
-- TOC entry 5051 (class 2606 OID 19651)
-- Name: vend_metas fk_industria; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vend_metas
    ADD CONSTRAINT fk_industria FOREIGN KEY (met_industria) REFERENCES public.fornecedores(for_codigo);


--
-- TOC entry 5052 (class 2606 OID 19666)
-- Name: vend_metas fk_vendedor; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vend_metas
    ADD CONSTRAINT fk_vendedor FOREIGN KEY (met_vendedor) REFERENCES public.vendedores(ven_codigo);


--
-- TOC entry 5060 (class 2606 OID 23016)
-- Name: log_tentativas_excedentes log_tentativas_excedentes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.log_tentativas_excedentes
    ADD CONSTRAINT log_tentativas_excedentes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- TOC entry 5059 (class 2606 OID 23001)
-- Name: sessoes_ativas sessoes_ativas_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessoes_ativas
    ADD CONSTRAINT sessoes_ativas_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


--
-- TOC entry 5061 (class 2606 OID 23035)
-- Name: usuarios usuarios_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;


-- Completed on 2026-01-16 16:55:13

--
-- PostgreSQL database dump complete
--

\unrestrict tm7SPGryh9BaI3OhPzUdLeE10mPxHyVdN8G5X2iwmI61kAAKDclLMNZbzLoBShG

