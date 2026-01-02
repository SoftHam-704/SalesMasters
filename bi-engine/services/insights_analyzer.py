from typing import List, Dict, Any
from datetime import datetime
from services.database_native import db

class InsightsAnalyzer:
    """
    Analisa dados e identifica insights críticos (Churn, Portfolio, Growth).
    Adaptado para estrutura de tabelas SalesMasters (pedidos, clientes, itens_ped).
    """
    
    def __init__(self):
        self.insights = []
    
    def analyze_all(self, ano: int = 2025) -> List[Dict[str, Any]]:
        """Executa todas as análises e retorna insights"""
        self.insights = []
        
        # Análises implementadas usando as novas views
        self.detect_churned_clients()
        self.detect_portfolio_issues(ano)
        self.detect_growth_opportunities(ano)
        
        # Ordena por prioridade
        return sorted(self.insights, key=lambda x: x['priority'], reverse=True)
    
    def detect_churned_clients(self):
        """Detecta clientes em risco de churn (Ciclo de compra vs Dias sem comprar)"""
        # CTE para simular vw_metricas_cliente
        # Risco: Dias sem compra > 2x Ciclo Médio
        query = """
            WITH ClientStats AS (
                SELECT 
                    p.ped_cliente as cli_codigo,
                    MAX(p.ped_data) as ultima_compra,
                    COUNT(*) as total_pedidos,
                    SUM(p.ped_totliq) as valor_total,
                    AVG(p.ped_totliq) as ticket_medio,
                    (CURRENT_DATE - MAX(p.ped_data)) as dias_sem_compra,
                    -- Ciclo medio aproximado: (DataMax - DataMin) / (Qtd-1)
                    CASE 
                        WHEN COUNT(*) > 1 THEN (MAX(p.ped_data) - MIN(p.ped_data)) / (COUNT(*) - 1)
                        ELSE 30 -- Default para cliente novo
                    END as ciclo_medio_dias
                FROM pedidos p
                WHERE p.ped_situacao IN ('P', 'F') 
                  AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY p.ped_cliente
            )
            SELECT 
                s.*,
                c.cli_nomred as cliente_nome
            FROM ClientStats s
            JOIN clientes c ON s.cli_codigo = c.cli_codigo
            WHERE s.dias_sem_compra > (s.ciclo_medio_dias * 2)
              AND s.dias_sem_compra > 45 -- Mínimo segurança
              AND s.total_pedidos >= 3
              AND s.valor_total >= 10000 -- Apenas clientes relevantes
            ORDER BY s.valor_total DESC
            LIMIT 5
        """
        
        results = db.execute_query(query)
        
        for row in results:
            dias_sem_compra = int(row['dias_sem_compra'])
            ciclo_medio = int(row['ciclo_medio_dias'])
            
            # Calcula impacto financeiro anualizado
            valor_anual = 0
            if row['total_pedidos'] > 0:
                valor_anual = (row['valor_total'] / row['total_pedidos']) * 12 # Projeção simplificada
            
            insight = {
                'id': f"churn_{row['cli_codigo']}",
                'type': 'critical',
                'category': 'churn',
                'priority': 100,
                'icon': '🚨',
                'title': f"Cliente {row['cliente_nome']} em Risco",
                'subtitle': f"{dias_sem_compra} dias sem compra",
                'description': (
                    f"Cliente histórico com {row['total_pedidos']} pedidos recentes. "
                    f"Não compra há {dias_sem_compra} dias (Ciclo normal: {ciclo_medio} dias)."
                ),
                'financial_impact': {
                    'value': float(valor_anual),
                    'type': 'negative',
                    'label': 'Perda Anual Estimada',
                    'description': f"Baseado em ticket médio de R$ {float(row['ticket_medio']):,.2f}"
                },
                'metrics': [
                    {
                        'label': 'Dias sem Compra',
                        'value': dias_sem_compra,
                        'change': None
                    },
                    {
                        'label': 'Valor LTM',
                        'value': f"R$ {float(row['valor_total']):,.2f}",
                        'change': None
                    }
                ],
                'actions': [
                    {
                        'icon': '📞',
                        'text': 'Ligar para Contato Principal',
                        'timeline': 'Hoje',
                        'action_type': 'call_client',
                        'action_data': {'cliente_id': row['cli_codigo']}
                    }
                ],
                'metadata': {
                    'cliente_id': row['cli_codigo'],
                    'generated_at': datetime.now().isoformat()
                }
            }
            self.insights.append(insight)

    def detect_portfolio_issues(self, ano: int):
        """Detecta problemas no portfólio (Itens OFF - Sem Venda)"""
        # Lógica: Contar itens no cadastro que NÃO estão em pedidos do ano
        query = f"""
            WITH VendasAno AS (
                SELECT DISTINCT i.ite_produto
                FROM itens_ped i
                JOIN pedidos p ON (i.ite_pedido ~ '^[0-9]+$' AND CAST(i.ite_pedido AS INTEGER) = p.ped_numero)
                WHERE EXTRACT(YEAR FROM p.ped_data) = {ano}
            ),
            EstoqueParado AS (
                SELECT COUNT(*) as qtd_off
                FROM cad_prod cp
                WHERE cp.pro_codprod NOT IN (SELECT ite_produto FROM VendasAno)
                  AND cp.pro_status = true -- Apenas ativos
            ),
            TotalAtivos AS (
                SELECT COUNT(*) as total FROM cad_prod WHERE pro_status = true
            )
            SELECT 
                off.qtd_off,
                tot.total
            FROM EstoqueParado off, TotalAtivos tot
        """
        
        res = db.execute_one(query)
        if res:
            qtd_off = res['qtd_off']
            total = res['total']
            if total > 0:
                percentual_off = (qtd_off / total) * 100
                
                if percentual_off > 10:
                    insight = {
                        'id': 'portfolio_off',
                        'type': 'warning',
                        'category': 'portfolio',
                        'priority': 85,
                        'icon': '📦',
                        'title': f"{percentual_off:.1f}% do Catálogo Parado",
                        'subtitle': f"{qtd_off} itens sem venda em {ano}",
                        'description': (
                            f"Identificamos {qtd_off} produtos ativos que não tiveram "
                            f"nenhuma saída este ano. Isso representa capital de giro travado."
                        ),
                        'financial_impact': {
                            'value': qtd_off * 1000, # Estimativa R$ 1000 custo oportunidade/item
                            'type': 'positive',
                            'label': 'Custo de Oportunidade',
                            'description': 'Valor estimado de estoque imóvel'
                        },
                        'actions': [
                            {
                                'icon': '🏷️',
                                'text': 'Criar Campanha de Queima',
                                'timeline': 'Imediato',
                                'action_type': 'create_campaign',
                                'action_data': {'type': 'liquidation'}
                            }
                        ]
                    }
                    self.insights.append(insight)

    def detect_growth_opportunities(self, ano: int):
        """Detecta clientes crescendo > 50% YoY"""
        query = f"""
            WITH AnoAtual AS (
                SELECT ped_cliente, SUM(ped_totliq) as total_atual
                FROM pedidos 
                WHERE EXTRACT(YEAR FROM ped_data) = {ano}
                GROUP BY ped_cliente
            ),
            AnoAnterior AS (
                SELECT ped_cliente, SUM(ped_totliq) as total_anterior
                FROM pedidos 
                WHERE EXTRACT(YEAR FROM ped_data) = {ano - 1}
                GROUP BY ped_cliente
            )
            SELECT 
                c.cli_codigo,
                c.cli_nomred,
                aa.total_anterior,
                at.total_atual,
                ((at.total_atual - aa.total_anterior) / NULLIF(aa.total_anterior, 1)) * 100 as crescimento_pct
            FROM AnoAtual at
            JOIN AnoAnterior aa ON at.ped_cliente = aa.ped_cliente
            JOIN clientes c ON at.ped_cliente = c.cli_codigo
            WHERE at.total_atual > 20000 
              AND aa.total_anterior > 5000
              AND ((at.total_atual - aa.total_anterior) / NULLIF(aa.total_anterior, 1)) * 100 > 50
            ORDER BY crescimento_pct DESC
            LIMIT 3
        """
        
        results = db.execute_query(query)
        for row in results:
            cresc = float(row['crescimento_pct'])
            insight = {
                'id': f"growth_{row['cli_codigo']}",
                'type': 'success',
                'category': 'opportunity',
                'priority': 80,
                'icon': '🚀',
                'title': f"{row['cli_nomred']} decolando! 🚀",
                'subtitle': f"+{cresc:.0f}% vs ano passado",
                'description': f"Cliente aumentou compras de R$ {float(row['total_anterior']):,.0f} para R$ {float(row['total_atual']):,.0f}.",
                'financial_impact': {
                    'value': float(row['total_atual']) * 0.2, # Projeção extra
                    'type': 'positive',
                    'label': 'Potencial Extra',
                    'description': 'Se mantiver ritmo'
                },
                'actions': [
                    {
                        'icon': '🤝',
                        'text': 'Agendar Visita de Relacionamento',
                        'timeline': 'Próxima Semana',
                        'action_type': 'schedule_meeting',
                        'action_data': {'cliente_id': row['cli_codigo']}
                    }
                ]
            }
            self.insights.append(insight)

# Instância global
analyzer = InsightsAnalyzer()
