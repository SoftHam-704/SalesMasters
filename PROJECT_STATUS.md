# 📋 Status do Projeto SalesMasters

**Última atualização**: 26/02/2026 11:30

> [!CAUTION]
> **ESTRATÉGIA SEVENREP (BERTOLINI)**:
> 1. **Venda de PROJETOS**, não produtos de prateleira!
> 2. **PRIORIDADE #1**: Automação de WhatsApp (Gargalo principal).
> 3. **CRM**: Mina de ouro de 1.000 clientes sem gestão.

> [!IMPORTANT]
> **REGRA CRÍTICA GERAL**: A partir de agora, TODOS os dados são REAIS.

> - ❌ Sem mock data
> - ✅ Apenas dados do PostgreSQL
> - ✅ Todas as operações devem ser reais (CREATE, UPDATE, DELETE)
> - 🌿 **INICIATIVA GREENFIELD**: Reconstrução do BI e CRM com foco em IA (Gemini 2.0).


---

## ✅ Concluído

### Frontend
- [x] Dashboard Lovable implementado
- [x] Página de Indústrias (Fornecedores) com CRUD completo
- [x] Página de Configurações com 2 abas
- [x] TabControl component
- [x] DatabaseConfig component
- [x] DataMigration component
- [x] React Router configurado
- [x] Navegação funcionando
- [x] Tema Dark/Light
- [x] Design Lovable em todo sistema

### Backend
- [x] Servidor Node.js + Express criado
- [x] Porta 3001
- [x] CORS configurado
- [x] Endpoint `/api/firebird/test` (com limitação de WireCrypt)
- [x] Endpoint `/api/postgres/test` (placeholder)
- [x] Endpoint `/api/health`

### Banco de Dados
- [x] PostgreSQL instalado
- [x] Banco `salesmaster` criado
- [x] Tabela `suppliers` criada
- [x] Scripts SQL em `scripts_bancodedados/`

### Migração de Dados
- [x] Pasta `data/` criada
- [x] CSV de fornecedores exportado do Firebird
- [x] Estrutura do CSV mapeada

### WhatsApp IA (Multitenant)
- [x] Infraestrutura de Banco de Dados instalada em TODOS os schemas (11 schemas)
- [x] Tabelas `wpp_contato`, `wpp_conversa`, `wpp_mensagem`, `wpp_template`, `wpp_campanha`
- [x] Integração de campos de Projeto na tabela `pedidos`
- [x] Script de deploy global automatizado
- [x] **BI Greenfield Foundation**: Sidebar remodelada e página inicial de BI ultra-premium criada.


---

## 🔄 Em Andamento

### WhatsApp IA (Multitenant)
- [ ] Implementação do Orquestrador de Mensagens (Cérebro IA)
- [ ] Configuração da Evolution API (Docker)
- [ ] Bridge de qualificação IA -> Projeto CRM
- [ ] Interface de chat em tempo real no dashboard
- [🔄] **BI Intelligence Greenfield**: Desenvolvimento dos views SQL padronizados.
- [🔄] **CRM Master Evolution**: Pipeline inteligente e Lead Hunter com Gemini.


### Migração de Dados
- [ ] API de importação CSV → PostgreSQL
- [ ] Processar fornecedores.csv
- [ ] Mapear campos Firebird → PostgreSQL
- [ ] Inserir dados na tabela suppliers


---

## 📊 Estrutura de Dados

### Firebird → PostgreSQL

**Tabela: FORNECEDORES → suppliers**

| Firebird | PostgreSQL | Tipo |
|----------|------------|------|
| FOR_CODIGO | id | INTEGER |
| FOR_NOME | name | VARCHAR |
| FOR_ENDERECO | address | VARCHAR |
| FOR_CIDADE | city | VARCHAR |
| FOR_UF | state | VARCHAR(2) |
| FOR_CEP | zip_code | VARCHAR |
| FOR_FONE | phone1 | VARCHAR |
| FOR_FONE2 | phone2 | VARCHAR |
| FOR_CGC | cnpj | VARCHAR |
| FOR_EMAIL | email | VARCHAR |
| FOR_TIPO2 | active | BOOLEAN (A=true, I=false) |

---

## 🗂️ Arquivos de Configuração

### Backend (.env)
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=salesmaster
POSTGRES_USER=postgres
POSTGRES_PASSWORD=***

FIREBIRD_DATABASE=C:\SalesMasters\Dados50\Nova\basesales.fdb
```

### Dados Exportados
- `data/fornecedores.csv` - 11 fornecedores (exemplo visto)

---

## 🎯 Próximos Passos

1. [ ] Criar API de importação CSV
2. [ ] Instalar biblioteca `pg` para PostgreSQL
3. [ ] Instalar biblioteca `csv-parser`
4. [ ] Criar endpoint `/api/import/suppliers`
5. [ ] Processar CSV e inserir no PostgreSQL
6. [ ] Testar importação
7. [ ] Criar interface de importação no frontend

---

## 🔧 Tecnologias

**Frontend:**
- React + Vite
- React Router DOM
- Framer Motion
- Lucide React
- Recharts

**Backend:**
- Node.js
- Express
- CORS
- node-firebird (limitado por WireCrypt)
- dotenv

**Banco de Dados:**
- PostgreSQL (produção)
- Firebird (legado)

---

## 📝 Detalhes Críticos
1. **Modelo de Venda**: Focado em Projetos de Sistemas de Armazenagem (Bertolini).
2. **Interface**: Deve utilizar o formulário especializado `OrderFormProjetos.jsx`.
3. **Fluxo de Dados**: Os pedidos e itens no schema `sevenrep` devem suportar campos específicos de projeto (metragens, especificações técnicas, etc).
4. **Prioridade Máxima (URGENTE)**: Automação de WhatsApp para triagem de leads e atendimento de alta demanda.
5. **Estratégia CRM**: Foco em Gestão de Relacionamento para os 1.000+ clientes inativos (reativação e mimos).
6. **Contrato**: Esforço total na entrega para garantir a satisfação do representante e do grupo.

---

## 🚀 Comandos Úteis

**Frontend:**
```bash
cd frontend
npm run dev  # Porta 5173
```

**Backend:**
```bash
cd backend
node server.js  # Porta 3001
```

**PostgreSQL:**
```bash
psql -U postgres -d salesmaster
```
