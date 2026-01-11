# 🗄️ CONFIGURAÇÃO DO BANCO DE DADOS - SaveInCloud

> ⚠️ **IMPORTANTE:** Para entender a arquitetura Multi-Tenant completa, leia:
> **[ARQUITETURA_BANCOS_SAVEINCLOUD.md](./ARQUITETURA_BANCOS_SAVEINCLOUD.md)**
>
> **Resumo Rápido:**
> - **`salesmasters_master`** = Login e controle de empresas
> - **`basesales`** = Dados operacionais (clientes, pedidos, etc.)

**Última Atualização:** 09/01/2026  
**Status:** ✅ Operacional e Testado  
**Servidor:** node254557-salesmaster.sp1.br.saveincloud.net.br

---

## 📋 ÍNDICE

1. [Informações de Acesso](#informações-de-acesso)
2. [Como Encontrar no Painel](#como-encontrar-no-painel)
3. [Configuração Local (.env)](#configuração-local-env)
4. [Configuração em Produção](#configuração-em-produção)
5. [Estrutura do Banco](#estrutura-do-banco)
6. [Como Testar Conexão](#como-testar-conexão)
7. [Troubleshooting](#troubleshooting)

---

## 🔐 INFORMAÇÕES DE ACESSO

### Credenciais de Produção

```
┌─────────────────────────────────────────────────────────────────┐
│  HOST:     node254557-salesmaster.sp1.br.saveincloud.net.br     │
│  PORTA:    13062                                                 │
│  BANCO:    basesales                                             │
│  USUÁRIO:  webadmin                                              │
│  SENHA:    ******                                            │
│  SSL:      false                                                 │
│  VERSÃO:   PostgreSQL 16.11                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Informações do Servidor

- **Node ID SaveInCloud:** 254909
- **IP Interno:** 10.100.53.245
- **Ambiente:** salesmasters-app

---

## 🎯 COMO ENCONTRAR NO PAINEL

### Passo 1: Acessar o Painel
1. Acesse: https://app.saveincloud.com.br
2. Faça login com suas credenciais

### Passo 2: Localizar o Ambiente
1. No painel principal, localize o ambiente **"salesmasters-app"**
2. O endereço completo será: `node254557-salesmaster.sp1.br.saveincloud.net.br`

### Passo 3: Identificar o Nó PostgreSQL
1. No menu lateral, expanda "Servidores App."
2. Você verá o nó **PostgreSQL** com ID **254909**
3. O IP interno mostrado será: `10.100.53.245`

### Passo 4: Obter Credenciais
1. Clique no nó PostgreSQL
2. Vá em **"Configurações"** ou **"Info"**
3. As credenciais de acesso estarão disponíveis lá

---

## ⚙️ CONFIGURAÇÃO LOCAL (.env)

### Backend Node.js (Development)

**Arquivo:** `backend/.env`

```env
# ===== BANCO DE DADOS CLOUD (SaveInCloud) =====
DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
DB_PORT=13062
DB_NAME=basesales
DB_USER=webadmin
DB_PASSWORD=******

# ===== CONEXÃO MASTER (Multi-Tenant) =====
MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******
MASTER_DB_DATABASE=basesales
MASTER_DB_SSL=false

# ===== SERVIDOR LOCAL =====
PORT=3005

# ===== APIs EXTERNAS =====
GEMINI_API_KEY=AIzaSy******
AI_PROVIDER_ORDER=openai,gemini,claude
OPENAI_API_KEY=sk-proj-******
```

### BI Engine Python (Development)

**Arquivo:** `bi-engine/.env`

```env
ENVIRONMENT=development
DATABASE_URL=postgresql://webadmin:******@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales
OPENAI_API_KEY=sk-proj-******
```

---

## 🚀 CONFIGURAÇÃO EM PRODUÇÃO

### No Servidor SaveInCloud (via SSH)

**Localização:** `/home/jelastic/ROOT/backend/.env`

```env
# ===== AMBIENTE =====
NODE_ENV=production

# ===== PORTA DO SERVIDOR =====
PORT=8080  # ⚠️ IMPORTANTE: SaveInCloud usa porta 8080 internamente

# ===== BANCO DE DADOS =====
MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_DATABASE=basesales
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******
MASTER_DB_SSL=false

# ===== APIs EXTERNAS =====
GEMINI_API_KEY=AIzaSy******
OPENAI_API_KEY=sk-proj-******
```

### Gerenciamento com PM2

```bash
# Iniciar aplicação
pm2 start server.js --name salesmasters-api --cwd /home/jelastic/ROOT/backend

# Verificar status
pm2 status

# Ver logs
pm2 logs salesmasters-api

# Reiniciar após mudança no .env
pm2 restart salesmasters-api
pm2 save
```

---

## 📊 ESTRUTURA DO BANCO

### Schemas
- **public** (principal)

### Principais Tabelas (57 no total)

#### 📦 Produtos
- `cad_prod` - Cadastro de produtos
- `cad_tabelaspre` - Tabelas de preços
- `categoria_prod` - Categorias
- `grupos` - Grupos de produtos
- `grupo_desc` - Grupo de descontos

#### 👥 Clientes e CRM
- `clientes` - Cadastro de clientes
- `cli_aniv` - Aniversariantes
- `cli_descpro` - Descontos por cliente
- `cli_ind` - Clientes por indústria
- `crm_agenda` - Agenda CRM
- `crm_alerta` - Alertas
- `crm_interacao` - Interações
- `crm_oportunidades` - Oportunidades de venda
- `crm_sellout` - Vendas realizadas

#### 🛍️ Pedidos e Vendas
- `pedidos` - Pedidos realizados
- `itens_ped` - Itens dos pedidos
- `vendedores` - Cadastro de vendedores
- `vend_metas` - Metas de vendedores
- `ind_metas` - Metas de indústrias

#### 💰 Financeiro
- `fin_clientes` - Clientes financeiro
- `fin_fornecedores` - Fornecedores financeiro
- `fin_contas_pagar` - Contas a pagar
- `fin_contas_receber` - Contas a receber
- `fin_parcelas_pagar` - Parcelas a pagar
- `fin_parcelas_receber` - Parcelas a receber
- `fin_movimentacoes` - Movimentações
- `fin_plano_contas` - Plano de contas
- `fin_centro_custo` - Centros de custo

#### 🏭 Indústrias e Fornecedores
- `indclientes` - Indústrias clientes
- `fornecedores` - Fornecedores
- `vendedor_ind` - Vendedores por indústria
- `descontos_ind` - Descontos por indústria

#### 🗺️ Geográfico
- `regioes` - Regiões de vendas
- `cidades` - Cidades
- `cidades_regioes` - Relação cidades-regiões
- `vendedor_reg` - Vendedores por região

#### ⚙️ Configurações
- `parametros` - Parâmetros do sistema
- `user_nomes` - Usuários
- `user_grupos` - Grupos de usuários
- `user_menu_superior` - Menu superior
- `empresa_status` - Status de empresas

#### 🚚 Logística
- `transportadora` - Transportadoras
- `forma_pagamento` - Formas de pagamento
- `bandeira` - Bandeiras de cartão

### Views Importantes

1. **vw_produtos_precos**
   - Produtos com preços calculados
   - Usado intensamente em listagens

2. **vw_itens_ped_fixed**
   - Itens de pedidos com correções
   - Usado em relatórios

3. **vw_metricas_cliente**
   - Métricas agregadas por cliente
   - Dashboard e Analytics

4. **vw_performance_mensal**
   - Performance mensal de vendas
   - Gráficos e KPIs

---

## 🧪 COMO TESTAR CONEXÃO

### Teste Rápido (Node.js)

Criamos um script de teste: `backend/test_cloud_connection.js`

```bash
# No terminal
cd backend
node test_cloud_connection.js
```

**Resultado Esperado:**
```
✅ CONEXÃO ESTABELECIDA COM SUCESSO!
⚡ Tempo de resposta: ~500ms
📊 Banco atual: basesales
👤 Usuário: webadmin
🗄️  Versão PostgreSQL: PostgreSQL 16.11
```

### Explorar Estrutura

```bash
# No terminal
cd backend
node explore_database.js
```

Isso mostrará:
- Todos os schemas
- Todas as tabelas
- Todas as views

### Teste Direto (psql)

Se você tiver o cliente PostgreSQL instalado:

```bash
psql -h node254557-salesmaster.sp1.br.saveincloud.net.br \
     -p 13062 \
     -U webadmin \
     -d basesales
```

Senha quando solicitado: `******`

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "ECONNREFUSED"

**Problema:** Não consegue conectar ao servidor

**Soluções:**
1. Verifique se a porta está correta (13062)
2. Confirme que não há firewall bloqueando
3. Teste conectividade: `ping node254557-salesmaster.sp1.br.saveincloud.net.br`

### ❌ Erro: "ENOTFOUND"

**Problema:** Hostname não encontrado (DNS)

**Soluções:**
1. Verifique se digitou o hostname corretamente
2. Teste DNS: `nslookup node254557-salesmaster.sp1.br.saveincloud.net.br`
3. Tente usar IP direto se DNS estiver com problema

### ❌ Erro: "28P01" (Authentication failed)

**Problema:** Usuário ou senha incorretos

**Soluções:**
1. Confirme usuário: `webadmin`
2. Confirme senha: `******`
3. Verifique se o .env está sendo carregado corretamente

### ❌ Erro: "42P01" (Relation does not exist)

**Problema:** Tabela não existe

**Soluções:**
1. Execute `explore_database.js` para ver tabelas disponíveis
2. Verifique se está no schema correto (public)
3. Confirme se a tabela foi criada/migrada

### ❌ Erro: "Connection timeout"

**Problema:** Conexão muito lenta ou servidor não responde

**Soluções:**
1. Verifique sua conexão com internet
2. Aumente `connectionTimeoutMillis` no pool
3. Entre em contato com suporte SaveInCloud

### ⚠️ Porta Diferente em Produção

**Observação Importante:**
- **Local (development):** Porta `3005`
- **Produção (SaveInCloud):** Porta `8080`

Certifique-se de que o `.env` em produção usa `PORT=8080`!

---

## 📞 SUPORTE

### SaveInCloud
- **Email:** suporte@saveincloud.com.br
- **Painel:** https://app.saveincloud.com.br
- **Documentação:** https://docs.saveincloud.com/

### SoftHam Sistemas
- **Ambiente:** salesmasters-app
- **Node ID:** 254557 (App) / 254909 (PostgreSQL)
- **Domínio:** salesmasters.softham.com.br

---

## 📝 HISTÓRICO DE ALTERAÇÕES

| Data | Alteração | Responsável |
|------|-----------|-------------|
| 07/01/2026 | Migração inicial para SaveInCloud | Antigravity AI |
| 08/01/2026 | Correção porta produção (8080) | Antigravity AI |
| 09/01/2026 | Documentação completa criada | Antigravity AI |

---

## ✅ CHECKLIST DE VERIFICAÇÃO

Use este checklist ao configurar um novo ambiente:

- [ ] `.env` criado com credenciais corretas
- [ ] Porta configurada (3005 local / 8080 produção)
- [ ] Teste de conexão executado com sucesso
- [ ] Estrutura do banco verificada
- [ ] PM2 configurado (apenas produção)
- [ ] Logs verificados sem erros
- [ ] Frontend consegue acessar API
- [ ] SSL configurado (apenas produção)

---

**🎉 Configuração Completa e Testada!**

*Documento criado por Antigravity AI - 09/01/2026*
