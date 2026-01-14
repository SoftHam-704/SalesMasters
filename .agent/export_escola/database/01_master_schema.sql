-- =====================================================
-- BANCO DE DADOS MASTER - CONTROLE DE ESCOLAS (TENANTS)
-- =====================================================

-- 1. TABELA DE ESCOLAS (TENANTS)
CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    email_contato VARCHAR(150),
    telefone VARCHAR(20),
    
    -- Licença
    status VARCHAR(20) DEFAULT 'ATIVO',
    data_adesao TIMESTAMP DEFAULT NOW(),
    data_vencimento DATE,
    valor_mensalidade DECIMAL(10,2),
    limite_usuarios INTEGER DEFAULT 5,
    limite_sessoes INTEGER DEFAULT 3,
    bloqueio_ativo VARCHAR(1) DEFAULT 'N',
    
    -- Conexão Tenant
    db_host VARCHAR(255),
    db_nome VARCHAR(100),
    db_schema VARCHAR(100) DEFAULT 'public',
    db_usuario VARCHAR(100),
    db_senha VARCHAR(255),
    db_porta INTEGER DEFAULT 5432,
    
    versao_liberada VARCHAR(20) DEFAULT '1.0.0',
    obs TEXT
);

-- 2. TABELA DE USUÁRIOS PORTAL
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    e_admin BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- 3. TABELA DE SESSÕES ATIVAS
CREATE TABLE IF NOT EXISTS sessoes_ativas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    usuario_id INTEGER,
    token_sessao VARCHAR(255) UNIQUE NOT NULL,
    tipo_usuario VARCHAR(20),
    dispositivo VARCHAR(255),
    ip_origem VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    ultima_atividade TIMESTAMP DEFAULT NOW(),
    data_inicio TIMESTAMP DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_sessoes_token ON sessoes_ativas(token_sessao);
CREATE INDEX IF NOT EXISTS idx_sessoes_empresa ON sessoes_ativas(empresa_id);
