-- Migração: Criar tabela de TRACKING de Campanhas
-- Versão: 2.2
-- Data: 2026-01-26

CREATE TABLE IF NOT EXISTS campanhas_tracking (
    tra_id SERIAL PRIMARY KEY,
    tra_campanha_id INTEGER NOT NULL REFERENCES campanhas_promocionais(cmp_codigo) ON DELETE CASCADE,
    tra_data DATE NOT NULL DEFAULT CURRENT_DATE,
    tra_vlr_acumulado NUMERIC(15,2) DEFAULT 0,
    tra_qtd_acumulada NUMERIC(15,4) DEFAULT 0,
    tra_observacao TEXT,
    tra_data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tra_campanha ON campanhas_tracking(tra_campanha_id);
CREATE INDEX IF NOT EXISTS idx_tra_data ON campanhas_tracking(tra_data);

COMMENT ON TABLE campanhas_tracking IS 'Lançamentos periódicos de progresso das campanhas (Realizado)';
