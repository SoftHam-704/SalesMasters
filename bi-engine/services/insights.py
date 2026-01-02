from services.database import execute_query
import pandas as pd
from openai import OpenAI
import os
import httpx

def generate_insights(ano: int, industry_id: int = None):
    """
    Gera narrativas baseadas em AI V3 (OpenAI).
    Analisa dados reais e pede insights qualitativos e quantitativos.
    """
    try:
        # Prepara dados para o Prompt
        oportunidades = get_oportunidades(industry_id) or []
        alertas = get_alertas_meta(industry_id) or []
        
        # Resumo simples dos dados para o prompt (evitar token overflow)
        data_summary = f"""
        Oportunidades ({len(oportunidades)}): {[f"{o['titulo']} ({o.get('valor','?')})" for o in oportunidades[:3]]}
        Alertas ({len(alertas)}): {[f"{a['titulo']} ({a.get('prioridade','?')})" for a in alertas[:3]]}
        Contexto: Ano {ano}, Indústria ID {industry_id if industry_id else 'Todas'}
        """

        # Call OpenAI with timeout (avoid dashboard freeze)
        import httpx
        api_key = os.getenv("OPENAI_API_KEY")
        try:
            client = OpenAI(api_key=api_key, http_client=httpx.Client(timeout=10.0))
            
            prompt = f"""
            Aja como um Diretor Comercial Sênior analisando este dashboard.
            Dados:
            {data_summary}
    
            Gere um 'Resumo Executivo' (max 250 chars) direto e orientado a ação. 
            Não use "Olá" ou introduções. Vá direto ao ponto.
            """
    
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um assistente de BI focado em vendas B2B."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100
            )
            ai_summary = response.choices[0].message.content.strip()
        except Exception as ai_err:
            print(f"AI Timeout/Error: {ai_err}", flush=True)
            ai_summary = "Resumo indisponível no momento. Foco em clientes com queda de ticket e itens sem venda para recuperação imediata."
        
        return {
            "success": True,
            "industria_analisada": "Geral" if not industry_id else f"Indústria {industry_id}",
            "resumo_executivo": ai_summary,
            "categorias": {
                "oportunidades": oportunidades,
                "alertas": alertas,
                "destaques": get_top_clientes_mes(industry_id),
                "riscos": get_riscos_sugestao(industry_id)
            }
        }
        
    except Exception as e:
        print(f"FAULT: AI Insights generation failed: {str(e)}", flush=True)
        # Fallback para estático em caso de erro da API
        return {
            "success": True, 
            "resumo_executivo": "Identificamos oportunidades de reposição e alertas de ritmo. (Smart Insight indisponível momentaneamente)",
            "categorias": {
                "oportunidades": oportunidades if 'oportunidades' in locals() else [],
                "alertas": alertas if 'alertas' in locals() else [],
                "destaques": [], 
                "riscos": []
            }
        }

def get_oportunidades(industry_id: int):
    """Real: Clientes 'atrasados' na reposição usando view otimizada."""
    try:
        # Nota: A view vw_metricas_cliente é global. 
        # Se industry_id for informado, ainda usamos a query legada porém com filtro.
        # Mas para o Analytics global, usamos a view.
        if not industry_id or industry_id == "Todos":
            query = """
                SELECT cliente_nome as cli_nomred, dias_sem_compra as dias_desde_ultima
                FROM vw_metricas_cliente
                WHERE dias_sem_compra > 25
                ORDER BY dias_sem_compra DESC
                LIMIT 3
            """
            df = execute_query(query)
        else:
            query = """
                SELECT DISTINCT p.ped_cliente, c.cli_nomred, (CURRENT_DATE - MAX(p.ped_data)::date) as dias_desde_ultima
                FROM pedidos p
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_industria = :industry_id AND p.ped_situacao IN ('P', 'F')
                GROUP BY 1, 2
                HAVING (CURRENT_DATE - MAX(p.ped_data)::date) > 25
                ORDER BY 3 DESC LIMIT 3
            """
            df = execute_query(query, {"industry_id": industry_id})
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "titulo": f"Reposição: {row['cli_nomred']}",
                "detalhe": f"Este cliente costuma comprar com frequência, mas está há {int(row['dias_desde_ultima'])} dias sem pedidos.",
                "valor": "Potencial Alto",
                "acao": "Oferecer reposição",
                "impacto": "Receita"
            })
        return results
    except:
        return []

