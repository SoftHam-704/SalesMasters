"""
Service: Top Industries
Retorna TOP N indústrias por faturamento ou quantidade.
Usado no Bubble Chart da IntelligencePage.
"""
import pandas as pd
from services.database import execute_query


def fetch_top_industries(ano: int, mes: str = 'Todos', metrica: str = 'valor', limit: int = 6, startDate: str = None, endDate: str = None):
    """
    Retorna as TOP N indústrias com maior faturamento ou quantidade.
    
    Args:
        ano: Ano de referência
        mes: Mês ('01'-'12') ou 'Todos' para ano inteiro
        metrica: 'valor' (faturamento) ou 'quantidade'
        limit: Número de indústrias (default 6)
        startDate: Data inicial 'YYYY-MM-DD'
        endDate: Data final 'YYYY-MM-DD'
    """
    print(f"--- BI: Fetching TOP {limit} Industries ({ano}/{mes}) range={startDate}:{endDate} metrica={metrica} ---", flush=True)
    
    # Build Date Filter
    if startDate and endDate:
        date_filter = f"p.ped_data BETWEEN :startDate AND :endDate"
    else:
        date_filter = f"EXTRACT(YEAR FROM p.ped_data) = :ano"
        if mes and mes != 'Todos':
            date_filter += f" AND EXTRACT(MONTH FROM p.ped_data) = {int(mes)}"
    
    query = f"""
        WITH vendas_industria AS (
            SELECT 
                f.for_codigo as codigo,
                f.for_nomered as nome,
                f.for_homepage as imagem_url,
                SUM(i.ite_totliquido) as total_vendas,
                SUM(i.ite_quant) as total_quantidade,
                COUNT(DISTINCT p.ped_pedido) as total_pedidos
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            JOIN fornecedores f ON p.ped_industria = f.for_codigo
            WHERE {date_filter}
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY f.for_codigo, f.for_nomered, f.for_homepage
        ),
        total_geral AS (
            SELECT SUM(total_vendas) as grand_total_vendas,
                   SUM(total_quantidade) as grand_total_quantidade
            FROM vendas_industria
        )
        SELECT 
            vi.codigo,
            vi.nome,
            vi.imagem_url,
            vi.total_vendas,
            vi.total_quantidade,
            vi.total_pedidos,
            CASE 
                WHEN tg.grand_total_vendas > 0 
                THEN ROUND((vi.total_vendas / tg.grand_total_vendas * 100)::numeric, 2)
                ELSE 0 
            END as percentual
        FROM vendas_industria vi
        CROSS JOIN total_geral tg
        ORDER BY 
            CASE WHEN :metrica = 'quantidade' THEN vi.total_quantidade ELSE vi.total_vendas END DESC
        LIMIT :limit
    """
    
    try:
        df = execute_query(query, {"ano": ano, "metrica": metrica, "limit": limit, "startDate": startDate, "endDate": endDate})
        
        if df.empty:
            return []
        
        # Convert to list of dicts with ranking
        result = []
        for idx, row in df.iterrows():
            try:
                # Use pd.to_numeric or safe defaults
                total_vendas = float(row.get('total_vendas', 0) if pd.notna(row.get('total_vendas')) else 0)
                total_quantidade = float(row.get('total_quantidade', 0) if pd.notna(row.get('total_quantidade')) else 0)
                total_pedidos = int(row.get('total_pedidos', 0) if pd.notna(row.get('total_pedidos')) else 0)
                
                result.append({
                    "codigo": int(row['codigo']) if pd.notna(row.get('codigo')) else 0,
                    "nome": row.get('nome', 'N/A'),
                    "imagem_url": row.get('imagem_url') if pd.notna(row.get('imagem_url')) else None,
                    "total_vendas": total_vendas,
                    "total_quantidade": total_quantidade,
                    "total_pedidos": total_pedidos,
                    "percentual": str(row.get('percentual', '0')),
                    "ranking": idx + 1
                })
            except Exception as e:
                print(f"⚠️ [TOP INDUSTRIES] Error processing row {idx}: {e}", flush=True)
                continue
        
        return result
        
    except Exception as e:
        print(f"FAULT: fetch_top_industries failed: {str(e)}", flush=True)
        import traceback
        traceback.print_exc()
        return []
