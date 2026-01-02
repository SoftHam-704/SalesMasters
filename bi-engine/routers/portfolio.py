# bi-engine/routers/portfolio.py
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.portfolio_analyzer import analyzer

router = APIRouter(prefix="/api/portfolio", tags=["Portfolio ABC"])

@router.get("/analyze")
async def analyze_portfolio(
    ano: int = Query(..., description="Ano para análise"),
    industria: int = Query(..., description="Código da indústria"),
    mes: Optional[int] = Query(None, description="Mês (1-12) ou NULL para ano completo")
):
    """
    Análise completa do portfólio ABC
    
    Retorna:
    - Resumo por curva (A, B, C, OFF)
    - Percentuais de itens e faturamento
    - Recomendações estratégicas
    - Estatísticas do período
    """
    try:
        result = analyzer.analyze_portfolio(ano, mes, industria)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao processar análise: {str(e)}")

@router.get("/produtos/{curva}")
async def get_produtos_por_curva(
    curva: str,
    ano: int = Query(..., description="Ano"),
    industria: int = Query(..., description="Código da indústria"),
    mes: Optional[int] = Query(None, description="Mês"),
    limit: int = Query(100, ge=1, le=500, description="Limite de resultados")
):
    """
    Lista detalhada de produtos de uma curva específica
    
    Curvas válidas: A, B, C, OFF
    """
    if curva.upper() not in ['A', 'B', 'C', 'OFF']:
        raise HTTPException(status_code=400, detail="Curva inválida. Use: A, B, C ou OFF")
    
    try:
        produtos = analyzer.get_produtos_detalhados(
            ano=ano,
            mes=mes,
            industria_codigo=industria,
            curva=curva.upper(),
            limit=limit
        )
        
        return {
            "success": True,
            "curva": curva.upper(),
            "total": len(produtos),
            "produtos": produtos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar produtos: {str(e)}")

@router.get("/industrias")
async def get_industrias():
    """
    Lista todas as indústrias ativas disponíveis
    
    Retorna apenas indústrias com for_tipo2 = 'A'
    """
    try:
        industrias = analyzer.get_industrias_disponiveis()
        
        return {
            "success": True,
            "total": len(industrias),
            "industrias": industrias
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar indústrias: {str(e)}")

@router.get("/health")
async def health_check():
    """
    Verifica se o módulo Portfolio está funcionando
    """
    return {
        "status": "ok",
        "module": "Portfolio ABC Analyzer",
        "version": "1.0.0"
    }