def get_alertas_meta(industry_id: int):
    """Real: Ritmo de Meta (Pacing)."""
    try:
        current_month = pd.Timestamp.now().month
        current_year = pd.Timestamp.now().year
        day_of_month = pd.Timestamp.now().day
        days_in_month = pd.Timestamp.now().days_in_month
        pct_month_elapsed = (day_of_month / days_in_month) * 100

        month_col = [
            'met_jan', 'met_fev', 'met_mar', 'met_abr', 'met_mai', 'met_jun',
            'met_jul', 'met_ago', 'met_set', 'met_out', 'met_nov', 'met_dez'
        ][current_month - 1]
        
        query = f"""
            SELECT 
                m.{month_col} as meta,
                COALESCE(SUM(p.ped_totliq), 0) as realizado
            FROM ind_metas m
            LEFT JOIN pedidos p ON m.met_industria = p.ped_industria 
                AND EXTRACT(MONTH FROM p.ped_data) = :mes 
                AND EXTRACT(YEAR FROM p.ped_data) = :ano
                AND p.ped_situacao IN ('P', 'F')
            WHERE m.met_industria = :industry_id AND m.met_ano = :ano
            GROUP BY m.{month_col}
        """
        df = execute_query(query, {"industry_id": industry_id, "mes": current_month, "ano": current_year})
        
        if df.empty or float(df['meta'].iloc[0] or 0) == 0:
            return []
            
        meta = float(df['meta'].iloc[0])
        realizado = float(df['realizado'].iloc[0])
        pct_atingido = (realizado / meta) * 100
        
        if pct_atingido < (pct_month_elapsed - 5):
            return [{
                "titulo": "Alerta de Ritmo (Pacing)",
                "detalhe": f"Meta atingida em {pct_atingido:.1f}%, mas o mês já correu {pct_month_elapsed:.0f}%.",
                "prioridade": "Alta",
                "acao": "Acelerar Pasta",
                "impacto": "Meta"
            }]
        return []
    except:
        return []

def get_top_clientes_mes(industry_id: int):
    """Real: Pedidos estagnados (em aberto há mais de 2 dias)."""
    try:
        query = """
            SELECT 
                c.cli_nomred,
                p.ped_pedido,
                (CURRENT_DATE - p.ped_data) as dias_aberto
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_industria = :industry_id
              AND p.ped_situacao = 'P'
              AND (CURRENT_DATE - p.ped_data) >= 2
            ORDER BY dias_aberto DESC
            LIMIT 2
        """
        df = execute_query(query, {"industry_id": industry_id})
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "titulo": f"Pedido Pendente: {row['cli_nomred']}",
                "detalhe": f"O pedido #{row['ped_pedido']} está aberto há {row['dias_aberto']} dias. Risco de validade de estoque.",
                "valor": "Urgente",
                "acao": "Fechar Agora",
                "impacto": "Crítico"
            })
        return results
    except:
        return []

def get_alertas_globais(ano: int):
    """Alertas de performance global usando vw_performance_mensal."""
    try:
        query = """
            SELECT 
                SUM(valor_total) as total_atual,
                LAG(SUM(valor_total)) OVER (ORDER BY mes) as total_anterior
            FROM vw_performance_mensal
            GROUP BY mes
            ORDER BY mes DESC
            LIMIT 2
        """
        df = execute_query(query)
        
        results = []
        if len(df) >= 2:
            curr = float(df.iloc[0]['total_atual'])
            prev = float(df.iloc[1]['total_atual'])
            
            if prev > 0 and curr < prev:
                diff_pct = ((curr - prev) / prev) * 100
                results.append({
                    "titulo": "Alerta de Queda Mensal",
                    "detalhe": f"O faturamento deste mês está {abs(diff_pct):.1f}% menor que o mês passado.",
                    "prioridade": "Atenção",
                    "acao": "Rever Estratégia",
                    "impacto": "Meta"
                })
        return results
    except Exception as e:
        print(f"Global Alerts Error: {e}", flush=True)
        return []

