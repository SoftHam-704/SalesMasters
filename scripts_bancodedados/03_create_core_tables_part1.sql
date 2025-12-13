-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 03: Core Tables - Part 1
-- Tables: VENDEDORES, FORNECEDORES, CLIENTES
-- ============================================================================

-- ============================================================================
-- Table: VENDEDORES (Vendedores/Representantes)
-- ============================================================================
CREATE TABLE vendedores (
    ven_codigo       INTEGER PRIMARY KEY DEFAULT nextval('gen_vendedores_id'),
    ven_nome         VARCHAR(45),
    ven_endereco     VARCHAR(50),
    ven_bairro       VARCHAR(25),
    ven_cidade       VARCHAR(25),
    ven_cep          VARCHAR(11),
    ven_uf           VARCHAR(2),
    ven_fone1        VARCHAR(20),
    ven_fone2        VARCHAR(20),
    ven_obs          VARCHAR(400),
    ven_cpf          VARCHAR(14),
    ven_comissao     DOUBLE PRECISION,
    ven_email        VARCHAR(60),
    ven_nomeusu      VARCHAR(50),
    ven_aniversario  VARCHAR(6),
    ven_rg           VARCHAR(30),
    ven_ctps         VARCHAR(30),
    ven_filiacao     VARCHAR(100),
    ven_pis          VARCHAR(20),
    ven_filhos       INTEGER,
    ven_codusu       INTEGER,
    ven_imagem       VARCHAR(200),
    gid              VARCHAR(38)
);

COMMENT ON TABLE vendedores IS 'Cadastro de vendedores/representantes comerciais';
COMMENT ON COLUMN vendedores.ven_codigo IS 'Código único do vendedor';
COMMENT ON COLUMN vendedores.ven_comissao IS 'Percentual de comissão padrão';

-- ============================================================================
-- Table: FORNECEDORES (Indústrias/Fornecedores)
-- ============================================================================
CREATE TABLE fornecedores (
    for_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_fornecedores_id'),
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
    for_tipofrete   CHAR(1),
    for_comissao    DOUBLE PRECISION,
    for_comissaofreio DOUBLE PRECISION,
    for_comissaooutro DOUBLE PRECISION,
    for_comissaoporgrupo BOOLEAN,
    for_comissaogrupofreio INTEGER,
    for_comissaogrupooutro INTEGER,
    for_tipocomissao VARCHAR(1),
    for_tabela      VARCHAR(20),
    for_logo        VARCHAR(200),
    gid             VARCHAR(38)
);

COMMENT ON TABLE fornecedores IS 'Cadastro de fornecedores/indústrias';
COMMENT ON COLUMN fornecedores.for_codigo IS 'Código único do fornecedor';
COMMENT ON COLUMN fornecedores.for_nomered IS 'Nome reduzido do fornecedor';
COMMENT ON COLUMN fornecedores.for_percom IS 'Percentual de comissão';
COMMENT ON COLUMN fornecedores.for_des1 IS 'Desconto padrão nível 1';

