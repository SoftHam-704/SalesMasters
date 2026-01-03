
import os
import httpx
import json
import pandas as pd
from datetime import datetime
from openai import OpenAI
from services.database import execute_query

# Configure OpenAI Client
client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'), http_client=httpx.Client(timeout=30.0))

class MetasAIAnalyzer:
    """
    Analyzer specifically for Metas/Goals Dashboard.
    Generates 5-column narrative grid.
    """

    def generate_narratives(self, ano: int, mes: int, industria: int = None):
        """
        Generates 5 distinct narratives based on current dashboard state.
        """
        try:
            # 1. Gather Context Data
            context = self._gather_context(ano, mes, industria)
            
            # 2. Generate AI Insights
            narratives = self._query_llm(context, ano, mes)
            
            return {
                "success": True, 
                "data": narratives,
                "generated_at": datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error generating metas narratives: {e}", flush=True)
            return {"success": False, "error": str(e)}

    def _gather_context(self, ano, mes, industria):
        """
        Fetches summary data from DB to provide context to LLM.
        """
        data = {}
        
        # Helper to run query safely
        def safe_query(query, params):
            try:
                df = execute_query(query, params)
                return df.to_dict('records') if not df.empty else []
            except Exception as e:
                print(f"Error querying {query[:30]}...: {e}")
                return []

        # A. Resumo Geral
        data['resumo'] = safe_query(
            "SELECT * FROM fn_metas_resumo_geral(:ano, :mes, :industria)",
            {"ano": ano, "mes": mes, "industria": industria}
        )

        # B. Análise Diária (Last 5 days useful)
        daily_data = safe_query(
            "SELECT * FROM fn_metas_analise_diaria(:ano, :mes, :industria)",
            {"ano": ano, "mes": mes, "industria": industria}
        )
        data['diaria'] = daily_data[-7:] if daily_data else [] # Last week of data

        # C. Weekly Analysis
        # Note: Weekly pivot queries ALL industries if no filter, or specific if filtered.
        # Queries usually don't accept industria params in the pivot function unless modified previously.
        # We'll use the one we just verified: fn_metas_analise_semanal_pivot(ano, mes)
        # If industria is set, we filter manually here to reduce context size if needed, 
        # but for industry comparison, it's good to have peers. 
        # Actually, if a specific industry is selected, we should probably show its weekly data specifically.
        weekly_df = execute_query("SELECT * FROM fn_metas_analise_semanal_pivot(:ano, :mes)", {"ano": ano, "mes": mes})
        if industria and not weekly_df.empty and 'industria_codigo' in weekly_df.columns:
            # Filter specifically for context if single industry
            filtered_weekly = weekly_df[weekly_df['industria_codigo'] == industria]
            data['semanal'] = filtered_weekly.to_dict('records')
        else:
            # Send top 5 by total if no specific industry or for comparison
            if not weekly_df.empty:
                weekly_df = weekly_df.sort_values(by='total', ascending=False).head(10)
                data['semanal'] = weekly_df.to_dict('records')
            else:
                data['semanal'] = []

        # D. Status / Atingimento
        status_data = safe_query(
            "SELECT * FROM fn_metas_status_industrias(:ano, :mes, :industria)",
            {"ano": ano, "mes": mes, "industria": industria}
        )
        data['status'] = status_data if status_data else []

        return data

    def _query_llm(self, context, ano, mes):
        """
        Prompts LLM to generate the 5 cards.
        """
        
        prompt = f"""
        Você é um analista de performance de vendas Sênior.
        Analise os dados abaixo referentes a {mes}/{ano} e gere 5 NARRATIVAS CURTAS E DIRETAS.
        
        DADOS:
        1. Resumo: {json.dumps(context.get('resumo', []), default=str)}
        2. Diário (Recente): {json.dumps(context.get('diaria', []), default=str)}
        3. Semanal: {json.dumps(context.get('semanal', []), default=str)}
        4. Status Indústrias: {json.dumps(context.get('status', []), default=str)}

        OBJETIVO:
        Montar um grid de 5 colunas. Para cada coluna, forneça:
        - Título (Ex: "Visão do Mês", "Tendência", etc)
        - Texto (Max 250 caracteres, HTML like <b>bold</b> allowed)
        - Tipo (positive, negative, neutral, warning)

        COLUNAS OBRIGATÓRIAS:
        1. "Visão Geral": Parecer sobre o atingimento total (Meta vs Real). Estamos batendo a meta?
        2. "Tendência Diária": Analise os últimos dias. Estamos acelerando ou desacelerando?
        3. "Destaques Semanais": Qual semana salvou o mês ou qual foi o gargalo?
        4. "Campeões & Ofensores": Quem são as indústrias puxando pra cima e pra baixo (se houver várias)?
        5. "Plano de Ação": Uma ação imediata sugerida baseada nos dados (ex: "Focar em X", "Recuperar Y").

        RETORNE APENAS JSON:
        {{
            "cards": [
                {{ "title": "...", "content": "...", "type": "..." }},
                ... (total 5)
            ]
        }}
        """

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "Você é um assistente de BI focado em narrativas de vendas."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            # Fallback local if AI fails
            print(f"AI Error: {e}")
            return self._generate_fallback(context)

    def _generate_fallback(self, context):
        """Static fallback generation"""
        resumo = context.get('resumo', [{}])[0]
        perc = float(resumo.get('percentual_atingimento', 0) or 0)
        
        return {
            "cards": [
                {
                    "title": "Visão Geral",
                    "content": f"Atingimento atual de <b>{perc:.1f}%</b>. " + ("Meta superada!" if perc >= 100 else "Abaixo da meta."),
                    "type": "positive" if perc >= 100 else "warning"
                },
                {
                    "title": "Tendência",
                    "content": "Dados insuficientes para análise de tendência detalhada no momento.",
                    "type": "neutral"
                },
                {
                    "title": "Semanal",
                    "content": "Verifique o gráfico de análise semanal para detalhes de picos de venda.",
                    "type": "neutral"
                },
                {
                    "title": "Performance",
                    "content": "Consulte a tabela de status para identificar indústrias críticas.",
                    "type": "neutral"
                },
                {
                    "title": "Ação",
                    "content": "Revisar pedidos em aberto e focar em clientes com potencial de fechamento imediato.",
                    "type": "neutral"
                }
            ]
        }
