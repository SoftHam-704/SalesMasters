# 📘 GUIA DEFINITIVO: Migração de Dados via Excel
## "Receita do Bolo" para Implementação de Novos Schemas

**Versão:** 1.0  
**Objetivo:** Padronizar processo de importação de dados para novos clientes  
**Meta:** 40 schemas para implementar  
**Tempo estimado por schema:** 2-3 horas (após padronização)

---

## 🎯 PRÉ-REQUISITOS

### **1. Arquivos Excel Necessários**

Cliente deve fornecer na pasta `E:\Sistemas_ia\SalesMasters\backend\_dev_scripts\`:

| Arquivo | Descrição | Obrigatório |
|---------|-----------|-------------|
| `CLIENTES.xlsx` | Cadastro de clientes | ✅ SIM |
| `FORNECEDORES.xlsx` ou `INDUSTRIAS.xlsx` | Indústrias fornecedoras | ✅ SIM |
| `VENDEDORES.xlsx` | Equipe de vendas | ✅ SIM |
| `PRODUTOS.xlsx` ou `CAD_PROD.xlsx` | Catálogo de produtos | ✅ SIM |
| `PEDIDOS.xlsx` | Histórico de pedidos (cabeçalho) | ✅ SIM |
| `ITENS_PED.xlsx` | Itens dos pedidos | ✅ SIM |
| `CIDADES.xlsx` | Cidades/municípios | ⚠️ Opcional* |
| `REGIOES.xlsx` | Regiões de venda | ⚠️ Opcional |
| `TRANSPORTADORA.xlsx` | Transportadoras | ⚠️ Opcional |
| `TABELAS_PRECOS.xlsx` | Tabelas de preços | ⚠️ Opcional |
| `CLI_IND.xlsx` | Relacionamento Cliente x Indústria | ⚠️ Opcional |
| `CLI_DESCPRO.xlsx` | Descontos por cliente | ⚠️ Opcional |
| `VEND_METAS.xlsx` | Metas de vendedores | ⚠️ Opcional |
| `GRUPOS.xlsx` ou `GRUPO_DESC.xlsx` | Grupos de desconto | ⚠️ Opcional |
| `AREA_ATU.xlsx` + `ATUA_CLI.xlsx` | Áreas de atuação | ⚠️ Opcional |
| `CONTATO_CLI.xlsx` | Contatos de clientes | ⚠️ Opcional |
| `CONTATO_FOR.xlsx` | Contatos de fornecedores | ⚠️ Opcional |

*Se não fornecido, usa base de cidades do `public`

### **2. Informações do Cliente**

- **CNPJ** da empresa (formatado: 00.000.000/0000-00)
- **Nome Fantasia**
- **Razão Social**
- **Cidade/UF** da matriz
- **Quantidade de usuários** (para licenciamento)
- **Nome do schema** desejado (ex: `markpress`, `brasil_wl`)

### **3. Estrutura do Schema**

Schema já deve estar criado com estrutura base (clone do `public`):

```bash
node _dev_scripts/clone_schema_structure.js <nome_schema>
```

---

## 📋 PROCESSO DE IMPORTAÇÃO (ORDEM OBRIGATÓRIA)

### **FASE 1: Preparação** (15-20 min)

#### **1.1. Criar Empresa no Master**

**Script:** `setup_<empresa>_master.js`

```javascript
// Exemplo: setup_novocliente_master.js
const { masterPool } = require('../config/database');

