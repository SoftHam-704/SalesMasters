"""
Equipe Router - Dashboard de Colaboradores
Endpoints para análise de performance de vendedores
"""
from fastapi import APIRouter
from services.database import execute_query
import traceback

router = APIRouter(prefix="/api/equipe", tags=["Equipe"])


@router.get("/vendedores")
async def get_vendedores():
    """Retorna lista de vendedores para filtro"""
    try:
        query = "SELECT ven_codigo, ven_nome FROM vendedores ORDER BY ven_nome"
        df = execute_query(query, {})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /vendedores: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/performance")
async def get_performance(ano: int, mes: int, vendedor: int = None):
    """Retorna ranking de performance dos vendedores"""
    try:
        query = "SELECT * FROM fn_vendedores_performance(:ano, :mes, :vendedor)"
        df = execute_query(query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /performance: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/clientes-risco")
async def get_clientes_risco(vendedor: int = None, dias: int = 60):
    """Retorna clientes em risco por vendedor"""
    try:
        query = "SELECT * FROM fn_vendedores_clientes_risco(:vendedor, :dias)"
        df = execute_query(query, {"vendedor": vendedor, "dias": dias})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /clientes-risco: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/historico-mensal")
async def get_historico_mensal(vendedor: int, meses: int = 12):
    """Retorna histórico mensal de vendas do vendedor"""
    try:
        query = "SELECT * FROM fn_vendedores_historico_mensal(:vendedor, :meses)"
        df = execute_query(query, {"vendedor": vendedor, "meses": meses})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /historico-mensal: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/interacoes-crm")
async def get_interacoes_crm(ano: int, mes: int, vendedor: int = None):
    """Retorna análise de interações CRM por vendedor"""
    try:
        query = "SELECT * FROM fn_vendedores_interacoes_crm(:ano, :mes, :vendedor)"
        df = execute_query(query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /interacoes-crm: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/ia-insights")
async def get_ia_insights(vendedor: int, ano: int, mes: int):
    """Retorna insights de IA para o vendedor (mock por enquanto)"""
    try:
        # Buscar dados do vendedor
        query_perf = "SELECT * FROM fn_vendedores_performance(:ano, :mes, :vendedor)"
        df_perf = execute_query(query_perf, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        query_risco = "SELECT * FROM fn_vendedores_clientes_risco(:vendedor, 60)"
        df_risco = execute_query(query_risco, {"vendedor": vendedor})
        
        # Gerar insights baseados nos dados
        vendedor_data = df_perf.iloc[0].to_dict() if not df_perf.empty else {}
        clientes_risco = df_risco.to_dict(orient='records') if not df_risco.empty else []
        
        # Mock insights
        recomendacoes = []
        
        # Insight 1: Clientes em risco
        if clientes_risco:
            top_risco = clientes_risco[0] if clientes_risco else {}
            recomendacoes.append({
                "prioridade": 1,
                "tipo": "cliente_em_risco",
                "titulo": f"Cliente em risco: {top_risco.get('cliente_nome', 'N/A')}",
                "descricao": f"Cliente sem comprar há {top_risco.get('dias_sem_comprar', 0)} dias. Histórico: R$ {top_risco.get('valor_total_historico', 0):,.0f}",
                "acao": top_risco.get('recomendacao', 'Agendar contato'),
                "impacto_estimado": f"R$ {top_risco.get('valor_total_historico', 0):,.0f}"
            })
        
        # Insight 2: Performance
        perc_meta = vendedor_data.get('perc_atingimento_meta', 0) or 0
        if perc_meta < 80:
            recomendacoes.append({
                "prioridade": 2,
                "tipo": "performance",
                "titulo": f"Meta em risco: {perc_meta:.1f}% atingido",
                "descricao": f"Faltam {100 - perc_meta:.1f}% para bater a meta do mês.",
                "acao": "Intensificar prospecção e follow-ups",
                "impacto_estimado": f"R$ {(vendedor_data.get('meta_mes', 0) or 0) - (vendedor_data.get('total_vendas_mes', 0) or 0):,.0f}"
            })
        
        # Insight 3: Ticket médio
        ticket_medio = vendedor_data.get('ticket_medio', 0) or 0
        if ticket_medio > 0:
            recomendacoes.append({
                "prioridade": 3,
                "tipo": "oportunidade",
                "titulo": f"Ticket médio: R$ {ticket_medio:,.0f}",
                "descricao": "Analise oportunidades de upsell e cross-sell.",
                "acao": "Apresentar produtos premium aos clientes ativos",
                "impacto_estimado": f"R$ {ticket_medio * 0.2:,.0f} por pedido"
            })
        
        # Previsão (mock)
        total_vendas = vendedor_data.get('total_vendas_mes', 0) or 0
        variacao = vendedor_data.get('variacao_mom_percent', 0) or 0
        previsao = {
            "valor_estimado": total_vendas * (1 + variacao / 100),
            "probabilidade_bater_meta": min(95, max(50, perc_meta + 10)),
            "tendencia": "crescente" if variacao > 0 else "estável" if variacao == 0 else "decrescente"
        }
        
        return {
            "success": True,
            "data": {
                "vendedor": vendedor_data,
                "recomendacoes": recomendacoes,
                "previsao": previsao
            }
        }
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /ia-insights: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}