-- ============================================================================
-- Table: CLIENTES (Cadastro de Clientes)
-- ============================================================================
CREATE TABLE clientes (
    cli_codigo            INTEGER PRIMARY KEY DEFAULT nextval('gen_clientes_id'),
    cli_cnpj              VARCHAR(18) NOT NULL,
    cli_inscricao         VARCHAR(18),
    cli_tipopes           VARCHAR(1),
    cli_nome              VARCHAR(75),
    cli_nomred            VARCHAR(30),
    cli_fantasia          VARCHAR(45),
    cli_endereco          VARCHAR(200),
    cli_endnum            VARCHAR(15),
    cli_compendereco      VARCHAR(50),
    cli_bairro            VARCHAR(100),
    cli_cidade            VARCHAR(25),
    cli_uf                VARCHAR(2),
    cli_cep               VARCHAR(11),
    cli_ptoref            VARCHAR(250),
    cli_fone1             VARCHAR(20),
    cli_fone2             VARCHAR(20),
    cli_fone3             VARCHAR(20),
    cli_endcob            VARCHAR(45),
    cli_baicob            VARCHAR(25),
    cli_cidcob            VARCHAR(25),
    cli_cepcob            VARCHAR(11),
    cli_ufcob             VARCHAR(2),
    cli_email             VARCHAR(200),
    cli_emailnfe          VARCHAR(60),
    cli_skype             VARCHAR(150),
    cli_refcome           VARCHAR(600),
    cli_suframa           VARCHAR(15),
    cli_vencsuf           DATE,
    cli_caixapostal       VARCHAR(20),
    cli_vendedor          INTEGER,
    cli_regiao            INTEGER,
    cli_situacao          VARCHAR(1),
    cli_datacad           DATE,
    cli_ultcompra         DATE,
    cli_ultvisita         DATE,
    cli_ultcontato        DATE,
    cli_obs               TEXT,
    cli_obsparticular     VARCHAR(600),
    cli_obsped            VARCHAR(600),
    cli_imp               CHAR(1),
    cli_dtnasc            DATE,
    cli_rg                VARCHAR(20),
    cli_orgaorg           VARCHAR(15),
    cli_pai               VARCHAR(60),
    cli_mae               VARCHAR(60),
    cli_conjuge           VARCHAR(60),
    cli_dtcasamento       DATE,
    cli_naturalidade      VARCHAR(30),
    cli_nacionalidade     VARCHAR(30),
    cli_estadocivil       VARCHAR(1),
    cli_profissao         VARCHAR(30),
    cli_rendamensal       DOUBLE PRECISION,
    cli_temporesid        VARCHAR(15),
    cli_nomeref1          VARCHAR(60),
    cli_foneref1          VARCHAR(20),
    cli_nomeref2          VARCHAR(60),
    cli_foneref2          VARCHAR(20),
    cli_nomeref3          VARCHAR(60),
    cli_foneref3          VARCHAR(20),
    cli_limcredito        DOUBLE PRECISION,
    cli_saldodevedor      DOUBLE PRECISION,
    cli_ultpagamento      DATE,
    cli_ultapontamento    DATE,
    cli_contato           VARCHAR(55),
    cli_funcao            VARCHAR(35),
    cli_diaaniv           SMALLINT,
    cli_mes               SMALLINT,
    cli_niver             DATE,
    cli_fonecontato       VARCHAR(15),
    cli_emailcontato      VARCHAR(80),
    cli_imagem            VARCHAR(200),
    cli_latitude          VARCHAR(30),
    cli_longitude         VARCHAR(30),
    gid                   VARCHAR(38),
    cli_codmunicipio      INTEGER
);

COMMENT ON TABLE clientes IS 'Cadastro completo de clientes';
COMMENT ON COLUMN clientes.cli_codigo IS 'Código único do cliente';
COMMENT ON COLUMN clientes.cli_cnpj IS 'CNPJ ou CPF do cliente';
COMMENT ON COLUMN clientes.cli_nome IS 'Razão social ou nome completo';
COMMENT ON COLUMN clientes.cli_nomred IS 'Nome reduzido para listagens';
COMMENT ON COLUMN clientes.cli_vendedor IS 'Vendedor responsável';
COMMENT ON COLUMN clientes.cli_situacao IS 'Situação: A=Ativo, I=Inativo, B=Bloqueado';

-- ============================================================================
-- Indexes para performance
-- ============================================================================
CREATE INDEX idx_vendedores_nome ON vendedores(ven_nome);
CREATE INDEX idx_vendedores_cpf ON vendedores(ven_cpf);

CREATE INDEX idx_fornecedores_nome ON fornecedores(for_nome);
CREATE INDEX idx_fornecedores_nomered ON fornecedores(for_nomered);
CREATE INDEX idx_fornecedores_cgc ON fornecedores(for_cgc);

CREATE INDEX idx_clientes_nome ON clientes(cli_nome);
CREATE INDEX idx_clientes_nomred ON clientes(cli_nomred);
CREATE INDEX idx_clientes_cnpj ON clientes(cli_cnpj);
CREATE INDEX idx_clientes_vendedor ON clientes(cli_vendedor);
CREATE INDEX idx_clientes_cidade ON clientes(cli_cidade);
CREATE INDEX idx_clientes_situacao ON clientes(cli_situacao);

-- ============================================================================
-- Foreign Keys
-- ============================================================================
ALTER TABLE clientes 
    ADD CONSTRAINT fk_clientes_vendedor 
    FOREIGN KEY (cli_vendedor) 
    REFERENCES vendedores(ven_codigo);
