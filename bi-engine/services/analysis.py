import pandas as pd
from services.database import execute_query

def analyze_pareto(ano: int, metric: str = 'valor', limit: int = 20):
    """
    Calculates Pareto (80/20) distribution for Customers.
    Returns Top N customers with their individual value and cumulative percentage.
    """
    print(f"--- ANALYTICS: Processing Pareto {ano} ({metric}) ---", flush=True)
    
    col_metric = 'i.ite_totliquido' if metric.lower() == 'valor' else 'i.ite_quant'
    
    query = f"""
        SELECT 
            c.cli_nomred as nome,
            SUM({col_metric}) as total
        FROM pedidos p
        JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 1
        ORDER BY 2 DESC
    """
    
    try:
        df = execute_query(query, {"ano": ano})
        
        if df.empty:
            return []
            
        # Ensure total is float
        df['total'] = df['total'].astype(float)
        
        # Calculate Grand Total
        grand_total = df['total'].sum()
        
        # Calculate Cumulative Sum and Percentage
        df['accumulated'] = df['total'].cumsum()
        df['percent_acc'] = (df['accumulated'] / grand_total) * 100
        
        # Take Top N
        top_n = df.head(limit).copy()
        
        # Prepare result
        result = []
        for _, row in top_n.iterrows():
            result.append({
                "name": row['nome'],
                "value": row['total'],
                "percent_acc": round(row['percent_acc'], 1)
            })
            
        return result
        
    except Exception as e:
        print(f"FAULT: Pareto analysis failed: {str(e)}", flush=True)
        return []

def analyze_industry_growth(ano: int, metric: str = 'valor', limit: int = 15):
    """
    Calcula crescimento das indústrias em relação ao ano anterior.
    Retorna: nome, atual, anterior, dif_valor, dif_perc
    """
    col_metric = 'i.ite_totliquido' if metric.lower() == 'valor' else 'i.ite_quant'
    
    query = f"""
        WITH vendas_atual AS (
            SELECT 
                f.for_nomered as nome,
                SUM({col_metric}) as atual
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1
        ),
        vendas_anterior AS (
            SELECT 
                f.for_nomered as nome,
                SUM({col_metric}) as anterior
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE EXTRACT(YEAR FROM p.ped_data) = :ano - 1
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1
        )
        SELECT 
            coalesce(v1.nome, v2.nome) as nome,
            coalesce(v1.atual, 0) as atual,
            coalesce(v2.anterior, 0) as anterior
        FROM vendas_atual v1
        FULL OUTER JOIN vendas_anterior v2 ON v1.nome = v2.nome
        ORDER BY atual DESC
        LIMIT :limit
    """
    
    try:
        df = execute_query(query, {"ano": ano, "limit": limit})
        
        # Calculate variances
        df['atual'] = df['atual'].astype(float)
        df['anterior'] = df['anterior'].astype(float)
        
        df['dif_valor'] = df['atual'] - df['anterior']
        # Avoid division by zero
        df['dif_perc'] = df.apply(lambda row: ((row['atual'] - row['anterior']) / row['anterior'] * 100) if row['anterior'] > 0 else 100, axis=1)
        
        return df.to_dict(orient='records')
        
    except Exception as e:
        print(f"FAULT: Analysis failed: {str(e)}", flush=True)
        return []

