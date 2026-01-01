# SalesMasters BI Engine

Microserviço Python FastAPI para análises de Business Intelligence e processamento de dados.

## Estrutura

```
bi-engine/
├── main.py              # FastAPI app principal
├── config.py            # Configurações e variáveis de ambiente
├── requirements.txt     # Dependências Python
├── .env                 # Variáveis de ambiente (não versionado)
├── .env.example         # Template de variáveis de ambiente
├── routers/             # Endpoints da API
│   └── dashboard.py     # Endpoints de dashboard
└── services/            # Serviços e utilitários
    └── database.py      # Conexão DB e queries com Pandas
```

## Instalação

1. Criar ambiente virtual Python:
```bash
python -m venv venv
```

2. Ativar o ambiente:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Instalar dependências:
```bash
pip install -r requirements.txt
```

4. Configurar variáveis de ambiente:
```bash
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL
```

## Execução Local

```bash
# Desenvolvimento (com hot-reload)
python main.py

# Ou usando uvicorn diretamente
uvicorn main:app --reload --port 8000
```

O servidor estará rodando em `http://localhost:8000`

## Endpoints Disponíveis

### Health Check
- `GET /health` - Verifica status do serviço

### Dashboard
- `GET /api/dashboard/metas?mes=12&ano=2025` - Retorna metas do mês/ano
- `GET /api/dashboard/summary` - Resumo geral (placeholder)

## Documentação Automática

FastAPI gera documentação interativa automaticamente:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Integração com React

O React (frontend) faz chamadas HTTP para este serviço:

```javascript
// Exemplo de chamada do React
const response = await axios.get('http://localhost:8000/api/dashboard/metas?mes=12&ano=2025');
```

## Deploy (Futuro - Dia 4)

Opções de deploy:
- **Railway**: Deploy automático via Git
- **Render**: Free tier para APIs Python
- **Heroku**: Dyno padrão
- **Docker**: Containerização para qualquer cloud

## Banco de Dados

Conecta ao PostgreSQL usando SQLAlchemy e retorna dados processados com Pandas.
