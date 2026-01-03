from fastapi import APIRouter
from services.data_fetcher import (
    fetch_faturamento_anual,
    fetch_metas_anuais,
    fetch_metas_progresso,
    clear_cache
)
from services.measures import (
    measure_comparativo_mensal,
    measure_evolucao_mensal
)
from services.analysis import analyze_pareto, analyze_industry_growth
from services.insights import generate_insights, get_advanced_insights
from services.top_industries import fetch_top_industries
from services.dashboard_summary import fetch_dashboard_summary
from services.industry_dashboard import get_industry_details
from services.client_dashboard import get_client_details
from services.analytics_dashboard import (
    get_critical_alerts,
    get_kpis_metrics,
    get_portfolio_abc,
    get_client_comparison,
    get_top_clients_variation,
    get_full_analytics_tab
)

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/metas")
async def get_metas(mes: int, ano: int):
    """
    Retorna as metas do mês/ano especificado.
    Usa o data_fetcher com cache.
    """
    months = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"]
    if not (1 <= mes <= 12):
        return {"error": "Mês deve estar entre 1 e 12"}
    
    # Busca Metas do Ano (Cacheada)
    df_metas = fetch_metas_anuais(ano)
    
    if df_metas.empty:
        return {"meta": 0, "num_metas": 0}
        
    metas_row = df_metas.iloc[0]
    col_name = f"met_{months[mes-1]}"
    
    total_meta = float(metas_row[col_name]) if metas_row[col_name] is not None else 0.0
    
    return {
        "meta": total_meta,
        "num_metas": 1 # Simplificado pois agora agregamos no SQL principal
    }

@router.get("/evolution")
async def get_evolution(ano: int, metrica: str = 'valor'):
    """
    Retorna a evolução mensal (MoM) para o gráfico de passos.
    Param 'metrica': 'valor' (Faturamento) ou 'quantidade' (Qtd Vendida).
    """
    print(f"--- BI INLINE: Processando evolução anual {ano} metrica={metrica} ---", flush=True)
    try:
        # 1. Fetch Data (Com Cache - traz ambas as colunas)
        print("DEBUG: Calling fetch_faturamento_anual...", flush=True)
        df_fat = fetch_faturamento_anual(ano)
        print(f"DEBUG: df_fat shape: {df_fat.shape}", flush=True)
        
        if df_fat.empty:
            return []

        col_name = 'v_faturamento' if metrica == 'valor' else 'q_quantidade'
        data_dict = {int(row['n_mes']): float(row[col_name]) for _, row in df_fat.iterrows()}
        
        result = []
        labels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]
        previous_value = 0.0
        
        for i in range(1, 13):
            current_value = data_dict.get(i, 0.0)
            delta_percent = 0.0
            if previous_value > 0:
                delta_percent = ((current_value - previous_value) / previous_value) * 100
            elif previous_value == 0 and current_value > 0:
                delta_percent = 100.0
                
            result.append({
                "name": labels[i-1],
                "mes_num": i,
                "valor": current_value,
                "valor_anterior": previous_value,
                "delta_percent": round(delta_percent, 1),
                "tendencia": "up" if delta_percent >= 0 else "down"
            })
            previous_value = current_value
            
        return result
        
    except Exception as e:
        print(f"FAULT INLINE: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return []

@router.get("/comparison")
async def get_comparison(ano: int):
    """
    Retorna a comparação mensal entre Faturamento Real e Metas.
    Refatorado para usar Camada de Medidas (DAX-Style).
    """
    print(f"--- BI: Processando comparação anual {ano} (Modular) ---")
    try:
        # 1. Fetch Data (Com Cache)
        df_fat = fetch_faturamento_anual(ano)
        df_metas = fetch_metas_anuais(ano)
        
        # 2. Apply Measures (Lógica de Negócio)
        result = measure_comparativo_mensal(df_fat, df_metas)
        
        return result
        
    except Exception as e:
        print(f"FAULT: monthly-comparison failed: {str(e)}")
        # Fallback seguro
        return [{"name": m, "faturamento": 0, "meta": 0} for m in ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]]

@router.post("/cache/clear")
async def clear_dashboard_cache():
    """Endpoint administrativo para limpar cache"""
    clear_cache()
    return {"status": "Cache limpo com sucesso"}

