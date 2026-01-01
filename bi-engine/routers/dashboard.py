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
from services.insights import generate_insights

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
async def get_summary():
    """
    Retorna resumo geral do dashboard (placeholder).
    """
    return {
        "success": True,
        "data": [],
        "total": 0,
        "message": "Endpoint de summary - aguardando implementação"
    }

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
