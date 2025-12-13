-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 05: Supporting Tables - Part 1
-- Tables: GRUPOS, GRUPO_DESC, TRANSPORTADORA, REGIOES, FORMA_PAGAMENTO, etc.
-- ============================================================================

-- ============================================================================
-- Table: GRUPOS (Grupos de Produtos)
-- ============================================================================
CREATE TABLE grupos (
    gru_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_grupos_id'),
    gru_nome        VARCHAR(50),
    gru_industria   INTEGER,
    gru_desc1       DOUBLE PRECISION,
    gru_desc2       DOUBLE PRECISION,
    gru_desc3       DOUBLE PRECISION,
    gru_desc4       DOUBLE PRECISION,
    gru_desc5       DOUBLE PRECISION,
    gru_desc6       DOUBLE PRECISION,
    gru_desc7       DOUBLE PRECISION,
    gru_desc8       DOUBLE PRECISION,
    gru_desc9       DOUBLE PRECISION,
    gid             VARCHAR(38)
);

COMMENT ON TABLE grupos IS 'Grupos de produtos';

-- ============================================================================
-- Table: GRUPO_DESC (Grupos de Desconto)
-- ============================================================================
CREATE TABLE grupo_desc (
    gde_id          INTEGER PRIMARY KEY DEFAULT nextval('gen_grupo_desc_id'),
    gde_industria   INTEGER,
    gde_nome        VARCHAR(50),
    gde_desc1       DOUBLE PRECISION,
    gde_desc2       DOUBLE PRECISION,
    gde_desc3       DOUBLE PRECISION,
    gde_desc4       DOUBLE PRECISION,
    gde_desc5       DOUBLE PRECISION,
    gde_desc6       DOUBLE PRECISION,
    gde_desc7       DOUBLE PRECISION,
    gde_desc8       DOUBLE PRECISION,
    gde_desc9       DOUBLE PRECISION,
    gid             VARCHAR(38)
);

COMMENT ON TABLE grupo_desc IS 'Grupos de desconto por indústria';

-- ============================================================================
-- Table: TRANSPORTADORA
-- ============================================================================
CREATE TABLE transportadora (
    tra_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_transportadora_id'),
    tra_nome        VARCHAR(60),
    tra_endereco    VARCHAR(45),
    tra_bairro      VARCHAR(25),
    tra_cidade      VARCHAR(25),
    tra_uf          VARCHAR(2),
    tra_cep         VARCHAR(10),
    tra_fone        VARCHAR(25),
    tra_cgc         VARCHAR(18),
    tra_inscricao   VARCHAR(20),
    tra_email       VARCHAR(60),
    tra_contato     VARCHAR(45),
    tra_obs         VARCHAR(300),
    gid             VARCHAR(38)
);

COMMENT ON TABLE transportadora IS 'Cadastro de transportadoras';

-- ============================================================================
-- Table: REGIOES (Regiões de Venda)
-- ============================================================================
CREATE TABLE regioes (
    reg_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_regioes_id'),
    reg_nome        VARCHAR(50),
    reg_obs         VARCHAR(200),
    gid             VARCHAR(38)
);

COMMENT ON TABLE regioes IS 'Regiões de venda';

-- ============================================================================
-- Table: FORMA_PAGAMENTO (Formas de Pagamento)
-- ============================================================================
CREATE TABLE forma_pagamento (
    fpg_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_forma_pagamento_id'),
    fpg_descricao   VARCHAR(30),
    fpg_parcelas    INTEGER,
    fpg_intervalo   INTEGER,
    fpg_entrada     INTEGER,
    fpg_bandeira    INTEGER,
    fpg_ativo       VARCHAR(1),
    gid             VARCHAR(38)
);

COMMENT ON TABLE forma_pagamento IS 'Formas e condições de pagamento';

-- ============================================================================
-- Table: BANDEIRA (Bandeiras de Cartão)
-- ============================================================================
CREATE TABLE bandeira (
    codigo          INTEGER PRIMARY KEY DEFAULT nextval('gen_bandeira_id'),
    descricao       VARCHAR(50),
    ativo           VARCHAR(1)
);

COMMENT ON TABLE bandeira IS 'Bandeiras de cartão de crédito/débito';

-- ============================================================================
-- Table: CIDADES
-- ============================================================================
CREATE TABLE cidades (
    codigo          INTEGER PRIMARY KEY,
    codmun          INTEGER,
    coduf           INTEGER,
    nome            VARCHAR(60),
    uf              VARCHAR(2)
);

COMMENT ON TABLE cidades IS 'Cadastro de cidades (IBGE)';

-- ============================================================================
-- Table: CIDADES_REGIOES
-- ============================================================================
CREATE TABLE cidades_regioes (
    cre_codcidade   INTEGER,
    cre_codregiao   INTEGER,
    cre_uf          VARCHAR(2)
);

COMMENT ON TABLE cidades_regioes IS 'Relacionamento cidades x regiões';

-- ============================================================================
-- Table: CCUSTOS (Centros de Custo)
-- ============================================================================
CREATE TABLE ccustos (
    cc_id           INTEGER PRIMARY KEY DEFAULT nextval('gen_ccustos_id'),
    cc_descricao    VARCHAR(60)
);

COMMENT ON TABLE ccustos IS 'Centros de custo';

-- ============================================================================
-- Table: CONTAS (Plano de Contas)
-- ============================================================================
CREATE TABLE contas (
    con_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_contas_id'),
    con_descricao   VARCHAR(60),
    con_tipo        VARCHAR(1),
    con_saldo       DOUBLE PRECISION
);

COMMENT ON TABLE contas IS 'Plano de contas contábil';

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_grupos_industria ON grupos(gru_industria);
CREATE INDEX idx_grupo_desc_industria ON grupo_desc(gde_industria);
CREATE INDEX idx_cidades_nome ON cidades(nome);
CREATE INDEX idx_cidades_uf ON cidades(uf);
CREATE INDEX idx_cidades_regioes_cidade ON cidades_regioes(cre_codcidade);
CREATE INDEX idx_cidades_regioes_regiao ON cidades_regioes(cre_codregiao);

-- ============================================================================
-- Foreign Keys
-- ============================================================================
ALTER TABLE grupos 
    ADD CONSTRAINT fk_grupos_industria 
    FOREIGN KEY (gru_industria) 
    REFERENCES fornecedores(for_codigo);

ALTER TABLE grupo_desc 
    ADD CONSTRAINT fk_grupo_desc_industria 
    FOREIGN KEY (gde_industria) 
    REFERENCES fornecedores(for_codigo);

ALTER TABLE cidades_regioes 
    ADD CONSTRAINT fk_cidades_regioes_regiao 
    FOREIGN KEY (cre_codregiao) 
    REFERENCES regioes(reg_codigo);
