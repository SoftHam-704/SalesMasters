# 🚀 DEPLOY - Correções BI Engine + Frontend
## Data: 2026-02-05

## ✅ Build Concluído com Sucesso!

---

## 📦 ARQUIVOS PARA UPLOAD

### 1. Frontend (Nova pasta dist completa)
```
frontend/dist/  →  /var/www/html/homolog/ ou similar
```

### 2. BI Engine - ARQUIVOS MODIFICADOS

| Arquivo | Alteração |
|---------|-----------|
| `bi-engine/services/data_fetcher.py` | **CRÍTICO** - Cache refatorado com TTL, removi lru_cache problemático |
| `bi-engine/services/database.py` | **CRÍTICO** - Encoding UTF-8 em todas as conexões |
| `bi-engine/services/measures.py` | **CRÍTICO** - Colunas de metas corrigidas (met_jan vs m1) |
| `bi-engine/services/client_dashboard.py` | Filtro vendedor corrigido + debug logs |
| `bi-engine/routers/dashboard.py` | vendedorId agora aceita string |
| `bi-engine/config.py` | Encoding UTF-8 na URL |
| `bi-engine/utils/tenant_context.py` | Encoding UTF-8 para tenants |

---

## 🔧 PROBLEMAS CORRIGIDOS

### 1. "Fantasma" entre abas (Visão Geral vs Clientes)
- **Causa**: `lru_cache` cacheando DataFrames vazios ou incorretos
- **Solução**: Cache manual com TTL de 5 minutos que NÃO cacheia resultados vazios

### 2. Evolução Mensal sem dados
- **Causa**: `vendedorId` chegava como string e o filtro falhava
- **Solução**: Tratamento robusto de tipos no backend

### 3. Encoding UTF-8
- **Causa**: Caracteres especiais (ç, ã) causando erros
- **Solução**: SET client_encoding UTF8 em todas conexões

### 4. Colunas de Metas incompatíveis
- **Causa**: data_fetcher retornava `met_jan` mas measures esperava `m1`
- **Solução**: Alinhamento de nomes de colunas

---

## ⚠️ APÓS O UPLOAD

```bash
# 1. Reiniciar o BI Engine
pm2 restart bi-engine

# 2. Verificar logs
pm2 logs bi-engine --lines 50

# 3. Limpar cache do navegador e testar
```

---

## 📋 ARQUIVOS QUE NÃO DEVEM SER SOBRESCRITOS

- `bi-engine/.env` - Contém credenciais de produção
- Qualquer arquivo `__pycache__`
- Pasta `venv`

---

## 🧪 TESTES RECOMENDADOS

1. Abrir aba "Visão Geral" - deve carregar KPIs e gráficos
2. Abrir aba "Clientes" - deve mostrar matriz de evolução
3. Filtrar por vendedor específico na matriz - deve mostrar dados
4. Alternar entre abas - não deve "quebrar" nenhuma
5. Verificar se o filtro de mês funciona na Visão Geral

---

**Gerado automaticamente pelo Antigravity**
