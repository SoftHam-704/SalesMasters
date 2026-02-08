from services.database import execute_query
import pandas as pd
from datetime import datetime, timedelta

def get_industry_details(ano: int, mes: str, industry_id: int, metrica: str = 'valor', startDate: str = None, endDate: str = None):
    """
    Fetch comprehensive details for the Single Industry Dashboard.
    """
    try:
        if not industry_id:
            return {"error": "Industry ID is required"}

        # 1. Base Dates Logic
        month_int = None
        if mes and mes != 'Todos':
            try:
                month_int = int(mes)
            except:
                pass

        # 2. Funnel KPIs (Sales, Qty, Units, Orders, Portfolio)
        funnel = get_funnel_kpi(ano, month_int, industry_id, startDate, endDate)
        
        # 3. Funnel Sparkline (Daily Sales for selected period)
        sparkline = get_funnel_sparkline(ano, month_int, industry_id, startDate, endDate)
        
        # 4. Client Analysis (Lollipop & Churn)
        # Churn analysis usually needs a full reference year, but we can make it more flexible later.
        # For now, we'll keep it by year but can pass start/end for filtering current active clients.
        client_metrics = get_client_analysis(ano, industry_id, startDate, endDate)
        
        # 5. Main Chart (Monthly Sales with YoY Flag) - NOW WITH METRIC SUPPORT
        monthly_sales = get_monthly_sales_chart(ano, industry_id, metrica, startDate, endDate)
        
        # 6. Recent Orders Table
        orders_table = get_recent_orders(ano, month_int, industry_id, startDate, endDate)

        # 7. Metadata (Name, Share, etc.)
        metadata = get_industry_metadata(ano, month_int, industry_id, startDate, endDate)

        # 8. Narrative / Performance Insights
        narrative = get_industry_narrative(ano, industry_id, startDate, endDate)

        return {
            "success": True,
            "funnel": funnel,
            "sparkline": sparkline,
            "clients": client_metrics,
            "monthly_sales": monthly_sales,
            "orders": orders_table,
            "metadata": metadata,
            "narrative": narrative
        }

    except Exception as e:
        print(f"CRITICAL: get_industry_details failed: {e}", flush=True)
        return {"error": str(e), "success": False}


def get_industry_metadata(ano: int, mes: int, ind_id: int, startDate: str = None, endDate: str = None):
    """Fetch Industry Name, Logo and Calculate Market Share"""
    
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
        if mes:
            date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
        
    # 1. Get Industry Info + Sales
    query_ind = f"""
        SELECT 
            f.for_nomered as nome,
            f.for_homepage as imagem_url,
            COALESCE(SUM(p.ped_totliq), 0) as total_vendas
        FROM fornecedores f
        LEFT JOIN pedidos p ON f.for_codigo = p.ped_industria 
             AND p.ped_situacao IN ('P', 'F')
             AND {date_filter}
        WHERE f.for_codigo = :ind
        GROUP BY f.for_nomered, f.for_homepage
    """
    df_ind = execute_query(query_ind, {"ind": ind_id})
    
    if df_ind.empty:
        return {"nome": "Indústria", "percentual": 0.0, "imagem_url": None}
        
    row = df_ind.iloc[0]
    ind_sales = float(row['total_vendas'])
    
    # 2. Get Total Market Sales
    query_total = f"""
        SELECT SUM(p.ped_totliq) as grand_total
        FROM pedidos p
        WHERE p.ped_situacao IN ('P', 'F')
          AND {date_filter}
    """
    df_total = execute_query(query_total)
    grand_total = float(df_total.iloc[0]['grand_total']) if not df_total.empty and df_total.iloc[0]['grand_total'] else 0.0
    
    percentual = (ind_sales / grand_total * 100.0) if grand_total > 0 else 0.0
    
    return {
        "nome": row['nome'],
        "imagem_url": row['imagem_url'] if pd.notna(row['imagem_url']) else None,
        "percentual": percentual
    }


