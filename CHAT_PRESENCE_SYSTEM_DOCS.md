# 💬 SalesMaster Chat - Sistema de Presença Online

## 📋 Resumo da Implementação

Sistema completo de chat cross-empresa com rastreamento de presença online (quem está conectado agora).

---

## ✅ Arquivos Criados/Modificados

### **1. Banco de Dados**
- ✅ `CHAT_PRESENCE_SYSTEM.sql` - Script completo SQL
  - Tabela `user_presence`
  - Índices otimizados
  - Funções auxiliares (online, offline, heartbeat, cleanup)
  - View `v_users_with_presence`

### **2. Backend**
- ✅ `chat_endpoints.js` - Novos endpoints adicionados
  - `GET /api/chat/usuarios-online` - Lista usuários com status
  - `POST /api/chat/presence/online` - Marcar online ao login
  - `POST /api/chat/presence/offline` - Marcar offline ao logout ⚠️ CRÍTICO
  - `POST /api/chat/presence/heartbeat` - Manter vivo (30s)
  - `PATCH /api/chat/presence/status` - Alterar status personalizado
  - `GET /api/chat/presence/:userId` - Status de usuário específico
  - `POST /api/chat/presence/cleanup` - Limpar inativos

### **3. Frontend**
- ✅ `useUserPresence.js` - Hook customizado para presença
  - Marca online ao carregar app
  - Heartbeat automático a cada 30s
  - **LOGOUT AUTOMÁTICO** ao fechar janela (`beforeunload`)
  - Usa `sendBeacon` para garantir requisição ao fechar
  - Detecta tab oculta/visível

---

## 🚀 Como Instalar

### **Passo 1: Executar SQL**

No **pgAdmin Query Tool** do banco `basesales`:

```sql
\i 'e:/Sistemas_ia/SalesMasters/scripts_bancodedados/CHAT_PRESENCE_SYSTEM.sql'
```

Ou copiar e colar o conteúdo do arquivo e executar.

**Verificação:**
```sql
-- Ver tabela criada
SELECT * FROM user_presence LIMIT 10;

-- Ver view de usuários
SELECT * FROM v_users_with_presence LIMIT 10;

-- Contar usuários
SELECT COUNT(*) FROM user_presence;
```

---

### **Passo 2: Backend (Automático)**

O backend já está atualizado! Basta reiniciar o servidor Node.js:

```bash
# No terminal do backend
npm run dev
```

**Logs esperados:**
```
💬 Chat Pro endpoints registered
🟢 Presence system endpoints registered
```

---

### **Passo 3: Frontend - Usar o Hook**

No componente principal da app (ex: `App.jsx` ou layout principal):

```javascript
import useUserPresence from '@/hooks/useUserPresence';

function App() {
    const user = JSON.parse(sessionStorage.getItem('user') || '{}');
    
    // Ativar presença online
    useUserPresence(user.id);
    
    return (
        // ... resto do app
    );
}
```

**⚠️ IMPORTANTE:** O hook já cuida de:
- ✅ Marcar online ao entrar
- ✅ Heartbeat automático (30s)
- ✅ **Marcar offline ao fechar janela/tab**
- ✅ Detectar tab oculta

---

## 🎨 Como Usar no Chat

### **Listar Usuários Online**

```javascript
const response = await fetch('/api/chat/usuarios-online', {
    headers: { 'x-user-id': userId }
});

const data = await response.json();

console.log('Online:', data.data.online);
console.log('Away:', data.data.away);
console.log('Busy:', data.data.busy);
console.log('Offline:', data.data.offline);
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "online": [
      {
        "id": 1,
        "nome": "João",
        "sobrenome": "Silva",
        "effective_status": "online",
        "last_activity": "2026-01-28T10:35:00Z",
        "custom_message": null
      }
    ],
    "counts": {
      "online": 5,
      "away": 2,
      "busy": 1,
      "offline": 120,
      "total": 128
    }
  }
}
```

---

### **Filtrar Apenas Online**

```javascript
const response = await fetch('/api/chat/usuarios-online?filter=online', {
    headers: { 'x-user-id': userId }
});
```

---

### **Ver Status de Um Usuário**

```javascript
const response = await fetch(`/api/chat/presence/${userId}`, {
    headers: { 'x-user-id': currentUserId }
});

const data = await response.json();
console.log('Status:', data.data.effective_status); // 'online', 'offline', 'away'
```

---

### **Alterar Meu Status**

```javascript
await fetch('/api/chat/presence/status', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId
    },
    body: JSON.stringify({
        status: 'busy', // 'online', 'offline', 'away', 'busy'
        custom_message: 'Em reunião até 15h'
    })
});
```

---

## 🔄 Limpeza Automática de Inativos

Usuários que ficam mais de **5 minutos** sem atividade são automaticamente marcados como offline.

**Opção 1: Cron Job (Recomendado)**

Configurar no servidor para rodar a cada 5 min:

```bash
# Adicionar ao crontab
*/5 * * * * curl -X POST http://localhost:5000/api/chat/presence/cleanup
```