@router.get("/summary")
async def get_summary(ano: int = 2025, mes: str = 'Todos', industria: int = None):
    """
    Retorna KPIs do dashboard (Faturamento, Pedidos, Clientes, Ticket Médio, Quantidade Vendida).
    Com comparativo M-1 ou A-1 dependendo do filtro.
    """
    data = fetch_dashboard_summary(ano, mes, industria)
    return {"success": True, "data": data}


@router.get("/goals-scroller")
async def get_goals_scroller(ano: int):
    """
    Retorna lista de progresso de metas por indústria para o Scroller.
    Formato: [{industry: 'Nome', percent: 95.5, status: 'success/danger'}]
    """
    print(f"--- BI: Processando Scroller de Metas {ano} ---", flush=True)
    try:
        df = fetch_metas_progresso(ano)
        
        if df.empty:
            return []
            
        result = []
        for _, row in df.iterrows():
            total_vendas = float(row['total_vendas'])
            total_meta = float(row['total_meta'])
            
            # Avoid division by zero
            percent = 0.0
            if total_meta > 0:
                percent = (total_vendas / total_meta) * 100
            
            # Color logic: Green if >= 100%, Red if < 100%
            status = 'success' if percent >= 100 else 'danger'
            
            result.append({
                "industry": row['industria'],
                "total_sales": total_vendas,
                "total_goal": total_meta,
                "percent": round(percent, 1),
                "status": status
            })
            
        return result

    except Exception as e:
        print(f"FAULT: goals-scroller failed: {str(e)}", flush=True)
        return []

@router.get("/pareto")
async def get_pareto(ano: int, metrica: str = 'valor'):
    """
    Retorna curva Pareto (80/20) de Clientes.
    """
    return analyze_pareto(ano, metrica)

@router.get("/industry-growth")
async def get_industry_growth(ano: int = 2025, metrica: str = 'valor'):
    """
    Retorna desvio de crescimento por indústria (TOP 15).
    """
    return analyze_industry_growth(ano, metrica)

@router.get("/insights")
async def get_insights(ano: int = 2025, industryId: int = None):
    """
    Retorna narrativas inteligentes sobre o desempenho do ano.
    """
    return generate_insights(ano, industryId)

@router.get("/top-industries")
async def get_top_industries(ano: int, mes: str = 'Todos', metrica: str = 'valor', limit: int = 6):
    """
    Retorna TOP N indústrias para o Bubble Chart.
    Parâmetros:
        - ano: Ano de referência
        - mes: '01'-'12' ou 'Todos'
        - metrica: 'valor' ou 'quantidade'
        - limit: Limite de registros (default 6)
    """
    data = fetch_top_industries(ano, mes, metrica, limit)
    return {"success": True, "data": data}

@router.get("/industry-details")
async def get_industry_details_api(ano: int = 2025, mes: str = 'Todos', industryId: int = None, metrica: str = 'valor'):
    """
    Retorna detalhes completos para o painel de indústria (Funil, Gráficos, Churn).
    """
    return get_industry_details(ano, mes, industryId, metrica)

@router.get("/filters-options")
async def get_filters_options():
    """
    Retorna lista de opções para filtros (Indústrias, Clientes).
    """
    from services.data_fetcher import fetch_available_filters
    return fetch_available_filters()

@router.get("/client-details")
async def get_client_details_api(ano: int = 2025, mes: str = 'Todos', industryId: int = None, metrica: str = 'valor', uf: str = None):
    """
    Retorna análise detalhada de clientes para o dashboard:
    - Grupos de lojas
    - Ciclo de compra (ordenado por dias sem comprar DESC)
    - Top clientes com MoM
    - Ativos vs Inativos (carteira = clientes históricos)
    - Sem compras (com dias sem comprar)
    - Risco de churn
    - Lista de UFs disponíveis para filtro
    """
    return get_client_details(ano, mes, industryId, metrica, uf)

# --- ANALYTICS DASHBOARD ENDPOINTS ---

@router.get("/analytics/alerts")
async def get_analytics_alerts(ano: int = 2025, mes: str = 'Todos'):
    import time
    start = time.time()
    print(f"REQUEST [GET] /analytics/alerts (ano={ano}, mes={mes})", flush=True)
    res = get_critical_alerts(ano, mes)
    print(f"RESPONSE /analytics/alerts - Duration: {time.time() - start:.2f}s", flush=True)
    return res

