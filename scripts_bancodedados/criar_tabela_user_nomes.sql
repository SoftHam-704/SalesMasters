-- ============================================
-- Tabela: USER_NOMES
-- Descrição: Tabela de usuários do sistema
-- Data: 21/12/2024
-- ============================================

-- Criar tabela user_nomes
CREATE TABLE IF NOT EXISTS user_nomes (
    codigo     SERIAL PRIMARY KEY,
    nome       VARCHAR(20) NOT NULL,
    sobrenome  VARCHAR(20) NOT NULL,
    senha      VARCHAR(20),
    grupo      VARCHAR(4),
    imagem     BYTEA,  -- Equivalente a BLOB no PostgreSQL
    master     BOOLEAN DEFAULT FALSE,
    gerencia   BOOLEAN DEFAULT FALSE,
    usuario    VARCHAR(20)
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_nomes_usuario ON user_nomes(usuario);
CREATE INDEX IF NOT EXISTS idx_user_nomes_grupo ON user_nomes(grupo);

-- Comentários na tabela
COMMENT ON TABLE user_nomes IS 'Tabela de usuários do sistema SalesMasters';
COMMENT ON COLUMN user_nomes.codigo IS 'Código único do usuário (auto-incremento)';
COMMENT ON COLUMN user_nomes.nome IS 'Nome do usuário';
COMMENT ON COLUMN user_nomes.sobrenome IS 'Sobrenome do usuário';
COMMENT ON COLUMN user_nomes.senha IS 'Senha do usuário (deve ser criptografada)';
COMMENT ON COLUMN user_nomes.grupo IS 'Grupo/perfil do usuário';
COMMENT ON COLUMN user_nomes.imagem IS 'Foto/avatar do usuário em formato binário';
COMMENT ON COLUMN user_nomes.master IS 'Indica se o usuário é administrador master';
COMMENT ON COLUMN user_nomes.gerencia IS 'Indica se o usuário tem permissões de gerência';
COMMENT ON COLUMN user_nomes.usuario IS 'Nome de usuário para login';

-- Exemplo de inserção
-- INSERT INTO user_nomes (nome, sobrenome, senha, grupo, master, gerencia, usuario)
-- VALUES ('Admin', 'Sistema', 'senha123', 'ADM', TRUE, TRUE, 'admin');
