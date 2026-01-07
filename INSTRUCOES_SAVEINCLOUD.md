# 🚀 Deploy SalesMasters na SaveInCloud

Este documento contém todas as configurações e passos necessários para o deploy da aplicação na SaveInCloud.

---

## 📋 Visão Geral da Arquitetura

A aplicação **SalesMasters** é composta por três camadas que rodam sob o domínio `salesmasters.softham.com.br`:

| Componente | Tecnologia | Porta | Rota de Acesso |
|------------|------------|-------|----------------|
| **Frontend** | React (Vite) | - | `/` (Arquivos estáticos) |
| **Backend Principal** | Node.js/Express | 3005 | `/api/*` |
| **BI Engine** | Python/FastAPI | 8000 | `/bi-api/*` |

---

## 🗂️ Estrutura de Arquivos para Upload

```
/var/www/html/salesmasters/
├── frontend/
│   └── dist/              # Arquivos estáticos do React (build de produção)
├── backend/
│   ├── server.js          # Ponto de entrada Node.js
│   ├── package.json
│   ├── package-lock.json
│   ├── routes/            # Rotas da API
│   ├── services/          # Serviços de negócio
│   └── utils/             # Utilitários
└── bi-engine/
    ├── main.py            # Ponto de entrada FastAPI
    ├── requirements.txt
    ├── services/          # Serviços Python
    ├── models/            # Modelos de dados
    └── utils/             # Utilitários
```

---

## 🔧 1. Configuração do Proxy Reverso (Nginx)

Crie/edite o arquivo `/etc/nginx/sites-available/salesmasters.softham.com.br`:

```nginx
server {
    listen 80;
    server_name salesmasters.softham.com.br;

    # Tamanho máximo de upload (para importações de dados)
    client_max_body_size 50M;

    # Frontend - Single Page Application (React)
    location / {
        root /var/www/html/salesmasters/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Backend (Node.js) - Mapeado para /api
    location /api {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout para operações longas
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # BI Engine (Python) - Mapeado para /bi-api
    location /bi-api {
        rewrite ^/bi-api/(.*) /$1 break;
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeout maior para relatórios pesados
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

**Habilitar o site e testar:**
```bash
sudo ln -s /etc/nginx/sites-available/salesmasters.softham.com.br /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 2. Configuração SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d salesmasters.softham.com.br
```

---

## 🗄️ 3. Banco de Dados (PostgreSQL)

### Credenciais da SaveInCloud
A aplicação utiliza multi-tenancy dinâmico via headers (`x-tenant-db-config`). O banco padrão de autenticação:

| Parâmetro | Valor |
|-----------|-------|
| **Host** | `pg.savein.cloud` |
| **Porta** | `5432` |
| **Banco** | `salesmasters` |
| **Usuário** | *(Fornecido pela SaveInCloud)* |
| **Senha** | *(Fornecido pela SaveInCloud)* |

### Variáveis de Ambiente (Backend Node.js)
Crie o arquivo `/var/www/html/salesmasters/backend/.env`:

```env
# Banco de Dados
DB_HOST=pg.savein.cloud
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=salesmasters

# Configurações de Servidor
NODE_ENV=production
PORT=3005

# API Keys (se aplicável)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
```

### Variáveis de Ambiente (BI Engine Python)
Crie o arquivo `/var/www/html/salesmasters/bi-engine/.env`:

```env
# Banco de Dados
DB_HOST=pg.savein.cloud
DB_PORT=5432
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=salesmasters

# Configurações de Servidor
ENVIRONMENT=production
```

---

## 📦 4. Instalação de Dependências

### Node.js (Backend)
```bash
cd /var/www/html/salesmasters/backend
npm install --production
```

### Python (BI Engine)
```bash
cd /var/www/html/salesmasters/bi-engine
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Dependências do requirements.txt:
```
fastapi==0.115.0
uvicorn==0.32.0
sqlalchemy==2.0.36
psycopg2-binary==2.9.10
pandas==2.2.3
python-dotenv==1.0.1
```

---

## ⚙️ 5. Gestão de Processos (PM2)

### Instalação do PM2
```bash
npm install -g pm2
```

### Iniciar os Serviços
```bash
# Backend Node.js
pm2 start /var/www/html/salesmasters/backend/server.js \
    --name "salesmasters-node" \
    --cwd /var/www/html/salesmasters/backend

# BI Engine Python
pm2 start /var/www/html/salesmasters/bi-engine/venv/bin/python \
    --name "salesmasters-python" \
    --interpreter none \
    -- -m uvicorn main:app --host 0.0.0.0 --port 8000 \
    --cwd /var/www/html/salesmasters/bi-engine
```

### Persistir após reinicialização
```bash
pm2 startup
pm2 save
```

### Comandos Úteis PM2
```bash
pm2 list                    # Ver status dos processos
pm2 logs salesmasters-node  # Ver logs do Node
pm2 logs salesmasters-python # Ver logs do Python
pm2 restart all             # Reiniciar todos
pm2 monit                   # Monitor em tempo real
```

---

## 🏗️ 6. Build do Frontend para Produção

No ambiente de **desenvolvimento local**, antes de fazer upload:

```bash
cd frontend
npm run build
```

Isso gerará a pasta `frontend/dist/` que deve ser enviada ao servidor.

---

## 🔄 7. Processo de Deploy (Passo a Passo)

### 7.1. Preparar Build Local
```powershell
# No PowerShell (Windows)
cd E:\Sistemas_ia\SalesMasters\frontend
npm run build
```

### 7.2. Arquivos para Upload
Faça upload dos seguintes diretórios:

| Local | Destino no Servidor |
|-------|---------------------|
| `frontend/dist/*` | `/var/www/html/salesmasters/frontend/dist/` |
| `backend/*` (exceto node_modules) | `/var/www/html/salesmasters/backend/` |
| `bi-engine/*` (exceto venv, __pycache__) | `/var/www/html/salesmasters/bi-engine/` |

### 7.3. No Servidor SaveInCloud
```bash
# Instalar dependências
cd /var/www/html/salesmasters/backend && npm install --production
cd /var/www/html/salesmasters/bi-engine && source venv/bin/activate && pip install -r requirements.txt

# Reiniciar serviços
pm2 restart all
```

---

## 🧪 8. Verificação do Deploy

### Testar endpoints:
```bash
# Frontend
curl https://salesmasters.softham.com.br/

# Backend Node.js
curl https://salesmasters.softham.com.br/api/health

# BI Engine Python
curl https://salesmasters.softham.com.br/bi-api/health
```

### Verificar logs:
```bash
pm2 logs --lines 50
```

---

## ⚠️ 9. Troubleshooting

| Problema | Solução |
|----------|---------|
| **502 Bad Gateway** | Verificar se PM2 está rodando: `pm2 list` |
| **CORS Error** | Verificar headers no Nginx |
| **Conexão DB falhou** | Verificar `.env` e firewall do PostgreSQL |
| **Frontend não atualiza** | Limpar cache do browser (Ctrl+F5) |
| **Timeout em relatórios** | Aumentar `proxy_read_timeout` no Nginx |

---

## 📞 Contato SaveInCloud

- **Suporte**: [suporte@saveincloud.com.br](mailto:suporte@saveincloud.com.br)
- **Painel**: [https://app.saveincloud.com.br](https://app.saveincloud.com.br)

---

*Última atualização: 06/01/2026*
