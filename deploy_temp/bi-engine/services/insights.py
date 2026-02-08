"""
Backend AVANÇADO - Insights Inteligentes (Adaptado para FastAPI)
Análises: Padrões ocultos, Anomalias, Correlações, Previsões
"""

from services.database import execute_query
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from openai import OpenAI
import os
import httpx
from collections import defaultdict


client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'), http_client=httpx.Client(timeout=8.0))


# ==========================================
# CACHE SIMPLES COM TTL (5 minutos)
# ==========================================
_insights_cache = {}
_cache_ttl = 300  # 5 minutos

def get_cached_insights(cache_key):
    """Retorna insights do cache se ainda válidos"""
    import time
    if cache_key in _insights_cache:
        data, timestamp = _insights_cache[cache_key]
        if time.time() - timestamp < _cache_ttl:
            print(f"[INSIGHTS] Cache HIT para {cache_key}", flush=True)
            return data
    return None

def set_cached_insights(cache_key, data):
    """Salva insights no cache"""
    import time
    _insights_cache[cache_key] = (data, time.time())


class AdvancedAnalyzer:
    """Análises avançadas - padrões ocultos"""
    
    def detect_anomalies(self, startDate: str = None, endDate: str = None):
        """Detecta ANOMALIAS - comportamentos estranhos"""
        # Se houver range, usamos o range especificado. Caso contrário, uamos o padrão de 12 semanas.
        if startDate and endDate:
            period_where = "p.ped_data BETWEEN :startDate AND :endDate"
            recent_where = "cs.semana BETWEEN :startDate AND :endDate"
            params = {"startDate": startDate, "endDate": endDate}
        else:
            period_where = "p.ped_data >= CURRENT_DATE - INTERVAL '12 weeks'"
            recent_where = "cs.semana >= CURRENT_DATE - INTERVAL '4 weeks'"
            params = {}

        query = f"""
        WITH client_stats AS (
            SELECT 
                c.cli_nomred as cliente,
                DATE_TRUNC('week', p.ped_data) as semana,
                COUNT(*) as qtd_pedidos,
                AVG(p.ped_totliq) as ticket_medio,
                SUM(p.ped_totliq) as total
            FROM pedidos p
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE {period_where}
            GROUP BY c.cli_nomred, DATE_TRUNC('week', p.ped_data)
        ),
        client_avg AS (
            SELECT 
                cliente,
                AVG(ticket_medio) as ticket_medio_historico,
                STDDEV(ticket_medio) as desvio_padrao
            FROM client_stats
            GROUP BY cliente
        )
        SELECT 
            cs.cliente,
            cs.semana::date as semana,
            cs.ticket_medio,
            ca.ticket_medio_historico,
            ROUND(((cs.ticket_medio - ca.ticket_medio_historico) / NULLIF(ca.ticket_medio_historico, 0) * 100)::numeric, 1) as variacao_pct
        FROM client_stats cs
        INNER JOIN client_avg ca ON cs.cliente = ca.cliente
        WHERE ca.desvio_padrao > 0 
          AND ABS(cs.ticket_medio - ca.ticket_medio_historico) > (ca.desvio_padrao * 2)
          AND {recent_where}
        ORDER BY ABS(cs.ticket_medio - ca.ticket_medio_historico) DESC
        LIMIT 5;
        """
        
        try:
            df = execute_query(query, params)
            return df.to_dict('records') if not df.empty else []
        except Exception as e:
            print(f"Error detect_anomalies: {e}", flush=True)
            return []
    
    def find_product_correlations(self, startDate: str = None, endDate: str = None):
        """Encontra CORRELAÇÕES - produtos comprados juntos (versão simplificada)"""
        if startDate and endDate:
            where_period = "p.ped_data BETWEEN :startDate AND :endDate"
            params = {"startDate": startDate, "endDate": endDate}
        else:
            where_period = "p.ped_data >= CURRENT_DATE - INTERVAL '6 months'"
            params = {}

        query = f"""
        WITH product_pairs AS (
            SELECT 
                i1.ite_idproduto as produto_a,
                i2.ite_idproduto as produto_b,
                COUNT(DISTINCT i1.ite_pedido) as vezes_juntos
            FROM itens_ped i1
            INNER JOIN itens_ped i2 ON i1.ite_pedido = i2.ite_pedido 
                AND i1.ite_industria = i2.ite_industria
                AND i1.ite_idproduto < i2.ite_idproduto
            INNER JOIN pedidos p ON i1.ite_pedido = p.ped_pedido AND i1.ite_industria = p.ped_industria
            WHERE {where_period}
              AND p.ped_situacao IN ('P', 'F')
            GROUP BY i1.ite_idproduto, i2.ite_idproduto
            HAVING COUNT(DISTINCT i1.ite_pedido) >= 3
        )
        SELECT 
            COALESCE(p1.pro_nome, 'Produto ' || pp.produto_a::text) as produto_a,
            COALESCE(p2.pro_nome, 'Produto ' || pp.produto_b::text) as produto_b,
            pp.vezes_juntos,
            pp.vezes_juntos as taxa_conversao
        FROM product_pairs pp
        LEFT JOIN cad_prod p1 ON pp.produto_a = p1.pro_id
        LEFT JOIN cad_prod p2 ON pp.produto_b = p2.pro_id
        ORDER BY pp.vezes_juntos DESC
        LIMIT 5;
        """
        
        try:
            df = execute_query(query, params)
            return df.to_dict('records') if not df.empty else []
        except Exception as e:
            print(f"Error find_product_correlations: {e}", flush=True)
            import traceback
            traceback.print_exc()
            return []
    
    def detect_lost_opportunities(self, startDate: str = None, endDate: str = None):
        """Detecta OPORTUNIDADES PERDIDAS"""
        if startDate and endDate:
            where_recent = "ped_data BETWEEN :startDate AND :endDate"
            where_period = "p.ped_data BETWEEN :startDate AND :endDate"
            params = {"startDate": startDate, "endDate": endDate}
        else:
            where_recent = "ped_data >= CURRENT_DATE - INTERVAL '3 months'"
            where_period = "p.ped_data >= CURRENT_DATE - INTERVAL '6 months'"
            params = {}

        query = f"""
        WITH recent_buyers AS (
            SELECT DISTINCT ped_cliente
            FROM pedidos
            WHERE {where_recent}
        ),
        category_buyers AS (
            SELECT 
                p.ped_cliente,
                COUNT(DISTINCT i.ite_produto) as produtos_distintos,
                SUM(i.ite_totliquido) as total_gasto
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido AND p.ped_industria = i.ite_industria
            WHERE {where_period}
            GROUP BY p.ped_cliente
        ),
        top_products AS (
            SELECT ite_produto
            FROM itens_ped i
            INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido AND i.ite_industria = p.ped_industria
            WHERE {where_recent}
            GROUP BY ite_produto
            ORDER BY SUM(ite_totliquido) DESC
            LIMIT 10
        )
        SELECT 
            c.cli_nomred as cliente,
            cb.produtos_distintos as produtos_compra,
            ROUND(cb.total_gasto::numeric, 2) as total_gasto,
            (
                SELECT COUNT(*) 
                FROM top_products tp
                WHERE NOT EXISTS (
                    SELECT 1 FROM itens_ped i2
                    INNER JOIN pedidos p2 ON i2.ite_pedido = p2.ped_pedido AND i2.ite_industria = p2.ped_industria
                    WHERE p2.ped_cliente = cb.ped_cliente 
                      AND i2.ite_produto = tp.ite_produto
                      AND {where_period}
                )
            ) as produtos_top_nao_comprados
        FROM category_buyers cb
        INNER JOIN clientes c ON cb.ped_cliente = c.cli_codigo
        INNER JOIN recent_buyers rb ON cb.ped_cliente = rb.ped_cliente
        WHERE cb.produtos_distintos >= 3
        ORDER BY produtos_top_nao_comprados DESC, cb.total_gasto DESC
        LIMIT 5;
        """
        
        try:
            df = execute_query(query, params)
            return df.to_dict('records') if not df.empty else []
        except Exception as e:
            print(f"Error detect_lost_opportunities: {e}", flush=True)
            return []
    
    def predict_churn_with_context(self, startDate: str = None, endDate: str = None):
        """Prevê CHURN com contexto detalhado"""
        if startDate and endDate:
            where_period = "p.ped_data BETWEEN :startDate AND :endDate"
            params = {"startDate": startDate, "endDate": endDate}
        else:
            where_period = "1=1" # No restriction for global behavior
            params = {}

        query = f"""
        WITH client_behavior AS (
            SELECT 
                c.cli_codigo,
                c.cli_nomred as cliente,
                MAX(p.ped_data) as ultima_compra,
                CURRENT_DATE - MAX(p.ped_data)::date as dias_inativo,
                COUNT(*) as total_pedidos,
                AVG(p.ped_totliq) as ticket_medio,
                SUM(p.ped_totliq) as lifetime_value,
                CASE 
                    WHEN COUNT(*) > 1 THEN 
                        EXTRACT(DAYS FROM (MAX(p.ped_data) - MIN(p.ped_data))) / (COUNT(*) - 1)
                    ELSE NULL
                END as freq_dias
            FROM pedidos p
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_situacao IN ('P', 'F')
              AND {where_period}
            GROUP BY c.cli_codigo, c.cli_nomred
        )
        SELECT 
            cliente,
            dias_inativo,
            ROUND(freq_dias::numeric, 0) as freq_compra_dias,
            total_pedidos,
            ROUND(ticket_medio::numeric, 2) as ticket_medio,
            ROUND(lifetime_value::numeric, 2) as valor_total,
            ROUND((lifetime_value / 12.0)::numeric, 2) as perda_mensal_est,
            CASE 
                WHEN dias_inativo > (freq_dias * 2) THEN 'CRÍTICO'
                WHEN dias_inativo > freq_dias THEN 'ALERTA'
                ELSE 'OK'
            END as nivel_risco
        FROM client_behavior
        WHERE freq_dias IS NOT NULL
          AND freq_dias > 0
          AND total_pedidos >= 5
          AND dias_inativo > 30
        ORDER BY 
            CASE 
                WHEN dias_inativo > (freq_dias * 2) THEN 1
                WHEN dias_inativo > freq_dias THEN 2
                ELSE 3
            END,
            lifetime_value DESC
        LIMIT 5;
        """
        
        try:
            df = execute_query(query, params)
            return df.to_dict('records') if not df.empty else []
        except Exception as e:
            print(f"Error predict_churn_with_context: {e}", flush=True)
            return []
    
    def detect_seasonal_patterns(self):
        """Detecta PADRÕES SAZONAIS específicos"""
        query = """
        WITH monthly_sales AS (
            SELECT 
                EXTRACT(MONTH FROM ped_data) as mes,
                TO_CHAR(ped_data, 'Month') as nome_mes,
                EXTRACT(YEAR FROM ped_data) as ano,
                SUM(ped_totliq) as faturamento
            FROM pedidos
            WHERE ped_data >= CURRENT_DATE - INTERVAL '24 months'
              AND ped_situacao IN ('P', 'F')
            GROUP BY EXTRACT(MONTH FROM ped_data), TO_CHAR(ped_data, 'Month'), EXTRACT(YEAR FROM ped_data)
        ),
        avg_by_month AS (
            SELECT 
                mes,
                TRIM(nome_mes) as nome_mes,
                AVG(faturamento) as media,
                STDDEV(faturamento) as desvio
            FROM monthly_sales
            GROUP BY mes, nome_mes
        )
        SELECT 
            nome_mes,
            ROUND(media::numeric, 2) as faturamento_medio,
            ROUND((desvio / NULLIF(media, 0) * 100)::numeric, 1) as volatilidade_pct
        FROM avg_by_month
        ORDER BY media DESC;
        """
        
        try:
            df = execute_query(query)
            return df.to_dict('records') if not df.empty else []
        except Exception as e:
            print(f"Error detect_seasonal_patterns: {e}", flush=True)
            return []


