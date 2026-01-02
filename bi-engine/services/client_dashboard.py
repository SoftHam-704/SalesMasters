"""
Client Dashboard Service
Serviço para análise de desempenho por clientes.
"""
from services.database import execute_query
import pandas as pd
from datetime import datetime


def get_client_details(ano: int, mes: str, industry_id: int = None, metrica: str = 'valor', uf: str = None):
    """
    Retorna todos os dados agregados para o dashboard de clientes.
    """
    try:
        month_int = None
        if mes and mes != 'Todos':
            try:
                month_int = int(mes)
            except:
                pass

        return {
            "success": True,
            "groups": get_client_groups(ano, month_int, industry_id, metrica),
            "purchase_cycle": get_purchase_cycle(ano, month_int, industry_id),
            "top_clients": get_top_clients_impact(ano, month_int, industry_id, metrica),
            "active_inactive": get_active_vs_inactive(ano, industry_id, uf),
            "no_purchase": get_clients_no_purchase(ano, month_int, industry_id, uf),
            "churn_risk": get_churn_risk_clients(ano, month_int, industry_id)
        }
    except Exception as e:
        print(f"ERROR: get_client_details failed: {e}", flush=True)
        return {"success": False, "error": str(e)}


def get_client_groups(ano: int, mes: int = None, industry_id: int = None, metrica: str = 'valor'):
    """
    Análise por grupo de lojas e indústrias.
    Retorna: [{grupo, valor, quantidade}]
    """
    date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
    if mes:
        date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
    
    industry_filter = ""
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    query = f"""
        SELECT 
            COALESCE(c.cli_redeloja, c.cli_nomred) as grupo,
            SUM(p.ped_totliq) as valor,
            COALESCE(SUM(i.total_qtd), 0) as quantidade
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        LEFT JOIN (
            SELECT ite_pedido, SUM(ite_quant) as total_qtd
            FROM itens_ped
            GROUP BY ite_pedido
        ) i ON p.ped_pedido = i.ite_pedido
        WHERE p.ped_situacao IN ('P', 'F')
          AND {date_filter}
          {industry_filter}
        GROUP BY COALESCE(c.cli_redeloja, c.cli_nomred)
        ORDER BY SUM(p.ped_totliq) DESC
        LIMIT 15
    """
    
    df = execute_query(query)
    if df.empty:
        return []
    
    return [
        {
            "grupo": row['grupo'],
            "valor": float(row['valor']) if row['valor'] else 0,
            "quantidade": int(row['quantidade']) if row['quantidade'] else 0
        }
        for _, row in df.iterrows()
    ]


def get_purchase_cycle(ano: int, mes: int = None, industry_id: int = None):
    """
    Comportamento de Compra: Ciclo Médio.
    Retorna clientes com ciclo médio e dias sem comprar.
    Ordenado DESC por dias sem comprar (priorizar quem está há mais tempo).
    """
    industry_filter = ""
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    query = f"""
        WITH client_stats AS (
            SELECT 
                p.ped_cliente,
                c.cli_nomred as nome,
                COUNT(DISTINCT p.ped_pedido) as total_pedidos,
                MAX(p.ped_data) as ultima_compra,
                (CURRENT_DATE - MAX(p.ped_data)) as dias_sem_compra,
                CASE 
                    WHEN COUNT(*) > 1 THEN
                        (MAX(p.ped_data) - MIN(p.ped_data)) / NULLIF(COUNT(*) - 1, 0)
                    ELSE NULL
                END as ciclo_medio
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
              {industry_filter}
            GROUP BY p.ped_cliente, c.cli_nomred
            HAVING COUNT(DISTINCT p.ped_pedido) >= 2
        )
        SELECT 
            nome,
            total_pedidos as pedidos,
            COALESCE(ciclo_medio, 0) as ciclo,
            dias_sem_compra
        FROM client_stats
        ORDER BY dias_sem_compra DESC
        LIMIT 10
    """
    
    df = execute_query(query)
    if df.empty:
        return []
    
    return [
        {
            "cliente": row['nome'],
            "pedidos": int(row['pedidos']),
            "ciclo": int(row['ciclo']) if row['ciclo'] else 0,
            "dias_sem_compra": int(row['dias_sem_compra']) if row['dias_sem_compra'] else 0
        }
        for _, row in df.iterrows()
    ]


