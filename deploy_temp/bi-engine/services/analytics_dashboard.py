from services.database import execute_query
import pandas as pd
from datetime import datetime, timedelta
from functools import lru_cache
import time
from utils.tenant_context import get_tenant_cnpj

# Simple cache for AI and data
CACHE_TTL = 300 # 5 minutes
_cache = {}

def get_cached_result(key, func, *args, **kwargs):
    now = time.time()
    
    # Injetar tenant_id na chave para evitar vazamento entre empresas
    tenant_id = get_tenant_cnpj() or "default"
    full_key = f"{tenant_id}_{key}"
    
    if full_key in _cache:
        timestamp, result = _cache[full_key]
        if now - timestamp < CACHE_TTL:
            return result
    
    result = func(*args, **kwargs)
    _cache[full_key] = (now, result)
    return result

def get_critical_alerts(ano: int, mes: str, industry_id: int = None, startDate: str = None, endDate: str = None):
    """
    Retorna lista de alertas críticos usando views otimizadas:
    1. Clientes sem comprar há +90 dias (via vw_metricas_cliente).
    2. Count de Itens sem venda (via vw_analise_portfolio).
    """
    try:
        where_lost = "dias_sem_compra > 90"
        where_dead = "curva_abc = 'OFF' OR dias_sem_venda > 90"
        params = {}
        
        if industry_id and industry_id != 'Todos':
            where_lost += " AND industry_id = :ind_id"
            where_dead += " AND industry_id = :ind_id"
            params["ind_id"] = industry_id

        # 1. Clientes perdidos (Churn Risk)
        # Se houver range de data, focamos no churn que ocorreu até a data final
        query_lost = f"""
            SELECT 
                cliente_nome as cli_nomred,
                dias_sem_compra,
                valor_total as total_life_value,
                (valor_total / NULLIF(total_pedidos, 0)) * 12 as estimated_annual_loss,
                (CURRENT_DATE - (dias_sem_compra * INTERVAL '1 day')) as ultima_compra
            FROM vw_metricas_cliente
            WHERE {where_lost}
            ORDER BY estimated_annual_loss DESC
            LIMIT 5
        """
        lost_clients_df = execute_query(query_lost, params)
        lost_clients = lost_clients_df.to_dict('records')

        # 2. Dead Stock (Itens OFF na curva ABC)
        try:
            # Handle 'Todos' for dead stock filter
            ind_id_dead = None if industry_id == 'Todos' or not industry_id else industry_id
            
            if startDate and endDate:
                # Se tiver range, recalculamos via função dedicada ou SQL customizado
                # Para simplificar e manter performance, usamos a função de curva com o range
                query_dead = """
                    SELECT 
                        COUNT(*) as total_itens,
                        SUM(valor_total) as opportunity_value
                    FROM (
                        SELECT 
                            i.ite_idproduto,
                            SUM(i.ite_totliquido) as valor_total,
                            SUM(i.ite_totliquido) OVER () as grand_total,
                            SUM(SUM(i.ite_totliquido)) OVER (ORDER BY SUM(i.ite_totliquido) DESC) / NULLIF(SUM(SUM(i.ite_totliquido)) OVER (), 0) as pct_acumulado
                        FROM itens_ped i
                        JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                        WHERE p.ped_data BETWEEN :startDate AND :endDate
                          AND p.ped_situacao IN ('P', 'F')
                          {f"AND p.ped_industria = :ind_id" if ind_id_dead else ""}
                        GROUP BY i.ite_idproduto
                    ) sub
                    WHERE pct_acumulado > 0.95
                """
                dead_params = {"startDate": startDate, "endDate": endDate, "ind_id": ind_id_dead}
            else:
                query_dead = """
                    SELECT 
                        qtd_itens as total_itens,
                        valor_total as opportunity_value
                    FROM fn_analise_curva_abc(:ano, NULL, :industry_id)
                    WHERE curva_abc = 'OFF'
                """
                dead_params = {"ano": ano, "industry_id": ind_id_dead}
                
            dead_stock_df = execute_query(query_dead, dead_params)
            
            dead_count = int(dead_stock_df.iloc[0]['total_itens']) if not dead_stock_df.empty else 0
            opportunity_val = float(dead_stock_df.iloc[0]['opportunity_value'] or 0) if not dead_stock_df.empty else 0
        except Exception as e:
            print(f"Warning: Dead stock query failed: {e}")
            dead_count = 0
            opportunity_val = 0

        return {
            "lost_clients": lost_clients,
            "dead_stock_count": dead_count,
            "dead_stock_value": float(opportunity_val)
        }
    
    except Exception as e:
        print(f"Error getting alerts: {e}")
        import traceback
        traceback.print_exc()
        return {"lost_clients": [], "dead_stock_count": 0, "dead_stock_value": 0}