def get_industry_narrative(ano, ind_id, startDate=None, endDate=None):
    """Generate intelligent narrative for industry performance analysis"""
    
    MONTH_NAMES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
    
    try:
        # 1. Get industry name
        query_name = "SELECT for_nomered as nome FROM fornecedores WHERE for_codigo = :ind"
        df_name = execute_query(query_name, {"ind": ind_id})
        ind_nome = df_name.iloc[0]['nome'] if not df_name.empty else "Indústria"
        
        # 2. Get monthly sales with YoY comparison
        monthly_data = get_monthly_sales_chart(ano, ind_id, 'valor', startDate, endDate)
        
        # 3. Get goals from ind_metas
        query_goals = """
            SELECT 
                COALESCE(met_jan,0) + COALESCE(met_fev,0) + COALESCE(met_mar,0) + 
                COALESCE(met_abr,0) + COALESCE(met_mai,0) + COALESCE(met_jun,0) + 
                COALESCE(met_jul,0) + COALESCE(met_ago,0) + COALESCE(met_set,0) + 
                COALESCE(met_out,0) + COALESCE(met_nov,0) + COALESCE(met_dez,0) as total_meta
            FROM ind_metas 
            WHERE met_industria = :ind AND met_ano = :ano
        """
        df_goals = execute_query(query_goals, {"ind": ind_id, "ano": ano})
        total_meta = float(df_goals.iloc[0]['total_meta']) if not df_goals.empty and df_goals.iloc[0]['total_meta'] else 0.0
        
        # 4. Calculate total sales YTD
        total_vendas = sum([m['vendas'] for m in monthly_data])
        
        # 5. Goal attainment percentage
        atingimento_meta = (total_vendas / total_meta * 100.0) if total_meta > 0 else 0.0
        
        # 6. Find best and worst months (by YoY variation)
        months_with_yoy = []
        for m in monthly_data:
            curr = m['vendas']
            prev = m['vendas_ly']
            if prev > 0 and curr > 0:
                yoy_var = ((curr - prev) / prev) * 100.0
                months_with_yoy.append({
                    "mes": m['mes'],
                    "nome": MONTH_NAMES[m['mes'] - 1],
                    "variacao": yoy_var
                })
        
        melhor_mes = None
        pior_mes = None
        
        if months_with_yoy:
            sorted_months = sorted(months_with_yoy, key=lambda x: x['variacao'], reverse=True)
            melhor_mes = sorted_months[0]
            pior_mes = sorted_months[-1]
        
        # 7. Generate interpretation text
        interpretacao = (
            "Meses com variação positiva sobre o LY indicam recuperação ou efeitos sazonais favoráveis; "
            "meses com variação negativa sugerem perda de ritmo, demanda reduzida ou fatores pontuais que afetaram o desempenho."
        )
        
        return {
            "industria_nome": ind_nome,
            "atingimento_meta": round(atingimento_meta, 1),
            "melhor_mes": {
                "nome": f"{melhor_mes['nome']}/{ano}" if melhor_mes else "N/A",
                "variacao_yoy": round(melhor_mes['variacao'], 1) if melhor_mes else 0
            },
            "pior_mes": {
                "nome": f"{pior_mes['nome']}/{ano}" if pior_mes else "N/A",
                "variacao_yoy": round(pior_mes['variacao'], 1) if pior_mes else 0
            },
            "interpretacao": interpretacao
        }
        
    except Exception as e:
        print(f"ERROR: get_industry_narrative failed: {e}", flush=True)
        return None


