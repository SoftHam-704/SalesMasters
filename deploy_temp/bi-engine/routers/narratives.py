from fastapi import APIRouter, Query
from services.insights import (
    get_oportunidades,
    get_alertas_meta,
    get_top_clientes_mes,
    get_riscos_sugestao,
    generate_insights
)

router = APIRouter(prefix="/api/narratives", tags=["Narratives"])

@router.get("/oportunidades")
async def read_oportunidades(industryId: int = Query(...)):
    """
    Retorna oportunidades de vendas (clientes com queda).
    """
    return {"success": True, "data": get_oportunidades(industryId)}

@router.get("/alerts")
async def read_alerts(industryId: int = Query(...)):
    """
    Retorna alertas de meta.
    """
    return {"success": True, "data": get_alertas_meta(industryId)}

@router.get("/highlights")
async def read_highlights(industryId: int = Query(...)):
    """
    Retorna destaques (top clientes).
    """
    return {"success": True, "data": get_top_clientes_mes(industryId)}

@router.get("/risks")
async def read_risks(industryId: int = Query(...)):
    """
    Retorna riscos (clientes inativos -> sugestão).
    """
    return {"success": True, "data": get_riscos_sugestao(industryId)}

@router.get("/executive-summary")
async def read_summary(industryId: int = Query(None)):
    import time
    start = time.time()
    print(f"REQUEST [GET] /executive-summary (industryId={industryId})", flush=True)
    insights = generate_insights(2025, industryId)
    print(f"RESPONSE /executive-summary - Duration: {time.time() - start:.2f}s", flush=True)
    return {"success": True, "data": insights.get("resumo_executivo", "")}

@router.get("/advanced-analysis")
async def read_advanced_analysis(ano: int = 2025, mes: str = 'Todos'):
    import time
    start = time.time()
    print(f"REQUEST [GET] /advanced-analysis (ano={ano}, mes={mes})", flush=True)
    from services.insights import generate_critical_alerts_ai
    insights = generate_critical_alerts_ai(ano, mes)
    print(f"RESPONSE /advanced-analysis - Duration: {time.time() - start:.2f}s", flush=True)
    return {"success": True, "data": insights}