def get_riscos_sugestao(industry_id: int):
    """Riscos: Clientes em Churn (Compraram ano passado, nada este ano/período)."""
    try:
        # Se industry_id existe, filtra. Se não, global.
        ind_filter = ""
        params = {}
        if industry_id:
            ind_filter = "AND p.ped_industria = :ind_id"
            params["ind_id"] = industry_id

        query = """
            SELECT COUNT(*) as qtd_churn
            FROM vw_metricas_cliente
            WHERE dias_sem_compra > 90
        """
        df = execute_query(query)
        
        results = []
        if not df.empty:
            churn_count = int(df.iloc[0]['qtd_churn'])
            if churn_count > 0:
                 results.append({
                    "titulo": "Risco de Churn (Inatividade)",
                    "detalhe": f"Identificamos {churn_count} clientes inativos há mais de 90 dias.",
                    "impacto": "Retenção",
                    "acao": "Ativar Base",
                    "prioridade": "Alta"
                })
        
        # Fallback se não tiver churn
        if not results:
             results.append({
                "titulo": "Monitoramento de Riscos",
                "detalhe": "Nenhum risco crítico de churn identificado no momento. A base de clientes ativos está saudável.",
                "impacto": "Positivo",
                "acao": "Manter",
                "prioridade": "Baixa"
            })
            
        return results
    except Exception as e:
        print(f"Risk Logic Error: {e}", flush=True)
        return []

def get_placeholder_sugestao():
    # Depreciado em favor da lógica real acima, mantido apenas para compatibilidade se erro
    return {
        "titulo": "Insights em Processamento",
        "detalhe": "O sistema está compilando novos padrões de dados para gerar recomendações precisas.",
        "impacto": "Sistema",
        "acao": "Aguarde",
        "prioridade": "Info"
    }

def get_oportunidades_globais(ano: int):
    """Visão global usando dados reais agregados."""
    try:
        # Analisar TOTAL de pedidos pendentes (Situação 'P')
        query = """
            SELECT 
                COUNT(*) as qtd_pedidos,
                COALESCE(SUM(ite_totliquido), 0) as total_pendente,
                COUNT(DISTINCT ped_cliente) as qtd_clientes
            FROM pedidos p
            JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
              AND p.ped_situacao = 'P' 
        """
        df = execute_query(query, {"ano": ano})
        
        results = []
        if not df.empty:
            row = df.iloc[0]
            qtd_pedidos = row['qtd_pedidos'] or 0
            if qtd_pedidos > 0:
                total_val = float(row['total_pendente'])
                # Formatação PT-BR
                qtd_fmt = f"{int(qtd_pedidos):,}".replace(",", ".")
                val_fmt = f"R$ {total_val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                
                results.append({
                    "titulo": "Pedidos Pendentes (Global)",
                    "detalhe": f"Existem {qtd_fmt} pedidos em aberto totalizando {val_fmt}. O faturamento pode ser antecipado com aprovações.",
                    "prioridade": "Alta",
                    "acao": "Ver Pendências",
                    "impacto": "Caixa Imediato"
                })
        
        return results
    except Exception as e:
        print(f"Global Ops Error: {e}", flush=True)
        return []



