"""
Client Dashboard Service
Serviço para análise de desempenho por clientes.
V2 - Performance optimized: No TRIM/EXTRACT on indexed columns, status 'E' included.
"""
from services.database import execute_query
import pandas as pd
from datetime import datetime


def _build_date_filter(ano: int, mes: int = None, startDate: str = None, endDate: str = None, alias: str = "p"):
    """Build date filter using range comparison (index-friendly)."""
    if startDate and endDate:
        return f"{alias}.ped_data BETWEEN '{startDate}' AND '{endDate}'"
    
    if mes:
        # First day of month to last day of month
        return f"{alias}.ped_data >= make_date({ano}, {mes}, 1) AND {alias}.ped_data < (make_date({ano}, {mes}, 1) + INTERVAL '1 month')"
    
    return f"{alias}.ped_data >= make_date({ano}, 1, 1) AND {alias}.ped_data <= make_date({ano}, 12, 31)"


def _build_industry_filter(industry_id: int = None, alias: str = "p"):
    """Build industry filter (integer comparison, no quotes)."""
    if industry_id:
        return f"AND {alias}.ped_industria = {industry_id}"
    return ""


def _status_filter(alias: str = "p"):
    """Standard status filter: P=Pedidos, F=Faturados."""
    return f"{alias}.ped_situacao IN ('P', 'F')"


def get_client_details(ano: int, mes: str, industry_id: int = None, metrica: str = 'valor', uf: str = None, startDate: str = None, endDate: str = None):
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
            "groups": get_client_groups(ano, month_int, industry_id, metrica, startDate, endDate),
            "purchase_cycle": get_purchase_cycle(ano, month_int, industry_id),
            "top_clients": get_top_clients_impact(ano, month_int, industry_id, metrica, startDate, endDate),
            "active_inactive": get_active_vs_inactive(ano, industry_id, uf),
            "no_purchase": get_clients_no_purchase(ano, month_int, industry_id, uf, startDate, endDate),
            "churn_risk": get_churn_risk_clients(ano, month_int, industry_id),
            "store_industry_matrix": get_store_industry_matrix(ano, month_int, metrica, startDate, endDate)
        }
    except Exception as e:
        print(f"ERROR: get_client_details failed: {e}", flush=True)
        return {"success": False, "error": str(e)}


def get_client_groups(ano: int, mes: int = None, industry_id: int = None, metrica: str = 'valor', startDate: str = None, endDate: str = None):
    """
    Análise por grupo de lojas e indústrias.
    Retorna: [{grupo, valor, quantidade}]
    """
    date_filter = _build_date_filter(ano, mes, startDate, endDate)
    industry_filter = _build_industry_filter(industry_id)
    
    query = f"""
        SELECT 
            COALESCE(c.cli_redeloja, c.cli_nomred) as grupo,
            SUM(p.ped_totliq) as valor,
            COALESCE(SUM(i.total_qtd), 0) as quantidade
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        LEFT JOIN (
            SELECT ite_pedido, ite_industria, SUM(ite_quant) as total_qtd
            FROM itens_ped
            GROUP BY ite_pedido, ite_industria
        ) i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
        WHERE {_status_filter()}
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
    """
    industry_filter = _build_industry_filter(industry_id)
    
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
            WHERE {_status_filter()}
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


def get_top_clients_impact(ano: int, mes: int = None, industry_id: int = None, metrica: str = 'valor', startDate: str = None, endDate: str = None):
    """
    Clientes de Maior Impacto: Valor e Variação Mensal.
    Top 10 clientes com valor/quantidade, variação MoM, e última compra.
    """
    date_filter = _build_date_filter(ano, mes, startDate, endDate)
    industry_filter = _build_industry_filter(industry_id)
    
    # Build previous period filter
    if startDate and endDate:
        prev_filter = f"p.ped_data BETWEEN ('{startDate}'::date - INTERVAL '1 year') AND ('{endDate}'::date - INTERVAL '1 year')"
    else:
        if mes:
            prev_mes = mes - 1 if mes > 1 else 12
            prev_ano = ano if mes > 1 else ano - 1
            prev_filter = _build_date_filter(prev_ano, prev_mes)
        else:
            prev_filter = _build_date_filter(ano - 1)
    
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
                SELECT ite_pedido, ite_industria, SUM(ite_quant) as total_qtd
                FROM itens_ped
                GROUP BY ite_pedido, ite_industria
            ) i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE {_status_filter()}
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
                SELECT ite_pedido, ite_industria, SUM(ite_quant) as total_qtd
                FROM itens_ped
                GROUP BY ite_pedido, ite_industria
            ) i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE {_status_filter()}
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
    """
    industry_filter = _build_industry_filter(industry_id)
    
    uf_filter = ""
    if uf and uf != 'Todos':
        uf_filter = f"AND c.cli_uf = '{uf}'"
    
    carteira_query = f"""
        SELECT COUNT(DISTINCT p.ped_cliente) as total_carteira
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE {_status_filter()}
          {industry_filter}
          {uf_filter}
    """
    df_carteira = execute_query(carteira_query)
    total_carteira = int(df_carteira.iloc[0]['total_carteira']) if not df_carteira.empty else 0
    
    date_filter = _build_date_filter(ano)
    query = f"""
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as mes,
            COUNT(DISTINCT p.ped_cliente) as atendidos
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE {_status_filter()}
          AND {date_filter}
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
    
    atendidos_ano_query = f"""
        SELECT COUNT(DISTINCT p.ped_cliente) as total_atendidos
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE {_status_filter()}
          AND {date_filter}
          {industry_filter}
          {uf_filter}
    """
    df_atendidos = execute_query(atendidos_ano_query)
    total_atendidos_ano = int(df_atendidos.iloc[0]['total_atendidos']) if not df_atendidos.empty else 0
    
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


