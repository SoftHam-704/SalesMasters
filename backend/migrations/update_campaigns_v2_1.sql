-- Migração: Adicionar campos para a nova rotina de campanhas
-- Versão: 2.1
-- Data: 2026-01-26

ALTER TABLE campanhas_promocionais 
ADD COLUMN IF NOT EXISTS cmp_setor VARCHAR(100),
ADD COLUMN IF NOT EXISTS cmp_regiao VARCHAR(100),
ADD COLUMN IF NOT EXISTS cmp_equipe_vendas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cmp_verba_solicitada NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cmp_tema VARCHAR(200),
ADD COLUMN IF NOT EXISTS cmp_justificativa TEXT,
ADD COLUMN IF NOT EXISTS cmp_premiacoes TEXT,
ADD COLUMN IF NOT EXISTS cmp_tipo_periodo VARCHAR(50);

COMMENT ON COLUMN campanhas_promocionais.cmp_setor IS 'Setor do cliente no momento da criação';
COMMENT ON COLUMN campanhas_promocionais.cmp_regiao IS 'Região do cliente no momento da criação';
COMMENT ON COLUMN campanhas_promocionais.cmp_equipe_vendas IS 'Quantidade de pessoas na equipe de vendas';
COMMENT ON COLUMN campanhas_promocionais.cmp_verba_solicitada IS 'Verba solicitada à indústria para a campanha';
COMMENT ON COLUMN campanhas_promocionais.cmp_tema IS 'Tema ou mote da campanha promocional';
COMMENT ON COLUMN campanhas_promocionais.cmp_justificativa IS 'Justificativa final sobre o desempenho da campanha';
COMMENT ON COLUMN campanhas_promocionais.cmp_premiacoes IS 'Identificação das premiações entregues';
COMMENT ON COLUMN campanhas_promocionais.cmp_tipo_periodo IS 'Tipo de período base (BIMESTRAL, TRIMESTRAL, etc)';
