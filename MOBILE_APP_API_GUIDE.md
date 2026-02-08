# 📱 Guia de Integração - App Mobile SalesMasters

> **Documento de Referência para Desenvolvedores do App Mobile**
> 
> Este documento contém informações críticas sobre a API backend que o app mobile deve consumir.
> O backend é **multi-tenant**, ou seja, cada cliente (empresa) tem seu próprio banco de dados.

---

## 🔐 1. Autenticação e Multi-Tenancy

### 1.1 Endpoint de Login
```
POST https://salesmasters.softham.com.br/api/auth/master-login
```

**Request Body:**
```json
{
    "cnpj": "17.504.829/0001-24",
    "nome": "Hamilton",
    "sobrenome": "Santos",
    "password": "senha123"
}
```

**Response (sucesso):**
```json
{
    "success": true,
    "user": {
        "id": 5,
        "codigo": 123,
        "nome": "Hamilton",
        "sobrenome": "Santos",
        "usuario": "hsantos",
        "role": "admin"
    },
    "tenantConfig": {
        "cnpj": "17504829000124",
        "dbConfig": {
            "host": "10.100.28.17",
            "database": "basesales",
            "user": "genteboa",
            "password": "SoftHam@2026",
            "port": 5432
        }
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 1.2 Headers Obrigatórios em TODAS as Requisições
Após o login, **TODAS** as chamadas à API devem incluir:

```javascript
const headers = {
    'Content-Type': 'application/json',
    'x-tenant-cnpj': tenantConfig.cnpj,                    // Ex: "17504829000124"
    'x-tenant-db-config': JSON.stringify(tenantConfig.dbConfig),
    'x-access-token': token                                // Token do login (se disponível)
};
```

**⚠️ IMPORTANTE:** Sem esses headers, a API vai acessar o banco errado ou retornar 401.

---

## 📊 2. Endpoints Principais

### 2.1 Clientes (Lista)
```
GET /api/aux/clientes?status=A&pesquisa=
```
- `status`: 'A' = Ativos, 'I' = Inativos, '' = Todos
- `pesquisa`: Filtro por nome/CNPJ

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "cli_codigo": 123,
            "cli_nome": "CLIENTE EXEMPLO LTDA",
            "cli_nomred": "CLIENTE EX",
            "cli_cnpj": "12345678000199",
            "cli_cidade": "São Paulo",
            "cli_uf": "SP",
            "cli_vendedor": 5
        }
    ]
}
```

### 2.2 Vendedores
```
GET /api/aux/vendedores
```
**Response:** Array direto (sem wrapper `success/data`)
```json
[
    { "ven_codigo": 1, "ven_nome": "Hamilton Santos" },
    { "ven_codigo": 2, "ven_nome": "Maria Vendedora" }
]
```

### 2.3 Indústrias (Fornecedores)
```
GET /api/orders/industries
```
**Response:**
```json
{
    "success": true,
    "data": [
        { "for_codigo": 36, "for_nomered": "FANIA", "total_pedidos": 141 },
        { "for_codigo": 42, "for_nomered": "BOSCH", "total_pedidos": 89 }
    ]
}
```

### 2.4 Tabelas de Preço de uma Indústria
```
GET /api/price-tables/{industria}
```
Exemplo: `/api/price-tables/36`

### 2.5 Produtos de uma Tabela de Preço
```
GET /api/price-tables/{industria}/dummy/products-full?tabela={nome_tabela}
```
Exemplo: `/api/price-tables/36/dummy/products-full?tabela=LP%20L.P.U%20182008`

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "pro_id": 12345,
            "pro_codprod": "30-152",
            "pro_nome": "PARAFUSO SEXTAVADO 10MM",
            "itab_precobruto": 15.50,
            "itab_ipi": 3.25,
            "itab_st": 0
        }
    ]
}
```

### 2.6 Cidades (Autocomplete)
```
GET /api/aux/cidades?search=SAO PAULO
```
ou buscar por ID:
```
GET /api/aux/cidades?id=123
```

---

## ⚠️ 3. Colunas que NÃO EXISTEM em Todos os Bancos

O backend atende múltiplos clientes com bancos de dados ligeiramente diferentes.
**Evite usar essas colunas em queries:**

| Coluna | Tabela | Problema |
|--------|--------|----------|
| `cli_cgc` | clientes | Não existe em alguns bancos |
| `cli_idfornece` | clientes | Não existe em alguns bancos |
| `set_ativo` | setores | Não existe em alguns bancos |
| `set_ordem` | setores | Não existe em alguns bancos |
| `for_tipo2` | fornecedores | Pode não existir |

Se precisar de algum campo desses, implemente um **fallback** para quando a query falhar.

---

## 🔄 4. Fluxo de Login Recomendado

```
1. Usuário informa: CNPJ, Nome, Sobrenome, Senha
2. App chama POST /api/auth/master-login
3. Se sucesso:
   - Salvar `user` no AsyncStorage
   - Salvar `tenantConfig` no AsyncStorage
   - Salvar `token` no SecureStorage
