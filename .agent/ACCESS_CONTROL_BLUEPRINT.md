# 🔐 ACCESS CONTROL BLUEPRINT - SalesMasters

> **Documentação completa do sistema de controle de acessos para replicação em outros projetos**

---

## 📋 SUMÁRIO

1. [Arquitetura Geral](#arquitetura-geral)
2. [Multi-Tenancy](#multi-tenancy)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Fluxo de Autenticação](#fluxo-de-autenticação)
5. [Sistema de Permissões (ACL)](#sistema-de-permissões-acl)
6. [Controle de Sessões](#controle-de-sessões)
7. [API Endpoints](#api-endpoints)
8. [Frontend - Componentes](#frontend---componentes)
9. [Guia de Implementação](#guia-de-implementação)

---

## 🏗️ ARQUITETURA GERAL

O sistema utiliza uma arquitetura **Multi-Tenant** com dois níveis de banco de dados:

```
┌─────────────────────────────────────────────────────────┐
│                    MASTER DATABASE                       │
│  • empresas (tenants)                                   │
│  • usuarios (portal/cloud)                              │
│  • sessoes_ativas                                       │
│  • mensalidades                                         │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ TENANT A │   │ TENANT B │   │ TENANT C │
     │ Schema   │   │ Schema   │   │ Schema   │
     │ user_nomes│  │ user_nomes│  │ user_nomes│
     │ user_grupos│ │ user_grupos│ │ user_grupos│
     │ user_menu │  │ user_menu │  │ user_menu │
     └──────────┘   └──────────┘   └──────────┘
```

---

## 🏢 MULTI-TENANCY

### Modelo de Isolamento por Schema

Cada cliente (escola, empresa) possui seu próprio schema no banco de dados PostgreSQL.

**Benefícios:**
- Isolamento total de dados
- Backup independente por tenant
- Escalabilidade horizontal
- Customização por tenant

---

## 🗄️ ESTRUTURA DE BANCO DE DADOS

### 1. MASTER DATABASE - Tabela `empresas` (Tenants)

```sql
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,       -- Identificador principal
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    email_contato VARCHAR(150),
    telefone VARCHAR(20),
    
    -- Configurações da Licença
    status VARCHAR(20) DEFAULT 'ATIVO',     -- ATIVO, BLOQUEADO, DEGUSTAÇÃO, INADIMPLENTE
    data_adesao TIMESTAMP DEFAULT NOW(),
    data_vencimento DATE,
    valor_mensalidade DECIMAL(10,2),
    limite_usuarios INTEGER DEFAULT 1,
    limite_sessoes INTEGER DEFAULT 3,       -- Controle de sessões simultâneas
    bloqueio_ativo VARCHAR(1) DEFAULT 'N',  -- Bloquear múltiplas sessões?
    
    -- Dados de Conexão ao Tenant
    db_host VARCHAR(255),                   -- Ex: node123.saveincloud.net.br
    db_nome VARCHAR(100),                   -- Ex: basesales_empresa1
    db_schema VARCHAR(100) DEFAULT 'public',
    db_usuario VARCHAR(100),
    db_senha VARCHAR(255),
    db_porta INTEGER DEFAULT 5432,
    
    -- Controle de Versão
    versao_liberada VARCHAR(20) DEFAULT '1.0.0',
    obs TEXT
);

-- Índices
CREATE INDEX idx_empresas_cnpj ON empresas(cnpj);
```

### 2. MASTER DATABASE - Tabela `usuarios` (Portal Cloud)

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,     -- Login
    senha VARCHAR(255) NOT NULL,
    celular VARCHAR(20),
    e_admin BOOLEAN DEFAULT FALSE,          -- Admin da empresa
    ativo BOOLEAN DEFAULT TRUE,
    ultimo_login TIMESTAMP,
    data_criacao TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
```

### 3. MASTER DATABASE - Tabela `sessoes_ativas`

```sql
CREATE TABLE sessoes_ativas (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER REFERENCES empresas(id),
    usuario_id INTEGER,
    token_sessao VARCHAR(255) UNIQUE NOT NULL,
    tipo_usuario VARCHAR(20),               -- 'master' ou 'tenant'
    dispositivo VARCHAR(255),
    ip_origem VARCHAR(50),
    ativo BOOLEAN DEFAULT TRUE,
    ultima_atividade TIMESTAMP DEFAULT NOW(),
    data_inicio TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessoes_token ON sessoes_ativas(token_sessao);
CREATE INDEX idx_sessoes_empresa ON sessoes_ativas(empresa_id);
```

### 4. TENANT DATABASE - Tabela `user_nomes` (Usuários do Sistema)

```sql
CREATE TABLE IF NOT EXISTS user_nomes (
    codigo     SERIAL PRIMARY KEY,
    nome       VARCHAR(20) NOT NULL,
    sobrenome  VARCHAR(20) NOT NULL,
    senha      VARCHAR(20),
    usuario    VARCHAR(20),                  -- Login no sistema
    grupo      VARCHAR(4),                   -- Relaciona com user_grupos
    imagem     BYTEA,                        -- Foto do usuário
    master     BOOLEAN DEFAULT FALSE,        -- Superadmin
    gerencia   BOOLEAN DEFAULT FALSE,        -- Permissões de gerência
    ativo      BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_nomes_usuario ON user_nomes(usuario);
CREATE INDEX IF NOT EXISTS idx_user_nomes_grupo ON user_nomes(grupo);
```

### 5. TENANT DATABASE - Tabela `user_grupos` (Perfis de Acesso)

```sql
CREATE TABLE IF NOT EXISTS user_grupos (
    grupo      VARCHAR(4) PRIMARY KEY,       -- Ex: 'ADM', 'VEND', 'FIN'
    descricao  VARCHAR(20) NOT NULL          -- Ex: 'Administrador', 'Vendedor'
);
```

### 6. TENANT DATABASE - Tabela `user_menu_superior` (Matriz de Permissões)

```sql
CREATE TABLE IF NOT EXISTS user_menu_superior (
    id         SERIAL PRIMARY KEY,
    grupo      VARCHAR(4) NOT NULL,          -- Relaciona com user_grupos
    indice     INTEGER NOT NULL,             -- Código do menu/rotina
    descricao  VARCHAR(100),                 -- Nome do menu
    opcao      INTEGER,                      -- Código da opção
    invisivel  BOOLEAN DEFAULT FALSE,        -- Menu invisível para este grupo
    incluir    BOOLEAN DEFAULT TRUE,         -- Pode inserir registros
    modificar  BOOLEAN DEFAULT TRUE,         -- Pode editar registros
    excluir    BOOLEAN DEFAULT TRUE,         -- Pode deletar registros
    porsenha   BOOLEAN DEFAULT FALSE,        -- Requer senha para acessar
    
    UNIQUE(grupo, indice)
);

CREATE INDEX idx_user_menu_grupo ON user_menu_superior(grupo);
```

---

## 🔑 FLUXO DE AUTENTICAÇÃO

### Diagrama de Sequência

```
┌─────────┐       ┌──────────┐       ┌──────────┐       ┌──────────┐
│ Frontend│       │  Backend │       │  Master  │       │  Tenant  │
│         │       │   (API)  │       │    DB    │       │    DB    │
└────┬────┘       └────┬─────┘       └────┬─────┘       └────┬─────┘
     │                 │                  │                  │
     │ POST /login     │                  │                  │
     │ {cnpj, user,    │                  │                  │
     │  senha}         │                  │                  │
     │────────────────>│                  │                  │
     │                 │                  │                  │
     │                 │ 1. Buscar empresa│                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │                 │ empresa + config │                  │
     │                 │<─────────────────│                  │
     │                 │                  │                  │
     │                 │ 2. Verificar     │                  │
     │                 │    limite sessões│                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │                 │ 3. Validar       │                  │
     │                 │    usuário       │                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │                 │ [SE NÃO ENCONTRADO]:                │
     │                 │ 4. Fallback      │                  │
     │                 │    para Tenant   │                  │
     │                 │─────────────────────────────────────>│
     │                 │                  │                  │
     │                 │ 5. Registrar     │                  │
     │                 │    Sessão        │                  │
     │                 │─────────────────>│                  │
     │                 │                  │                  │
     │ {success, token,│                  │                  │
     │  user, config}  │                  │                  │
     │<────────────────│                  │                  │
     │                 │                  │                  │
```

### Código do Backend (Node.js/Express)

```javascript
// auth_master_endpoints.js

const express = require('express');
const router = express.Router();
const { masterPool, getTenantPool } = require('./utils/db');
const crypto = require('crypto');

router.post('/master-login', async (req, res) => {
    const { cnpj, nome, sobrenome, email, password } = req.body;
    const rawCnpj = cnpj ? cnpj.replace(/\D/g, '') : '';
    const userIdentifier = email || `${nome} ${sobrenome}`;

    if (!rawCnpj || !userIdentifier || !password) {
        return res.status(400).json({
            success: false,
            message: 'CNPJ, Identificação do Usuário e Senha são obrigatórios'
        });
    }

    try {
        // 1. BUSCAR EMPRESA NO MASTER
        const masterQuery = `
            SELECT id, cnpj, razao_social, status, db_host, db_nome, db_schema, 
                   db_usuario, db_senha, db_porta, 
                   COALESCE(limite_sessoes, 3) as limite_sessoes, 
                   COALESCE(bloqueio_ativo, 'N') as bloqueio_ativo
            FROM empresas WHERE cnpj = $1 AND status = 'ATIVO'
        `;
        const empresaResult = await masterPool.query(masterQuery, [rawCnpj]);
        
        if (empresaResult.rows.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'Empresa não encontrada ou inativa' 
            });
        }
        
        const empresa = empresaResult.rows[0];

        // 2. VERIFICAR LIMITE DE SESSÕES
        const SESSION_TIMEOUT_MINUTES = 15;
        const countQuery = `
            SELECT COUNT(*) as qtd FROM sessoes_ativas 
            WHERE empresa_id = $1 AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `;
        const countResult = await masterPool.query(countQuery, [empresa.id]);
        const activeSessions = parseInt(countResult.rows[0].qtd);

        if (empresa.bloqueio_ativo === 'S' && activeSessions >= empresa.limite_sessoes) {
            return res.status(403).json({
                success: false,
                message: `Limite de ${empresa.limite_sessoes} sessões atingido. Aguarde ou encerre outras sessões.`
            });
        }

        // 3. VALIDAR USUÁRIO NO MASTER
        let userQuery, userParams;
        if (email) {
            userQuery = `SELECT * FROM usuarios WHERE email = $1 AND empresa_id = $2 AND senha = $3 AND ativo = true`;
            userParams = [email, empresa.id, password];
        } else {
            userQuery = `SELECT * FROM usuarios WHERE nome = $1 AND sobrenome = $2 AND empresa_id = $3 AND senha = $4 AND ativo = true`;
            userParams = [nome, sobrenome, empresa.id, password];
        }

        const userResult = await masterPool.query(userQuery, userParams);

        // 4. FALLBACK PARA TENANT (user_nomes)
        if (userResult.rows.length === 0) {
            const dbConfig = {
                host: empresa.db_host,
                database: empresa.db_nome,
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta || 5432
            };
            
            const tenantPool = getTenantPool(dbConfig);
            const tenantQuery = `
                SELECT codigo as id, nome, sobrenome, grupo, master, gerencia 
                FROM user_nomes 
                WHERE UPPER(nome) = UPPER($1) 
                  AND UPPER(sobrenome) = UPPER($2) 
                  AND senha = $3
            `;
            const tenantResult = await tenantPool.query(tenantQuery, [nome, sobrenome, password]);
            
            if (tenantResult.rows.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Usuário ou senha inválidos' 
                });
            }
            
            // Login OK via Tenant
            const dbUser = tenantResult.rows[0];
            return res.json({
                success: true,
                message: 'Login realizado (Fallback Tenant)',
                user: {
                    id: dbUser.id,
                    nome: dbUser.nome,
                    sobrenome: dbUser.sobrenome,
                    role: dbUser.master ? 'admin' : 'user',
                    empresa: empresa.razao_social,
                    cnpj: empresa.cnpj
                },
                tenantConfig: { cnpj: empresa.cnpj, dbConfig }
            });
        }

        // 5. REGISTRAR SESSÃO ATIVA
        const sessionToken = crypto.randomBytes(32).toString('hex');
        const masterUser = userResult.rows[0];
        
        await masterPool.query(`
            INSERT INTO sessoes_ativas (empresa_id, usuario_id, token_sessao, tipo_usuario, ativo)
            VALUES ($1, $2, $3, $4, true)
        `, [empresa.id, masterUser.id, sessionToken, 'master']);

        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            token: sessionToken,
            user: {
                id: masterUser.id,
                nome: masterUser.nome,
                email: masterUser.email,
                role: masterUser.e_admin ? 'admin' : 'user',
                empresa: empresa.razao_social,
                cnpj: empresa.cnpj
            },
            tenantConfig: {
                host: empresa.db_host,
                database: empresa.db_nome,
                schema: empresa.db_schema || 'public',
                user: empresa.db_usuario,
                password: empresa.db_senha,
                port: empresa.db_porta || 5432
            }
        });

    } catch (error) {
        console.error('❌ [AUTH MASTER] Erro crítico no login:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao processar login.' });
    }
});

module.exports = router;
```

---

## 🛡️ SISTEMA DE PERMISSÕES (ACL)

### Conceito de Matriz de Permissões

Cada **grupo** possui uma matriz de permissões definindo:
- **Visibilidade** (`invisivel`): Se o menu aparece ou não
- **Inserir** (`incluir`): Pode criar novos registros
- **Modificar** (`modificar`): Pode editar registros
- **Excluir** (`excluir`): Pode deletar registros

### Estrutura de Menus (Índices)

```javascript
const defaultMenus = [
    // CADASTROS (Categoria)
    { idx: 10, label: 'CADASTROS', isParent: true },
    { idx: 100, label: 'Indústrias' },
    { idx: 101, label: 'Clientes' },
    { idx: 103, label: 'Vendedores' },
    { idx: 105, label: 'Produtos' },
    
    // MOVIMENTAÇÕES (Categoria)
    { idx: 20, label: 'MOVIMENTAÇÕES', isParent: true },
    { idx: 207, label: 'Pedidos de Venda' },
    { idx: 206, label: 'CRM / Atendimentos' },
    
    // FINANCEIRO (Categoria)
    { idx: 30, label: 'FINANCEIRO', isParent: true },
    { idx: 301, label: 'Contas a Receber' },
    { idx: 302, label: 'Contas a Pagar' },
    { idx: 303, label: 'Fluxo de Caixa' },
    
    // ESTATÍSTICOS (Categoria)
    { idx: 50, label: 'ESTATÍSTICOS', isParent: true },
    { idx: 501, label: 'Mapa de Vendas' },
    
    // UTILITÁRIOS (Categoria)
    { idx: 60, label: 'UTILITÁRIOS', isParent: true },
    { idx: 601, label: 'Usuários do sistema' },
    { idx: 611, label: 'Parâmetros' },
];
```

### Auto-Seed de Permissões

Quando um novo grupo é criado, as permissões são geradas automaticamente:

```javascript
router.get('/groups/:groupId/permissions', async (req, res) => {
    const { groupId } = req.params;
    
    let query = `
        SELECT opcao, grupo, indice, porsenha, invisivel, incluir, modificar, excluir, descricao
        FROM user_menu_superior WHERE grupo = $1 ORDER BY indice
    `;
    let result = await pool.query(query, [groupId]);

    // Auto-Seed se não houver permissões
    if (result.rows.length === 0) {
        console.log(`🌱 [SEED] Populando permissões padrão para: ${groupId}`);
        
        for (const menu of defaultMenus) {
            await pool.query(`
                INSERT INTO user_menu_superior 
                (grupo, indice, descricao, opcao, invisivel, incluir, modificar, excluir, porsenha)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            `, [
                groupId,
                menu.idx,
                menu.label.toUpperCase(),
                menu.idx,
                false,  // visível por padrão
                true,   // incluir
                true,   // modificar
                true,   // excluir
                false   // sem senha
            ]);
        }
        
        result = await pool.query(query, [groupId]);
    }

    res.json({ success: true, data: result.rows });
});
```

### Consulta de Permissões do Usuário Logado

```javascript
router.get('/my-permissions', async (req, res) => {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ success: false, message: 'ID do usuário não fornecido' });

    const userQuery = 'SELECT grupo, master, gerencia FROM user_nomes WHERE codigo = $1';
    const userResult = await pool.query(userQuery, [userId]);

    if (userResult.rows.length === 0) 
        return res.status(404).json({ success: false, message: 'Usuário não encontrado' });

    const user = userResult.rows[0];

    // Master tem acesso total
    if (user.master) {
        return res.json({ success: true, master: true, isGerencia: true });
    }

    // Buscar permissões do grupo
    const permQuery = `
        SELECT indice, invisivel, incluir, modificar, excluir 
        FROM user_menu_superior WHERE grupo = $1
    `;
    const permResult = await pool.query(permQuery, [user.grupo]);

    res.json({ 
        success: true, 
        master: false, 
        isGerencia: user.gerencia || false, 
        permissions: permResult.rows 
    });
});
```

---

## ⏱️ CONTROLE DE SESSÕES

### Heartbeat (Keep-Alive)

```javascript
// middleware/sessionMiddleware.js