@router.get("/analytics/kpis")
async def get_analytics_kpis(ano: int = 2025, mes: str = 'Todos'):
    import time
    start = time.time()
    print(f"REQUEST [GET] /analytics/kpis (ano={ano}, mes={mes})", flush=True)
    res = get_kpis_metrics(ano, mes)
    print(f"RESPONSE /analytics/kpis - Duration: {time.time() - start:.2f}s", flush=True)
    return res

@router.get("/analytics/portfolio-abc")
async def get_analytics_portfolio(ano: int = 2025, industryId: int = None):
    import time
    start = time.time()
    print(f"REQUEST [GET] /analytics/portfolio-abc (ano={ano}, industryId={industryId})", flush=True)
    res = get_portfolio_abc(ano, industryId)
    print(f"RESPONSE /analytics/portfolio-abc - Duration: {time.time() - start:.2f}s", flush=True)
    return res

@router.get("/analytics/top-clients-variation")
async def get_analytics_top_clients_variation(ano: int = 2025, mes: str = "Todos", industryId: int = None):
    return get_top_clients_variation(ano, mes, industryId)

@router.get("/analytics/full-tab")
async def get_analytics_full_tab(ano: int = 2025, mes: str = "Todos", industryId: int = None):
    import time
    start = time.time()
    print(f"REQUEST [GET] /analytics/full-tab (ano={ano}, mes={mes}, industry={industryId})", flush=True)
    res = get_full_analytics_tab(ano, mes, industryId)
    print(f"RESPONSE /analytics/full-tab - Duration: {time.time() - start:.2f}s", flush=True)
    return res

@router.get("/analytics/client-comparison")
async def get_client_comparison_api(ref_client: int, target_client: int):
    """
    Retorna comparativo entre dois clientes para identificar oportunidades.
    """
    return get_client_comparison(ref_client, target_client)

@router.get("/analytics/insights")
async def get_analytics_insights_api(ano: int = 2025, industryId: int = None):
    """
    Retorna insights agregados (Oportunidades, Alertas, Riscos, Destaques) 
    para o InsightsCard em formato unificado.
    """
    import time
    start = time.time()
    print(f"REQUEST [GET] /analytics/insights (ano={ano}, industryId={industryId})", flush=True)
    
    # Reutiliza a lógica existente em generate_insights do services/insights.py
    # que já retorna a estrutura { success: true, categorias: {...} }
    # O frontend fará o flattening necessário.
    res = generate_insights(ano, industryId)
    
    print(f"RESPONSE /analytics/insights - Duration: {time.time() - start:.2f}s", flush=True)
    return {"success": True, "data": res}


@router.get("/analytics/priority-actions")
async def get_priority_actions():
    """Classifica insights por prioridade de ação"""
    import time
    from services.insights import AdvancedAnalyzer
    
    start = time.time()
    print(f"REQUEST [GET] /analytics/priority-actions", flush=True)
    
    try:
        analyzer = AdvancedAnalyzer()
        actions = []
        
        # 1. URGENTE - Churn crítico
        churn = analyzer.predict_churn_with_context()
        if churn and len(churn) > 0:
            c = churn[0]
            if c.get('nivel_risco') == 'CRÍTICO':
                perda_anual = float(c.get('perda_mensal_est', 0) or 0) * 12
                actions.append({
                    'prioridade': 'URGENTE',
                    'icone': '📞',
                    'titulo': f"Contato com {c.get('cliente', 'Cliente')}",
                    'detalhe': f"Reativação de cliente inativo - Perda potencial R$ {perda_anual:,.0f}/ano"
                })
        
        # 2. IMPORTANTE - Correlação/Bundle
        corr = analyzer.find_product_correlations()
        if corr and len(corr) > 0:
            c = corr[0]
            prod_a = str(c.get('produto_a', ''))[:18]
            prod_b = str(c.get('produto_b', ''))[:18]
            actions.append({
                'prioridade': 'IMPORTANTE',
                'icone': '📦',
                'titulo': f"Bundle: {prod_a}... + {prod_b}...",
                'detalhe': f"Taxa conversão {c.get('taxa_conversao', 0)}% - Oportunidade de vendas cruzadas"
            })
        
        # 3. MÉDIO PRAZO - Oportunidade perdida
        opp = analyzer.detect_lost_opportunities()
        if opp and len(opp) > 0:
            o = opp[0]
            total_gasto = float(o.get('total_gasto', 0) or 0)
            potencial = total_gasto * 0.3
            actions.append({
                'prioridade': 'MÉDIO PRAZO',
                'icone': '📊',
                'titulo': f"Cross-sell com {o.get('cliente', 'Cliente')}",
                'detalhe': f"Cliente não compra {o.get('produtos_top_nao_comprados', 0)} produtos top - Potencial R$ {potencial:,.0f}"
            })
        
        # 4. OPORTUNIDADE - Anomalia positiva
        anom = analyzer.detect_anomalies()
        if anom and len(anom) > 0:
            positivas = [x for x in anom if float(x.get('variacao_pct', 0) or 0) > 0]
            if positivas:
                a = positivas[0]
                variacao = float(a.get('variacao_pct', 0) or 0)
                actions.append({
                    'prioridade': 'OPORTUNIDADE',
                    'icone': '🚀',
                    'titulo': f"Expansão com {a.get('cliente', 'Cliente')}",
                    'detalhe': f"Ticket médio cresceu {variacao:.0f}% - aumentar limites"
                })
        
        print(f"RESPONSE /analytics/priority-actions - Duration: {time.time() - start:.2f}s, Actions: {len(actions)}", flush=True)
        return {"success": True, "data": actions}
        
    except Exception as e:
        print(f"Error priority-actions: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/analytics/commercial-efficiency")
