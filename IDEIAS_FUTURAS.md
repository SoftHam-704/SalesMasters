# 💡 IDEIAS PARA IMPLEMENTAÇÕES FUTURAS

**Arquivo de rastreamento de ideias e melhorias sugeridas durante o desenvolvimento**

---

## 🎬 VÍDEOS TUTORIAIS INTERATIVOS

**Data da ideia:** 28/01/2026  
**Sugerido por:** Usuário durante conversa sobre correção de sequences  
**Status:** 📝 Planejado para futuro

### Descrição

Criar vídeos tutoriais animados (.webp) mostrando passo a passo como usar funcionalidades do SalesMasters.

### Possíveis Tutoriais

1. **Como criar um pedido completo**
   - Login → Selecionar cliente → Adicionar produtos → Calcular descontos → Finalizar
   - Público: Novos vendedores
   - Duração estimada: 2-3 minutos

2. **Como usar o CRM**
   - Criar interação → Agendar visita → Registrar resultado → Criar oportunidade
   - Público: Equipe comercial
   - Duração estimada: 3-4 minutos

3. **Como importar tabelas de preço**
   - Upload de arquivo → Validação → Mapeamento de colunas → Importação
   - Público: Administradores
   - Duração estimada: 2 minutos

4. **Como gerar relatórios personalizados**
   - Filtros → Seleção de colunas → Exportação
   - Público: Gestores
   - Duração estimada: 2 minutos

### Benefícios

- ✅ Reduz tempo de treinamento
- ✅ Onboarding mais rápido de novos usuários
- ✅ Documentação visual sempre atualizada
- ✅ Pode ser integrado ao próprio sistema (tooltips, modais de ajuda)
- ✅ Arquivos leves (.webp) vs vídeos pesados (.mp4)

### Implementação Técnica

**Ferramenta:** `browser_subagent` com gravação automática

**Processo:**
1. Definir script do tutorial
2. Executar browser_subagent com recording ativado
3. Salvar .webp na pasta `public/tutorials/`
4. Integrar no frontend com modal de ajuda contextual

**Exemplo de código:**
```javascript
// No componente que precisa de ajuda
const TutorialButton = () => (
  <button onClick={() => showTutorial('criar-pedido')}>
    <HelpIcon /> Ver Tutorial
  </button>
);
```

### Próximos Passos

- [ ] Definir 5 tutoriais prioritários
- [ ] Criar script detalhado de cada tutorial
- [ ] Gravar vídeos tutoriais
- [ ] Integrar no frontend (modal de ajuda)
- [ ] Testar com usuários reais

---

## 📋 OUTRAS IDEIAS

_Adicionar mais ideias conforme surgirem..._

