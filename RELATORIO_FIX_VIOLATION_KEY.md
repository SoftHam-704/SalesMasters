# 🔧 RELATÓRIO CORRIGIDO: Ajuste de Sequences - Tabela `cad_prod`

**Data:** 28/01/2026  
**Problema:** Violation key ao importar produtos (sequence desatualizada)  
**Schema de referência:** markpress (já corrigido ontem)  
**Status:** ✅ Solução identificada e scripts criados

---

## 📋 RESUMO EXECUTIVO

Durante a importação de tabelas de preço no schema `markpress`, identificamos um erro de **violation key** causado por **sequences desatualizadas**. A sequence `gen_cad_prod_id` estava gerando IDs que já existiam na tabela `cad_prod`, causando conflitos de chave primária.

---

## 🐛 PROBLEMA REAL IDENTIFICADO

### Root Cause

A **sequence (contador automático)** estava desatualizada em relação aos dados reais da tabela:

```
Situação Problemática:
- Maior pro_id na tabela: 5000
- Próximo valor da sequence: 3500  ❌

Ao tentar inserir novo produto:
- Sistema gera pro_id = 3501 (da sequence)
- Produto com pro_id = 3501 JÁ EXISTE
- ERRO: duplicate key value violates unique constraint "pk_cad_prod"
```

### Por que isso acontece?

Possíveis causas:
1. **Importação manual** de dados com IDs específicos
2. **Restore de backup** que não atualizou a sequence
3. **Migração de dados** de outro sistema
4. **INSERT direto** com IDs fornecidos (bypass da sequence)

---

## ✅ SOLUÇÃO APLICADA NO MARKPRESS (Ontem)

```sql
-- 1. Ajustar sequence para o próximo valor disponível
SELECT setval('sequence_name', MAX(pro_id) + 1) FROM cad_prod;

-- 2. Limpar tabela de preços para começar do zero
TRUNCATE TABLE markpress.cad_tabelaspre;
```

### Resultado:
- ✅ Próximo `pro_id` será sempre > que o máximo existente
- ✅ Sem conflitos de chave primária
- ✅ Importação de produtos funciona normalmente

---

## 📁 SCHEMAS AFETADOS

| Schema | Status | Ação Necessária |
|--------|--------|-----------------|
| ✅ **markpress** | Já corrigido ontem | Nenhuma (modelo padrão) |
| ⚠️ **brasil_wl** | Provável desatualização | Ajustar sequence |
| ⚠️ **public** | Provável desatualização | Ajustar sequence |
| ⚠️ **remap** | Provável desatualização | Ajustar sequence |
| ⚠️ **rimef** | Provável desatualização | Ajustar sequence |
| ⚠️ **ro_consult** | Provável desatualização | Ajustar sequence |
| ⚠️ **target** | Provável desatualização | Ajustar sequence |

---

## 🔧 SCRIPTS CRIADOS

### 1. **FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql** ✅

**O que faz:**
1. 📊 **Diagnóstico**: Mostra MAX(pro_id) vs valor da sequence em cada schema
2. 🔧 **Correção**: Ajusta sequences para `MAX(pro_id) + 1`
3. ✅ **Verificação**: Confirma que todas as sequences estão corretas

**Saída esperada:**
```
Schema          | MAX(pro_id) | Sequence Atual | Status
----------------|-------------|----------------|------------------
markpress       | 5234        | 5235           | ✅ OK (modelo padrão)
brasil_wl       | 3891        | 3450           | ❌ DESATUALIZADA!
public          | 7823        | 7824           | ✅ OK
rimef           | 2341        | 1500           | ❌ DESATUALIZADA!
...
```

**Quando executar:** **OBRIGATÓRIO** antes de qualquer importação

---

### 2. **OPTIONAL_CLEAN_PRICE_TABLES.sql** ⚠️

**O que faz:**
1. 📊 **Preview**: Mostra quantos registros existem em cada tabela de preços
2. 🗑️ **Limpeza** (OPCIONAL): TRUNCATE das tabelas `cad_tabelaspre`

**⚠️ IMPORTANTE:**
- Script vem **COMENTADO** por segurança
- Você precisa **descomentar** para executar
- **APAGA TODOS OS PREÇOS** dos schemas selecionados
- **Irreversível** sem backup

**Quando executar:** 
- ✅ Se você vai **reimportar** todas as tabelas de preço do zero
- ❌ Se quer **manter** os preços existentes

---

## 🚀 PLANO DE AÇÃO

### Fase 1: Diagnóstico (AGORA - 5 min)

```powershell
# Via pgAdmin ou psql:
# Execute: FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql
```

**Resultado esperado:**
- Ver matriz comparativa: MAX(pro_id) vs Sequence
- Identificar quais schemas precisam correção

