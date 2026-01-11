# 🏢 PLANO MULTI-TENANCY - SalesMasters

## Arquitetura: Schema por Empresa

**Data:** 09/01/2026  
**Versão:** 1.0  
**Total de Empresas:** 32

---

## 📊 VISÃO GERAL DA ARQUITETURA

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SAVEINCLOUD                                        │
│                                                                              │
│  ┌──────────────────────────┐    ┌────────────────────────────────────────┐ │
│  │   salesmasters_master    │    │              basesales                  │ │
│  │   (Controle Central)     │    │         (Dados Operacionais)            │ │
│  │                          │    │                                         │ │
│  │  • empresas (32)         │    │  ┌─────────┐ ┌─────────┐ ┌─────────┐   │ │
│  │  • usuarios              │───▶│  │ schema_ │ │ schema_ │ │ schema_ │   │ │
│  │  • mensalidades          │    │  │ 00001   │ │ 00002   │ │ 00003   │   │ │
│  │  • planos                │    │  │         │ │         │ │  ...    │   │ │
│  │                          │    │  │ TARGET  │ │ SOFTHAM │ │ EMP 3   │   │ │
│  └──────────────────────────┘    │  └─────────┘ └─────────┘ └─────────┘   │ │
│                                   │       ...até 32 schemas...             │ │
│                                   │                                         │ │
│                                   │  ┌─────────────────────────────────┐   │ │
│                                   │  │         schema_public           │   │ │
│                                   │  │  (Tabelas compartilhadas)       │   │ │
│                                   │  │  • configuracoes_globais        │   │ │
│                                   │  │  • tabelas_sistema              │   │ │
│                                   │  └─────────────────────────────────┘   │ │
│                                   └────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ ESTRUTURA DE SCHEMAS

### Nomenclatura dos Schemas

| Padrão | Exemplo | Descrição |
|--------|---------|-----------|
| `tenant_{ID}` | `tenant_00001` | ID sequencial da empresa |
| `emp_{CNPJ_LIMPO}` | `emp_33866124000103` | CNPJ sem pontuação |

**Recomendação:** Usar `tenant_{ID}` (mais curto e performático)

### Tabela `empresas` (no salesmasters_master)

```sql
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(20) UNIQUE NOT NULL,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    status VARCHAR(20) DEFAULT 'ATIVO',       -- ATIVO, BLOQUEADO, SUSPENSO, TRIAL
    plano_id INTEGER REFERENCES planos(id),
    
    -- Configuração do Schema (NOVO!)
    schema_name VARCHAR(50) NOT NULL,          -- ex: tenant_00001
    
    -- Configuração do Banco (mantido para compatibilidade)
    db_host VARCHAR(200) DEFAULT 'localhost',
    db_nome VARCHAR(100) DEFAULT 'basesales',
    db_usuario VARCHAR(100) DEFAULT 'webadmin',
    db_senha VARCHAR(200),
    db_porta INTEGER DEFAULT 5432,
    
    -- Metadados
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP,
    last_login_at TIMESTAMP
);
```

---

## 📋 TABELAS POR SCHEMA (Cada empresa terá)

Cada schema `tenant_XXXXX` conterá as seguintes tabelas:

### Cadastros Básicos
- `clientes` - Cadastro de clientes
- `cad_prod` - Cadastro de produtos
- `vendedores` - Cadastro de vendedores
- `fornecedores` - Cadastro de fornecedores
- `transportadora` - Cadastro de transportadoras
- `industrias` - Cadastro de indústrias
- `regioes` - Cadastro de regiões
- `area_atuacao` - Áreas de atuação

### Vendas
- `pedidos` - Cabeçalho dos pedidos
- `itens_ped` - Itens dos pedidos
- `cad_tabelaspre` - Tabelas de preço
- `cad_condicoes` - Condições de pagamento

### CRM
- `crm_agenda` - Agenda de atividades
- `crm_interacao` - Histórico de interações
- `crm_oportunidades` - Pipeline de vendas

### Financeiro
- `fin_contas_pagar` - Contas a pagar
- `fin_contas_receber` - Contas a receber
- `fin_movimentacoes` - Movimentações financeiras
- `fin_plano_contas` - Plano de contas
- `fin_centro_custo` - Centros de custo

### Configurações
- `parametros` - Parâmetros do sistema
- `user_nomes` - Usuários locais (fallback)
- `user_grupos` - Grupos de usuários

### Views
- `vw_pedidos_completos`
- `vw_clientes_ativos`
- `vw_produtos_precos`
- `vw_vendas_mensal`

---

## 🔧 SCRIPTS DE CRIAÇÃO

