// =====================================================
// MOCK DATA - EXEMPLO DE RESPOSTA DA IA
// =====================================================
// Use este arquivo para testar o frontend
// sem fazer chamadas reais à OpenAI
// =====================================================

const exemploAnaliseIA_RodrigoOdon = {
    "vendedor": {
        "vendedor_codigo": 1,
        "vendedor_nome": "RODRIGO ODON",
        "total_vendas_mes": 19625027,
        "total_vendas_mes_anterior": 18625027,
        "variacao_mom_percent": 5.17,
        "qtd_pedidos": 502,
        "ticket_medio": 39092.90,
        "meta_mes": 18000000,
        "perc_atingimento_meta": 109.03,
        "ranking": 1,
        "clientes_ativos": 64,
        "clientes_novos": 5,
        "clientes_perdidos": 3,
        "dias_desde_ultima_venda": 0,
        "total_interacoes_crm": 65,
        "status": "🏆 Acima da Meta"
    },

    "ia_insights": {

        // ========== RECOMENDAÇÕES DE AÇÃO ==========
        "recomendacoes": {
            "recomendacoes": [
                {
                    "prioridade": 1,
                    "tipo": "cliente_em_risco",
                    "titulo": "Cliente VIP em risco crítico",
                    "descricao": "MOLAÇO FILIAL está sem comprar há 78 dias. Este cliente tem histórico de R$ 285.000 em compras. Risco de perdê-lo para concorrência.",
                    "acao": "Agendar visita presencial com gerente nos próximos 3 dias. Preparar proposta especial com desconto de 5% + condições de pagamento estendidas.",
                    "impacto_estimado": "R$ 285.000"
                },
                {
                    "prioridade": 2,
                    "tipo": "cliente_em_risco",
                    "titulo": "3 clientes sem comprar há 60+ dias",
                    "descricao": "Identificados 3 clientes ativos que não compram há mais de 60 dias: MAX PEÇAS BETIM (73 dias), NUNES BARROS VARGINHA (72 dias), IRMÃOS VILELA (68 dias).",
                    "acao": "Iniciar campanha de reativação via WhatsApp + email. Oferecer condições especiais para volta. Agendar ligações para esta semana.",
                    "impacto_estimado": "R$ 180.000"
                },
                {
                    "prioridade": 3,
                    "tipo": "oportunidade",
                    "titulo": "Cliente TANDER aumentou pedidos 45%",
                    "descricao": "TANDER DISTRIBUIDORA está em tendência de crescimento forte. Aumentou volume em 45% nos últimos 2 meses. Oportunidade de upsell.",
                    "acao": "Apresentar linha premium de produtos. Agendar reunião para discutir aumento de limite de crédito e condições especiais para volumes maiores.",
                    "impacto_estimado": "R$ 120.000"
                },
                {
                    "prioridade": 4,
                    "tipo": "performance",
                    "titulo": "Ticket médio caiu 12%",
                    "descricao": "Ticket médio reduziu de R$ 44.500 para R$ 39.000. Vendedor está focando em pedidos menores.",
                    "acao": "Revisar mix de produtos. Focar em cross-sell de itens de maior margem. Treinar sobre técnica de upselling.",
                    "impacto_estimado": "R$ 150.000"
                },
                {
                    "prioridade": 5,
                    "tipo": "crm",
                    "titulo": "12 próximas ações CRM pendentes",
                    "descricao": "Existem 12 follow-ups agendados no CRM para os próximos 7 dias. Taxa de conversão CRM está em 23% (acima da média de 20%).",
                    "acao": "Priorizar os 5 clientes de maior potencial desta lista. Preparar propostas customizadas antes do contato.",
                    "impacto_estimado": "R$ 95.000"
                }
            ],
            "resumo": "RODRIGO está com performance excepcional (109% da meta), mas precisa atenção em 3 áreas: reativar clientes em risco (R$ 465K em jogo), aumentar ticket médio, e capitalizar oportunidades de upsell com clientes em crescimento."
        },

        // ========== PREVISÃO DE VENDAS ==========
        "previsao": {
            "previsao": {
                "valor_estimado": 20100000,
                "intervalo_confianca_min": 18500000,
                "intervalo_confianca_max": 21800000,
                "probabilidade_bater_meta": 92,
                "tendencia": "crescente",
                "sazonalidade_detectada": true
            },
            "analise": {
                "fatores_positivos": [
                    "Tendência de crescimento consistente nos últimos 3 meses (+5.2%, +4.8%, +5.17%)",
                    "Cliente TANDER em forte crescimento (+45%)",
                    "Taxa de conversão CRM acima da média (23% vs 20%)",
                    "5 clientes novos captados no mês",
                    "Histórico de bater meta nos últimos 3 meses consecutivos"
                ],
                "fatores_risco": [
                    "3 clientes VIP em risco (R$ 465K em jogo)",
                    "Ticket médio em queda (-12%)",
                    "Sazonalidade negativa identificada em janeiro (historicamente -8%)",
                    "Concorrência pode aproveitar clientes inativos"
                ],
                "recomendacao": "Previsão otimista para janeiro. Para garantir meta de R$ 18M (92% de chance), focar em: (1) reativar os 3 clientes VIP urgente, (2) capitalizar crescimento do TANDER, (3) manter ritmo de interações CRM. Atenção à sazonalidade de janeiro - planejar ações antecipadas em dezembro."
            }
        },

        // ========== ALERTAS DE RISCO ==========
        "alertas": {
            "alertas": [
                {
                    "severidade": "alto",
                    "categoria": "clientes",
                    "titulo": "3 clientes VIP sem comprar há 60+ dias",
                    "descricao": "MOLAÇO FILIAL (78 dias, R$ 285K histórico), MAX PEÇAS BETIM (73 dias, R$ 120K), NUNES BARROS (72 dias, R$ 60K). Total em risco: R$ 465.000.",
                    "acao_imediata": "Criar task force de reativação. Agendar visitas presenciais esta semana. Preparar propostas especiais com aprovação prévia de desconto."
                },
                {
                    "severidade": "medio",
                    "categoria": "performance",
                    "titulo": "Ticket médio em queda há 2 meses",
                    "descricao": "Redução de 12% no ticket médio (R$ 44.500 → R$ 39.000). Indica foco em pedidos menores ou perda de itens premium.",
                    "acao_imediata": "Revisar mix de produtos vendidos. Treinar sobre cross-sell e upsell. Definir meta mínima de ticket para próximos pedidos."
                },
                {
                    "severidade": "baixo",
                    "categoria": "tendencia",
                    "titulo": "Sazonalidade negativa em janeiro",
                    "descricao": "Histórico mostra queda média de 8% em janeiro. Dezembro forte pode mascarar preparação para janeiro.",
                    "acao_imediata": "Antecipar pedidos de janeiro ainda em dezembro. Criar promoção de virada de ano. Agendar reuniões com clientes principais."
                }
            ],
            "nivel_risco_geral": "medio",
            "resumo": "Vendedor com performance excelente mas 3 alertas importantes: clientes VIP em risco (alto), queda no ticket médio (médio), e sazonalidade de janeiro (baixo). Ações imediatas nos clientes VIP podem garantir janeiro forte."
        }
    },

    "clientes_risco": [
        {
            "vendedor_codigo": 1,
            "vendedor_nome": "RODRIGO ODON",
            "cliente_codigo": 456,
            "cliente_nome": "MOLAÇO FILIAL",
            "ultima_compra": "2025-10-17",
            "dias_sem_comprar": 78,
            "total_compras_historico": 45,
            "valor_total_historico": 285000,
            "ticket_medio": 6333.33,
            "nivel_risco": "🔴 Alto",
            "recomendacao": "📞 URGENTE: Cliente VIP sem comprar há 78 dias. Ligar imediatamente."
        },
        {
            "vendedor_codigo": 1,
            "vendedor_nome": "RODRIGO ODON",
            "cliente_codigo": 789,
            "cliente_nome": "MAX PEÇAS BETIM",
            "ultima_compra": "2025-10-22",
            "dias_sem_comprar": 73,
            "total_compras_historico": 28,
            "valor_total_historico": 120000,
            "ticket_medio": 4285.71,
            "nivel_risco": "🟡 Médio",
            "recomendacao": "📧 Enviar campanha de reativação + ligar."
        },
        {
            "vendedor_codigo": 1,
            "vendedor_nome": "RODRIGO ODON",
            "cliente_codigo": 123,
            "cliente_nome": "NUNES BARROS VARGINHA",
            "ultima_compra": "2025-10-23",
            "dias_sem_comprar": 72,
            "total_compras_historico": 18,
            "valor_total_historico": 60000,
            "ticket_medio": 3333.33,
            "nivel_risco": "🟡 Médio",
            "recomendacao": "📅 Agendar contato nos próximos 7 dias."
        }
    ],

    "interacoes": {
        "vendedor_codigo": 1,
        "vendedor_nome": "RODRIGO ODON",
        "total_interacoes": 65,
        "interacoes_telefone": 45,
        "interacoes_email": 12,
        "interacoes_visita": 8,
        "interacoes_whatsapp": 0,
        "duracao_media_minutos": 18.5,
        "proximas_acoes_pendentes": 12,
        "taxa_conversao": 23.08,
        "ultima_interacao": "2026-01-03T14:30:00",
        "produtividade": "🔥 Alta"
    },

    "gerado_em": "2026-01-04T09:15:00.000Z"
};