4. Em todas as chamadas subsequentes:
   - Ler tenantConfig e montar headers
```

---

## 📱 5. Exibição do Nome do Usuário

A tela inicial deve exibir:
```javascript
const userName = `${user.nome} ${user.sobrenome}`;
// Resultado: "Hamilton Santos"
```

**NÃO use** texto fixo como "Vendedor".

---

## 🌐 6. URLs Base

| Ambiente | URL |
|----------|-----|
| Produção | `https://salesmasters.softham.com.br` |
| Dev Local | `http://localhost:8080` |

---

## 🚨 7. Erros Comuns e Soluções

### Erro 500 em `/api/clients`
**Causa:** Rota errada
**Solução:** Use `/api/aux/clientes`

### Erro "column X does not exist"
**Causa:** Query usa coluna que não existe neste banco
**Solução:** Remover a coluna da query ou usar fallback

### Erro 401 Unauthorized
**Causa:** Headers de tenant não enviados
**Solução:** Verificar se `x-tenant-cnpj` e `x-tenant-db-config` estão sendo enviados

### Erro CORS
**Causa:** App tentando acessar localhost ou URL errada
**Solução:** Sempre usar a URL de produção completa

---

## 📋 8. Exemplo de Fetch Padrão (React Native)

```javascript
const API_URL = 'https://salesmasters.softham.com.br';

const fetchWithTenant = async (endpoint, options = {}) => {
    const tenantConfig = await AsyncStorage.getItem('tenantConfig');
    const token = await SecureStore.getItemAsync('token');
    const parsed = JSON.parse(tenantConfig);

    const headers = {
        'Content-Type': 'application/json',
        'x-tenant-cnpj': parsed.cnpj,
        'x-tenant-db-config': JSON.stringify(parsed.dbConfig),
        ...(token && { 'x-access-token': token }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    return response.json();
};

// Uso:
const clientes = await fetchWithTenant('/api/aux/clientes?status=A');
```

---

## 📞 9. Contato e Suporte

Para dúvidas sobre a API, consulte os logs do backend:
```bash
pm2 logs salesmasters-backend --lines 100
```

---

## 📊 10. Rotina de Sell-Out (CRM)

Este módulo é responsável por capturar e analisar as vendas na ponta (Sell-Out). Ele utiliza inteligência de dados para gerar visões trimestrais e rankings de performance.

### 10.1 Listagem de Registros
Retorna o histórico de lançamentos.
```
GET /api/crm/sellout?cli_codigo=&for_codigo=&periodo_inicio=&periodo_fim=
```

### 10.2 Dashboard de Inteligência (Summary)
Este é o endpoint principal para alimentar gráficos e métricas de desempenho.
```
GET /api/crm/sellout/summary?for_codigo=&cli_codigo=&periodo=YYYY-MM-DD
```

**Principais Inteligências Internas:**
1.  **Eixo Temporal Fixo (Trend):** Retorna sempre **7 meses** (3 meses antes do selecionado, o mês selecionado e 3 meses depois). Se um mês não tiver dados, o backend preenche com zero automaticamente. Isso é vital para manter a proporção do gráfico no App.
2.  **Ranking Inteligente:** Retorna os **Top 5 Clientes**. Possui fallback: se o mês filtrado estiver vazio, ele busca os maiores clientes do último mês que teve movimento real.
3.  **Comparativo (Growth):** O campo `growth` retorna o percentual de variação em relação ao mês anterior (MoM).

**Estrutura de Resposta:**
```json
{
    "success": true,
    "data": {
        "current_month_total": 15151.50,
        "last_month_total": 12000.00,
        "total_customers": 45,
        "total_industries": 8,
        "growth": "26.26",
        "trend": [
            { "label": "10/2025", "value": 0, "volume": 0 },
            { "label": "11/2025", "value": 5000, "volume": 10 },
            { "label": "12/2025", "value": 15151, "volume": 50 },
            { "label": "01/2026", "value": 0, "volume": 0 }
            // ... totalizando 7 meses centrais
        ],
        "ranking": [
            { "label": "ADEMAR BERTUZZI", "value": 15151.50, "volume": 50 },
            { "label": "OUTRO CLIENTE", "value": 8500.00, "volume": 30 }
        ]
    }
}
```

### 10.3 Pendências de Reporte
Lista quais clientes ainda não tiveram lançamentos para o mês corrente.
```
GET /api/crm/sellout/pendencies
```

### 10.4 Gravação de Dados (Alimentação pelo App)
O App Mobile é a principal ferramenta de entrada. Use este endpoint para enviar os dados coletados no PDV.
```
POST /api/crm/sellout
```
**Payload:**
```json
{
    "id": null,           // Preencher apenas se for edição
    "cli_codigo": 706,
    "for_codigo": 12,
    "periodo": "2026-01-01",
    "valor": 15151.50,
    "quantidade": 50
}
```

---

*Documento atualizado em: 27/01/2026*
*Versão do Módulo Sell-Out: 2.0.0 (Intel-Series)*