### 1. Criar um novo schema para empresa

```sql
-- Função para criar schema de nova empresa
CREATE OR REPLACE FUNCTION criar_schema_empresa(p_tenant_id INTEGER)
RETURNS TEXT AS $$
DECLARE
    v_schema_name TEXT;
BEGIN
    v_schema_name := 'tenant_' || LPAD(p_tenant_id::TEXT, 5, '0');
    
    -- Criar o schema
    EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || v_schema_name;
    
    -- Criar todas as tabelas no novo schema
    EXECUTE 'SET search_path TO ' || v_schema_name;
    
    -- Tabela clientes
    EXECUTE '
        CREATE TABLE IF NOT EXISTS ' || v_schema_name || '.clientes (
            codigo SERIAL PRIMARY KEY,
            razao_social VARCHAR(200),
            nome_fantasia VARCHAR(200),
            cnpj VARCHAR(20),
            ie VARCHAR(20),
            endereco VARCHAR(200),
            bairro VARCHAR(100),
            cidade VARCHAR(100),
            uf VARCHAR(2),
            cep VARCHAR(10),
            telefone VARCHAR(50),
            email VARCHAR(200),
            vendedor_id INTEGER,
            regiao_id INTEGER,
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ';
    
    -- Tabela produtos
    EXECUTE '
        CREATE TABLE IF NOT EXISTS ' || v_schema_name || '.cad_prod (
            codigo SERIAL PRIMARY KEY,
            descricao VARCHAR(200),
            referencia VARCHAR(50),
            unidade VARCHAR(10),
            grupo_id INTEGER,
            industria_id INTEGER,
            preco_custo NUMERIC(15,2),
            preco_venda NUMERIC(15,2),
            estoque NUMERIC(15,3),
            ativo BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ';
    
    -- Tabela pedidos
    EXECUTE '
        CREATE TABLE IF NOT EXISTS ' || v_schema_name || '.pedidos (
            id SERIAL PRIMARY KEY,
            numero INTEGER,
            data_pedido DATE,
            cliente_id INTEGER,
            vendedor_id INTEGER,
            condicao_id INTEGER,
            valor_total NUMERIC(15,2),
            status VARCHAR(20),
            observacoes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ';
    
    -- Tabela itens_ped
    EXECUTE '
        CREATE TABLE IF NOT EXISTS ' || v_schema_name || '.itens_ped (
            id SERIAL PRIMARY KEY,
            pedido_id INTEGER,
            produto_id INTEGER,
            quantidade NUMERIC(15,3),
            preco_unitario NUMERIC(15,2),
            desconto NUMERIC(5,2),
            valor_total NUMERIC(15,2)
        )
    ';
    
    -- ... adicionar outras tabelas conforme necessário
    
    RETURN v_schema_name;
END;
$$ LANGUAGE plpgsql;
```

### 2. Script para criar os 32 schemas

```sql
-- Criar schemas para todas as empresas cadastradas
DO $$
DECLARE
    emp RECORD;
    schema_name TEXT;
BEGIN
    FOR emp IN SELECT id, cnpj, razao_social FROM empresas ORDER BY id LOOP
        schema_name := 'tenant_' || LPAD(emp.id::TEXT, 5, '0');
        
        -- Criar schema
        EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || schema_name;
        
        -- Atualizar empresa com nome do schema
        UPDATE empresas SET schema_name = schema_name WHERE id = emp.id;
        
        RAISE NOTICE 'Schema % criado para empresa %', schema_name, emp.razao_social;
    END LOOP;
END $$;
```

---

## 🔄 MUDANÇAS NO CÓDIGO

### 1. Middleware de Contexto (dbContextMiddleware.js)

```javascript
// ANTES: Criava um pool separado por empresa
// DEPOIS: Usa o mesmo pool, mas muda o search_path

const setTenantSchema = async (pool, schemaName) => {
    const client = await pool.connect();
    try {
        await client.query(`SET search_path TO ${schemaName}, public`);
        return client;
    } catch (error) {
        client.release();
        throw error;
    }
};

// No middleware
const tenantMiddleware = async (req, res, next) => {
    const tenantConfig = req.headers['x-tenant-config'];
    
    if (tenantConfig) {
        const config = JSON.parse(tenantConfig);
        const schemaName = config.schemaName || 'public';
        
        // Definir o schema no pool
        req.tenantSchema = schemaName;
        req.db = await getTenantClient(pool, schemaName);
    }
    
    next();
};
```

### 2. Função getTenantPool (db.js)

