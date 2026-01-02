from services.database import execute_query
import pandas as pd

def generate_insights(ano: int, industry_id: int = None):
    """
    Gera narrativas baseadas em 4 categorias estratégicas para Representantes:
    Oportunidades, Alertas, Destaques e Riscos.
    Usa dados reais do PostgreSQL se industry_id for fornecido.
    """
    try:
        # Sanitizar industry_id
        if not industry_id:
            industry_id = None
        else:
            try:
                industry_id = int(industry_id)
            except:
                industry_id = None

        if industry_id:
            oportunidades = get_oportunidades(industry_id)
            alertas = get_alertas_meta(industry_id)
            destaques = get_top_clientes_mes(industry_id)
            riscos = get_riscos_sugestao(industry_id)
            prefixo = "Analisando a performance da indústria selecionada"
        else:
            oportunidades = get_oportunidades_globais(ano)
            alertas = get_alertas_globais(ano)
            destaques = get_destaques_globais(ano)
            riscos = [get_placeholder_sugestao()]
            prefixo = "Na visão geral do ano"

        total_oportunidades = len(oportunidades)
        total_alertas = len(alertas)
        
        resumo = f"{prefixo}, identificamos **{total_oportunidades} oportunidades** de faturamento e **{total_alertas} alertas** de agilidade. O foco deve ser na reposição preditiva e no fechamento de pedidos pendentes."

        return {
            "success": True,
            "industria_analisada": "Geral" if not industry_id else "Indústria Selecionada",
            "resumo_executivo": resumo,
            "categorias": {
                "oportunidades": oportunidades,
                "alertas": alertas,
                "destaques": destaques,
                "riscos": riscos
            }
        }
        
    except Exception as e:
        print(f"FAULT: Insights generation v2.1 failed: {str(e)}", flush=True)
        return {"error": f"Erro ao gerar insights: {str(e)}"}

def get_oportunidades(industry_id: int):
    """Real: Clientes 'atrasados' na reposição."""
    try:
        query = """
            WITH freq_clientes AS (
                SELECT 
                    p.ped_cliente,
                    c.cli_nomred,
                    MAX(p.ped_data) as ultima_compra,
                    CURRENT_DATE - MAX(p.ped_data) as dias_desde_ultima
                FROM pedidos p
                JOIN clientes c ON p.ped_cliente = c.cli_codigo
                WHERE p.ped_industria = :industry_id
                  AND p.ped_situacao IN ('P', 'F')
                GROUP BY 1, 2
            )
            SELECT * FROM freq_clientes
            WHERE dias_desde_ultima > 25
            ORDER BY dias_desde_ultima DESC
            LIMIT 3
        """
        df = execute_query(query, {"industry_id": industry_id})
        
        results = []
        for _, row in df.iterrows():
            results.append({
                "titulo": f"Reposição: {row['cli_nomred']}",
                "detalhe": f"Este cliente costuma comprar com mais frequência, mas está há {row['dias_desde_ultima']} dias sem pedidos nesta pasta.",
                "valor": "Potencial Alto",
                "acao": "Oferecer reposição",
                "impacto": "Receita"
            })
        
        # Se vazio, retornar modelo para sugestão
        if not results:
            results.append({
                "titulo": "Mix de Produtos (Real)",
                "detalhe": "Análise de quais produtos este cliente ainda não compra nesta indústria.",
                "valor": "Aguardando Vendas",
                "acao": "Analisar Mix",
                "impacto": "Oportunidade"
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
    """Alertas de performance global: Queda Ano x Ano."""
    try:
        # Comparar faturamento acumulado atual vs ano anterior (mesmo período)
        query = """
            WITH current_year AS (
                SELECT COALESCE(SUM(i.ite_totliquido), 0) as total 
                FROM pedidos p JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :ano 
                AND p.ped_situacao IN ('P', 'F')
            ),
            last_year AS (
                SELECT COALESCE(SUM(i.ite_totliquido), 0) as total 
                FROM pedidos p JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                WHERE EXTRACT(YEAR FROM p.ped_data) = :ano - 1
                AND p.ped_situacao IN ('P', 'F')
                AND EXTRACT(DOY FROM p.ped_data) <= EXTRACT(DOY FROM CURRENT_DATE)
            )
            SELECT 
                c.total as total_atual,
                l.total as total_anterior
            FROM current_year c, last_year l
        """
        df = execute_query(query, {"ano": ano})
        
        results = []
        if not df.empty:
            row = df.iloc[0]
            curr = float(row['total_atual'])
            prev = float(row['total_anterior'])
            
            if prev > 0 and curr < prev:
                diff_pct = ((curr - prev) / prev) * 100
                diff_val = prev - curr
                diff_fmt = f"R$ {diff_val:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
                
                results.append({
                    "titulo": "Alerta de Queda Anual",
                    "detalhe": f"O faturamento está {abs(diff_pct):.1f}% menor que o mesmo período do ano anterior (Diferença: {diff_fmt}).",
                    "prioridade": "Atenção",
                    "acao": "Rever Estratégia",
                    "impacto": "Meta Anual"
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

        query = f"""
            WITH clientes_ano_passado AS (
                SELECT DISTINCT ped_cliente 
                FROM pedidos p 
                WHERE EXTRACT(YEAR FROM p.ped_data) = EXTRACT(YEAR FROM CURRENT_DATE) - 1
                {ind_filter}
            ),
            clientes_este_ano AS (
                SELECT DISTINCT ped_cliente 
                FROM pedidos p 
                WHERE EXTRACT(YEAR FROM p.ped_data) = EXTRACT(YEAR FROM CURRENT_DATE)
                {ind_filter}
            )
            SELECT COUNT(*) as qtd_churn
            FROM clientes_ano_passado cap
            WHERE cap.ped_cliente NOT IN (SELECT ped_cliente FROM clientes_este_ano)
        """
        df = execute_query(query, params)
        
        results = []
        if not df.empty:
            churn_count = int(df.iloc[0]['qtd_churn'])
            if churn_count > 0:
                 results.append({
                    "titulo": "Risco de Churn (Inatividade)",
                    "detalhe": f"Identificamos {churn_count} clientes que compraram no ano passado mas ainda não realizaram pedidos este ano.",
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
