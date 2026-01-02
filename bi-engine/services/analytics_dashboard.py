from services.database import execute_query
import pandas as pd
from datetime import datetime, timedelta
from functools import lru_cache
import time

# Simple cache for AI and data
CACHE_TTL = 300 # 5 minutes
_cache = {}

def get_cached_result(key, func, *args, **kwargs):
    now = time.time()
    if key in _cache:
        timestamp, result = _cache[key]
        if now - timestamp < CACHE_TTL:
            return result
    
    result = func(*args, **kwargs)
    _cache[key] = (now, result)
    return result

def get_critical_alerts(ano: int, mes: str, industry_id: int = None):
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

        # 2. Dead Stock (Itens OFF na curva ABC) - Usar nova função
        # Para obter count de itens OFF, buscamos a curva OFF da função
        # IMPORTANTE: Ordem é (p_ano, p_mes, p_industria)
        try:
            query_dead = """
                SELECT 
                    qtd_itens as total_itens,
                    valor_total as opportunity_value
                FROM fn_analise_curva_abc(:ano, NULL, :industry_id)
                WHERE curva_abc = 'OFF'
            """
            dead_params = {"ano": ano, "industry_id": industry_id}
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
            where = f"ano = {target_ano}"
            params = {}
            if target_mes:
                where += f" AND mes = {target_mes}"
            
            if industry_id and industry_id != 'Todos':
                where += f" AND industry_id = :ind_id"
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

def get_portfolio_abc(ano: int, industry_id: int = None):
    """Retorna Curva ABC usando nova função SQL fn_analise_curva_abc"""
    try:
        # Usar a nova função SQL que substitui a view
        # IMPORTANTE: Ordem dos parâmetros é (p_ano, p_mes, p_industria)
        query = """
            SELECT 
                curva_abc as curva,
                qtd_itens,
                valor_total,
                percentual_faturamento as percent_valor
            FROM fn_analise_curva_abc(:ano, NULL, :industry_id)
        """
        params = {"ano": ano, "industry_id": industry_id}
        
        abc_df = execute_query(query, params)
        
        if abc_df.empty:
            return []
            
        return abc_df.to_dict('records')
    except Exception as e:
        print(f"Error in get_portfolio_abc: {e}")
        import traceback
        traceback.print_exc()
        return []

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
        JOIN pedidos p ON (i.ite_pedido ~ '^[0-9]+$' AND CAST(i.ite_pedido AS INTEGER) = p.ped_numero)
        JOIN cad_prod prod ON i.ite_produto = prod.pro_codprod
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
        JOIN pedidos p ON (i.ite_pedido ~ '^[0-9]+$' AND CAST(i.ite_pedido AS INTEGER) = p.ped_numero)
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

def get_top_clients_variation(ano: int, mes: str = None, industry_id: int = None):
    """Retorna comparativo de top clientes vs ano anterior"""
    try:
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
        industry_filter = ""
        if industry_id and industry_id != 'Todos':
            # This is a bit complex as vw_performance_mensal is aggregated. 
            # We assume the user wants the context of the selected industry if possible.
            # For simplicity now, we report overall client status unless we refine the view.
            pass

        query = f"""
            WITH CurrentYear AS (
                SELECT cliente_id, cliente_nome, SUM(valor_total) as valor
                FROM vw_performance_mensal
                WHERE {where_current}
                GROUP BY 1, 2
            ),
            PrevYear AS (
                SELECT cliente_id, SUM(valor_total) as valor
                FROM vw_performance_mensal
                WHERE {where_prev}
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
        df = execute_query(query)
        
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

def get_full_analytics_tab(ano: int, mes: str = "Todos", industry_id: int = None):
    """
    Consolidated function to fetch all analytics data in one go.
    Implements internal caching to avoid heavy re-computation.
    """
    try:
        from services.insights import generate_critical_alerts_ai
        
        # 1. Fetch data in parallel (or sequential but efficiently)
        # We use a cache key based on params
        cache_key = f"full_tab_{ano}_{mes}_{industry_id}"
        
        def compute_all():
            alerts = get_critical_alerts(ano, mes, industry_id)
            kpis = get_kpis_metrics(ano, mes, industry_id)
            abc = get_portfolio_abc(ano, industry_id)
            variations = get_top_clients_variation(ano, mes, industry_id)
            
            # AI Alerts (the heaviest part)
            # Use separate cache for AI to avoid calling OpenAI too often
            # For AI insights, we currently only have Lost Clients context.
            # Let's pass the industry-specific lost clients if we want industry AI.
            # For now, generate_critical_alerts_ai already calls get_critical_alerts internally.
            # We need to update IT too.
            ai_cache_key = f"ai_alerts_{ano}_{mes}_{industry_id}"
            ai_insights = get_cached_result(ai_cache_key, generate_critical_alerts_ai, ano, mes, industry_id)
            
            return {
                "alerts": alerts,
                "kpis": kpis,
                "portfolio_abc": abc,
                "client_variations": variations,
                "advanced_insights": ai_insights
            }

        return get_cached_result(cache_key, compute_all)
        
    except Exception as e:
        print(f"Error in get_full_analytics_tab: {e}")
        return {
            "alerts": {}, "kpis": {}, "portfolio_abc": [], 
            "client_variations": [], "advanced_insights": []
        }

