# Plano de Ação - Finalização SalesMasters 🚀

Este documento detalha os passos finais para colocar o sistema em produção total.

## 1. Ajuste de Comunicação (Frontend -> API)
- **Problema:** O botão de login não funciona porque o Frontend tenta acessar `salesmasters.softham.com.br` e recebe `ERR_CONNECTION_REFUSED`.
- **Arquivo Alvo:** `e:\Sistemas_ia\SalesMasters\frontend\src\services\apiConfig.js` (ou equivalente).
- **Ação:** Atualizar a `BASE_URL` para o endereço final ou garantir que o servidor aceite requisições via domínio.

## 2. Configuração de Domínio e SSL
- **Objetivo:** Acessar via `https://salesmasters.softham.com.br`.
- **Ação SaveInCloud:**
    - Verificar se o Domínio está vinculado no painel Jelastic.
    - Ativar o certificado SSL (Let's Encrypt ou Built-in SSL).
    - Sem SSL, o navegador pode bloquear a requisição de login por segurança.

## 3. Build e Deploy do Frontend
- **Ação Local:** Rodar `npm run build` na pasta do frontend.
- **Ação Servidor:** 
    - Limpar a pasta `/home/jelastic/ROOT/frontend/`.
    - Upload dos novos arquivos da pasta `dist/` para o servidor.

## 4. Verificação de Endpoints de Login
- **Ação:** Verificar no servidor se o arquivo `login_endpoints.js` está presente e se o `server.js` está conseguindo carregá-lo sem erros.
- **Teste:** Tentar logar com o CNPJ de teste (`00.000.000/0001-91`).

---
**Status Atual:** 95% Concluído. Infraestrutura pronta e estável.
**Próximo Round:** Sincronizar as URLs e testar o fluxo de autenticação.

## 5. Acesso via Domínio Próprio
- **Objetivo:** Navegar no aplicativo usando `https://salesmasters.softham.com.br` (ou outro domínio configurado).
- **Passos de Configuração:**
  1. **DNS:** Criar registro `A` apontando para o IP do servidor Jelastic ou `CNAME` apontando para o domínio fornecido pela SaveInCloud.
  2. **Painel Jelastic:** No painel da conta SaveInCloud, vincular o domínio ao ambiente da aplicação.
  3. **SSL:** Ativar certificado SSL (Let's Encrypt ou Built‑in SSL) para o domínio configurado.
  4. **Frontend:** Atualizar `frontend/src/services/apiConfig.js` (ou equivalente) para usar a nova `BASE_URL` com `https://`.
  5. **Teste:** Acessar o domínio no navegador, garantir que o login funciona sem erros de CORS ou bloqueio de segurança.
- **Responsável:** [Nome do responsável]
- **Prazo:** [Data estimada]