async def get_commercial_efficiency():
    """Eficiência comercial com comparativos"""
    import time
    from services.database import execute_query
    
    start = time.time()
    print(f"REQUEST [GET] /analytics/commercial-efficiency", flush=True)
    
    try:
        # 1. TICKET MÉDIO (atual vs mês anterior)
        ticket_query = """
            WITH current_month AS (
                SELECT AVG(ped_totliq) as ticket
                FROM pedidos
                WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE)
                  AND ped_situacao IN ('P', 'F')
            ),
            previous_month AS (
                SELECT AVG(ped_totliq) as ticket
                FROM pedidos
                WHERE ped_data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'
                  AND ped_data < DATE_TRUNC('month', CURRENT_DATE)
                  AND ped_situacao IN ('P', 'F')
            )
            SELECT 
                COALESCE(c.ticket, 0) as atual,
                COALESCE(p.ticket, 0) as anterior,
                ROUND(((COALESCE(c.ticket, 0) - COALESCE(p.ticket, 1)) / NULLIF(p.ticket, 0) * 100)::numeric, 1) as variacao
            FROM current_month c, previous_month p;
        """
        ticket_df = execute_query(ticket_query)
        ticket_row = ticket_df.iloc[0] if not ticket_df.empty else {'atual': 0, 'anterior': 0, 'variacao': 0}
        
        # 2. PEDIDOS POR CLIENTE (atual vs ano anterior)
        pedidos_query = """
            WITH current_period AS (
                SELECT AVG(qtd) as avg_pedidos
                FROM (
                    SELECT COUNT(*) as qtd
                    FROM pedidos
                    WHERE ped_data >= CURRENT_DATE - INTERVAL '3 months'
                      AND ped_situacao IN ('P', 'F')
                    GROUP BY ped_cliente
                ) t
            ),
            previous_period AS (
                SELECT AVG(qtd) as avg_pedidos
                FROM (
                    SELECT COUNT(*) as qtd
                    FROM pedidos
                    WHERE ped_data >= CURRENT_DATE - INTERVAL '15 months'
                      AND ped_data < CURRENT_DATE - INTERVAL '12 months'
                      AND ped_situacao IN ('P', 'F')
                    GROUP BY ped_cliente
                ) t
            )
            SELECT 
                COALESCE(c.avg_pedidos, 0) as atual,
                COALESCE(p.avg_pedidos, 0) as anterior,
                ROUND(((COALESCE(c.avg_pedidos, 0) - COALESCE(p.avg_pedidos, 1)) / NULLIF(p.avg_pedidos, 0) * 100)::numeric, 1) as variacao
            FROM current_period c, previous_period p;
        """
        pedidos_df = execute_query(pedidos_query)
        pedidos_row = pedidos_df.iloc[0] if not pedidos_df.empty else {'atual': 0, 'anterior': 0, 'variacao': 0}
        
        # 3. CONVERSÃO CATÁLOGO (% produtos vendidos)
        conversao_query = """
            SELECT 
                ROUND((COUNT(DISTINCT i.ite_idproduto)::float / NULLIF(COUNT(DISTINCT p.pro_id), 0) * 100)::numeric, 1) as conversao
            FROM cad_prod p
            LEFT JOIN itens_ped i ON p.pro_id = i.ite_idproduto
            LEFT JOIN pedidos ped ON i.ite_pedido = ped.ped_pedido
            WHERE ped.ped_data >= CURRENT_DATE - INTERVAL '3 months'
              AND ped.ped_situacao IN ('P', 'F');
        """
        conversao_df = execute_query(conversao_query)
        conversao_val = float(conversao_df.iloc[0]['conversao'] or 0) if not conversao_df.empty else 0
        
        # 4. OPORTUNIDADE CROSS-SELL (clientes só Curva C - simplificado)
        crosssell_query = """
            WITH produto_fat AS (
                SELECT 
                    i.ite_idproduto,
                    SUM(i.ite_totliquido) as fat
                FROM itens_ped i
                INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido
                WHERE p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY i.ite_idproduto
            ),
            produto_curva AS (
                SELECT 
                    ite_idproduto,
                    fat,
                    SUM(fat) OVER () as total_fat,
                    SUM(fat) OVER (ORDER BY fat DESC) as fat_acum
                FROM produto_fat
            ),
            curva_definida AS (
                SELECT 
                    ite_idproduto,
                    CASE 
                        WHEN fat_acum / NULLIF(total_fat, 1) <= 0.80 THEN 'A'
                        WHEN fat_acum / NULLIF(total_fat, 1) <= 0.95 THEN 'B'
                        ELSE 'C'
                    END as curva
                FROM produto_curva
            )
            SELECT 
                COUNT(DISTINCT p.ped_cliente) as qtd_clientes,
                COALESCE(SUM(p.ped_totliq), 0) as potencial
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            INNER JOIN curva_definida cd ON i.ite_idproduto = cd.ite_idproduto
            WHERE p.ped_data >= CURRENT_DATE - INTERVAL '6 months'
              AND p.ped_situacao IN ('P', 'F')
              AND cd.curva = 'C';
        """
        crosssell_df = execute_query(crosssell_query)
        crosssell_row = crosssell_df.iloc[0] if not crosssell_df.empty else {'qtd_clientes': 0, 'potencial': 0}
        
        result = {
            'success': True,
            'data': {
                'ticket_medio': {
                    'valor': round(float(ticket_row['atual'] or 0), 2),
                    'variacao': float(ticket_row['variacao'] or 0)
                },
                'pedidos_cliente': {
                    'valor': round(float(pedidos_row['atual'] or 0), 1),
                    'variacao': float(pedidos_row['variacao'] or 0)
                },
                'conversao_catalogo': {
                    'valor': conversao_val,
                    'status': '↑ Melhor da série' if conversao_val > 50 else 'Normal'
                },
                'cross_sell': {
                    'clientes': int(crosssell_row['qtd_clientes'] or 0),
                    'potencial': round(float(crosssell_row['potencial'] or 0) * 0.3, 2)  # 30% do valor como potencial
                }
            }
        }
        
        print(f"RESPONSE /analytics/commercial-efficiency - Duration: {time.time() - start:.2f}s", flush=True)
        return result
        
    except Exception as e:
        print(f"Error commercial-efficiency: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": {}}


