# 🚀 SalesMasters

Sistema de gestão para representantes comerciais desenvolvido com React + Vite e PostgreSQL.

## 📋 Sobre o Projeto

SalesMasters é um sistema completo de gestão comercial que permite gerenciar fornecedores, clientes, produtos, pedidos e muito mais. O projeto foi desenvolvido com foco em design premium e experiência do usuário.

## ✨ Funcionalidades Implementadas

### 🏢 Fornecedores
- ✅ CRUD completo (Criar, Ler, Atualizar, Excluir)
- ✅ Busca em tempo real por CNPJ, nome ou razão social
- ✅ Filtro de fornecedores ativos/inativos
- ✅ Paginação (10 registros por página)
- ✅ Formulário com múltiplas abas (Principal, Complemento)
- ✅ Gestão de contatos, descontos e metas
- ✅ Ativar/Desativar fornecedores
- ✅ Badges de status coloridos

### 🎨 Design System
- ✅ Tema Dark/Light com alternância
- ✅ Componentes reutilizáveis
- ✅ Animações com Framer Motion
- ✅ Design responsivo
- ✅ Estilo Lovable AI (premium)

### 🧩 Componentes Reutilizáveis
- `PageHeader` - Cabeçalho de página com ícone e ações
- `DataGrid` - Tabela estilizada com hover e ações
- `StatusBadge` - Badges coloridos para status
- `SearchBar` - Barra de busca com ícone
- `ThemeToggle` - Alternador de tema

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React** 18.3.1
- **Vite** 6.0.5
- **Framer Motion** 11.15.0 (animações)
- **Lucide React** 0.468.0 (ícones)
- **React Router DOM** (navegação)

### Backend (Planejado)
- **Node.js** + **Express**
- **PostgreSQL** (banco de dados)

## 📁 Estrutura do Projeto

```
SalesMasters/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── crud/          # Componentes reutilizáveis
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ThemeProvider.jsx
│   │   │   ├── ThemeToggle.jsx
│   │   │   └── SupplierForm.jsx
│   │   ├── pages/
│   │   │   └── SuppliersLovable.jsx
│   │   ├── styles/
│   │   │   └── global.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── scripts_bancodedados/
│   ├── 01_create_database.sql
│   ├── 02_create_tables.sql
│   ├── 06_create_suppliers_related_tables.sql
│   └── 07_update_fornecedores_table.sql
└── README.md
```

## 🚀 Como Executar

### Pré-requisitos
- Node.js 18+ instalado
- PostgreSQL 14+ instalado
- Git instalado

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/SoftHam-704/SalesMasters.git
cd SalesMasters
```

2. Instale as dependências do frontend:
```bash
cd frontend
npm install
```

3. Execute o frontend:
```bash
npm run dev
```

4. Acesse no navegador:
```
http://localhost:5173
```

### Configuração do Banco de Dados

1. Crie o banco de dados PostgreSQL:
```bash
psql -U postgres
CREATE DATABASE basesales;
```

2. Execute os scripts SQL na ordem:
```bash
psql -U postgres -d basesales -f scripts_bancodedados/01_create_database.sql
psql -U postgres -d basesales -f scripts_bancodedados/02_create_tables.sql
psql -U postgres -d basesales -f scripts_bancodedados/06_create_suppliers_related_tables.sql
psql -U postgres -d basesales -f scripts_bancodedados/07_update_fornecedores_table.sql
```

## 📸 Screenshots

### Tema Light
![Fornecedores - Tema Light](docs/screenshots/suppliers-light.png)

### Tema Dark
![Fornecedores - Tema Dark](docs/screenshots/suppliers-dark.png)

## 🎯 Próximas Funcionalidades

- [ ] Backend API com Node.js + Express
- [ ] Autenticação e autorização
- [ ] Módulo de Clientes
- [ ] Módulo de Produtos
- [ ] Módulo de Pedidos
- [ ] Dashboard com gráficos
- [ ] Relatórios em PDF
- [ ] Exportação para Excel
- [ ] Sincronização offline

## 👨‍💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

## 📝 Licença

Este projeto está sob a licença MIT.

## 👥 Autores

**SoftHam Sistemas**
- Email: softham704@gmail.com
- Telefone: (37) 9 9207-3885

---

Desenvolvido com ❤️ por SoftHam Sistemas
