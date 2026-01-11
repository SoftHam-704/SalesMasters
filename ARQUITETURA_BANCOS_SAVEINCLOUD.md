# 🔐 ARQUITETURA DE BANCOS DE DADOS - SAVEINCLOUD

## ⚠️ ATENÇÃO: LEIA ISTO ANTES DE QUALQUER ALTERAÇÃO! ⚠️

**Data:** 09/01/2026  
**Autor:** Antigravity AI  
**Status:** ✅ Documentado e Verificado

---

## 📊 ARQUITETURA MULTI-TENANT

O SalesMasters utiliza **DOIS bancos de dados** separados na SaveInCloud:

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SERVIDOR SAVEINCLOUD                             │
│       node254557-salesmaster.sp1.br.saveincloud.net.br:13062        │
│                                                                     │
│  ┌───────────────────────┐    ┌───────────────────────────────┐    │
│  │  salesmasters_master  │    │         basesales              │    │
│  │  (CONTROLE CENTRAL)   │    │    (DADOS OPERACIONAIS)        │    │
│  │                       │    │                                │    │
│  │  • empresas           │───▶│  • clientes                    │    │
│  │  • usuarios           │    │  • pedidos                     │    │
│  │  • mensalidades       │    │  • produtos                    │    │
│  │                       │    │  • vendedores                  │    │
│  │  Login e              │    │  • user_nomes (fallback)       │    │
│  │  Direcionamento       │    │  • etc...                      │    │
│  └───────────────────────┘    └───────────────────────────────┘    │
│           │                              ▲                          │
│           │         DIRECIONA            │                          │
│           └──────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🗄️ BANCO 1: `salesmasters_master`

### Função
**Controle central de todas as empresas licenciadas.** É o banco "mestre" que:
- Autentica usuários no login
- Direciona cada empresa para seu banco de dados específico
- Controla status de licenciamento (ativo, bloqueado, etc.)

### Tabelas

| Tabela | Descrição |
|--------|-----------|
| `empresas` | Cadastro de todas as empresas licenciadas |
| `usuarios` | Usuários autenticados centralmente |
| `mensalidades` | Controle de pagamentos |

### Estrutura da Tabela `empresas`

```sql
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ATIVO',  -- ATIVO, BLOQUEADO, SUSPENSO
    db_host VARCHAR(200),                 -- Host do banco do cliente
    db_nome VARCHAR(100),                 -- Nome do banco
    db_usuario VARCHAR(100),              -- Usuário do banco
    db_senha VARCHAR(200),                -- Senha do banco
    db_porta INTEGER DEFAULT 5432,        -- Porta
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Empresas Cadastradas (09/01/2026)

| ID | Razão Social | CNPJ | Banco |
|----|-------------|------|-------|
| 3 | SOFTHAM SISTEMAS | 00.000.000/0001-91 | basesales |
| 4 | TARGET REPRESENTACOES LTDA | 33.866.124/0001-03 | basesales |

---

## 🗄️ BANCO 2: `basesales`

### Função
**Armazena todos os dados operacionais** de cada empresa:
- Clientes, Produtos, Pedidos
- Vendedores, Regiões, Indústrias
- CRM, Financeiro, etc.

### Tabelas Principais

| Categoria | Tabelas |
|-----------|---------|
| **Cadastros** | clientes, cad_prod, vendedores, fornecedores, transportadora |
| **Vendas** | pedidos, itens_ped, cad_tabelaspre |
| **CRM** | crm_agenda, crm_interacao, crm_oportunidades |
| **Financeiro** | fin_contas_pagar, fin_contas_receber, fin_movimentacoes |
| **Config** | parametros, user_nomes, user_grupos |

---

## 🔐 FLUXO DE LOGIN

```
┌─────────────────┐
│  Tela de Login  │
│  (Frontend)     │
└────────┬────────┘
         │ POST /api/auth/master-login
         │ { cnpj, nome, sobrenome, password }
         ▼
