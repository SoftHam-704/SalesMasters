# 🎓 ADAPTAÇÃO DO CONTROLE DE ACESSOS PARA APP ESCOLAR

> **Guia prático para implementar o sistema de controle de acessos em um sistema de controle escolar**

---

## 🏫 ARQUITETURA PROPOSTA

```
┌─────────────────────────────────────────────────────────┐
│                    MASTER DATABASE                       │
│  • escolas (tenants - cada escola é um cliente)         │
│  • usuarios_portal (acesso ao portal administrativo)    │
│  • sessoes_ativas                                       │
│  • mensalidades_licenca                                 │
└─────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐   ┌──────────┐
     │ ESCOLA A │   │ ESCOLA B │   │ ESCOLA C │
     │ Schema   │   │ Schema   │   │ Schema   │
     │ usuarios │   │ usuarios │   │ usuarios │
     │ grupos   │   │ grupos   │   │ grupos   │
     │ permissoes│  │ permissoes│  │ permissoes│
     │ alunos   │   │ alunos   │   │ alunos   │
     │ etc...   │   │ etc...   │   │ etc...   │
     └──────────┘   └──────────┘   └──────────┘
```

---

## 🗄️ SCRIPTS SQL ADAPTADOS

### 1. Tabela MASTER: `escolas`

```sql
-- Tabela de escolas (equivalente a empresas no SalesMasters)
CREATE TABLE escolas (
    id SERIAL PRIMARY KEY,
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200),
    
    -- Dados de contato
    email_contato VARCHAR(150),
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    uf VARCHAR(2),
    
    -- Configurações da Licença
    status VARCHAR(20) DEFAULT 'ATIVO',     -- ATIVO, BLOQUEADO, TRIAL, INADIMPLENTE
    tipo_plano VARCHAR(50) DEFAULT 'BASICO', -- BASICO, PROFISSIONAL, ENTERPRISE
    data_adesao TIMESTAMP DEFAULT NOW(),
    data_vencimento DATE,
    valor_mensalidade DECIMAL(10,2),
    
    -- Limites do plano
    limite_usuarios INTEGER DEFAULT 5,
    limite_alunos INTEGER DEFAULT 100,
    limite_sessoes INTEGER DEFAULT 3,
    bloqueio_multiplas_sessoes BOOLEAN DEFAULT FALSE,
    
    -- Dados de Conexão ao Tenant
    db_host VARCHAR(255),
    db_nome VARCHAR(100),
    db_schema VARCHAR(100) DEFAULT 'public',
    db_usuario VARCHAR(100),
    db_senha VARCHAR(255),
    db_porta INTEGER DEFAULT 5432,
    
    -- Controle
    versao_liberada VARCHAR(20) DEFAULT '1.0.0',
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_escolas_cnpj ON escolas(cnpj);
CREATE INDEX idx_escolas_status ON escolas(status);
```

### 2. Tabela TENANT: `usuarios`

```sql
-- Usuários do sistema escolar
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    sobrenome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    cpf VARCHAR(14),
    
    -- Credenciais
    usuario VARCHAR(50) NOT NULL UNIQUE,    -- Login
    senha VARCHAR(255) NOT NULL,
    
    -- Perfil
    tipo_usuario VARCHAR(20) NOT NULL,      -- ADMIN, PROFESSOR, SECRETARIA, COORDENADOR, RESPONSAVEL
    grupo_id VARCHAR(4),                    -- FK para grupos
    
    -- Flags
    master BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    primeiro_acesso BOOLEAN DEFAULT TRUE,   -- Forçar troca de senha
    
    -- Relacionamentos opcionais
    professor_id INTEGER,                   -- Se for professor
    responsavel_id INTEGER,                 -- Se for responsável
    
    -- Metadados
    foto BYTEA,
    ultimo_login TIMESTAMP,
    criado_em TIMESTAMP DEFAULT NOW(),
    atualizado_em TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
```

### 3. Tabela TENANT: `grupos`

```sql
-- Grupos/Perfis de acesso
CREATE TABLE grupos (
    id VARCHAR(4) PRIMARY KEY,              -- Ex: 'ADM', 'PROF', 'SECR'
    descricao VARCHAR(50) NOT NULL,
    nivel_hierarquia INTEGER DEFAULT 0,     -- Para ordenação de importância
    cor_badge VARCHAR(20) DEFAULT '#3B82F6',-- Cor visual do grupo
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT NOW()
);

-- Grupos padrão para escola
INSERT INTO grupos (id, descricao, nivel_hierarquia, cor_badge) VALUES
    ('ADM', 'Administração', 100, '#EF4444'),
    ('COOR', 'Coordenação', 80, '#F59E0B'),
    ('SEC', 'Secretaria', 60, '#3B82F6'),
    ('PROF', 'Professor', 40, '#10B981'),
    ('RESP', 'Responsável', 20, '#8B5CF6');
```

### 4. Tabela TENANT: `permissoes_menu`

