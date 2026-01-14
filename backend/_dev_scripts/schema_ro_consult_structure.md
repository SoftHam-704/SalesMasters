# Estrutura do Schema: `ro_consult`

> Gerado em: 14/01/2026, 13:23:29

## Resumo

| Tabela | Registros | Colunas | Chave Primária |
|--------|-----------|---------|----------------|
| area_atu | 0 | 4 | - |
| atua_cli | 0 | 4 | atu_idcli, atu_atuaid |
| bandeira | 0 | 3 | codigo |
| cad_prod | 0 | 27 | pro_id |
| cad_tabelaspre | 0 | 14 | itab_idprod, itab_tabela |
| categoria_prod | 0 | 2 | cat_id |
| ccustos | 0 | 2 | cc_id |
| cidades | 0 | 6 | cid_codigo |
| cidades_regioes | 0 | 2 | reg_id, cid_id |
| cli_aniv | 0 | 15 | ani_cliente, ani_nome, ani_funcao |
| cli_descpro | 0 | 13 | cli_codigo, cli_forcodigo, cli_grupo |
| cli_ind | 0 | 24 | cli_lancamento |
| clientes | 0 | 45 | cli_codigo |
| contas | 0 | 4 | con_codigo |
| contato_for | 0 | 13 | con_fornec, con_nome, con_cargo |
| crm_agenda | 0 | 9 | id |
| crm_alerta | 0 | 7 | id |
| crm_canal | 0 | 3 | id |
| crm_funil_etapas | 0 | 5 | etapa_id |
| crm_interacao | 0 | 10 | id |
| crm_interacao_industria | 0 | 2 | interacao_id, for_codigo |
| crm_oportunidades | 0 | 10 | oportunidade_id |
| crm_resultado | 0 | 4 | id |
| crm_sellout | 0 | 7 | id |
| crm_tipo_interacao | 0 | 3 | id |
| descontos_ind | 0 | 15 | des_id |
| empresa_status | 0 | 20 | emp_id |
| empresas | 0 | 12 | id |
| fin_centro_custo | 0 | 6 | id |
| fin_clientes | 0 | 19 | id |
| fin_contas_pagar | 0 | 16 | id |
| fin_contas_receber | 0 | 16 | id |
| fin_fornecedores | 0 | 19 | id |
| fin_movimentacoes | 0 | 12 | id |
| fin_parcelas_pagar | 0 | 12 | id |
| fin_parcelas_receber | 0 | 12 | id |
| fin_plano_contas | 0 | 9 | id |
| forma_pagamento | 0 | 8 | fpg_codigo |
| fornecedores | 0 | 34 | for_codigo |
| grupo_desc | 0 | 12 | gde_id |
| grupos | 0 | 4 | - |
| ind_metas | 0 | 14 | met_ano, met_industria |
| indclientes | 0 | 3 | cli_id, cli_indid |
| itens_ped | 0 | 42 | ite_lancto, ite_pedido, ite_idproduto, ite_industria |
| parametros | 0 | 33 | par_id |
| pedidos | 0 | 39 | ped_pedido, ped_industria |
| regioes | 0 | 2 | reg_codigo |
| transportadora | 0 | 13 | tra_codigo |
| user_grupos | 0 | 2 | grupo |
| user_menu_superior | 0 | 9 | - |
| user_nomes | 0 | 9 | codigo |
| vend_metas | 0 | 17 | met_id |
| vendedor_ind | 0 | 4 | vin_codigo, vin_industria |
| vendedor_reg | 0 | 3 | - |
| vendedores | 0 | 27 | ven_codigo |

## Detalhes por Tabela

### area_atu

