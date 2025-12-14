-- Script para recriar tabela FORNECEDORES com estrutura correta
-- Baseado na estrutura original do Firebird

-- 1. Dropar tabela existente
DROP TABLE IF EXISTS fornecedores CASCADE;

-- 2. Criar tabela com estrutura correta
CREATE TABLE fornecedores (
    for_codigo      INTEGER NOT NULL PRIMARY KEY,
    for_nome        VARCHAR(75),
    for_endereco    VARCHAR(45),
    for_bairro      VARCHAR(25),
    for_cidade      VARCHAR(25),
    for_uf          VARCHAR(2),
    for_cep         VARCHAR(10),
    for_fone        VARCHAR(25),
    for_fone2       VARCHAR(25),
    for_fax         VARCHAR(15),
    for_cgc         VARCHAR(18) NOT NULL,
    for_inscricao   VARCHAR(20),
    for_email       VARCHAR(120),
    for_codrep      INTEGER,
    for_tipo2       VARCHAR(1),
    for_percom      DOUBLE PRECISION,
    for_des1        DOUBLE PRECISION,
    for_des2        DOUBLE PRECISION,
    for_des3        DOUBLE PRECISION,
    for_des4        DOUBLE PRECISION,
    for_des5        DOUBLE PRECISION,
    for_des6        DOUBLE PRECISION,
    for_des7        DOUBLE PRECISION,
    for_des8        DOUBLE PRECISION,
    for_des9        DOUBLE PRECISION,
    for_des10       DOUBLE PRECISION,
    for_homepage    VARCHAR(150),
    for_contatorep  VARCHAR(50),
    observacoes     TEXT,
    for_obs2        TEXT,
    for_nomered     VARCHAR(15) NOT NULL,
    for_locimagem   VARCHAR(50),
    for_tipofrete   CHAR(1),
    gid             VARCHAR(38)
);

-- 3. Criar índices
CREATE INDEX idx_fornecedores_nome ON fornecedores(for_nome);
CREATE INDEX idx_fornecedores_cgc ON fornecedores(for_cgc);
CREATE INDEX idx_fornecedores_tipo2 ON fornecedores(for_tipo2);
CREATE INDEX idx_fornecedores_cidade ON fornecedores(for_cidade);
CREATE INDEX idx_fornecedores_nomered ON fornecedores(for_nomered);

-- 4. Comentários
COMMENT ON TABLE fornecedores IS 'Tabela de fornecedores/indústrias';
COMMENT ON COLUMN fornecedores.for_codigo IS 'Código único do fornecedor';
COMMENT ON COLUMN fornecedores.for_cgc IS 'CNPJ do fornecedor';
COMMENT ON COLUMN fornecedores.for_tipo2 IS 'Status: A=Ativo, I=Inativo';
COMMENT ON COLUMN fornecedores.for_nomered IS 'Nome reduzido';
COMMENT ON COLUMN fornecedores.observacoes IS 'Observações gerais';
COMMENT ON COLUMN fornecedores.for_obs2 IS 'Observações adicionais';

-- Pronto para importar!