```sql
-- Matriz de permissões por grupo
CREATE TABLE permissoes_menu (
    id SERIAL PRIMARY KEY,
    grupo_id VARCHAR(4) NOT NULL REFERENCES grupos(id),
    
    -- Identificação do menu
    menu_indice INTEGER NOT NULL,           -- Código único do menu
    menu_descricao VARCHAR(100),
    menu_categoria VARCHAR(50),             -- Categoria pai
    
    -- Permissões
    visivel BOOLEAN DEFAULT TRUE,
    pode_inserir BOOLEAN DEFAULT TRUE,
    pode_editar BOOLEAN DEFAULT TRUE,
    pode_excluir BOOLEAN DEFAULT TRUE,
    requer_senha BOOLEAN DEFAULT FALSE,
    
    UNIQUE(grupo_id, menu_indice)
);

CREATE INDEX idx_permissoes_grupo ON permissoes_menu(grupo_id);
```

---

## 📋 MENUS SUGERIDOS PARA ESCOLA

```javascript
const MENUS_ESCOLA = [
    // ========== ACADÊMICO ==========
    { idx: 10, label: 'ACADÊMICO', isParent: true, icon: 'GraduationCap' },
    { idx: 101, label: 'Alunos', icon: 'Users' },
    { idx: 102, label: 'Turmas', icon: 'UsersRound' },
    { idx: 103, label: 'Disciplinas', icon: 'BookOpen' },
    { idx: 104, label: 'Grade Curricular', icon: 'LayoutGrid' },
    { idx: 105, label: 'Horários', icon: 'Clock' },
    
    // ========== PROFESSORES ==========
    { idx: 20, label: 'CORPO DOCENTE', isParent: true, icon: 'Briefcase' },
    { idx: 201, label: 'Professores', icon: 'UserCheck' },
    { idx: 202, label: 'Alocação de Turmas', icon: 'Link' },
    { idx: 203, label: 'Agenda', icon: 'Calendar' },
    
    // ========== AVALIAÇÕES ==========
    { idx: 30, label: 'AVALIAÇÕES', isParent: true, icon: 'ClipboardList' },
    { idx: 301, label: 'Notas', icon: 'FileText' },
    { idx: 302, label: 'Frequência', icon: 'CheckSquare' },
    { idx: 303, label: 'Ocorrências', icon: 'AlertTriangle' },
    { idx: 304, label: 'Boletins', icon: 'FileStack' },
    { idx: 305, label: 'Histórico Escolar', icon: 'ScrollText' },
    
    // ========== FINANCEIRO ==========
    { idx: 40, label: 'FINANCEIRO', isParent: true, icon: 'DollarSign' },
    { idx: 401, label: 'Mensalidades', icon: 'Receipt' },
    { idx: 402, label: 'Boletos', icon: 'CreditCard' },
    { idx: 403, label: 'Inadimplência', icon: 'AlertCircle' },
    { idx: 404, label: 'Relatório Financeiro', icon: 'BarChart2' },
    
    // ========== COMUNICAÇÃO ==========
    { idx: 50, label: 'COMUNICAÇÃO', isParent: true, icon: 'MessageSquare' },
    { idx: 501, label: 'Avisos', icon: 'Bell' },
    { idx: 502, label: 'Agenda de Pais', icon: 'CalendarDays' },
    { idx: 503, label: 'Chat', icon: 'MessagesSquare' },
    
    // ========== CONFIGURAÇÕES ==========
    { idx: 60, label: 'CONFIGURAÇÕES', isParent: true, icon: 'Settings' },
    { idx: 601, label: 'Usuários', icon: 'Users' },
    { idx: 602, label: 'Grupos de Acesso', icon: 'Shield' },
    { idx: 603, label: 'Parâmetros', icon: 'Sliders' },
    { idx: 604, label: 'Dados da Escola', icon: 'Building' },
];
```

---

## 🔐 PERMISSÕES POR TIPO DE USUÁRIO

### Matriz Sugerida

| Menu | ADMIN | COORD | SECRETARIA | PROFESSOR | RESPONSÁVEL |
|------|-------|-------|------------|-----------|-------------|
| Alunos | ✅ Full | ✅ Full | ✅ View/Edit | 🔒 Turmas | 🔒 Filho |
| Turmas | ✅ Full | ✅ Full | ✅ View | ✅ Suas | ❌ |
| Notas | ✅ Full | ✅ Full | ✅ View | ✅ Suas | 🔒 Filho |
| Frequência | ✅ Full | ✅ Full | ✅ View | ✅ Suas | 🔒 Filho |
| Mensalidades | ✅ Full | ✅ View | ✅ Full | ❌ | 🔒 Suas |
| Usuários | ✅ Full | ✅ View | ❌ | ❌ | ❌ |
| Configurações | ✅ Full | ❌ | ❌ | ❌ | ❌ |

### Legenda:
- ✅ Full = Todas as permissões (CRUD)
- ✅ View = Apenas visualização
- ✅ View/Edit = Ver e Editar
- ✅ Suas = Apenas seus próprios registros
- 🔒 = Acesso restrito/filtrado
- ❌ = Sem acesso