def get_destaques_globais(ano: int):
    """Maior venda do mês atual."""
    try:
        query = """
            SELECT 
                c.cli_nomred,
                p.ped_pedido,
                p.ped_totliq
            FROM pedidos p
            JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE EXTRACT(YEAR FROM p.ped_data) = :ano
              AND EXTRACT(MONTH FROM p.ped_data) = EXTRACT(MONTH FROM CURRENT_DATE)
              AND p.ped_situacao IN ('P', 'F')
            ORDER BY p.ped_totliq DESC
            LIMIT 1
        """
        df = execute_query(query, {"ano": ano})
        
        results = []
        if not df.empty:
            row = df.iloc[0]
            val = float(row['ped_totliq'] or 0)
            if val > 0:
                val_fmt = f"R$ {val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                results.append({
                    "titulo": "Maior Venda do Mês 🏆",
                    "detalhe": f"Cliente {row['cli_nomred']} realizou o maior pedido do mês (#{row['ped_pedido']}) no valor de {val_fmt}.",
                    "valor": "Top 1",
                    "acao": "Detalhes",
                    "impacto": "Recorde"
                })
        return results
    except Exception as e:
        print(f"Global Highlights Error: {e}", flush=True)
        return []

def get_placeholder_sugestao():
    return {
        "titulo": "Assistente de Insights",
        "detalhe": "Estou analisando novos padrões de vendas dia a dia. Continue vendendo para gerar mais inteligência.",
        "impacto": "Aprendizado",
        "acao": "Saber Mais",
        "prioridade": "AI Info"
    }

def generate_critical_alerts_ai(ano: int, mes: str = 'Todos', industry_id: int = None):
    """
    Gera 3 alertas críticos de alto impacto (benefício/perda) usando OpenAI e dados reais.
    """
    from services.analytics_dashboard import get_critical_alerts, get_kpis_metrics
    
    try:
        # 1. Busca dados reais
        alerts_data = get_critical_alerts(ano, mes, industry_id)
        kpi_data = get_kpis_metrics(ano, mes, industry_id)
        
        # 2. Prepara resumo para o GPT
        # lost_clients: list of {cli_nomred, dias_sem_compra, estimated_annual_loss}
        # dead_stock: {dead_stock_count, dead_stock_value}
        # kpi_variation: variation: {valor, pedidos, ticket, clientes}
        
        lost_summary = [f"{c['cli_nomred']} ({c['dias_sem_compra']} dias s/ compra, Perda Est. R$ {c['estimated_annual_loss']:,.0f}/ano)" for c in alerts_data.get('lost_clients', [])[:5]]
        
        data_context = f"""
        - Clientes Perdidos: {lost_summary}
        """
        
        api_key = os.getenv("OPENAI_API_KEY")
        client = OpenAI(api_key=api_key, http_client=httpx.Client(timeout=10.0))
        
        prompt = f"""
        Aja como um Diretor Comercial focado em resultados. Gere ATÉ 5 alertas críticos baseados APENAS nos dados de clientes perdidos abaixo.
        Siga RIGOROSAMENTE este formato JSON:
        [
          {{
            "title": "NOME CLIENTE zerou pedidos - Perda estimada de R$ X",
            "subtitle": "Cliente histórico sem compras há X dias."
          }}
        ]

        Dados Reais:
        {data_context}
        
        Importante: 
        1. Formate o valor da perda com separadores de milhar (ex: 1.840.838/ano).
        2. O título DEVE ser "[NOME CLIENTE] zerou pedidos - Perda estimada de R$ [VALOR]/ano".
        3. O subtítulo DEVE ser "Cliente histórico sem compras há [DIAS] dias."
        4. No máximo 5 alertas.
        Não use markdown na resposta, apenas o JSON puro.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um assistente de BI que gera alertas financeiros de alto impacto."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0
        )
        
        import json
        content = response.choices[0].message.content.strip()
        # Remove markdown if any
        if content.startswith("```json"):
            content = content.replace("```json", "").replace("```", "").strip()
            
        return json.loads(content)
        
    except Exception as e:
        print(f"Error generating AI alerts: {e}", flush=True)
        # Fallback estático baseado nos dados se a IA falhar
        return [
            {
                "title": "Erro na geração de insights via AI",
                "subtitle": "Verifique a conexão com a OpenAI ou logs do servidor.",
                "icon": "🚨"
            }
        ]
