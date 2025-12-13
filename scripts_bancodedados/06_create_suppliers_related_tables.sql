-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 06: Suppliers Related Tables
-- Tables: CONTATO_FOR, DESCONTOS_IND, IND_METAS
-- ============================================================================

-- ============================================================================
-- Table: CONTATO_FOR (Contatos dos Fornecedores)
-- ============================================================================
CREATE TABLE contato_for (
    con_codigo      INTEGER PRIMARY KEY DEFAULT nextval('gen_contato_for_id'),
    con_fornec      INTEGER NOT NULL,
    con_nome        VARCHAR(60),
    con_cargo       VARCHAR(50),
    con_telefone    VARCHAR(20),
    con_celular     VARCHAR(20),
    con_email       VARCHAR(100),
    con_dtnasc      DATE,
    con_obs         VARCHAR(300),
    gid             VARCHAR(38)
);

COMMENT ON TABLE contato_for IS 'Contatos dos fornecedores/indústrias';
COMMENT ON COLUMN contato_for.con_fornec IS 'Código do fornecedor (FK)';

-- ============================================================================
-- Table: DESCONTOS_IND (Política de Descontos por Indústria)
-- ============================================================================
CREATE TABLE descontos_ind (
    des_id          INTEGER PRIMARY KEY DEFAULT nextval('gen_descontos_ind_id'),
    des_codind      INTEGER NOT NULL,
    des_descricao   VARCHAR(100),
    des_desc1       DOUBLE PRECISION,
    des_desc2       DOUBLE PRECISION,
    des_desc3       DOUBLE PRECISION,
    des_desc4       DOUBLE PRECISION,
    des_desc5       DOUBLE PRECISION,
    des_desc6       DOUBLE PRECISION,
    des_desc7       DOUBLE PRECISION,
    des_desc8       DOUBLE PRECISION,
    des_desc9       DOUBLE PRECISION,
    des_desc10      DOUBLE PRECISION,
    des_ativo       BOOLEAN,
    gid             VARCHAR(38)
);

COMMENT ON TABLE descontos_ind IS 'Política de descontos por indústria';
COMMENT ON COLUMN descontos_ind.des_codind IS 'Código da indústria (FK)';

-- ============================================================================
-- Table: IND_METAS (Metas Anuais por Indústria)
-- ============================================================================
CREATE TABLE ind_metas (
    met_id          INTEGER PRIMARY KEY,
    met_industria   INTEGER NOT NULL,
    met_ano         INTEGER NOT NULL,
    met_mes         INTEGER NOT NULL,
    met_valor       DOUBLE PRECISION,
    met_obs         VARCHAR(200),
    gid             VARCHAR(38)
);

COMMENT ON TABLE ind_metas IS 'Metas anuais por indústria (separadas por mês)';
COMMENT ON COLUMN ind_metas.met_industria IS 'Código da indústria (FK)';
COMMENT ON COLUMN ind_metas.met_ano IS 'Ano da meta';
COMMENT ON COLUMN ind_metas.met_mes IS 'Mês (1-12)';
COMMENT ON COLUMN ind_metas.met_valor IS 'Valor da meta';

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX idx_contato_for_fornec ON contato_for(con_fornec);
CREATE INDEX idx_contato_for_nome ON contato_for(con_nome);

CREATE INDEX idx_descontos_ind_codind ON descontos_ind(des_codind);
CREATE INDEX idx_descontos_ind_ativo ON descontos_ind(des_ativo);

CREATE INDEX idx_ind_metas_industria ON ind_metas(met_industria);
CREATE INDEX idx_ind_metas_ano ON ind_metas(met_ano);
CREATE INDEX idx_ind_metas_ano_mes ON ind_metas(met_ano, met_mes);

-- ============================================================================
-- Foreign Keys
-- ============================================================================
ALTER TABLE contato_for 
    ADD CONSTRAINT fk_contato_for_fornec 
    FOREIGN KEY (con_fornec) 
    REFERENCES fornecedores(for_codigo)
    ON DELETE CASCADE;

ALTER TABLE descontos_ind 
    ADD CONSTRAINT fk_descontos_ind_codind 
    FOREIGN KEY (des_codind) 
    REFERENCES fornecedores(for_codigo)
    ON DELETE CASCADE;

ALTER TABLE ind_metas 
    ADD CONSTRAINT fk_ind_metas_industria 
    FOREIGN KEY (met_industria) 
    REFERENCES fornecedores(for_codigo)
    ON DELETE CASCADE;

-- ============================================================================
-- Unique Constraints
-- ============================================================================
ALTER TABLE ind_metas 
    ADD CONSTRAINT uk_ind_metas_ano_mes 
    UNIQUE (met_industria, met_ano, met_mes);
