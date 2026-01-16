# 💬 SALESMASTER CHAT PRO - ROADMAP COMPLETO

**Criado em:** 2026-01-16  
**Status:** Parcialmente Funcional  
**Objetivo:** Tornar o chat uma ferramenta de comunicação interna poderosa e em tempo real

---

## 📊 STATUS ATUAL

### ✅ O que JÁ FUNCIONA:
- [x] Estrutura de banco de dados (tabelas criadas)
- [x] Chat direto (1 para 1)
- [x] Canais de equipe (#Geral, #Vendas)
- [x] Lista de conversas com preview
- [x] Envio de mensagens (texto)
- [x] Contador de não lidas (badge)
- [x] Buscar usuários para nova conversa
- [x] Interface widget flutuante
- [x] **Integração no Sidebar** (botão PRO)

---

## 🎯 FASE 1: FUNDAÇÃO (Crítico)
**Estimativa:** 2-3 horas | **Prioridade:** ALTA

### 1.1 Executar Migration no Servidor
```bash
# No servidor SaveInCloud
node backend/run_chat_migration.js
```

### 1.2 Verificar/Criar Canais Padrão
- [ ] Canal **📢 Geral** - Comunicados da empresa
- [ ] Canal **💰 Vendas** - Discussões comerciais
- [ ] Canal **🏭 [Nome da Indústria]** - Um canal por indústria principal

### 1.3 Popular Participantes nos Canais
- [ ] Adicionar todos os usuários ativos ao canal #Geral automaticamente

---

## 🚀 FASE 2: TEMPO REAL (Game Changer)
**Estimativa:** 4-6 horas | **Prioridade:** ALTA

### 2.1 Implementar WebSocket com Socket.IO
**Objetivo:** Mensagens instantâneas sem polling

#### Backend (`backend/socket_handler.js`)
```javascript
// Estrutura sugerida
const socketIO = require('socket.io');

module.exports = (server) => {
    const io = socketIO(server, { cors: { origin: "*" } });
    
    io.on('connection', (socket) => {
        // Autenticação
        socket.on('auth', (userId) => {
            socket.join(`user_${userId}`);
        });
        
        // Entrar em sala de conversa
        socket.on('join_conversa', (conversaId) => {
            socket.join(`conversa_${conversaId}`);
        });
        
        // Nova mensagem
        socket.on('nova_mensagem', (data) => {
            io.to(`conversa_${data.conversaId}`).emit('mensagem_recebida', data);
        });
        
        // Digitando...
        socket.on('typing', (data) => {
            socket.to(`conversa_${data.conversaId}`).emit('user_typing', data);
        });
    });
    
    return io;
};
```

#### Frontend (`ChatWidget.jsx`)
```javascript
import { io } from 'socket.io-client';

const socket = io(SOCKET_URL);

// Escutar novas mensagens
socket.on('mensagem_recebida', (mensagem) => {
    setMensagens(prev => [...prev, mensagem]);
    playNotificationSound();
});

// Indicador "digitando..."
socket.on('user_typing', ({ userId, nome }) => {
    setTypingUser(nome);
});
```

### 2.2 Dependências Necessárias
```bash
# Backend
npm install socket.io

# Frontend
npm install socket.io-client
```

---

## 🔔 FASE 3: NOTIFICAÇÕES (Engajamento)
**Estimativa:** 3-4 horas | **Prioridade:** MÉDIA

### 3.1 Notificações In-App
- [ ] Toast/Snackbar quando receber mensagem (se não estiver no chat)
- [ ] Som de notificação (opcional, com toggle)
- [ ] Vibração no mobile

### 3.2 Notificações Push (Web Push)
- [ ] Configurar Service Worker
- [ ] Pedir permissão do usuário
- [ ] Enviar push mesmo com navegador fechado

### 3.3 Badge no Título da Página
```javascript
// Quando há mensagens não lidas
document.title = `(${unreadCount}) SalesMaster`;
```

---

## 📎 FASE 4: MÍDIA E ARQUIVOS
**Estimativa:** 4-5 horas | **Prioridade:** MÉDIA

### 4.1 Upload de Imagens
- [ ] Botão de anexar imagem
- [ ] Preview antes de enviar
- [ ] Compressão automática (max 1MB)
- [ ] Armazenamento no servidor ou S3/Cloudinary

### 4.2 Upload de Arquivos
- [ ] PDF, Excel, Word, etc.
- [ ] Ícone baseado no tipo de arquivo
- [ ] Link de download

### 4.3 Pré-visualização de Links
- [ ] Detectar URLs nas mensagens
- [ ] Buscar meta tags (título, imagem, descrição)
- [ ] Exibir card de preview

---

## 😊 FASE 5: UX PREMIUM
**Estimativa:** 3-4 horas | **Prioridade:** MÉDIA

### 5.1 Emoji Picker
```bash
npm install emoji-picker-react
```
- [ ] Botão de emoji no input
- [ ] Picker com categorias
- [ ] Emojis recentes

### 5.2 Reactions (Reações)
- [ ] Reagir a mensagens com emoji (👍 ❤️ 😂 etc.)
- [ ] Mostrar contagem de reações
- [ ] Quem reagiu (tooltip)

### 5.3 Responder Mensagem
- [ ] Swipe para responder (mobile-like)
- [ ] Preview da mensagem original
- [ ] Scroll para mensagem original ao clicar

### 5.4 Editar/Deletar Mensagens
- [ ] Menu de contexto (3 pontinhos)
- [ ] Editar próprias mensagens (até 15 min)
- [ ] Deletar próprias mensagens
- [ ] Indicador "editada" ou "deletada"

---

## 👥 FASE 6: CANAIS AVANÇADOS
**Estimativa:** 3-4 horas | **Prioridade:** BAIXA

### 6.1 Criar Novos Canais
- [ ] Botão "Criar Canal"
- [ ] Definir nome, descrição, ícone
- [ ] Público ou privado

### 6.2 Gerenciar Participantes
- [ ] Adicionar/remover membros
- [ ] Definir administradores
- [ ] Silenciar canal

### 6.3 Canais por Indústria
- [ ] Criar canal automático para cada indústria
- [ ] Apenas vendedores da indústria podem acessar

---

## 🤖 FASE 7: INTEGRAÇÕES INTELIGENTES
**Estimativa:** 4-6 horas | **Prioridade:** BAIXA

### 7.1 Bot de Notificações Automáticas
Mensagens automáticas no canal #Vendas:
- [ ] "🎉 João fechou pedido de R$ 15.000 na Rimef!"
- [ ] "📊 Meta do mês atingida: 85%"
- [ ] "🔥 Novo produto cadastrado: XYZ"

### 7.2 Menções (@usuario)
- [ ] Digitar @ para autocompletar usuários
- [ ] Notificação especial quando mencionado
- [ ] Highlight na mensagem

### 7.3 Comandos Especiais
- [ ] `/status` - Ver status do sistema
- [ ] `/meta` - Ver progresso da meta
- [ ] `/help` - Lista de comandos

---

## 📱 FASE 8: MOBILE FIRST
**Estimativa:** 2-3 horas | **Prioridade:** BAIXA

### 8.1 Responsividade Total
- [ ] Chat full-screen no mobile
- [ ] Swipe gestures
- [ ] Teclado virtual otimizado

### 8.2 PWA Optimized
- [ ] Ícone na home screen
- [ ] Funciona offline (cache de mensagens)
- [ ] Push notifications nativas

---

## 📋 CHECKLIST DE DEPLOY

### Antes de Ativar:
- [ ] Executar migration: `node backend/run_chat_migration.js`
- [ ] Reiniciar backend: `pm2 restart salesmasters-backend`
- [ ] Verificar tabelas no banco: `chat_conversas`, `chat_mensagens`, etc.
- [ ] Testar com 2 usuários diferentes

### Configurações de Produção:
- [ ] Definir SOCKET_URL no `.env`
- [ ] Configurar CORS para WebSocket
- [ ] Limite de rate para evitar spam

---

## 📈 MÉTRICAS DE SUCESSO

| Métrica | Meta |
|---------|------|
| Mensagens por dia | > 50 |
| Usuários ativos no chat | > 70% |
| Tempo de resposta | < 2 min |
| Adoção de canais | > 80% em #Geral |

---

## 🗓️ CRONOGRAMA SUGERIDO

| Fase | Tempo | Quando |
|------|-------|--------|
| Fase 1: Fundação | 2-3h | Imediato |
| Fase 2: Tempo Real | 4-6h | Próxima Sprint |
| Fase 3: Notificações | 3-4h | Próxima Sprint |
| Fase 4: Mídia | 4-5h | Sprint +1 |
| Fase 5: UX Premium | 3-4h | Sprint +1 |
| Fase 6-8: Futuro | 9-13h | Backlog |

---

## 💡 QUICK WINS (Pode fazer já!)

1. **Executar a migration** - 5 minutos
2. **Adicionar som de notificação** - 30 minutos
3. **Badge no título da página** - 15 minutos
4. **Emoji picker simples** - 1 hora

---

**Responsável:** Equipe de Desenvolvimento  
**Última atualização:** 2026-01-16
