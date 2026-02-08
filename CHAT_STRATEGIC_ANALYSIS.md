# 📊 ANÁLISE ESTRATÉGICA: Chat Cross-Empresa
## Estudo de Viabilidade e Performance

**Status:** 🟡 EM ANÁLISE  
**Data:** 2026-01-28  
**Decisão:** PAUSADO para análise de impacto

---

## 🎯 OBJETIVO

Implementar sistema de chat que permita:
- ✅ Comunicação entre usuários de diferentes empresas (cross-tenant)
- ✅ Status de presença online (quem está conectado)
- ✅ Notificações em tempo real
- ✅ Histórico de conversas
- ✅ Performance aceitável (<200ms por operação)

---

## 🏗️ ARQUITETURAS POSSÍVEIS

### **Opção 1: Chat no Banco MASTER** ⭐

**Estrutura:**
```
salesmasters_master
├─ usuarios (já existe, sem uso)
├─ user_presence (novo)
├─ chat_conversas (novo)
├─ chat_mensagens (novo)
└─ chat_participantes (novo)
```

**Como funciona:**
1. Backend mantém 2 conexões (master + tenant)
2. Chat consulta/grava no master
3. Dados operacionais (pedidos, clientes) no tenant

#### ✅ **Vantagens:**
- Chat verdadeiramente global (cross-empresa)
- Usuário vê TODOS os outros usuários do sistema
- Centralizado (fácil manutenção)
- Escalável (não replica dados)
- Aproveita tabela `usuarios` existente

#### ❌ **Desvantagens:**
- **Performance:** Conexão adicional ao master em TODAS as requisições de chat
- **Sincronização:** Precisa manter `master.usuarios` atualizado com `schema.user_nomes`
- **Complexidade:** Backend precisa gerenciar 2 pools de conexão
- **Custo:** Queries cross-database podem ser mais lentas
- **Risco:** Se master cair, chat cai para TODOS

#### 📊 **Impacto de Performance Estimado:**

| Operação | Sem Master (ms) | Com Master (ms) | Impacto |
|----------|-----------------|-----------------|---------|
| Listar conversas | 50ms | 80ms | +60% |
| Enviar mensagem | 30ms | 60ms | +100% |
| Listar usuários online | 100ms | 150ms | +50% |
| Heartbeat (a cada 30s) | - | 20ms | Novo |

**Carga adicional:**
- 100 usuários online = 200 queries/min no master (heartbeats)
- Pico de 500 usuários = 1000 queries/min

---

### **Opção 2: Chat no Schema PUBLIC (Tenant)**

**Estrutura:**
```
basesales.public
├─ user_nomes (já existe - mas está em cada schema!)
├─ user_presence (novo)
├─ chat_conversas (novo)
├─ chat_mensagens (novo)
└─ chat_participantes (novo)
```

**Como funciona:**
1. Backend usa conexão única (tenant)
2. Chat usa schema `public` (compartilhado)
3. VIEW agregada de usuários de todos os schemas

#### ✅ **Vantagens:**
- **Performance:** Conexão única (menor overhead)
- Aproveita pool existente do tenant
- Queries mais rápidas (mesmo database)
- Menos complexidade no backend

#### ❌ **Desvantagens:**
- **VIEW agregada cara:** `UNION ALL` de todos os schemas
- **Manutenção:** Cada novo schema precisa atualizar VIEW
- **Escalabilidade:** Degradação com muitos schemas (10+)
- **Sincronização:** Usuários em schemas diferentes têm IDs iguais?

#### 📊 **Impacto de Performance Estimado:**

| Operação | Single Schema | Multi-Schema (VIEW) | Impacto |
|----------|---------------|---------------------|---------|
| Listar conversas | 50ms | 70ms | +40% |
| Enviar mensagem | 30ms | 40ms | +33% |
| Listar usuários (VIEW com 5 schemas) | 100ms | 300ms | +200% |
| Listar usuários (VIEW com 20 schemas) | 100ms | 800ms | +700% 🔴 |

