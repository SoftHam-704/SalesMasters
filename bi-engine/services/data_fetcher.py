from functools import lru_cache
import pandas as pd
from services.database import execute_query

@lru_cache(maxsize=32)
def fetch_faturamento_anual(ano: int) -> pd.DataFrame:
    """
    Busca dados de faturamento e quantidade para um ano específico, agrupados por mês.
    Cacheado para evitar queries repetitivas.
    """
    print(f"--- DB HIT: Fetching Faturamento/Mac for {ano} ---", flush=True)
    query = """
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as n_mes,
            SUM(i.ite_totliquido) as v_faturamento,
            SUM(i.ite_quant) as q_quantidade
        FROM pedidos p
        INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
        WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 1
        ORDER BY 1
    """
    df = execute_query(query, {"ano": ano})
    return df

@lru_cache(maxsize=32)
def fetch_metas_anuais(ano: int) -> pd.DataFrame:
    """
    Busca dados de metas para um ano específico.
    Cacheado para performance.
    """
    print(f"--- DB HIT: Fetching Metas for {ano} ---")
    query = """
        SELECT 
            SUM(met_jan) as m1, SUM(met_fev) as m2, SUM(met_mar) as m3,
            SUM(met_abr) as m4, SUM(met_mai) as m5, SUM(met_jun) as m6,
            SUM(met_jul) as m7, SUM(met_ago) as m8, SUM(met_set) as m9,
            SUM(met_out) as m10, SUM(met_nov) as m11, SUM(met_dez) as m12
        FROM ind_metas
        WHERE met_ano = :ano
    """
    df = execute_query(query, {"ano": ano})
    return df

def clear_cache():
    """Limpa o cache das funções (útil para reload de dados)"""
    fetch_faturamento_anual.cache_clear()
    fetch_metas_anuais.cache_clear()

@lru_cache(maxsize=32)
def fetch_metas_progresso(ano: int) -> pd.DataFrame:
    """
    Busca o progresso de vendas x metas por indústria para todo o ano.
    Retorna: [industria_nome, total_vendas, total_meta, percentual]
    """
    print(f"--- DB HIT: Fetching Metas Progress for {ano} ---", flush=True)
    query = """
        WITH vendas_ano AS (
            SELECT 
                p.ped_industria as industria_id,
                SUM(i.ite_totliquido) as total_vendido
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY 1
        ),
        metas_ano AS (
            SELECT 
                met_industria as industria_id,
                (COALESCE(met_jan,0) + COALESCE(met_fev,0) + COALESCE(met_mar,0) + 
                 COALESCE(met_abr,0) + COALESCE(met_mai,0) + COALESCE(met_jun,0) + 
                 COALESCE(met_jul,0) + COALESCE(met_ago,0) + COALESCE(met_set,0) + 
                 COALESCE(met_out,0) + COALESCE(met_nov,0) + COALESCE(met_dez,0)) as total_meta
            FROM ind_metas
            WHERE met_ano = :ano
        )
        SELECT 
            f.for_nomered as industria,
            COALESCE(v.total_vendido, 0) as total_vendas,
            COALESCE(m.total_meta, 0) as total_meta
        FROM fornecedores f
        JOIN metas_ano m ON f.for_codigo = m.industria_id
        LEFT JOIN vendas_ano v ON f.for_codigo = v.industria_id
        WHERE m.total_meta > 0
        ORDER BY f.for_nomered
    """
    df = execute_query(query, {"ano": ano})
    return df