┌─────────────────────────────────────────────────────────────┐
│                      BACKEND (Node.js)                       │
│                                                              │
│  1. Conecta em salesmasters_master (masterPool)             │
│  2. Busca empresa pelo CNPJ na tabela 'empresas'            │
│  3. Verifica se status = 'ATIVO'                            │
│  4. Tenta autenticar em 'usuarios' (novo sistema)           │
│  5. Se falhar, faz FALLBACK para 'user_nomes' no tenant     │
│  6. Retorna: user + tenantConfig (dbConfig do cliente)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
         │
         │ Sucesso: sessionStorage.setItem('tenantConfig')
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   APLICAÇÃO (Dashboard)                      │
│                                                              │
│  Todas as requisições API incluem header:                   │
│  x-tenant-db-config: { host, database, user, password }     │
│                                                              │
│  O middleware dbContextMiddleware usa essas infos para      │
│  conectar ao banco correto da empresa                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ CONFIGURAÇÃO DO `.env`

### Backend Local (Development)

```env
# ===== BANCO MASTER (Controle Central) =====
# O Master SEMPRE fica na nuvem!
MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******
# ⚠️ NÃO COLOCAR MASTER_DB_DATABASE! 
# O db.js já sabe que é 'salesmasters_master'

# ===== CONEXÃO PADRÃO (para scripts standalone) =====
DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
DB_PORT=13062
DB_NAME=basesales
DB_USER=webadmin
DB_PASSWORD=******

# ===== SERVIDOR =====
PORT=3005  # Local usa 3005
```

### Servidor Produção (SaveInCloud)

```env
NODE_ENV=production
PORT=8080  # ⚠️ SaveInCloud EXIGE porta 8080!

MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******
```

---

## 🔍 CÓDIGO CHAVE: `backend/utils/db.js`

```javascript
// Pool dedicado ao banco MASTER (Central de Controle - NUVEM)
// O Master SEMPRE fica na nuvem para que todos os clientes possam acessar
const masterPool = new Pool({
    host: process.env.MASTER_DB_HOST || 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    port: process.env.MASTER_DB_PORT || 13062,
    database: 'salesmasters_master',  // ⬅️ HARDCODED! Nunca mudar!
    user: process.env.MASTER_DB_USER || 'webadmin',
    password: process.env.MASTER_DB_PASSWORD || '******'
});
```

---

## 📋 CREDENCIAIS DE ACESSO

### Banco Master (`salesmasters_master`)

```
Host:     node254557-salesmaster.sp1.br.saveincloud.net.br
Porta:    13062
Database: salesmasters_master
User:     webadmin
Password: ******
```

### Banco Operacional (`basesales`)

```
Host:     node254557-salesmaster.sp1.br.saveincloud.net.br
Porta:    13062
Database: basesales
User:     webadmin
Password: ******
```

---

## ⚠️ ERROS COMUNS

### ❌ "Empresa não encontrada"
**Causa:** Procurando `empresas` no banco errado (`basesales` ao invés de `salesmasters_master`)

**Solução:** Verificar se `masterPool` está conectando em `salesmasters_master`

### ❌ "Credenciais inválidas" 
**Causa:** Usuário não existe em `usuarios` (master) nem em `user_nomes` (tenant)

**Solução:** Verificar ambas as tabelas

### ❌ "Tabela empresas não existe"
**Causa:** Conectou no banco errado!

**Solução:** O banco `basesales` NÃO TEM tabela empresas! Conectar em `salesmasters_master`

---

## 🧪 SCRIPTS DE VERIFICAÇÃO

```bash
# Verificar banco master
node backend/verificar_master.js

# Verificar login completo
node backend/verificar_login.js

# Simular login
node backend/teste_login_simulado.js

# Listar usuários
node backend/listar_usuarios.js
```

---

## 📝 RESUMO FINAL

| Item | Valor |
|------|-------|
| **Servidor** | node254557-salesmaster.sp1.br.saveincloud.net.br |
| **Porta** | 13062 |
| **Banco Master** | `salesmasters_master` (login, empresas) |
| **Banco Dados** | `basesales` (clientes, pedidos, etc) |
| **Porta App Local** | 3005 |
| **Porta App Produção** | 8080 ⚠️ |

---

**🔒 NUNCA ESQUEÇA:**
1. Login usa `salesmasters_master`
2. Dados usam `basesales`
3. Produção usa porta `8080`
4. O `masterPool` em `db.js` tem o database HARDCODED

---

*Documentação criada por Antigravity AI - 09/01/2026*
*Atualizar sempre que houver mudanças na arquitetura!*
