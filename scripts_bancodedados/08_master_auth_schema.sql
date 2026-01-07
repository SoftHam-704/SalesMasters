-- ========================================================
-- SCHEMA DO BANCO DE DADOS MASTER (CENTRAL DE CONTROLE)
-- Projeto: SalesMasters Cloud
-- Finalidade: Gestão de Clientes, Autenticação e Licenças
-- ========================================================

-- 1. TABELA DE EMPRESAS/REPRESENTANTES (TENANTS)
-- Esta é a tabela principal que controla quem pode usar o sistema.
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,       -- O identificador mestre que você já usa no Delphi
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    email_contato VARCHAR(150),
    telefone VARCHAR(20),
    
    -- Configurações da Licença
    status VARCHAR(20) DEFAULT 'ATIVO',    -- ATIVO, BLOQUEADO, DEGUSTAÇÃO, INADIMPLENTE
    data_adesao TIMESTAMP DEFAULT NOW(),
    data_vencimento DATE,                   -- Informativo (o bloqueio será apenas pelo status por enquanto)
    valor_mensalidade DECIMAL(10,2),
    limite_usuarios INTEGER DEFAULT 1,      -- Controle de quantos usuários esta empresa pode ter
    
    -- Dados de Conexão (Onde os dados desta empresa estão na nuvem)
    db_host VARCHAR(255),                   -- Ex: node123.saveincloud.net.br
    db_nome VARCHAR(100),                   -- Ex: basesales_empresa1
    db_usuario VARCHAR(100),
    db_senha VARCHAR(255),
    db_porta INTEGER DEFAULT 5432,
    
    -- Controle de Versão
    versao_liberada VARCHAR(20) DEFAULT '1.0.0',
    obs TEXT
);

-- 2. TABELA DE USUÁRIOS DO PORTAL (AUTH)
-- Usuários vinculados a uma empresa específica.
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,     -- Usado como Login
    senha VARCHAR(255) NOT NULL,            -- Senha criptografada
    celular VARCHAR(20),
    e_admin BOOLEAN DEFAULT FALSE,          -- Se for TRUE, pode gerenciar outros usuários da própria empresa
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW()
);

-- 3. TABELA DE HISTÓRICO DE MENSALIDADES
-- Para você ter o controle financeiro total de quem pagou e quando.
CREATE TABLE mensalidades (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    valor_pago DECIMAL(10,2),
    data_referencia DATE NOT NULL,          -- O "mês" que este pagamento se refere
    data_vencimento DATE NOT NULL,
    data_pagamento TIMESTAMP,
    status VARCHAR(20) DEFAULT 'PENDENTE', -- PENDENTE, PAGO, CANCELADO, ATRASADO
    metodo_pagamento VARCHAR(50),           -- PIX, BOLETO, CARTÃO
    comprovante_url TEXT                    -- Link para o arquivo ou foto se necessário
);

-- 4. ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_mensalidades_empresa ON mensalidades(empresa_id);

-- Comentários explicativos para o banco
COMMENT ON TABLE empresas IS 'Tabela que gerencia os clientes (tenants) e aponta para o banco de dados específico de cada um.';
COMMENT ON TABLE usuarios IS 'Usuários com permissão de login no sistema, vinculados a uma empresa.';
COMMENT ON TABLE mensalidades IS 'Controle financeiro das licenças do sistema.';