def get_kpis_metrics(ano: int, mes: str = None, industry_id: int = None):
    """Retorna KPIs usando view otimizada e inclui comparação com período anterior"""
    try:
        mes_map = {
            'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
            'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
        }
        mes_col_map = {
            'Janeiro': 'met_jan', 'Fevereiro': 'met_fev', 'Março': 'met_mar', 'Abril': 'met_abr', 'Maio': 'met_mai', 'Junho': 'met_jun',
            'Julho': 'met_jul', 'Agosto': 'met_ago', 'Setembro': 'met_set', 'Outubro': 'met_out', 'Novembro': 'met_nov', 'Dezembro': 'met_dez'
        }
        mes_num = mes_map.get(mes) if mes and mes != "Todos" else None

        # 1. Fetch Dynamic Meta (Target)
        meta_sql = ""
        meta_params = {"ano": ano}
        
        # Determine which columns to sum
        if mes and mes != "Todos":
            col_name = mes_col_map.get(mes, 'met_jan')
            meta_select = f"SUM({col_name})"
        else:
            # Sum all months if "Todos"
            meta_select = "SUM(met_jan + met_fev + met_mar + met_abr + met_mai + met_jun + met_jul + met_ago + met_set + met_out + met_nov + met_dez)"

        meta_where = "met_ano = :ano"
        if industry_id and industry_id != 'Todos':
            meta_where += " AND met_industria = :ind_id"
            meta_params["ind_id"] = industry_id
            
        meta_query = f"SELECT {meta_select} as meta_total FROM ind_metas WHERE {meta_where}"
        meta_df = execute_query(meta_query, meta_params)
        meta_val = float(meta_df.iloc[0]['meta_total']) if not meta_df.empty and meta_df.iloc[0]['meta_total'] is not None else 0

        def fetch_period(target_ano, target_mes):
            where = f"ano = :target_ano"
            params = {"target_ano": target_ano}
            if target_mes:
                where += f" AND mes = :target_mes"
                params["target_mes"] = target_mes
            
            if industry_id and industry_id != 'Todos':
                where += " AND industry_id = :ind_id"
                params["ind_id"] = industry_id
            
            query = f"""
                SELECT 
                    SUM(valor_total) as valor_total,
                    SUM(qtd_pedidos) as qtd_pedidos,
                    SUM(clientes_ativos) as clientes_ativos,
                    CASE WHEN SUM(qtd_pedidos) > 0 
                         THEN SUM(valor_total) / SUM(qtd_pedidos) 
                         ELSE 0 END as ticket_medio
                FROM vw_performance_mensal
                WHERE {where}
            """
            df = execute_query(query, params)
            if df.empty or df.iloc[0]['valor_total'] is None:
                return {"valor_total": 0, "qtd_pedidos": 0, "ticket_medio": 0, "clientes_ativos": 0}
            row = df.iloc[0]
            return {
                "valor_total": float(row['valor_total'] or 0),
                "qtd_pedidos": int(row['qtd_pedidos'] or 0),
                "clientes_ativos": int(row['clientes_ativos'] or 0),
                "ticket_medio": float(row['ticket_medio'] or 0)
            }

        # Período Atual
        current = fetch_period(ano, mes_num)

        # Período Anterior (Para comparação)
        if mes_num:
            if mes_num == 1:
                prev_ano, prev_mes = ano - 1, 12
            else:
                prev_ano, prev_mes = ano, mes_num - 1
        else:
            prev_ano, prev_mes = ano - 1, None
        
        previous = fetch_period(prev_ano, prev_mes)

        # Calcular Variações
        def calc_var(curr, prev):
            if not prev: return 0
            return ((curr - prev) / prev * 100) if prev > 0 else 0

        # Insert Dynamic Targets
        current["meta_valor_total"] = meta_val
        # Rule: Target Orders = Previous Period + 15%
        current["meta_qtd_pedidos"] = int(previous["qtd_pedidos"] * 1.15) if previous["qtd_pedidos"] else 0
        # Rule: Target Ticket = Previous Period + 15%
        current["meta_ticket_medio"] = float(previous["ticket_medio"] * 1.15) if previous["ticket_medio"] else 0
        # Rule: Target Active Clients = Previous Period + 15%
        current["meta_clientes_ativos"] = int(previous["clientes_ativos"] * 1.15) if previous["clientes_ativos"] else 0
        
        current["variation"] = {
            "valor": calc_var(current["valor_total"], previous["valor_total"]),
            "pedidos": calc_var(current["qtd_pedidos"], previous["qtd_pedidos"]),
            "ticket": calc_var(current["ticket_medio"], previous["ticket_medio"]),
            "clientes": calc_var(current["clientes_ativos"], previous["clientes_ativos"])
        }

        return current
    except Exception as e:
        print(f"Error in get_kpis_metrics: {e}")
        return {"valor_total": 0, "qtd_pedidos": 0, "ticket_medio": 0, "clientes_ativos": 0}