class SmartInsightGenerator:
    """Gerador de insights INTELIGENTES"""
    
    def generate_smart_insights(self, data_context):
        """Gera insights NÃO-ÓBVIOS com IA"""
        
        prompt = f"""
        Você é um CIENTISTA DE DADOS especializado em encontrar padrões ocultos e oportunidades de negócio.

        IMPORTANTE: NÃO repita informações óbvias que já existem em outros relatórios.
        Foque em: ANOMALIAS, CORRELAÇÕES OCULTAS, PREVISÕES, RISCOS ESTRATÉGICOS.

        DADOS DISPONÍVEIS:

        1. ANOMALIAS DETECTADAS (comportamentos fora do padrão):
        {self._format_anomalies(data_context.get('anomalies', []))}

        2. CORRELAÇÕES DE PRODUTOS (comprados juntos):
        {self._format_correlations(data_context.get('correlations', []))}

        3. OPORTUNIDADES PERDIDAS:
        {self._format_opportunities(data_context.get('opportunities', []))}

        4. CLIENTES EM RISCO DE CHURN (com contexto):
        {self._format_churn(data_context.get('churn', []))}

        5. PADRÕES SAZONAIS:
        {self._format_seasonality(data_context.get('seasonality', []))}

        REGRAS OBRIGATÓRIAS:
        - Gere EXATAMENTE 4 insights
        - Cada insight deve revelar algo NÃO-ÓBVIO
        - Foque em AÇÕES CONCRETAS e URGENTES
        - Use números específicos
        - Evite insights genéricos tipo "cliente X cresceu Y%"
        - Priorize: riscos iminentes, oportunidades de cross-sell, anomalias, previsões

        RETORNE JSON:
        {{
            "insights": [
                {{
                    "titulo": "Título curto e direto",
                    "detalhe": "Explicação específica com números",
                    "acao_recomendada": "Ação concreta e urgente"
                }}
            ]
        }}
        """
        
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system", 
                        "content": "Você é um cientista de dados que encontra padrões ocultos e não-óbvios em dados comerciais."
                    },
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            import json
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Erro OpenAI: {e}", flush=True)
            return self._generate_smart_fallback(data_context)
    
    def _format_anomalies(self, anomalies):
        if not anomalies:
            return "Nenhuma anomalia significativa detectada"
        
        formatted = []
        for a in anomalies:
            variacao = float(a.get('variacao_pct', 0) or 0)
            ticket = float(a.get('ticket_medio', 0) or 0)
            historico = float(a.get('ticket_medio_historico', 0) or 0)
            formatted.append(
                f"• {a.get('cliente', 'N/A')}: Ticket médio variou {variacao:+.1f}% "
                f"(R$ {ticket:,.2f} vs média R$ {historico:,.2f}) "
                f"na semana de {a.get('semana', 'N/A')}"
            )
        return "\n".join(formatted)
    
    def _format_correlations(self, correlations):
        if not correlations:
            return "Correlações insuficientes"
        
        formatted = []
        for c in correlations:
            formatted.append(
                f"• {c.get('produto_a', 'N/A')} + {c.get('produto_b', 'N/A')}: "
                f"Comprados juntos {c.get('vezes_juntos', 0)}x ({c.get('taxa_conversao', 0)}% conversão)"
            )
        return "\n".join(formatted)
    
    def _format_opportunities(self, opportunities):
        if not opportunities:
            return "Sem oportunidades mapeadas"
        
        formatted = []
        for o in opportunities:
            total = float(o.get('total_gasto', 0) or 0)
            formatted.append(
                f"• {o.get('cliente', 'N/A')}: Comprou {o.get('produtos_compra', 0)} produtos (R$ {total:,.2f}), "
                f"mas não compra {o.get('produtos_top_nao_comprados', 0)} dos top 10"
            )
        return "\n".join(formatted)
    
    def _format_churn(self, churn):
        if not churn:
            return "Sem riscos mapeados"
        
        formatted = []
        for c in churn:
            perda = float(c.get('perda_mensal_est', 0) or 0)
            formatted.append(
                f"• {c.get('cliente', 'N/A')}: {c.get('dias_inativo', 0)} dias inativo "
                f"(comprava a cada {c.get('freq_compra_dias', 0)} dias) - "
                f"Risco {c.get('nivel_risco', 'N/A')}, Perda: R$ {perda:,.2f}/mês"
            )
        return "\n".join(formatted)
    
    def _format_seasonality(self, seasonality):
        if not seasonality:
            return "Padrões insuficientes"
        
        best = seasonality[0] if seasonality else None
        worst = seasonality[-1] if len(seasonality) > 1 else None
        
        if best and worst:
            best_val = float(best.get('faturamento_medio', 0) or 0)
            return f"Melhor: {best.get('nome_mes', 'N/A')} (R$ {best_val:,.2f}), Pior: {worst.get('nome_mes', 'N/A')}"
        return "Dados insuficientes"
    
    def _generate_smart_fallback(self, data_context):
        """Fallback inteligente se OpenAI falhar"""
        insights = []
        
        # Anomalias (até 2)
        for anom in data_context.get('anomalies', [])[:2]:
            variacao = float(anom.get('variacao_pct', 0) or 0)
            ticket = float(anom.get('ticket_medio', 0) or 0)
            insights.append({
                "titulo": f"Anomalia: {anom.get('cliente', 'Cliente')} com variação atípica",
                "detalhe": f"Ticket médio variou {variacao:+.1f}% (R$ {ticket:,.2f} vs média histórica). Comportamento fora do padrão detectado.",
                "acao_recomendada": "Contato imediato para entender mudança no padrão de compra"
            })
        
        # Correlações (até 2)
        for corr in data_context.get('correlations', [])[:2]:
            prod_a = str(corr.get('produto_a', ''))[:25]
            prod_b = str(corr.get('produto_b', ''))[:25]
            insights.append({
                "titulo": f"Oportunidade de Bundle: {prod_a}",
                "detalhe": f"{corr.get('taxa_conversao', 0)}% dos clientes que compram {prod_a} também compram {prod_b}. Comprados juntos {corr.get('vezes_juntos', 0)} vezes.",
                "acao_recomendada": "Criar bundle com 15% desconto para aumentar conversão"
            })
        
        # Oportunidades (até 2)
        for opp in data_context.get('opportunities', [])[:2]:
            total = float(opp.get('total_gasto', 0) or 0)
            insights.append({
                "titulo": f"Cross-sell: {opp.get('cliente', 'Cliente')}",
                "detalhe": f"Cliente gastou R$ {total:,.2f} mas não compra {opp.get('produtos_top_nao_comprados', 0)} produtos top sellers.",
                "acao_recomendada": "Oferta direcionada dos produtos mais vendidos"
            })
        
        # Churn (até 2)
        for ch in data_context.get('churn', [])[:2]:
            perda = float(ch.get('perda_mensal_est', 0) or 0)
            insights.append({
                "titulo": f"Risco {ch.get('nivel_risco', 'ALERTA')}: {ch.get('cliente', 'Cliente')}",
                "detalhe": f"{ch.get('dias_inativo', 0)} dias inativo (comprava a cada {ch.get('freq_compra_dias', 0)} dias). Perda estimada: R$ {perda:,.2f}/mês",
                "acao_recomendada": "Reativação urgente com condições especiais"
            })
        
        # Sazonalidade
        seasonality = data_context.get('seasonality', [])
        if len(seasonality) >= 2:
            best = seasonality[0]
            worst = seasonality[-1]
            best_val = float(best.get('faturamento_medio', 0) or 0)
            worst_val = float(worst.get('faturamento_medio', 0) or 0)
            insights.append({
                "titulo": f"Padrão Sazonal: {best.get('nome_mes', '')} é o melhor mês",
                "detalhe": f"Melhor mês com R$ {best_val:,.2f} de média vs {worst.get('nome_mes', '')} com R$ {worst_val:,.2f}. Aproveite a sazonalidade.",
                "acao_recomendada": "Preparar estoque e campanhas para meses de alta"
            })
        
        return {"insights": insights[:6]}


