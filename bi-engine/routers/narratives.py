from fastapi import APIRouter, Query
from services.insights import (
    get_oportunidades,
    get_alertas_meta,
    get_top_clientes_mes,
    get_clientes_inativos,
    generate_resumo_executivo
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
    Retorna riscos (clientes inativos).
    """
    return {"success": True, "data": get_clientes_inativos(industryId)}

@router.get("/executive-summary")
async def read_summary(industryId: int = Query(...)):
    """
    Retorna resumo executivo consolidado.
    """
    return {"success": True, "data": generate_resumo_executivo(industryId)}