const { touchSession } = require('../utils/session');

const activeSessionMiddleware = (req, res, next) => {
    let token = req.headers['x-session-token'];
    
    if (!token && req.headers['authorization']?.startsWith('Bearer ')) {
        token = req.headers['authorization'].split(' ')[1];
    }

    if (token) {
        touchSession(token); // Fire and forget
    }

    next();
};

module.exports = activeSessionMiddleware;
```

### Utilitários de Sessão

```javascript
// utils/session.js

const { masterPool } = require('./db');

async function touchSession(token) {
    if (!token) return;
    try {
        await masterPool.query(`
            UPDATE sessoes_ativas 
            SET ultima_atividade = NOW() 
            WHERE token_sessao = $1
        `, [token]);
    } catch (error) {
        console.error('⚠️ [SESSION] Erro ao atualizar heartbeat:', error.message);
    }
}

async function isValidSession(token) {
    if (!token) return false;
    const SESSION_TIMEOUT_MINUTES = 15;

    try {
        const result = await masterPool.query(`
            SELECT id FROM sessoes_ativas 
            WHERE token_sessao = $1 
              AND ativo = true
              AND ultima_atividade > NOW() - INTERVAL '${SESSION_TIMEOUT_MINUTES} minutes'
        `, [token]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('⚠️ [SESSION] Erro ao validar sessão:', error.message);
        return false;
    }
}

module.exports = { touchSession, isValidSession };
```

---

## 🌐 API ENDPOINTS

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/v2/auth/master-login` | Login principal |
| POST | `/api/v2/auth/logout` | Encerrar sessão |

### Grupos (Perfis de Acesso)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v2/system/groups` | Listar todos os grupos |
| POST | `/api/v2/system/groups` | Criar novo grupo |
| PUT | `/api/v2/system/groups/:id` | Atualizar grupo |
| DELETE | `/api/v2/system/groups/:id` | Excluir grupo |
| GET | `/api/v2/system/groups/:id/permissions` | Listar permissões do grupo |
| PUT | `/api/v2/system/groups/:id/permissions` | Atualizar permissões |

### Usuários

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/v2/system/users` | Listar todos os usuários |
| POST | `/api/v2/system/users` | Criar/Atualizar usuário |
| DELETE | `/api/v2/system/users/:id` | Excluir usuário |
| GET | `/api/v2/system/my-permissions` | Permissões do usuário logado |

---

## 💻 FRONTEND - COMPONENTES

### Página de Gestão de Usuários (React)

Componentes principais:
- `UserManagementPage.jsx` - Página principal
- `GroupModal` - Modal de criação/edição de grupos
- `UserModal` - Modal de criação/edição de usuários
- `PermissionToggle` - Toggle de permissões

### Uso de Permissões no Sidebar

```jsx
// Exemplo de verificação de permissões no frontend

const canAccessModule = (moduleIndex, permission = 'view') => {
    if (userPermissions.master) return true;
    
    const modulePerm = userPermissions.permissions?.find(p => p.indice === moduleIndex);
    if (!modulePerm) return false;
    
    switch (permission) {
        case 'view': return !modulePerm.invisivel;
        case 'insert': return modulePerm.incluir;
        case 'edit': return modulePerm.modificar;
        case 'delete': return modulePerm.excluir;
        default: return false;
    }
};

// Uso no componente
{canAccessModule(301) && <SidebarItem to="/financeiro/receber" label="Contas a Receber" />}
```

---

## 📚 GUIA DE IMPLEMENTAÇÃO

### Para o App de Controle Escolar

1. **Adaptar a tabela `empresas`:**
   - Renomear para `escolas` se preferir
   - Adicionar campos específicos: `tipo_escola`, `qtd_alunos_max`, etc.

2. **Adaptar os menus (`defaultMenus`):**
   ```javascript
   const defaultMenusEscola = [
       { idx: 10, label: 'CADASTROS', isParent: true },
       { idx: 100, label: 'Alunos' },
       { idx: 101, label: 'Professores' },
       { idx: 102, label: 'Turmas' },
       { idx: 103, label: 'Disciplinas' },
       
       { idx: 20, label: 'ACADÊMICO', isParent: true },
       { idx: 200, label: 'Notas' },
       { idx: 201, label: 'Frequência' },
       { idx: 202, label: 'Horários' },
       
       { idx: 30, label: 'FINANCEIRO', isParent: true },
       { idx: 300, label: 'Mensalidades' },
       { idx: 301, label: 'Boletos' },
       
       { idx: 60, label: 'CONFIGURAÇÕES', isParent: true },
       { idx: 601, label: 'Usuários' },
       { idx: 602, label: 'Parâmetros' },
   ];
   ```

3. **Criar grupos padrão:**
   - `ADM` - Administração
   - `PROF` - Professores
   - `SECR` - Secretaria
   - `RESP` - Responsáveis/Pais

4. **Reutilizar os arquivos:**
   - `auth_master_endpoints.js`
   - `user_management_endpoints.js`
   - `middleware/sessionMiddleware.js`
   - `utils/session.js`
   - `UserManagementPage.jsx`

---

## 📂 ARQUIVOS PARA COPIAR

```
backend/
├── auth_master_endpoints.js
├── user_management_endpoints.js
├── users_endpoints.js
├── middleware/
│   └── sessionMiddleware.js
├── utils/
│   ├── db.js
│   └── session.js

frontend/src/
├── components/
│   └── Login/
│       ├── Login.jsx
│       └── Login.css
├── pages/
│   └── utilitarios/
│       └── UserManagementPage.jsx

scripts_bancodedados/
├── 08_master_auth_schema.sql
├── criar_tabela_user_nomes.sql
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Criar banco de dados Master
- [ ] Criar tabela `empresas` (ou `escolas`)
- [ ] Criar tabela `usuarios`
- [ ] Criar tabela `sessoes_ativas`
- [ ] Criar tabelas tenant (`user_nomes`, `user_grupos`, `user_menu_superior`)
- [ ] Implementar endpoint `/master-login`
- [ ] Implementar CRUD de grupos
- [ ] Implementar CRUD de usuários
- [ ] Implementar sistema de permissões
- [ ] Implementar middleware de sessão
- [ ] Criar página de gestão de usuários (UI)
- [ ] Integrar verificação de permissões no sidebar

---

> **Última atualização:** Janeiro 2026
> **Versão:** 2.5.0-Enterprise
> **Autor:** SoftHam Development Team
