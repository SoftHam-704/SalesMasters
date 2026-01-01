const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'basesales',
    password: '@12Pilabo',
    port: 5432
});

const setupSql = `
-- Tabela de Etapas do Funil
CREATE TABLE IF NOT EXISTS crm_funil_etapas (
    etapa_id SERIAL PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL,
    ordem INTEGER NOT NULL,
    cor VARCHAR(20) DEFAULT 'bg-slate-100'
);

-- Tabela de Oportunidades (Deals)
CREATE TABLE IF NOT EXISTS crm_oportunidades (
    oportunidade_id SERIAL PRIMARY KEY,
    titulo VARCHAR(100) NOT NULL,
    cli_codigo INTEGER REFERENCES clientes(cli_codigo),
    ven_codigo INTEGER, -- Vendedor responsável
    etapa_id INTEGER REFERENCES crm_funil_etapas(etapa_id),
    valor_estimado DECIMAL(15, 2),
    data_fechamento_prevista DATE,
    probabilidade INTEGER DEFAULT 50, -- % de chance
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserir Etapas Padrão (Se não existirem)
INSERT INTO crm_funil_etapas (descricao, ordem, cor)
SELECT 'Prospecção', 1, 'bg-slate-100'
WHERE NOT EXISTS (SELECT 1 FROM crm_funil_etapas WHERE ordem = 1);

INSERT INTO crm_funil_etapas (descricao, ordem, cor)
SELECT 'Qualificação', 2, 'bg-blue-100'
WHERE NOT EXISTS (SELECT 1 FROM crm_funil_etapas WHERE ordem = 2);

INSERT INTO crm_funil_etapas (descricao, ordem, cor)
SELECT 'Proposta', 3, 'bg-purple-100'
WHERE NOT EXISTS (SELECT 1 FROM crm_funil_etapas WHERE ordem = 3);

INSERT INTO crm_funil_etapas (descricao, ordem, cor)
SELECT 'Negociação', 4, 'bg-amber-100'
WHERE NOT EXISTS (SELECT 1 FROM crm_funil_etapas WHERE ordem = 4);

INSERT INTO crm_funil_etapas (descricao, ordem, cor)
SELECT 'Fechamento', 5, 'bg-emerald-100'
WHERE NOT EXISTS (SELECT 1 FROM crm_funil_etapas WHERE ordem = 5);

-- Adicionar coluna 'oportunidade_id' na tabela de interações (Link opcional)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_interacao' AND column_name = 'oportunidade_id') THEN
        ALTER TABLE crm_interacao ADD COLUMN oportunidade_id INTEGER REFERENCES crm_oportunidades(oportunidade_id);
    END IF;
END $$;
`;

async function run() {
    try {
        console.log('🚧 Setting up CRM Pipeline tables...');
        await pool.query(setupSql);
        console.log('✅ CRM Pipeline tables ready!');
    } catch (error) {
        console.error('❌ Error setting up pipeline:', error);
    } finally {
        pool.end();
    }
}

run();