def get_funnel_kpi(ano: int, mes: int, ind_id: int, startDate: str = None, endDate: str = None):
    """Calculate 5 Cards: Sales, Qty, Units (Distinct SKUs), Orders, Portfolio (% mix)"""
    
    # Base Filter
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN '{startDate}' AND '{endDate}'"
        # YoY logic for range
        prev_date_filter = f"p.ped_data BETWEEN ('{startDate}'::date - INTERVAL '1 year') AND ('{endDate}'::date - INTERVAL '1 year')"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
        if mes:
            date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
        
        # Previous Period Filter (MoM or YoY)
        if mes:
            # MoM logic
            curr_date = datetime(ano, mes, 1)
            prev_date = curr_date - timedelta(days=1)
            prev_mes = prev_date.month
            prev_ano = prev_date.year
            prev_date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {prev_ano} AND EXTRACT(MONTH FROM p.ped_data) = {prev_mes}"
        else:
            # YoY logic
            prev_date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano - 1}"

    # Combined KPI Query (Optimized to reduce scans)
    query = f"""
        WITH period_data AS (
            SELECT 
                SUM(CASE WHEN {date_filter} THEN p.ped_totliq ELSE 0 END) as total_vendas,
                COUNT(DISTINCT CASE WHEN {date_filter} THEN p.ped_pedido ELSE NULL END) as total_pedidos,
                SUM(CASE WHEN {prev_date_filter} THEN p.ped_totliq ELSE 0 END) as prev_vendas,
                COUNT(DISTINCT CASE WHEN {prev_date_filter} THEN p.ped_pedido ELSE NULL END) as prev_pedidos
            FROM pedidos p
            WHERE p.ped_industria = :ind_id 
              AND p.ped_situacao IN ('P', 'F')
              AND ({date_filter} OR {prev_date_filter})
        ),
        item_data AS (
            SELECT 
                SUM(CASE WHEN {date_filter} THEN i.ite_quant ELSE 0 END) as total_qtd,
                COUNT(DISTINCT CASE WHEN {date_filter} THEN i.ite_idproduto ELSE NULL END) as total_skus_vendidos,
                SUM(CASE WHEN {prev_date_filter} THEN i.ite_quant ELSE 0 END) as prev_qtd,
                COUNT(DISTINCT CASE WHEN {prev_date_filter} THEN i.ite_idproduto ELSE NULL END) as prev_skus_vendidos
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE p.ped_industria = :ind_id 
              AND p.ped_situacao IN ('P', 'F')
              AND ({date_filter} OR {prev_date_filter})
        ),
        portfolio_total AS (
            SELECT COUNT(*) as total_portfolio
            FROM cad_prod
            WHERE pro_industria = :ind_id
        )
        SELECT 
            pd.total_vendas, pd.total_pedidos, pd.prev_vendas, pd.prev_pedidos,
            it.total_qtd, it.total_skus_vendidos, it.prev_qtd, it.prev_skus_vendidos,
            port.total_portfolio
        FROM period_data pd, item_data it, portfolio_total port
    """
    
    df = execute_query(query, {"ind_id": ind_id})
    res = {}
    
    if not df.empty:
        row = df.iloc[0]
        
        # Helper for % growth
        def calc_growth(curr, prev):
            if prev == 0: return 100.0 if curr > 0 else 0.0
            return ((curr - prev) / prev) * 100.0

        vendas = float(row['total_vendas'] or 0)
        vendas_prev = float(row['prev_vendas'] or 0)
        
        res['vendas'] = {
            "value": vendas,
            "prev": vendas_prev,
            "delta": calc_growth(vendas, vendas_prev)
        }
        
        qtd = float(row['total_qtd'] or 0)
        qtd_prev = float(row['prev_qtd'] or 0)
        res['quantidades'] = {
            "value": qtd,
            "prev": qtd_prev,
            "delta": calc_growth(qtd, qtd_prev)
        }
        
        itens = float(row['total_skus_vendidos'] or 0)
        itens_prev = float(row['prev_skus_vendidos'] or 0)
        res['unidades'] = {
            "value": itens,
            "prev": itens_prev,
            "delta": calc_growth(itens, itens_prev)
        }
        
        pedidos = float(row['total_pedidos'] or 0)
        pedidos_prev = float(row['prev_pedidos'] or 0)
        res['pedidos'] = {
            "value": pedidos,
            "prev": pedidos_prev,
            "delta": calc_growth(pedidos, pedidos_prev)
        }
        
        # Portfolio
        total_port = float(row['total_portfolio'] or 0)
        sold_port = float(row['total_skus_vendidos'] or 0)
        coverage = (sold_port / total_port * 100.0) if total_port > 0 else 0.0
        
        res['portfolio'] = {
            "sold": sold_port,
            "total": total_port,
            "coverage_pct": coverage
        }
        
    return res

def get_funnel_sparkline(ano, mes, ind_id, startDate=None, endDate=None):
    """Daily sales for sparkline chart"""
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
        if mes:
            date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
        
    query = f"""
        SELECT 
            p.ped_data as data,
            SUM(p.ped_totliq) as total
        FROM pedidos p
        WHERE p.ped_industria = :ind_id
          AND p.ped_situacao IN ('P', 'F')
          AND {date_filter}
        GROUP BY 1
        ORDER BY 1
    """
    df = execute_query(query, {"ind_id": ind_id})
    if df.empty: return []
    return df.to_dict('records')

