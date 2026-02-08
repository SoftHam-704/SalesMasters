# bi-engine/create_bi_intelligence_functions.py
"""
Script para criar as functions de BI Intelligence no PostgreSQL.
Executa o arquivo SQL com as 9 functions avançadas.
"""

import psycopg2
from config import DATABASE_URL
import re

def get_connection():
    """Cria conexão com o banco usando a URL do config"""
    # Parse DATABASE_URL
    pattern = r'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)'
    match = re.match(pattern, DATABASE_URL)
    
    if match:
        user, password, host, port, dbname = match.groups()
        return psycopg2.connect(
            host=host,
            port=port,
            database=dbname,
            user=user,
            password=password
        )
    else:
        raise ValueError(f"Invalid DATABASE_URL format: {DATABASE_URL}")

def create_functions():
    """Cria as functions de BI Intelligence"""
    
    functions_sql = """
    -- ==========================================
    -- 0. DROPS (Para evitar ambiguidades e deletar versões obsoletas)
    -- ==========================================
    DO $$
    DECLARE
        r RECORD;
    BEGIN
        FOR r IN (
            SELECT p.proname, oidvectortypes(p.proargtypes) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = current_schema()
              AND p.proname IN (
                'fn_curva_abc', 'fn_churn_preditivo', 'fn_correlacao_produtos',
                'fn_oportunidades_perdidas', 'fn_anomalias_ticket', 'fn_eficiencia_comercial',
                'fn_comparativo_clientes', 'fn_sazonalidade', 'fn_resumo_executivo'
              )
        ) 
        LOOP
            EXECUTE 'DROP FUNCTION IF EXISTS ' || r.proname || '(' || r.args || ') CASCADE';
        END LOOP;
    END $$;

    -- ==========================================
    -- 1. FUNÇÃO: CURVA ABC
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_curva_abc(
        p_ano INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
        p_meses TEXT DEFAULT 'todos',
        p_industria TEXT DEFAULT 'todos',
        p_clientes TEXT DEFAULT 'todos',
        p_metrica TEXT DEFAULT 'valor'
    )
    RETURNS TABLE (
        produto_id INTEGER,
        produto_nome VARCHAR,
        total NUMERIC,
        qtd_clientes INTEGER,
        percentual NUMERIC,
        percentual_acum NUMERIC,
        curva CHAR(1),
        ranking INTEGER
    ) AS $$
    BEGIN
        RETURN QUERY
        WITH produto_totais AS (
            SELECT 
                i.ite_idproduto as ite_produto,
                pr.pro_nome,
                CASE 
                    WHEN p_metrica = 'quantidade' THEN SUM(i.ite_quant)
                    WHEN p_metrica = 'unidades' THEN COUNT(DISTINCT i.ite_pedido)
                    ELSE SUM(i.ite_totliquido)
                END as total_calc,
                COUNT(DISTINCT p.ped_cliente) as clientes
            FROM itens_ped i
            INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
            INNER JOIN cad_prod pr ON i.ite_idproduto = pr.pro_id
            WHERE EXTRACT(YEAR FROM p.ped_data) = p_ano
              AND (p_meses = 'todos' OR EXTRACT(MONTH FROM p.ped_data)::TEXT = ANY(string_to_array(p_meses, ',')))
              AND (p_industria = 'todos' OR p.ped_industria::TEXT = p_industria)
              AND (p_clientes = 'todos' OR p.ped_cliente::TEXT = ANY(string_to_array(p_clientes, ',')))
            GROUP BY i.ite_idproduto, pr.pro_nome
        ),
        produto_acumulado AS (
            SELECT 
                ite_produto,
                pro_nome,
                total_calc,
                clientes,
                SUM(total_calc) OVER () as total_geral,
                SUM(total_calc) OVER (ORDER BY total_calc DESC) as acumulado,
                ROW_NUMBER() OVER (ORDER BY total_calc DESC) as rank_num
            FROM produto_totais
        )
        SELECT 
            ite_produto::INTEGER,
            pro_nome::VARCHAR,
            ROUND(total_calc::NUMERIC, 2),
            clientes::INTEGER,
            ROUND((total_calc / total_geral * 100)::NUMERIC, 2),
            ROUND((acumulado / total_geral * 100)::NUMERIC, 2),
            CASE 
                WHEN acumulado / total_geral <= 0.80 THEN 'A'
                WHEN acumulado / total_geral <= 0.95 THEN 'B'
                ELSE 'C'
            END::CHAR(1),
            rank_num::INTEGER
        FROM produto_acumulado
        ORDER BY total_calc DESC;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_curva_abc IS 'Calcula Curva ABC por Valor, Quantidade ou Pedidos com filtros dinâmicos';


    -- ==========================================
    -- 2. FUNÇÃO: CHURN PREDITIVO
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_churn_preditivo()
    RETURNS TABLE (
        cliente_codigo INTEGER,
        cliente_nome VARCHAR,
        dias_inativo INTEGER,
        freq_compra_dias NUMERIC,
        total_pedidos BIGINT,
        ticket_medio NUMERIC,
        valor_total NUMERIC,
        perda_mensal_est NUMERIC,
        nivel_risco VARCHAR
    ) AS $$
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
                WHEN dias_sem_comprar > (frequencia * 2) THEN 'CRÍTICO'
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
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_churn_preditivo IS 'Identifica clientes em risco de churn baseado em frequência de compra';


    -- ==========================================
    -- 3. FUNÇÃO: CORRELAÇÃO DE PRODUTOS
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_correlacao_produtos(
        p_meses_atras INTEGER DEFAULT 6
    )
    RETURNS TABLE (
        produto_a_id INTEGER,
        produto_a_nome VARCHAR,
        produto_b_id INTEGER,
        produto_b_nome VARCHAR,
        vezes_juntos BIGINT,
        taxa_conversao NUMERIC
    ) AS $$
    BEGIN
        RETURN QUERY
        WITH product_pairs AS (
            SELECT 
                i1.ite_idproduto as prod_a,
                i2.ite_idproduto as prod_b,
                COUNT(DISTINCT i1.ite_pedido) as freq
            FROM itens_ped i1
            INNER JOIN itens_ped i2 ON i1.ite_pedido = i2.ite_pedido 
                AND i1.ite_industria = i2.ite_industria
                AND i1.ite_idproduto < i2.ite_idproduto
            INNER JOIN pedidos p ON i1.ite_pedido = p.ped_pedido AND i1.ite_industria = p.ped_industria
            WHERE p.ped_data >= CURRENT_DATE - (p_meses_atras || ' months')::INTERVAL
            GROUP BY i1.ite_idproduto, i2.ite_idproduto
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
                WHERE ite_idproduto = pp.prod_a
            ), 0) * 100), 0)
        FROM product_pairs pp
        INNER JOIN cad_prod p1 ON pp.prod_a = p1.pro_id
        INNER JOIN cad_prod p2 ON pp.prod_b = p2.pro_id
        ORDER BY pp.freq DESC
        LIMIT 10;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_correlacao_produtos IS 'Identifica produtos frequentemente comprados juntos';


    -- ==========================================
    -- 4. FUNÇÃO: OPORTUNIDADES PERDIDAS
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_oportunidades_perdidas()
    RETURNS TABLE (
        cliente_codigo INTEGER,
        cliente_nome VARCHAR,
        produtos_distintos BIGINT,
        total_gasto NUMERIC,
        produtos_top_nao_comprados BIGINT
    ) AS $$
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
                COUNT(DISTINCT i.ite_idproduto) as prods,
                SUM(i.ite_totliquido) as valor
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
            GROUP BY p.ped_cliente
        ),
        top_products AS (
            SELECT ite_idproduto
            FROM itens_ped i
            INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
            WHERE p.ped_data >= CURRENT_DATE - INTERVAL '3 months'
            GROUP BY ite_idproduto
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
                    INNER JOIN pedidos p2 ON i2.ite_pedido = p2.ped_pedido AND i2.ite_industria = p2.ped_industria
                    WHERE p2.ped_cliente = cb.ped_cliente 
                      AND i2.ite_idproduto = tp.ite_idproduto
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
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_oportunidades_perdidas IS 'Clientes ativos que não compram produtos top sellers';


    -- ==========================================
    -- 5. FUNÇÃO: ANOMALIAS DE TICKET MÉDIO
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_anomalias_ticket()
    RETURNS TABLE (
        cliente_codigo INTEGER,
        cliente_nome VARCHAR,
        semana DATE,
        ticket_medio NUMERIC,
        ticket_historico NUMERIC,
        variacao_pct NUMERIC
    ) AS $$
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
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_anomalias_ticket IS 'Detecta variações anormais no ticket médio por cliente';


    -- ==========================================
    -- 6. FUNÇÃO: EFICIÊNCIA COMERCIAL
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_eficiencia_comercial()
    RETURNS TABLE (
        metrica VARCHAR,
        valor_atual NUMERIC,
        valor_anterior NUMERIC,
        variacao_pct NUMERIC
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            'Ticket Médio'::VARCHAR,
            ROUND((SELECT AVG(ped_totliq) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE))::NUMERIC, 2),
            ROUND((SELECT AVG(ped_totliq) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND ped_data < DATE_TRUNC('month', CURRENT_DATE))::NUMERIC, 2),
            0::NUMERIC
        
        UNION ALL
        
        SELECT 
            'Volume de Pedidos'::VARCHAR,
            (SELECT COUNT(*) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE))::NUMERIC,
            (SELECT COUNT(*) FROM pedidos WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND ped_data < DATE_TRUNC('month', CURRENT_DATE))::NUMERIC,
            0::NUMERIC;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_eficiencia_comercial IS 'Métricas de eficiência comercial com comparativos';


    -- ==========================================
    -- 7. FUNÇÃO: COMPARATIVO CLIENTES ANO A ANO
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_comparativo_clientes(
        p_ano_atual INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
    )
    RETURNS TABLE (
        cliente_codigo INTEGER,
        cliente_nome VARCHAR,
        ano_anterior BIGINT,
        ano_atual BIGINT,
        ultima_compra DATE,
        variacao NUMERIC,
        status VARCHAR
    ) AS $$
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
        WHERE COALESCE(cy.pedidos, 0) + COALESCE(py.pedidos, 0) >= 2
        ORDER BY 4 DESC
        LIMIT 50;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_comparativo_clientes IS 'Compara performance de clientes ano atual vs anterior';


    -- ==========================================
    -- 8. FUNÇÃO: SAZONALIDADE MENSAL
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_sazonalidade()
    RETURNS TABLE (
        mes INTEGER,
        nome_mes VARCHAR,
        faturamento_medio NUMERIC,
        volatilidade_pct NUMERIC
    ) AS $$
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
            GROUP BY 1, 2, 3
        ),
        avg_by_month AS (
            SELECT 
                m,
                nm,
                AVG(fat) as media,
                STDDEV(fat) as desvio
            FROM monthly_sales
            GROUP BY 1, 2
        )
        SELECT 
            m::INTEGER,
            TRIM(nm)::VARCHAR,
            ROUND(media::NUMERIC, 2),
            ROUND((desvio / NULLIF(media, 0) * 100)::NUMERIC, 1)
        FROM avg_by_month
        ORDER BY m;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_sazonalidade IS 'Análise de padrões sazonais por mês';


    -- ==========================================
    -- 9. FUNÇÃO: RESUMO EXECUTIVO
    -- ==========================================
    CREATE OR REPLACE FUNCTION fn_resumo_executivo()
    RETURNS TABLE (
        total_clientes_ativos BIGINT,
        total_faturamento NUMERIC,
        ticket_medio NUMERIC,
        total_pedidos BIGINT,
        produtos_ativos BIGINT,
        clientes_em_risco BIGINT
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            (SELECT COUNT(DISTINCT ped_cliente) FROM pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months')::BIGINT,
            (SELECT ROUND(SUM(ped_totliq)::NUMERIC, 2) FROM pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::NUMERIC,
            (SELECT ROUND(AVG(ped_totliq)::NUMERIC, 2) FROM pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::NUMERIC,
            (SELECT COUNT(*) FROM pedidos WHERE ped_data >= CURRENT_DATE - INTERVAL '1 month')::BIGINT,
            (SELECT COUNT(DISTINCT ite_idproduto) FROM itens_ped i INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria WHERE p.ped_data >= CURRENT_DATE - INTERVAL '3 months')::BIGINT,
            (SELECT COUNT(*) FROM fn_churn_preditivo() WHERE nivel_risco IN ('CRÍTICO', 'ALERTA'))::BIGINT;
    END;
    $$ LANGUAGE plpgsql;

    COMMENT ON FUNCTION fn_resumo_executivo IS 'Resumo executivo de KPIs principais';
    """

    indexes_sql = """
    CREATE INDEX IF NOT EXISTS idx_pedidos_data ON pedidos(ped_data);
    CREATE INDEX IF NOT EXISTS idx_pedidos_cliente ON pedidos(ped_cliente);
    CREATE INDEX IF NOT EXISTS idx_pedidos_industria ON pedidos(ped_industria);
    CREATE INDEX IF NOT EXISTS idx_itens_pedido ON itens_ped(ite_pedido);
    CREATE INDEX IF NOT EXISTS idx_itens_idproduto ON itens_ped(ite_idproduto);
    """

    try:
        conn = get_connection()
        cur = conn.cursor()
        
        print("🔄 Criando functions de BI Intelligence...")
        cur.execute(functions_sql)
        conn.commit()
        print("✅ 9 functions criadas com sucesso!")
        
        print("🔄 Criando índices de performance...")
        cur.execute(indexes_sql)
        conn.commit()
        print("✅ Índices criados!")
        
        # Teste rápido
        print("\n🧪 Testando functions...")
        cur.execute("SELECT COUNT(*) FROM fn_curva_abc(2025, 'todos', 'todos', 'todos', 'valor')")
        print(f"   fn_curva_abc: {cur.fetchone()[0]} produtos")
        
        cur.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    create_functions()
