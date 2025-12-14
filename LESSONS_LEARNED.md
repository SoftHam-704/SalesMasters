# Lições Aprendidas - Sessão 14/12/2024

## Resumo da Sessão
Implementamos com sucesso 4 funcionalidades principais no módulo de Fornecedores:
1. Consulta CNPJ via BrasilAPI
2. Máscara de CNPJ (onFocus/onBlur)
3. CRUD de Contatos (com 3 novos campos)
4. Campo de Política Comercial (BLOB)
5. Metas Anuais (grid 12 meses)

---

## ✅ Acertos e Boas Práticas

### 1. Estrutura de Chaves Primárias
**Lição**: Sempre verificar a estrutura da chave primária ANTES de implementar CRUD.

**Caso**: Tabela `contato_for`
- **Erro inicial**: Assumimos que `con_codigo` era a PK
- **Realidade**: PK composta `(con_fornec, con_nome, con_cargo)`
- **Solução**: Criamos script `fix_contacts_pk.js` para corrigir
- **Aprendizado**: `con_codigo` é usado apenas como identificador único para edição/exclusão no frontend

**Código correto**:
```sql
ALTER TABLE contato_for ADD PRIMARY KEY (con_fornec, con_nome, con_cargo);
```

### 2. Importação de Dados XLSX
**Lição**: Sempre usar `ON CONFLICT` com UPSERT para evitar erros de duplicação.

**Template**:
```javascript
const query = `
    INSERT INTO tabela (campo1, campo2, ...)
    VALUES ($1, $2, ...)
    ON CONFLICT (chave_primaria) DO UPDATE SET
        campo1 = EXCLUDED.campo1,
        campo2 = EXCLUDED.campo2
`;
```

### 3. Formatação de Datas Especiais
**Lição**: Para campos de aniversário (DD/MM), sempre fixar o ano para facilitar queries.

**Implementação**:
- Frontend: Input aceita apenas DD/MM (ex: "03/04")
- Backend: Converte para `2001-MM-DD` antes de salvar
- Benefício: Facilita ordenação e comparação de datas

### 4. Máscaras de Input (CNPJ, Moeda)
**Lição**: Implementar comportamento onFocus/onBlur para melhor UX.

**Padrão CNPJ**:
```javascript
onFocus={(e) => {
    // Remove máscara para facilitar edição
    e.target.value = e.target.value.replace(/\D/g, '');
}}
onBlur={(e) => {
    // Reaplica máscara ao sair
    e.target.value = formatCNPJ(e.target.value);
}}
```

**Padrão Moeda**:
```javascript
// Exibição: R$ 10.000,00
value={new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
}).format(value)}

// onFocus: Mostra número puro (10000)
// onBlur: Reformata com R$
```

### 5. Campos BLOB/TEXT
**Lição**: Campos BLOB (como `for_obs2`) funcionam normalmente com queries SQL padrão.

**Não precisa**:
- Tratamento especial no PostgreSQL
- Conversão de encoding
- Funções especiais

**Basta**:
```sql
UPDATE fornecedores SET for_obs2 = $1 WHERE ...
```

---

## ❌ Erros Comuns e Como Evitar

### 1. Estrutura de Tabs no React
**Erro**: Adicionar `TabsContent` no grupo errado de Tabs.

**Problema encontrado**:
- Havia 2 grupos de `<Tabs>`: superior (Dados) e inferior (Sub-tabs)
- Adicionamos "Política comercial" no grupo superior
- Resultado: Aba não aparecia

**Solução**:
- Sempre verificar a hierarquia de componentes
- Usar grep para encontrar onde cada `TabsContent` está

### 2. Mapeamento de Dados Frontend ↔ Backend
**Erro**: Esquecer de adicionar campo no mapeamento de dados.

**Checklist**:
1. ✅ Backend GET retorna o campo?
2. ✅ Frontend mapeia o campo ao receber dados?
3. ✅ Frontend inclui o campo no payload ao salvar?
4. ✅ Backend UPDATE/PUT processa o campo?

