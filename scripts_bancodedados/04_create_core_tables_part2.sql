-- ============================================================================
-- SalesMasters - PostgreSQL Migration  
-- Script 04: Core Tables - Part 2
-- Tables: CAD_PROD, PEDIDOS, ITENS_PED
-- ============================================================================

-- ============================================================================
-- Table: CAD_PROD (Cadastro de Produtos)
-- ============================================================================
CREATE TABLE cad_prod (
    pro_id                 INTEGER PRIMARY KEY DEFAULT nextval('gen_cad_prod_id'),
    pro_industria          INTEGER NOT NULL,
    pro_codprod            VARCHAR(25),
    pro_codigooriginal     VARCHAR(50),
    pro_codigonormalizado  VARCHAR(40),
    pro_nome               VARCHAR(100),
    pro_produtolancamento  BOOLEAN,
    pro_datalancamento     DATE,
    pro_curvaindustria     CHAR(1),
    pro_codbarras          VARCHAR(13),
    pro_grupo              INTEGER,
    pro_setor              VARCHAR(30),
    pro_linha              VARCHAR(50),
    pro_embalagem          INTEGER,
    pro_peso               DOUBLE PRECISION,
    pro_conversao          VARCHAR(300),
    pro_ncm                VARCHAR(10),
    pro_aplicacao          VARCHAR(300),
    pro_aplicacao2         VARCHAR(800),
    pro_linhaleve          BOOLEAN,
    pro_linhapesada        BOOLEAN,
    pro_linhaagricola      BOOLEAN,
    pro_linhautilitarios   BOOLEAN,
    pro_offroad            BOOLEAN,
    pro_status             BOOLEAN,
    pro_motocicletas       BOOLEAN,
    pro_origem             CHAR(1)
);

COMMENT ON TABLE cad_prod IS 'Cadastro de produtos das indústrias';
COMMENT ON COLUMN cad_prod.pro_id IS 'ID único do produto';
COMMENT ON COLUMN cad_prod.pro_industria IS 'Código da indústria/fornecedor';
COMMENT ON COLUMN cad_prod.pro_codprod IS 'Código do produto';
COMMENT ON COLUMN cad_prod.pro_nome IS 'Descrição do produto';

-- ============================================================================
-- Table: PEDIDOS (Pedidos de Venda)
-- ============================================================================
CREATE TABLE pedidos (
    ped_numero       INTEGER NOT NULL,
    ped_pedido       VARCHAR(10) NOT NULL PRIMARY KEY,
    ped_tabela       VARCHAR(25) NOT NULL,
    ped_data         DATE,
    ped_industria    INTEGER NOT NULL,
    ped_cliente      INTEGER NOT NULL,
    ped_transp       INTEGER NOT NULL,
    ped_vendedor     SMALLINT NOT NULL,
    ped_cliind       VARCHAR(15),
    ped_situacao     VARCHAR(1),
    ped_pri          DOUBLE PRECISION,
    ped_seg          DOUBLE PRECISION,
    ped_ter          DOUBLE PRECISION,
    ped_qua          DOUBLE PRECISION,
    ped_qui          DOUBLE PRECISION,
    ped_sex          DOUBLE PRECISION,
    ped_set          DOUBLE PRECISION,
    ped_oit          DOUBLE PRECISION,
    ped_nov          DOUBLE PRECISION,
    ped_dez          DOUBLE PRECISION,
    ped_descadic     DOUBLE PRECISION,
    ped_coeficiente  DOUBLE PRECISION,
    ped_condpag      VARCHAR(100),
    ped_tipofrete    VARCHAR(1),
    ped_totliq       DOUBLE PRECISION,
    ped_totbruto     DOUBLE PRECISION,
    ped_acrescimo    DOUBLE PRECISION,
    ped_totalipi     DOUBLE PRECISION,
    ped_comprador    VARCHAR(30),
    ped_emailcomp    VARCHAR(60),
    ped_fonecomp     VARCHAR(20),
    ped_obs          TEXT,
    ped_obsind       VARCHAR(600),
    ped_datacad      DATE,
    ped_horacad      VARCHAR(8),
    ped_datafat      DATE,
    ped_numnf        VARCHAR(15),
    ped_numped       VARCHAR(15),
    ped_valorst      DOUBLE PRECISION,
    ped_valorfrete   DOUBLE PRECISION,
    ped_pesobruto    DOUBLE PRECISION,
    ped_pesoliquido  DOUBLE PRECISION,
    ped_volumes      INTEGER,
    ped_especie      VARCHAR(15),
    ped_marca        VARCHAR(15),
    ped_comissao     DOUBLE PRECISION,
    ped_percentual   DOUBLE PRECISION,
    ped_porgrupo     BOOLEAN,
    ped_tipocomissao VARCHAR(1),
    ped_grupofreio   DOUBLE PRECISION,
    ped_grupooutro   DOUBLE PRECISION,
    gid              VARCHAR(38)
);

COMMENT ON TABLE pedidos IS 'Pedidos de venda';
COMMENT ON COLUMN pedidos.ped_pedido IS 'Número do pedido (PK)';
COMMENT ON COLUMN pedidos.ped_situacao IS 'Situação: A=Aberto, F=Faturado, C=Cancelado';
COMMENT ON COLUMN pedidos.ped_pri IS 'Desconto nível 1';
COMMENT ON COLUMN pedidos.ped_seg IS 'Desconto nível 2';