---

## 🛠️ CÓDIGO DE REFERÊNCIA

### Hook de Permissões (React)

```jsx
// hooks/usePermissions.js

import { createContext, useContext, useState, useEffect } from 'react';

const PermissionsContext = createContext();

export function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadPermissions() {
            const userId = localStorage.getItem('userId');
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(`/api/v2/system/my-permissions?userId=${userId}`);
                const data = await response.json();
                if (data.success) {
                    setPermissions(data);
                }
            } catch (error) {
                console.error('Erro ao carregar permissões:', error);
            } finally {
                setLoading(false);
            }
        }
        loadPermissions();
    }, []);

    const canAccess = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        
        const perm = permissions.permissions?.find(p => p.indice === menuIndex);
        return perm && !perm.invisivel;
    };

    const canInsert = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        
        const perm = permissions.permissions?.find(p => p.indice === menuIndex);
        return perm?.incluir === true;
    };

    const canEdit = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        
        const perm = permissions.permissions?.find(p => p.indice === menuIndex);
        return perm?.modificar === true;
    };

    const canDelete = (menuIndex) => {
        if (!permissions) return false;
        if (permissions.master) return true;
        
        const perm = permissions.permissions?.find(p => p.indice === menuIndex);
        return perm?.excluir === true;
    };

    return (
        <PermissionsContext.Provider value={{
            permissions,
            loading,
            canAccess,
            canInsert,
            canEdit,
            canDelete,
            isMaster: permissions?.master || false,
            isGerencia: permissions?.isGerencia || false
        }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export const usePermissions = () => useContext(PermissionsContext);
```

### Componente de Rota Protegida

```jsx
// components/ProtectedRoute.jsx

import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';

export function ProtectedRoute({ menuIndex, children, fallback = '/sem-acesso' }) {
    const { canAccess, loading } = usePermissions();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>;
    }

    if (!canAccess(menuIndex)) {
        return <Navigate to={fallback} replace />;
    }

    return children;
}

// Uso no App.jsx:
// <Route path="/alunos" element={
//     <ProtectedRoute menuIndex={101}>
//         <AlunosPage />
//     </ProtectedRoute>
// } />
```

### Botões Condicionais

```jsx
// Exemplo de uso em uma página

import { usePermissions } from '../hooks/usePermissions';

function AlunosPage() {
    const { canInsert, canEdit, canDelete } = usePermissions();
    const MENU_ALUNOS = 101;

    return (
        <div>
            <header>
                <h1>Alunos</h1>
                
                {canInsert(MENU_ALUNOS) && (
                    <button onClick={handleNovoAluno}>
                        + Novo Aluno
                    </button>
                )}
            </header>

            <table>
                {alunos.map(aluno => (
                    <tr key={aluno.id}>
                        <td>{aluno.nome}</td>
                        <td>
                            {canEdit(MENU_ALUNOS) && (
                                <button onClick={() => handleEdit(aluno)}>Editar</button>
                            )}
                            {canDelete(MENU_ALUNOS) && (
                                <button onClick={() => handleDelete(aluno)}>Excluir</button>
                            )}
                        </td>
                    </tr>
                ))}
            </table>
        </div>
    );
}
```

---

## 📁 ESTRUTURA DE PASTAS SUGERIDA

```
escola-app/
├── backend/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── groups.routes.js
│   │   ├── alunos.routes.js
│   │   ├── turmas.routes.js
│   │   └── ...
│   ├── middleware/
│   │   ├── sessionMiddleware.js
│   │   └── permissionMiddleware.js
│   ├── utils/
│   │   ├── db.js
│   │   └── session.js
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login/
│   │   │   ├── Sidebar/
│   │   │   └── ProtectedRoute/
│   │   ├── hooks/
│   │   │   └── usePermissions.js
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── UserManagementPage.jsx
│   │   │   │   └── GroupsPage.jsx
│   │   │   ├── academico/
│   │   │   │   ├── AlunosPage.jsx
│   │   │   │   └── TurmasPage.jsx
│   │   │   └── ...
│   │   └── App.jsx
│   └── package.json
│
└── database/
    ├── master/
    │   └── 01_create_master_schema.sql
    └── tenant/
        ├── 01_create_usuarios.sql
        ├── 02_create_grupos.sql
        └── 03_create_permissoes.sql
```

---

## ✅ PRÓXIMOS PASSOS

1. [ ] Copiar os arquivos base do SalesMasters
2. [ ] Adaptar os scripts SQL para contexto escolar
3. [ ] Ajustar os menus/índices conforme necessidade
4. [ ] Implementar os endpoints de CRUD
5. [ ] Criar a UI de gestão de usuários
6. [ ] Implementar o hook `usePermissions`
7. [ ] Proteger as rotas com `ProtectedRoute`
8. [ ] Testar a matriz de permissões

---

> **Referência:** `ACCESS_CONTROL_BLUEPRINT.md` contém a documentação técnica completa do sistema original.