**Exemplo `for_obs2`**:
```javascript
// Frontend - Mapeamento ao carregar
const adaptedData = data.map(item => ({
    ...
    obs2: item.for_obs2 || '',  // ✅ Mapear
}));

// Frontend - Payload ao salvar
const payload = {
    ...
    for_obs2: data.obs2 || ''  // ✅ Incluir
};

// Backend - UPDATE
UPDATE fornecedores SET
    ...
    for_obs2 = $14  // ✅ Processar
```

### 3. Composite Keys em Endpoints REST
**Erro**: Usar apenas um campo da chave composta na URL.

**Problema**:
```javascript
// ❌ ERRADO
PUT /api/suppliers/:supplierId/contacts/:contactId
WHERE con_codigo = $1 AND con_fornec = $2
```

**Solução**:
```javascript
// ✅ CORRETO - Usar identificador único
PUT /api/suppliers/:supplierId/contacts/:contactId
WHERE con_codigo = $1  // con_codigo é único
```

---

## 🔧 Configurações e Ambiente

### Arquivo .env
**Sempre criar** `.env.example` para documentação:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=basesales
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3001
NODE_ENV=development
```

### Scripts Temporários
**Organização**:
- Scripts de debug/teste: Deletar após uso
- Scripts de importação: Manter em `backend/scripts/`
- Scripts de migração: Manter em `backend/migrations/`

**Deletados hoje**:
- `check_obs2.js`
- `verify_contacts_table.js`
- `verify_ind_metas.js`
- `fix_contacts_pk.js`
- `add_contact_fields.js`
- `add_contacts_pk.js`
- `find_contacts_table.js`
- `create_contacts_table.js`

**Mantidos**:
- `import_contacts.js` (importação de dados)
- `import_goals.js` (importação de metas)

---

## 📊 Estatísticas da Sessão

### Dados Importados
- **Contatos**: 43 registros
- **Metas**: 10 registros (anos 2024-2026)

### Arquivos Modificados
- **Backend**: `server.js` (+200 linhas)
- **Frontend**: 
  - `SupplierDialog.jsx` (+150 linhas)
  - `ContactDialog.jsx` (novo, 190 linhas)
  - `frmIndustria.jsx` (+20 linhas)

### Endpoints Criados
1. `GET /api/suppliers/:id/contacts`
2. `POST /api/suppliers/:id/contacts`
3. `PUT /api/suppliers/:id/contacts/:codigo`
4. `DELETE /api/suppliers/:id/contacts/:codigo`
5. `GET /api/suppliers/:id/goals/:year`
6. `PUT /api/suppliers/:id/goals/:year`

---

## 🎯 Próximos Passos

### Para Próximos CRUDs
1. **Sempre verificar**:
   - Estrutura da tabela (PRIMARY KEY, campos, tipos)
   - Dados existentes (SELECT * LIMIT 5)
   - Relacionamentos (FOREIGN KEYS)

2. **Padrão de implementação**:
   - Backend primeiro (endpoints + testes)
   - Frontend depois (UI + integração)
   - Importação de dados por último

3. **Checklist de finalização**:
   - [ ] Remover console.logs de debug
   - [ ] Deletar scripts temporários
   - [ ] Atualizar .env.example se necessário
   - [ ] Testar CRUD completo
   - [ ] Commit e push

### Melhorias Futuras
- Implementar validação de CNPJ no backend
- Adicionar paginação na lista de contatos
- Criar componente reutilizável para máscaras
- Implementar cache de consultas CNPJ
- Adicionar testes automatizados

---

## 📝 Notas Importantes

### Convenções do Projeto
- **Nomes de campos**: Snake_case no banco, camelCase no frontend
- **Datas**: ISO 8601 (YYYY-MM-DD) no banco
- **Moeda**: Valores numéricos no banco, formatação no frontend
- **Máscaras**: Remover antes de salvar, aplicar na exibição

### Comandos Úteis
```bash
# Reiniciar backend
npx kill-port 3001; node server.js

# Ver logs do PostgreSQL
SELECT * FROM pg_stat_activity WHERE datname = 'basesales';

# Verificar estrutura de tabela
\d+ nome_tabela
```

---

**Data**: 14/12/2024  
**Duração**: ~3 horas  
**Status**: ✅ Todas as funcionalidades implementadas e testadas