-- ============================================================================
-- Table: ITENS_PED (Itens dos Pedidos)
-- ============================================================================
CREATE TABLE itens_ped (
    ite_lancto             INTEGER PRIMARY KEY DEFAULT nextval('gen_itens_ped_id'),
    ite_pedido             VARCHAR(10) NOT NULL,
    ite_industria          INTEGER NOT NULL,
    ite_produto            VARCHAR(25) NOT NULL,
    ite_embuch             VARCHAR(15),
    ite_nomeprod           VARCHAR(100),
    ite_grupo              SMALLINT,
    ite_data               TIMESTAMP,
    ite_quant              DOUBLE PRECISION,
    ite_puni               DOUBLE PRECISION,
    ite_puniliq            DOUBLE PRECISION,
    ite_totliquido         DOUBLE PRECISION,
    ite_descadic           DOUBLE PRECISION,
    ite_des1               DOUBLE PRECISION,
    ite_des2               DOUBLE PRECISION,
    ite_des3               DOUBLE PRECISION,
    ite_des4               DOUBLE PRECISION,
    ite_des5               DOUBLE PRECISION,
    ite_des6               DOUBLE PRECISION,
    ite_des7               DOUBLE PRECISION,
    ite_des8               DOUBLE PRECISION,
    ite_des9               DOUBLE PRECISION,
    ite_des10              DOUBLE PRECISION,
    ite_des11              DOUBLE PRECISION,
    ite_descontos          VARCHAR(200),
    ite_totbruto           DOUBLE PRECISION,
    ite_valcomipi          DOUBLE PRECISION,
    ite_ipi                NUMERIC(7,2),
    ite_st                 DOUBLE PRECISION,
    ite_valcomst           DOUBLE PRECISION,
    ite_valtotal           DOUBLE PRECISION,
    ite_precokg            DOUBLE PRECISION,
    ite_pesoitem           DOUBLE PRECISION,
    ite_qtdfat             DOUBLE PRECISION,
    ite_qtddev             DOUBLE PRECISION,
    ite_saldo              DOUBLE PRECISION,
    ite_obs                VARCHAR(300),
    ite_bonificacao        BOOLEAN,
    ite_codbarras          VARCHAR(13),
    ite_ncm                VARCHAR(10),
    ite_cst                VARCHAR(3),
    ite_cfop               VARCHAR(4),
    ite_unidade            VARCHAR(6),
    ite_origem             CHAR(1),
    gid                    VARCHAR(38)
);

COMMENT ON TABLE itens_ped IS 'Itens dos pedidos de venda';
COMMENT ON COLUMN itens_ped.ite_lancto IS 'ID único do item';
COMMENT ON COLUMN itens_ped.ite_pedido IS 'Número do pedido (FK)';
COMMENT ON COLUMN itens_ped.ite_quant IS 'Quantidade';
COMMENT ON COLUMN itens_ped.ite_puni IS 'Preço unitário bruto';
COMMENT ON COLUMN itens_ped.ite_puniliq IS 'Preço unitário líquido';

-- ============================================================================
-- Indexes para performance
-- ============================================================================
CREATE INDEX idx_cad_prod_industria ON cad_prod(pro_industria);
CREATE INDEX idx_cad_prod_codprod ON cad_prod(pro_codprod);
CREATE INDEX idx_cad_prod_nome ON cad_prod(pro_nome);
CREATE INDEX idx_cad_prod_grupo ON cad_prod(pro_grupo);

CREATE INDEX idx_pedidos_data ON pedidos(ped_data);
CREATE INDEX idx_pedidos_cliente ON pedidos(ped_cliente);
CREATE INDEX idx_pedidos_industria ON pedidos(ped_industria);
CREATE INDEX idx_pedidos_vendedor ON pedidos(ped_vendedor);
CREATE INDEX idx_pedidos_situacao ON pedidos(ped_situacao);
CREATE INDEX idx_pedidos_numero ON pedidos(ped_numero);

CREATE INDEX idx_itens_ped_pedido ON itens_ped(ite_pedido);
CREATE INDEX idx_itens_ped_produto ON itens_ped(ite_produto);
CREATE INDEX idx_itens_ped_industria ON itens_ped(ite_industria);

-- ============================================================================
-- Foreign Keys
-- ============================================================================
ALTER TABLE cad_prod 
    ADD CONSTRAINT fk_cad_prod_industria 
    FOREIGN KEY (pro_industria) 
    REFERENCES fornecedores(for_codigo);

ALTER TABLE pedidos 
    ADD CONSTRAINT fk_pedidos_cliente 
    FOREIGN KEY (ped_cliente) 
    REFERENCES clientes(cli_codigo);

ALTER TABLE pedidos 
    ADD CONSTRAINT fk_pedidos_industria 
    FOREIGN KEY (ped_industria) 
    REFERENCES fornecedores(for_codigo);

ALTER TABLE pedidos 
    ADD CONSTRAINT fk_pedidos_vendedor 
    FOREIGN KEY (ped_vendedor) 
    REFERENCES vendedores(ven_codigo);

ALTER TABLE itens_ped 
    ADD CONSTRAINT fk_itens_ped_pedido 
    FOREIGN KEY (ite_pedido) 
    REFERENCES pedidos(ped_pedido);

ALTER TABLE itens_ped 
    ADD CONSTRAINT fk_itens_ped_industria 
    FOREIGN KEY (ite_industria) 
    REFERENCES fornecedores(for_codigo);
