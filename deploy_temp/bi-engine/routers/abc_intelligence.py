from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime
from services.database import execute_query

MONTHS_MAP = { 'Todos': 'Todos', 'Janeiro': '01', 'Fevereiro': '02', 'Março': '03', 'Abril': '04', 'Maio': '05', 'Junho': '06', 'Julho': '07', 'Agosto': '08', 'Setembro': '09', 'Outubro': '10', 'Novembro': '11', 'Dezembro': '12' }

router = APIRouter(prefix="/api/analytics", tags=["ABC Intelligence"])


@router.get("/abc-intelligence")
async def get_abc_intelligence(
    ano: int = Query(default=None, description="Ano para análise"),
    meses: str = Query(default="todos", description="Meses separados por vírgula ou 'todos'"),
    industria: str = Query(default="todos", description="Código da indústria ou 'todos'"),
    clientes: str = Query(default="todos", description="Códigos de clientes separados por vírgula ou 'todos'"),
    metrica: str = Query(default="valor", description="valor|quantidade|unidades")
):
    """Análise ABC Intelligence com 7 insights + filtros"""
    try:
        # Default ano atual se não informado
        if ano is None:
            ano = datetime.now().year
        
        # Prepara filtros SQL
        filtro_sql = f"EXTRACT(YEAR FROM p.ped_data) = {ano}"
        
        if meses != 'todos':
            meses_list = meses.split(',')
            filtro_sql += f" AND EXTRACT(MONTH FROM p.ped_data) IN ({','.join(meses_list)})"
        
        if industria != 'todos':
            filtro_sql += f" AND p.ped_industria = {industria}"
        
        if clientes != 'todos':
            clientes_list = clientes.split(',')
            filtro_sql += f" AND p.ped_cliente IN ({','.join(clientes_list)})"
        
        # Define métrica
        if metrica == 'quantidade':
            metrica_campo = 'SUM(i.ite_quant)'
            metrica_label = 'Quantidade'
        elif metrica == 'unidades':
            metrica_campo = 'COUNT(DISTINCT i.ite_pedido)'
            metrica_label = 'Pedidos'
        else:  # valor
            metrica_campo = 'SUM(i.ite_totliquido)'
            metrica_label = 'Valor'
        
        # ========== 1. CURVA ABC BASE (usando function SQL) ==========
        query_abc = """
        SELECT * FROM fn_curva_abc(:ano, :meses, :industria, :clientes, :metrica)
        """
        
        df_abc = execute_query(query_abc, {
            'ano': ano,
            'meses': meses,
            'industria': industria,
            'clientes': clientes,
            'metrica': metrica
        })
        
        if df_abc.empty:
            return {
                'success': False,
                'message': 'Nenhum dado encontrado para os filtros selecionados'
            }
        
        produtos_abc = df_abc.to_dict('records')
        
        # Separa por curva
        curva_a = [p for p in produtos_abc if p['curva'] == 'A']
        curva_b = [p for p in produtos_abc if p['curva'] == 'B']
        curva_c = [p for p in produtos_abc if p['curva'] == 'C']
        
        total_geral = sum(float(p['total'] or 0) for p in produtos_abc)
        
        # ========== 2. ALERTA: CURVA C SOBRECARREGADA ==========
        alerta_curva_c = None
        if len(produtos_abc) > 0 and len(curva_c) / len(produtos_abc) > 0.5:
            percentual_valor_c = sum(float(p['total'] or 0) for p in curva_c) / total_geral * 100 if total_geral > 0 else 0
            alerta_curva_c = {
                'tipo': 'critico',
                'titulo': 'Curva C Sobrecarregada',
                'detalhes': [
                    f'{len(curva_c)} produtos ({len(curva_c)/len(produtos_abc)*100:.0f}%) geram apenas {percentual_valor_c:.1f}% do faturamento',
                    f'Custo de estoque estimado: R$ {len(curva_c) * 800:,.0f}/mês',
                    f'Ação: Descontinuar produtos com 0 vendas em 6 meses'
                ],
                'economia': round(len(curva_c) * 800 * 0.3, 2)
            }
        
        # ========== 3. OPORTUNIDADE: BAIXA PENETRAÇÃO CURVA A ==========
        query_clientes = f"""
            SELECT COUNT(DISTINCT cli_codigo) as total_clientes
            FROM clientes
            WHERE EXISTS (
                SELECT 1 FROM pedidos p
                WHERE p.ped_cliente = cli_codigo AND {filtro_sql}
            )
        """
        df_clientes = execute_query(query_clientes)
        total_clientes_ativos = int(df_clientes.iloc[0]['total_clientes']) if not df_clientes.empty else 0
        
        oportunidades_penetracao = []
        for produto in curva_a[:5]:  # Top 5 da Curva A
            qtd_clientes_prod = int(produto['qtd_clientes'] or 0)
            penetracao = qtd_clientes_prod / total_clientes_ativos * 100 if total_clientes_ativos > 0 else 0
            
            if penetracao < 50:  # Menos de 50% dos clientes
                potencial_clientes = total_clientes_ativos - qtd_clientes_prod
                ticket_medio = float(produto['total'] or 0) / qtd_clientes_prod if qtd_clientes_prod > 0 else 0
                oportunidade = potencial_clientes * ticket_medio * 0.3  # 30% de conversão
                
                oportunidades_penetracao.append({
                    'produto': produto['produto_nome'],
                    'clientes_atuais': qtd_clientes_prod,
                    'potencial': potencial_clientes,
                    'penetracao': round(penetracao, 1),
                    'oportunidade': round(oportunidade, 2)
                })
        
        # ========== 4. MIGRAÇÃO B→A ==========
        migracao_b_para_a = []
        if curva_b and curva_a:
            limite_a = float(curva_a[-1]['total'] or 0) if curva_a else 0
            
            for produto in curva_b[:3]:  # Top 3 da B
                valor_atual = float(produto['total'] or 0)
                gap = limite_a - valor_atual
                gap_percentual = (gap / limite_a * 100) if limite_a > 0 else 0
                
                if gap_percentual < 20 and gap_percentual > 0:  # Falta menos de 20% para virar A
                    migracao_b_para_a.append({
                        'produto': produto['produto_nome'],
                        'valor_atual': valor_atual,
                        'gap': round(gap, 2),
                        'percentual_falta': round(gap_percentual, 1)
                    })
        
        # ========== 5. PRODUTOS MORTOS ==========
        query_mortos = f"""
            SELECT COUNT(*) as qtd_mortos
            FROM cad_prod pr
            WHERE NOT EXISTS (
                SELECT 1 FROM itens_ped i
                INNER JOIN pedidos p ON i.ite_pedido = p.ped_pedido
                WHERE i.ite_idproduto = pr.pro_id
                  AND p.ped_data >= CURRENT_DATE - INTERVAL '12 months'
            )
            AND EXISTS (
                SELECT 1 FROM itens_ped i2
                WHERE i2.ite_idproduto = pr.pro_id
            )
        """
        df_mortos = execute_query(query_mortos)
        produtos_mortos = int(df_mortos.iloc[0]['qtd_mortos']) if not df_mortos.empty else 0
        
        # ========== 6. CROSS-SELL C→A ==========
        cross_sell_data = {'qtd_clientes': 0, 'valor_atual': 0}
        
        if curva_c and curva_a:
            # IDs dos produtos Curva C e A
            ids_curva_c = ','.join([str(int(p['produto_id'])) for p in curva_c[:20]])
            ids_curva_a = ','.join([str(int(p['produto_id'])) for p in curva_a[:10]])
            
            if ids_curva_c and ids_curva_a:
                query_cross = f"""
                WITH clientes_curva_c AS (
                    SELECT DISTINCT p.ped_cliente
                    FROM pedidos p
                    INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
                    WHERE {filtro_sql}
                      AND i.ite_idproduto IN ({ids_curva_c})
                      AND NOT EXISTS (
                          SELECT 1 FROM itens_ped i2
                          INNER JOIN pedidos p2 ON i2.ite_pedido = p2.ped_pedido
                          WHERE p2.ped_cliente = p.ped_cliente
                            AND EXTRACT(YEAR FROM p2.ped_data) = {ano}
                            AND i2.ite_idproduto IN ({ids_curva_a})
                      )
                )
                SELECT 
                    COUNT(*) as qtd_clientes,
                    COALESCE(SUM(total), 0) as valor_atual
                FROM (
                    SELECT ped_cliente, SUM(ped_totliq) as total
                    FROM pedidos p
                    WHERE ped_cliente IN (SELECT ped_cliente FROM clientes_curva_c)
                      AND {filtro_sql}
                    GROUP BY ped_cliente
                ) t
                """
                df_cross = execute_query(query_cross)
                if not df_cross.empty:
                    cross_sell_data = {
                        'qtd_clientes': int(df_cross.iloc[0]['qtd_clientes'] or 0),
                        'valor_atual': float(df_cross.iloc[0]['valor_atual'] or 0)
                    }
        
        # ========== 7. RESUMO POR CURVA ==========
        valor_a = sum(float(p['total'] or 0) for p in curva_a)
        valor_b = sum(float(p['total'] or 0) for p in curva_b)
        valor_c = sum(float(p['total'] or 0) for p in curva_c)
        
        resumo = {
            'A': {
                'produtos': len(curva_a),
                'valor': round(valor_a, 2),
                'percentual': round(valor_a / total_geral * 100, 1) if total_geral > 0 else 0
            },
            'B': {
                'produtos': len(curva_b),
                'valor': round(valor_b, 2),
                'percentual': round(valor_b / total_geral * 100, 1) if total_geral > 0 else 0
            },
            'C': {
                'produtos': len(curva_c),
                'valor': round(valor_c, 2),
                'percentual': round(valor_c / total_geral * 100, 1) if total_geral > 0 else 0
            }
        }
        
        # Formata produtos para resposta
        def format_produto(p):
            return {
                'ite_produto': int(p['produto_id']),
                'produto': p['produto_nome'],
                'total': float(p['total'] or 0),
                'qtd_clientes': int(p['qtd_clientes'] or 0),
                'percentual': float(p['percentual'] or 0),
                'percentual_acum': float(p['percentual_acum'] or 0),
                'curva': p['curva'],
                'ranking': int(p['ranking'])
            }
        
        return {
            'success': True,
            'data': {
                'resumo': resumo,
                'produtos': {
                    'A': [format_produto(p) for p in curva_a],
                    'B': [format_produto(p) for p in curva_b],
                    'C': [format_produto(p) for p in curva_c]
                },
                'insights': {
                    'alerta_curva_c': alerta_curva_c,
                    'oportunidades_penetracao': oportunidades_penetracao[:3],
                    'migracao_b_a': migracao_b_para_a,
                    'produtos_mortos': produtos_mortos,
                    'cross_sell': {
                        'clientes': cross_sell_data['qtd_clientes'],
                        'valor_atual': cross_sell_data['valor_atual'],
                        'potencial': round(cross_sell_data['valor_atual'] * 0.4, 2)
                    }
                },
                'metrica': metrica_label,
                'filtros_aplicados': {
                    'ano': ano,
                    'meses': meses,
                    'industria': industria,
                    'clientes': clientes
                }
            }
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {'success': False, 'error': str(e)}


@router.get("/value-qty-matrix")
async def get_value_qty_matrix(
    ano: int = Query(..., description="Ano base para análise"),
    mes: str = Query("Todos", description="Mês de referência"),
    industryId: Optional[str] = Query(None, description="ID da indústria"),
    considerarAnoTodo: bool = Query(False, description="Considerar faturamento anual acumulado"),
    redeDeLojas: bool = Query(False, description="Agrupar por rede de lojas")
):
    """
    Retorna a matriz de anomalias comparando Valor vs Quantidade (YoY).
    Identifica casos como Cyro Cavalcanti - RN (Explosão de Volume com queda de Valor).
    """
    try:
        ano_anterior = ano - 1
        
        # Filtros de data
        if considerarAnoTodo or mes == 'Todos':
            # Data anterior (apenas definição parcial, não usa query antiga)
            # filtro_data_anterior era usada na query OR antiga, mas mantemos para referência
            pass
        else:
            # Converte nome do mês para número se necessário
            mes_num = MONTHS_MAP.get(mes, mes)
            if not str(mes_num).isdigit():
                mes_num = datetime.now().month
            
        # Filtro de indústria
        filtro_industria = ""
        if industryId and industryId != 'Todos':
            filtro_industria = f"AND p.ped_industria = '{industryId}'"

        # Definição de agrupamento
        agrupamento_id = "c.cli_redeloja" if redeDeLojas else "p.ped_cliente"
        agrupamento_nome = "MAX(c.cli_nomred)" if not redeDeLojas else "COALESCE(NULLIF(c.cli_redeloja, ''), 'Sem Rede')"
        
        # OTIMIZAÇÃO: Busca um range único para permitir uso de índices
        data_inicio = f"{ano_anterior}-01-01"
        data_fim = f"{ano}-12-31"
        
        # Os filtros de mês continuam sendo aplicados via EXTRACT para precisão dentro do range
        filtro_mes_query = ""
        if not considerarAnoTodo and mes != 'Todos':
            mes_num = MONTHS_MAP.get(mes, mes)
            if str(mes_num).isdigit():
                filtro_mes_query = f"AND EXTRACT(MONTH FROM p.ped_data) = {mes_num}"

        query = f"""
        WITH sales_data AS (
            SELECT 
                {agrupamento_id} as id,
                {agrupamento_nome} as nome,
                EXTRACT(YEAR FROM p.ped_data) as ano_ref,
                SUM(i.ite_totliquido) as valor,
                SUM(i.ite_quant) as qtd
            FROM pedidos p
            INNER JOIN itens_ped i ON p.ped_pedido = i.ite_pedido
            INNER JOIN clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_data >= '{data_inicio}' AND p.ped_data <= '{data_fim}'
            {filtro_mes_query}
            {filtro_industria}
            AND p.ped_situacao IN ('P', 'F') -- Garante apenas pedidos válidos
            GROUP BY 1, 2, 3
        ),
        pivoted_data AS (
            SELECT 
                id,
                nome,
                SUM(CASE WHEN ano_ref = {ano_anterior} THEN valor ELSE 0 END) as valor_24,
                SUM(CASE WHEN ano_ref = {ano_anterior} THEN qtd ELSE 0 END) as qtd_24,
                SUM(CASE WHEN ano_ref = {ano} THEN valor ELSE 0 END) as valor_25,
                SUM(CASE WHEN ano_ref = {ano} THEN qtd ELSE 0 END) as qtd_25
            FROM sales_data
            GROUP BY 1, 2
        )
        SELECT 
            id,
            nome as cliente,
            valor_24,
            qtd_24,
            valor_25,
            qtd_25,
            CASE WHEN valor_24 > 0 THEN ROUND(((valor_25 - valor_24) / valor_24 * 100)::numeric, 2) ELSE 100 END as perc_valor,
            CASE WHEN qtd_24 > 0 THEN ROUND(((qtd_25 - qtd_24) / qtd_24 * 100)::numeric, 2) ELSE 100 END as perc_qtd
        FROM pivoted_data
        WHERE valor_24 > 0 OR valor_25 > 0
        ORDER BY valor_25 DESC
        """
        
        df = execute_query(query)
        if df.empty:
            return {"success": True, "data": {"anomalies": []}}

        results = df.to_dict('records')
        anomalies = []
        
        for item in results:
            v_perc = float(item['perc_valor'])
            q_perc = float(item['perc_qtd'])
            
            tipo = 'neutro'
            label = 'Performance Estável'
            
            # Lógica de Classificação de Anomalias (Igual ao Frontend)
            if item['valor_25'] == 0 and item['valor_24'] > 0:
                tipo = 'churn'
                label = f'Churn Detectado (Inativo em {ano})'
            elif q_perc > 100 and v_perc < (q_perc / 2):
                tipo = 'anomalia_volume'
                label = 'Explosão de Volume / Queda de Valor'
            elif v_perc > 5 and q_perc < 0:
                tipo = 'ticket_alto'
                label = 'Ganho de Ticket / Redução de Mix'
            elif q_perc > 50 and v_perc < 0:
                tipo = 'anomalia_volume'
                label = 'Volume Alto / Margem em Risco'
            
            if tipo != 'neutro': # Pegamos todos os insights relevantes
                item['tipo'] = tipo
                item['label'] = label
                anomalies.append(item)
            elif len(anomalies) < 20: # Se faltar, preenche com neutros tops
                item['tipo'] = tipo
                item['label'] = label
                anomalies.append(item)

        return {
            "success": True,
            "data": {
                "anomalies": anomalies[:100] # Limite para performance
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}