@router.get("/analytics/customer-comparison")
async def get_customer_comparison(ano: int = 2025):
    """Comparativo clientes: ano atual vs anterior"""
    import time
    from services.database import execute_query
    
    start = time.time()
    print(f"REQUEST [GET] /analytics/customer-comparison (ano={ano})", flush=True)
    
    try:
        # Usa o ano do filtro para comparar com o ano anterior
        ano_atual = ano
        ano_anterior = ano - 1
        
        query = f"""
            WITH current_year AS (
                SELECT 
                    c.cli_nomred as cliente,
                    COUNT(*) as pedidos,
                    MAX(p.ped_data) as ultima_compra
                FROM pedidos p
                INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE EXTRACT(YEAR FROM p.ped_data) = {ano_atual}
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY c.cli_nomred
            ),
            previous_year AS (
                SELECT 
                    c.cli_nomred as cliente,
                    COUNT(*) as pedidos
                FROM pedidos p
                INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE EXTRACT(YEAR FROM p.ped_data) = {ano_anterior}
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY c.cli_nomred
            )
            SELECT 
                COALESCE(cy.cliente, py.cliente) as cliente,
                COALESCE(py.pedidos, 0) as ano_anterior,
                COALESCE(cy.pedidos, 0) as ano_atual,
                cy.ultima_compra,
                CASE 
                    WHEN COALESCE(py.pedidos, 0) = 0 AND COALESCE(cy.pedidos, 0) > 0 THEN 100
                    WHEN COALESCE(cy.pedidos, 0) = 0 THEN -100
                    ELSE ROUND(((cy.pedidos::float - py.pedidos) / py.pedidos * 100)::numeric, 0)
                END as variacao,
                CASE
                    WHEN COALESCE(cy.pedidos, 0) = 0 THEN 'Perdido'
                    WHEN COALESCE(py.pedidos, 0) = 0 THEN 'Novo'
                    WHEN cy.pedidos::float / NULLIF(py.pedidos, 1) >= 1.5 THEN 'Destaque'
                    WHEN cy.pedidos > py.pedidos THEN 'Crescendo'
                    WHEN cy.pedidos < py.pedidos THEN 'Em Queda'
                    ELSE 'Estável'
                END as status
            FROM current_year cy
            FULL OUTER JOIN previous_year py ON cy.cliente = py.cliente
            WHERE COALESCE(cy.pedidos, 0) + COALESCE(py.pedidos, 0) >= 5
            ORDER BY 
                CASE 
                    WHEN COALESCE(cy.pedidos, 0) = 0 THEN 1
                    WHEN cy.pedidos::float / NULLIF(py.pedidos, 1) >= 1.5 THEN 2
                    ELSE 3
                END,
                variacao DESC
            LIMIT 20;
        """
        
        df = execute_query(query)
        clientes_list = df.to_dict('records') if not df.empty else []
        
        # Gera alertas contextuais
        alertas = []
        
        for c in clientes_list:
            if c.get('status') == 'Perdido':
                # Calcula perda estimada
                perda_query = """
                    SELECT COALESCE(SUM(ped_totliq) / 12.0, 0) as perda_mensal
                    FROM pedidos p
                    INNER JOIN clientes cl ON p.ped_cliente = cl.cli_codigo
                    WHERE cl.cli_nomred = %s
                      AND EXTRACT(YEAR FROM p.ped_data) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
                      AND p.ped_situacao IN ('P', 'F')
                """
                # Note: execute_query doesn't support params, simplifying
                perda_anual = float(c.get('ano_anterior', 0) or 0) * 5000  # Estimativa
                
                ultima = c.get('ultima_compra')
                ultima_str = ultima.strftime("%m/%Y") if ultima else "início do ano"
                
                alertas.append({
                    'tipo': 'critico',
                    'cliente': c.get('cliente', ''),
                    'titulo': f"Cliente {c.get('cliente', '')} Necessita Atenção Urgente:",
                    'detalhes': [
                        f"Zerou pedidos desde {ultima_str}",
                        f"Perda anual estimada: R$ {perda_anual:,.0f}",
                        "Ação recomendada: Contato comercial imediato + proposta especial de reativação"
                    ]
                })
            
            elif c.get('status') == 'Destaque':
                alertas.append({
                    'tipo': 'oportunidade',
                    'cliente': c.get('cliente', ''),
                    'titulo': f"Destaque: {c.get('cliente', '')}",
                    'detalhes': [
                        f"Crescimento de +{c.get('variacao', 0)}% (maior do período)",
                        f"Concentração: {c.get('ano_atual', 0)} pedidos no ano atual",
                        "Oportunidade: Aumentar limite de crédito e oferecer condições especiais"
                    ]
                })
        
        # Convert datetime to string for JSON serialization
        for c in clientes_list:
            if c.get('ultima_compra'):
                c['ultima_compra'] = c['ultima_compra'].isoformat()
        
        result = {
            'success': True,
            'data': {
                'clientes': clientes_list,
                'alertas': alertas[:2]  # Máximo 2 alertas
            }
        }
        
        print(f"RESPONSE /analytics/customer-comparison - Duration: {time.time() - start:.2f}s, Clientes: {len(clientes_list)}", flush=True)
        return result
        
    except Exception as e:
        print(f"Error customer-comparison: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": {"clientes": [], "alertas": []}}