def get_top_clients_impact(ano: int, mes: int = None, industry_id: int = None, metrica: str = 'valor'):
    """
    Clientes de Maior Impacto: Valor e Variação Mensal.
    Top 10 clientes com valor/quantidade, variação MoM, e última compra.
    """
    date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
    if mes:
        date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
    
    industry_filter = ""
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    # Período anterior para MoM
    if mes:
        prev_mes = mes - 1 if mes > 1 else 12
        prev_ano = ano if mes > 1 else ano - 1
        prev_filter = f"EXTRACT(YEAR FROM p.ped_data) = {prev_ano} AND EXTRACT(MONTH FROM p.ped_data) = {prev_mes}"
    else:
        prev_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano - 1}"
    
    value_column = "SUM(p.ped_totliq)" if metrica == 'valor' else "COALESCE(SUM(i.total_qtd), 0)"
    
    query = f"""
        WITH current_period AS (
            SELECT 
                p.ped_cliente,
                c.cli_nomred as nome,
                {value_column} as valor,
                MAX(p.ped_data) as ultima_compra
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            LEFT JOIN (
                SELECT ite_pedido, SUM(ite_quant) as total_qtd
                FROM itens_ped
                GROUP BY ite_pedido
            ) i ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_situacao IN ('P', 'F')
              AND {date_filter}
              {industry_filter}
            GROUP BY p.ped_cliente, c.cli_nomred
        ),
        prev_period AS (
            SELECT 
                p.ped_cliente,
                {value_column} as valor_prev
            FROM pedidos p
            LEFT JOIN (
                SELECT ite_pedido, SUM(ite_quant) as total_qtd
                FROM itens_ped
                GROUP BY ite_pedido
            ) i ON p.ped_pedido = i.ite_pedido
            WHERE p.ped_situacao IN ('P', 'F')
              AND {prev_filter}
              {industry_filter}
            GROUP BY p.ped_cliente
        )
        SELECT 
            cp.nome,
            cp.valor,
            COALESCE(pp.valor_prev, 0) as valor_prev,
            cp.ultima_compra
        FROM current_period cp
        LEFT JOIN prev_period pp ON cp.ped_cliente = pp.ped_cliente
        ORDER BY cp.valor DESC
        LIMIT 10
    """
    
    df = execute_query(query)
    if df.empty:
        return []
    
    result = []
    for idx, row in df.iterrows():
        valor = float(row['valor']) if row['valor'] else 0
        valor_prev = float(row['valor_prev']) if row['valor_prev'] else 0
        
        # Calcular variação MoM
        if valor_prev > 0:
            delta_mom = ((valor - valor_prev) / valor_prev) * 100
        elif valor > 0:
            delta_mom = 100.0
        else:
            delta_mom = 0.0
        
        result.append({
            "rank": idx + 1,
            "cliente": row['nome'],
            "valor": valor,
            "delta_mom": round(delta_mom, 2),
            "ultima_compra": row['ultima_compra'].strftime('%d/%m/%Y') if row['ultima_compra'] else None
        })
    
    return result


