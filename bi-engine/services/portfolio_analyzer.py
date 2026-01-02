# bi-engine/services/portfolio_analyzer.py
from typing import Dict, List, Any, Optional
from .database import execute_query

class PortfolioAnalyzer:
    """Analisa portfólio usando apenas Functions SQL"""
    
    def analyze_portfolio(
        self, 
        ano: int, 
        mes: Optional[int], 
        industria_codigo: int
    ) -> Dict[str, Any]:
        """
        Análise completa do portfólio com Curva ABC
        Usa fn_analise_curva_abc do PostgreSQL
        """
        
        # Validação
        if not industria_codigo:
            raise ValueError("Indústria é obrigatória")
        
        # 1. Validar se tem dados no período
        validacao = self._validar_periodo(ano, mes, industria_codigo)
        
        if not validacao or not validacao.get('tem_dados', False):
            return {
                'success': False,
                'message': f'Nenhum dado encontrado para o período selecionado',
                'data': None
            }
        
        # 2. Buscar análise da curva ABC
        resumo = self._get_analise_curva_abc(ano, mes, industria_codigo)
        
        if resumo is None or len(resumo) == 0:
            return {
                'success': False,
                'message': 'Erro ao processar análise',
                'data': None
            }
        
        # 3. Buscar informações da indústria
        industria_info = self._get_industria_info(industria_codigo)
        
        # 4. Calcular totais
        total_itens = sum(row['qtd_itens'] for row in resumo)
        total_valor = sum(row['valor_total'] for row in resumo if row['valor_total'])
        
        # 5. Formatar período
        periodo_texto = self._format_periodo_db(ano, mes)
        
        # 6. Analisar cada curva
        curvas_analysis = []
        for row in resumo:
            curva_data = self._analyze_curva(row, total_itens, total_valor)
            curvas_analysis.append(curva_data)
        
        # 7. Gerar recomendação estratégica
        recomendacao = self._generate_recommendations(resumo, total_valor)
        
        return {
            'success': True,
            'data': {
                'periodo': periodo_texto,
                'industria': {
                    'codigo': industria_codigo,
                    'nome': industria_info['nome'] if industria_info else 'N/A'
                },
                'resumo_periodo': {
                    'total_pedidos': int(validacao['total_pedidos']),
                    'total_itens_vendidos': int(validacao['total_itens']),
                    'valor_total_periodo': float(validacao['valor_total']),
                    'primeira_venda': validacao['primeira_venda'].isoformat() if validacao.get('primeira_venda') else None,
                    'ultima_venda': validacao['ultima_venda'].isoformat() if validacao.get('ultima_venda') else None
                },
                'total_produtos_catalogo': total_itens,
                'total_valor_vendido': float(total_valor) if total_valor else 0,
                'curvas': curvas_analysis,
                'recomendacao_estrategica': recomendacao
            }
        }
    
    def _validar_periodo(
        self, 
        ano: int, 
        mes: Optional[int], 
        industria: int
    ) -> Optional[Dict]:
        """Valida período usando fn_validar_periodo"""
        query = "SELECT * FROM fn_validar_periodo(:ano, :industria, :mes)"
        df = execute_query(query, {"ano": ano, "industria": industria, "mes": mes})
        
        if df.empty:
            return None
        
        return df.iloc[0].to_dict()
    
    def _get_analise_curva_abc(
        self, 
        ano: int, 
        mes: Optional[int], 
        industria: int
    ) -> List[Dict]:
        """Busca análise usando fn_analise_curva_abc"""
        query = "SELECT * FROM fn_analise_curva_abc(:ano, :mes, :industria)"
        df = execute_query(query, {"ano": ano, "industria": industria, "mes": mes})
        
        if df.empty:
            return []
        
        return df.to_dict('records')
    
    def _get_industria_info(self, codigo: int) -> Optional[Dict]:
        """Busca informações da indústria"""
        query = """
            SELECT for_codigo as codigo, for_nomered as nome
            FROM fornecedores
            WHERE for_codigo = :codigo
        """
        df = execute_query(query, {"codigo": codigo})
        
        if df.empty:
            return None
        
        return df.iloc[0].to_dict()
    
    def _format_periodo_db(self, ano: int, mes: Optional[int]) -> str:
        """Formata período usando function do banco"""
        query = "SELECT fn_formatar_periodo(:ano, :mes) as periodo"
        df = execute_query(query, {"ano": ano, "mes": mes})
        
        if df.empty:
            return f"{ano}"
        
        return df.iloc[0]['periodo']
    
    def _analyze_curva(
        self, 
        curva_data: Dict, 
        total_itens: int, 
        total_valor: float
    ) -> Dict[str, Any]:
        """Analisa uma curva específica"""
        
        curva = curva_data['curva_abc']
        qtd = int(curva_data['qtd_itens'])
        perc_itens = float(curva_data['percentual_itens'] or 0)
        perc_fat = float(curva_data['percentual_faturamento'] or 0)
        valor = float(curva_data['valor_total'] or 0)
        
        # Configurações por curva
        config = {
            'A': {
                'icon': '🟢',
                'color': 'success',
                'status': self._analyze_curva_a(perc_itens, perc_fat),
                'detalhes': [
                    f"Estes {qtd} itens são seus best-sellers",
                    f"Representam {perc_fat:.0f}% do faturamento",
                    "✓ Gestão excelente" if perc_itens <= 10 else "⚠️ Expandir portfólio A"
                ]
            },
            'B': {
                'icon': '⚖️',
                'color': 'info',
                'status': 'EQUILIBRADO',
                'detalhes': [
                    "Performance intermediária",
                    "Potencial de crescimento",
                    "↗️ Monitorar evolução"
                ]
            },
            'C': {
                'icon': '⚠️',
                'color': 'warning',
                'status': self._analyze_curva_c(perc_itens, perc_fat),
                'detalhes': [
                    f"Muitos itens ({qtd}), pouco retorno",
                    f"Apenas {perc_fat:.0f}% do faturamento",
                    "⚡ Revisar estratégia"
                ]
            },
            'OFF': {
                'icon': '🔴',
                'color': 'danger',
                'status': self._analyze_curva_off(perc_itens, qtd),
                'detalhes': [
                    f"{int(perc_itens)}% do catálogo parado",
                    f"R$ {self._estimate_opportunity(qtd):,.0f} em oportunidade",
                    "🚨 Liquidar ou desativar"
                ]
            }
        }
        
        curva_config = config.get(curva, config['C'])
        
        # Textos de ação para os botões
        action_texts = {
            'A': 'GESTÃO EXCELENTE',
            'B': 'MONITORAR EVOLUÇÃO',
            'C': 'REVISAR ESTRATÉGIA',
            'OFF': 'LIQUIDAR / DESATIVAR'
        }
        
        return {
            'curva': curva,
            'label': f"Curva {curva} ({qtd} {'item' if qtd == 1 else 'itens'})",
            'qtd_itens': qtd,
            'valor_total': valor,
            'percentual_itens': round(perc_itens, 2),
            'percentual_faturamento': round(perc_fat, 2),
            'icon': curva_config['icon'],
            'color': curva_config['color'],
            'status': curva_config['status'],
            'detalhes': curva_config['detalhes'],
            'action_text': action_texts.get(curva, 'ANALISAR')
        }
    
    def _analyze_curva_a(self, perc_itens: float, perc_fat: float) -> str:
        if perc_itens < 5 and perc_fat >= 65:
            return "FOCO MÁXIMO"
        elif perc_itens > 10:
            return "EXPANDIR"
        else:
            return "EQUILIBRADO"
    
    def _analyze_curva_c(self, perc_itens: float, perc_fat: float) -> str:
        if perc_itens > 50:
            return "REVISAR ESTRATÉGIA"
        elif perc_fat < 10:
            return "AVALIAR CONTINUIDADE"
        else:
            return "MONITORAR"
    
    def _analyze_curva_off(self, perc_itens: float, qtd: int) -> str:
        if perc_itens > 30:
            return "AÇÃO URGENTE"
        elif perc_itens > 20:
            return "IMPORTANTE"
        else:
            return "MONITORAR"
    
    def _estimate_opportunity(self, qtd_itens: int) -> float:
        return qtd_itens * 2000
    
    def _generate_recommendations(
        self, 
        resumo: List[Dict], 
        total_valor: float
    ) -> Dict[str, Any]:
        """Gera recomendações"""
        
        recomendacoes = []
        curvas = {row['curva_abc']: row for row in resumo}
        
        if 'A' in curvas:
            curva_a = curvas['A']
            perc_fat = float(curva_a['percentual_faturamento'] or 0)
            qtd = int(curva_a['qtd_itens'])
            
            if perc_fat >= 65:
                recomendacoes.append({
                    'curva': 'A',
                    'priority': 'high',
                    'icon': '🎯',
                    'text': f"Garantir estoque 100% dos {qtd} itens + negociar melhores condições"
                })
        
        if 'C' in curvas:
            curva_c = curvas['C']
            perc_itens = float(curva_c['percentual_itens'] or 0)
            qtd = int(curva_c['qtd_itens'])
            
            if perc_itens > 50:
                itens_revisar = int(qtd * 0.4)
                recomendacoes.append({
                    'curva': 'C',
                    'priority': 'medium',
                    'icon': '🔪',
                    'text': f"Revisar {itens_revisar} itens de menor performance"
                })
        
        if 'OFF' in curvas:
            curva_off = curvas['OFF']
            perc_itens = float(curva_off['percentual_itens'] or 0)
            qtd = int(curva_off['qtd_itens'])
            
            if perc_itens > 20:
                valor_est = self._estimate_opportunity(qtd)
                recomendacoes.append({
                    'curva': 'OFF',
                    'priority': 'critical',
                    'icon': '🏷️',
                    'text': f"Campanha de liquidação: recuperar R$ {valor_est/1000:.0f}K+"
                })
        
        return {
            'title': '💡 Recomendação Estratégica',
            'items': recomendacoes
        }
    
    def get_produtos_detalhados(
        self,
        ano: int,
        mes: Optional[int],
        industria_codigo: int,
        curva: str,
        limit: int = 100
    ) -> List[Dict]:
        """
        Busca produtos detalhados usando fn_produtos_por_curva
        """
        query = """
            SELECT * FROM fn_produtos_por_curva(:ano, :industria, :curva, :mes, :limit)
        """
        
        df = execute_query(
            query, 
            {
                "ano": ano, 
                "industria": industria_codigo, 
                "curva": curva, 
                "mes": mes, 
                "limit": limit
            }
        )
        
        if df.empty:
            return []
        
        results = df.to_dict('records')
        
        return [
            {
                'id': row['pro_id'],
                'nome': row['pro_nome'],
                'valor_total': float(row['valor_total'] or 0),
                'quantidade': float(row['quantidade_vendida'] or 0),
                'pedidos': int(row['qtd_pedidos']),
                'ultima_venda': row['ultima_venda'].isoformat() if row.get('ultima_venda') else None,
                'dias_sem_venda': int(row['dias_sem_venda']),
                'percentual': round(float(row['percentual_individual'] or 0), 2)
            }
            for row in results
        ]
    
    def get_industrias_disponiveis(self) -> List[Dict]:
        """Lista indústrias usando fn_lista_industrias"""
        query = "SELECT * FROM fn_lista_industrias()"
        df = execute_query(query)
        
        if df.empty:
            return []
        
        results = df.to_dict('records')
        
        return [
            {
                'codigo': int(row['codigo']),
                'nome': row['nome']
            }
            for row in results
        ]

# Instância global
analyzer = PortfolioAnalyzer()