def get_advanced_insights(ano: int = None, industry_id: int = None, startDate: str = None, endDate: str = None):
    """Função principal para obter insights avançados - OTIMIZADA com cache e paralelo"""
    import time
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    # ==========================================
    # OTIMIZAÇÃO 0: Verifica CACHE primeiro
    # ==========================================
    cache_key = f"insights_{ano}_{industry_id}_{startDate}_{endDate}"
    cached = get_cached_insights(cache_key)
    if cached:
        return cached
    
    start_time = time.time()
    print(f"[INSIGHTS] Iniciando get_advanced_insights (ano={ano}, ind={industry_id}, range={startDate}:{endDate})", flush=True)
    
    try:
        analyzer = AdvancedAnalyzer()
        
        # ==========================================
        # OTIMIZAÇÃO 1: Execução PARALELA das queries
        # ==========================================
        data_context = {}
        
        def run_query(name, func):
            try:
                query_start = time.time()
                result = func()
                print(f"[INSIGHTS] {name}: {time.time() - query_start:.2f}s", flush=True)
                return name, result
            except Exception as e:
                print(f"[INSIGHTS] Error {name}: {e}", flush=True)
                return name, []
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(run_query, 'anomalies', lambda: analyzer.detect_anomalies(startDate, endDate)): 'anomalies',
                executor.submit(run_query, 'correlations', lambda: analyzer.find_product_correlations(startDate, endDate)): 'correlations',
                executor.submit(run_query, 'opportunities', lambda: analyzer.detect_lost_opportunities(startDate, endDate)): 'opportunities',
                executor.submit(run_query, 'churn', lambda: analyzer.predict_churn_with_context(startDate, endDate)): 'churn',
                executor.submit(run_query, 'seasonality', analyzer.detect_seasonal_patterns): 'seasonality',
            }
            
            for future in as_completed(futures, timeout=10):  # Timeout de 10s para todas as queries
                try:
                    name, result = future.result()
                    data_context[name] = result
                except Exception as e:
                    print(f"[INSIGHTS] Future error: {e}", flush=True)
        
        # Garante que todos os campos existam
        for key in ['anomalies', 'correlations', 'opportunities', 'churn', 'seasonality']:
            if key not in data_context:
                data_context[key] = []
        
        query_time = time.time() - start_time
        print(f"[INSIGHTS] Queries completas em {query_time:.2f}s", flush=True)
        
        # ==========================================
        # OTIMIZAÇÃO 2: Timeout reduzido para OpenAI
        # ==========================================
        generator = SmartInsightGenerator()
        
        # Se já demorou muito nas queries, usa fallback local
        if query_time > 5:
            print(f"[INSIGHTS] Queries demoraram, usando fallback local", flush=True)
            insights_result = generator._generate_smart_fallback(data_context)
        else:
            insights_result = generator.generate_smart_insights(data_context)
        
        total_time = time.time() - start_time
        print(f"[INSIGHTS] Total: {total_time:.2f}s", flush=True)
        
        result = {
            'success': True,
            'data': {
                'insights': insights_result.get('insights', []),
                'raw_data': data_context,
                'generated_at': datetime.now().isoformat(),
                'performance': {
                    'query_time_s': round(query_time, 2),
                    'total_time_s': round(total_time, 2),
                    'cached': False
                }
            }
        }
        
        # ==========================================
        # SALVA NO CACHE para próximas chamadas
        # ==========================================
        set_cached_insights(cache_key, result)
        
        return result
        
    except Exception as e:
        print(f"Erro get_advanced_insights: {e}", flush=True)
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e), 'data': {'insights': [], 'raw_data': {}}}