---

### Fase 2: Correção de Sequences (AGORA - automático)

O mesmo script **já faz** a correção automaticamente após o diagnóstico!

**Resultado esperado:**
```
✅ Sequence markpress.gen_cad_prod_id ajustada para: 5235
✅ Sequence brasil_wl.gen_cad_prod_id ajustada para: 3892
✅ Sequence rimef.gen_cad_prod_id ajustada para: 2342
...
```

---

### Fase 3: Limpeza de Preços (OPCIONAL)

**Opção A: Manter preços existentes**
- ✅ Pule esta etapa
- ✅ Continue usando os preços atuais
- ✅ Importe apenas tabelas novas ou atualize as existentes

**Opção B: Começar do zero**
```powershell
# 1. Faça BACKUP do banco!
# 2. Abra OPTIONAL_CLEAN_PRICE_TABLES.sql
# 3. Descomente o bloco DO $$ ... END $$
# 4. Execute
```

---

### Fase 4: Testar Importação (AGORA)

```
1. Abra o sistema
2. Vá para Importação de Tabelas de Preço
3. Selecione um arquivo para importar
4. Clique em Importar
```

**Resultado esperado:**
- ✅ **Sem erros** de "duplicate key"
- ✅ Produtos inseridos com sucesso
- ✅ Preços importados corretamente

---

## 📊 COMPARAÇÃO: Antes vs Depois

### ❌ ANTES (Problema)
```
Tentativa de importar produto:
1. Sistema busca próximo ID da sequence: 3500
2. Tenta INSERT INTO cad_prod (pro_id, ...) VALUES (3500, ...)
3. ❌ ERRO: Key (pro_id)=(3500) already exists!
4. Importação falha
```

### ✅ DEPOIS (Corrigido)
```
Tentativa de importar produto:
1. Sistema busca próximo ID da sequence: 5235 (ajustado)
2. Tenta INSERT INTO cad_prod (pro_id, ...) VALUES (5235, ...)
3. ✅ SUCESSO: Pro_id 5235 inseridocom sucesso!
4. Sequence incrementa para 5236 automaticamente
```

---

## 🔍 COMO VERIFICAR SE ESTÁ CORRETO

### Query Manual de Verificação

```sql
-- Para qualquer schema, execute:
SET search_path TO nome_do_schema;

-- Comparar MAX vs Sequence
SELECT 
    (SELECT MAX(pro_id) FROM cad_prod) as max_pro_id,
    currval(pg_get_serial_sequence('cad_prod', 'pro_id')) as sequence_value,
    CASE 
        WHEN currval(pg_get_serial_sequence('cad_prod', 'pro_id')) > 
             (SELECT MAX(pro_id) FROM cad_prod) 
        THEN '✅ OK' 
        ELSE '❌ DESATUALIZADA' 
    END as status;
```

**Resultado esperado:**
```
max_pro_id | sequence_value | status
-----------|----------------|----------
5234       | 5235           | ✅ OK
```

---

## ⚠️ IMPACTOS E CONSIDERAÇÕES

### Downtime
- ❌ **Nenhum downtime** necessário
- ✅ Script pode ser executado com sistema em operação
- ⚠️ Evite importações simultâneas durante a execução

### Dados Existentes

**Script 1 (Sequences):**
- ✅ **Não apaga dados**
- ✅ Apenas ajusta contadores
- ✅ 100% seguro

**Script 2 (Limpeza - Opcional):**
- ❌ **APAGA todos os preços** dos schemas selecionados
- ⚠️ **Irreversível** sem backup
- ✅ Só execute se for reimportar tudo

### Backup

**Antes de executar qualquer script:**
```sql
-- Backup apenas das sequences (rápido):
SELECT 
    schemaname || '.' || sequencename as sequence_name,
    last_value
FROM pg_sequences
WHERE schemaname IN ('markpress', 'brasil_wl', 'public', 'remap', 'rimef', 'ro_consult', 'target')
AND sequencename LIKE '%cad_prod%';
```

---

## 📚 REFERÊNCIAS

- Script original aplicado no markpress (ontem)
- `backend/price_tables_endpoints.js` - API de importação
- `scripts_bancodedados/estrutura_public.sql` - Estrutura do banco

---

## 👥 AUTORIA

**Analisado por:** Antigravity AI (Backend Specialist)  
**Criado em:** 28/01/2026 06:10 BRT  
**Baseado em:** Correção aplicada no markpress em 27/01/2026  

---

**Status:** 🟢 PRONTO PARA EXECUÇÃO

**Próximo passo:** Execute `FIX_SEQUENCES_CAD_PROD_ALL_SCHEMAS.sql`
