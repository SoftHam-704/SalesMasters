"""
Equipe Router - Dashboard de Colaboradores
Endpoints para análise de performance de vendedores
"""
from fastapi import APIRouter
from services.database import execute_query
import pandas as pd
import traceback

router = APIRouter(prefix="/api/equipe", tags=["Equipe"])


@router.get("/vendedores")
async def get_vendedores():
    """Retorna lista de vendedores para filtro (Apenas ativos e que cumprem meta)"""
    try:
        query = "SELECT ven_codigo, ven_nome FROM vendedores WHERE ven_cumpremetas = 'S' AND ven_status = 'A' ORDER BY ven_nome"
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
    """Retorna ranking de performance dos vendedores (Apenas ativos e que cumprem meta)"""
    try:
        # Join with vendedores table to filter by status and cumpre_metas
        query = """
        SELECT p.* 
        FROM fn_vendedores_performance(:ano, :mes, :vendedor) p
        JOIN vendedores v ON p.vendedor_codigo = v.ven_codigo
        WHERE v.ven_cumpremetas = 'S' AND v.ven_status = 'A'
        """
        df = execute_query(query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        if not df.empty:
            # --- YoY Calculation ---
            try:
                # Fetch prev year data (same month)
                query_prev = """
                SELECT p.vendedor_codigo, p.total_vendas_mes 
                FROM fn_vendedores_performance(:ano, :mes, :vendedor) p
                JOIN vendedores v ON p.vendedor_codigo = v.ven_codigo
                WHERE v.ven_cumpremetas = 'S' AND v.ven_status = 'A'
                """
                df_prev = execute_query(query_prev, {"ano": ano - 1, "mes": mes, "vendedor": vendedor})
                
                if not df_prev.empty:
                    # Rename col for merge
                    df_prev = df_prev.rename(columns={'total_vendas_mes': 'total_vendas_ano_anterior'})
                    
                    # Ensure numeric types
                    df['total_vendas_mes'] = pd.to_numeric(df['total_vendas_mes'], errors='coerce').fillna(0)
                    df_prev['total_vendas_ano_anterior'] = pd.to_numeric(df_prev['total_vendas_ano_anterior'], errors='coerce').fillna(0)

                    # Merge on seller ID
                    df = pd.merge(df, df_prev[['vendedor_codigo', 'total_vendas_ano_anterior']], 
                                  on='vendedor_codigo', how='left')
                    
                    # Calculate YoY %
                    df['variacao_yoy_percent'] = df.apply(
                        lambda row: ((row['total_vendas_mes'] - row['total_vendas_ano_anterior']) / row['total_vendas_ano_anterior'] * 100)
                        if row['total_vendas_ano_anterior'] > 0 
                        else 0, axis=1
                    )
                    
                    df['variacao_yoy_percent'] = df['variacao_yoy_percent'].fillna(0)
                else:
                    df['variacao_yoy_percent'] = 0
            except Exception as e:
                print(f"⚠️ [EQUIPE] Erro ao calcular YoY: {e}")
                traceback.print_exc()
                df['variacao_yoy_percent'] = 0
            # -----------------------

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
        ticket_medio = float(vendedor_data.get('ticket_medio', 0) or 0)
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
        total_vendas = float(vendedor_data.get('total_vendas_mes', 0) or 0)
        variacao = float(vendedor_data.get('variacao_mom_percent', 0) or 0)
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


@router.get("/evolucao")
async def get_evolucao(ano: int, mes: int, vendedor: int = None):
    """Retorna evolução de vendas respeitando filtros de contexto"""
    try:
        from datetime import date
        from dateutil.relativedelta import relativedelta
        
        month_names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        
        # If mes=0 (Todos), show all 12 months of the year
        if mes == 0:
            months = [(ano, m) for m in range(1, 13)]
        else:
            # Show 6 months ending at selected month
            end_date = date(ano, mes, 1)
            months = []
            for i in range(5, -1, -1):
                d = end_date - relativedelta(months=i)
                months.append((d.year, d.month))
        
        # Query for each month
        results = []
        
        for year, month in months:
            vendedor_filter = f"AND p.ped_vendedor = {vendedor}" if vendedor else ""
            query = f"""
            SELECT COALESCE(SUM(p.ped_totliq), 0) as total
            FROM pedidos p
            JOIN vendedores v ON p.ped_vendedor = v.ven_codigo
            WHERE EXTRACT(YEAR FROM p.ped_data) = {year}
              AND EXTRACT(MONTH FROM p.ped_data) = {month}
              AND p.ped_situacao IN ('P', 'F')
              AND v.ven_cumpremetas = 'S'
              AND v.ven_status = 'A'
              {vendedor_filter}
            """
            df = execute_query(query, {})
            total = float(df.iloc[0]['total']) if not df.empty else 0
            results.append({
                "mes": month_names[month - 1],
                "ano": year,
                "valor": total
            })
        
        return {
            "success": True, 
            "data": {
                "labels": [r["mes"] for r in results],
                "valores": [r["valor"] for r in results],
                "detalhes": results
            }
        }
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /evolucao: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}