# ============================================================
# FUNÇÕES LEGADAS (mantidas para compatibilidade com frontend)
# ============================================================

def generate_insights(ano: int, industry_id: int = None, startDate: str = None, endDate: str = None):
    """Mantida para compatibilidade - agora usa insights avançados"""
    result = get_advanced_insights(ano, industry_id, startDate, endDate)
    
    # Converte formato novo para formato antigo esperado pelo frontend
    insights_data = result.get('data', {}).get('insights', [])
    
    # Mapeia para o formato de categorias
    oportunidades = []
    alertas = []
    destaques = []
    riscos = []
    
    for insight in insights_data:
        titulo = insight.get('titulo', '')
        item = {
            "titulo": titulo,
            "detalhe": insight.get('detalhe', ''),
            "acao": insight.get('acao_recomendada', 'Ver detalhes'),
            "impacto": "Alto"
        }
        
        if 'anomalia' in titulo.lower() or 'risco' in titulo.lower() or 'crítico' in titulo.lower():
            riscos.append(item)
        elif 'bundle' in titulo.lower() or 'cross-sell' in titulo.lower() or 'oportunidade' in titulo.lower():
            oportunidades.append(item)
        elif 'alerta' in titulo.lower():
            alertas.append(item)
        else:
            destaques.append(item)
    
    return {
        "success": True,
        "industria_analisada": "Geral" if not industry_id else f"Indústria {industry_id}",
        "resumo_executivo": "Análise avançada com detecção de anomalias, correlações e riscos de churn.",
        "categorias": {
            "oportunidades": oportunidades,
            "alertas": alertas,
            "destaques": destaques,
            "riscos": riscos
        }
    }


