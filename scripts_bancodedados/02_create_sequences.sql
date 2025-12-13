-- ============================================================================
-- SalesMasters - PostgreSQL Migration
-- Script 02: Sequences (Generators)
-- Converted from Firebird GENERATORS
-- ============================================================================

-- Sequences para tabelas principais
CREATE SEQUENCE gen_clientes_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_fornecedores_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_vendedores_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_cad_prod_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_pedidos_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_itens_ped_id START WITH 1 INCREMENT BY 1;

-- Sequences para tabelas de apoio
CREATE SEQUENCE gen_agenda_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_area_atu_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_bandeira_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_caixa_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_ccustos_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_cli_aniv_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_cli_ind_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_contaspgrec_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_contas_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_contato_for_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_cred_dev_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_crm_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_crm_interacoes_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_curvaabc_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_descontos_ind_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_fatura_ped_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_forma_pagamento_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_fracrecebimentos_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_grupos_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_grupo_desc_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_lote_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_parametros_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_produtos_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_regioes_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_rgbcores_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_saldo_pgrec_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_tabelas_preco_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_telemkt_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_transportadora_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE gen_user_nomes_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE repl_itens_gen_id START WITH 1 INCREMENT BY 1;

-- Comentários
COMMENT ON SEQUENCE gen_clientes_id IS 'Sequence para tabela CLIENTES';
COMMENT ON SEQUENCE gen_fornecedores_id IS 'Sequence para tabela FORNECEDORES';
COMMENT ON SEQUENCE gen_vendedores_id IS 'Sequence para tabela VENDEDORES';
COMMENT ON SEQUENCE gen_cad_prod_id IS 'Sequence para tabela CAD_PROD';
COMMENT ON SEQUENCE gen_pedidos_id IS 'Sequence para tabela PEDIDOS';
COMMENT ON SEQUENCE gen_itens_ped_id IS 'Sequence para tabela ITENS_PED';
