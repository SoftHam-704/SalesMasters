"""
Data Fetcher Service - Refatorado
Cache simples em memória com TTL para evitar problemas de lru_cache com DataFrames.
"""
import time
import pandas as pd
from services.database import execute_query
from utils.tenant_context import get_tenant_cnpj

# Simple in-memory cache with TTL (5 minutes)
_cache = {}
_CACHE_TTL = 300  # 5 minutos

def _get_cache_key(prefix: str, tenant_id: str, *args) -> str:
    """Gera chave única para o cache"""
    return f"{prefix}_{tenant_id}_{'-'.join(str(a) for a in args)}"

def _get_from_cache(key: str):
    """Retorna dados do cache se não expirado"""
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < _CACHE_TTL:
            return data
        else:
            del _cache[key]
    return None

def _set_cache(key: str, data):
    """Armazena dados no cache com timestamp"""
    _cache[key] = (data.copy() if isinstance(data, pd.DataFrame) else data, time.time())

# --- Fetch Functions ---

def _fetch_faturamento_anual(ano: int, tenant_id: str) -> pd.DataFrame:
    """Busca faturamento anual com cache"""
    cache_key = _get_cache_key("faturamento", tenant_id, ano)
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached.copy()
    
    print(f"--- DB HIT: Fetching Faturamento for {ano} [Tenant: {tenant_id}] ---", flush=True)
    query = """
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as n_mes,
            SUM(i.ite_totliquido) as v_faturamento,
            SUM(i.ite_quant) as q_quantidade
        FROM pedidos p
        INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
        WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
          AND p.ped_situacao IN ('P', 'F')
        GROUP BY 1
        ORDER BY 1
    """
    df = execute_query(query, {"ano": ano})
    
    # Só cachear se tiver dados
    if not df.empty:
        _set_cache(cache_key, df)
    
    return df

def _fetch_metas_anuais(ano: int, tenant_id: str) -> pd.DataFrame:
    """Busca metas anuais com cache"""
    cache_key = _get_cache_key("metas", tenant_id, ano)
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached.copy()
    
    print(f"--- DB HIT: Fetching Metas for {ano} [Tenant: {tenant_id}] ---", flush=True)
    query = """
        SELECT 
            SUM(met_jan) as met_jan, SUM(met_fev) as met_fev, SUM(met_mar) as met_mar,
            SUM(met_abr) as met_abr, SUM(met_mai) as met_mai, SUM(met_jun) as met_jun,
            SUM(met_jul) as met_jul, SUM(met_ago) as met_ago, SUM(met_set) as met_set,
            SUM(met_out) as met_out, SUM(met_nov) as met_nov, SUM(met_dez) as met_dez
        FROM ind_metas
        WHERE met_ano = :ano
    """
    df = execute_query(query, {"ano": ano})
    
    if not df.empty:
        _set_cache(cache_key, df)
    
    return df

def _fetch_metas_progresso(ano: int, tenant_id: str) -> pd.DataFrame:
    """Busca progresso de metas por indústria com cache"""
    cache_key = _get_cache_key("metas_progresso", tenant_id, ano)
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached.copy()
    
    print(f"--- DB HIT: Fetching Metas Progress for {ano} [Tenant: {tenant_id}] ---", flush=True)
    query = """
        WITH vendas_ano AS (
            SELECT 
                p.ped_industria as industria_id,
                SUM(i.ite_totliquido) as total_vendido
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
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
    
    if not df.empty:
        _set_cache(cache_key, df)
    
    return df

def _fetch_available_filters(tenant_id: str) -> dict:
    """Busca filtros disponíveis com cache"""
    cache_key = _get_cache_key("filters", tenant_id)
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached
    
    print(f"--- DB HIT: Fetching Filter Options [Tenant: {tenant_id}] ---", flush=True)
    
    q_ind = "SELECT for_codigo, for_nomered FROM fornecedores ORDER BY for_nomered"
    df_ind = execute_query(q_ind)
    
    q_cli = "SELECT cli_codigo, cli_nomred FROM clientes ORDER BY cli_nomred"
    df_cli = execute_query(q_cli)
    
    q_vend = "SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_nome IS NOT NULL ORDER BY ven_nome"
    df_vend = execute_query(q_vend)
    
    result = {
        "industries": df_ind.to_dict('records') if not df_ind.empty else [],
        "clients": df_cli.to_dict('records') if not df_cli.empty else [],
        "vendedores": df_vend.to_dict('records') if not df_vend.empty else []
    }
    
    # Só cachear se tiver dados
    if result["industries"]:
        _set_cache(cache_key, result)
    
    return result

# --- Public Functions ---

def fetch_faturamento_anual(ano: int) -> pd.DataFrame:
    tenant_id = get_tenant_cnpj() or "default"
    return _fetch_faturamento_anual(ano, tenant_id)

def fetch_metas_anuais(ano: int) -> pd.DataFrame:
    tenant_id = get_tenant_cnpj() or "default"
    return _fetch_metas_anuais(ano, tenant_id)

def fetch_metas_progresso(ano: int) -> pd.DataFrame:
    tenant_id = get_tenant_cnpj() or "default"
    return _fetch_metas_progresso(ano, tenant_id)

def fetch_available_filters():
    tenant_id = get_tenant_cnpj() or "default"
    return _fetch_available_filters(tenant_id)

def clear_cache():
    """Limpa todo o cache em memória"""
    global _cache
    print("--- CACHE CLEARED ---", flush=True)
    _cache = {}