def generate_critical_alerts_ai(ano: int, mes: str = 'Todos', industry_id: int = None, startDate: str = None, endDate: str = None):
    """Gera alertas críticos usando o novo sistema avançado"""
    result = get_advanced_insights(ano, industry_id, startDate, endDate)
    insights_data = result.get('data', {}).get('insights', [])
    
    alerts = []
    for insight in insights_data[:6]:
        alerts.append({
            "title": insight.get('titulo', 'Insight'),
            "subtitle": insight.get('detalhe', ''),
            "action": insight.get('acao_recomendada', '')
        })
    
    return alerts


# ============================================================
# FUNÇÕES LEGADAS (mantidas para compatibilidade com narratives.py)
# ============================================================

def get_oportunidades(industry_id: int = None):
    """Legado: Retorna oportunidades baseadas no novo sistema (churn preditivo)"""
    try:
        analyzer = AdvancedAnalyzer()
        churn_data = analyzer.predict_churn_with_context()
        opportunities = analyzer.detect_lost_opportunities()
        
        results = []
        
        # Converte churn para formato de oportunidade
        for item in churn_data[:2]:
            perda = float(item.get('perda_mensal_est', 0) or 0)
            results.append({
                "titulo": f"Reposição: {item.get('cliente', 'Cliente')}",
                "detalhe": f"Cliente costuma comprar a cada {item.get('freq_compra_dias', 0)} dias, mas está há {item.get('dias_inativo', 0)} dias sem pedidos.",
                "valor": f"R$ {perda:,.2f}/mês",
                "acao": "Oferecer reposição",
                "impacto": "Receita"
            })
        
        # Adiciona oportunidades de cross-sell
        for item in opportunities[:1]:
            total = float(item.get('total_gasto', 0) or 0)
            results.append({
                "titulo": f"Cross-sell: {item.get('cliente', 'Cliente')}",
                "detalhe": f"Cliente gastou R$ {total:,.2f} mas não compra {item.get('produtos_top_nao_comprados', 0)} dos produtos mais vendidos.",
                "valor": "Potencial Alto",
                "acao": "Oferta direcionada",
                "impacto": "Receita"
            })
        
        return results
    except Exception as e:
        print(f"Error get_oportunidades: {e}", flush=True)
        return []


