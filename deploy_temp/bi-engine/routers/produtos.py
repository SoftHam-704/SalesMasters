
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from services.database import get_current_engine
from datetime import datetime

def get_db_connection():
    return get_current_engine().raw_connection()

router = APIRouter(prefix="/api/produtos", tags=["produtos"])

@router.get("/ranking")
async def get_produtos_ranking(
    ano: int = Query(..., description="Ano de análise"),
    mes: Optional[int] = Query(None, description="Mês específico (deprecated)"),
    mes_inicio: Optional[int] = Query(None, description="Mês inicial"),
    mes_fim: Optional[int] = Query(None, description="Mês final"),
    industria: Optional[int] = None,
    cliente: Optional[int] = None
):
    """
    Retorna o ranking de produtos com curva ABC baseada em quantidade.
    """
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        # Prioriza mes_inicio/fim, senão usa mes, senão default ano todo
        start = mes_inicio if mes_inicio else (mes if mes else 1)
        end = mes_fim if mes_fim else (mes if mes else 12)
        
        cur.execute("""
            SELECT * FROM fn_produtos_ranking(
                %s, %s, %s, %s, %s
            )
        """, (ano, start, end, industria, cliente))
        
        rows = cur.fetchall()
        
        # Convert rows to dict list
        results = []
        for row in rows:
            results.append({
                "id": row[0],
                "codigo": row[1],
                "nome": row[2],
                "grupo_codigo": row[3],
                "grupo_nome": row[4],
                "qtd": float(row[5]) if row[5] else 0,
                "perc_acumulado": float(row[6]) if row[6] else 0,
                "abc": row[7],
                "ranking": row[8]
            })
            
        return results
        
    except Exception as e:
        print(f"Erro ao buscar ranking de produtos: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/{produto_id}/clientes")
async def get_produtos_clientes(
    produto_id: int,
    compraram: bool = Query(..., description="True para quem comprou, False para quem não comprou"),
    ano: Optional[int] = None,
    mes_inicio: Optional[int] = Query(1, description="Mês inicial"),
    mes_fim: Optional[int] = Query(12, description="Mês final")
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        cur.execute("SELECT * FROM fn_produtos_clientes(%s, %s, %s, %s, %s)", 
                   (produto_id, compraram, ano, mes_inicio, mes_fim))
        
        rows = cur.fetchall()
        return [{
            "cliente_codigo": row[0],
            "cliente_nome": row[1],
            "qtd": float(row[2]) if row[2] else 0,
            "ultima_compra": row[3],
            "status": row[4]
        } for row in rows]
    except Exception as e:
        print(f"Erro ao buscar clientes do produto: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/familia-ranking")
async def get_familia_ranking(
    ano: int,
    mes: Optional[int] = None,
    mes_inicio: Optional[int] = None,
    mes_fim: Optional[int] = None,
    industria: Optional[int] = None
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        
        start = mes_inicio if mes_inicio else (mes if mes else 1)
        end = mes_fim if mes_fim else (mes if mes else 12)
        
        cur.execute("SELECT * FROM fn_produtos_familias(%s, %s, %s, %s, NULL)", 
                   (ano, start, end, industria))
        
        rows = cur.fetchall()
        return [{
            "codigo": row[0],
            "nome": row[1],
            "qtd": float(row[2]) if row[2] else 0,
            "skus": row[3],
            "percentual": float(row[4]) if row[4] else 0
        } for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/portfolio-vs-vendas")
async def get_portfolio_vs_vendas(
    ano: int,
    industria: Optional[int] = None
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fn_produtos_portfolio_vendas(%s, %s)", (ano, industria))
        rows = cur.fetchall()
        
        return [{
            "mes": row[0],
            "mes_nome": row[1],
            "portfolio": row[2],
            "vendidos": row[3],
            "percentual": float(row[4]) if row[4] else 0
        } for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.get("/{produto_id}/desempenho-mensal")
async def get_produto_desempenho(
    produto_id: int,
    ano: int
):
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fn_produtos_desempenho_mensal(%s, %s)", (produto_id, ano))
        rows = cur.fetchall()
        
        return [{
            "mes": row[0],
            "mes_nome": row[1],
            "atual": float(row[2]) if row[2] else 0,
            "anterior": float(row[3]) if row[3] else 0,
            "variacao": float(row[4]) if row[4] else 0
        } for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()