// =====================================================
// MOCK DATA PARA VENDEDOR COM PERFORMANCE RUIM
// =====================================================

const exemploAnaliseIA_RicardoCritico = {
    "vendedor": {
        "vendedor_codigo": 3,
        "vendedor_nome": "RICARDO SCHAFIRSTEIN",
        "total_vendas_mes": 965137,
        "total_vendas_mes_anterior": 1825000,
        "variacao_mom_percent": -47.12,
        "qtd_pedidos": 10,
        "ticket_medio": 9651.37,
        "meta_mes": 2000000,
        "perc_atingimento_meta": 48.26,
        "ranking": 3,
        "clientes_ativos": 39,
        "clientes_novos": 0,
        "clientes_perdidos": 15,
        "dias_desde_ultima_venda": 2,
        "total_interacoes_crm": 8,
        "status": "🔴 Crítico"
    },

    "ia_insights": {
        "recomendacoes": {
            "recomendacoes": [
                {
                    "prioridade": 1,
                    "tipo": "performance",
                    "titulo": "CRÍTICO: Vendas 52% abaixo da meta",
                    "descricao": "Vendedor atingiu apenas 48% da meta. Queda de 47% vs mês anterior. Situação crítica que requer intervenção imediata da gestão.",
                    "acao": "Reunião URGENTE com gerente. Revisar carteira de clientes. Definir plano de ação emergencial com metas semanais. Considerar redistribuir clientes top.",
                    "impacto_estimado": "R$ 1.034.863"
                },
                {
                    "prioridade": 2,
                    "tipo": "clientes",
                    "titulo": "15 clientes perdidos no mês",
                    "descricao": "Perda massiva de clientes ativos. De 54 para 39 clientes. Indica problema sério de relacionamento ou atendimento.",
                    "acao": "Investigar motivos de churn. Contatar os 15 clientes perdidos pessoalmente. Oferecer condições especiais para retorno. Treinamento em gestão de relacionamento.",
                    "impacto_estimado": "R$ 450.000"
                },
                {
                    "prioridade": 3,
                    "tipo": "crm",
                    "titulo": "Atividade CRM crítica: apenas 8 interações",
                    "descricao": "Média da equipe: 45 interações/mês. Este vendedor: 8. Taxa de conversão: 12.5% (média: 20%). Falta de prospecção ativa.",
                    "acao": "Meta mínima: 30 interações/semana. Acompanhamento diário do CRM. Coaching sobre técnicas de prospecção. Revisar processo de trabalho.",
                    "impacto_estimado": "R$ 200.000"
                },
                {
                    "prioridade": 4,
                    "tipo": "clientes",
                    "titulo": "Zero clientes novos captados",
                    "descricao": "Nenhum cliente novo no mês. Foco exclusivo em base existente (que está encolhendo). Falta de prospecção.",
                    "acao": "Definir meta: 3 novos clientes/mês. Alocar 30% do tempo em prospecção. Lista de leads qualificados. Treinamento em cold call.",
                    "impacto_estimado": "R$ 150.000"
                },
                {
                    "prioridade": 5,
                    "tipo": "performance",
                    "titulo": "Ticket médio 75% abaixo da equipe",
                    "descricao": "Ticket médio: R$ 9.651. Média da equipe: R$ 39.000. Vendendo apenas produtos de baixo valor/margem.",
                    "acao": "Revisar mix de produtos. Treinar sobre produtos premium. Estabelecer meta mínima de ticket. Acompanhar próximos 10 pedidos.",
                    "impacto_estimado": "R$ 300.000"
                }
            ],
            "resumo": "SITUAÇÃO CRÍTICA. Vendedor precisa de intervenção urgente: 52% abaixo da meta, perdeu 15 clientes, zero novos clientes, atividade CRM insuficiente. Requer plano de recuperação imediato ou substituição."
        },

        "previsao": {
            "previsao": {
                "valor_estimado": 850000,
                "intervalo_confianca_min": 600000,
                "intervalo_confianca_max": 1100000,
                "probabilidade_bater_meta": 5,
                "tendencia": "decrescente",
                "sazonalidade_detectada": false
            },
            "analise": {
                "fatores_positivos": [
                    "Ainda mantém 39 clientes ativos na base"
                ],
                "fatores_risco": [
                    "Tendência de queda há 3 meses consecutivos",
                    "15 clientes perdidos apenas neste mês",
                    "Nenhum cliente novo captado",
                    "Atividade CRM 82% abaixo da média",
                    "Ticket médio muito abaixo do padrão",
                    "Variação MoM de -47%"
                ],
                "recomendacao": "ALERTA MÁXIMO. Apenas 5% de chance de bater meta no próximo mês. Tendência decrescente forte. Requer ação imediata: (1) plano de recuperação com metas semanais, (2) coaching intensivo, (3) considerar redistribuição de clientes ou substituição do vendedor."
            }
        },

        "alertas": {
            "alertas": [
                {
                    "severidade": "critico",
                    "categoria": "performance",
                    "titulo": "Performance 52% abaixo da meta",
                    "descricao": "Situação crítica. Vendas de R$ 965K vs meta de R$ 2M. Queda de 47% vs mês anterior. Pior performance da equipe.",
                    "acao_imediata": "REUNIÃO URGENTE: Gerente + RH + Vendedor. Definir plano de 30 dias com metas semanais. Documentar situação. Considerar período de experiência."
                },
                {
                    "severidade": "critico",
                    "categoria": "clientes",
                    "titulo": "Perda massiva de clientes: 15 no mês",
                    "descricao": "Churn rate de 27% (15 de 54 clientes). Muito acima do aceitável (<5%). Indica problema estrutural.",
                    "acao_imediata": "Investigar causas. Contatar clientes perdidos. Win-back campaign. Se problema de atendimento, treinamento obrigatório."
                },
                {
                    "severidade": "alto",
                    "categoria": "crm",
                    "titulo": "Atividade CRM 82% abaixo da média",
                    "descricao": "8 interações vs 45 de média. Taxa de conversão de 12.5% vs 20%. Falta de trabalho ativo.",
                    "acao_imediata": "Meta obrigatória: mínimo 30 interações/semana. Acompanhamento diário via CRM. Coaching sobre metodologia de vendas."
                },
                {
                    "severidade": "alto",
                    "categoria": "clientes",
                    "titulo": "Zero novos clientes captados",
                    "descricao": "Nenhum cliente novo há 2 meses. Dependência total de base existente (que está encolhendo).",
                    "acao_imediata": "Meta obrigatória: 3 novos clientes/mês. Fornecer lista de leads. Treinamento em prospecção. Acompanhar pipeline semanalmente."
                }
            ],
            "nivel_risco_geral": "critico",
            "resumo": "SITUAÇÃO INSUSTENTÁVEL. Múltiplos alertas críticos. Vendedor precisa de plano de recuperação imediato ou substituição. Risco de perda total da carteira se não houver ação nos próximos 15 dias."
        }
    },

    "gerado_em": "2026-01-04T09:15:00.000Z"
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
    exemploAnaliseIA_RodrigoOdon,
    exemploAnaliseIA_RicardoCritico
};
