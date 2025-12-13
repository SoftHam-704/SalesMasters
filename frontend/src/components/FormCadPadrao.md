# FormCadPadrao - Formulário Padrão de Cadastro

## 📋 Visão Geral

O `FormCadPadrao` é o componente base para todos os formulários de cadastro do SalesMasters, equivalente ao `TfrmCadPad` do Delphi.

## 🎯 Características

- ✅ **Abas Principais** - Para dados principais e complementares
- ✅ **Abas Relacionadas** - Para dados relacionados (contatos, endereços, etc.)
- ✅ **Header Customizável** - Título e botão de fechar
- ✅ **Footer com Botões** - Salvar e Cancelar
- ✅ **Tema Dark/Light** - Suporte completo
- ✅ **Responsivo** - Funciona em mobile
- ✅ **Animações** - Fade in e scale in

## 📦 Como Usar

### Exemplo Básico

```jsx
import FormCadPadrao from '../components/FormCadPadrao';
import { FileText, Package } from 'lucide-react';

const MeuFormulario = ({ data, onClose, onSave }) => {
  const tabs = [
    { id: 'principal', label: 'Principal', icon: <FileText size={16} /> },
    { id: 'complemento', label: 'Complemento', icon: <Package size={16} /> }
  ];

  const relatedTabs = [
    { id: 'contatos', label: 'Contatos' },
    { id: 'enderecos', label: 'Endereços' }
  ];

  const renderTabContent = (activeTab) => {
    switch (activeTab) {
      case 'principal':
        return <div>Conteúdo Principal</div>;
      case 'complemento':
        return <div>Conteúdo Complementar</div>;
      default:
        return null;
    }
  };

  const renderRelatedContent = (activeTab) => {
    switch (activeTab) {
      case 'contatos':
        return <div>Lista de Contatos</div>;
      case 'enderecos':
        return <div>Lista de Endereços</div>;
      default:
        return null;
    }
  };

  return (
    <FormCadPadrao
      title="Cadastro de Cliente"
      data={data}
      onClose={onClose}
      onSave={onSave}
      tabs={tabs}
      relatedTabs={relatedTabs}
      renderTabContent={renderTabContent}
      renderRelatedContent={renderRelatedContent}
    />
  );
};
```

### Exemplo Simplificado (sem abas)

```jsx
<FormCadPadrao
  title="Cadastro Rápido"
  onClose={handleClose}
  onSave={handleSave}
>
  <div className="form-row">
    <div className="form-group">
      <label>Nome</label>
      <input type="text" />
    </div>
  </div>
</FormCadPadrao>
```

## 🔧 Props

| Prop | Tipo | Obrigatório | Descrição |
|------|------|-------------|-----------|
| `title` | string | Não | Título do formulário (padrão: "Cadastro") |
| `data` | object | Não | Dados do registro (null para novo) |
| `onClose` | function | Sim | Função chamada ao fechar |
| `onSave` | function | Sim | Função chamada ao salvar |
| `tabs` | array | Não | Array de abas principais |
| `relatedTabs` | array | Não | Array de abas relacionadas |
| `renderTabContent` | function | Não | Função para renderizar conteúdo das abas |
| `renderRelatedContent` | function | Não | Função para renderizar dados relacionados |
| `children` | node | Não | Conteúdo direto (sem abas) |

## 📐 Estrutura de Tabs

### Tabs Principais
```javascript
const tabs = [
  {
    id: 'principal',           // ID único da aba
    label: 'Principal',        // Texto exibido
    icon: <FileText size={16} /> // Ícone opcional
  }
];
```

### Related Tabs
```javascript
const relatedTabs = [
  {
    id: 'contatos',    // ID único da aba
    label: 'Contatos'  // Texto exibido
  }
];
```

## 🎨 Classes CSS Disponíveis

### Para Conteúdo de Formulário

```css
.form-row          /* Container de linha */
.form-group        /* Grupo de campo */
.form-group.flex-2 /* Grupo com flex: 2 */
.form-group.flex-3 /* Grupo com flex: 3 */
.form-group.small  /* Grupo pequeno (flex: 0.5) */
```

### Exemplo de Uso

```jsx
<div className="form-row">
  <div className="form-group">
    <label>Código</label>
    <input type="text" />
  </div>
  <div className="form-group flex-2">
    <label>Nome Completo</label>
    <input type="text" />
  </div>
</div>
```

## 🔄 Comparação com Delphi

| Delphi (TfrmCadPad) | React (FormCadPadrao) |
|---------------------|------------------------|
| `PageControl1` | `tabs` prop |
| `TabSheet` | objeto no array `tabs` |
| `PageControl2` | `relatedTabs` prop |
| `btnSalvar` | botão "Salvar" no footer |
| `btnCancelar` | botão "Cancelar" no footer |
| `OnShow` | renderizado ao montar |
| `OnClose` | prop `onClose` |

## 💡 Dicas de Uso

1. **Validação**: Implemente validação na função `onSave`
2. **Estado**: Gerencie o estado do formulário no componente pai
3. **Dados Relacionados**: Use grids ou listas nas abas relacionadas
4. **Responsividade**: O formulário já é responsivo por padrão

## 📝 Exemplo Completo

Veja `SupplierForm.jsx` para um exemplo completo de implementação usando o FormCadPadrao.

## 🎯 Próximos Cadastros

Use este componente para criar:
- Cadastro de Clientes
- Cadastro de Produtos
- Cadastro de Categorias
- Cadastro de Funcionários
- E todos os outros CRUDs do sistema!

---

**Desenvolvido para SalesMasters** 🚀