def get_portfolio_abc(ano: int, mes: str = None, industry_id: int = None, startDate: str = None, endDate: str = None):
    """Retorna dados da curva ABC para gráfico e análise"""
    try:
        ind_id = None if industry_id == 'Todos' or not industry_id else industry_id
        
        if startDate and endDate:
            # For date range, we calculate ABC using raw SQL for that range
            query = f"""
                WITH vendas_produto AS (
                    SELECT 
                        i.ite_idproduto,
                        SUM(i.ite_totliquido) as valor_total,
                        SUM(i.ite_quant) as qtd_itens
                    FROM itens_ped i
                    JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
                    WHERE p.ped_data BETWEEN :startDate AND :endDate
                      AND p.ped_situacao IN ('P', 'F')
                      {f"AND p.ped_industria = :ind_id" if ind_id else ""}
                    GROUP BY i.ite_idproduto
                ),
                total_geral AS (
                    SELECT SUM(valor_total) as grand_total FROM vendas_produto
                ),
                curva_calculo AS (
                    SELECT 
                        v.ite_idproduto,
                        v.valor_total,
                        v.qtd_itens,
                        SUM(v.valor_total) OVER (ORDER BY v.valor_total DESC) / NULLIF(t.grand_total, 0) as pct_acumulado
                    FROM vendas_produto v, total_geral t
                ),
                curva_final AS (
                    SELECT 
                        CASE 
                            WHEN pct_acumulado <= 0.8 THEN 'A'
                            WHEN pct_acumulado <= 0.95 THEN 'B'
                            ELSE 'C'
                        END as curva_abc,
                        valor_total,
                        qtd_itens
                    FROM curva_calculo
                )
                SELECT 
                    curva_abc,
                    COUNT(*) as qtd_itens,
                    SUM(valor_total) as valor_total,
                    (SUM(valor_total) / (SELECT grand_total FROM total_geral) * 100) as perc_valor
                FROM curva_final
                GROUP BY curva_abc
            """
            params = {"startDate": startDate, "endDate": endDate, "ind_id": ind_id}
        else:
            mes_map = {
                'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
                'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
            }
            target_mes = mes_map.get(mes)
            
            # Chama a função do banco que calcula a curva
            query = "SELECT * FROM fn_analise_curva_abc(:ano, :mes, :ind_id)"
            params = {"ano": ano, "mes": target_mes, "ind_id": ind_id}
        
        df = execute_query(query, params)
        
        # Transformar os resultados em uma lista de objetos (Compatibilidade com .reduce() do Frontend)
        results = []
        for _, row in df.iterrows():
            results.append({
                "curva": row['curva_abc'],
                "qtd_itens": int(row['qtd_itens'] or 0),
                "valor_total": float(row['valor_total'] or 0),
                "percent_valor": float(row['perc_valor'] or 0)
            })
            
        return results
    except Exception as e:
        print(f"❌ [ANALYTICS] Erro em get_portfolio_abc: {e}")
        return [] # Garante sempre um array para evitar erro .reduce() no JS