def get_alertas_meta(industry_id: int = None):
    """Legado: Retorna alertas baseados no novo sistema (anomalias)"""
    try:
        analyzer = AdvancedAnalyzer()
        anomalies = analyzer.detect_anomalies()
        
        results = []
        for item in anomalies[:2]:
            variacao = float(item.get('variacao_pct', 0) or 0)
            results.append({
                "titulo": f"Anomalia: {item.get('cliente', 'Cliente')}",
                "detalhe": f"Ticket médio variou {variacao:+.1f}% comparado à média histórica. Comportamento atípico detectado.",
                "prioridade": "Alta" if abs(variacao) > 30 else "Média",
                "acao": "Investigar mudança",
                "impacto": "Risco"
            })
        
        return results
    except Exception as e:
        print(f"Error get_alertas_meta: {e}", flush=True)
        return []


def get_top_clientes_mes(industry_id: int = None):
    """Legado: Retorna destaques baseados no novo sistema (correlações)"""
    try:
        analyzer = AdvancedAnalyzer()
        correlations = analyzer.find_product_correlations()
        
        results = []
        for item in correlations[:2]:
            results.append({
                "titulo": f"Bundle: {str(item.get('produto_a', ''))[:25]}",
                "detalhe": f"Comprado junto com {str(item.get('produto_b', ''))[:25]} em {item.get('vezes_juntos', 0)} pedidos ({item.get('taxa_conversao', 0)}% conversão).",
                "valor": "Oportunidade",
                "acao": "Criar combo",
                "impacto": "Vendas"
            })
        
        return results
    except Exception as e:
        print(f"Error get_top_clientes_mes: {e}", flush=True)
        return []