def get_client_analysis(ano, ind_id, startDate=None, endDate=None):
    """Lollipop Chart Data (Clients per Month) + Churn Matrix Table"""
    
    # Base Filter
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"

    # 1. Lollipop Data (Active Clients by Month)
    query_monthly = f"""
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as mes,
            COUNT(DISTINCT p.ped_cliente) as qtd_clientes
        FROM pedidos p
        WHERE p.ped_industria = :ind_id
          AND {date_filter}
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 1
        ORDER BY 1
    """
    df_lol = execute_query(query_monthly, {"ind_id": ind_id, "ano": ano})
    lollipop = []
    total_distinct_clients_year = 0
    if not df_lol.empty:
        # Fill missing months with 0
        data_map = {int(r['mes']): int(r['qtd_clientes']) for _, r in df_lol.iterrows()}
        for m in range(1, 13):
            lollipop.append({"mes": m, "clientes": data_map.get(m, 0)})
            
    # 2. Churn Matrix Logic (Simplified approximation)
    # New: First buy ever is in this year (or current period)
    # Maintained: Bought Last Year AND This Year
    # Reactivated: Bought Before Last Year, DID NOT buy Last Year, Bought This Year
    # Lost: Bought Last Year, NOT This Year
    
    # For speed, let's do annual churn logic
    query_churn = """
        WITH buyers_2023 AS (select distinct ped_cliente from pedidos where ped_industria=:ind and EXTRACT(YEAR from ped_data) = :ano-2),
             buyers_2024 AS (select distinct ped_cliente from pedidos where ped_industria=:ind and EXTRACT(YEAR from ped_data) = :ano-1),
             buyers_2025 AS (select distinct ped_cliente from pedidos where ped_industria=:ind and EXTRACT(YEAR from ped_data) = :ano)
        SELECT
            (SELECT COUNT(*) FROM buyers_2025 WHERE ped_cliente NOT IN (SELECT ped_cliente FROM buyers_2024)) as novos_ou_reativados, -- Simplification
            (SELECT COUNT(*) FROM buyers_2025 WHERE ped_cliente IN (SELECT ped_cliente FROM buyers_2024)) as mantidos,
            (SELECT COUNT(*) FROM buyers_2024 WHERE ped_cliente NOT IN (SELECT ped_cliente FROM buyers_2025)) as perdidos
    """
    # Note: "Reativados" is harder in single query without full history.
    # Let's split "novos_ou_reativados":
    # Novos: Not in 2024 AND Not in 2023.
    # Reactivated: Not in 2024 BUT IN 2023.
    
    query_churn_refined = """
        WITH history AS (
             SELECT ped_cliente, EXTRACT(YEAR FROM ped_data) as ano
             FROM pedidos 
             WHERE ped_industria = :ind AND EXTRACT(YEAR FROM ped_data) >= :ano-2
             GROUP BY 1, 2
        ),
        client_presence AS (
            SELECT 
                ped_cliente,
                BOOL_OR(ano = :ano) as in_curr,
                BOOL_OR(ano = :ano-1) as in_prev,
                BOOL_OR(ano = :ano-2) as in_old
            FROM history
            GROUP BY ped_cliente
        )
        SELECT 
            COUNT(*) FILTER (WHERE in_curr AND NOT in_prev AND NOT in_old) as novos,
            COUNT(*) FILTER (WHERE in_curr AND in_prev) as mantidos,
            COUNT(*) FILTER (WHERE in_curr AND NOT in_prev AND in_old) as reativados,
            COUNT(*) FILTER (WHERE in_prev AND NOT in_curr) as perdidos
        FROM client_presence
    """
    
    df_churn = execute_query(query_churn_refined, {"ind": ind_id, "ano": ano})
    matrix = {"novos": 0, "mantidos": 0, "reativados": 0, "perdidos": 0}
    
    if not df_churn.empty:
        r = df_churn.iloc[0]
        matrix = {
            "novos": int(r['novos']),
            "mantidos": int(r['mantidos']),
            "reativados": int(r['reativados']),
            "perdidos": int(r['perdidos'])
        }
        
    # Calculate % (based on total active clients this year for 'share', or total base)
    total_active = matrix['novos'] + matrix['mantidos'] + matrix['reativados']
    total_base_impacted = total_active + matrix['perdidos'] # Total universe considered
    
    def pct(val):
        return (val / total_base_impacted * 100.0) if total_base_impacted > 0 else 0.0
        
    matrix_enriched = {
        "novos": {"val": matrix['novos'], "pct": pct(matrix['novos'])},
        "mantidos": {"val": matrix['mantidos'], "pct": pct(matrix['mantidos'])},
        "reativados": {"val": matrix['reativados'], "pct": pct(matrix['reativados'])},
        "perdidos": {"val": matrix['perdidos'], "pct": pct(matrix['perdidos'])},
    }
    
    return {"lollipop": lollipop, "matrix": matrix_enriched}

