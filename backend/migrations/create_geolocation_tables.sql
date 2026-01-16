-- Migração: Geolocalização e Registro de Visitas
-- 1. Adicionar coordenadas aos Clientes (Alvos)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_latitude DECIMAL(10, 8);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_longitude DECIMAL(11, 8);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS cli_raio_permitido INTEGER DEFAULT 300; -- Metros (margem de erro do GPS)

-- 2. Tabela de Registro de Visitas (O Check-in)
CREATE TABLE IF NOT EXISTS registro_visitas (
    vis_codigo SERIAL PRIMARY KEY,
    vis_datahora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Quem e Onde (Previsto)
    vis_promotor_id INTEGER NOT NULL, -- Usuário
    vis_cliente_id INTEGER NOT NULL, -- Cliente Alvo
    vis_itinerario_id INTEGER, -- Rota vinculada (opcional)
    
    -- Dados Reais (GPS do Celular)
    vis_latitude_checkin DECIMAL(10, 8) NOT NULL,
    vis_longitude_checkin DECIMAL(11, 8) NOT NULL,
    
    -- Auditoria
    vis_distancia_metros INTEGER, -- Distância calculada entre Checkin e Loja
    vis_valido BOOLEAN DEFAULT false, -- Se estava dentro do raio
    vis_observacao TEXT, -- Ex: "Check-in forçado pelo gestor" ou "GPS impreciso"
    
    vis_tipo VARCHAR(10) DEFAULT 'CHECKIN' -- CHECKIN, CHECKOUT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_vis_cliente ON registro_visitas(vis_cliente_id);
CREATE INDEX IF NOT EXISTS idx_vis_promotor ON registro_visitas(vis_promotor_id);
CREATE INDEX IF NOT EXISTS idx_vis_data ON registro_visitas(vis_datahora);

COMMENT ON COLUMN clientes.cli_latitude IS 'Latitude oficial da loja para validação de visitas';
COMMENT ON COLUMN registro_visitas.vis_distancia_metros IS 'Distância em metros do ponto de checkin até o cadastro do cliente';