@router.get("/carteira-resumo")
async def get_carteira_resumo(ano: int, mes: int, vendedor: int = None):
    """Retorna KPIs de carteira: ativos 90d, inativos, total, % inativos"""
    try:
        query = "SELECT * FROM fn_vendedores_carteira_resumo(:ano, :mes, :vendedor)"
        df = execute_query(query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        if not df.empty:
            # Aggregate totals across all sellers (or just one if filtered)
            totals = {
                "clientes_ativos_90d": int(df['clientes_ativos_90d'].sum()),
                "clientes_inativos_90d": int(df['clientes_inativos_90d'].sum()),
                "total_clientes": int(df['total_clientes'].sum()),
                "clientes_novos_periodo": int(df['clientes_novos_periodo'].sum()),
            }
            total = totals["total_clientes"]
            totals["perc_inativos"] = round((totals["clientes_inativos_90d"] / total * 100), 2) if total > 0 else 0
            
            return {"success": True, "data": totals}
        return {"success": True, "data": {"clientes_ativos_90d": 0, "clientes_inativos_90d": 0, "total_clientes": 0, "perc_inativos": 0, "clientes_novos_periodo": 0}}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /carteira-resumo: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": None}


@router.get("/carteira-por-vendedor")
async def get_carteira_por_vendedor(ano: int, mes: int):
    """Retorna dados para gráfico de barras empilhadas (ativos x inativos por vendedor)"""
    try:
        query = "SELECT * FROM fn_vendedores_carteira_resumo(:ano, :mes, NULL)"
        df = execute_query(query, {"ano": ano, "mes": mes})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /carteira-por-vendedor: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/novos-clientes")
async def get_novos_clientes(ano: int, mes: int, vendedor: int = None):
    """Retorna lista de clientes que fizeram primeira compra no período"""
    try:
        query = "SELECT * FROM fn_clientes_primeira_compra(:ano, :mes, :vendedor)"
        df = execute_query(query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        if not df.empty:
            data = df.to_dict(orient='records')
            return {"success": True, "data": data}
        return {"success": True, "data": []}
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /novos-clientes: {e}")
        traceback.print_exc()
        return {"success": False, "error": str(e), "data": []}


@router.get("/narrativas-ia")
async def get_narrativas_ia(ano: int, mes: int, vendedor: int = None):
    """Gera 4 narrativas inteligentes usando OpenAI baseadas nos dados do vendedor"""
    import os
    import json
    from openai import OpenAI
    import httpx
    
    # Cache simples em memória (5 min TTL)
    import time
    cache_key = f"narrativas_{ano}_{mes}_{vendedor}"
    
    try:
        # Collect context data
        perf_query = """
        SELECT p.* 
        FROM fn_vendedores_performance(:ano, :mes, :vendedor) p
        JOIN vendedores v ON p.vendedor_codigo = v.ven_codigo
        WHERE v.ven_cumpremetas = 'S' AND v.ven_status = 'A'
        """
        perf_df = execute_query(perf_query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        carteira_query = "SELECT * FROM fn_vendedores_carteira_resumo(:ano, :mes, :vendedor)"
        carteira_df = execute_query(carteira_query, {"ano": ano, "mes": mes, "vendedor": vendedor})
        
        risco_query = "SELECT * FROM fn_vendedores_clientes_risco(:vendedor, 60)"
        risco_df = execute_query(risco_query, {"vendedor": vendedor})
        
        # Build context
        context = {
            "performance": perf_df.to_dict(orient='records') if not perf_df.empty else [],
            "carteira": carteira_df.to_dict(orient='records') if not carteira_df.empty else [],
            "clientes_risco": len(risco_df) if not risco_df.empty else 0,
            "top_risco": risco_df.head(3).to_dict(orient='records') if not risco_df.empty else []
        }
        
        # OpenAI call
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'), http_client=httpx.Client(timeout=15.0))
        
        prompt = f"""
        Você é um analista de negócios criando narrativas curtas e impactantes para um dashboard de vendas.
        
        CONTEXTO DOS DADOS:
        - Performance: {json.dumps(context['performance'][:3], default=str)}
        - Carteira de Clientes: {json.dumps(context['carteira'][:3], default=str)}
        - Clientes em Risco: {context['clientes_risco']} clientes
        - Top 3 Riscos: {json.dumps(context['top_risco'], default=str)}
        
        GERE EXATAMENTE 4 NARRATIVAS CURTAS (1-2 frases cada):
        1. Uma sobre PERFORMANCE geral
        2. Uma sobre CARTEIRA DE CLIENTES (ativos vs inativos)
        3. Uma sobre RISCOS ou OPORTUNIDADES
        4. Uma RECOMENDAÇÃO ACIONÁVEL
        
        RETORNE JSON:
        {{
            "narrativas": [
                {{"titulo": "Título curto", "texto": "Narrativa 1-2 frases", "tipo": "performance|carteira|risco|acao", "icone": "trophy|users|alert|target"}},
                ...
            ]
        }}
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você gera narrativas curtas e impactantes para dashboards de vendas em português brasileiro."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        result = json.loads(response.choices[0].message.content)
        return {"success": True, "data": result.get("narrativas", [])}
        
    except Exception as e:
        print(f"❌ [EQUIPE] Erro em /narrativas-ia: {e}")
        traceback.print_exc()
        # Fallback narratives
        return {
            "success": True,
            "data": [
                {"titulo": "Performance", "texto": "Análise de performance não disponível no momento.", "tipo": "performance", "icone": "trophy"},
                {"titulo": "Carteira", "texto": "Dados de carteira sendo processados.", "tipo": "carteira", "icone": "users"},
                {"titulo": "Atenção", "texto": "Verifique clientes em risco periodicamente.", "tipo": "risco", "icone": "alert"},
                {"titulo": "Ação", "texto": "Mantenha contato regular com sua base de clientes.", "tipo": "acao", "icone": "target"}
            ]
        }
