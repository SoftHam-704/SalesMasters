-- Migração: Criar tabela de CAMPANHAS PROMOCIONAIS
-- Versão: 2.0 (Foco Individual + Quantidade/Valor)
-- Data: 2026-01-16

CREATE TABLE IF NOT EXISTS campanhas_promocionais (
    cmp_codigo SERIAL PRIMARY KEY,
    cmp_descricao VARCHAR(150) NOT NULL,
    
    -- Relacionamentos
    cmp_cliente_id INTEGER NOT NULL, -- O Cliente (Individual)
    cmp_industria_id INTEGER NOT NULL, -- A Indústria
    cmp_promotor_id INTEGER, -- Usuário do sistema que criou/gere
    
    -- Status e Controle
    cmp_status VARCHAR(20) DEFAULT 'SIMULACAO', -- SIMULACAO, ATIVA, CONCLUIDA, CANCELADA
    cmp_data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cmp_data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Períodos
    cmp_periodo_base_ini DATE, -- Histórico Início
    cmp_periodo_base_fim DATE, -- Histórico Fim
    cmp_campanha_ini DATE NOT NULL, -- Campanha Início
    cmp_campanha_fim DATE NOT NULL, -- Campanha Fim
    
    -- Métricas BASE (Histórico)
    cmp_base_dias_kpi INTEGER DEFAULT 0, -- Dias considerados no cálculo
    cmp_base_valor_total NUMERIC(15,2) DEFAULT 0,
    cmp_base_qtd_total NUMERIC(15,4) DEFAULT 0,
    cmp_base_media_diaria_val NUMERIC(15,2) DEFAULT 0,
    cmp_base_media_diaria_qtd NUMERIC(15,4) DEFAULT 0,
    
    -- Metas (Futuro)
    cmp_perc_crescimento NUMERIC(5,2) DEFAULT 0, -- Ex: 20.00 (%)
    
    cmp_meta_valor_total NUMERIC(15,2) DEFAULT 0,
    cmp_meta_qtd_total NUMERIC(15,4) DEFAULT 0,
    
    cmp_meta_diaria_val NUMERIC(15,2) DEFAULT 0, -- O número mágico do dia (R$)
    cmp_meta_diaria_qtd NUMERIC(15,4) DEFAULT 0, -- O número mágico do dia (Qtd)
    
    -- Realizado (Acompanhamento)
    cmp_real_valor_total NUMERIC(15,2) DEFAULT 0,
    cmp_real_qtd_total NUMERIC(15,4) DEFAULT 0,
    cmp_percentual_atingido_val NUMERIC(5,2) DEFAULT 0,
    cmp_percentual_atingido_qtd NUMERIC(5,2) DEFAULT 0,
    
    -- Inteligência / Obs
    cmp_observacao TEXT,
    cmp_ai_insight TEXT -- Análise/Sugestão gerada pela IA
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_cmp_cliente ON campanhas_promocionais(cmp_cliente_id);
CREATE INDEX IF NOT EXISTS idx_cmp_industria ON campanhas_promocionais(cmp_industria_id);
CREATE INDEX IF NOT EXISTS idx_cmp_status ON campanhas_promocionais(cmp_status);
CREATE INDEX IF NOT EXISTS idx_cmp_periodo ON campanhas_promocionais(cmp_campanha_ini, cmp_campanha_fim);

-- Comentários para documentação
COMMENT ON TABLE campanhas_promocionais IS 'Acordos comerciais individuais 1-a-1 baseados em crescimento sobre histórico';
COMMENT ON COLUMN campanhas_promocionais.cmp_meta_diaria_val IS 'Meta diária em Reais projetada para o período da campanha';
COMMENT ON COLUMN campanhas_promocionais.cmp_base_dias_kpi IS 'Dias úteis ou corridos considerados no cálculo da média base';