**Problema de Escalabilidade:**
```sql
-- VIEW agregada (exemplo com 5 empresas)
CREATE VIEW v_all_users AS
SELECT 'markpress' as schema, * FROM markpress.user_nomes
UNION ALL
SELECT 'brasil_wl' as schema, * FROM brasil_wl.user_nomes
UNION ALL
SELECT 'rimef' as schema, * FROM rimef.user_nomes
UNION ALL
SELECT 'target' as schema, * FROM target.user_nomes
UNION ALL
SELECT 'ro_consult' as schema, * FROM ro_consult.user_nomes;
-- Quanto mais schemas, PIOR a performance
```

---

### **Opção 3: Chat Isolado por Empresa** (Mais simples)

**Estrutura:**
```
basesales.markpress
├─ user_nomes
├─ chat_conversas (cada empresa tem o seu)
├─ chat_mensagens
└─ user_presence

basesales.brasil_wl
├─ user_nomes
├─ chat_conversas (isolado)
├─ chat_mensagens
└─ user_presence
```

**Como funciona:**
1. Chat INTERNO - só usuários da mesma empresa conversam
2. Dados completamente isolados
3. Sem cross-empresa

#### ✅ **Vantagens:**
- **Performance MÁXIMA:** Queries locais (50-100ms)
- Isolamento total (privacidade)
- Escalável (performance não degrada com novos schemas)
- Simples de implementar e manter
- Zero risco de vazamento cross-empresa

#### ❌ **Desvantagens:**
- ❌ **Sem chat cross-empresa** (objetivo inicial frustrado)
-Usuários de empresas diferentes NÃO podem conversar
- Menos útil para networking/colaboração

---

### **Opção 4: Híbrida (Cache + Master)**

**Estrutura:**
```
salesmasters_master
├─ usuarios (fonte primária)
└─ user_presence (global)

basesales.public
├─ users_cache (cache atualizado via trigger)
├─ chat_conversas
└─ chat_mensagens
```

**Como funciona:**
1. Tabela `users_cache` no tenant é CACHE do master
2. Trigger sincroniza master → cache (unidirecional)
3. Chat lê do cache (rápido), presença atualiza master

#### ✅ **Vantagens:**
- Leitura rápida (cache local)
- Escrita centralizada (master)
- Melhor dos dois mundos

#### ❌ **Desvantagens:**
- Complexidade alta (sincronização)
- Possível inconsistência (cache desatualizado)
- Overhead de manutenção

---

## 📈 ANÁLISE DE CARGA (Projeção)

### **Cenário Atual:**
- 5-10 empresas ativas
- ~50 usuários totais
- 5-10 online simultâneos em pico

**Carga estimada:**
- 300 heartbeats/min
- 50-100 mensagens/hora
- 20-30 queries de listagem/min

**Conclusão:** Qualquer opção funciona bem

---

### **Cenário Futuro (1 ano):**
- 20-50 empresas ativas
- ~200-500 usuários totais
- 30-50 online simultâneos

**Carga estimada:**
- 1500 heartbeats/min (master)
- 300-500 mensagens/hora
- 100-200 queries de listagem/min

**Conclusão:** Opção 1 (master) pode começar a ter lag

---

### **Cenário Escalado (3 anos):**
- 100+ empresas
- 1000+ usuários
- 100-200 online simultâneos

**Carga estimada:**
- 6000 heartbeats/min
- 1000+ mensagens/hora
- 500+ queries/min

**Conclusão:** 
- ❌ Opção 1 pode ter problemas de performance
- ❌ Opção 2 (VIEW) degradação severa
- ✅ Opção 3 escala perfeitamente
- 🤔 Opção 4 viável com cache otimizado

---

## 🎯 RECOMENDAÇÕES

### **Para implementar AGORA (MVP):**
**Opção 3 - Chat Isolado por Empresa** ✅

**Razões:**
1. ✅ Melhor performance (50-100ms)
2. ✅ Menos complexidade
3. ✅ Zero risco de escala
4. ✅ Mais rápido de implementar
5. ✅ Atende 80% dos casos de uso

**Trade-off aceito:**
- ❌ Sem chat cross-empresa (por enquanto)

---

### **Para implementar DEPOIS (v2.0):**
**Opção 4 - Híbrida com Cache** ⭐

