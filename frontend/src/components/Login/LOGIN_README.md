# 🛡️ COMPONENTE DE LOGIN - DOCUMENTAÇÃO PROTEGIDA

## ⚠️ AVISO CRÍTICO - LEIA ANTES DE FAZER QUALQUER ALTERAÇÃO!

Este componente contém lógica crítica para a experiência de login do SalesMasters.
**Qualquer alteração não aprovada pode quebrar o fluxo de autenticação!**

---

## 🎬 Fluxo Atual (TESTADO E APROVADO)

### 1. Carregamento da Página
```
Página carrega → Estados iniciam em FALSE
├─ showIntro = false
└─ showLogin = false
```

### 2. Verificação da Vinheta (useEffect)
```
Internet disponível?
├─ SIM → Tenta carregar vinheta (2s timeout)
│   ├─ Vinheta acessível → showIntro = true, showLogin = false
│   └─ Vinheta erro → showIntro = false, showLogin = true
└─ NÃO → Pula direto para login (showIntro = false, showLogin = true)
```

### 3. Exibição da Vinheta (se disponível)
```
Vinheta tocando (autoplay, muted)
├─ Vídeo termina → showIntro = false, showLogin = true
├─ Timer de segurança (10s) → showIntro = false, showLogin = true
└─ Erro no vídeo → showIntro = false, showLogin = true
```

### 4. Exibição do Login
```
Formulário de login aparece com animação
├─ Partículas flutuantes animadas
└─ Campos auto-preenchidos (se salvos no localStorage)
```

---

## 🔒 CONFIGURAÇÕES PROTEGIDAS

### Estados Iniciais (LINHA 18-19)
```javascript
const [showIntro, setShowIntro] = useState(false);  // ⚠️ NÃO MUDAR!
const [showLogin, setShowLogin] = useState(false);  // ⚠️ NÃO MUDAR!
```

**POR QUÊ NÃO PODE MUDAR?**
- `false` → Garante que NADA aparece até a verificação terminar
- Se colocar `true` → Formulário aparece ANTES da vinheta (ERRO!)

**Data da última correção:** 06/01/2026  
**Motivo:** Estado inicial `true` causava formulário aparecer antes da vinheta

---

### URL da Vinheta (LINHA 30)
```javascript
const VINHETA_URL = 'https://www.softham.com.br/vinheta.mp4';
```

**DETALHES:**
- URL oficial e testada
- Vídeo com som por padrão (autoplay silencioso)
- Duração aproximada: 7-8 segundos

**NÃO ALTERAR A NÃO SER:**
- Mudança de domínio da empresa
- Nova versão do vídeo aprovada

---

### Timer de Segurança (LINHA 97)
```javascript
const safetyTimer = setTimeout(() => {...}, 10000);  // ⚠️ 10s - NÃO ALTERAR!
```

**POR QUÊ 10 SEGUNDOS?**
- Vinheta tem ~7s de duração
- +3s de margem para carregamento lento
- Evita usuários presos na tela de intro

**HISTÓRICO:**
- Inicialmente: 6 segundos (MUITO CURTO - usuários reclamaram)
- Ajustado para: 7 segundos (AINDA CURTO)
- **Final: 10 segundos ✅ (APROVADO)**

**NÃO REDUZIR para menos de 10s!**

---

## 📝 Histórico de Alterações

| Data | Alteração | Motivo | Quem Aprovou |
|------|-----------|--------|--------------|
| 06/01/2026 | Correção `showLogin` inicial | Formulário aparecia antes da vinheta | Cliente |
| 06/01/2026 | Timer ajustado para 10s | Tempo insuficiente (era 7s) | Cliente |
| 06/01/2026 | Remoção do botão "Play com som" | Disruptivo para UX premium | Cliente |
| 06/01/2026 | URL vinheta corrigida | URL antiga inacessível (DNS error) | Cliente |
| 06/01/2026 | Documentação de proteção | Prevenir alterações não aprovadas | Desenvolvedor |

---

## 🚫 O QUE NÃO FAZER

### ❌ NUNCA faça isso sem aprovação:

1. **Alterar estados iniciais para `true`**
   - Resultado: Formulário aparece antes da vinheta
   
2. **Reduzir o timer de segurança abaixo de 10s**
   - Resultado: Vinheta cortada no meio
   
3. **Remover a verificação de internet**
   - Resultado: Timeout infinito em ambientes offline
   
4. **Adicionar novos elementos visuais sem testes**
   - Resultado: Conflito com animações existentes
   
5. **Alterar a URL da vinheta sem verificar acessibilidade**
   - Resultado: Login fica preso na tela preta

---

## ✅ Como Testar Alterações

Se você PRECISAR alterar algo (com aprovação), teste:

### Teste 1: Vinheta + Login (Internet disponível)
1. Limpar cache do navegador
2. Abrir http://localhost:5173
3. **Esperado:**
   - Vinheta aparece PRIMEIRO
   - Após ~7s ou fim do vídeo → Login aparece
   - Partículas animadas aparecem

### Teste 2: Sem Internet (Offline)
1. Desconectar internet
2. Abrir http://localhost:5173
3. **Esperado:**
   - Login aparece IMEDIATAMENTE (sem vinheta)
   - Partículas aparecem normalmente

### Teste 3: Vinheta Inacessível (Simulação)
1. Alterar VINHETA_URL para URL inválida (temporariamente)
2. Abrir http://localhost:5173
3. **Esperado:**
   - Após 2s de timeout → Login aparece
   - Console mostra erro de fetch

### Teste 4: Timer de Segurança
1. Comentar `onEnded` do vídeo (simular travamento)
2. Abrir http://localhost:5173
3. **Esperado:**
   - Após exatos 10s → Login aparece automaticamente

---

## 📞 Contato em Caso de Dúvidas

Se precisar alterar algo neste componente:

1. **Consultar esta documentação primeiro**
2. **Obter aprovação do cliente**
3. **Fazer backup do código atual**
4. **Testar exaustivamente antes de commitar**
5. **Atualizar esta documentação**

---

## 🔫 Proteção de Código

Este arquivo está protegido por:
- ✅ Comentários de aviso em código
- ✅ Documentação detalhada (este arquivo)
- ✅ Histórico de mudanças
- ✅ Testes definidos

**Última atualização:** 06/01/2026  
**Status:** CÓDIGO BLINDADO 🛡️ - APROVADO PELO CLIENTE
