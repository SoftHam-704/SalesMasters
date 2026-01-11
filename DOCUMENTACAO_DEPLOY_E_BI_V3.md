# 📘 DOCUMENTAÇÃO PÓS-DEPLOY & GUIA DE ARQUITETURA (SALESMASTERS V3)
**Data:** 09/01/2026
**Status:** ✅ DEPLOY EM PRODUÇÃO SUCESSO

---

## 💀 1. O "Vale da Sombra" (Diagnóstico dos Problemas Enfrentados)
Durante a migração para a SaveInCloud, enfrentamos uma "tempestade perfeita" de 3 fatores críticos que causaram instabilidade e noites em claro:

1.  **A Maldição do Localhost (Hardcoded):**
    *   **Sintoma:** Erros de CORS e falhas de requisição no Frontend em produção.
    *   **Causa:** Apesar do `apiConfig.js` existir, **mais de 40 componentes** tinham URLs "chumbadas" (`http://localhost:3005` e `http://localhost:8000`) direto no código.
    *   **Solução:** Criamos o script `emergency_fix_urls.js` que varreu o projeto e substituiu tudo pela URL de produção.
    *   **Lição:** *Nunca mais* escrever URLs diretas. Sempre importar de `apiConfig.js`.

2.  **O Banco de Dados Fantasma:**
    *   **Sintoma:** Erro 500 em `/api/crm/pipeline`.
    *   **Causa:** O banco de produção (Cloud) não tinha as colunas (`for_codigo`) e tabelas (`crm_funil`, etc) que existiam no local. Além disso, o Backend tentava conectar via IP Público, mas a SaveInCloud exige **IP Interno** (`10.100.x.x`) para conexões rápidas entre containers.
    *   **Solução:** Script `setup_crm.js` rodado via SSH para migrar schema e dados. Descoberta do IP interno correto.

3.  **Cache & Deploy Incompleto:**
    *   **Sintoma:** Correções não apareciam na tela (cor do login antiga, erros persistentes).
    *   **Causa:** Processo de upload manual falho (sobra de arquivos antigos) + Cache agressivo do navegador.
    *   **Solução:** Limpeza total da pasta `/home/jelastic/ROOT/frontend` via SSH (`rm -rf *`) antes de subir o build novo (`dist`).

---

## 🛠️ 2. Guia Definitivo de Deploy (Procedimento Padrão Ouro)

Para as próximas atualizações, este é o "Caminho Feliz" que não falha:

1.  **Preparação Local:**
    *   Certifique-se que `apiConfig.js` aponta para produção.
    *   Se necessário, rode: `node emergency_fix_urls.js` (para garantir).
    *   Compile: `cd frontend && npm run build`.
    *   Compacte o conteúdo de `frontend/dist` para `deploy.zip`.

2.  **No Servidor (SSH/FileZilla):**
    *   **Backend:** Se houve mudança de código ou banco, suba os arquivos em `/home/jelastic/ROOT/backend` e rode `pm2 restart server`.
    *   **Frontend:**
        *   `cd /home/jelastic/ROOT/frontend`
        *   `rm -rf *` (Limpeza radical)
        *   Upload do `deploy.zip`.
        *   `unzip deploy.zip && rm deploy.zip`
    *   **Reinicialização:** `pm2 restart server` (para limpar cache do servimento estático).

3.  **No Cliente:** `Ctrl + Shift + R`.

---

## ⚡ 3. Arquitetura "Zero-Delay" para o BI (Background Threads)

**O Problema Atual:** O usuário clica na aba "BI", e só então o sistema busca os dados (Loading...).
**A Solução (Próxima Sprint):** Carregamento em Background (Prefetching) assim que o login ocorre.

### Estratégia Técnica: "Shadow Loading"

1.  **Web Workers ou Service Workers:**
    *   Ao realizar o Login (`Login.jsx`), dispararemos uma **Thread Secundária** (Web Worker) chamada `bioWorker.js`.
    *   Essa thread não trava a interface (UI Main Thread).

2.  **Fluxo de Execução:**
    *   *Login Sucesso* -> Dispara `bioWorker.postMessage({ type: 'PREFETCH_ALL', token: '...' })`.
    *   O Worker faz as chamadas pesadas para o Python (`/bi-api/dashboard/...`).
    *   O Worker armazena os resultados em `IndexedDB` (banco do navegador) ou retorna para um Contexto Global (`BIContext`) em memória.

3.  **Experiência do Usuário:**
    *   O usuário vê o Dashboard principal. Enquanto ele lê os avisos ou vê o funil, o BI está baixando 10MB de dados silenciosamente.
    *   Quando ele clica na aba "Business Intelligence": **BOOM**. O gráfico aparece instantaneamente (leitura de cache local), sem spinner de carregamento.

---

## ✅ 4. O "Efeito Colateral" (Localhost Quebrado) - RESOLVIDO

Ao forçarmos a substituição de `localhost` por `salesmasters.softham.com.br` no código fonte para salvar a apresentação, **tínhamos quebrado o ambiente de desenvolvimento local**.

*   **Status Atual:** ✅ **RESOLVIDO EM 10/01/2026**.
*   **Ação Realizada:**
    *   Todos os componentes do BI (`AnalyticsTab`, `InsightsCard`, `PriorityActions`, etc.) foram refatorados.
    *   Agora utilizam **exclusivamente** `import { PYTHON_API_URL, getApiUrl } from '../utils/apiConfig'`.
    *   `apiConfig.js` foi configurado para alternar automaticamente entre `localhost:8080/bi-api` (DEV) e `salesmasters.softham.com.br/bi-api` (PROD).
    *   Os erros de 404 no console foram corrigidos ajustando os prefixos de rota (`/api/dashboard/...`).
    *   O ambiente de desenvolvimento está 100% funcional novamente.

---

**Resumo:** O sistema sobreviveu e está mais forte. A infraestrutura de nuvem está validada. O próximo passo é refino de performance e restauração do ambiente de dev.

*Bom descanso, Guerreiro.* 😴