def get_client_comparison(client_ref_id: int, client_target_id: int):
    if not client_ref_id or not client_target_id:
        return None

    # Produtos do Cliente Referência
    query_ref = f"""
        SELECT 
            i.ite_produto as pro_codigo,
            MAX(prod.pro_nome) as descricao,
            SUM(i.ite_quant) as qtd,
            SUM(i.ite_totliquido) as valor
        FROM itens_ped i
        JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
        JOIN cad_prod prod ON i.ite_idproduto = prod.pro_id
        WHERE p.ped_cliente = {client_ref_id}
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_data >= CURRENT_DATE - INTERVAL '365 days'
        GROUP BY i.ite_produto
        ORDER BY valor DESC
    """
    ref_df = execute_query(query_ref)
    
    # Produtos do Cliente Alvo
    query_target = f"""
        SELECT 
            i.ite_produto as pro_codigo,
            SUM(i.ite_quant) as qtd
        FROM itens_ped i
        JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
        WHERE p.ped_cliente = {client_target_id}
          AND p.ped_situacao IN ('P', 'F')
          AND p.ped_data >= CURRENT_DATE - INTERVAL '365 days'
        GROUP BY i.ite_produto
    """
    target_df = execute_query(query_target)
    
    # Processamento no Python (Pandas)
    # Lista de referência com marcação se o alvo compra ou não
    
    ref_items = ref_df.to_dict('records')
    target_items_map = {row['pro_codigo']: row['qtd'] for row in target_df.to_dict('records')}
    
    comparison = []
    opportunities = []
    
    # Calcular ABC local do Cliente Referência para exibir Curva
    total_val_ref = ref_df['valor'].sum()
    running_val = 0
    
    for item in ref_items:
        running_val += item['valor']
        pct = running_val / total_val_ref
        
        if pct <= 0.8: item['abc'] = 'A'
        elif pct <= 0.95: item['abc'] = 'B'
        else: item['abc'] = 'C'
        
        target_qtd = target_items_map.get(item['pro_codigo'], 0)
        
        comp_item = {
            "produto": item['descricao'],
            "codigo": item['pro_codigo'],
            "ref_qtd": float(item['qtd']),
            "ref_abc": item['abc'],
            "target_qtd": float(target_qtd),
            "is_opportunity": target_qtd == 0
        }
        
        comparison.append(comp_item)
        
        if target_qtd == 0:
            opportunities.append(comp_item)
            
    # Retorna top 50 itens da referência para comparar
    return {
        "comparison": comparison[:50], 
        "opportunities_count": len(opportunities),
        "opportunities_potential": sum(op['ref_qtd'] for op in opportunities) # Potencial bruto em QTD
    }

def get_top_clients_variation(ano: int, mes: str = None, industry_id: int = None, startDate: str = None, endDate: str = None):
    """Retorna comparativo de top clientes vs ano anterior"""
    try:
        industry_filter = ""
        if industry_id and industry_id != 'Todos':
            industry_filter = f" AND p.ped_industria = :ind_id"

        if startDate and endDate:
            # YoY Comparison for Date Range
            query = f"""
                WITH CurrentPeriod AS (
                    SELECT p.ped_cliente, c.cli_nomred, SUM(p.ped_totliq) as valor
                    FROM pedidos p
                    JOIN clientes c ON p.ped_cliente = c.cli_codigo
                    WHERE p.ped_data BETWEEN :startDate AND :endDate
                      AND p.ped_situacao IN ('P', 'F')
                      {industry_filter}
                    GROUP BY 1, 2
                ),
                PrevPeriod AS (
                    SELECT p.ped_cliente, SUM(p.ped_totliq) as valor
                    FROM pedidos p
                    WHERE p.ped_data BETWEEN (:startDate::date - INTERVAL '1 year') AND (:endDate::date - INTERVAL '1 year')
                      AND p.ped_situacao IN ('P', 'F')
                      {industry_filter}
                    GROUP BY 1
                )
                SELECT 
                    cur.cli_nomred as name,
                    COALESCE(prev.valor, 0) as prev_val,
                    cur.valor as current_val,
                    CASE WHEN COALESCE(prev.valor, 0) > 0 
                         THEN ((cur.valor - prev.valor) / prev.valor * 100)
                         ELSE 100 END as variation
                FROM CurrentPeriod cur
                LEFT JOIN PrevPeriod prev ON cur.ped_cliente = prev.ped_cliente
                ORDER BY cur.valor DESC
                LIMIT 10
            """
            params = {"startDate": startDate, "endDate": endDate, "ind_id": industry_id}
        else:
            mes_map = {
                'Janeiro': 1, 'Fevereiro': 2, 'Março': 3, 'Abril': 4, 'Maio': 5, 'Junho': 6,
                'Julho': 7, 'Agosto': 8, 'Setembro': 9, 'Outubro': 10, 'Novembro': 11, 'Dezembro': 12
            }
            mes_num = mes_map.get(mes) if mes and mes != "Todos" else None
            
            where_current = f"ano = {ano}"
            where_prev = f"ano = {ano - 1}"
            
            if mes_num:
                where_current += f" AND mes = {mes_num}"
                where_prev += f" AND mes = {mes_num}"
            
            # Filtering by industry if applicable
            v_industry_filter = ""
            if industry_id and industry_id != 'Todos':
                v_industry_filter = f" AND industry_id = '{industry_id}'"

            query = f"""
                WITH CurrentYear AS (
                    SELECT cliente_id, cliente_nome, SUM(valor_total) as valor
                    FROM vw_performance_mensal
                    WHERE {where_current} {v_industry_filter}
                    GROUP BY 1, 2
                ),
                PrevYear AS (
                    SELECT cliente_id, SUM(valor_total) as valor
                    FROM vw_performance_mensal
                    WHERE {where_prev} {v_industry_filter}
                    GROUP BY 1
                )
                SELECT 
                    cur.cliente_nome as name,
                    COALESCE(prev.valor, 0) as prev_val,
                    cur.valor as current_val,
                    CASE WHEN COALESCE(prev.valor, 0) > 0 
                         THEN ((cur.valor - prev.valor) / prev.valor * 100)
                         ELSE 100 END as variation
                FROM CurrentYear cur
                LEFT JOIN PrevYear prev ON cur.cliente_id = prev.cliente_id
                ORDER BY cur.valor DESC
                LIMIT 10
            """
            params = {}
        df = execute_query(query, params)
        
        results = []
        for _, row in df.iterrows():
            var = float(row['variation'])
            status = "crescendo"
            if var > 50: status = "destaque"
            elif var < -10: status = "queda"
            if row['current_val'] == 0 and row['prev_val'] > 0: status = "perdido"
            
            results.append({
                "name": row['name'],
                "prev": float(row['prev_val']),
                "current": float(row['current_val']),
                "variation": f"{var:+.1f}%",
                "status": status,
                "is_negative": var < 0
            })
        return results
    except Exception as e:
        print(f"Error in get_top_clients_variation: {e}")
        return []

