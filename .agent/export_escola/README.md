# 📦 Pacote de Controle de Acessos - Pronto para Copiar

## 🚀 Instruções Rápidas

### 1. Copie as pastas para o Student-App:

```
export_escola/
├── backend/           → Copie para: Student-App/backend/
├── database/          → Execute os SQLs no PostgreSQL
└── frontend/          → Copie para: Student-App/frontend/src/
```

### 2. Instale dependências no backend:

```bash
cd Student-App/backend
npm install pg crypto express
```

### 3. Configure o .env:

```env
MASTER_DB_HOST=localhost
MASTER_DB_NAME=escola_master
MASTER_DB_USER=postgres
MASTER_DB_PASSWORD=sua_senha
MASTER_DB_PORT=5432
```

### 4. Execute os SQLs:

1. Primeiro: `01_master_schema.sql` no banco Master
2. Depois: `02_tenant_schema.sql` em cada schema de escola

### 5. Registre as rotas no server.js:

```javascript
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const sessionMiddleware = require('./middleware/sessionMiddleware');

// No seu pool do tenant
app.use(sessionMiddleware);
app.use('/api/v2/auth', authRoutes);
app.use('/api/v2/system', usersRoutes(pool));
```

### 6. No Frontend, envolva o App com o Provider:

```jsx
import { PermissionsProvider } from './hooks/usePermissions';

function App() {
    return (
        <PermissionsProvider>
            {/* suas rotas */}
        </PermissionsProvider>
    );
}
```

## 📋 Menus Predefinidos (Índices)

| Índice | Menu |
|--------|------|
| 10 | ACADÊMICO (Categoria) |
| 101 | Alunos |
| 102 | Turmas |
| 103 | Professores |
| 104 | Disciplinas |
| 20 | AVALIAÇÕES (Categoria) |
| 201 | Notas |
| 202 | Frequência |
| 203 | Boletins |
| 30 | FINANCEIRO (Categoria) |
| 301 | Mensalidades |
| 302 | Boletos |
| 303 | Inadimplência |
| 60 | CONFIGURAÇÕES (Categoria) |
| 601 | Usuários |
| 602 | Parâmetros |

## 🔐 Grupos Padrão

- **ADM** - Administração (acesso total)
- **COOR** - Coordenação
- **SEC** - Secretaria
- **PROF** - Professor

## ✅ Checklist

- [ ] Copiar arquivos
- [ ] Instalar dependências
- [ ] Configurar .env
- [ ] Executar SQLs
- [ ] Registrar rotas
- [ ] Adicionar PermissionsProvider
- [ ] Testar login
