-- Migração: Criar tabelas de ITINERÁRIOS
-- Versão: 1.0
-- Data: 2026-01-16

-- 1. Cabeçalho do Itinerário
CREATE TABLE IF NOT EXISTS itinerarios (
    iti_codigo SERIAL PRIMARY KEY,
    iti_descricao VARCHAR(100) NOT NULL,
    iti_vendedor_id INTEGER, -- Opcional: Roteiro específico de um vendedor
    iti_ativo BOOLEAN DEFAULT true,
    iti_frequencia VARCHAR(20) DEFAULT 'SEMANAL', -- SEMANAL, QUINZENAL, MENSAL, ESPORADICO
    iti_observacao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Itens do Itinerário (Pode ser Cidade Inteira ou Setor Específico)
CREATE TABLE IF NOT EXISTS itinerarios_itens (
    ite_codigo SERIAL PRIMARY KEY,
    ite_itinerario_id INTEGER NOT NULL REFERENCES itinerarios(iti_codigo) ON DELETE CASCADE,
    ite_tipo CHAR(1) NOT NULL, -- 'C' = Cidade Inteira, 'S' = Setor Específico
    ite_cidade_id INTEGER NOT NULL, -- Sempre tem que ter a cidade base
    ite_setor_id INTEGER, -- Preenchido apenas se ite_tipo = 'S'
    ite_ordem INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_iti_vendedor ON itinerarios(iti_vendedor_id);
CREATE INDEX IF NOT EXISTS idx_ite_itinerario ON itinerarios_itens(ite_itinerario_id);
CREATE INDEX IF NOT EXISTS idx_ite_cidade ON itinerarios_itens(ite_cidade_id);
CREATE INDEX IF NOT EXISTS idx_ite_setor ON itinerarios_itens(ite_setor_id);

-- Comentários
COMMENT ON TABLE itinerarios IS 'Roteiros de visita (Ex: Rota Segunda, Viagem Norte)';
COMMENT ON TABLE itinerarios_itens IS 'Locais que compõem o roteiro (Cidades ou Setores)';
COMMENT ON COLUMN itinerarios_itens.ite_tipo IS 'C = Cidade Inteira (todos os clientes da cidade), S = Setor Específico';
