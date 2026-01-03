"""
Metas Router - Dashboard de Metas
Endpoints para análise de metas de vendas
"""
from fastapi import APIRouter
from services.database import execute_query
import traceback

router = APIRouter(prefix="/api/metas", tags=["Metas"])


def get_industria_param(industria):
    """Convert industria param to int or None"""
    if industria is None or industria == 'Todos' or industria == '':
        return None
    try:
        return int(industria)
    except:
        return None


@router.get("/resumo")
async def get_metas_resumo(ano: int, mes: int, industria: str = None):
    """Retorna resumo geral: M-1, Atual, Variação"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_resumo_geral(:ano, :mes, :industria)"
        df = execute_query(query, {"ano": ano, "mes": mes, "industria": ind})
        
        if not df.empty:
            row = df.iloc[0]
            return {
                "success": True,
                "data": {
                    "total_mes_anterior": float(row.get('total_mes_anterior', 0) or 0),
                    "total_mes_atual": float(row.get('total_mes_atual', 0) or 0),
                    "variacao_percentual": float(row.get('variacao_percentual', 0) or 0)
                }
            }
        return {"success": True, "data": {"total_mes_anterior": 0, "total_mes_atual": 0, "variacao_percentual": 0}}
    except Exception as e:
        print(f"❌ [METAS] Erro em /resumo: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}


@router.get("/por-mes")
async def get_metas_por_mes(ano: int, industria: str = None):
    """Retorna tabela de metas mensais (12 meses)"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_por_mes(:ano, :industria)"
        df = execute_query(query, {"ano": ano, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "mes": row.get('mes'),
                "mes_nome": row.get('mes_nome'),
                "ano_anterior": float(row.get('ano_anterior', 0) or 0),
                "meta_ano_corrente": float(row.get('meta_ano_corrente', 0) or 0),
                "vendas_ano_corrente": float(row.get('vendas_ano_corrente', 0) or 0),
                "perc_atingimento": float(row.get('perc_atingimento', 0) or 0),
                "perc_relacao_ano_ant": float(row.get('perc_relacao_ano_ant', 0) or 0)
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /por-mes: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/atingimento")
async def get_metas_atingimento(ano: int, mes_ate: int = 12, industria: str = None):
    """Retorna % atingimento por indústria para gráfico de barras"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_atingimento_industria(:ano, :mes_ate, :industria)"
        df = execute_query(query, {"ano": ano, "mes_ate": mes_ate, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "meta_total": float(row.get('meta_total', 0) or 0),
                "realizado_total": float(row.get('realizado_total', 0) or 0),
                "percentual_atingimento": float(row.get('percentual_atingimento', 0) or 0),
                "status": row.get('status')
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /atingimento: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/variacao")
async def get_metas_variacao(ano: int, mes: int, industria: str = None):
    """Retorna variação de vendas M-1 vs Atual por indústria"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_variacao_vendas(:ano, :mes, :industria)"
        df = execute_query(query, {"ano": ano, "mes": mes, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "mes_anterior": float(row.get('mes_anterior', 0) or 0),
                "mes_atual": float(row.get('mes_atual', 0) or 0),
                "variacao_absoluta": float(row.get('variacao_absoluta', 0) or 0),
                "variacao_percentual": float(row.get('variacao_percentual', 0) or 0),
                "participacao_percentual": float(row.get('participacao_percentual', 0) or 0)
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /variacao: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/analise-diaria")
async def get_metas_analise_diaria(ano: int, mes: int, industria: str = None):
    """Retorna análise diária do mês"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_analise_diaria(:ano, :mes, :industria)"
        df = execute_query(query, {"ano": ano, "mes": mes, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "dia": row.get('dia'),
                "mes_anterior": float(row.get('mes_anterior', 0) or 0),
                "mes_atual": float(row.get('mes_atual', 0) or 0),
                "variacao_percentual": float(row.get('variacao_percentual', 0) or 0)
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /analise-diaria: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/analise-semanal")
async def get_metas_analise_semanal(ano: int, mes: int, industria: str = None):
    """Retorna análise semanal pivotada"""
    try:
        # ind_code = get_industria_param(industria)
        # Force no filter for this card as requested by user
        query = "SELECT * FROM fn_metas_analise_semanal_pivot(:ano, :mes)"
        df = execute_query(query, {"ano": ano, "mes": mes})
        
        # Filter is now handled by SQL function
        # if ind_code:
        #    df = df[df['industria_codigo'] == ind_code]
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "semana_1": float(row.get('semana_1', 0) or 0),
                "semana_2": float(row.get('semana_2', 0) or 0),
                "semana_3": float(row.get('semana_3', 0) or 0),
                "semana_4": float(row.get('semana_4', 0) or 0),
                "total": float(row.get('total', 0) or 0)
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /analise-semanal: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/matriz-acao")
async def get_metas_matriz_acao(ano: int, mes_ate: int = 12, industria: str = None):
    """Retorna dados para scatter plot (matriz de ação)"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_matriz_acao(:ano, :mes_ate, :industria)"
        df = execute_query(query, {"ano": ano, "mes_ate": mes_ate, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "meta_total": float(row.get('meta_total', 0) or 0),
                "realizado_total": float(row.get('realizado_total', 0) or 0),
                "percentual_meta": float(row.get('percentual_meta', 0) or 0),
                "valor_realizado": float(row.get('valor_realizado', 0) or 0),
                "quadrante": row.get('quadrante'),
                "prioridade": row.get('prioridade')
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /matriz-acao: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/status")
async def get_metas_status(ano: int, mes_ate: int = 12, industria: str = None):
    """Retorna status das metas por indústria"""
    try:
        ind = get_industria_param(industria)
        query = "SELECT * FROM fn_metas_status_industrias(:ano, :mes_ate, :industria)"
        df = execute_query(query, {"ano": ano, "mes_ate": mes_ate, "industria": ind})
        
        data = []
        for _, row in df.iterrows():
            data.append({
                "industria_codigo": row.get('industria_codigo'),
                "industria_nome": row.get('industria_nome'),
                "meta_total": float(row.get('meta_total', 0) or 0),
                "atual": float(row.get('atual', 0) or 0),
                "percentual_meta": float(row.get('percentual_meta', 0) or 0),
                "saldo": float(row.get('saldo', 0) or 0),
                "status": row.get('status'),
                "tendencia": row.get('tendencia')
            })
        
        return {"success": True, "data": data}
    except Exception as e:
        print(f"❌ [METAS] Erro em /status: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/narratives")
async def get_metas_narratives(ano: int, mes: int, industria: str = None):
    """Retorna narrativas inteligentes (AI)"""
    from services.metas_ai import MetasAIAnalyzer
    try:
        ind = get_industria_param(industria)
        analyzer = MetasAIAnalyzer()
        result = analyzer.generate_narratives(ano, mes, ind)
        return result
    except Exception as e:
        print(f"❌ [METAS] Erro em /narratives: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}