def get_clients_no_purchase(ano: int, mes: int = None, industry_id: int = None, uf: str = None, startDate: str = None, endDate: str = None):
    """
    Clientes sem compras no período.
    """
    date_filter = _build_date_filter(ano, mes, startDate, endDate)
    industry_filter = _build_industry_filter(industry_id)
    
    uf_filter = ""
    if uf and uf != 'Todos':
        uf_filter = f"AND c.cli_uf = '{uf}'"
    
    query = f"""
        WITH carteira AS (
            SELECT DISTINCT p.ped_cliente as cli_codigo, c.cli_nomred
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE {_status_filter()}
              {industry_filter}
              {uf_filter}
        ),
        compradores_periodo AS (
            SELECT DISTINCT p.ped_cliente
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE {_status_filter()}
              AND {date_filter}
              {industry_filter}
              {uf_filter}
        ),
        ultima_compra AS (
            SELECT 
                p.ped_cliente,
                MAX(p.ped_data) as ult_compra
            FROM pedidos p
            WHERE {_status_filter()}
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
    """
    industry_filter = _build_industry_filter(industry_id)
    
    query = f"""
        WITH client_stats AS (
            SELECT 
                p.ped_cliente,
                c.cli_nomred as nome,
                COUNT(DISTINCT p.ped_pedido) as total_pedidos,
                AVG(p.ped_totliq) as ticket_medio,
                MAX(p.ped_data) as ultima_compra,
                (CURRENT_DATE - MAX(p.ped_data)) as dias_sem_compra,
                CASE 
                    WHEN COUNT(*) > 1 THEN
                        (MAX(p.ped_data) - MIN(p.ped_data)) / (COUNT(*) - 1)
                    ELSE 90
                END as frequencia_dias
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE {_status_filter()}
              AND p.ped_data >= make_date({ano - 1}, 1, 1)
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


def get_store_industry_matrix(ano: int, mes: int = None, metrica: str = 'valor', startDate: str = None, endDate: str = None):
    """
    Matriz de Grupos de Lojas x Indústrias.
    """
    date_filter = _build_date_filter(ano, mes, startDate, endDate)
    
    if metrica == 'valor':
        value_column = "SUM(p.ped_totliq)"
        needs_items_join = False
    elif metrica == 'quantidade':
        value_column = "SUM(i.ite_quant)"
        needs_items_join = True
    else:
        value_column = "COUNT(DISTINCT i.ite_idproduto)"
        needs_items_join = True
    
    industries_query = """
        SELECT for_codigo as id, for_nomered as nome
        FROM fornecedores
        WHERE for_tipo2 = 'A'
        ORDER BY for_nomered
    """
    df_industries = execute_query(industries_query)
    
    if df_industries.empty:
        return {"industries": [], "rows": [], "totals": {}}
    
    industries = [{"id": row['id'], "nome": row['nome']} for _, row in df_industries.iterrows()]
    industry_ids = [ind['id'] for ind in industries]
    industry_names = [ind['nome'] for ind in industries]
    
    items_join = "JOIN itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria" if needs_items_join else ""
    
    query = f"""
        SELECT 
            COALESCE(NULLIF(c.cli_redeloja, ''), c.cli_nomred) as grupo,
            p.ped_industria,
            {value_column} as valor
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        {items_join}
        WHERE {_status_filter()}
          AND c.cli_tipopes = 'A'
          AND {date_filter}
        GROUP BY COALESCE(NULLIF(c.cli_redeloja, ''), c.cli_nomred), p.ped_industria
        ORDER BY grupo
    """
    
    df = execute_query(query)
    
    if df.empty:
        return {"industries": industry_names, "rows": [], "totals": {ind: 0 for ind in industry_names}}
    
    id_to_name = {ind['id']: ind['nome'] for ind in industries}
    grupos = df['grupo'].unique()
    
    rows = []
    column_totals = {name: 0.0 for name in industry_names}
    grand_total = 0.0
    
    for grupo in grupos:
        grupo_data = df[df['grupo'] == grupo]
        values = {}
        row_total = 0.0
        
        for ind_id in industry_ids:
            ind_name = id_to_name[ind_id]
            match = grupo_data[grupo_data['ped_industria'] == ind_id]
            if not match.empty:
                val = float(match.iloc[0]['valor'])
            else:
                val = 0.0
            
            values[ind_name] = val
            row_total += val
            column_totals[ind_name] += val
        
        grand_total += row_total
        
        rows.append({
            "grupo": grupo,
            "values": values,
            "total": row_total
        })
    
    rows.sort(key=lambda x: x['total'], reverse=True)
    rows = rows[:20]
    
    column_totals['total'] = grand_total
    
    return {
        "industries": industry_names,
        "rows": rows,
        "totals": column_totals
    }


def get_client_monthly_evolution(ano: int, industry_id: int = None, metrica: str = 'valor', vendedor_id = None):
    """
    Retorna matriz de evolução mensal por cliente.
    """
    print(f"DEBUG Evolution: ano={ano}, industry_id={industry_id}, metrica={metrica}, vendedor_id={vendedor_id} (type={type(vendedor_id)})", flush=True)
    
    try:
        industry_filter = _build_industry_filter(industry_id)
        
        vendedor_filter = ""
        if vendedor_id and str(vendedor_id) not in ['Todos', 'None', '']:
            try:
                ven_id = int(vendedor_id)
                vendedor_filter = f"AND p.ped_vendedor = {ven_id}"
                print(f"DEBUG: Filtering by vendedor = {ven_id}", flush=True)
            except (ValueError, TypeError):
                print(f"DEBUG: Could not parse vendedor_id: {vendedor_id}", flush=True)
            
        date_filter = _build_date_filter(ano)
        
        if metrica == 'valor':
            value_column = "SUM(p.ped_totliq)"
            join_clause = ""
        else:
            value_column = "SUM(i.ite_quant)"
            join_clause = "JOIN itens_ped i ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria"
            
        query = f"""
            SELECT 
                c.cli_nomred,
                c.cli_cnpj,
                EXTRACT(MONTH FROM p.ped_data) as mes,
                EXTRACT(YEAR FROM p.ped_data) as ano_ped,
                {value_column} as valor
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            {join_clause}
            WHERE {_status_filter()}
              AND {date_filter}
              {industry_filter}
              {vendedor_filter}
            GROUP BY c.cli_nomred, c.cli_cnpj, EXTRACT(YEAR FROM p.ped_data), EXTRACT(MONTH FROM p.ped_data)
            ORDER BY c.cli_nomred, ano_ped, mes
        """
        
        print(f"DEBUG Query: {query[:200]}...", flush=True)
        df = execute_query(query)
        print(f"DEBUG Result: {len(df)} rows", flush=True)
        
        columns = [f"{str(m).zfill(2)}/{ano}" for m in range(1, 13)]
        
        if df.empty:
            print("DEBUG: DataFrame empty, returning empty result", flush=True)
            return {"columns": columns, "rows": [], "year": ano}
            
        df['cliente_label'] = df['cli_nomred'].str.strip() + " (" + df['cli_cnpj'].str.strip() + ")"
        df['col_label'] = df['mes'].apply(lambda x: f"{str(int(x)).zfill(2)}/{ano}")
        
        matrix = df.pivot_table(
            index='cliente_label', 
            columns='col_label', 
            values='valor', 
            aggfunc='sum'
        ).fillna(0)
        
        for col in columns:
            if col not in matrix.columns:
                matrix[col] = 0.0
        
        matrix = matrix[columns]
        
        rows = []
        for label, row_values in matrix.iterrows():
            values = row_values.to_dict()
            total = sum(values.values())
            
            if total > 0:
                rows.append({
                    "cliente": label,
                    "values": values,
                    "total": total
                })
        
        rows.sort(key=lambda x: x['total'], reverse=True)
        
        return {
            "columns": columns,
            "rows": rows,
            "year": ano
        }
    except Exception as e:
        print(f"ERROR: Evolution Matrix failed: {e}", flush=True)
        return {"success": False, "error": str(e)}
