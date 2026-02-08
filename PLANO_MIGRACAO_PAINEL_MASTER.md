# Documentação Técnica: Módulo Painel Master (Gestão de Multi-Tenancy)

Este documento descreve os requisitos técnicos, estrutura de dados e endpoints necessários para a implementação do módulo **Painel Master** no Sistema Administrativo da SoftHam.

## 1. Visão Geral
O **Painel Master** é um módulo administrativo exclusivo para superusuários (ex: Hamilton), destinado ao gerenciamento de empresas clientes (Tenants) do sistema SalesMasters. Ele permite cadastrar empresas, gerenciar configurações de banco de dados individuais, controlar status de licenciamento e administrar usuários vinculados a essas empresas.

## 2. Estrutura de Banco de Dados
O módulo requer duas tabelas principais no banco de dados administrativo (Master DB).

### 2.1 Tabela `empresas`
Armazena os dados cadastrais e de configuração técnica de cada cliente.

| Coluna | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | SERIAL / UUID | Sim | Identificador único da empresa. |
| `cnpj` | VARCHAR(20) | Sim | CNPJ (apenas números). Deve ser único. |
| `razao_social` | VARCHAR(255) | Sim | Razão Social da empresa. |
| `nome_fantasia` | VARCHAR(255) | Não | Nome Fantasia. |
| `email_contato` | VARCHAR(255) | Não | Email principal de contato. |
| `telefone` | VARCHAR(50) | Não | Telefone de contato. |
| `status` | VARCHAR(20) | Sim | Valore: `ATIVO`, `BLOQUEADO`, `INADIMPLENTE`, `DEGUSTAÇÃO`. |
| `data_vencimento` | DATE | Não | Data de vencimento da licença/mensalidade. |
| `valor_mensalidade`| DECIMAL(10,2)| Não | Valor da mensalidade em reais. |
| `limite_usuarios` | INTEGER | Sim | Limite de usuários permitidos (Default: 1). |
| `limite_sessoes` | INTEGER | Sim | Limite de sessões simultâneas (Default: 3). |
| `bloqueio_ativo` | CHAR(1) | Sim | Flag para bloqueio BI/Módulos ('S' ou 'N'). |
| `db_host` | VARCHAR(255) | Sim | IP ou Host do banco de dados do cliente. |
| `db_nome` | VARCHAR(100) | Sim | Nome do banco de dados (database name). |
| `db_usuario` | VARCHAR(100) | Sim | Usuário do banco de dados. |
| `db_senha` | VARCHAR(255) | Não | Senha do banco de dados (pode ser criptografada). |
| `db_porta` | INTEGER | Sim | Porta do banco (Default: 5432). |
| `data_adesao` | TIMESTAMP | Sim | Data de cadastro (Default: CURRENT_TIMESTAMP). |

### 2.2 Tabela `usuarios` (No contexto Master)
Gerencia os usuários que têm acesso ao sistema, vinculados a uma empresa.

| Coluna | Tipo | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `id` | SERIAL / UUID | Sim | Identificador do usuário. |
| `empresa_id` | INT / UUID | Sim | Chave estrangeira para `empresas.id`. |
| `nome` | VARCHAR(100) | Sim | Nome do usuário. |
| `sobrenome` | VARCHAR(100) | Não | Sobrenome. |
| `email` | VARCHAR(255) | Sim | Email para login (único). |
| `senha` | VARCHAR(255) | Sim | Hash da senha. |
| `e_admin` | BOOLEAN | Sim | Se possui privilégios administrativos. |
| `ativo` | BOOLEAN | Sim | Se o usuário pode logar (Default: true). |
| `data_criacao` | TIMESTAMP | Sim | Data de criação. |

---

## 3. Endpoints da API (Backend)

**IMPORTANTE: Arquitetura de Migração**
Recomenda-se fortemente que estas APIs sejam **implementadas nativamente no backend do SoftHam ADM**, conectando-se diretamente ao banco de dados Master.
*   **Não utilize** os endpoints do SalesMasters para gerenciamento administrativo.
*   **Motivo:** Segurança e desacoplamento. O software cliente (SalesMasters) não deve conter código capaz de gerenciar ou destruir tenants, mesmo que oculto.