**Opção 2: Chamar Manualmente**

```javascript
await fetch('/api/chat/presence/cleanup', {
    method: 'POST'
});
```

---

## 🎯 Status Disponíveis

| Status | Ícone | Significado | Como Fica |
|--------|-------|-------------|-----------|
| `online` | 🟢 | Online agora | Ativo há < 2 min |
| `away` | 🟡 | Ausente | Ativo há 2-5 min |
| `busy` | 🔴 | Ocupado/Não perturbe | Manual |
| `offline` | ⚪ | Offline | Inativo > 5 min |

---

## ⚠️ IMPORTANTE: Logout ao Fechar

O hook `useUserPresence` usa **duas estratégias** para garantir logout:

### **1. sendBeacon (Preferido)**
```javascript
navigator.sendBeacon(url, formData);
```
- ✅ Funciona mesmo após página fechar
- ✅ Não bloqueia o fechamento
- ✅ Navegadores modernos

### **2. fetch com keepalive (Fallback)**
```javascript
fetch(url, {
    method: 'POST',
    keepalive: true // Mantém requisição viva
});
```

### **Eventos Tratados:**
- ✅ `beforeunload` - Usuário fecha tab/janela
- ✅ `unload` - Página descarrega
- ✅ `visibilitychange` - Tab fica oculta

---

## 🧪 Testando

### **Teste 1: Marcar Online**

1. Fazer login no sistema
2. Abrir DevTools → Console
3. Verificar log: `🟢 [Presença] Marcado como online`
4. No banco: `SELECT * FROM user_presence WHERE usuario_id = 1;`
5. Deve mostrar `status = 'online'`

### **Teste 2: Heartbeat**

1. Aguardar 30 segundos após login
2. Verificar log: `💓 [Presença] Heartbeat enviado`
3. Verificar `last_activity` atualizado no banco

### **Teste 3: Logout ao Fechar**

1. Estar logado e online
2. **Fechar a aba/janela**
3. Verificar log do backend: `⚪ [CHAT] Usuário X marcado como OFFLINE`
4. No banco: status deve ser `'offline'` e `last_seen` atualizado

### **Teste 4: Listar Online**

1. Ter 2+ usuários logados em abas diferentes
2. Chamar endpoint: `GET /api/chat/usuarios-online`
3. Deve listar ambos como `online`

---

## 📊 Métricas

```sql
-- Quantos online agora?
SELECT COUNT(*) FROM user_presence 
WHERE status = 'online' 
AND last_activity > NOW() - INTERVAL '2 minutes';

-- Quem está online?
SELECT u.nome, p.last_activity, p.device_info
FROM user_nomes u
JOIN user_presence p ON p.usuario_id = u.codigo
WHERE p.status = 'online'
AND p.last_activity > NOW() - INTERVAL '2 minutes';

-- Histórico de última conexão
SELECT nome, last_seen, 
    NOW() - last_seen AS tempo_offline
FROM v_users_with_presence
WHERE effective_status = 'offline'
ORDER BY last_seen DESC;
```

---

## 🐛 Troubleshooting

### **Problema: Usuário fica online mesmo após fechar**

**Causa:** `beforeunload` não disparou ou requisição falhou

**Solução:**
1. Verificar se sendBeacon está disponível: `console.log(navigator.sendBeacon)`
2. Rodar cleanup manual: `POST /api/chat/presence/cleanup`
3. Aguardar 5 min (timeout automático)

### **Problema: Heartbeat não está enviando**

**Causa:** Intervalo não iniciou

**Verificação:**
```javascript
// No console do browser
console.log('Heartbeat ativo?', !!window.__heartbeatInterval);
```

### **Problema: Tabela user_presence não existe**

**Causa:** SQL não foi executado

**Solução:**
```sql
-- Verificar se existe
SELECT EXISTS (
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'user_presence'
);
```

---

## 📝 Próximos Passos

- [x] Criar tabela e funções SQL
- [x] Criar endpoints backend
- [x] Criar hook de presença
- [ ] **Converter ChatWidget para Light Theme**
- [ ] Adicionar indicadores visuais de online/offline
- [ ] Implementar filtro online/offline na lista
- [ ] Adicionar "digitando..." em tempo real
- [ ] Implementar WebSocket (opcional, para tempo real)

---

## 🎨 Design da UI (Próximo)

### **Lista de Usuários**
```
┌────────────────────────────┐
│ 🟢 ONLINE (5 pessoas)      │
├────────────────────────────┤
│ 🟢 João Silva             │
│    Online • São Paulo      │
├────────────────────────────┤
│ 🟡 Maria Costa            │
│    Ausente há 3 min • RJ   │
└────────────────────────────┘
```

### **Status Personalizado**
```
🔴 Pedro Alves
   Ocupado • "Em reunião"
```

---

**Implementado por:** Antigravity AI  
**Data:** 2026-01-28  
**Versão:** 1.0.0  
**Status:** ✅ Backend e Infraestrutura Completos