def get_active_vs_inactive(ano: int, industry_id: int = None, uf: str = None):
    """
    Clientes Ativos vs Inativos por ano e mês.
    Carteira = clientes únicos que já compraram historicamente (pedidos P,F).
    Atendidos = clientes que compraram no período com filtros.
    Sem compra = carteira - atendidos.
    """
    industry_filter = ""
    uf_filter = ""
    
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    if uf and uf != 'Todos':
        uf_filter = f"AND c.cli_uf = '{uf}'"
    
    # 1. Carteira = clientes únicos que já compraram historicamente (com filtros de indústria e UF)
    carteira_query = f"""
        SELECT COUNT(DISTINCT p.ped_cliente) as total_carteira
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_situacao IN ('P', 'F')
          {industry_filter}
          {uf_filter}
    """
    df_carteira = execute_query(carteira_query)
    total_carteira = int(df_carteira.iloc[0]['total_carteira']) if not df_carteira.empty else 0
    
    # 2. Clientes atendidos por mês no ano selecionado
    query = f"""
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as mes,
            COUNT(DISTINCT p.ped_cliente) as atendidos
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = {ano}
          {industry_filter}
          {uf_filter}
        GROUP BY EXTRACT(MONTH FROM p.ped_data)
        ORDER BY 1
    """
    
    df = execute_query(query)
    
    months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
              'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    
    monthly_data = []
    data_map = {int(row['mes']): int(row['atendidos']) for _, row in df.iterrows()} if not df.empty else {}
    
    for i in range(1, 13):
        atendidos = data_map.get(i, 0)
        sem_compra = total_carteira - atendidos if total_carteira > atendidos else 0
        
        monthly_data.append({
            "mes": months[i-1],
            "mes_num": i,
            "clientes_ind": total_carteira,
            "atendidos": atendidos,
            "sem_compra": sem_compra
        })
    
    # Total atendidos únicos no ano (não soma de meses, pois cliente pode aparecer em vários meses)
    atendidos_ano_query = f"""
        SELECT COUNT(DISTINCT p.ped_cliente) as total_atendidos
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_situacao IN ('P', 'F')
          AND EXTRACT(YEAR FROM p.ped_data) = {ano}
          {industry_filter}
          {uf_filter}
    """
    df_atendidos = execute_query(atendidos_ano_query)
    total_atendidos_ano = int(df_atendidos.iloc[0]['total_atendidos']) if not df_atendidos.empty else 0
    
    # 3. Lista de UFs disponíveis para filtro (direto da tabela clientes)
    ufs_query = """
        SELECT DISTINCT UPPER(cli_uf) as uf
        FROM clientes
        WHERE cli_uf IS NOT NULL
          AND cli_uf != ''
        ORDER BY 1
    """
    df_ufs = execute_query(ufs_query)
    ufs_disponiveis = [row['uf'] for _, row in df_ufs.iterrows()] if not df_ufs.empty else []
    
    return {
        "ano": ano,
        "total_carteira": total_carteira,
        "total_atendidos": total_atendidos_ano,
        "sem_compra_total": total_carteira - total_atendidos_ano,
        "monthly": monthly_data,
        "ufs_disponiveis": ufs_disponiveis,
        "uf_selecionado": uf
    }


def get_clients_no_purchase(ano: int, mes: int = None, industry_id: int = None, uf: str = None):
    """
    Clientes sem compras no período.
    Carteira = clientes que já compraram historicamente.
    Retorna quem da carteira não comprou no período selecionado.
    """
    date_filter = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
    if mes:
        date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {mes}"
    
    industry_filter = ""
    uf_filter = ""
    
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    if uf and uf != 'Todos':
        uf_filter = f"AND c.cli_uf = '{uf}'"
    
    query = f"""
        WITH carteira AS (
            -- Clientes que já compraram historicamente (com filtros de indústria e UF)
            SELECT DISTINCT p.ped_cliente as cli_codigo, c.cli_nomred
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
              {industry_filter}
              {uf_filter}
        ),
        compradores_periodo AS (
            -- Clientes que compraram no período selecionado
            SELECT DISTINCT p.ped_cliente
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
              AND {date_filter}
              {industry_filter}
              {uf_filter}
        ),
        ultima_compra AS (
            SELECT 
                p.ped_cliente,
                MAX(p.ped_data) as ult_compra
            FROM pedidos p
            WHERE p.ped_situacao IN ('P', 'F')
              {industry_filter}
            GROUP BY p.ped_cliente
        )
        SELECT 
            ca.cli_codigo as id,
            ca.cli_nomred as nome,
            uc.ult_compra,
            (CURRENT_DATE - uc.ult_compra) as dias_sem_compra
        FROM carteira ca
        LEFT JOIN compradores_periodo cp ON ca.cli_codigo = cp.ped_cliente
        LEFT JOIN ultima_compra uc ON ca.cli_codigo = uc.ped_cliente
        WHERE cp.ped_cliente IS NULL
        ORDER BY uc.ult_compra DESC NULLS LAST
    """
    
    df = execute_query(query)
    if df.empty:
        return []
    
    return [
        {
            "id": row['id'],
            "nome": row['nome'],
            "ultima_compra": row['ult_compra'].strftime('%d/%m/%Y') if row['ult_compra'] else None,
            "dias_sem_compra": int(row['dias_sem_compra']) if row['dias_sem_compra'] else None
        }
        for _, row in df.iterrows()
    ]


