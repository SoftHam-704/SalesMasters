-- Migração: Criar tabela de SETORES (subdivisões de cidades)
-- Versão: 1.0
-- Data: 2026-01-16

-- Tabela de Setores
CREATE TABLE IF NOT EXISTS setores (
    set_codigo SERIAL PRIMARY KEY,
    set_descricao VARCHAR(100) NOT NULL,
    set_cidade_id INTEGER NOT NULL,
    set_ordem INTEGER DEFAULT 0,
    set_cor VARCHAR(7) DEFAULT '#3B82F6',
    set_observacao TEXT,
    set_ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_setores_cidade ON setores(set_cidade_id);
CREATE INDEX IF NOT EXISTS idx_setores_ativo ON setores(set_ativo);

-- Adicionar coluna setor no cliente (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' AND column_name = 'cli_setor_id'
    ) THEN
        ALTER TABLE clientes ADD COLUMN cli_setor_id INTEGER;
    END IF;
END $$;

-- Índice para busca por setor
CREATE INDEX IF NOT EXISTS idx_clientes_setor ON clientes(cli_setor_id);

-- Comentários
COMMENT ON TABLE setores IS 'Setores/Bairros dentro de uma cidade para roteirização';
COMMENT ON COLUMN setores.set_descricao IS 'Nome do setor (ex: Setor Bueno, Centro, Zona Sul)';
COMMENT ON COLUMN setores.set_cidade_id IS 'ID da cidade (cid_codigo)';
COMMENT ON COLUMN setores.set_ordem IS 'Ordem sugerida de visita dentro da cidade';
COMMENT ON COLUMN setores.set_cor IS 'Cor para visualização em mapas/relatórios';