def get_full_analytics_tab(ano: int, mes: str = "Todos", industry_id: int = None, startDate: str = None, endDate: str = None):
    """
    Consolidated function to fetch all analytics data in one go.
    Implements internal caching to avoid heavy re-computation.
    """
    try:
        from services.insights import generate_critical_alerts_ai
        from concurrent.futures import ThreadPoolExecutor
        
        # 1. Fetch data in parallel (or sequential but efficiently)
        # We use a cache key based on params
        cache_key = f"full_tab_{ano}_{mes}_{industry_id}_{startDate}_{endDate}"
        
        def compute_all():
            with ThreadPoolExecutor(max_workers=5) as executor:
                # Dispara as queries em paralelo
                future_alerts = executor.submit(get_critical_alerts, ano, mes, industry_id, startDate, endDate)
                future_abc = executor.submit(get_portfolio_abc, ano, mes, industry_id, startDate, endDate)
                future_variations = executor.submit(get_top_clients_variation, ano, mes, industry_id, startDate, endDate)
                
                # AI Alerts (the heaviest part, we use a separate cache internally)
                # ai_cache_key = f"ai_alerts_{ano}_{mes}_{industry_id}"
                # future_ai = executor.submit(get_cached_result, ai_cache_key, generate_critical_alerts_ai, ano, mes, industry_id)
                
                # Coleta os resultados com segurança individual
                results = {}
                
                try: results["alerts"] = future_alerts.result()
                except Exception as e: 
                    print(f"Error in future_alerts: {e}")
                    results["alerts"] = {}

                # try: results["kpis"] = future_kpis.result()
                # except Exception as e:
                #     print(f"Error in future_kpis: {e}")
                #     results["kpis"] = {"valor_total": 0, "qtd_pedidos": 0, "ticket_medio": 0, "clientes_ativos": 0}
                results["kpis"] = {} # KPI Fetch disabled by user request

                try: results["portfolio_abc"] = future_abc.result()
                except Exception as e:
                    print(f"Error in future_abc: {e}")
                    results["portfolio_abc"] = []

                try: results["client_variations"] = future_variations.result()
                except Exception as e:
                    print(f"Error in future_variations: {e}")
                    results["client_variations"] = []

                # try: results["advanced_insights"] = future_ai.result()
                # except Exception as e:
                #     print(f"Error in future_ai: {e}")
                #     results["advanced_insights"] = []
                results["advanced_insights"] = [] # AI is fetched separately now

                return results

        return get_cached_result(cache_key, compute_all)
        
    except Exception as e:
        print(f"Error in get_full_analytics_tab: {e}")
        import traceback
        traceback.print_exc()
        return {
            "alerts": {}, "kpis": {}, "portfolio_abc": [], 
            "client_variations": [], "advanced_insights": []
        }