def get_riscos_sugestao(industry_id: int = None):
    """Legado: Retorna riscos de churn baseados no novo sistema"""
    try:
        analyzer = AdvancedAnalyzer()
        churn_data = analyzer.predict_churn_with_context()
        
        # Filtra apenas riscos CRÍTICO ou ALERTA
        criticos = [c for c in churn_data if c.get('nivel_risco') in ['CRÍTICO', 'ALERTA']]
        
        results = []
        if criticos:
            count_critico = len([c for c in criticos if c.get('nivel_risco') == 'CRÍTICO'])
            count_alerta = len([c for c in criticos if c.get('nivel_risco') == 'ALERTA'])
            total_perda = sum(float(c.get('perda_mensal_est', 0) or 0) for c in criticos)
            
            results.append({
                "titulo": "Risco de Churn (Inatividade)",
                "detalhe": f"Identificamos {count_critico} clientes em risco CRÍTICO e {count_alerta} em ALERTA. Perda potencial: R$ {total_perda:,.2f}/mês.",
                "impacto": "Retenção",
                "acao": "Ativar Base",
                "prioridade": "Alta"
            })
        else:
            results.append({
                "titulo": "Monitoramento de Riscos",
                "detalhe": "Nenhum risco crítico de churn identificado no momento. A base de clientes ativos está saudável.",
                "impacto": "Positivo",
                "acao": "Manter",
                "prioridade": "Baixa"
            })
        
        return results
    except Exception as e:
        print(f"Error get_riscos_sugestao: {e}", flush=True)
        return []