Todas as rotas devem ser protegidas por autenticação e verificação de permissão de **Super Admin** no novo sistema.

### 3.1 Empresas

#### **Listar Empresas e Métricas**
*   **Método:** `GET /api/master/empresas`
*   **Retorno:** Objeto contendo lista de empresas e objeto de métricas (total, ativas, bloqueadas, etc).

#### **Obter Detalhes da Empresa**
*   **Método:** `GET /api/master/empresas/:id`
*   **Parâmetros:** `id` da empresa.

#### **Criar Empresa**
*   **Método:** `POST /api/master/empresas`
*   **Body:** JSON com dados da tabela `empresas`.
*   **Regra:** Validar duplicidade de CNPJ.

#### **Atualizar Empresa**
*   **Método:** `PUT /api/master/empresas/:id`
*   **Body:** Campos a serem atualizados (suporta atualização parcial).

#### **Excluir Empresa**
*   **Método:** `DELETE /api/master/empresas/:id`
*   **Ação:** Remover registro do banco master. **Cuidado:** Definir se deve ou não dropar o banco físico do cliente (geralmente não).

#### **Alterar Status**
*   **Método:** `PATCH /api/master/empresas/:id/status`
*   **Body:** `{ "status": "NOVO_STATUS" }`

#### **Buscar Dados por CNPJ**
*   **Método:** `GET /api/master/buscar-cnpj/:cnpj`
*   **Funcionalidade:**
    1.  Verificar se existe no banco local.
    2.  Se não, consultar API externa (ex: ReceitaWS).
    3.  Retornar dados formatados.

#### **Testar Conexão de Banco**
*   **Método:** `POST /api/master/test-connection`
*   **Body:** `{ db_host, db_nome, db_usuario, db_senha, db_porta }`
*   **Ação:** Tentar estabelecer conexão com o PostgreSQL usando os dados fornecidos e retornar sucesso ou erro.

#### **Switch Tenant (Opcional)**
*   **Método:** `POST /api/master/switch-tenant`
*   **Funcionalidade:** Permite que o admin "entre" no contexto do cliente selecionado.

---

### 3.2 Usuários (Sub-módulo)

#### **Listar Usuários da Empresa**
*   **Método:** `GET /api/master/empresas/:id/usuarios`

#### **Criar Usuário**
*   **Método:** `POST /api/master/empresas/:id/usuarios`
*   **Body:** `{ nome, sobrenome, email, senha, master, ativo }`

#### **Editar Usuário**
*   **Método:** `PUT /api/master/empresas/:id/usuarios/:codigo`

#### **Excluir Usuário**
*   **Método:** `DELETE /api/master/empresas/:id/usuarios/:codigo`

#### **Resetar Senha**
*   **Método:** `PATCH /api/master/empresas/:id/usuarios/:codigo/reset-senha`
*   **Body:** `{ "nova_senha": "..." }`

---

## 4. Requisitos de Interface (Frontend)

### 4.1 Dashboard
*   Exibir **Cards de Métricas** no topo:
    *   Total de Empresas
    *   Ativas
    *   Bloqueadas
    *   Inadimplentes
    *   Degustação

### 4.2 Listagem
*   Tabela ou lista de cards com:
    *   CNPJ (Formatado)
    *   Razão Social e Nome Fantasia
    *   Status (Badge colorido: Verde=Ativo, Vermelho=Bloqueado, etc)
    *   Dados de conexão (resumido: `db_name@host`)
    *   Botões de Ação: Ver Usuários (Expandir), Editar, Bloquear/Ativar, Excluir.

### 4.3 Formulário de Cadastro/Edição
*   **Dados Cadastrais:** CNPJ (com busca automática), Razão Social, Fantasia, Email, Telefone.
*   **Configuração Comercial:** Status, Vencimento, Valor Mensalidade, Limites (usuários/sessões).
*   **Configuração Técnica (Banco de Dados):** Host, Porta, Nome do Banco, Usuário, Senha.
    *   **Botão "Testar Conexão"**: Obrigatório para validar se os dados do banco estão corretos antes de salvar.

### 4.4 Gestão de Usuários (Nested)
*   Ao expandir uma empresa na lista, mostrar sub-lista de usuários cadastrados para aquela empresa.
*   Permitir adicionar/editar/remover usuários dentro desse contexto.
