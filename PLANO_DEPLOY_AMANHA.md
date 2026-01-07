# 🚀 PLANO DE DEPLOY - SaveInCloud
**Data Prevista:** 08/01/2026 (Madrugada)
**Última Atualização:** 07/01/2026 18:57

---

## 📋 CHECKLIST PRÉ-DEPLOY

### Banco de Dados (JÁ CONFIGURADO ✅)
- [x] PostgreSQL rodando na SaveInCloud
- [x] Host: `node254557-salesmaster.sp1.br.saveincloud.net.br`
- [x] Porta: `13062`
- [x] Banco: `basesales`
- [x] Dados migrados
- [x] Multi-tenancy funcionando

### Local (A FAZER)
- [ ] Build do Frontend (`npm run build`)
- [ ] Verificar `apiConfig.js` apontando para produção
- [ ] Testar build local antes de subir

---

## 🎯 ETAPAS DO DEPLOY

### ETAPA 1: Acessar Painel SaveInCloud
1. Acessar: https://app.saveincloud.com.br
2. Verificar/criar container para aplicação
3. Anotar:
   - IP do servidor
   - Credenciais SSH
   - Versões de Node.js e Python disponíveis

### ETAPA 2: Preparar Servidor
```bash
# Conectar via SSH
ssh usuario@ip-do-servidor

# Verificar requisitos
node --version    # Esperado: 18+ 
python3 --version # Esperado: 3.10+
nginx -v          # Esperado: instalado

# Criar estrutura de diretórios
sudo mkdir -p /var/www/html/salesmasters/{frontend/dist,backend,bi-engine}
sudo chown -R $USER:$USER /var/www/html/salesmasters
```

### ETAPA 3: Configurar Nginx
```bash
# Copiar configuração
sudo nano /etc/nginx/sites-available/salesmasters.softham.com.br
# (colar conteúdo do INSTRUCOES_SAVEINCLOUD.md)

# Habilitar site
sudo ln -s /etc/nginx/sites-available/salesmasters.softham.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### ETAPA 4: Instalar PM2
```bash
sudo npm install -g pm2
```

### ETAPA 5: Build Local e Upload
```powershell
# No Windows (PowerShell)
cd E:\Sistemas_ia\SalesMasters\frontend
npm run build

# Zipar arquivos para upload
# - frontend/dist/*
# - backend/* (sem node_modules)
# - bi-engine/* (sem venv, __pycache__)
```

### ETAPA 6: Upload via SFTP/SCP
```bash
# Exemplo com SCP
scp -r frontend/dist/* usuario@servidor:/var/www/html/salesmasters/frontend/dist/
scp -r backend/* usuario@servidor:/var/www/html/salesmasters/backend/
scp -r bi-engine/* usuario@servidor:/var/www/html/salesmasters/bi-engine/
```

### ETAPA 7: Configurar Variáveis de Ambiente

**Backend Node.js** (`/var/www/html/salesmasters/backend/.env`):
```env
NODE_ENV=production
PORT=3005
MASTER_DB_HOST=node254557-salesmaster.sp1.br.saveincloud.net.br
MASTER_DB_PORT=13062
MASTER_DB_NAME=basesales
MASTER_DB_USER=webadmin
MASTER_DB_PASSWORD=ytAyO0u043
OPENAI_API_KEY=sk-xxx
```

**BI Engine Python** (`/var/www/html/salesmasters/bi-engine/.env`):
```env
ENVIRONMENT=production
DATABASE_URL=postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales
OPENAI_API_KEY=sk-xxx
```

### ETAPA 8: Instalar Dependências no Servidor
```bash
# Node.js
cd /var/www/html/salesmasters/backend
npm install --production

# Python
cd /var/www/html/salesmasters/bi-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### ETAPA 9: Iniciar Serviços com PM2
```bash
# Backend Node.js
pm2 start /var/www/html/salesmasters/backend/server.js \
    --name "salesmasters-node" \
    --cwd /var/www/html/salesmasters/backend

# BI Engine Python
cd /var/www/html/salesmasters/bi-engine
source venv/bin/activate
pm2 start "python -m uvicorn main:app --host 0.0.0.0 --port 8000" \
    --name "salesmasters-python"

# Salvar configuração
pm2 startup
pm2 save
```

### ETAPA 10: Configurar SSL
```bash
sudo certbot --nginx -d salesmasters.softham.com.br
```

### ETAPA 11: Verificar Deploy
```bash
curl https://salesmasters.softham.com.br/
curl https://salesmasters.softham.com.br/api/health
curl https://salesmasters.softham.com.br/bi-api/health
pm2 logs --lines 50
```

---

## ⚠️ PENDÊNCIAS A RESOLVER

### 1. Importação IA (Prioridade ALTA)
- [ ] Corrigir contagem de linhas (mostrou 69 de 2611)
- [ ] Verificar commit da transação
- [ ] Testar se produtos aparecem na listagem após import
- [ ] Debug: ver logs do bi-engine no console

### 2. Frontend apiConfig.js
- [ ] Confirmar URLs de produção estão corretas:
  ```javascript
  PYTHON_API_URL: 'https://salesmasters.softham.com.br/bi-api'
  NODE_API_URL: 'https://salesmasters.softham.com.br'
  ```

### 3. DNS
- [ ] Confirmar que `salesmasters.softham.com.br` aponta para IP da SaveInCloud

---

## 📞 CONTATOS

| Recurso | Contato |
|---------|---------|
| SaveInCloud Suporte | suporte@saveincloud.com.br |
| Painel SaveInCloud | https://app.saveincloud.com.br |

---

## ✅ CRITÉRIOS DE SUCESSO

1. Acessar `https://salesmasters.softham.com.br` e ver tela de login
2. Fazer login com CNPJ real (não teste)
3. Dashboard carregando dados do banco cloud
4. API respondendo em `/api/health`
5. BI Engine respondendo em `/bi-api/health`

---

*Documento criado automaticamente - Continuar de onde parou amanhã!*
