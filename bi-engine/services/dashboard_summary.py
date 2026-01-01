"""
Service: Dashboard Summary KPIs
Retorna métricas agregadas (Faturamento, Qtd Pedidos, Clientes, Ticket Médio)
com comparativo mês anterior.
"""
import pandas as pd
from services.database import execute_query


def fetch_dashboard_summary(ano: int, mes: str = 'Todos', industria: int = None):
    """
    Retorna KPIs do dashboard com comparativo M-1.
    
    Args:
        ano: Ano de referência
        mes: Mês ('01'-'12') ou 'Todos' para ano inteiro
        industria: ID da indústria para filtrar (opcional)
    
    Returns:
        dict com: total_vendido_current, qtd_pedidos_current, clientes_current, 
                  ticket_medio_current e percentuais de variação
    """
    print(f"--- BI: Fetching Dashboard Summary ({ano}/{mes}) industria={industria} ---", flush=True)
    
    # Build filters
    industria_filter = ""
    if industria:
        industria_filter = f"AND p.ped_industria = {industria}"
    
    if mes and mes != 'Todos':
        mes_int = int(mes)
        # Current period = specific month
        # Previous period = previous month (or December of previous year if January)
        if mes_int == 1:
            prev_ano = ano - 1
            prev_mes = 12
        else:
            prev_ano = ano
            prev_mes = mes_int - 1
        
        query = f"""
            WITH metricas_atual AS (
                SELECT 
                    SUM(i.ite_totliquido) as total_vendido,
                    COUNT(DISTINCT p.ped_pedido) as qtd_pedidos,
                    COUNT(DISTINCT p.ped_cliente) as clientes,
                    SUM(i.ite_quant) as quantidade_vendida
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
                  AND EXTRACT(MONTH FROM p.ped_data) = :mes
                  AND p.ped_situacao IN ('P', 'F')
                  {industria_filter}
            ),
            metricas_anterior AS (
                SELECT 
                    SUM(i.ite_totliquido) as total_vendido,
                    COUNT(DISTINCT p.ped_pedido) as qtd_pedidos,
                    COUNT(DISTINCT p.ped_cliente) as clientes,
                    SUM(i.ite_quant) as quantidade_vendida
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :prev_ano
                  AND EXTRACT(MONTH FROM p.ped_data) = :prev_mes
                  AND p.ped_situacao IN ('P', 'F')
                  {industria_filter}
            )
            SELECT 
                ma.total_vendido as total_vendido_current,
                ma.qtd_pedidos as qtd_pedidos_current,
                ma.clientes as clientes_atendidos_current,
                ma.quantidade_vendida as quantidade_vendida_current,
                CASE WHEN ma.qtd_pedidos > 0 
                     THEN ma.total_vendido / ma.qtd_pedidos 
                     ELSE 0 
                END as ticket_medio_current,
                mp.total_vendido as total_vendido_prev,
                mp.qtd_pedidos as qtd_pedidos_prev,
                mp.clientes as clientes_atendidos_prev,
                mp.quantidade_vendida as quantidade_vendida_prev,
                CASE WHEN mp.qtd_pedidos > 0 
                     THEN mp.total_vendido / mp.qtd_pedidos 
                     ELSE 0 
                END as ticket_medio_prev
            FROM metricas_atual ma
            CROSS JOIN metricas_anterior mp
        """
        params = {"ano": ano, "mes": mes_int, "prev_ano": prev_ano, "prev_mes": prev_mes}
    else:
        # Todos = Year comparison (current year vs previous year)
        query = f"""
            WITH metricas_atual AS (
                SELECT 
                    SUM(i.ite_totliquido) as total_vendido,
                    COUNT(DISTINCT p.ped_pedido) as qtd_pedidos,
                    COUNT(DISTINCT p.ped_cliente) as clientes,
                    SUM(i.ite_quant) as quantidade_vendida
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
                  AND p.ped_situacao IN ('P', 'F')
                  {industria_filter}
            ),
            metricas_anterior AS (
                SELECT 
                    SUM(i.ite_totliquido) as total_vendido,
                    COUNT(DISTINCT p.ped_pedido) as qtd_pedidos,
                    COUNT(DISTINCT p.ped_cliente) as clientes,
                    SUM(i.ite_quant) as quantidade_vendida
                FROM pedidos p
                JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :ano - 1
                  AND p.ped_situacao IN ('P', 'F')
                  {industria_filter}
            )
            SELECT 
                ma.total_vendido as total_vendido_current,
                ma.qtd_pedidos as qtd_pedidos_current,
                ma.clientes as clientes_atendidos_current,
                ma.quantidade_vendida as quantidade_vendida_current,
                CASE WHEN ma.qtd_pedidos > 0 
                     THEN ma.total_vendido / ma.qtd_pedidos 
                     ELSE 0 
                END as ticket_medio_current,
                mp.total_vendido as total_vendido_prev,
                mp.qtd_pedidos as qtd_pedidos_prev,
                mp.clientes as clientes_atendidos_prev,
                mp.quantidade_vendida as quantidade_vendida_prev,
                CASE WHEN mp.qtd_pedidos > 0 
                     THEN mp.total_vendido / mp.qtd_pedidos 
                     ELSE 0 
                END as ticket_medio_prev
            FROM metricas_atual ma
            CROSS JOIN metricas_anterior mp
        """
        params = {"ano": ano}
    
    try:
        df = execute_query(query, params)
        
        if df.empty:
            return {
                "total_vendido_current": 0,
                "qtd_pedidos_current": 0,
                "clientes_atendidos_current": 0,
                "quantidade_vendida_current": 0,
                "vendas_percent_change": 0,
                "pedidos_percent_change": 0,
                "clientes_percent_change": 0,
                "quantidade_percent_change": 0
            }
        
        row = df.iloc[0]
        
        # Calculate percent changes
        def calc_percent_change(current, prev):
            if prev and prev > 0:
                return round(((current - prev) / prev) * 100, 1)
            elif current > 0:
                return 100.0
            return 0.0
        
        curr_vendido = float(row['total_vendido_current'] or 0)
        curr_pedidos = int(row['qtd_pedidos_current'] or 0)
        curr_clientes = int(row['clientes_atendidos_current'] or 0)
        curr_quantidade = int(row['quantidade_vendida_current'] or 0)
        curr_ticket = float(row['ticket_medio_current'] or 0)
        
        prev_vendido = float(row['total_vendido_prev'] or 0)
        prev_pedidos = int(row['qtd_pedidos_prev'] or 0)
        prev_clientes = int(row['clientes_atendidos_prev'] or 0)
        prev_quantidade = int(row['quantidade_vendida_prev'] or 0)
        prev_ticket = float(row['ticket_medio_prev'] or 0)
        
        return {
            "total_vendido_current": curr_vendido,
            "qtd_pedidos_current": curr_pedidos,
            "clientes_atendidos_current": curr_clientes,
            "quantidade_vendida_current": curr_quantidade,
            "ticket_medio_current": curr_ticket,
            "vendas_percent_change": calc_percent_change(curr_vendido, prev_vendido),
            "pedidos_percent_change": calc_percent_change(curr_pedidos, prev_pedidos),
            "clientes_percent_change": calc_percent_change(curr_clientes, prev_clientes),
            "quantidade_percent_change": calc_percent_change(curr_quantidade, prev_quantidade),
            "ticket_percent_change": calc_percent_change(curr_ticket, prev_ticket)
        }
        
    except Exception as e:
        print(f"FAULT: fetch_dashboard_summary failed: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return {
            "total_vendido_current": 0,
            "qtd_pedidos_current": 0,
            "clientes_atendidos_current": 0,
            "quantidade_vendida_current": 0,
            "vendas_percent_change": 0,
            "pedidos_percent_change": 0,
            "clientes_percent_change": 0,
            "quantidade_percent_change": 0
        }