```javascript
// ANTES
function getTenantPool(tenantKey, config) {
    // Criava pool separado por empresa
}

// DEPOIS
async function getTenantClient(schemaName) {
    const client = await masterDataPool.connect();
    await client.query(`SET search_path TO ${schemaName}, public`);
    return client;
}
```

### 3. Queries com Schema Explícito

```javascript
// ANTES
const result = await pool.query('SELECT * FROM clientes');

// DEPOIS (opção 1 - usando search_path)
await client.query(`SET search_path TO ${schemaName}`);
const result = await client.query('SELECT * FROM clientes');

// DEPOIS (opção 2 - schema explícito)
const result = await pool.query(`SELECT * FROM ${schemaName}.clientes`);
```

---

## 📊 FLUXO DE LOGIN ATUALIZADO

```
┌─────────────────┐
│  Tela de Login  │
│  CNPJ + Senha   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Buscar empresa em salesmasters_master.empresas          │
│     SELECT * FROM empresas WHERE cnpj = ?                   │
│                                                              │
│  2. Obter schema_name da empresa                            │
│     ex: tenant_00001                                         │
│                                                              │
│  3. Validar usuário em salesmasters_master.usuarios         │
│     OU fallback para basesales.{schema}.user_nomes          │
│                                                              │
│  4. Retornar tenantConfig com schemaName                    │
│     { schemaName: 'tenant_00001', ... }                     │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Frontend armazena schemaName no sessionStorage             │
│  Envia em todas as requisições: X-Tenant-Schema             │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend: SET search_path TO tenant_00001, public           │
│  Todas as queries usam automaticamente o schema correto     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 VANTAGENS DESTA ARQUITETURA

| Vantagem | Descrição |
|----------|-----------|
| **Isolamento de Dados** | Cada empresa só acessa seu próprio schema |
| **Backup Simplificado** | Pode fazer backup por schema |
| **Performance** | Um único pool de conexão para todos |
| **Manutenção** | Atualizações de estrutura mais simples |
| **Escalabilidade** | Fácil adicionar novas empresas |
| **Custo** | Menos recursos que bancos separados |

---

## 🚀 PLANO DE MIGRAÇÃO

### Fase 1: Preparação (1 semana)
- [ ] Criar função `criar_schema_empresa()`
- [ ] Criar script de migração de dados
- [ ] Atualizar tabela `empresas` com coluna `schema_name`
- [ ] Criar schemas para as 2 empresas existentes

### Fase 2: Código (2 semanas)
- [ ] Atualizar `db.js` para usar schemas
- [ ] Atualizar middleware de contexto
- [ ] Atualizar todos os endpoints para usar schema
- [ ] Testes unitários

### Fase 3: Migração de Dados (1 semana)
- [ ] Migrar dados de TARGET para `tenant_00001`
- [ ] Migrar dados de SOFTHAM para `tenant_00002`
- [ ] Validar integridade dos dados

### Fase 4: Onboarding (em andamento)
- [ ] Cadastrar novas empresas no painel admin
- [ ] Script automático cria schema
- [ ] Importar dados iniciais (clientes, produtos)

---

## 💰 MODELO DE COBRANÇA (Sugestão)

### Planos

| Plano | Usuários | Preço/Mês | Features |
|-------|----------|-----------|----------|
| **Starter** | 2 | R$ 99 | Dashboard, Pedidos, Clientes |
| **Professional** | 5 | R$ 199 | + CRM, Relatórios |
| **Enterprise** | 10 | R$ 399 | + BI, API, Suporte Premium |
| **Unlimited** | ∞ | R$ 599 | Tudo + Customizações |

### Tabela `planos` (no salesmasters_master)

```sql
CREATE TABLE planos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    max_usuarios INTEGER,
    preco_mensal NUMERIC(10,2),
    features JSONB,
    ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO planos (nome, max_usuarios, preco_mensal, features) VALUES
('Starter', 2, 99.00, '{"dashboard": true, "pedidos": true, "crm": false}'),
('Professional', 5, 199.00, '{"dashboard": true, "pedidos": true, "crm": true, "bi": false}'),
('Enterprise', 10, 399.00, '{"dashboard": true, "pedidos": true, "crm": true, "bi": true}'),
('Unlimited', 999, 599.00, '{"dashboard": true, "pedidos": true, "crm": true, "bi": true, "api": true}');
```

---

## 📝 PRÓXIMOS PASSOS

1. **Aprovar este plano**
2. **Criar scripts de migração**
3. **Implementar mudanças no código**
4. **Testar com empresas piloto**
5. **Rollout para todas as 32 empresas**

---

*Documento criado por Antigravity AI - 09/01/2026*
