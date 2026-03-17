# 📋 Documentação Técnica — Módulo WhatsApp + IA

**Projeto:** CRM-Rep (SalesMasters)
**Módulo:** Automação WhatsApp com Inteligência Artificial — Nível 3
**Versão:** 1.0.0 | Fevereiro 2026
**Stack:** Node.js 20+ · Express · PostgreSQL 15+ · Redis 7+ · BullMQ · Evolution API · OpenAI GPT-4o-mini

---

## Índice

1. [Visão Geral e Arquitetura](#1-visão-geral-e-arquitetura)
2. [Pré-requisitos e Ambiente](#2-pré-requisitos-e-ambiente)
3. [Estrutura do Projeto](#3-estrutura-do-projeto)
4. [Infraestrutura — Docker Compose](#4-infraestrutura--docker-compose)
5. [Variáveis de Ambiente](#5-variáveis-de-ambiente)
6. [Banco de Dados — Migrations](#6-banco-de-dados--migrations)
7. [Evolution API — Configuração e Conexão](#7-evolution-api--configuração-e-conexão)
8. [Webhook Receiver](#8-webhook-receiver)
9. [Orquestrador — Motor de Decisão](#9-orquestrador--motor-de-decisão)
10. [Agente IA — OpenAI Service](#10-agente-ia--openai-service)
11. [Sistema de Prompts](#11-sistema-de-prompts)
12. [Qualificação de Leads](#12-qualificação-de-leads)
13. [Bridge CRM — Integração com Pedidos/Projetos](#13-bridge-crm--integração-com-pedidosprojetos)
14. [Sistema de Filas — BullMQ Workers](#14-sistema-de-filas--bullmq-workers)
15. [Follow-up Automático](#15-follow-up-automático)
16. [Campanhas em Massa](#16-campanhas-em-massa)
17. [API REST — Endpoints do Painel](#17-api-rest--endpoints-do-painel)
18. [Notificações em Tempo Real](#18-notificações-em-tempo-real)
19. [Segurança, LGPD e Rate Limiting](#19-segurança-lgpd-e-rate-limiting)
20. [Testes — Cenários e Validação](#20-testes--cenários-e-validação)
21. [Deploy e Checklist de Go-Live](#21-deploy-e-checklist-de-go-live)
22. [Troubleshooting](#22-troubleshooting)

---

## 1. Visão Geral e Arquitetura

### 1.1 O que este módulo faz

O módulo WhatsApp + IA é um subsistema do CRM-Rep que:

1. **Recebe** mensagens de WhatsApp via Evolution API (open-source, Docker)
2. **Processa** cada mensagem de forma assíncrona via fila BullMQ
3. **Decide** se a IA responde ou se um humano já está atendendo
4. **Qualifica** o lead automaticamente via GPT-4o-mini (coleta tipo de projeto, dimensões, cidade, prazo)
5. **Cria** cliente + projeto no CRM automaticamente quando o lead é qualificado
6. **Notifica** o representante com resumo completo do lead
7. **Permite** takeover humano a qualquer momento (o representante assume a conversa)
8. **Envia** follow-ups automáticos para leads que pararam de responder
9. **Executa** campanhas de aniversário e reativação

### 1.2 Diagrama de Arquitetura

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│   WHATSAPP                SERVIDOR (VPS/Cloud)                           │
│                                                                          │
│  ┌─────────┐     ┌─────────────────────────────────────────────────┐    │
│  │  Lead   │────►│  ┌──────────────┐     ┌───────────────────┐    │    │
│  │  envia  │     │  │ Evolution API│────►│  Webhook Receiver  │    │    │
│  │  msg    │     │  │ :8080        │     │  POST /webhook/msg │    │    │
│  │         │     │  └──────────────┘     └────────┬──────────┘    │    │
│  │         │     │                                │               │    │
│  │         │     │                    ┌───────────▼────────────┐  │    │
│  │         │     │                    │    ORQUESTRADOR        │  │    │
│  │         │     │                    │                        │  │    │
│  │         │     │                    │  1. Identifica contato │  │    │
│  │         │     │                    │  2. Carrega contexto   │  │    │
│  │         │     │                    │  3. Verifica estado    │  │    │
│  │         │     │                    │  4. Decide rota:       │  │    │
│  │         │     │                    │     ├─ IA responde     │  │    │
│  │         │     │                    │     ├─ Humano assume   │  │    │
│  │         │     │                    │     └─ Ação no CRM     │  │    │
│  │         │     │                    └──┬────────┬────────┬──┘  │    │
│  │         │     │                       │        │        │     │    │
│  │         │     │              ┌────────▼──┐ ┌───▼────┐ ┌─▼───┐│    │
│  │  recebe │◄────│──────────────│  OpenAI   │ │ BullMQ │ │ CRM ││    │
│  │  resp.  │     │              │  GPT API  │ │ +Redis │ │ DB  ││    │
│  └─────────┘     │              └───────────┘ └────────┘ └─────┘│    │
│                  └─────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Fluxo de dados principal

```
MSG WhatsApp → Evolution API (webhook) → Express (valida + deduplica)
  → BullMQ Queue → Worker processa:
    → Identifica/cria contato
    → Busca/cria conversa ativa
    → Salva mensagem no DB
    → Decide rota (IA ou humano)
    → Se IA: monta contexto → chama GPT → extrai dados → salva resposta
    → Se qualificou: cria cliente + projeto no CRM → notifica representante
    → Envia resposta via Evolution API
```

### 1.4 Componentes e portas

| Componente | Tecnologia | Porta | Responsabilidade |
|---|---|---|---|
| Evolution API | Docker | 8080 | Conexão WhatsApp, envio/recebimento |
| Orquestrador | Node.js/Express | 3000 | Roteamento, lógica de negócio |
| OpenAI GPT | API Cloud | — | Conversação, qualificação, extração |
| BullMQ + Redis | Docker | 6379 | Filas assíncronas, retry, rate limiting |
| PostgreSQL | Docker/Host | 5432 | Dados: conversas, mensagens, leads, CRM |
| Socket.IO | Node.js | 3000 | Notificações real-time para o painel |

---

## 2. Pré-requisitos e Ambiente

### 2.1 Software necessário

```bash
# Node.js 20+ (LTS)
node --version   # v20.x.x ou superior

# npm ou yarn
npm --version    # 10.x.x

# Docker e Docker Compose
docker --version          # 24.x ou superior
docker compose version    # v2.x

# PostgreSQL 15+ (pode ser Docker ou host)
psql --version   # 15.x ou superior

# Git
git --version
```

### 2.2 Contas e API Keys necessárias

| Serviço | O que precisa | Onde obter |
|---|---|---|
| OpenAI | API Key + créditos | https://platform.openai.com/api-keys |
| WhatsApp | Número dedicado para o bot | Chip separado (não usar pessoal) |
| VPS/Cloud | Servidor com IP fixo | Hetzner, DigitalOcean, Contabo |

### 2.3 Requisitos mínimos do servidor

```
CPU:    2 vCPU
RAM:    4 GB (mínimo) — 8 GB recomendado
Disco:  40 GB SSD
SO:     Ubuntu 22.04+ ou Debian 12+
Rede:   IP fixo, portas 80/443/8080 abertas
SSL:    Certificado (Let's Encrypt via Nginx/Caddy)
```

---

## 3. Estrutura do Projeto

```
crm-rep/
├── docker-compose.yml                    # Evolution API + Redis
├── .env                                  # Variáveis de ambiente
├── .env.example                          # Template das variáveis
├── package.json
│
├── src/
│   ├── app.js                            # Express setup principal
│   ├── server.js                         # Entry point
│   │
│   ├── config/
│   │   ├── database.js                   # Pool PostgreSQL
│   │   ├── redis.js                      # Conexão Redis
│   │   ├── evolution.config.js           # Config Evolution API
│   │   └── openai.config.js              # Config OpenAI
│   │
│   ├── whatsapp/
│   │   ├── routes/
│   │   │   ├── webhook.routes.js         # POST /webhook/evolution
│   │   │   ├── conversa.routes.js        # CRUD conversas (painel)
│   │   │   ├── mensagem.routes.js        # Envio de msgs (painel)
│   │   │   ├── contato.routes.js         # CRUD contatos
│   │   │   ├── template.routes.js        # CRUD templates
│   │   │   ├── campanha.routes.js        # CRUD campanhas
│   │   │   └── dashboard.routes.js       # Métricas e dashboard
│   │   │
│   │   ├── controllers/
│   │   │   ├── webhook.controller.js     # Recebe eventos Evolution
│   │   │   ├── conversa.controller.js    # Listar, assumir, devolver
│   │   │   ├── mensagem.controller.js    # Enviar texto/template
│   │   │   ├── contato.controller.js     # Listar, vincular cliente
│   │   │   ├── template.controller.js    # Gerenciar templates
│   │   │   ├── campanha.controller.js    # Gerenciar campanhas
│   │   │   └── dashboard.controller.js   # Métricas agregadas
│   │   │
│   │   ├── services/
│   │   │   ├── orchestrator.service.js   # ★ CÉREBRO — decide rota
│   │   │   ├── evolution.service.js      # Wrapper Evolution API
│   │   │   ├── openai.service.js         # Wrapper OpenAI + parsing
│   │   │   ├── conversation.service.js   # CRUD conversas + estado
│   │   │   ├── contact.service.js        # CRUD contatos WhatsApp
│   │   │   ├── message.service.js        # CRUD mensagens
│   │   │   ├── qualification.service.js  # Scoring e classificação
│   │   │   ├── crm-bridge.service.js     # Cria cliente/projeto no CRM
│   │   │   ├── notification.service.js   # Socket.IO + push notifications
│   │   │   └── template.service.js       # Renderização de templates
│   │   │
│   │   ├── workers/
│   │   │   ├── message.worker.js         # Fila: processar msgs recebidas
│   │   │   ├── send.worker.js            # Fila: enviar msgs via Evolution
│   │   │   ├── followup.worker.js        # Cron: follow-ups automáticos
│   │   │   └── campaign.worker.js        # Fila: envio de campanhas
│   │   │
│   │   ├── prompts/
│   │   │   ├── system.prompt.js          # Persona do agente IA
│   │   │   ├── qualification.prompt.js   # Instruções de extração
│   │   │   ├── summary.prompt.js         # Geração de resumo
│   │   │   └── templates.js              # Templates de msg pré-definidas
│   │   │
│   │   └── middleware/
│   │       ├── webhook-auth.middleware.js # Valida webhook Evolution
│   │       └── tenant.middleware.js       # Identifica tenant
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # JWT authentication
│   │   │   └── error-handler.middleware.js
│   │   └── utils/
│   │       ├── phone.utils.js            # Formatação de telefone
│   │       ├── logger.js                 # Winston logger
│   │       └── date.utils.js             # Helpers de data BR
│   │
│   └── migrations/
│       ├── 001_create_wpp_contato.sql
│       ├── 002_create_wpp_conversa.sql
│       ├── 003_create_wpp_mensagem.sql
│       ├── 004_create_wpp_template.sql
│       ├── 005_create_wpp_campanha.sql
│       ├── 006_create_wpp_campanha_envio.sql
│       ├── 007_seed_templates.sql
│       └── 008_alter_pedido_projeto.sql
│
├── tests/
│   ├── orchestrator.test.js
│   ├── qualification.test.js
│   ├── webhook.test.js
│   └── scenarios/
│       ├── lead-novo-qualifica.json
│       ├── lead-retorna.json
│       └── takeover-humano.json
│
└── docs/
    └── DOC_TECNICA_WHATSAPP_IA.md        # ← Este documento
```

---

## 4. Infraestrutura — Docker Compose

### 4.1 Arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ═══════════════════════════════════════════
  # EVOLUTION API — Conexão com WhatsApp
  # ═══════════════════════════════════════════
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # ── Autenticação ──
      - AUTHENTICATION_API_KEY=${EVOLUTION_API_KEY}
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true

      # ── Servidor ──
      - SERVER_URL=${EVOLUTION_SERVER_URL}
      - SERVER_PORT=8080

      # ── Webhook global ──
      - WEBHOOK_GLOBAL_URL=http://crm-app:3000/webhook/evolution
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

      # ── Eventos que queremos receber ──
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_MESSAGES_UPDATE=true
      - WEBHOOK_EVENTS_CONTACTS_UPSERT=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true

      # ── Database (PostgreSQL) ──
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://${DB_USER}:${DB_PASS}@postgres:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_DATA_CONTACTS=true

      # ── Redis ──
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379/0

      # ── Sessão ──
      - CONFIG_SESSION_PHONE_CLIENT=CRM-Rep
      - CONFIG_SESSION_PHONE_NAME=Chrome

    volumes:
      - evolution_data:/evolution/instances
    networks:
      - crm_network
    depends_on:
      - redis
      - postgres

  # ═══════════════════════════════════════════
  # REDIS — Filas BullMQ + Cache Evolution
  # ═══════════════════════════════════════════
  redis:
    image: redis:7-alpine
    container_name: redis
    restart: always
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    networks:
      - crm_network

  # ═══════════════════════════════════════════
  # POSTGRESQL — Banco do CRM + WhatsApp
  # ═══════════════════════════════════════════
  postgres:
    image: postgres:15-alpine
    container_name: postgres
    restart: always
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASS}
      - POSTGRES_DB=${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - crm_network

  # ═══════════════════════════════════════════
  # APLICAÇÃO NODE.JS — CRM + WhatsApp Module
  # ═══════════════════════════════════════════
  crm-app:
    build: .
    container_name: crm_app
    restart: always
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - postgres
      - redis
    networks:
      - crm_network

volumes:
  evolution_data:
  redis_data:
  postgres_data:

networks:
  crm_network:
    driver: bridge
```

### 4.2 Dockerfile (aplicação Node.js)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY src/ ./src/

EXPOSE 3000

CMD ["node", "src/server.js"]
```

### 4.3 Comandos de inicialização

```bash
# 1. Clonar repositório
git clone <repo-url> crm-rep && cd crm-rep

# 2. Copiar e configurar variáveis
cp .env.example .env
nano .env  # preencher todas as variáveis

# 3. Subir infraestrutura
docker compose up -d postgres redis evolution-api

# 4. Aguardar PostgreSQL inicializar
sleep 10

# 5. Rodar migrations
for f in src/migrations/*.sql; do
  echo "Running $f..."
  PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -f "$f"
done

# 6. Instalar dependências e subir app
npm install
npm start

# 7. (Produção) Subir tudo via Docker
docker compose up -d --build
```

---

## 5. Variáveis de Ambiente

### 5.1 Arquivo `.env.example`

```bash
# ═══════════════════════════════════════════
# APLICAÇÃO
# ═══════════════════════════════════════════
NODE_ENV=production
PORT=3000
APP_NAME=CRM-Rep
JWT_SECRET=sua_chave_jwt_super_secreta_aqui

# ═══════════════════════════════════════════
# BANCO DE DADOS (PostgreSQL)
# ═══════════════════════════════════════════
DB_HOST=localhost
DB_PORT=5432
DB_USER=crmrep
DB_PASS=senha_segura_aqui
DB_NAME=crm_rep

# Pool de conexões
DB_POOL_MIN=2
DB_POOL_MAX=10

# ═══════════════════════════════════════════
# REDIS
# ═══════════════════════════════════════════
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ═══════════════════════════════════════════
# EVOLUTION API (WhatsApp)
# ═══════════════════════════════════════════
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=chave_api_evolution_aqui
EVOLUTION_SERVER_URL=https://evo.seudominio.com.br
EVOLUTION_INSTANCE_NAME=crm-rep-principal
EVOLUTION_WEBHOOK_SECRET=segredo_webhook_aqui

# ═══════════════════════════════════════════
# OPENAI
# ═══════════════════════════════════════════
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=500
OPENAI_TEMPERATURE=0.7

# ═══════════════════════════════════════════
# QUALIFICAÇÃO
# ═══════════════════════════════════════════
QUALIFICATION_THRESHOLD=70
QUALIFICATION_HOT_THRESHOLD=85

# ═══════════════════════════════════════════
# FOLLOW-UP (em horas)
# ═══════════════════════════════════════════
FOLLOWUP_FIRST_HOURS=72
FOLLOWUP_SECOND_HOURS=168
FOLLOWUP_CLOSE_HOURS=336

# ═══════════════════════════════════════════
# RATE LIMITING
# ═══════════════════════════════════════════
RATE_LIMIT_MESSAGES_PER_MINUTE=30
RATE_LIMIT_CAMPAIGNS_PER_MINUTE=20

# ═══════════════════════════════════════════
# REPRESENTANTE (config do tenant)
# ═══════════════════════════════════════════
DEFAULT_TENANT_ID=1
REPRESENTANTE_NOME=Nome do Representante
INDUSTRIA_NOME=Bertolini
```

---

## 6. Banco de Dados — Migrations

> **IMPORTANTE:** Estas migrations devem ser executadas APÓS as tabelas base do CRM (tenant, cliente, usuario, pedido) já existirem.

### 6.1 Migration 001 — `wpp_contato`

```sql
-- ============================================================
-- 001_create_wpp_contato.sql
-- Contatos de WhatsApp (leads e clientes)
-- ============================================================

CREATE TABLE IF NOT EXISTS wpp_contato (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenant(id),
  telefone        VARCHAR(20) NOT NULL,
  nome_push       VARCHAR(200),
  nome_informado  VARCHAR(200),
  email           VARCHAR(200),
  empresa         VARCHAR(200),
  cidade          VARCHAR(200),
  uf              CHAR(2),

  -- Vínculo CRM
  cliente_id      INT REFERENCES cliente(id) ON DELETE SET NULL,
  is_cliente      BOOLEAN NOT NULL DEFAULT FALSE,

  -- Metadata
  foto_url        TEXT,
  origem          VARCHAR(50),
  tags            TEXT[],

  -- LGPD
  aceita_msgs     BOOLEAN NOT NULL DEFAULT TRUE,
  optout_at       TIMESTAMPTZ,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, telefone)
);

CREATE INDEX idx_wpp_contato_telefone ON wpp_contato(telefone);
CREATE INDEX idx_wpp_contato_cliente ON wpp_contato(cliente_id)
  WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_wpp_contato_tenant ON wpp_contato(tenant_id, is_cliente);
```

### 6.2 Migration 002 — `wpp_conversa`

```sql
-- ============================================================
-- 002_create_wpp_conversa.sql
-- Conversas (threads) — cada sessão com um contato
-- ============================================================

CREATE TYPE wpp_conversa_estado AS ENUM (
  'nova',
  'ia_ativa',
  'ia_qualificou',
  'aguardando_humano',
  'humano_ativo',
  'transferida',
  'em_andamento',
  'convertida',
  'perdida',
  'encerrada'
);

CREATE TYPE wpp_conversa_origem AS ENUM (
  'inbound',
  'campanha',
  'followup',
  'manual'
);

CREATE TABLE IF NOT EXISTS wpp_conversa (
  id                    SERIAL PRIMARY KEY,
  tenant_id             INT NOT NULL REFERENCES tenant(id),
  contato_id            INT NOT NULL REFERENCES wpp_contato(id) ON DELETE CASCADE,

  -- Estado da conversa
  estado                wpp_conversa_estado NOT NULL DEFAULT 'nova',
  origem                wpp_conversa_origem NOT NULL DEFAULT 'inbound',

  -- Qualificação (JSONB preenchido progressivamente pela IA)
  dados_qualificacao    JSONB,
  /*
    Estrutura esperada:
    {
      "nome": "João da Silva",
      "tipo_projeto": "galpão",
      "dimensao": "20x40m",
      "area_m2": 800,
      "uso_finalidade": "armazém de grãos",
      "cidade": "Uberlândia",
      "uf": "MG",
      "prazo": "3 meses",
      "tipo_construcao": "novo",
      "orcamento_estimado": null,
      "observacoes": "Tem terreno próprio",
      "score": 85,
      "classificacao": "hot",
      "qualificado": true
    }
  */

  -- Resumo IA (gerado ao qualificar)
  resumo_ia             TEXT,

  -- Atendimento humano
  user_id               INT REFERENCES usuario(id),
  assumida_em           TIMESTAMPTZ,

  -- Vínculo CRM
  pedido_id             INT REFERENCES pedido(id) ON DELETE SET NULL,

  -- Métricas
  total_msgs_lead       INT NOT NULL DEFAULT 0,
  total_msgs_ia         INT NOT NULL DEFAULT 0,
  total_msgs_humano     INT NOT NULL DEFAULT 0,
  tempo_primeira_resp_seg INT,
  tokens_consumidos     INT NOT NULL DEFAULT 0,

  -- Timestamps
  primeira_msg_at       TIMESTAMPTZ,
  ultima_msg_at         TIMESTAMPTZ,
  qualificada_at        TIMESTAMPTZ,
  convertida_at         TIMESTAMPTZ,
  encerrada_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wpp_conversa_contato ON wpp_conversa(contato_id);
CREATE INDEX idx_wpp_conversa_estado ON wpp_conversa(tenant_id, estado);
CREATE INDEX idx_wpp_conversa_user ON wpp_conversa(user_id)
  WHERE user_id IS NOT NULL;
CREATE INDEX idx_wpp_conversa_pedido ON wpp_conversa(pedido_id)
  WHERE pedido_id IS NOT NULL;
CREATE INDEX idx_wpp_conversa_ativa ON wpp_conversa(tenant_id, estado, ultima_msg_at)
  WHERE estado NOT IN ('convertida', 'perdida', 'encerrada');
```

### 6.3 Migration 003 — `wpp_mensagem`

```sql
-- ============================================================
-- 003_create_wpp_mensagem.sql
-- Mensagens individuais dentro de cada conversa
-- ============================================================

CREATE TYPE wpp_msg_direcao AS ENUM ('inbound', 'outbound');

CREATE TYPE wpp_msg_tipo AS ENUM (
  'texto', 'imagem', 'audio', 'video',
  'documento', 'localizacao', 'contato', 'sticker'
);

CREATE TYPE wpp_msg_remetente AS ENUM ('lead', 'ia', 'humano', 'sistema');

CREATE TYPE wpp_msg_status AS ENUM (
  'recebida', 'processando', 'enviada',
  'entregue', 'lida', 'erro'
);

CREATE TABLE IF NOT EXISTS wpp_mensagem (
  id                SERIAL PRIMARY KEY,
  tenant_id         INT NOT NULL REFERENCES tenant(id),
  conversa_id       INT NOT NULL REFERENCES wpp_conversa(id) ON DELETE CASCADE,
  contato_id        INT NOT NULL REFERENCES wpp_contato(id) ON DELETE CASCADE,

  -- Identificação
  wpp_message_id    VARCHAR(100),
  direcao           wpp_msg_direcao NOT NULL,
  tipo              wpp_msg_tipo NOT NULL DEFAULT 'texto',
  remetente         wpp_msg_remetente NOT NULL,

  -- Conteúdo
  conteudo          TEXT NOT NULL,
  media_url         TEXT,
  media_mimetype    VARCHAR(100),

  -- Metadata IA
  respondida_por    wpp_msg_remetente,
  tokens_prompt     INT,
  tokens_resposta   INT,
  tempo_resposta_ms INT,
  dados_extraidos   JSONB,
  /*
    Exemplo:
    {
      "cidade": "Uberlândia",
      "uf": "MG",
      "confianca": 0.95
    }
  */

  -- Status
  status            wpp_msg_status NOT NULL DEFAULT 'recebida',
  erro_detalhe      TEXT,
  tentativas        INT NOT NULL DEFAULT 0,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_wpp_msg_conversa ON wpp_mensagem(conversa_id, created_at);
CREATE INDEX idx_wpp_msg_contato ON wpp_mensagem(contato_id, created_at);
CREATE INDEX idx_wpp_msg_wppid ON wpp_mensagem(wpp_message_id)
  WHERE wpp_message_id IS NOT NULL;
CREATE INDEX idx_wpp_msg_status ON wpp_mensagem(status)
  WHERE status IN ('processando', 'erro');
```

### 6.4 Migration 004 — `wpp_template`

```sql
-- ============================================================
-- 004_create_wpp_template.sql
-- Templates de mensagem reutilizáveis
-- ============================================================

CREATE TABLE IF NOT EXISTS wpp_template (
  id            SERIAL PRIMARY KEY,
  tenant_id     INT NOT NULL REFERENCES tenant(id),
  codigo        VARCHAR(50) NOT NULL,
  nome          VARCHAR(200) NOT NULL,
  categoria     VARCHAR(50) NOT NULL,
  conteudo      TEXT NOT NULL,
  variaveis     TEXT[],
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(tenant_id, codigo)
);
```

### 6.5 Migration 005 — `wpp_campanha`

```sql
-- ============================================================
-- 005_create_wpp_campanha.sql
-- Campanhas de envio em massa
-- ============================================================

CREATE TABLE IF NOT EXISTS wpp_campanha (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenant(id),
  nome            VARCHAR(200) NOT NULL,
  template_id     INT NOT NULL REFERENCES wpp_template(id),
  tipo            VARCHAR(50) NOT NULL,
  filtros         JSONB,
  status          VARCHAR(20) NOT NULL DEFAULT 'rascunho',
  agendada_para   TIMESTAMPTZ,
  total_contatos  INT,
  total_enviados  INT NOT NULL DEFAULT 0,
  total_erros     INT NOT NULL DEFAULT 0,
  total_respostas INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  executada_at    TIMESTAMPTZ,
  concluida_at    TIMESTAMPTZ
);
```

### 6.6 Migration 006 — `wpp_campanha_envio`

```sql
-- ============================================================
-- 006_create_wpp_campanha_envio.sql
-- Log de envio individual por campanha
-- ============================================================

CREATE TABLE IF NOT EXISTS wpp_campanha_envio (
  id            SERIAL PRIMARY KEY,
  campanha_id   INT NOT NULL REFERENCES wpp_campanha(id) ON DELETE CASCADE,
  contato_id    INT NOT NULL REFERENCES wpp_contato(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'pendente',
  erro_detalhe  TEXT,
  enviado_at    TIMESTAMPTZ,
  respondido_at TIMESTAMPTZ
);

CREATE INDEX idx_wpp_camp_envio ON wpp_campanha_envio(campanha_id, status);
```

### 6.7 Migration 007 — Seed de templates

```sql
-- ============================================================
-- 007_seed_templates.sql
-- Templates iniciais para o tenant padrão
-- ============================================================

INSERT INTO wpp_template (tenant_id, codigo, nome, categoria, conteudo, variaveis)
VALUES
(1, 'boas_vindas', 'Boas-vindas', 'saudacao',
  'Olá, {nome}! 👋 Obrigado pelo contato. Sou o assistente virtual. Como posso te ajudar?',
  ARRAY['nome']),

(1, 'followup_3d', 'Follow-up 3 dias', 'followup',
  'Oi, {nome}! Passando para saber se ainda tem interesse no projeto que conversamos. Posso te ajudar com mais informações?',
  ARRAY['nome']),

(1, 'followup_7d', 'Follow-up 7 dias', 'followup',
  'Olá, {nome}! Faz uma semana que conversamos sobre {resumo}. Gostaria de retomar? Estou à disposição! 😊',
  ARRAY['nome', 'resumo']),

(1, 'aniversario', 'Aniversário', 'aniversario',
  'Parabéns, {nome}! 🎉🎂 A equipe deseja um feliz aniversário! Que esse ano traga muitas conquistas.',
  ARRAY['nome']),

(1, 'reativacao_90d', 'Reativação 90 dias', 'reativacao',
  'Olá, {nome}! Faz um tempo que não conversamos. Temos novidades em projetos. Tem interesse em saber mais?',
  ARRAY['nome']),

(1, 'pos_entrega', 'Pós-entrega', 'pos_venda',
  'Olá, {nome}! Já faz 30 dias que entregamos seu projeto. Está tudo certo? Ficamos à disposição para qualquer necessidade! 🤝',
  ARRAY['nome'])

ON CONFLICT (tenant_id, codigo) DO NOTHING;
```

### 6.8 Migration 008 — Alteração na tabela `pedido` (suporte a projetos)

```sql
-- ============================================================
-- 008_alter_pedido_projeto.sql
-- Adiciona campos de projeto à tabela pedido existente
-- NOTA: Só executar se ainda não tiver sido feito na migração v2
-- ============================================================

-- Tipo de registro
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedido' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE pedido ADD COLUMN tipo VARCHAR(10) DEFAULT 'pedido'
      CHECK (tipo IN ('pedido', 'projeto'));
  END IF;
END $$;

-- Campos específicos de projeto
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'pedido' AND column_name = 'fase_projeto'
  ) THEN
    ALTER TABLE pedido ADD COLUMN fase_projeto VARCHAR(30);
    ALTER TABLE pedido ADD COLUMN area_m2 DECIMAL(10,2);
    ALTER TABLE pedido ADD COLUMN cidade_obra VARCHAR(200);
    ALTER TABLE pedido ADD COLUMN uf_obra CHAR(2);
    ALTER TABLE pedido ADD COLUMN previsao_fechamento DATE;
  END IF;
END $$;

-- Tabela de histórico de fases
CREATE TABLE IF NOT EXISTS fase_projeto_historico (
  id              SERIAL PRIMARY KEY,
  tenant_id       INT NOT NULL REFERENCES tenant(id),
  pedido_id       INT NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
  fase_anterior   VARCHAR(30),
  fase_nova       VARCHAR(30) NOT NULL,
  motivo          TEXT,
  user_id         INT REFERENCES usuario(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fase_hist_pedido ON fase_projeto_historico(pedido_id);

-- Tornar produto_id nullable nos itens (projetos usam descricao_livre)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itens_ped' AND column_name = 'produto_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE itens_ped ALTER COLUMN produto_id DROP NOT NULL;
  END IF;
END $$;

-- Campo descricao_livre e tipo_item
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'itens_ped' AND column_name = 'tipo_item'
  ) THEN
    ALTER TABLE itens_ped ADD COLUMN tipo_item VARCHAR(20) DEFAULT 'produto'
      CHECK (tipo_item IN ('produto', 'solucao', 'servico', 'customizado'));
    ALTER TABLE itens_ped ADD COLUMN descricao_livre VARCHAR(500);
  END IF;
END $$;
```

---

## 7. Evolution API — Configuração e Conexão

### 7.1 Service wrapper — `src/config/evolution.config.js`

```javascript
// src/config/evolution.config.js

module.exports = {
  baseUrl: process.env.EVOLUTION_API_URL || 'http://localhost:8080',
  apiKey: process.env.EVOLUTION_API_KEY,
  instanceName: process.env.EVOLUTION_INSTANCE_NAME || 'crm-rep-principal',
  webhookSecret: process.env.EVOLUTION_WEBHOOK_SECRET,
  serverUrl: process.env.EVOLUTION_SERVER_URL
};
```

### 7.2 Evolution Service — `src/whatsapp/services/evolution.service.js`

```javascript
// src/whatsapp/services/evolution.service.js

const axios = require('axios');
const config = require('../../config/evolution.config');
const logger = require('../../shared/utils/logger');

class EvolutionService {

  constructor() {
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'apikey': config.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  // ─── INSTÂNCIA ───────────────────────────────

  /**
   * Cria instância WhatsApp na Evolution API
   */
  async createInstance(instanceName = config.instanceName) {
    const { data } = await this.client.post('/instance/create', {
      instanceName,
      qrcode: true,
      integration: 'WHATSAPP-BAILEYS'
    });
    logger.info(`[Evolution] Instância '${instanceName}' criada`);
    return data;
  }

  /**
   * Obtém QR Code para escanear
   * @returns {Object} { base64: "data:image/png;base64,..." }
   */
  async getQRCode(instanceName = config.instanceName) {
    const { data } = await this.client.get(
      `/instance/connect/${instanceName}`
    );
    return data;
  }

  /**
   * Verifica estado da conexão
   * @returns {string} 'open' | 'close' | 'connecting'
   */
  async getConnectionState(instanceName = config.instanceName) {
    const { data } = await this.client.get(
      `/instance/connectionState/${instanceName}`
    );
    return data.state;
  }

  /**
   * Logout e desconecta
   */
  async logout(instanceName = config.instanceName) {
    await this.client.delete(`/instance/logout/${instanceName}`);
    logger.info(`[Evolution] Instância '${instanceName}' desconectada`);
  }

  // ─── ENVIO DE MENSAGENS ──────────────────────

  /**
   * Envia mensagem de texto
   * @param {string} phone - Telefone no formato 5567999998888
   * @param {string} text - Texto da mensagem
   */
  async sendText(phone, text, instanceName = config.instanceName) {
    try {
      const { data } = await this.client.post(
        `/message/sendText/${instanceName}`,
        {
          number: phone,
          text: text
        }
      );
      logger.info(`[Evolution] Msg enviada para ${phone.slice(-4)}`);
      return data;
    } catch (error) {
      logger.error(`[Evolution] Erro ao enviar para ${phone}:`, error.message);
      throw error;
    }
  }

  /**
   * Envia mensagem com botões (lista de opções)
   */
  async sendButtons(phone, title, description, buttons, instanceName = config.instanceName) {
    const { data } = await this.client.post(
      `/message/sendButtons/${instanceName}`,
      {
        number: phone,
        title,
        description,
        buttons: buttons.map((text, i) => ({
          type: 'reply',
          buttonId: `btn_${i}`,
          buttonText: { displayText: text }
        }))
      }
    );
    return data;
  }

  /**
   * Envia imagem com legenda
   */
  async sendImage(phone, imageUrl, caption, instanceName = config.instanceName) {
    const { data } = await this.client.post(
      `/message/sendMedia/${instanceName}`,
      {
        number: phone,
        mediatype: 'image',
        media: imageUrl,
        caption
      }
    );
    return data;
  }

  /**
   * Marca mensagem como lida (blue ticks)
   */
  async markAsRead(remoteJid, messageId, instanceName = config.instanceName) {
    await this.client.post(
      `/chat/markMessageAsRead/${instanceName}`,
      {
        readMessages: [{
          remoteJid: `${remoteJid}@s.whatsapp.net`,
          id: messageId
        }]
      }
    );
  }

  /**
   * Verifica se número tem WhatsApp
   */
  async checkNumber(phone, instanceName = config.instanceName) {
    const { data } = await this.client.post(
      `/chat/whatsappNumbers/${instanceName}`,
      { numbers: [phone] }
    );
    return data[0]?.exists || false;
  }
}

module.exports = new EvolutionService();
```

### 7.3 Primeiro uso — Conectar WhatsApp

```bash
# 1. Criar instância (executar uma vez)
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "crm-rep-principal",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# 2. Obter QR Code
curl -X GET http://localhost:8080/instance/connect/crm-rep-principal \
  -H "apikey: SUA_CHAVE"
# → Resposta: { "base64": "data:image/png;base64,..." }
# → Exibir na tela de admin para o representante escanear

# 3. Verificar conexão
curl -X GET http://localhost:8080/instance/connectionState/crm-rep-principal \
  -H "apikey: SUA_CHAVE"
# → { "state": "open" } = conectado!
```

---

## 8. Webhook Receiver

### 8.1 Middleware de autenticação — `webhook-auth.middleware.js`

```javascript
// src/whatsapp/middleware/webhook-auth.middleware.js

const config = require('../../config/evolution.config');
const logger = require('../../shared/utils/logger');

/**
 * Valida que o webhook veio da Evolution API
 */
function webhookAuth(req, res, next) {
  const apiKey = req.headers['apikey'] || req.query.apikey;

  if (!apiKey || apiKey !== config.webhookSecret) {
    logger.warn('[Webhook] Requisição não autorizada', {
      ip: req.ip,
      headers: req.headers
    });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

module.exports = webhookAuth;
```

### 8.2 Rotas do webhook — `webhook.routes.js`

```javascript
// src/whatsapp/routes/webhook.routes.js

const router = require('express').Router();
const webhookAuth = require('../middleware/webhook-auth.middleware');
const WebhookController = require('../controllers/webhook.controller');

const controller = new WebhookController();

// Webhook da Evolution API (com autenticação)
router.post('/webhook/evolution', webhookAuth, (req, res) =>
  controller.handleEvolution(req, res)
);

module.exports = router;
```

### 8.3 Controller do webhook — `webhook.controller.js`

```javascript
// src/whatsapp/controllers/webhook.controller.js

const { messageQueue } = require('../workers/message.worker');
const messageService = require('../services/message.service');
const logger = require('../../shared/utils/logger');
const { normalizePhone } = require('../../shared/utils/phone.utils');

class WebhookController {

  /**
   * POST /webhook/evolution
   * Recebe TODOS os eventos da Evolution API.
   * Responde 200 imediatamente e enfileira para processamento assíncrono.
   */
  async handleEvolution(req, res) {
    // CRÍTICO: responder 200 rápido (Evolution tem timeout curto)
    res.status(200).json({ received: true });

    try {
      const { event, instance, data } = req.body;

      // ── Filtrar apenas mensagens recebidas ──
      if (event !== 'messages.upsert') return;
      if (!data || !data.key) return;
      if (data.key.fromMe) return;  // ignorar mensagens enviadas por nós

      // Ignorar grupos
      const remoteJid = data.key.remoteJid || '';
      if (remoteJid.includes('@g.us')) return;

      // Ignorar mensagens de status/broadcast
      if (remoteJid === 'status@broadcast') return;

      // ── Extrair dados ──
      const phone = normalizePhone(remoteJid.replace('@s.whatsapp.net', ''));
      const pushName = data.pushName || null;
      const messageId = data.key.id;
      const content = this._extractContent(data);
      const messageType = data.messageType || 'conversation';
      const timestamp = data.messageTimestamp;

      // ── Deduplicação ──
      const isDuplicate = await messageService.checkDuplicate(messageId);
      if (isDuplicate) {
        logger.debug(`[Webhook] Msg duplicada ignorada: ${messageId}`);
        return;
      }

      // ── Enfileirar para processamento ──
      await messageQueue.add('process-message', {
        phone,
        pushName,
        messageId,
        content,
        messageType,
        instance,
        timestamp,
      }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 500
      });

      logger.info(`[Webhook] Msg enfileirada: ${phone.slice(-4)} | ${content.substring(0, 50)}`);

    } catch (error) {
      // Não lançar erro (já respondemos 200)
      logger.error('[Webhook] Erro ao processar evento:', error);
    }
  }

  /**
   * Extrai conteúdo textual da mensagem
   */
  _extractContent(data) {
    const msg = data.message;
    if (!msg) return '[Mensagem vazia]';

    if (msg.conversation) return msg.conversation;
    if (msg.extendedTextMessage?.text) return msg.extendedTextMessage.text;
    if (msg.buttonsResponseMessage?.selectedDisplayText) return msg.buttonsResponseMessage.selectedDisplayText;
    if (msg.listResponseMessage?.title) return msg.listResponseMessage.title;
    if (msg.imageMessage?.caption) return `[Imagem] ${msg.imageMessage.caption}`;
    if (msg.imageMessage) return '[Imagem recebida]';
    if (msg.audioMessage) return '[Áudio recebido]';
    if (msg.videoMessage) return '[Vídeo recebido]';
    if (msg.documentMessage) return `[Documento: ${msg.documentMessage.fileName || 'arquivo'}]`;
    if (msg.locationMessage) {
      return `[Localização: ${msg.locationMessage.degreesLatitude}, ${msg.locationMessage.degreesLongitude}]`;
    }
    if (msg.contactMessage) return '[Contato compartilhado]';
    if (msg.stickerMessage) return '[Sticker]';

    return '[Mensagem não suportada]';
  }
}

module.exports = WebhookController;
```

### 8.4 Formato do webhook (referência)

```json
{
  "event": "messages.upsert",
  "instance": "crm-rep-principal",
  "data": {
    "key": {
      "remoteJid": "5567999998888@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0A0C1D2E3F4"
    },
    "pushName": "João da Silva",
    "message": {
      "conversation": "Oi, vi o anúncio do galpão no Instagram"
    },
    "messageType": "conversation",
    "messageTimestamp": 1708000000
  }
}
```

---

## 9. Orquestrador — Motor de Decisão

> **Este é o arquivo mais importante do módulo.** Ele recebe cada mensagem e decide o que fazer.

### 9.1 `orchestrator.service.js` — Código completo

```javascript
// src/whatsapp/services/orchestrator.service.js

const contactService = require('./contact.service');
const conversationService = require('./conversation.service');
const messageService = require('./message.service');
const openaiService = require('./openai.service');
const evolutionService = require('./evolution.service');
const qualificationService = require('./qualification.service');
const crmBridge = require('./crm-bridge.service');
const notificationService = require('./notification.service');
const logger = require('../../shared/utils/logger');

class OrchestratorService {

  /**
   * ★ PONTO CENTRAL DE PROCESSAMENTO ★
   * Recebe msg já desenfileirada e executa toda a lógica.
   */
  async processMessage({ phone, pushName, messageId, content, messageType, instance }) {
    const tenantId = await this._getTenantFromInstance(instance);
    const startTime = Date.now();

    try {
      // ═══ PASSO 1: Identificar ou criar contato ═══
      let contato = await contactService.findByPhone(tenantId, phone);
      if (!contato) {
        contato = await contactService.create({
          tenant_id: tenantId,
          telefone: phone,
          nome_push: pushName,
          origem: 'whatsapp_inbound'
        });
        logger.info(`[Orchestrator] Novo contato: ${phone.slice(-4)}`);
      } else if (pushName && !contato.nome_push) {
        await contactService.update(contato.id, { nome_push: pushName });
        contato.nome_push = pushName;
      }

      // ═══ PASSO 2: Buscar ou criar conversa ativa ═══
      let conversa = await conversationService.findActive(tenantId, contato.id);
      const isNewConversation = !conversa;

      if (!conversa) {
        conversa = await conversationService.create({
          tenant_id: tenantId,
          contato_id: contato.id,
          estado: 'nova',
          origem: 'inbound',
          primeira_msg_at: new Date()
        });
        logger.info(`[Orchestrator] Nova conversa #${conversa.id}`);
      }

      // ═══ PASSO 3: Salvar mensagem recebida ═══
      const mensagem = await messageService.create({
        tenant_id: tenantId,
        conversa_id: conversa.id,
        contato_id: contato.id,
        wpp_message_id: messageId,
        direcao: 'inbound',
        tipo: this._mapMessageType(messageType),
        remetente: 'lead',
        conteudo: content,
        status: 'recebida'
      });

      // Atualizar contadores
      await conversationService.incrementMsgCount(conversa.id, 'lead');
      await conversationService.updateLastMsg(conversa.id);

      // Métricas: tempo da primeira resposta
      if (isNewConversation) {
        conversa._startTime = startTime;
      }

      // ═══ PASSO 4: Decidir rota ═══
      const rota = this._decidirRota(conversa, contato, content);
      logger.info(`[Orchestrator] Conversa #${conversa.id} | Rota: ${rota}`);

      switch (rota) {
        case 'ia_responde':
          await this._rotaIA(conversa, contato, mensagem, instance);
          break;

        case 'humano_ativo':
          await notificationService.notificarNovaMensagem(conversa, mensagem);
          break;

        case 'nao_responder':
          logger.debug(`[Orchestrator] Msg sem resposta: ${content.substring(0, 30)}`);
          break;

        case 'optout':
          await this._processarOptout(contato, conversa);
          break;
      }

      logger.info(`[Orchestrator] Processado em ${Date.now() - startTime}ms`);

    } catch (error) {
      logger.error(`[Orchestrator] Erro processando msg de ${phone}:`, error);
      throw error; // BullMQ vai fazer retry
    }
  }

  // ═══════════════════════════════════════════
  // DECISÃO DE ROTA
  // ═══════════════════════════════════════════

  /**
   * Decide quem responde esta mensagem.
   * Retorna: 'ia_responde' | 'humano_ativo' | 'nao_responder' | 'optout'
   */
  _decidirRota(conversa, contato, content) {
    const lower = content.toLowerCase().trim();

    // Opt-out explícito
    if (['sair', 'parar', 'cancelar', 'stop', 'não quero mais', 'pare'].includes(lower)) {
      return 'optout';
    }

    // Contato não aceita mensagens
    if (!contato.aceita_msgs) return 'nao_responder';

    // Humano já assumiu esta conversa
    if (conversa.estado === 'humano_ativo') return 'humano_ativo';
    if (conversa.estado === 'em_andamento') return 'humano_ativo';

    // Conversa já encerrada/convertida — abrir nova? Não, IA responde
    if (['convertida', 'perdida', 'encerrada'].includes(conversa.estado)) {
      return 'ia_responde'; // vai criar nova conversa no flow
    }

    // Áudio — por enquanto não processamos (TODO: transcrição futura)
    if (content === '[Áudio recebido]') return 'nao_responder';

    // Padrão: IA responde
    return 'ia_responde';
  }

  // ═══════════════════════════════════════════
  // ROTA IA — Conversar com GPT
  // ═══════════════════════════════════════════

  async _rotaIA(conversa, contato, mensagem, instance) {
    // Atualizar estado se nova
    if (conversa.estado === 'nova') {
      await conversationService.updateEstado(conversa.id, 'ia_ativa');
    }

    // Carregar histórico (últimas 20 mensagens para contexto)
    const historico = await messageService.getHistorico(conversa.id, 20);

    // Carregar config do tenant (nome da indústria, representante, etc)
    const tenantConfig = await this._getTenantConfig(conversa.tenant_id);

    // Montar contexto do contato
    const contextoContato = {
      nome: contato.nome_informado || contato.nome_push || 'visitante',
      telefone: contato.telefone,
      cidade: contato.cidade,
      is_cliente: contato.is_cliente,
      tenantConfig
    };

    // ── Chamar GPT ──
    const startTime = Date.now();
    const respostaIA = await openaiService.processarMensagem({
      mensagemAtual: mensagem.conteudo,
      historico,
      contextoContato,
      dadosQualificacao: conversa.dados_qualificacao || {}
    });
    const tempoResposta = Date.now() - startTime;

    // ── Salvar resposta no DB ──
    const msgResposta = await messageService.create({
      tenant_id: conversa.tenant_id,
      conversa_id: conversa.id,
      contato_id: contato.id,
      direcao: 'outbound',
      tipo: 'texto',
      remetente: 'ia',
      conteudo: respostaIA.texto,
      tokens_prompt: respostaIA.tokensPrompt,
      tokens_resposta: respostaIA.tokensResposta,
      tempo_resposta_ms: tempoResposta,
      dados_extraidos: respostaIA.dadosExtraidos,
      status: 'processando'
    });

    // ── Atualizar qualificação se extraiu dados novos ──
    if (respostaIA.dadosExtraidos && Object.keys(respostaIA.dadosExtraidos).length > 0) {
      const dadosAtuais = conversa.dados_qualificacao || {};
      const dadosMerge = { ...dadosAtuais, ...respostaIA.dadosExtraidos };

      // Avaliar score
      const qualificacao = qualificationService.avaliar(dadosMerge);
      dadosMerge.score = qualificacao.score;
      dadosMerge.classificacao = qualificacao.classificacao;
      dadosMerge.qualificado = qualificacao.qualificado;

      await conversationService.updateQualificacao(conversa.id, dadosMerge);

      // Atualizar contato com dados coletados
      await this._atualizarContatoComDados(contato, respostaIA.dadosExtraidos);

      // Se qualificou → transferir para representante
      if (qualificacao.qualificado && conversa.estado !== 'ia_qualificou') {
        await this._processarLeadQualificado(conversa, contato, dadosMerge, instance);
      }
    }

    // ── Enviar via Evolution API ──
    try {
      await evolutionService.sendText(contato.telefone, respostaIA.texto);
      await messageService.updateStatus(msgResposta.id, 'enviada');
    } catch (error) {
      logger.error(`[Orchestrator] Erro ao enviar msg:`, error.message);
      await messageService.updateStatus(msgResposta.id, 'erro', error.message);
    }

    // ── Atualizar contadores ──
    await conversationService.incrementMsgCount(conversa.id, 'ia');
    await conversationService.addTokens(
      conversa.id,
      (respostaIA.tokensPrompt || 0) + (respostaIA.tokensResposta || 0)
    );

    // ── Tempo da primeira resposta (métrica) ──
    if (conversa._startTime) {
      const tempoTotal = Date.now() - conversa._startTime;
      await conversationService.setTempoFirstResp(conversa.id, Math.round(tempoTotal / 1000));
    }
  }

  // ═══════════════════════════════════════════
  // LEAD QUALIFICADO — Criar projeto no CRM
  // ═══════════════════════════════════════════

  async _processarLeadQualificado(conversa, contato, dados, instance) {
    logger.info(`[Orchestrator] 🔥 Lead QUALIFICADO! Conversa #${conversa.id} | Score: ${dados.score}`);

    // Mudar estado
    await conversationService.updateEstado(conversa.id, 'ia_qualificou');
    await conversationService.setQualificadaAt(conversa.id);

    // Gerar resumo da conversa
    const resumo = await openaiService.gerarResumo(conversa.id);
    await conversationService.updateResumo(conversa.id, resumo);

    // Criar/vincular cliente no CRM
    if (!contato.is_cliente) {
      const cliente = await crmBridge.criarClienteFromLead(contato, dados);
      await contactService.vincularCliente(contato.id, cliente.id);
      contato.cliente_id = cliente.id;
      logger.info(`[Orchestrator] Cliente #${cliente.id} criado no CRM`);
    }

    // Criar projeto no CRM
    const projeto = await crmBridge.criarProjeto({
      tenant_id: conversa.tenant_id,
      cliente_id: contato.cliente_id,
      fase_projeto: 'prospeccao',
      area_m2: dados.area_m2 || null,
      cidade_obra: dados.cidade || null,
      uf_obra: dados.uf || null,
      observacoes: resumo
    });

    // Vincular conversa ao projeto
    await conversationService.vincularPedido(conversa.id, projeto.id);
    logger.info(`[Orchestrator] Projeto #${projeto.numero} criado no CRM`);

    // Notificar representante
    await notificationService.notificarLeadQualificado({
      conversa,
      contato,
      dados,
      resumo,
      projeto
    });
  }

  // ═══════════════════════════════════════════
  // OPT-OUT (LGPD)
  // ═══════════════════════════════════════════

  async _processarOptout(contato, conversa) {
    await contactService.optout(contato.id);
    await conversationService.updateEstado(conversa.id, 'encerrada');

    // Enviar confirmação
    await evolutionService.sendText(
      contato.telefone,
      'Entendido! Você não receberá mais mensagens nossas. Se mudar de ideia, é só nos procurar. Até mais! 👋'
    );

    logger.info(`[Orchestrator] Opt-out: ${contato.telefone.slice(-4)}`);
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  /**
   * Atualiza contato com dados coletados pela IA
   */
  async _atualizarContatoComDados(contato, dados) {
    const updates = {};
    if (dados.nome && !contato.nome_informado) updates.nome_informado = dados.nome;
    if (dados.cidade && !contato.cidade) updates.cidade = dados.cidade;
    if (dados.uf && !contato.uf) updates.uf = dados.uf;
    if (dados.email && !contato.email) updates.email = dados.email;
    if (dados.empresa && !contato.empresa) updates.empresa = dados.empresa;

    if (Object.keys(updates).length > 0) {
      await contactService.update(contato.id, updates);
    }
  }

  _mapMessageType(type) {
    const map = {
      'conversation': 'texto',
      'extendedTextMessage': 'texto',
      'imageMessage': 'imagem',
      'audioMessage': 'audio',
      'videoMessage': 'video',
      'documentMessage': 'documento',
      'locationMessage': 'localizacao',
      'contactMessage': 'contato',
      'stickerMessage': 'sticker'
    };
    return map[type] || 'texto';
  }

  async _getTenantFromInstance(instance) {
    // Por enquanto, single-tenant
    // TODO: mapear instância → tenant quando multi-tenant
    return parseInt(process.env.DEFAULT_TENANT_ID || '1');
  }

  async _getTenantConfig(tenantId) {
    // TODO: carregar do banco
    return {
      representante_nome: process.env.REPRESENTANTE_NOME || 'Representante',
      industria_nome: process.env.INDUSTRIA_NOME || 'Empresa',
      tenant_id: tenantId
    };
  }
}

module.exports = new OrchestratorService();
```

---

## 10. Agente IA — OpenAI Service

### 10.1 Configuração — `openai.config.js`

```javascript
// src/config/openai.config.js

module.exports = {
  apiKey: process.env.OPENAI_API_KEY,
  model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '500'),
  temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7')
};
```

### 10.2 OpenAI Service — `openai.service.js`

```javascript
// src/whatsapp/services/openai.service.js

const OpenAI = require('openai');
const config = require('../../config/openai.config');
const { buildSystemPrompt } = require('../prompts/system.prompt');
const { buildQualificationContext } = require('../prompts/qualification.prompt');
const { buildSummaryPrompt } = require('../prompts/summary.prompt');
const messageService = require('./message.service');
const logger = require('../../shared/utils/logger');

class OpenAIService {

  constructor() {
    this.client = new OpenAI({ apiKey: config.apiKey });
  }

  /**
   * Processa uma mensagem do lead e gera resposta + extração de dados.
   *
   * @param {Object} params
   * @param {string} params.mensagemAtual - Texto da mensagem do lead
   * @param {Array}  params.historico - Últimas N mensagens da conversa
   * @param {Object} params.contextoContato - Dados do contato
   * @param {Object} params.dadosQualificacao - Dados já coletados
   *
   * @returns {Object} { texto, dadosExtraidos, qualificado, intencao, tokensPrompt, tokensResposta }
   */
  async processarMensagem({ mensagemAtual, historico, contextoContato, dadosQualificacao }) {

    // ── Montar array de mensagens para o GPT ──
    const messages = [];

    // 1. System prompt (persona + regras)
    messages.push({
      role: 'system',
      content: buildSystemPrompt(contextoContato.tenantConfig)
    });

    // 2. Contexto de qualificação (o que já sabe)
    if (dadosQualificacao && Object.keys(dadosQualificacao).length > 0) {
      messages.push({
        role: 'system',
        content: buildQualificationContext(dadosQualificacao)
      });
    }

    // 3. Histórico da conversa (últimas mensagens)
    for (const msg of historico) {
      messages.push({
        role: msg.remetente === 'lead' ? 'user' : 'assistant',
        content: msg.remetente === 'lead'
          ? msg.conteudo
          : this._extractTextoFromHistorico(msg.conteudo)
      });
    }

    // 4. Mensagem atual
    messages.push({
      role: 'user',
      content: mensagemAtual
    });

    // ── Chamar GPT ──
    try {
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages,
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: { type: 'json_object' }
      });

      const rawContent = response.choices[0].message.content;
      const result = JSON.parse(rawContent);

      return {
        texto: result.texto || 'Desculpe, não entendi. Pode reformular?',
        dadosExtraidos: result.dados_extraidos || {},
        qualificado: result.qualificado || false,
        intencao: result.intencao || 'respondendo_pergunta',
        tokensPrompt: response.usage?.prompt_tokens || 0,
        tokensResposta: response.usage?.completion_tokens || 0
      };

    } catch (error) {
      logger.error('[OpenAI] Erro na chamada:', error.message);

      // Fallback: resposta genérica se GPT falhar
      return {
        texto: 'Desculpe, tive um probleminha aqui. Pode repetir sua mensagem? 😅',
        dadosExtraidos: {},
        qualificado: false,
        intencao: 'erro',
        tokensPrompt: 0,
        tokensResposta: 0
      };
    }
  }

  /**
   * Gera resumo da conversa para notificação ao representante.
   */
  async gerarResumo(conversaId) {
    const historico = await messageService.getHistorico(conversaId, 50);

    const historicoFormatado = historico
      .map(m => `[${m.remetente}]: ${m.conteudo}`)
      .join('\n');

    try {
      const response = await this.client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: buildSummaryPrompt() },
          { role: 'user', content: historicoFormatado }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      return response.choices[0].message.content;

    } catch (error) {
      logger.error('[OpenAI] Erro ao gerar resumo:', error.message);
      return 'Resumo indisponível';
    }
  }

  /**
   * Se o histórico salvo contém JSON (resposta raw do GPT),
   * extrai apenas o campo texto.
   */
  _extractTextoFromHistorico(conteudo) {
    try {
      const parsed = JSON.parse(conteudo);
      return parsed.texto || conteudo;
    } catch {
      return conteudo; // já é texto puro
    }
  }
}

module.exports = new OpenAIService();
```

---

## 11. Sistema de Prompts

### 11.1 System Prompt — `system.prompt.js`

```javascript
// src/whatsapp/prompts/system.prompt.js

/**
 * Constrói o system prompt (persona) do agente IA.
 * Este prompt define QUEM a IA é e COMO ela deve se comportar.
 *
 * @param {Object} tenantConfig - Configurações do tenant
 * @param {string} tenantConfig.industria_nome - Nome da indústria (ex: "Bertolini")
 * @param {string} tenantConfig.representante_nome - Nome do representante
 */
function buildSystemPrompt(tenantConfig) {
  return `
Você é o assistente virtual da ${tenantConfig.industria_nome}, uma empresa especializada
em galpões, armazéns, coberturas metálicas e soluções estruturais.

Você atende pelo WhatsApp em nome do representante comercial ${tenantConfig.representante_nome}.

## SEU PAPEL
- Atender leads que chegam via WhatsApp (geralmente vindos de anúncios no Instagram/Google)
- Conversar de forma NATURAL, simpática e profissional
- Qualificar o lead coletando informações essenciais
- Quando o lead estiver qualificado, informar que o representante entrará em contato

## INFORMAÇÕES QUE VOCÊ PRECISA COLETAR (ordem sugerida, não obrigatória)
1. **Nome** do contato (se não tiver via pushName)
2. **Tipo de projeto**: galpão, armazém, cobertura, mezanino, doca, outro
3. **Dimensões aproximadas** (largura x comprimento, ou área em m²)
4. **Uso/finalidade**: armazenagem, produção, logística, agro, comercial
5. **Cidade e estado** da obra
6. **Prazo**: quando pretende iniciar
7. **Construção nova ou ampliação/reforma**

## REGRAS DE CONVERSA
- NUNCA invente preços ou prazos de entrega — cada projeto é orçado individualmente
- Se perguntarem preço, diga que depende do projeto e que o representante fará um orçamento personalizado
- Você pode dar faixas gerais se pressionado: "projetos variam bastante conforme dimensão e especificação, mas o representante vai detalhar isso com você"
- Use linguagem informal mas profissional. Pode usar emojis com moderação (1-2 por msg)
- Respostas curtas e objetivas (WhatsApp não é email). Máximo 3-4 linhas por mensagem
- Faça UMA pergunta por vez. Não bombardeie o lead com várias perguntas
- Se o lead mandar áudio ou imagem, peça gentilmente que descreva por texto
- Se o lead perguntar algo fora do escopo, diga que vai encaminhar para o representante

## QUALIFICAÇÃO
Após coletar pelo menos: tipo de projeto + dimensão + cidade + prazo,
considere o lead QUALIFICADO e informe que o representante entrará em contato.

## FORMATO DE RESPOSTA
Responda SEMPRE com um JSON válido:
{
  "texto": "Sua mensagem para o lead aqui",
  "dados_extraidos": {
    "campo": "valor extraido"
  },
  "qualificado": false,
  "intencao": "interesse_inicial"
}

Campos possíveis em dados_extraidos:
- nome, tipo_projeto, dimensao, area_m2, uso_finalidade,
  cidade, uf, prazo, tipo_construcao, orcamento_estimado,
  empresa, email, observacoes

Valores de intencao:
- interesse_inicial, pedindo_info, respondendo_pergunta,
  desinteresse, off_topic, saudacao, agradecimento
`.trim();
}

module.exports = { buildSystemPrompt };
```

### 11.2 Qualification Context — `qualification.prompt.js`

```javascript
// src/whatsapp/prompts/qualification.prompt.js

/**
 * Constrói contexto de qualificação para o GPT.
 * Informa o que a IA já sabe e o que ainda falta perguntar.
 */
function buildQualificationContext(dados) {
  const camposPreenchidos = [];
  const camposFaltando = [];

  const mapa = {
    nome: 'Nome do contato',
    tipo_projeto: 'Tipo de projeto',
    dimensao: 'Dimensões',
    area_m2: 'Área em m²',
    uso_finalidade: 'Uso/finalidade',
    cidade: 'Cidade',
    uf: 'Estado',
    prazo: 'Prazo para iniciar',
    tipo_construcao: 'Tipo de construção (novo/reforma)',
    orcamento_estimado: 'Orçamento estimado',
    empresa: 'Empresa',
    email: 'Email'
  };

  for (const [campo, label] of Object.entries(mapa)) {
    if (dados[campo]) {
      camposPreenchidos.push(`- ${label}: ${dados[campo]}`);
    } else if (['tipo_projeto', 'dimensao', 'cidade', 'prazo'].includes(campo)) {
      camposFaltando.push(`- ${label}`);
    }
  }

  let context = `DADOS JÁ COLETADOS DESTE LEAD:\n`;
  context += camposPreenchidos.join('\n') || '  Nenhum dado coletado ainda.';

  if (camposFaltando.length > 0) {
    context += `\n\nDADOS QUE AINDA FALTAM (priorize perguntar estes):\n`;
    context += camposFaltando.join('\n');
  }

  context += `\n\nIMPORTANTE: Não pergunte o que já sabe. Avance para os campos faltantes.`;
  context += `\nSe já tem tipo + dimensão + cidade + prazo, o lead está QUALIFICADO.`;

  return context;
}

module.exports = { buildQualificationContext };
```

### 11.3 Summary Prompt — `summary.prompt.js`

```javascript
// src/whatsapp/prompts/summary.prompt.js

function buildSummaryPrompt() {
  return `
Resuma esta conversa de WhatsApp entre um lead e o assistente virtual
de uma empresa de galpões e estruturas metálicas.

Destaque em formato objetivo:
- Nome do lead (se informado)
- Tipo de projeto
- Dimensões
- Cidade/Estado
- Prazo
- Qualquer informação relevante adicional

Máximo 3-4 frases curtas e diretas. Sem introdução, vá direto ao ponto.
Exemplo: "João da Silva, empresa JS Alimentos, busca galpão 20x40m em Dourados/MS para armazém de grãos. Prazo de 3 meses, tem terreno próprio. Lead urgente."
`.trim();
}

module.exports = { buildSummaryPrompt };
```

---

## 12. Qualificação de Leads

### 12.1 `qualification.service.js` — Scoring completo

```javascript
// src/whatsapp/services/qualification.service.js

const logger = require('../../shared/utils/logger');

const THRESHOLD = parseInt(process.env.QUALIFICATION_THRESHOLD || '70');
const HOT_THRESHOLD = parseInt(process.env.QUALIFICATION_HOT_THRESHOLD || '85');

class QualificationService {

  /**
   * Avalia o nível de qualificação do lead.
   *
   * Sistema de pontuação:
   *   tipo_projeto  = 25 pts  (obrigatório)
   *   dimensao      = 25 pts  (obrigatório)
   *   cidade        = 20 pts  (obrigatório)
   *   prazo         = 15 pts  (importante)
   *   uso_finalidade = 5 pts  (complementar)
   *   tipo_construcao = 5 pts (complementar)
   *   nome           = 5 pts  (complementar)
   *   Total máximo   = 100 pts
   *
   * Qualificado = score >= 70 (tipo + dimensão + cidade no mínimo)
   * Hot = score >= 85
   *
   * @param {Object} dados - Dados de qualificação coletados
   * @returns {Object} { score, qualificado, classificacao, campos_preenchidos, campos_faltando }
   */
  avaliar(dados) {
    let score = 0;
    const campos = [];
    const faltando = [];

    // ── Campos obrigatórios (peso maior) ──

    if (dados.tipo_projeto) {
      score += 25;
      campos.push('tipo_projeto');
    } else {
      faltando.push('tipo_projeto');
    }

    if (dados.dimensao || dados.area_m2) {
      score += 25;
      campos.push('dimensao');
    } else {
      faltando.push('dimensao');
    }

    if (dados.cidade) {
      score += 20;
      campos.push('cidade');
    } else {
      faltando.push('cidade');
    }

    if (dados.prazo) {
      score += 15;
      campos.push('prazo');
    } else {
      faltando.push('prazo');
    }

    // ── Campos complementares (peso menor) ──

    if (dados.uso_finalidade) {
      score += 5;
      campos.push('uso_finalidade');
    }

    if (dados.tipo_construcao) {
      score += 5;
      campos.push('tipo_construcao');
    }

    if (dados.nome) {
      score += 5;
      campos.push('nome');
    }

    // ── Classificação ──
    const qualificado = score >= THRESHOLD;
    let classificacao;
    if (score >= HOT_THRESHOLD) classificacao = 'hot';
    else if (score >= THRESHOLD) classificacao = 'warm';
    else if (score >= 40) classificacao = 'cold';
    else classificacao = 'unknown';

    const resultado = {
      score,
      qualificado,
      classificacao,
      campos_preenchidos: campos,
      campos_faltando: faltando,
      motivo: qualificado
        ? `Lead qualificado (${score}pts): ${campos.join(', ')}`
        : `Faltam dados (${score}pts). Pendente: ${faltando.join(', ')}`
    };

    logger.debug(`[Qualification] Score: ${score} | ${classificacao} | ${resultado.motivo}`);

    return resultado;
  }

  /**
   * Retorna o emoji de classificação para notificações
   */
  getEmoji(classificacao) {
    const emojis = {
      hot: '🔥',
      warm: '🟡',
      cold: '🔵',
      unknown: '⚪'
    };
    return emojis[classificacao] || '⚪';
  }
}

module.exports = new QualificationService();
```

### 12.2 Tabela de scoring (referência visual)

```
┌─────────────────────┬────────┬─────────────┐
│ Campo               │ Pontos │ Obrigatório │
├─────────────────────┼────────┼─────────────┤
│ tipo_projeto        │   25   │     SIM     │
│ dimensao / area_m2  │   25   │     SIM     │
│ cidade              │   20   │     SIM     │
│ prazo               │   15   │     NÃO     │
│ uso_finalidade      │    5   │     NÃO     │
│ tipo_construcao     │    5   │     NÃO     │
│ nome                │    5   │     NÃO     │
├─────────────────────┼────────┼─────────────┤
│ TOTAL MÁXIMO        │  100   │             │
└─────────────────────┴────────┴─────────────┘

Classificação:
  85-100  →  🔥 HOT    (quase tudo preenchido)
  70-84   →  🟡 WARM   (qualificado, falta complementar)
  40-69   →  🔵 COLD   (tem algo, precisa mais dados)
   0-39   →  ⚪ UNKNOWN (quase nada coletado)
```

---

## 13. Bridge CRM — Integração com Pedidos/Projetos

### 13.1 `crm-bridge.service.js`

```javascript
// src/whatsapp/services/crm-bridge.service.js

const db = require('../../config/database');
const logger = require('../../shared/utils/logger');

class CRMBridgeService {

  /**
   * Cria um cliente no CRM a partir de um lead qualificado.
   * Primeiro verifica se já existe pelo telefone.
   */
  async criarClienteFromLead(contato, dados) {
    // Verificar se já existe por telefone
    const existing = await db.query(
      `SELECT id FROM cliente WHERE tenant_id = $1 AND (celular = $2 OR telefone = $2)`,
      [contato.tenant_id, contato.telefone]
    );

    if (existing.rows.length > 0) {
      logger.info(`[CRM Bridge] Cliente já existe: #${existing.rows[0].id}`);
      return { id: existing.rows[0].id };
    }

    // Criar novo
    const result = await db.query(`
      INSERT INTO cliente (
        tenant_id, tipo_pessoa, nome_fantasia,
        telefone, celular, cidade, uf,
        origem, observacoes, ativo
      ) VALUES (
        $1, 'PF', $2, $3, $3, $4, $5,
        'whatsapp',
        $6,
        TRUE
      )
      RETURNING id
    `, [
      contato.tenant_id,
      dados.nome || contato.nome_informado || contato.nome_push || 'Lead WhatsApp',
      contato.telefone,
      dados.cidade || null,
      dados.uf || null,
      `Lead qualificado via WhatsApp em ${new Date().toLocaleDateString('pt-BR')}. ` +
      `Projeto: ${dados.tipo_projeto || 'N/I'} ${dados.dimensao || ''}`
    ]);

    logger.info(`[CRM Bridge] Cliente criado: #${result.rows[0].id}`);
    return { id: result.rows[0].id };
  }

  /**
   * Cria um projeto (pedido com tipo='projeto') no CRM.
   * O projeto aparece no Kanban na fase 'prospeccao'.
   */
  async criarProjeto({ tenant_id, cliente_id, fase_projeto, area_m2, cidade_obra, uf_obra, observacoes }) {
    // Gerar próximo número
    const numResult = await db.query(
      `SELECT COALESCE(MAX(numero), 0) + 1 AS prox FROM pedido WHERE tenant_id = $1`,
      [tenant_id]
    );
    const numero = numResult.rows[0].prox;

    // Criar projeto
    const result = await db.query(`
      INSERT INTO pedido (
        tenant_id, numero, tipo, cliente_id,
        fase_projeto, area_m2, cidade_obra, uf_obra,
        observacoes, data_pedido
      ) VALUES (
        $1, $2, 'projeto', $3,
        $4, $5, $6, $7,
        $8, CURRENT_DATE
      )
      RETURNING id, numero
    `, [
      tenant_id, numero, cliente_id,
      fase_projeto || 'prospeccao',
      area_m2, cidade_obra, uf_obra,
      observacoes
    ]);

    const projeto = result.rows[0];

    // Registrar no histórico de fases
    await db.query(`
      INSERT INTO fase_projeto_historico (
        tenant_id, pedido_id, fase_anterior, fase_nova, motivo
      ) VALUES ($1, $2, NULL, $3, 'Criado automaticamente via WhatsApp IA')
    `, [tenant_id, projeto.id, fase_projeto || 'prospeccao']);

    logger.info(`[CRM Bridge] Projeto #${projeto.numero} criado (fase: ${fase_projeto})`);
    return projeto;
  }

  /**
   * Atualiza fase de um projeto existente
   */
  async atualizarFaseProjeto(projetoId, novaFase, motivo, userId = null) {
    const current = await db.query(
      `SELECT fase_projeto, tenant_id FROM pedido WHERE id = $1`, [projetoId]
    );

    if (current.rows.length === 0) throw new Error(`Projeto #${projetoId} não encontrado`);

    const faseAnterior = current.rows[0].fase_projeto;
    const tenantId = current.rows[0].tenant_id;

    await db.query(
      `UPDATE pedido SET fase_projeto = $1, updated_at = NOW() WHERE id = $2`,
      [novaFase, projetoId]
    );

    await db.query(`
      INSERT INTO fase_projeto_historico (tenant_id, pedido_id, fase_anterior, fase_nova, motivo, user_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [tenantId, projetoId, faseAnterior, novaFase, motivo, userId]);

    logger.info(`[CRM Bridge] Projeto #${projetoId}: ${faseAnterior} → ${novaFase}`);
  }
}

module.exports = new CRMBridgeService();
```

### 13.2 Fases do projeto (Kanban)

```
prospeccao → visita_tecnica → orcamento → negociacao → aprovado → em_execucao → concluido
     │                                        │
     └──────── perdido ◄──────────────────────┘
```

| Fase | Descrição | Quem atua |
|---|---|---|
| `prospeccao` | Lead qualificado, aguardando contato do rep | IA criou automaticamente |
| `visita_tecnica` | Visita ao local agendada/realizada | Representante |
| `orcamento` | Orçamento em elaboração | Representante |
| `negociacao` | Orçamento apresentado, em negociação | Representante |
| `aprovado` | Cliente aprovou, aguarda execução | Representante |
| `em_execucao` | Projeto em andamento | Representante |
| `concluido` | Entregue ao cliente | Representante |
| `perdido` | Não evoluiu | Representante |

---

## 14. Sistema de Filas — BullMQ Workers

### 14.1 Conexão Redis — `src/config/redis.js`

```javascript
// src/config/redis.js

const Redis = require('ioredis');

const connection = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,  // necessário para BullMQ
  retryStrategy: (times) => Math.min(times * 100, 3000)
});

connection.on('connect', () => console.log('✅ Redis conectado'));
connection.on('error', (err) => console.error('❌ Redis erro:', err.message));

module.exports = connection;
```

### 14.2 Message Worker — `message.worker.js`

```javascript
// src/whatsapp/workers/message.worker.js

const { Queue, Worker } = require('bullmq');
const connection = require('../../config/redis');
const orchestrator = require('../services/orchestrator.service');
const logger = require('../../shared/utils/logger');

// ── Fila de mensagens recebidas ──
const messageQueue = new Queue('whatsapp-messages', { connection });

// ── Worker ──
const messageWorker = new Worker('whatsapp-messages', async (job) => {
  logger.info(`[Worker] Processando msg: ${job.id}`);
  await orchestrator.processMessage(job.data);
}, {
  connection,
  concurrency: 5,
  limiter: {
    max: parseInt(process.env.RATE_LIMIT_MESSAGES_PER_MINUTE || '30'),
    duration: 60000
  }
});

messageWorker.on('completed', (job) => {
  logger.debug(`[Worker] ✅ Job ${job.id} completado`);
});

messageWorker.on('failed', (job, err) => {
  logger.error(`[Worker] ❌ Job ${job.id} falhou:`, err.message);
});

module.exports = { messageQueue, messageWorker };
```

### 14.3 Send Worker — `send.worker.js`

```javascript
// src/whatsapp/workers/send.worker.js

const { Queue, Worker } = require('bullmq');
const connection = require('../../config/redis');
const evolutionService = require('../services/evolution.service');
const messageService = require('../services/message.service');
const logger = require('../../shared/utils/logger');

// ── Fila de envio ──
const sendQueue = new Queue('whatsapp-send', { connection });

// ── Worker ──
const sendWorker = new Worker('whatsapp-send', async (job) => {
  const { telefone, conteudo, mensagemId, tipo } = job.data;

  try {
    await evolutionService.sendText(telefone, conteudo);

    if (mensagemId) {
      await messageService.updateStatus(mensagemId, 'enviada');
    }

    logger.info(`[Send Worker] ✅ Enviado para ${telefone.slice(-4)}`);
  } catch (error) {
    logger.error(`[Send Worker] ❌ Erro: ${error.message}`);

    if (mensagemId) {
      await messageService.updateStatus(mensagemId, 'erro', error.message);
    }

    throw error; // BullMQ vai retry
  }
}, {
  connection,
  concurrency: 3,
  limiter: {
    max: 20,
    duration: 60000
  }
});

module.exports = { sendQueue, sendWorker };
```

---

## 15. Follow-up Automático

### 15.1 `followup.worker.js`

```javascript
// src/whatsapp/workers/followup.worker.js

const { Queue, Worker } = require('bullmq');
const connection = require('../../config/redis');
const db = require('../../config/database');
const { sendQueue } = require('./send.worker');
const templateService = require('../services/template.service');
const conversationService = require('../services/conversation.service');
const logger = require('../../shared/utils/logger');

const FIRST_FOLLOWUP_HOURS = parseInt(process.env.FOLLOWUP_FIRST_HOURS || '72');
const SECOND_FOLLOWUP_HOURS = parseInt(process.env.FOLLOWUP_SECOND_HOURS || '168');
const CLOSE_HOURS = parseInt(process.env.FOLLOWUP_CLOSE_HOURS || '336');

// ── Fila com scheduler ──
const followupQueue = new Queue('whatsapp-followup', { connection });

// ── Worker (roda a cada hora) ──
const followupWorker = new Worker('whatsapp-followup', async (job) => {
  logger.info('[Follow-up] Verificando conversas paradas...');

  // ── Follow-up 1 (3 dias) ──
  const conversas3d = await db.query(`
    SELECT c.id, c.tenant_id, co.telefone, co.nome_push, co.nome_informado
    FROM wpp_conversa c
    JOIN wpp_contato co ON co.id = c.contato_id
    WHERE c.estado IN ('ia_ativa', 'ia_qualificou')
      AND c.ultima_msg_at < NOW() - INTERVAL '${FIRST_FOLLOWUP_HOURS} hours'
      AND c.ultima_msg_at > NOW() - INTERVAL '${FIRST_FOLLOWUP_HOURS + 24} hours'
      AND co.aceita_msgs = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM wpp_mensagem m
        WHERE m.conversa_id = c.id
          AND m.remetente = 'sistema'
          AND m.conteudo LIKE '%followup_3d%'
      )
  `);

  for (const conv of conversas3d.rows) {
    const nome = conv.nome_informado || conv.nome_push || 'Olá';
    const msg = await templateService.render(conv.tenant_id, 'followup_3d', { nome });

    await sendQueue.add('send-followup', {
      telefone: conv.telefone,
      conteudo: msg
    }, {
      delay: Math.random() * 300000 // 0-5min delay aleatório
    });

    logger.info(`[Follow-up] 3d enviado para ${conv.telefone.slice(-4)}`);
  }

  // ── Follow-up 2 (7 dias) ──
  const conversas7d = await db.query(`
    SELECT c.id, c.tenant_id, c.resumo_ia,
           co.telefone, co.nome_push, co.nome_informado
    FROM wpp_conversa c
    JOIN wpp_contato co ON co.id = c.contato_id
    WHERE c.estado IN ('ia_ativa', 'ia_qualificou')
      AND c.ultima_msg_at < NOW() - INTERVAL '${SECOND_FOLLOWUP_HOURS} hours'
      AND c.ultima_msg_at > NOW() - INTERVAL '${SECOND_FOLLOWUP_HOURS + 24} hours'
      AND co.aceita_msgs = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM wpp_mensagem m
        WHERE m.conversa_id = c.id
          AND m.remetente = 'sistema'
          AND m.conteudo LIKE '%followup_7d%'
      )
  `);

  for (const conv of conversas7d.rows) {
    const nome = conv.nome_informado || conv.nome_push || 'Olá';
    const resumo = conv.resumo_ia || 'o projeto';
    const msg = await templateService.render(conv.tenant_id, 'followup_7d', { nome, resumo });

    await sendQueue.add('send-followup', {
      telefone: conv.telefone,
      conteudo: msg
    }, {
      delay: Math.random() * 300000
    });

    logger.info(`[Follow-up] 7d enviado para ${conv.telefone.slice(-4)}`);
  }

  // ── Encerrar conversas paradas há 14+ dias ──
  const encerradas = await db.query(`
    UPDATE wpp_conversa
    SET estado = 'perdida', encerrada_at = NOW(), updated_at = NOW()
    WHERE estado IN ('ia_ativa', 'ia_qualificou', 'aguardando_humano')
      AND ultima_msg_at < NOW() - INTERVAL '${CLOSE_HOURS} hours'
    RETURNING id
  `);

  if (encerradas.rowCount > 0) {
    logger.info(`[Follow-up] ${encerradas.rowCount} conversas marcadas como perdidas`);
  }

}, { connection });

// ── Agendar execução a cada hora ──
async function scheduleFollowup() {
  // Limpar jobs agendados antigos
  const repeatableJobs = await followupQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    await followupQueue.removeRepeatableByKey(job.key);
  }

  // Agendar novo
  await followupQueue.add('check-followups', {}, {
    repeat: { pattern: '0 * * * *' }  // a cada hora, minuto 0
  });

  logger.info('[Follow-up] Scheduler configurado (a cada hora)');
}

module.exports = { followupQueue, followupWorker, scheduleFollowup };
```

---

## 16. Campanhas em Massa

### 16.1 `campaign.worker.js`

```javascript
// src/whatsapp/workers/campaign.worker.js

const { Queue, Worker } = require('bullmq');
const connection = require('../../config/redis');
const db = require('../../config/database');
const { sendQueue } = require('./send.worker');
const templateService = require('../services/template.service');
const logger = require('../../shared/utils/logger');

const campaignQueue = new Queue('whatsapp-campaigns', { connection });

const campaignWorker = new Worker('whatsapp-campaigns', async (job) => {
  const { campanhaId } = job.data;

  // Carregar campanha
  const campanha = await db.query(
    `SELECT c.*, t.conteudo AS template_conteudo, t.variaveis
     FROM wpp_campanha c
     JOIN wpp_template t ON t.id = c.template_id
     WHERE c.id = $1`,
    [campanhaId]
  );

  if (campanha.rows.length === 0) {
    throw new Error(`Campanha #${campanhaId} não encontrada`);
  }

  const camp = campanha.rows[0];

  // Buscar contatos elegíveis
  const contatos = await db.query(`
    SELECT wc.id, wc.telefone, wc.nome_push, wc.nome_informado,
           cl.nome_fantasia
    FROM wpp_contato wc
    LEFT JOIN cliente cl ON cl.id = wc.cliente_id
    WHERE wc.tenant_id = $1
      AND wc.aceita_msgs = TRUE
      AND NOT EXISTS (
        SELECT 1 FROM wpp_campanha_envio ce
        WHERE ce.campanha_id = $2 AND ce.contato_id = wc.id
      )
  `, [camp.tenant_id, campanhaId]);

  // Atualizar status
  await db.query(
    `UPDATE wpp_campanha SET status = 'executando', executada_at = NOW(), total_contatos = $2 WHERE id = $1`,
    [campanhaId, contatos.rows.length]
  );

  // Enfileirar envios com delay escalonado (anti-ban)
  for (let i = 0; i < contatos.rows.length; i++) {
    const contato = contatos.rows[i];
    const nome = contato.nome_informado || contato.nome_push || contato.nome_fantasia || 'Olá';

    // Registrar envio
    const envio = await db.query(
      `INSERT INTO wpp_campanha_envio (campanha_id, contato_id, status)
       VALUES ($1, $2, 'pendente') RETURNING id`,
      [campanhaId, contato.id]
    );

    const msg = camp.template_conteudo.replace(/{nome}/g, nome);

    await sendQueue.add(`campaign-${campanhaId}-${i}`, {
      telefone: contato.telefone,
      conteudo: msg,
      campanha_envio_id: envio.rows[0].id
    }, {
      delay: i * 3000  // 3 segundos entre cada envio (anti-ban)
    });
  }

  logger.info(`[Campaign] Campanha #${campanhaId}: ${contatos.rows.length} envios enfileirados`);

}, { connection, concurrency: 1 });

// ── Campanha de aniversário (roda diariamente) ──
async function campanhaAniversario(tenantId) {
  const aniversariantes = await db.query(`
    SELECT c.id AS cliente_id, c.nome_fantasia, c.data_nascimento,
           wc.id AS contato_id, wc.telefone
    FROM cliente c
    JOIN wpp_contato wc ON wc.cliente_id = c.id
    WHERE c.tenant_id = $1
      AND EXTRACT(MONTH FROM c.data_nascimento) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM c.data_nascimento) = EXTRACT(DAY FROM CURRENT_DATE)
      AND wc.aceita_msgs = TRUE
      AND c.ativo = TRUE
  `, [tenantId]);

  for (const cliente of aniversariantes.rows) {
    const msg = await templateService.render(tenantId, 'aniversario', {
      nome: cliente.nome_fantasia
    });

    await sendQueue.add('birthday-msg', {
      telefone: cliente.telefone,
      conteudo: msg
    }, {
      delay: Math.random() * 3600000  // espalhar ao longo de 1h
    });
  }

  logger.info(`[Campaign] Aniversário: ${aniversariantes.rows.length} mensagens enfileiradas`);
}

module.exports = { campaignQueue, campaignWorker, campanhaAniversario };
```

---

## 17. API REST — Endpoints do Painel

### 17.1 Rotas completas — `conversa.routes.js`

```javascript
// src/whatsapp/routes/conversa.routes.js

const router = require('express').Router();
const auth = require('../../shared/middleware/auth.middleware');
const ConversaController = require('../controllers/conversa.controller');

const c = new ConversaController();

// Listar conversas com filtros
router.get('/api/whatsapp/conversas', auth, (req, res) => c.listar(req, res));

// Detalhe de uma conversa (com mensagens)
router.get('/api/whatsapp/conversas/:id', auth, (req, res) => c.detalhe(req, res));

// Assumir conversa (takeover humano)
router.patch('/api/whatsapp/conversas/:id/assumir', auth, (req, res) => c.assumir(req, res));

// Devolver para IA
router.patch('/api/whatsapp/conversas/:id/devolver', auth, (req, res) => c.devolver(req, res));

// Encerrar conversa
router.patch('/api/whatsapp/conversas/:id/encerrar', auth, (req, res) => c.encerrar(req, res));

// Marcar como perdida
router.patch('/api/whatsapp/conversas/:id/perder', auth, (req, res) => c.marcarPerdida(req, res));

module.exports = router;
```

### 17.2 Controller de conversas — `conversa.controller.js`

```javascript
// src/whatsapp/controllers/conversa.controller.js

const conversationService = require('../services/conversation.service');
const messageService = require('../services/message.service');
const evolutionService = require('../services/evolution.service');
const notificationService = require('../services/notification.service');
const { sendQueue } = require('../workers/send.worker');

class ConversaController {

  /**
   * GET /api/whatsapp/conversas
   * Query: ?estado=ia_ativa&page=1&limit=20&search=joao
   */
  async listar(req, res) {
    try {
      const { estado, page = 1, limit = 20, search } = req.query;
      const tenantId = req.user.tenant_id;

      const result = await conversationService.listar({
        tenantId,
        estado,
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/whatsapp/conversas/:id
   * Retorna conversa + últimas 50 mensagens
   */
  async detalhe(req, res) {
    try {
      const conversa = await conversationService.getById(req.params.id);
      if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

      const mensagens = await messageService.getHistorico(conversa.id, 50);

      res.json({ conversa, mensagens });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/whatsapp/conversas/:id/assumir
   * Representante assume a conversa (IA para de responder)
   */
  async assumir(req, res) {
    try {
      const conversaId = req.params.id;
      const userId = req.user.id;

      await conversationService.assumir(conversaId, userId);

      res.json({ success: true, message: 'Conversa assumida' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/whatsapp/conversas/:id/devolver
   * Devolve conversa para a IA
   */
  async devolver(req, res) {
    try {
      await conversationService.devolver(req.params.id);
      res.json({ success: true, message: 'Conversa devolvida para IA' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/whatsapp/conversas/:id/encerrar
   */
  async encerrar(req, res) {
    try {
      await conversationService.updateEstado(req.params.id, 'encerrada');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /api/whatsapp/conversas/:id/perder
   */
  async marcarPerdida(req, res) {
    try {
      const { motivo } = req.body;
      await conversationService.updateEstado(req.params.id, 'perdida');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = ConversaController;
```

### 17.3 Envio de mensagem pelo representante

```javascript
// src/whatsapp/controllers/mensagem.controller.js

const messageService = require('../services/message.service');
const conversationService = require('../services/conversation.service');
const contactService = require('../services/contact.service');
const { sendQueue } = require('../workers/send.worker');

class MensagemController {

  /**
   * POST /api/whatsapp/conversas/:id/enviar
   * Body: { texto: "mensagem aqui" }
   */
  async enviarTexto(req, res) {
    try {
      const conversaId = req.params.id;
      const { texto } = req.body;
      const userId = req.user.id;

      if (!texto || texto.trim().length === 0) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
      }

      const conversa = await conversationService.getById(conversaId);
      if (!conversa) return res.status(404).json({ error: 'Conversa não encontrada' });

      const contato = await contactService.getById(conversa.contato_id);

      // Salvar mensagem no DB
      const mensagem = await messageService.create({
        tenant_id: conversa.tenant_id,
        conversa_id: conversaId,
        contato_id: contato.id,
        direcao: 'outbound',
        tipo: 'texto',
        remetente: 'humano',
        conteudo: texto,
        status: 'processando'
      });

      // Enfileirar para envio
      await sendQueue.add('send-human-msg', {
        telefone: contato.telefone,
        conteudo: texto,
        mensagemId: mensagem.id
      });

      // Atualizar contadores
      await conversationService.incrementMsgCount(conversaId, 'humano');
      await conversationService.updateLastMsg(conversaId);

      res.json({ success: true, mensagem });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MensagemController;
```

### 17.4 Dashboard — `dashboard.controller.js`

```javascript
// src/whatsapp/controllers/dashboard.controller.js

const db = require('../../config/database');

class DashboardController {

  /**
   * GET /api/whatsapp/dashboard
   * Retorna métricas agregadas do período
   * Query: ?periodo=30 (últimos 30 dias)
   */
  async resumo(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const dias = parseInt(req.query.periodo || '30');

      const result = await db.query(`
        SELECT
          COUNT(*) AS total_conversas,
          COUNT(*) FILTER (WHERE estado IN ('ia_qualificou', 'convertida', 'em_andamento', 'transferida'))
            AS leads_qualificados,
          COUNT(*) FILTER (WHERE estado = 'convertida')
            AS convertidas,
          COUNT(*) FILTER (WHERE estado = 'perdida')
            AS perdidas,
          COUNT(*) FILTER (WHERE estado IN ('nova', 'ia_ativa'))
            AS em_atendimento_ia,
          COUNT(*) FILTER (WHERE estado = 'humano_ativo')
            AS em_atendimento_humano,
          ROUND(AVG(tempo_primeira_resp_seg) FILTER (WHERE tempo_primeira_resp_seg IS NOT NULL))
            AS tempo_medio_primeira_resp,
          SUM(tokens_consumidos) AS total_tokens,
          SUM(total_msgs_lead) AS total_msgs_recebidas,
          SUM(total_msgs_ia + total_msgs_humano) AS total_msgs_enviadas
        FROM wpp_conversa
        WHERE tenant_id = $1
          AND created_at >= NOW() - INTERVAL '${dias} days'
      `, [tenantId]);

      // Taxa de conversão
      const dados = result.rows[0];
      dados.taxa_qualificacao = dados.total_conversas > 0
        ? ((dados.leads_qualificados / dados.total_conversas) * 100).toFixed(1)
        : 0;

      // Custo estimado de tokens (GPT-4o-mini)
      dados.custo_estimado_reais = (
        (dados.total_tokens || 0) * 0.00000015 * 6 // input médio
      ).toFixed(2);

      res.json(dados);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/whatsapp/dashboard/funil
   * Dados para gráfico de funil
   */
  async funil(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const dias = parseInt(req.query.periodo || '30');

      const result = await db.query(`
        SELECT estado, COUNT(*) AS total
        FROM wpp_conversa
        WHERE tenant_id = $1
          AND created_at >= NOW() - INTERVAL '${dias} days'
        GROUP BY estado
        ORDER BY
          CASE estado
            WHEN 'nova' THEN 1
            WHEN 'ia_ativa' THEN 2
            WHEN 'ia_qualificou' THEN 3
            WHEN 'humano_ativo' THEN 4
            WHEN 'em_andamento' THEN 5
            WHEN 'convertida' THEN 6
            WHEN 'perdida' THEN 7
            WHEN 'encerrada' THEN 8
          END
      `, [tenantId]);

      res.json(result.rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = DashboardController;
```

---

## 18. Notificações em Tempo Real

### 18.1 `notification.service.js`

```javascript
// src/whatsapp/services/notification.service.js

const qualificationService = require('./qualification.service');
const logger = require('../../shared/utils/logger');

class NotificationService {

  constructor() {
    this.io = null; // Será setado pelo server.js
  }

  /**
   * Configura Socket.IO (chamado pelo server.js)
   */
  setSocketIO(io) {
    this.io = io;
    logger.info('[Notification] Socket.IO configurado');
  }

  /**
   * Notifica nova mensagem recebida (para o painel)
   */
  async notificarNovaMensagem(conversa, mensagem) {
    if (!this.io) return;

    this.io.to(`tenant-${conversa.tenant_id}`).emit('nova-mensagem', {
      conversa_id: conversa.id,
      mensagem: {
        id: mensagem.id,
        conteudo: mensagem.conteudo,
        remetente: mensagem.remetente,
        created_at: mensagem.created_at
      }
    });
  }

  /**
   * Notifica lead qualificado (notificação principal para o representante)
   */
  async notificarLeadQualificado({ conversa, contato, dados, resumo, projeto }) {
    const emoji = qualificationService.getEmoji(dados.classificacao);

    const notification = {
      tipo: 'lead_qualificado',
      conversa_id: conversa.id,
      projeto_id: projeto.id,
      projeto_numero: projeto.numero,
      classificacao: dados.classificacao,
      score: dados.score,
      contato: {
        nome: dados.nome || contato.nome_informado || contato.nome_push,
        telefone: contato.telefone,
        empresa: dados.empresa || contato.empresa
      },
      dados: {
        tipo_projeto: dados.tipo_projeto,
        dimensao: dados.dimensao,
        area_m2: dados.area_m2,
        cidade: dados.cidade,
        uf: dados.uf,
        prazo: dados.prazo,
        uso_finalidade: dados.uso_finalidade
      },
      resumo,
      mensagem: `${emoji} Lead ${dados.classificacao?.toUpperCase()} qualificado (${dados.score}pts): ` +
        `${dados.tipo_projeto || 'Projeto'} ${dados.dimensao || ''} em ${dados.cidade || 'N/I'}/${dados.uf || ''}. ` +
        `Prazo: ${dados.prazo || 'N/I'}`,
      created_at: new Date()
    };

    // Emitir via Socket.IO
    if (this.io) {
      this.io.to(`tenant-${conversa.tenant_id}`).emit('lead-qualificado', notification);
    }

    logger.info(`[Notification] 🔔 Lead qualificado notificado: ${notification.mensagem}`);

    // TODO: Integrar push notification (Firebase/OneSignal) para mobile
    // TODO: Integrar email de notificação
  }
}

module.exports = new NotificationService();
```

### 18.2 Setup Socket.IO no server

```javascript
// src/server.js (trecho relevante)

const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const notificationService = require('./whatsapp/services/notification.service');

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*' }
});

// Configurar notificações
notificationService.setSocketIO(io);

// Autenticação Socket.IO
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // TODO: verificar JWT e extrair tenant_id
  const tenantId = 1; // simplificado
  socket.tenantId = tenantId;
  next();
});

io.on('connection', (socket) => {
  // Entrar na sala do tenant
  socket.join(`tenant-${socket.tenantId}`);
  console.log(`🔌 Socket conectado: tenant-${socket.tenantId}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Socket desconectado`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 CRM-Rep rodando na porta ${PORT}`);
});
```

---

## 19. Segurança, LGPD e Rate Limiting

### 19.1 Checklist de segurança

| Item | Status | Implementação |
|---|---|---|
| API Keys em `.env` | 🔴 Configurar | Nunca commitar no git |
| Webhook autenticado | ✅ Implementado | `webhook-auth.middleware.js` |
| Rate limiting | ✅ Implementado | BullMQ limiter |
| Opt-out LGPD | ✅ Implementado | Comando "sair" no orquestrador |
| Multi-tenancy | ✅ Implementado | `tenant_id` em todas as tabelas |
| JWT no painel | 🔴 Implementar | `auth.middleware.js` |
| HTTPS | 🔴 Configurar | Nginx + Let's Encrypt |
| Sanitização de input | 🔴 Implementar | Validar conteúdo de mensagens |

### 19.2 Opt-out (LGPD Art. 18)

O lead pode enviar qualquer uma dessas palavras para parar de receber mensagens:
- `sair`, `parar`, `cancelar`, `stop`, `pare`, `não quero mais`

Ao receber opt-out:
1. Campo `aceita_msgs` = `false` no `wpp_contato`
2. Conversa encerrada
3. Mensagem de confirmação enviada
4. Nenhuma campanha ou follow-up será enviado para esse contato

### 19.3 Retenção de dados

```sql
-- Cron job mensal: anonimizar dados de conversas antigas (>12 meses)
UPDATE wpp_contato SET
  nome_push = 'Anonimizado',
  nome_informado = 'Anonimizado',
  email = NULL,
  empresa = NULL,
  foto_url = NULL
WHERE created_at < NOW() - INTERVAL '12 months'
  AND is_cliente = FALSE;
```

---

## 20. Testes — Cenários e Validação

### 20.1 Cenário 1 — Lead novo completo (happy path)

```json
{
  "cenario": "Lead novo qualifica em 5 mensagens",
  "mensagens": [
    {
      "lead": "Oi, vi o anúncio do galpão no Instagram",
      "esperado_ia": "Saudação + perguntar tipo de projeto",
      "dados_extraidos": {},
      "score_esperado": 0
    },
    {
      "lead": "Preciso de um galpão pra guardar máquinas agrícolas",
      "esperado_ia": "Confirmar tipo + perguntar dimensões",
      "dados_extraidos": { "tipo_projeto": "galpão", "uso_finalidade": "armazenagem agrícola" },
      "score_esperado": 30
    },
    {
      "lead": "Acho que uns 15 por 30",
      "esperado_ia": "Confirmar dimensão + perguntar cidade",
      "dados_extraidos": { "dimensao": "15x30m", "area_m2": 450 },
      "score_esperado": 55
    },
    {
      "lead": "Dourados, MS",
      "esperado_ia": "Confirmar cidade + perguntar prazo",
      "dados_extraidos": { "cidade": "Dourados", "uf": "MS" },
      "score_esperado": 75
    },
    {
      "lead": "Quero pra ontem haha, mas acho que em 2 meses",
      "esperado_ia": "Confirmar prazo + informar que representante entrará em contato",
      "dados_extraidos": { "prazo": "2 meses" },
      "score_esperado": 90,
      "qualificado": true,
      "acao_crm": "cliente criado + projeto criado + notificação enviada"
    }
  ]
}
```

### 20.2 Cenário 2 — Lead que pergunta preço

```json
{
  "cenario": "Lead insiste em saber preço",
  "mensagens": [
    { "lead": "Quanto custa um galpão 20x40?", "esperado_ia": "Informar que depende do projeto + perguntar cidade/uso" },
    { "lead": "Mas me dá uma ideia de preço", "esperado_ia": "Faixas gerais + reforçar que rep fará orçamento personalizado" }
  ]
}
```

### 20.3 Cenário 3 — Takeover humano

```
1. Lead envia mensagem → IA responde normalmente
2. Representante clica "Assumir conversa" no painel
3. Lead envia nova mensagem → NÃO vai pra IA, apenas aparece no painel
4. Representante responde pelo painel → vai pro WhatsApp do lead
5. Representante clica "Devolver para IA" → IA retoma
```

### 20.4 Testes automatizados (Jest)

```javascript
// tests/qualification.test.js

const qualificationService = require('../src/whatsapp/services/qualification.service');

describe('QualificationService', () => {

  test('Lead com todos os campos = HOT (90+)', () => {
    const result = qualificationService.avaliar({
      tipo_projeto: 'galpão',
      dimensao: '20x40m',
      area_m2: 800,
      cidade: 'Dourados',
      uf: 'MS',
      prazo: '3 meses',
      uso_finalidade: 'armazém',
      tipo_construcao: 'novo',
      nome: 'João'
    });

    expect(result.score).toBe(100);
    expect(result.qualificado).toBe(true);
    expect(result.classificacao).toBe('hot');
  });

  test('Lead com tipo + dimensão + cidade = WARM (70)', () => {
    const result = qualificationService.avaliar({
      tipo_projeto: 'galpão',
      dimensao: '15x30m',
      cidade: 'Uberlândia'
    });

    expect(result.score).toBe(70);
    expect(result.qualificado).toBe(true);
    expect(result.classificacao).toBe('warm');
  });

  test('Lead só com tipo = COLD (25)', () => {
    const result = qualificationService.avaliar({
      tipo_projeto: 'cobertura'
    });

    expect(result.score).toBe(25);
    expect(result.qualificado).toBe(false);
    expect(result.classificacao).toBe('unknown');
  });

  test('Lead vazio = UNKNOWN (0)', () => {
    const result = qualificationService.avaliar({});

    expect(result.score).toBe(0);
    expect(result.qualificado).toBe(false);
    expect(result.classificacao).toBe('unknown');
  });
});
```

---

## 21. Deploy e Checklist de Go-Live

### 21.1 Checklist pré-deploy

```
INFRAESTRUTURA:
[ ] VPS provisionado (mín. 2vCPU, 4GB RAM)
[ ] Docker e Docker Compose instalados
[ ] Domínio configurado (ex: evo.seudominio.com.br)
[ ] SSL/HTTPS configurado (Nginx + Let's Encrypt)
[ ] Firewall: portas 80, 443, 8080 abertas
[ ] .env preenchido com todas as variáveis

BANCO DE DADOS:
[ ] PostgreSQL rodando
[ ] Tabelas do CRM base existem (tenant, cliente, usuario, pedido)
[ ] Migrations 001-008 executadas sem erro
[ ] Templates iniciais inseridos

EVOLUTION API:
[ ] Container rodando e saudável
[ ] Instância criada
[ ] QR Code escaneado pelo representante
[ ] Estado = "open" (conectado)
[ ] Webhook recebendo eventos (testar com msg de teste)

OPENAI:
[ ] API Key válida e com créditos
[ ] Model gpt-4o-mini acessível
[ ] Testar chamada direta (curl)

AGENTE IA:
[ ] System prompt calibrado com dados da indústria
[ ] Testar 10 cenários de conversa manualmente
[ ] Respostas naturais e no tom esperado
[ ] Qualificação pontuando corretamente
[ ] Fallback funcionando (se GPT falhar)

INTEGRAÇÃO CRM:
[ ] Lead qualificado cria cliente
[ ] Lead qualificado cria projeto com fase 'prospeccao'
[ ] Conversa vincula ao projeto
[ ] Dados de qualificação chegam ao projeto

PAINEL:
[ ] Inbox listando conversas
[ ] Takeover humano funcionando
[ ] Envio de msg pelo painel chegando no WhatsApp
[ ] Socket.IO conectando e recebendo eventos

FILAS E WORKERS:
[ ] Redis rodando
[ ] Message worker processando
[ ] Send worker enviando
[ ] Follow-up scheduler configurado

SEGURANÇA:
[ ] Webhook autenticado
[ ] Opt-out funcionando
[ ] .env NÃO está no git
[ ] Dados isolados por tenant_id
```

### 21.2 Ordem de deploy

```
1. docker compose up -d postgres redis
2. Executar migrations
3. docker compose up -d evolution-api
4. Criar instância + escanear QR Code
5. Testar webhook com mensagem de teste
6. docker compose up -d crm-app
7. Testar fluxo completo (lead → IA → qualificação → CRM)
8. Configurar schedulers (follow-up, aniversário)
9. Monitorar logs por 24h
10. Go-live!
```

### 21.3 Monitoramento

```bash
# Logs em tempo real
docker compose logs -f crm-app

# Status dos containers
docker compose ps

# Métricas Redis (filas)
docker exec redis redis-cli INFO stats

# Verificar filas BullMQ
# (instalar bull-board para dashboard visual)
npm install @bull-board/express @bull-board/api
```

---

## 22. Troubleshooting

### Problema: Webhook não recebe mensagens

```bash
# 1. Verificar se Evolution está conectado
curl http://localhost:8080/instance/connectionState/crm-rep-principal \
  -H "apikey: SUA_CHAVE"

# 2. Verificar webhook configurado
curl http://localhost:8080/instance/fetchInstances \
  -H "apikey: SUA_CHAVE"

# 3. Testar endpoint manualmente
curl -X POST http://localhost:3000/webhook/evolution \
  -H "apikey: SEU_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"event":"messages.upsert","instance":"test","data":{"key":{"remoteJid":"5567999999999@s.whatsapp.net","fromMe":false,"id":"TEST123"},"pushName":"Teste","message":{"conversation":"Mensagem de teste"},"messageType":"conversation"}}'
```

### Problema: IA não responde

```bash
# 1. Verificar API key OpenAI
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# 2. Verificar Redis (filas)
docker exec redis redis-cli PING
docker exec redis redis-cli LLEN bull:whatsapp-messages:wait

# 3. Verificar logs do worker
docker compose logs crm-app | grep "\[Worker\]"
```

### Problema: Mensagem não chega no WhatsApp

```bash
# 1. Verificar fila de envio
docker exec redis redis-cli LLEN bull:whatsapp-send:wait

# 2. Testar envio direto pela Evolution
curl -X POST http://localhost:8080/message/sendText/crm-rep-principal \
  -H "apikey: SUA_CHAVE" \
  -H "Content-Type: application/json" \
  -d '{"number":"5567999999999","text":"Teste direto"}'
```

### Problema: Desconexão do WhatsApp

O WhatsApp pode desconectar por inatividade. Solução:

```javascript
// Cron job: verificar conexão a cada 5 minutos
setInterval(async () => {
  try {
    const state = await evolutionService.getConnectionState();
    if (state !== 'open') {
      logger.warn(`[Health] WhatsApp desconectado! Estado: ${state}`);
      // TODO: notificar administrador
      // TODO: tentar reconectar automaticamente
    }
  } catch (error) {
    logger.error('[Health] Erro ao verificar conexão:', error.message);
  }
}, 5 * 60 * 1000);
```

---

## Dependências (package.json)

```json
{
  "name": "crm-rep-whatsapp-ia",
  "version": "1.0.0",
  "description": "Módulo WhatsApp + IA do CRM-Rep",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest --verbose",
    "migrate": "for f in src/migrations/*.sql; do psql -f $f; done"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.12.0",
    "ioredis": "^5.3.2",
    "bullmq": "^5.1.0",
    "openai": "^4.28.0",
    "axios": "^1.6.7",
    "socket.io": "^4.7.4",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.1",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.0.3"
  }
}
```

---

## Resumo da Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  Lead manda msg no WhatsApp                                 │
│       ↓                                                     │
│  Evolution API recebe (Docker, custo zero)                  │
│       ↓                                                     │
│  Webhook → BullMQ (fila async, resiliente)                  │
│       ↓                                                     │
│  Orquestrador decide rota (IA vs Humano)                    │
│       ↓                                                     │
│  GPT-4o-mini qualifica em ~3-5 msgs (R$0,009/conversa)      │
│       ↓                                                     │
│  Lead qualificado → Cliente + Projeto criados no CRM        │
│       ↓                                                     │
│  Representante notificado em tempo real (Socket.IO)         │
│       ↓                                                     │
│  Rep assume quando quiser (takeover) ou IA continua         │
│       ↓                                                     │
│  Follow-ups automáticos (3d, 7d) + campanhas programadas    │
│                                                             │
│  CUSTO OPERACIONAL: ~R$ 80-160/mês                          │
│  PREÇO COBRADO: R$ 397/mês                                  │
│  MARGEM: 60-80%                                             │
│                                                             │
│  Arquivos: ~25 arquivos | Linhas: ~3.000 | Tabelas: 6 novas│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

*Documento gerado em Fevereiro/2026 — CRM-Rep v1.0*
*Para dúvidas técnicas: consultar arquitetura original em `crm_rep_whatsapp_ia_arquitetura.md`*