- **Registros:** 0
- **Chave Primária:** Nenhuma

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| atu_id | integer | ✗ | nextval('area_atu_atu_id_seq': |  |
| atu_descricao | character varying(60) | ✗ | - |  |
| atu_sel | character varying(1) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### atua_cli

- **Registros:** 0
- **Chave Primária:** atu_idcli, atu_atuaid

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| atu_idcli | integer | ✗ | - | 🔑 |
| atu_atuaid | integer | ✗ | - | 🔑 |
| atu_sel | character varying(1) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### bandeira

- **Registros:** 0
- **Chave Primária:** codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| codigo | integer | ✗ | nextval('gen_bandeira_id'::reg | 🔑 |
| descricao | character varying(50) | ✓ | - |  |
| ativo | character varying(1) | ✓ | - |  |

### cad_prod

- **Registros:** 0
- **Chave Primária:** pro_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| pro_id | integer | ✗ | nextval('gen_cad_prod_id'::reg | 🔑 |
| pro_industria | integer | ✗ | - |  |
| pro_codprod | character varying(25) | ✓ | - |  |
| pro_codigooriginal | character varying(50) | ✓ | - |  |
| pro_codigonormalizado | character varying(40) | ✓ | - |  |
| pro_nome | character varying(100) | ✓ | - |  |
| pro_produtolancamento | boolean | ✓ | - |  |
| pro_datalancamento | date | ✓ | - |  |
| pro_curvaindustria | character(1) | ✓ | - |  |
| pro_codbarras | character varying(13) | ✓ | - |  |
| pro_grupo | integer | ✓ | - |  |
| pro_setor | character varying(30) | ✓ | - |  |
| pro_linha | character varying(50) | ✓ | - |  |
| pro_embalagem | integer | ✓ | - |  |
| pro_peso | double precision | ✓ | - |  |
| pro_conversao | character varying(300) | ✓ | - |  |
| pro_ncm | character varying(10) | ✓ | - |  |
| pro_aplicacao | character varying(300) | ✓ | - |  |
| pro_aplicacao2 | character varying(800) | ✓ | - |  |
| pro_linhaleve | boolean | ✓ | - |  |
| pro_linhapesada | boolean | ✓ | - |  |
| pro_linhaagricola | boolean | ✓ | - |  |
| pro_linhautilitarios | boolean | ✓ | - |  |
| pro_offroad | boolean | ✓ | - |  |
| pro_status | boolean | ✓ | - |  |
| pro_motocicletas | boolean | ✓ | - |  |
| pro_origem | character(1) | ✓ | - |  |

### cad_tabelaspre

- **Registros:** 0
- **Chave Primária:** itab_idprod, itab_tabela

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| itab_idprod | integer | ✗ | - | 🔑 |
| itab_idindustria | integer | ✗ | - |  |
| itab_tabela | character varying(20) | ✗ | - | 🔑 |
| itab_grupodesconto | integer | ✓ | - |  |
| itab_descontoadd | double precision | ✓ | - |  |
| itab_ipi | double precision | ✓ | - |  |
| itab_st | double precision | ✓ | - |  |
| itab_prepeso | double precision | ✓ | - |  |
| itab_precobruto | double precision | ✓ | - |  |
| itab_precopromo | double precision | ✓ | - |  |
| itab_precoespecial | double precision | ✓ | - |  |
| itab_datatabela | date | ✓ | - |  |
| itab_datavencimento | date | ✓ | - |  |
| itab_status | boolean | ✓ | - |  |

### categoria_prod

- **Registros:** 0
- **Chave Primária:** cat_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cat_id | integer | ✗ | nextval('categoria_prod_cat_id | 🔑 |
| cat_descricao | character varying(255) | ✗ | - |  |

### ccustos

- **Registros:** 0
- **Chave Primária:** cc_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cc_id | integer | ✗ | nextval('gen_ccustos_id'::regc | 🔑 |
| cc_descricao | character varying(60) | ✓ | - |  |

### cidades

- **Registros:** 0
- **Chave Primária:** cid_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cid_codigo | integer | ✗ | nextval('cidades_cid_codigo_se | 🔑 |
| cid_nome | character varying(100) | ✗ | - |  |
| cid_uf | character(2) | ✗ | - |  |
| cid_ibge | character varying(7) | ✓ | - |  |
| cid_ativo | boolean | ✓ | true |  |
| cid_cod_origem | integer | ✓ | - |  |

### cidades_regioes

- **Registros:** 0
- **Chave Primária:** reg_id, cid_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| reg_id | integer | ✗ | - | 🔑 |
| cid_id | integer | ✗ | - | 🔑 |

### cli_aniv

- **Registros:** 0
- **Chave Primária:** ani_cliente, ani_nome, ani_funcao

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| ani_lancto | integer | ✓ | nextval('cli_aniv_ani_lancto_s |  |
| ani_cliente | integer | ✗ | - | 🔑 |
| ani_nome | character varying(55) | ✗ | - | 🔑 |
| ani_funcao | character varying(35) | ✗ | - | 🔑 |
| ani_fone | character varying(15) | ✓ | - |  |
| ani_email | character varying(60) | ✓ | - |  |
| ani_diaaniv | smallint | ✓ | - |  |
| ani_mes | smallint | ✓ | - |  |
| ani_niver | date | ✓ | - |  |
| ani_obs | character varying(600) | ✓ | - |  |
| ani_sel | character varying(1) | ✓ | ' '::character varying |  |
| gid | character varying(38) | ✓ | - |  |
| ani_timequetorce | character varying(50) | ✓ | - |  |
| ani_esportepreferido | character varying(50) | ✓ | - |  |
| ani_hobby | character varying(50) | ✓ | - |  |

### cli_descpro

- **Registros:** 0
- **Chave Primária:** cli_codigo, cli_forcodigo, cli_grupo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cli_codigo | integer | ✗ | - | 🔑 |
| cli_forcodigo | integer | ✗ | - | 🔑 |
| cli_grupo | integer | ✗ | - | 🔑 |
| cli_desc1 | double precision | ✓ | - |  |
| cli_desc2 | double precision | ✓ | - |  |
| cli_desc3 | double precision | ✓ | - |  |
| cli_desc4 | double precision | ✓ | - |  |
| cli_desc5 | double precision | ✓ | - |  |
| cli_desc6 | double precision | ✓ | - |  |
| cli_desc7 | double precision | ✓ | - |  |
| cli_desc8 | double precision | ✓ | - |  |
| cli_desc9 | double precision | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### cli_ind

- **Registros:** 0
- **Chave Primária:** cli_lancamento

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cli_lancamento | integer | ✗ | nextval('cli_ind_cli_lancament | 🔑 |
| cli_codigo | integer | ✗ | - |  |
| cli_forcodigo | integer | ✗ | - |  |
| cli_desc1 | numeric | ✓ | - |  |
| cli_desc2 | numeric | ✓ | - |  |
| cli_desc3 | numeric | ✓ | - |  |
| cli_desc4 | numeric | ✓ | - |  |
| cli_desc5 | numeric | ✓ | - |  |
| cli_desc6 | numeric | ✓ | - |  |
| cli_desc7 | numeric | ✓ | - |  |
| cli_desc8 | numeric | ✓ | - |  |
| cli_desc9 | numeric | ✓ | - |  |
| cli_desc10 | numeric | ✓ | - |  |
| cli_transportadora | integer | ✓ | - |  |
| cli_prazopg | character varying(100) | ✓ | - |  |
| cli_ipi | character varying(10) | ✓ | - |  |
| cli_tabela | character varying(50) | ✓ | - |  |
| cli_codcliind | character varying(100) | ✓ | - |  |
| cli_obsparticular | text | ✓ | - |  |
| cli_comprador | character varying(100) | ✓ | - |  |
| cli_frete | character varying(50) | ✓ | - |  |
| cli_emailcomprador | character varying(200) | ✓ | - |  |
| cli_desc11 | numeric | ✓ | - |  |
| cli_grupodesc | integer | ✓ | - |  |

### clientes

- **Registros:** 0
- **Chave Primária:** cli_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cli_codigo | integer | ✗ | nextval('clientes_cli_codigo_s | 🔑 |
| cli_cnpj | character varying(20) | ✓ | - |  |
| cli_inscricao | character varying(20) | ✓ | - |  |
| cli_tipopes | character varying(1) | ✓ | - |  |
| cli_nome | character varying(255) | ✓ | - |  |
| cli_nomred | character varying(255) | ✓ | - |  |
| cli_fantasia | character varying(255) | ✓ | - |  |
| cli_endereco | character varying(255) | ✓ | - |  |
| cli_endnum | character varying(20) | ✓ | - |  |
| cli_bairro | character varying(100) | ✓ | - |  |
| cli_cidade | character varying(100) | ✓ | - |  |
| cli_uf | character varying(2) | ✓ | - |  |
| cli_cep | character varying(20) | ✓ | - |  |
| cli_ptoref | character varying(255) | ✓ | - |  |
| cli_fone1 | character varying(50) | ✓ | - |  |
| cli_endcob | character varying(255) | ✓ | - |  |
| cli_baicob | character varying(100) | ✓ | - |  |
| cli_cidcob | character varying(100) | ✓ | - |  |
| cli_cepcob | character varying(20) | ✓ | - |  |
| cli_ufcob | character varying(2) | ✓ | - |  |
| cli_email | character varying(255) | ✓ | - |  |
| cli_emailnfe | character varying(255) | ✓ | - |  |
| cli_vencsuf | integer | ✓ | - |  |
| cli_emailfinanc | character varying(255) | ✓ | - |  |
| cli_vendedor | integer | ✓ | - |  |
| cli_regimeemp | character varying(10) | ✓ | - |  |
| cli_regiao2 | integer | ✓ | - |  |
| cli_atuacao | character varying(10) | ✓ | - |  |
| cli_redeloja | character varying(255) | ✓ | - |  |
| cli_datacad | date | ✓ | - |  |
| cli_usuario | character varying(50) | ✓ | - |  |
| cli_dataalt | date | ✓ | - |  |
| cli_idcidade | integer | ✓ | - |  |
| gid | character varying(50) | ✓ | - |  |
| cli_fone2 | character varying(20) | ✓ | - |  |
| cli_fone3 | character varying(20) | ✓ | - |  |
| cli_skype | character varying(100) | ✓ | - |  |
| cli_suframa | character varying(50) | ✓ | - |  |
| cli_obs | text | ✓ | - |  |
| cli_dtabertura | date | ✓ | - |  |
| cli_cxpostal | character varying(50) | ✓ | - |  |
| cli_obspedido | text | ✓ | - |  |
| cli_refcom | text | ✓ | - |  |
| cli_complemento | character varying(100) | ✓ | - |  |
| cli_atuacaoprincipal | integer | ✓ | - |  |

### contas

- **Registros:** 0
- **Chave Primária:** con_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| con_codigo | integer | ✗ | nextval('gen_contas_id'::regcl | 🔑 |
| con_descricao | character varying(60) | ✓ | - |  |
| con_tipo | character varying(1) | ✓ | - |  |
| con_saldo | double precision | ✓ | - |  |

### contato_for

- **Registros:** 0
- **Chave Primária:** con_fornec, con_nome, con_cargo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| con_codigo | integer | ✗ | nextval('gen_contato_for_id':: |  |
| con_fornec | integer | ✗ | - | 🔑 |
| con_nome | character varying(60) | ✗ | - | 🔑 |
| con_cargo | character varying(50) | ✗ | - | 🔑 |
| con_telefone | character varying(20) | ✓ | - |  |
| con_celular | character varying(20) | ✓ | - |  |
| con_email | character varying(100) | ✓ | - |  |
| con_dtnasc | date | ✓ | - |  |
| con_obs | character varying(300) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |
| con_timequetorce | character varying(50) | ✓ | - |  |
| con_esportepreferido | character varying(50) | ✓ | - |  |
| con_hobby | character varying(100) | ✓ | - |  |

### crm_agenda

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | bigint | ✗ | nextval('crm_agenda_id_seq'::r | 🔑 |
| cli_codigo | integer | ✗ | - |  |
| ven_codigo | integer | ✗ | - |  |
| tipo_interacao_id | integer | ✗ | - |  |
| data_agendada | date | ✗ | - |  |
| observacao | character varying(200) | ✓ | - |  |
| concluida | boolean | ✗ | false |  |
| data_conclusao | timestamp without time zone | ✓ | - |  |
| criado_em | timestamp without time zone | ✗ | now() |  |

### crm_alerta

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_alerta_id_seq'::r | 🔑 |
| usuario_id | integer | ✓ | - |  |
| tipo | character varying(50) | ✓ | - |  |
| referencia_id | integer | ✓ | - |  |
| mensagem | text | ✓ | - |  |
| lido | boolean | ✓ | false |  |
| criado_em | timestamp without time zone | ✓ | now() |  |

### crm_canal

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_canal_id_seq'::re | 🔑 |
| descricao | character varying(50) | ✗ | - |  |
| ativo | boolean | ✓ | true |  |

### crm_funil_etapas

- **Registros:** 0
- **Chave Primária:** etapa_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| etapa_id | integer | ✗ | nextval('crm_funil_etapas_etap | 🔑 |
| nome | character varying(50) | ✗ | - |  |
| descricao | text | ✓ | - |  |
| ordem | integer | ✓ | 0 |  |
| cor | character varying(20) | ✓ | '#007bff'::character varying |  |

### crm_interacao

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_interacao_id_seq' | 🔑 |
| interacao_id | integer | ✗ | nextval('crm_interacao_interac |  |
| cli_codigo | integer | ✗ | - |  |
| ven_codigo | integer | ✗ | - |  |
| tipo_interacao_id | integer | ✓ | - |  |
| canal_id | integer | ✓ | - |  |
| resultado_id | integer | ✓ | - |  |
| oportunidade_id | integer | ✓ | - |  |
| data_hora | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| observacao | text | ✓ | - |  |

### crm_interacao_industria

- **Registros:** 0
- **Chave Primária:** interacao_id, for_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| interacao_id | integer | ✗ | - | 🔑 |
| for_codigo | integer | ✗ | - | 🔑 |

### crm_oportunidades

- **Registros:** 0
- **Chave Primária:** oportunidade_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| oportunidade_id | integer | ✗ | nextval('crm_oportunidades_opo | 🔑 |
| titulo | character varying(100) | ✗ | - |  |
| cli_codigo | integer | ✗ | - |  |
| ven_codigo | integer | ✗ | - |  |
| valor_estimado | numeric | ✓ | - |  |
| etapa_id | integer | ✓ | - |  |
| for_codigo | integer | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| telefone_contato | character varying(20) | ✓ | - |  |

### crm_resultado

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_resultado_id_seq' | 🔑 |
| descricao | character varying(50) | ✗ | - |  |
| ordem | integer | ✓ | 0 |  |
| ativo | boolean | ✓ | true |  |

### crm_sellout

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_sellout_id_seq':: | 🔑 |
| cli_codigo | integer | ✗ | - |  |
| for_codigo | integer | ✗ | - |  |
| periodo | date | ✗ | - |  |
| valor | numeric | ✓ | 0 |  |
| quantidade | numeric | ✓ | 0 |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### crm_tipo_interacao

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('crm_tipo_interacao_id | 🔑 |
| descricao | character varying(50) | ✗ | - |  |
| ativo | boolean | ✓ | true |  |

### descontos_ind

- **Registros:** 0
- **Chave Primária:** des_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| des_id | integer | ✗ | nextval('gen_descontos_ind_id' | 🔑 |
| des_codind | integer | ✗ | - |  |
| des_descricao | character varying(100) | ✓ | - |  |
| des_desc1 | double precision | ✓ | - |  |
| des_desc2 | double precision | ✓ | - |  |
| des_desc3 | double precision | ✓ | - |  |
| des_desc4 | double precision | ✓ | - |  |
| des_desc5 | double precision | ✓ | - |  |
| des_desc6 | double precision | ✓ | - |  |
| des_desc7 | double precision | ✓ | - |  |
| des_desc8 | double precision | ✓ | - |  |
| des_desc9 | double precision | ✓ | - |  |
| des_desc10 | double precision | ✓ | - |  |
| des_ativo | boolean | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### empresa_status

- **Registros:** 0
- **Chave Primária:** emp_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| emp_id | integer | ✗ | nextval('empresa_status_emp_id | 🔑 |
| emp_situacao | character(1) | ✓ | 'A'::bpchar |  |
| emp_nome | character varying(100) | ✓ | - |  |
| emp_endereco | character varying(200) | ✓ | - |  |
| emp_bairro | character varying(100) | ✓ | - |  |
| emp_cidade | character varying(100) | ✓ | - |  |
| emp_uf | character(2) | ✓ | - |  |
| emp_cep | character varying(15) | ✓ | - |  |
| emp_cnpj | character varying(20) | ✓ | - |  |
| emp_inscricao | character varying(30) | ✓ | - |  |
| emp_fones | character varying(50) | ✓ | - |  |
| emp_logotipo | character varying(500) | ✓ | - |  |
| emp_basedadoslocal | character varying(500) | ✓ | - |  |
| emp_host | character varying(100) | ✓ | - |  |
| emp_porta | integer | ✓ | - |  |
| emp_username | character varying(50) | ✓ | - |  |
| emp_password | character varying(100) | ✓ | - |  |
| emp_pastabasica | character varying(500) | ✓ | - |  |
| emp_datacriacao | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| emp_dataatualizacao | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### empresas

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('empresas_id_seq'::reg | 🔑 |
| cnpj | character varying(20) | ✗ | - |  |
| razao_social | character varying(200) | ✗ | - |  |
| nome_fantasia | character varying(200) | ✓ | - |  |
| status | character varying(20) | ✓ | 'ATIVO'::character varying |  |
| db_host | character varying(200) | ✓ | - |  |
| db_nome | character varying(100) | ✓ | - |  |
| db_usuario | character varying(100) | ✓ | - |  |
| db_senha | character varying(200) | ✓ | - |  |
| db_porta | integer | ✓ | 5432 |  |
| created_at | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| updated_at | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_centro_custo

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_centro_custo_id_s | 🔑 |
| codigo | character varying(20) | ✗ | - |  |
| descricao | character varying(100) | ✗ | - |  |
| ativo | boolean | ✓ | true |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_clientes

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_clientes_id_seq': | 🔑 |
| tipo_pessoa | character(1) | ✗ | - |  |
| cpf_cnpj | character varying(18) | ✓ | - |  |
| nome_razao | character varying(200) | ✗ | - |  |
| nome_fantasia | character varying(200) | ✓ | - |  |
| endereco | character varying(200) | ✓ | - |  |
| numero | character varying(20) | ✓ | - |  |
| complemento | character varying(100) | ✓ | - |  |
| bairro | character varying(100) | ✓ | - |  |
| cidade | character varying(100) | ✓ | - |  |
| uf | character(2) | ✓ | - |  |
| cep | character varying(10) | ✓ | - |  |
| telefone | character varying(20) | ✓ | - |  |
| celular | character varying(20) | ✓ | - |  |
| email | character varying(100) | ✓ | - |  |
| observacoes | text | ✓ | - |  |
| ativo | boolean | ✓ | true |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_contas_pagar

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_contas_pagar_id_s | 🔑 |
| descricao | character varying(200) | ✗ | - |  |
| id_fornecedor | integer | ✓ | - |  |
| numero_documento | character varying(50) | ✓ | - |  |
| valor_total | numeric | ✗ | - |  |
| valor_pago | numeric | ✓ | 0 |  |
| data_emissao | date | ✗ | - |  |
| data_vencimento | date | ✗ | - |  |
| data_pagamento | date | ✓ | - |  |
| status | character varying(20) | ✓ | 'ABERTO'::character varying |  |
| observacoes | text | ✓ | - |  |
| id_plano_contas | integer | ✓ | - |  |
| id_centro_custo | integer | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| criado_por | character varying(100) | ✓ | - |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_contas_receber

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_contas_receber_id | 🔑 |
| descricao | character varying(200) | ✗ | - |  |
| id_cliente | integer | ✓ | - |  |
| numero_documento | character varying(50) | ✓ | - |  |
| valor_total | numeric | ✗ | - |  |
| valor_recebido | numeric | ✓ | 0 |  |
| data_emissao | date | ✗ | - |  |
| data_vencimento | date | ✗ | - |  |
| data_recebimento | date | ✓ | - |  |
| status | character varying(20) | ✓ | 'ABERTO'::character varying |  |
| observacoes | text | ✓ | - |  |
| id_plano_contas | integer | ✓ | - |  |
| id_centro_custo | integer | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| criado_por | character varying(100) | ✓ | - |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_fornecedores

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_fornecedores_id_s | 🔑 |
| tipo_pessoa | character(1) | ✗ | - |  |
| cpf_cnpj | character varying(18) | ✓ | - |  |
| nome_razao | character varying(200) | ✗ | - |  |
| nome_fantasia | character varying(200) | ✓ | - |  |
| endereco | character varying(200) | ✓ | - |  |
| numero | character varying(20) | ✓ | - |  |
| complemento | character varying(100) | ✓ | - |  |
| bairro | character varying(100) | ✓ | - |  |
| cidade | character varying(100) | ✓ | - |  |
| uf | character(2) | ✓ | - |  |
| cep | character varying(10) | ✓ | - |  |
| telefone | character varying(20) | ✓ | - |  |
| celular | character varying(20) | ✓ | - |  |
| email | character varying(100) | ✓ | - |  |
| observacoes | text | ✓ | - |  |
| ativo | boolean | ✓ | true |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_movimentacoes

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_movimentacoes_id_ | 🔑 |
| tipo | character(1) | ✗ | - |  |
| descricao | character varying(200) | ✗ | - |  |
| valor | numeric | ✗ | - |  |
| data | date | ✗ | - |  |
| id_plano_contas | integer | ✓ | - |  |
| id_centro_custo | integer | ✓ | - |  |
| id_conta_pagar | integer | ✓ | - |  |
| id_conta_receber | integer | ✓ | - |  |
| observacoes | text | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| criado_por | character varying(100) | ✓ | - |  |

### fin_parcelas_pagar

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_parcelas_pagar_id | 🔑 |
| id_conta_pagar | integer | ✗ | - |  |
| numero_parcela | integer | ✗ | - |  |
| valor | numeric | ✗ | - |  |
| data_vencimento | date | ✗ | - |  |
| data_pagamento | date | ✓ | - |  |
| valor_pago | numeric | ✓ | - |  |
| juros | numeric | ✓ | 0 |  |
| desconto | numeric | ✓ | 0 |  |
| status | character varying(20) | ✓ | 'ABERTO'::character varying |  |
| observacoes | text | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_parcelas_receber

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_parcelas_receber_ | 🔑 |
| id_conta_receber | integer | ✗ | - |  |
| numero_parcela | integer | ✗ | - |  |
| valor | numeric | ✗ | - |  |
| data_vencimento | date | ✗ | - |  |
| data_recebimento | date | ✓ | - |  |
| valor_recebido | numeric | ✓ | - |  |
| juros | numeric | ✓ | 0 |  |
| desconto | numeric | ✓ | 0 |  |
| status | character varying(20) | ✓ | 'ABERTO'::character varying |  |
| observacoes | text | ✓ | - |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### fin_plano_contas

- **Registros:** 0
- **Chave Primária:** id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| id | integer | ✗ | nextval('fin_plano_contas_id_s | 🔑 |
| codigo | character varying(20) | ✗ | - |  |
| descricao | character varying(200) | ✗ | - |  |
| tipo | character(1) | ✗ | - |  |
| nivel | integer | ✗ | - |  |
| id_pai | integer | ✓ | - |  |
| ativo | boolean | ✓ | true |  |
| criado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| atualizado_em | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### forma_pagamento

- **Registros:** 0
- **Chave Primária:** fpg_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| fpg_codigo | integer | ✗ | nextval('gen_forma_pagamento_i | 🔑 |
| fpg_descricao | character varying(30) | ✓ | - |  |
| fpg_parcelas | integer | ✓ | - |  |
| fpg_intervalo | integer | ✓ | - |  |
| fpg_entrada | integer | ✓ | - |  |
| fpg_bandeira | integer | ✓ | - |  |
| fpg_ativo | character varying(1) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### fornecedores

- **Registros:** 0
- **Chave Primária:** for_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| for_codigo | integer | ✗ | - | 🔑 |
| for_nome | character varying(75) | ✓ | - |  |
| for_endereco | character varying(45) | ✓ | - |  |
| for_bairro | character varying(25) | ✓ | - |  |
| for_cidade | character varying(25) | ✓ | - |  |
| for_uf | character varying(2) | ✓ | - |  |
| for_cep | character varying(10) | ✓ | - |  |
| for_fone | character varying(25) | ✓ | - |  |
| for_fone2 | character varying(25) | ✓ | - |  |
| for_fax | character varying(15) | ✓ | - |  |
| for_cgc | character varying(18) | ✗ | - |  |
| for_inscricao | character varying(20) | ✓ | - |  |
| for_email | character varying(120) | ✓ | - |  |
| for_codrep | integer | ✓ | - |  |
| for_tipo2 | character varying(1) | ✓ | - |  |
| for_percom | double precision | ✓ | - |  |
| for_des1 | double precision | ✓ | - |  |
| for_des2 | double precision | ✓ | - |  |
| for_des3 | double precision | ✓ | - |  |
| for_des4 | double precision | ✓ | - |  |
| for_des5 | double precision | ✓ | - |  |
| for_des6 | double precision | ✓ | - |  |
| for_des7 | double precision | ✓ | - |  |
| for_des8 | double precision | ✓ | - |  |
| for_des9 | double precision | ✓ | - |  |
| for_des10 | double precision | ✓ | - |  |
| for_homepage | character varying(150) | ✓ | - |  |
| for_contatorep | character varying(50) | ✓ | - |  |
| observacoes | text | ✓ | - |  |
| for_obs2 | text | ✓ | - |  |
| for_nomered | character varying(15) | ✗ | - |  |
| for_locimagem | character varying(50) | ✓ | - |  |
| for_tipofrete | character(1) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### grupo_desc

- **Registros:** 0
- **Chave Primária:** gde_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| gde_id | integer | ✗ | nextval('gen_grupo_desc_id'::r | 🔑 |
| gde_nome | character varying(50) | ✓ | - |  |
| gde_desc1 | double precision | ✓ | - |  |
| gde_desc2 | double precision | ✓ | - |  |
| gde_desc3 | double precision | ✓ | - |  |
| gde_desc4 | double precision | ✓ | - |  |
| gde_desc5 | double precision | ✓ | - |  |
| gde_desc6 | double precision | ✓ | - |  |
| gde_desc7 | double precision | ✓ | - |  |
| gde_desc8 | double precision | ✓ | - |  |
| gde_desc9 | double precision | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### grupos

- **Registros:** 0
- **Chave Primária:** Nenhuma

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| gru_codigo | integer | ✗ | - |  |
| gru_nome | character varying(50) | ✓ | - |  |
| gru_percomiss | double precision | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### ind_metas

- **Registros:** 0
- **Chave Primária:** met_ano, met_industria

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| met_ano | integer | ✗ | - | 🔑 |
| met_industria | integer | ✗ | - | 🔑 |
| met_jan | double precision | ✓ | - |  |
| met_fev | double precision | ✓ | - |  |
| met_mar | double precision | ✓ | - |  |
| met_abr | double precision | ✓ | - |  |
| met_mai | double precision | ✓ | - |  |
| met_jun | double precision | ✓ | - |  |
| met_jul | double precision | ✓ | - |  |
| met_ago | double precision | ✓ | - |  |
| met_set | double precision | ✓ | - |  |
| met_out | double precision | ✓ | - |  |
| met_nov | double precision | ✓ | - |  |
| met_dez | double precision | ✓ | - |  |

### indclientes

- **Registros:** 0
- **Chave Primária:** cli_id, cli_indid

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| cli_id | integer | ✗ | - | 🔑 |
| cli_indid | integer | ✗ | - | 🔑 |
| gid | character varying(38) | ✓ | - |  |

### itens_ped

- **Registros:** 0
- **Chave Primária:** ite_lancto, ite_pedido, ite_idproduto, ite_industria

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| ite_lancto | integer | ✗ | nextval('itens_ped_ite_lancto_ | 🔑 |
| ite_pedido | character varying(10) | ✗ | - | 🔑 |
| ite_industria | integer | ✗ | - | 🔑 |
| ite_idproduto | integer | ✗ | - | 🔑 |
| ite_produto | character varying(25) | ✗ | - |  |
| ite_normalizado | character varying(25) | ✓ | - |  |
| ite_embuch | character varying(15) | ✓ | - |  |
| ite_nomeprod | character varying(100) | ✓ | - |  |
| ite_grupo | smallint | ✓ | - |  |
| ite_data | timestamp without time zone | ✓ | - |  |
| ite_quant | double precision | ✓ | - |  |
| ite_puni | double precision | ✓ | - |  |
| ite_puniliq | double precision | ✓ | - |  |
| ite_totliquido | double precision | ✓ | - |  |
| ite_des1 | double precision | ✓ | - |  |
| ite_des2 | double precision | ✓ | - |  |
| ite_des3 | double precision | ✓ | - |  |
| ite_des4 | double precision | ✓ | - |  |
| ite_des5 | double precision | ✓ | - |  |
| ite_des6 | double precision | ✓ | - |  |
| ite_des7 | double precision | ✓ | - |  |
| ite_des8 | double precision | ✓ | - |  |
| ite_des9 | double precision | ✓ | - |  |
| ite_des10 | double precision | ✓ | - |  |
| ite_des11 | double precision | ✓ | - |  |
| ite_descadic | double precision | ✓ | - |  |
| ite_descontos | character varying(200) | ✓ | - |  |
| ite_totbruto | double precision | ✓ | - |  |
| ite_valcomipi | double precision | ✓ | - |  |
| ite_ipi | numeric | ✓ | - |  |
| ite_st | double precision | ✓ | - |  |
| ite_valcomst | double precision | ✓ | - |  |
| ite_puniliqcomimposto | double precision | ✓ | - |  |
| ite_faturado | character varying(1) | ✓ | - |  |
| ite_qtdfat | integer | ✓ | - |  |
| ite_exportado | character varying(1) | ✓ | - |  |
| ite_promocao | character varying(1) | ✓ | - |  |
| ite_status | character(1) | ✓ | - |  |
| ite_numpedcli | character varying(25) | ✓ | - |  |
| ite_seq | smallint | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |
| ite_codigonormalizado | character varying(50) | ✓ | - |  |

### parametros

- **Registros:** 0
- **Chave Primária:** par_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| par_id | integer | ✗ | nextval('parametros_par_id_seq | 🔑 |
| par_usuario | integer | ✓ | - |  |
| par_ordemped | character(1) | ✓ | - |  |
| par_qtdenter | integer | ✓ | - |  |
| par_itemduplicado | character(1) | ✓ | - |  |
| par_ordemimpressao | character(1) | ✓ | - |  |
| par_descontogrupo | character(1) | ✓ | - |  |
| par_separalinhas | character(1) | ✓ | - |  |
| par_usadecimais | character(1) | ✓ | - |  |
| par_fmtpesquisa | character(1) | ✓ | - |  |
| par_zerapromo | character(1) | ✓ | - |  |
| par_tipopesquisa | character(1) | ✓ | - |  |
| par_validapromocao | character(1) | ✓ | - |  |
| par_salvapedidoauto | character(1) | ✓ | - |  |
| par_mostracodori | character(1) | ✓ | - |  |
| par_solicitarconfemail | character(1) | ✓ | - |  |
| par_mostrapednovos | character(1) | ✓ | - |  |
| par_mostraimpostos | character(1) | ✓ | - |  |
| par_qtddecimais | integer | ✓ | - |  |
| par_pedidopadrao | integer | ✓ | - |  |
| par_telemkttipo | character(1) | ✓ | - |  |
| par_iniciapedido | character(1) | ✓ | - |  |
| par_tipofretepadrao | character(1) | ✓ | - |  |
| par_emailserver | character varying(80) | ✓ | - |  |
| par_email | character varying(80) | ✓ | - |  |
| par_emailuser | character varying(80) | ✓ | - |  |
| par_emailporta | integer | ✓ | - |  |
| par_emailpassword | character varying(15) | ✓ | - |  |
| par_emailtls | boolean | ✓ | false |  |
| par_emailssl | boolean | ✓ | false |  |
| par_emailalternativo | character varying(80) | ✓ | - |  |
| created_at | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |
| updated_at | timestamp without time zone | ✓ | CURRENT_TIMESTAMP |  |

### pedidos

- **Registros:** 0
- **Chave Primária:** ped_pedido, ped_industria

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| ped_numero | integer | ✗ | nextval('pedidos_ped_numero_se |  |
| ped_pedido | character varying(10) | ✗ | - | 🔑 |
| ped_tabela | character varying(25) | ✗ | - |  |
| ped_data | date | ✓ | - |  |
| ped_industria | integer | ✗ | - | 🔑 |
| ped_cliente | integer | ✗ | - |  |
| ped_transp | integer | ✗ | - |  |
| ped_vendedor | smallint | ✗ | - |  |
| ped_cliind | character varying(15) | ✓ | - |  |
| ped_situacao | character varying(1) | ✓ | - |  |
| ped_pri | double precision | ✓ | - |  |
| ped_seg | double precision | ✓ | - |  |
| ped_ter | double precision | ✓ | - |  |
| ped_qua | double precision | ✓ | - |  |
| ped_qui | double precision | ✓ | - |  |
| ped_sex | double precision | ✓ | - |  |
| ped_set | double precision | ✓ | - |  |
| ped_oit | double precision | ✓ | - |  |
| ped_nov | double precision | ✓ | - |  |
| ped_dez | double precision | ✓ | - |  |
| ped_descadic | double precision | ✓ | - |  |
| ped_coeficiente | double precision | ✓ | - |  |
| ped_condpag | character varying(100) | ✓ | - |  |
| ped_tipofrete | character varying(1) | ✓ | - |  |
| ped_totliq | double precision | ✓ | - |  |
| ped_totbruto | double precision | ✓ | - |  |
| ped_acrescimo | double precision | ✓ | - |  |
| ped_totalipi | double precision | ✓ | - |  |
| ped_comprador | character varying(30) | ✓ | - |  |
| ped_emailcomp | character varying(60) | ✓ | - |  |
| ped_datafat | date | ✓ | - |  |
| ped_nffat | character varying(15) | ✓ | - |  |
| ped_obs | character varying(600) | ✓ | - |  |
| ped_obsfora | character varying(6000) | ✓ | - |  |
| ped_exportado | character varying(1) | ✓ | - |  |
| ped_enviado | character varying(1) | ✓ | - |  |
| ped_dataenvio | timestamp without time zone | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |
| ped_pedindustria | character varying(50) | ✓ | - |  |

### regioes

- **Registros:** 0
- **Chave Primária:** reg_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| reg_codigo | integer | ✗ | nextval('regioes_reg_codigo_se | 🔑 |
| reg_descricao | character varying(255) | ✗ | - |  |

### transportadora

- **Registros:** 0
- **Chave Primária:** tra_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| tra_codigo | integer | ✗ | nextval('transportadora_tra_co | 🔑 |
| tra_nome | character varying(255) | ✓ | - |  |
| tra_endereco | character varying(255) | ✓ | - |  |
| tra_bairro | character varying(100) | ✓ | - |  |
| tra_cidade | character varying(100) | ✓ | - |  |
| tra_uf | character varying(2) | ✓ | - |  |
| tra_cep | character varying(20) | ✓ | - |  |
| tra_fone | character varying(50) | ✓ | - |  |
| tra_contato | character varying(100) | ✓ | - |  |
| tra_email | character varying(255) | ✓ | - |  |
| tra_cgc | character varying(50) | ✓ | - |  |
| tra_inscricao | character varying(50) | ✓ | - |  |
| tra_obs | text | ✓ | - |  |

### user_grupos

- **Registros:** 0
- **Chave Primária:** grupo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| grupo | character varying(4) | ✗ | - | 🔑 |
| descricao | character varying(20) | ✓ | - |  |

### user_menu_superior

- **Registros:** 0
- **Chave Primária:** Nenhuma

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| opcao | integer | ✗ | - |  |
| grupo | character varying(4) | ✗ | - |  |
| indice | integer | ✓ | - |  |
| porsenha | boolean | ✓ | - |  |
| invisivel | boolean | ✓ | - |  |
| incluir | boolean | ✓ | - |  |
| modificar | boolean | ✓ | - |  |
| excluir | boolean | ✓ | - |  |
| descricao | character varying(40) | ✓ | - |  |

### user_nomes

- **Registros:** 0
- **Chave Primária:** codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| codigo | integer | ✗ | nextval('user_nomes_codigo_seq | 🔑 |
| nome | character varying(20) | ✗ | - |  |
| sobrenome | character varying(20) | ✗ | - |  |
| senha | character varying(20) | ✓ | - |  |
| grupo | character varying(4) | ✓ | - |  |
| imagem | bytea | ✓ | - |  |
| master | boolean | ✓ | false |  |
| gerencia | boolean | ✓ | false |  |
| usuario | character varying(20) | ✓ | - |  |

### vend_metas

- **Registros:** 0
- **Chave Primária:** met_id

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| met_id | integer | ✗ | nextval('vend_metas_met_id_seq | 🔑 |
| met_ano | integer | ✗ | - |  |
| met_industria | integer | ✗ | - |  |
| met_vendedor | integer | ✗ | - |  |
| met_jan | numeric | ✓ | 0 |  |
| met_fev | numeric | ✓ | 0 |  |
| met_mar | numeric | ✓ | 0 |  |
| met_abr | numeric | ✓ | 0 |  |
| met_mai | numeric | ✓ | 0 |  |
| met_jun | numeric | ✓ | 0 |  |
| met_jul | numeric | ✓ | 0 |  |
| met_ago | numeric | ✓ | 0 |  |
| met_set | numeric | ✓ | 0 |  |
| met_out | numeric | ✓ | 0 |  |
| met_nov | numeric | ✓ | 0 |  |
| met_dez | numeric | ✓ | 0 |  |
| gid | character varying(255) | ✓ | - |  |

### vendedor_ind

- **Registros:** 0
- **Chave Primária:** vin_codigo, vin_industria

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| vin_industria | smallint | ✗ | - | 🔑 |
| vin_codigo | integer | ✗ | - | 🔑 |
| vin_percom | double precision | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |

### vendedor_reg

- **Registros:** 0
- **Chave Primária:** Nenhuma

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| vin_regiao | smallint | ✗ | - |  |
| vin_codigo | integer | ✗ | - |  |
| gid | character varying(38) | ✓ | - |  |

### vendedores

- **Registros:** 0
- **Chave Primária:** ven_codigo

| Coluna | Tipo | Nullable | Default | PK |
|--------|------|----------|---------|----|
| ven_codigo | integer | ✗ | nextval('gen_vendedores_id'::r | 🔑 |
| ven_nome | character varying(45) | ✓ | - |  |
| ven_endereco | character varying(50) | ✓ | - |  |
| ven_bairro | character varying(25) | ✓ | - |  |
| ven_cidade | character varying(25) | ✓ | - |  |
| ven_cep | character varying(11) | ✓ | - |  |
| ven_uf | character varying(2) | ✓ | - |  |
| ven_fone1 | character varying(20) | ✓ | - |  |
| ven_fone2 | character varying(20) | ✓ | - |  |
| ven_obs | character varying(400) | ✓ | - |  |
| ven_cpf | character varying(14) | ✓ | - |  |
| ven_comissao | double precision | ✓ | - |  |
| ven_email | character varying(60) | ✓ | - |  |
| ven_nomeusu | character varying(50) | ✓ | - |  |
| ven_aniversario | character varying(6) | ✓ | - |  |
| ven_rg | character varying(30) | ✓ | - |  |
| ven_ctps | character varying(30) | ✓ | - |  |
| ven_filiacao | character varying(100) | ✓ | - |  |
| ven_pis | character varying(20) | ✓ | - |  |
| ven_filhos | integer | ✓ | - |  |
| ven_codusu | integer | ✓ | - |  |
| ven_imagem | character varying(200) | ✓ | - |  |
| gid | character varying(38) | ✓ | - |  |
| ven_dtadmissao | date | ✓ | - |  |
| ven_dtdemissao | date | ✓ | - |  |
| ven_status | character(1) | ✓ | 'A'::bpchar |  |
| ven_cumpremetas | character(1) | ✓ | 'S'::bpchar |  |