def get_churn_risk_clients(ano: int, mes: int = None, industry_id: int = None):
    """
    Risco de Perda de Clientes e Impacto Financeiro.
    Calcula score de churn baseado em:
    - Dias sem compra vs frequência habitual
    - Ticket médio (impacto financeiro)
    
    Score: 🔴 Alto (>90 dias ou 2x freq), 🟡 Médio (45-90), 🟢 Baixo (<45)
    """
    industry_filter = ""
    if industry_id:
        industry_filter = f"AND p.ped_industria = {industry_id}"
    
    query = f"""
        WITH client_stats AS (
            SELECT 
                p.ped_cliente,
                c.cli_nomred as nome,
                COUNT(DISTINCT p.ped_pedido) as total_pedidos,
                AVG(p.ped_totliq) as ticket_medio,
                MAX(p.ped_data) as ultima_compra,
                (CURRENT_DATE - MAX(p.ped_data)) as dias_sem_compra,
                -- Frequência: dias entre primeira e última compra / número de pedidos
                CASE 
                    WHEN COUNT(*) > 1 THEN
                        (MAX(p.ped_data) - MIN(p.ped_data)) / (COUNT(*) - 1)
                    ELSE 90
                END as frequencia_dias
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
              AND EXTRACT(YEAR FROM p.ped_data) >= {ano - 1}
              {industry_filter}
            GROUP BY p.ped_cliente, c.cli_nomred
            HAVING COUNT(DISTINCT p.ped_pedido) >= 2
        )
        SELECT 
            nome as cliente,
            dias_sem_compra,
            ROUND(frequencia_dias::numeric) as frequencia,
            ROUND(ticket_medio::numeric, 2) as ticket,
            CASE 
                WHEN dias_sem_compra > 90 OR dias_sem_compra > frequencia_dias * 2 THEN 'Alto'
                WHEN dias_sem_compra > 45 OR dias_sem_compra > frequencia_dias * 1.5 THEN 'Medio'
                ELSE 'Baixo'
            END as score
        FROM client_stats
        WHERE dias_sem_compra > 30
        ORDER BY 
            CASE 
                WHEN dias_sem_compra > 90 OR dias_sem_compra > frequencia_dias * 2 THEN 1
                WHEN dias_sem_compra > 45 OR dias_sem_compra > frequencia_dias * 1.5 THEN 2
                ELSE 3
            END,
            ticket_medio DESC
        LIMIT 15
    """
    
    df = execute_query(query)
    if df.empty:
        return []
    
    return [
        {
            "cliente": row['cliente'],
            "dias_sem_compra": int(row['dias_sem_compra']) if row['dias_sem_compra'] else 0,
            "frequencia": int(row['frequencia']) if row['frequencia'] else 0,
            "ticket": float(row['ticket']) if row['ticket'] else 0,
            "score": row['score']
        }
        for _, row in df.iterrows()
    ]
