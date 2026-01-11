# 🔧 GUIA DE CONFIGURAÇÃO SSH - SaveInCloud

**Data:** 09/01/2026
**Problema:** O backend está em modo desenvolvimento (não serve o frontend)
**URL:** https://salesmasters.softham.com.br

---

## 🚨 PROBLEMA ATUAL

O sistema está retornando:
```json
{"success":true,"message":"SalesMasters Backend running","version":"1.0.0"}
```

**Causa:** `NODE_ENV` não está definido como `production` no servidor.

---

## 📋 PASSOS PARA CORRIGIR (Via SSH)

### 1. Conectar ao servidor via SSH

```bash
# Acessar o painel SaveInCloud e pegar as credenciais SSH
# Geralmente: ssh root@NODE_ID ou via Web SSH no painel
```

### 2. Verificar diretório da aplicação

```bash
cd /home/jelastic/ROOT
ls -la
# Deve ter: backend/ e frontend/
```

### 3. Verificar arquivo .env

```bash
cat /home/jelastic/ROOT/backend/.env
```

**O arquivo DEVE conter:**
```env
NODE_ENV=production
PORT=8080

MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******

GEMINI_API_KEY=AIzaSy******
OPENAI_API_KEY=sk-proj-******
```

### 4. Se o .env não existir ou estiver errado, criar/corrigir:

```bash
cat > /home/jelastic/ROOT/backend/.env << 'EOF'
NODE_ENV=production
PORT=8080

MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=******

GEMINI_API_KEY=AIzaSy******
OPENAI_API_KEY=sk-proj-******
EOF
```

### 5. Verificar se o frontend está no lugar certo

```bash
ls -la /home/jelastic/ROOT/frontend/
# Deve conter: index.html, assets/, etc.
```

**Se a pasta frontend não existir ou estiver vazia:**
- O frontend precisa ser copiado do DEPLOY_READY

### 6. Reiniciar a aplicação com PM2

```bash
# Ver processos atuais
pm2 status

# Reiniciar a API (se existir)
pm2 restart salesmasters-api

# OU parar tudo e recriar
pm2 delete all
cd /home/jelastic/ROOT/backend
pm2 start server.js --name salesmasters-api

# Salvar configuração
pm2 save
```

### 7. Verificar logs

```bash
pm2 logs salesmasters-api --lines 50
```

### 8. Testar a aplicação

```bash
curl http://localhost:8080
# Deve retornar HTML do frontend (não JSON!)

curl http://localhost:8080/api/health
# Deve retornar JSON de saúde
```

---

## 🔍 CHECKLIST DE VERIFICAÇÃO

- [ ] `.env` existe e tem `NODE_ENV=production`
- [ ] `.env` tem `PORT=8080`
- [ ] Pasta `frontend/` existe e contém `index.html`
- [ ] PM2 está rodando `salesmasters-api`
- [ ] Logs mostram "SalesMasters server running on port 8080"
- [ ] `curl localhost:8080` retorna HTML
- [ ] https://salesmasters.softham.com.br mostra tela de login

---

## ⚠️ POSSÍVEIS PROBLEMAS

### "Cannot find module 'dotenv'"
```bash
cd /home/jelastic/ROOT/backend
npm install
```

### "EADDRINUSE: port 8080 already in use"
```bash
# Ver o que está usando a porta
lsof -i :8080

# Matar processo ou usar PM2 para gerenciar
pm2 delete all
```

### Frontend não encontrado
```bash
# Verificar caminho no server.js (linha 94)
# Deve ser: path.join(__dirname, '../frontend')
ls -la /home/jelastic/ROOT/backend/../frontend/
```

---

## 📝 ESTRUTURA ESPERADA NO SERVIDOR

```
/home/jelastic/ROOT/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── node_modules/
│   ├── .env                 ← IMPORTANTE!
│   ├── utils/
│   │   └── db.js
│   └── ...
└── frontend/
    ├── index.html           ← IMPORTANTE!
    ├── assets/
    │   ├── index-*.js
    │   └── index-*.css
    └── ...
```

---

*Guia criado por Antigravity AI - 09/01/2026*