def get_monthly_sales_chart(ano, ind_id, metrica='valor', startDate=None, endDate=None):
    """Monthly sales/quantity/units compared to last year to flip colors"""
    
    # Date Filtering Logic
    if startDate and endDate:
        # Current range and Previous Year range
        date_cond = f"(p.ped_data BETWEEN '{startDate}' AND '{endDate}' OR p.ped_data BETWEEN ('{startDate}'::date - INTERVAL '1 year') AND ('{endDate}'::date - INTERVAL '1 year'))"
    else:
        date_cond = f"EXTRACT(YEAR FROM p.ped_data) IN ({ano}, {ano}-1)"

    # Select the appropriate aggregation based on metric
    if metrica == 'quantidade':
        # Join with items to get quantity
        query = f"""
            SELECT 
                EXTRACT(MONTH FROM p.ped_data) as mes,
                EXTRACT(YEAR FROM p.ped_data) as ano,
                COALESCE(SUM(i.ite_quant), 0) as total
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE p.ped_industria = :ind
              AND {date_cond}
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1, 2
            ORDER BY 1, 2
        """
    elif metrica == 'unidades':
        # Count distinct SKUs (products)
        query = f"""
            SELECT 
                EXTRACT(MONTH FROM p.ped_data) as mes,
                EXTRACT(YEAR FROM p.ped_data) as ano,
                COUNT(DISTINCT i.ite_idproduto) as total
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE p.ped_industria = :ind
              AND {date_cond}
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1, 2
            ORDER BY 1, 2
        """
    else:
        # Default: valor (sales)
        query = f"""
            SELECT 
                EXTRACT(MONTH FROM ped_data) as mes,
                EXTRACT(YEAR FROM ped_data) as ano,
                SUM(ped_totliq) as total
            FROM pedidos p
            WHERE p.ped_industria = :ind
              AND {date_cond}
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1, 2
            ORDER BY 1, 2
        """
    
    df = execute_query(query, {"ind": ind_id, "ano": ano})
    
    # Organize by Month
    sales_map = {} # {1: {curr: 100, prev: 90}, ...}
    
    for _, row in df.iterrows():
        m = int(row['mes'])
        y = int(row['ano'])
        val = float(row['total'])
        
        if m not in sales_map: sales_map[m] = {"curr": 0.0, "prev": 0.0}
        
        if y == ano:
            sales_map[m]["curr"] = val
        else:
            sales_map[m]["prev"] = val
            
    # Build list
    chart_data = []
    months = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"]
    
    for i in range(1, 13):
        data = sales_map.get(i, {"curr": 0.0, "prev": 0.0})
        curr = data["curr"]
        prev = data["prev"]
        
        # Color Logic: Red if Curr < Prev (Drop), Green otherwise
        # Also, check if month has passed/has data.
        # If curr is 0, maybe future month?
        
        is_negative = (curr < prev) and (prev > 0) and (curr > 0) # Only flag if actual drop in sales
        
        chart_data.append({
            "name": months[i-1],
            "mes": i,
            "vendas": curr,
            "vendas_ly": prev,
            "is_negative": is_negative
        })
        
    return chart_data

def get_recent_orders(ano, mes, ind_id, startDate=None, endDate=None):
    """List last 20 orders"""
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
        if mes:
            date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
        
    query = f"""
        SELECT 
            p.ped_pedido,
            p.ped_data,
            c.cli_nomred,
            p.ped_totliq,
            (SELECT COUNT(*) FROM itens_ped i WHERE i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria) as qtd_itens
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_industria = :ind
          AND p.ped_situacao IN ('P', 'F')
          AND {date_filter}
        ORDER BY p.ped_data DESC
        LIMIT 20
    """
    df = execute_query(query, {"ind": ind_id})
    if df.empty: return []
    
    res = []
    for _, row in df.iterrows():
        res.append({
            "pedido": row['ped_pedido'],
            "data": row['ped_data'].strftime('%d/%m/%Y'),
            "cliente": row['cli_nomred'],
            "valor": float(row['ped_totliq']),
            "quantidade": int(row['qtd_itens']) # Using item count as Qtd proxy for table
        })
    return res