Quando realmente precisar de cross-empresa:
1. Implementar `master.usuarios` como fonte única
2. Cache local em `tenant.public.users_cache`
3. Sincronização via trigger/job
4. Chat usa cache (leitura rápida)
5. Presença atualiza master (escrita direta)

---

## 🧪 TESTES DE PERFORMANCE NECESSÁRIOS

Antes de decidir, fazer benchmark:

### **1. Teste de Latência Single DB:**
```sql
EXPLAIN ANALYZE
SELECT * FROM public.user_nomes LIMIT 100;
-- Esperado: <50ms
```

### **2. Teste de Latência Cross-DB:**
```sql
-- No master
EXPLAIN ANALYZE
SELECT * FROM salesmasters_master.usuarios LIMIT 100;
-- Esperado: <100ms
```

### **3. Teste de VIEW Agregada:**
```sql
EXPLAIN ANALYZE
SELECT * FROM v_all_users; -- UNION de 5-10 schemas
-- Esperado: <200ms (aceitável)
-- Alerta se: >500ms (degradação)
```

### **4. Teste de Carga (Heartbeat):**
```sql
-- Simular 100 updates/min
-- Medir impacto no master
```

---

## 💰 ANÁLISE DE CUSTO-BENEFÍCIO

| Critério | Opção 1 (Master) | Opção 2 (PUBLIC+VIEW) | Opção 3 (Isolado) | Opção 4 (Híbrida) |
|----------|------------------|----------------------|-------------------|-------------------|
| **Performance** | 6/10 | 5/10 | 9/10 | 8/10 |
| **Escalabilidade** | 6/10 | 4/10 | 10/10 | 8/10 |
| **Complexidade** | 7/10 | 6/10 | 3/10 | 9/10 |
| **Manutenção** | 6/10 | 5/10 | 9/10 | 5/10 |
| **Cross-Empresa** | ✅ Sim | ✅ Sim | ❌ Não | ✅ Sim |
| **Tempo Impl.** | 2h | 1.5h | 1h | 3h |

**Vencedor MVP:** Opção 3 (33 pontos)  
**Vencedor Futuro:** Opção 4 (30 pontos)

---

## 📝 DECISÃO PENDENTE

### **Perguntas para Responder:**

1. **Prioridade:** Chat cross-empresa é ESSENCIAL ou Nice-to-Have?
   - Essencial → Opção 1 ou 4
   - Nice-to-Have → Opção 3 agora, 4 depois

2. **Horizonte:** Quantas empresas espera ter em 1 ano?
   - <20 → Opção 1 viável
   - 20-50 → Opção 3 ou 4
   - >50 → Opção 3 obrigatório

3. **Recursos:** Tempo disponível para implementar?
   - 1h → Opção 3
   - 2h → Opção 1
   - 3h+ → Opção 4

4. **Uso Real:** Usuários VÃO usar chat cross-empresa?
   - Muito → Vale investir em Opção 1/4
   - Pouco → Opção 3 suficiente

---

## 🚀 PRÓXIMOS PASSOS

### **ANTES de implementar:**

1. ✅ Rodar benchmarks de performance
2. ✅ Definir requisitos não-funcionais:
   - Latência máxima aceitável?
   - Quantos usuários online simultâneos?
   - Quantas empresas em 1-2 anos?
3. ✅ Validar com stakeholders:
   - Chat cross-empresa é realmente necessário?
4. ✅ Escolher arquitetura baseado em dados

### **DEPOIS de escolher:**

1. Implementar versão escolhida
2. Monitorar performance em produção
3. Ajustar se necessário
4. Planejar migração futura (se Opção 3 → 4)

---

## 📚 DOCUMENTAÇÃO GERADA

Durante esta análise, foram criados:
- ✅ `CHAT_PRESENCE_SYSTEM.sql` - Script base (adaptável)
- ✅ `chat_endpoints.js` - Endpoints backend (atualizados)
- ✅ `useUserPresence.js` - Hook frontend
- ✅ `CHAT_PRESENCE_SYSTEM_DOCS.md` - Documentação
- ✅ Este arquivo - Análise estratégica

**Tudo está pronto para qualquer opção escolhida!**

---

**Autor:** Antigravity AI  
**Status:** ⏸️ PAUSADO - Aguardando decisão estratégica  
**Revisão:** Pendente após benchmarks de performance
