-- =====================================================
-- BANCO DE DADOS TENANT - TABELAS DE ACESSO
-- Execute em cada schema de escola
-- =====================================================

-- 1. TABELA DE USUÁRIOS DO SISTEMA
CREATE TABLE IF NOT EXISTS user_nomes (
    codigo SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    sobrenome VARCHAR(50) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    senha VARCHAR(255),
    grupo VARCHAR(4),
    master BOOLEAN DEFAULT FALSE,
    gerencia BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    imagem BYTEA
);

CREATE INDEX IF NOT EXISTS idx_user_nomes_usuario ON user_nomes(usuario);
CREATE INDEX IF NOT EXISTS idx_user_nomes_grupo ON user_nomes(grupo);

-- 2. TABELA DE GRUPOS (PERFIS)
CREATE TABLE IF NOT EXISTS user_grupos (
    grupo VARCHAR(4) PRIMARY KEY,
    descricao VARCHAR(50) NOT NULL
);

-- GRUPOS PADRÃO
INSERT INTO user_grupos (grupo, descricao) VALUES
    ('ADM', 'Administração'),
    ('COOR', 'Coordenação'),
    ('SEC', 'Secretaria'),
    ('PROF', 'Professor')
ON CONFLICT (grupo) DO NOTHING;

-- 3. TABELA DE PERMISSÕES
CREATE TABLE IF NOT EXISTS user_menu_superior (
    id SERIAL PRIMARY KEY,
    grupo VARCHAR(4) NOT NULL,
    indice INTEGER NOT NULL,
    descricao VARCHAR(100),
    opcao INTEGER,
    invisivel BOOLEAN DEFAULT FALSE,
    incluir BOOLEAN DEFAULT TRUE,
    modificar BOOLEAN DEFAULT TRUE,
    excluir BOOLEAN DEFAULT TRUE,
    porsenha BOOLEAN DEFAULT FALSE,
    UNIQUE(grupo, indice)
);

CREATE INDEX IF NOT EXISTS idx_user_menu_grupo ON user_menu_superior(grupo);

-- USUÁRIO MASTER PADRÃO (senha: admin)
INSERT INTO user_nomes (nome, sobrenome, usuario, senha, grupo, master, gerencia, ativo)
VALUES ('ADMIN', 'SISTEMA', 'admin', 'admin', 'ADM', TRUE, TRUE, TRUE)
ON CONFLICT (usuario) DO NOTHING;