async function setupNovoclienteMaster() {
    try {
        // 1. Inserir empresa
        const empresaResult = await masterPool.query(`
            INSERT INTO empresas (
                cnpj, nome_fantasia, razao_social, 
                cidade, uf, ativo, max_usuarios, schema_name
            ) VALUES (
                '00.000.000/0000-00',
                'Novo Cliente Ltda',
                'Novo Cliente Representações Ltda',
                'São Paulo', 'SP',
                true, 10, 'novocliente'
            ) RETURNING id
        `);
        
        const empresaId = empresaResult.rows[0].id;
        console.log(`✅ Empresa criada: ID ${empresaId}`);

        // 2. Criar usuário admin
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('senha123', 10);
        
        await masterPool.query(`
            INSERT INTO usuarios (
                empresa_id, nome, sobrenome, email, 
                senha, celular, e_admin, ativo
            ) VALUES (
                $1, 'Admin', 'Sistema', 'admin@novocliente.com',
                $2, '(11) 99999-9999', true, true
            )
        `, [empresaId, senhaHash]);

        console.log('✅ Usuário admin criado');
        console.log('\nPronto para importar dados!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await masterPool.end();
    }
}

setupNovoclienteMaster();
```

**Executar:**
```bash
node _dev_scripts/setup_novocliente_master.js
```

#### **1.2. Criar Schema no Tenant**

```bash
node _dev_scripts/clone_schema_structure.js novocliente
```

**Verifica:**
```bash
node _dev_scripts/check_schema.js novocliente
```

---

### **FASE 2: Importação de Cadastros Base** (30-40 min)

#### **2.1. Indústrias/Fornecedores** ⭐ PRIMEIRO

**Script:** `import_fornecedores.js`

**Padrão do Excel:**
| CODIGO | NOME | FANTASIA | CNPJ | CIDADE | UF | EMAIL | TELEFONE |
|--------|------|----------|------|--------|----|----|----------|

**O que faz:**
- Insere em `cad_fornecedores`
- Cria códigos normalizados
- Valida CNPJs

**Executar:**
```bash
# Editar no topo do script:
# const SCHEMA = 'novocliente';
# const EXCEL_FILE = 'FORNECEDORES.xlsx';

node _dev_scripts/import_fornecedores.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.cad_fornecedores;
SELECT * FROM novocliente.cad_fornecedores LIMIT 5;
```

---

#### **2.2. Cidades** (Se necessário)

**Script:** `import_cidades.js` ou `import_cidades_regioes.js`

**Padrão do Excel:**
| CODIGO | NOME | UF | REGIAO |
|--------|------|----|----|

**Executar:**
```bash
node _dev_scripts/import_cidades_regioes.js
```

**Nota:** Se cliente não fornecer, usa base pública (28mil cidades já cadastradas)

---

#### **2.3. Clientes** ⭐ SEGUNDO

**Script:** `import_clientes.js`

**Padrão do Excel:**
| CODIGO | RAZAO | FANTASIA | CGC | ENDERECO | CIDADE | UF | CEP | TELEFONE | EMAIL |
|--------|-------|----------|-----|----------|--------|----|----|----------|-------|

**O que faz:**
- Insere em `cad_clientes`
- Relaciona com cidades
- Cria códigos normalizados
- Define status padrão (ativo)

**Executar:**
```bash
node _dev_scripts/import_clientes.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.cad_clientes;
SELECT cli_razao, cli_fantasia, cli_cidade FROM novocliente.cad_clientes LIMIT 10;
```

---

#### **2.4. Vendedores** ⭐ TERCEIRO

**Script:** `import_vendedores.js`

**Padrão do Excel:**
| CODIGO | NOME | CELULAR | EMAIL | COMISSAO | ATIVO |
|--------|------|---------|-------|----------|-------|

**O que faz:**
- Insere em `vendedores`
- Define percentuais de comissão
- Cria usuários no sistema (opcional)

**Executar:**
```bash
node _dev_scripts/import_vendedores.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.vendedores;
SELECT ven_nome, ven_comissao FROM novocliente.vendedores;
```

---

#### **2.5. Produtos** ⭐ QUARTO

**Script:** `import_cad_prod.js` ou `import_produtos.js`

**Padrão do Excel:**
| CODIGO | DESCRICAO | REFERENCIA | UNIDADE | CODIGO_INDUSTRIA | PRECO_SUGERIDO | ATIVO |
|--------|-----------|------------|---------|------------------|----------------|-------|

**O que faz:**
- Insere em `cad_prod`
- Relaciona com indústria via `pro_idindustria`
- Normaliza códigos
- Define preços base

**Executar:**
```bash
node _dev_scripts/import_cad_prod.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.cad_prod;
SELECT pro_descricao, pro_idindustria FROM novocliente.cad_prod LIMIT 10;

-- Ver relação com indústrias
SELECT 
    p.pro_codigo,
    p.pro_descricao,
    f.for_fantasia
FROM novocliente.cad_prod p
LEFT JOIN novocliente.cad_fornecedores f ON f.for_codigo = p.pro_idindustria
LIMIT 20;
```

---

### **FASE 3: Relacionamentos e Configurações** (20-30 min)

#### **3.1. Regiões** (Se aplicável)

**Script:** `import_regioes.js` ou `migrate_regions.js`

**Padrão do Excel:**
| CODIGO | NOME | DESCRICAO |
|--------|------|-----------|

**Executar:**
```bash
node _dev_scripts/import_regioes.js
```

---

#### **3.2. Transportadoras** (Se aplicável)

**Script:** `import_transportadora.js` ou `migrate_transportadoras.js`

**Padrão do Excel:**
| CODIGO | NOME | CNPJ | CIDADE | UF | TELEFONE |
|--------|------|------|--------|----|----|

**Executar:**
```bash
node _dev_scripts/import_transportadora.js
```

---

#### **3.3. Grupos de Desconto** (Se aplicável)

**Script:** `import_grupos.js` ou `import_grupo_desc.js`

**Padrão do Excel:**
| CODIGO | DESCRICAO | DESCONTO_PADRAO |
|--------|-----------|----------------|

**Executar:**
```bash
node _dev_scripts/import_grupos_final.js
```

---

#### **3.4. Cliente x Indústria** (Relacionamento)

**Script:** `import_cli_ind.js`

**Padrão do Excel:**
| CLI_CODIGO | IND_CODIGO |
|------------|------------|

**O que faz:**
- Relaciona clientes com indústrias autorizadas
- Usado para filtros e regras de negócio

**Executar:**
```bash
node _dev_scripts/import_cli_ind.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.cli_ind;

-- Ver quais clientes compram de quais indústrias
SELECT 
    c.cli_fantasia,
    f.for_fantasia
FROM novocliente.cli_ind ci
JOIN novocliente.cad_clientes c ON c.cli_codigo = ci.cli_codigo
JOIN novocliente.cad_fornecedores f ON f.for_codigo = ci.ind_codigo
LIMIT 50;
```

---

#### **3.5. Descontos por Cliente** (Se aplicável)

**Script:** `import_cli_descpro.js`

**Padrão do Excel:**
| CLI_CODIGO | PRO_CODIGO | DESCONTO |
|------------|------------|----------|

**Executar:**
```bash
node _dev_scripts/import_cli_descpro_correct.js
```

---

#### **3.6. Áreas de Atuação** (Se aplicável)

**Scripts:** 
- `import_area_atu.js` (Cadastro de áreas)
- `import_atua_cli.js` (Clientes por área)

**Executar:**
```bash
node _dev_scripts/import_area_atu.js
node _dev_scripts/import_atua_cli.js
```

---

#### **3.7. Contatos** (Se aplicável)

**Scripts:**
- `import_contacts.js` (Contatos de clientes)
- `import_contato_for.js` (Contatos de fornecedores)

**Executar:**
```bash
node _dev_scripts/import_contacts.js
node _dev_scripts/import_contato_for.js
```

---

### **FASE 4: Histórico de Pedidos** ⚠️ CRÍTICO (40-60 min)

#### **4.1. Pedidos (Cabeçalho)** ⭐ PRIMEIRO

**Script:** `import_pedidos.js`

**Padrão do Excel:**
| PED_NUMERO | PED_DATA | CLI_CODIGO | VEN_CODIGO | PED_TOTAL | PED_STATUS |
|------------|----------|------------|-----------|-----------|---------|

**O que faz:**
- Insere em `pedidos`
- Relaciona cliente e vendedor
- Define status inicial
- **IMPORTANTE:** Ajusta sequence para próximos pedidos

**Executar:**
```bash
node _dev_scripts/import_pedidos.js
```

**Verificar:**
```sql
SELECT COUNT(*) FROM novocliente.pedidos;
SELECT MAX(ped_numero) FROM novocliente.pedidos;

-- Ver primeiros 10 pedidos com cliente
SELECT 
    p.ped_numero,
    p.ped_data,
    c.cli_fantasia,
    v.ven_nome,
    p.ped_total
FROM novocliente.pedidos p
LEFT JOIN novocliente.cad_clientes c ON c.cli_codigo = p.ped_idcliente
LEFT JOIN novocliente.vendedores v ON v.ven_codigo = p.ped_idvendedor
ORDER BY p.ped_numero
LIMIT 10;
```

---

#### **4.2. Itens dos Pedidos** ⭐ SEGUNDO (MAIS CRÍTICO)

**Script:** `import_itens_ped_final.js` ou `import_itens_com_produtos.js`

**Padrão do Excel:**
| PED_NUMERO | ITEM_SEQ | PRO_CODIGO | ITE_QTDE | ITE_VLUNIT | ITE_DESCONTO | ITE_TOTAL |
|------------|----------|------------|----------|------------|--------------|-----------|

**O que faz:**
- Insere em `itens_ped`
- Relaciona com produtos
- Calcula totais
- Valida consistência (total itens = total pedido)

**⚠️ ATENÇÃO:** Este é o script MAIS DEMORADO (pode levar 30-60 min para milhares de itens)

**Executar:**
```bash
node _dev_scripts/import_itens_com_produtos.js
# OU
node _dev_scripts/import_itens_ped_final.js
```

**Verificar:**
```sql
-- Contar itens
SELECT COUNT(*) FROM novocliente.itens_ped;

-- Verificar integridade (itens sem pedido)
SELECT COUNT(*) FROM novocliente.itens_ped i
LEFT JOIN novocliente.pedidos p ON p.ped_numero = i.ite_idpedido
WHERE p.ped_numero IS NULL;
-- Deve retornar 0!

-- Verificar itens sem produto
SELECT COUNT(*) FROM novocliente.itens_ped i
LEFT JOIN novocliente.cad_prod pr ON pr.pro_codigo = i.ite_idprod
WHERE pr.pro_codigo IS NULL;
-- Deve retornar 0!

-- Ver exemplos de itens
SELECT 
    i.ite_idpedido,
    i.ite_seq,
    pr.pro_descricao,
    i.ite_qtde,
    i.ite_vlunit,
    i.ite_total
FROM novocliente.itens_ped i
LEFT JOIN novocliente.cad_prod pr ON pr.pro_codigo = i.ite_idprod
LIMIT 20;
```

---

#### **4.3. Ajustar Sequence de Pedidos** ⚠️ ESSENCIAL

**Script:** `adjust_pedidos_sequence.js` ou `create_pedidos_sequence.js`

**O que faz:**
- Garante que próximos pedidos não conflitem com histórico
- Define sequence para MAX(ped_numero) + 1

**Executar:**
```bash
node _dev_scripts/adjust_pedidos_sequence.js
```

**Verificar:**
```sql
-- Ver próximo número que será gerado
SELECT nextval('novocliente.gen_pedidos_id');

-- Resetar se necessário (para testar)
SELECT setval('novocliente.gen_pedidos_id', (SELECT MAX(ped_numero) FROM novocliente.pedidos));
```

---

### **FASE 5: Dados Complementares** (15-20 min)

#### **5.1. Tabelas de Preços** (Se aplicável)

**Script:** `import_price_tables.js`

**Padrão do Excel:**
| TABELA | PRO_CODIGO | PRECO |
|--------|------------|-------|

**Executar:**
```bash
node _dev_scripts/import_price_tables.js
```

---

#### **5.2. Metas de Vendedores** (Se aplicável)

**Script:** `import_vend_metas.js` ou `import_goals.js`

**Padrão do Excel:**
| VEN_CODIGO | MES | ANO | META_VALOR |
|------------|-----|-----|------------|

**Executar:**
```bash
node _dev_scripts/import_vend_metas.js
```

---

### **FASE 6: Verificação Final** ⚠️ OBRIGATÓRIO (10-15 min)

#### **6.1. Checklist de Validação**

**Script:** `verificar_login.js` (valida todo o schema)

**Executar:**
```bash
node _dev_scripts/check_schema_simple.js novocliente
```

**Verificações Manuais:**

```sql
-- 1. Contar todos os registros
SELECT 
    (SELECT COUNT(*) FROM novocliente.cad_fornecedores) as fornecedores,
    (SELECT COUNT(*) FROM novocliente.cad_clientes) as clientes,
    (SELECT COUNT(*) FROM novocliente.vendedores) as vendedores,
    (SELECT COUNT(*) FROM novocliente.cad_prod) as produtos,
    (SELECT COUNT(*) FROM novocliente.pedidos) as pedidos,
    (SELECT COUNT(*) FROM novocliente.itens_ped) as itens_pedidos;

-- 2. Verificar relacionamentos órfãos
-- Produtos sem indústria
SELECT COUNT(*) FROM novocliente.cad_prod p
LEFT JOIN novocliente.cad_fornecedores f ON f.for_codigo = p.pro_idindustria
WHERE f.for_codigo IS NULL;

-- Pedidos sem cliente
SELECT COUNT(*) FROM novocliente.pedidos p
LEFT JOIN novocliente.cad_clientes c ON c.cli_codigo = p.ped_idcliente
WHERE c.cli_codigo IS NULL;

-- Pedidos sem vendedor
SELECT COUNT(*) FROM novocliente.pedidos p
LEFT JOIN novocliente.vendedores v ON v.ven_codigo = p.ped_idvendedor
WHERE v.ven_codigo IS NULL;

-- 3. Verificar totalizações
SELECT 
    p.ped_numero,
    p.ped_total as total_cabecalho,
    SUM(i.ite_total) as total_itens,
    p.ped_total - SUM(i.ite_total) as diferenca
FROM novocliente.pedidos p
LEFT JOIN novocliente.itens_ped i ON i.ite_idpedido = p.ped_numero
GROUP BY p.ped_numero, p.ped_total
HAVING ABS(p.ped_total - SUM(i.ite_total)) > 0.01
LIMIT 20;
-- Deve retornar vazio ou diferenças < R$0.10

-- 4. Verificar sequence de produtos
SELECT 
    MAX(pro_id) as max_id,
    nextval('novocliente.gen_cad_prod_id') as next_id
FROM novocliente.cad_prod;
-- next_id deve ser > max_id

-- 5. Verificar sequence de pedidos
SELECT 
    MAX(ped_numero) as max_numero,
    nextval('novocliente.gen_pedidos_id') as next_numero
FROM novocliente.pedidos;
-- next_numero deve ser > max_numero
```

---

#### **6.2. Testar Login e Acesso**

**Executar:**
```bash
node _dev_scripts/verificar_login.js
```

**Testar no frontend:**
1. Abrir `http://localhost:3000/login`
2. Informar CNPJ da empresa
3. Login: `admin@novocliente.com`
4. Senha: `senha123` (ou a definida)
5. Verificar:
   - Dashboard carrega
   - Menus aparecem
   - Listas de clientes, produtos funcionam
   - Criação de pedido funciona

---

### **FASE 7: Otimização** (10 min)

#### **7.1. Criar Índices**

**Script:** `criar_indices.js`

**O que faz:**
- Cria índices para performance
- Otimiza queries complexas

**Executar:**
```bash
node _dev_scripts/criar_indices.js novocliente
```

---

#### **7.2. Analisar Tabelas** (Atualizar estatísticas)

```sql
ANALYZE novocliente.cad_clientes;
ANALYZE novocliente.cad_fornecedores;
ANALYZE novocliente.cad_prod;
ANALYZE novocliente.pedidos;
ANALYZE novocliente.itens_ped;
```

---

## 📊 CHECKLIST FINAL (Copy & Paste)

```
MIGRAÇÃO DO SCHEMA: ___________________
DATA: ___/___/2026
RESPONSÁVEL: ___________________

[ ] FASE 1: Preparação
    [ ] Empresa criada no master
    [ ] Usuário admin criado
    [ ] Schema criado no tenant
    [ ] Estrutura clonada do public

[ ] FASE 2: Cadastros Base
    [ ] Fornecedores importados (_____ registros)
    [ ] Cidades importadas (_____ registros)
    [ ] Clientes importados (_____ registros)
    [ ] Vendedores importados (_____ registros)
    [ ] Produtos importados (_____ registros)

[ ] FASE 3: Relacionamentos
    [ ] Regiões
    [ ] Transportadoras
    [ ] Grupos de desconto
    [ ] Cliente x Indústria
    [ ] Descontos por cliente
    [ ] Áreas de atuação
    [ ] Contatos

[ ] FASE 4: Pedidos
    [ ] Pedidos importados (_____ registros)
    [ ] Itens importados (_____ registros)
    [ ] Sequence ajustada

[ ] FASE 5: Complementares
    [ ] Tabelas de preços
    [ ] Metas de vendedores

[ ] FASE 6: Verificação
    [ ] Todos os counts conferem
    [ ] Sem órfãos (produtos sem indústria = 0)
    [ ] Sem órfãos (pedidos sem cliente = 0)
    [ ] Sem órfãos (pedidos sem vendedor = 0)
    [ ] Totais batem (diferença < R$0.10)
    [ ] Sequences corretas
    [ ] Login testado OK
    [ ] Dashboard OK
    [ ] Pedido de teste criado OK

[ ] FASE 7: Otimização
    [ ] Índices criados
    [ ] ANALYZE executado

TEMPO TOTAL: _____ horas
OBSERVAÇÕES:
_______________________________________________
_______________________________________________
```

---

## 🚨 PROBLEMAS COMUNS E SOLUÇÕES

### **1. "Cannot find module 'xlsx'"**

**Solução:**
```bash
npm install xlsx
```

### **2. "Arquivo Excel não encontrado"**

**Solução:**
- Verificar caminho no script
- Garantir que arquivo está em `_dev_scripts/`
- Verificar nome exato (case-sensitive)

### **3. "Violação de chave única"**

**Causa:** Códigos duplicados no Excel

**Solução:**
```sql
-- Ver duplicatas
SELECT pro_codigo, COUNT(*) 
FROM novocliente.cad_prod 
GROUP BY pro_codigo 
HAVING COUNT(*) > 1;

-- Remover duplicatas (manter primeiro)
DELETE FROM novocliente.cad_prod
WHERE pro_id NOT IN (
    SELECT MIN(pro_id) 
    FROM novocliente.cad_prod 
    GROUP BY pro_codigo
);
```

### **4. "Sequence desatualizada"**

**Causa:** Sequence não foi ajustada após importação

**Solução:**
```sql
-- Produtos
SELECT setval('novocliente.gen_cad_prod_id', 
    (SELECT MAX(pro_id) FROM novocliente.cad_prod)
);

-- Pedidos
SELECT setval('novocliente.gen_pedidos_id', 
    (SELECT MAX(ped_numero) FROM novocliente.pedidos)
);
```

### **5. "Totais não batem"**

**Causa:** Cálculo de itens difere do cabeçalho

**Solução:**
```sql
-- Recalcular totais de pedidos
UPDATE novocliente.pedidos p
SET ped_total = (
    SELECT SUM(ite_total) 
    FROM novocliente.itens_ped i 
    WHERE i.ite_idpedido = p.ped_numero
);
```

---

## 📝 SCRIPTS AUXILIARES

### **Limpar Schema para Reimportar**

**⚠️ CUIDADO: Apaga TODOS os dados!**

```sql
-- backup/_dev_scripts/truncate_db.js
TRUNCATE novocliente.itens_ped CASCADE;
TRUNCATE novocliente.pedidos CASCADE;
TRUNCATE novocliente.cad_prod CASCADE;
TRUNCATE novocliente.cad_clientes CASCADE;
TRUNCATE novocliente.vendedores CASCADE;
TRUNCATE novocliente.cad_fornecedores CASCADE;
```

### **Comparar Schemas**

```bash
node _dev_scripts/compare_schemas.js markpress novocliente
```

### **Exportar Schema para SQL**

```bash
node _dev_scripts/export_ro_consult_schema.js novocliente
```

---

## 🎯 PRÓXIMOS 40 SCHEMAS

Com este guia, cada nova migração deve levar **2-3 horas** no máximo.

**Otimizações futuras:**
1. ✅ Script unificado que roda TODA a migração
2. ✅ Validação automática pós-import
3. ✅ Geração de relatório PDF
4. ✅ Interface web para upload de Excels

---

**Autor:** Antigravity AI  
**Data:** 2026-01-28  
**Status:** ✅ PRONTO PARA USO  
**Próxima revisão:** Após 5 migrações bem-sucedidas
