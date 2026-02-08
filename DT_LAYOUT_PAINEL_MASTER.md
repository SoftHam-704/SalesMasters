# Documentação de Layout e Estilo: Painel Master (SoftHam ADM)

Este documento descreve as diretrizes de interface (UI) e a implementação do design do módulo **Painel Master**. O objetivo é manter a identidade visual validada no protótipo, garantindo uma experiência premium e intuitiva.

## 1. Stack Tecnológica de UI
A interface foi construída utilizando:
*   **React** (Functional Components + Hooks)
*   **Tailwind CSS** (Estilização utilitária)
*   **Lucide React** (Ícones SVG modernos)
*   **ShadCN/UI** (Ou componentes base similares: `Button`, `Input`, `Card`, `Alert`, etc.)
    *   *Nota: Se o SoftHam ADM não utilizar Shadcn, os componentes devem ser adaptados mantendo a estética descrita abaixo.*

## 2. Estrutura Visual

### 2.1 Cores e Temas
O painel utiliza uma paleta de cores semântica para indicar status:

*   **Fundo Geral:** `bg-slate-50` (Cinza muito claro) ou Branco.
*   **Ativos/Sucesso:** `emerald-600`, `green-600`, fundos `bg-green-50`.
*   **Bloqueados/Erro:** `red-600`, fundos `bg-red-50`.
*   **Avisos/Inadimplência:** `yellow-600`, fundos `bg-yellow-50`.
*   **Informativo/Degustação:** `blue-600`, fundos `bg-blue-50`.
*   **Elementos Estruturais:** `slate-900` (Cabeçalhos escuros), `slate-500` (Textos secundários).

### 2.2 Componentes Chave

#### **A. Cards de Métricas (Dashboard)**
Localizados no topo, fornecem visão rápida.
*   **Design:** `Card` com gradiente sutil (`bg-gradient-to-br from-emerald-50 to-white`).
*   **Borda:** Colorida correspondente à métrica (`border-emerald-200`).
*   **Tipografia:** Número grande (`text-3xl font-bold`) e rótulo discreto.

#### **B. Lista de Empresas**
Lista expansível (Accordion style).
*   **Linha da Empresa:** Exibe CNPJ (Mono), Razão Social e Status.
*   **Ações Rápidas:** Botões `ghost` com ícones para Editar, Bloquear e Switch Tenant (`ExternalLink`).
*   **Expansão:** Ao clicar na seta, abre-se o painel de **Usuários** daquela empresa.

#### **C. Modal/Formulário de Cadastro**
*   **Header:** Escuro (`bg-slate-900 text-white`) para diferenciar do restante.
*   **Inputs:** Estilo padrão com bordas suaves (`border-slate-300`).
*   **Seção de Banco de Dados:** Separada visualmente (`bg-slate-50`), pois é uma configuração técnica crítica.
*   **Feedback:** Usar `Alert` para mensagens de sucesso/erro após salvar.

## 3. Código de Referência (Componente React)

Abaixo, o código completo do componente validado (`MasterPanel.jsx`). Integre-o ao projeto SoftHam ADM ajustando as importações de componentes de UI (`@/components/ui/...`) conforme a estrutura do novo projeto.

```jsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Crown, Building2, Users, Ban, CheckCircle2, AlertCircle,
    Plus, Edit, Trash2, RefreshCw, Search, ExternalLink, Loader2,
    UserCog, Key, X, ChevronDown, ChevronUp, Database
} from 'lucide-react';
// Ajustar importação da configuração da API
import { NODE_API_URL, getApiUrl } from '@/utils/apiConfig'; 

const MasterPanel = () => {
    // ... (Estados: empresas, metricas, loading, forms)
    const [empresas, setEmpresas] = useState([]);
    const [metricas, setMetricas] = useState({ total: 0, ativas: 0, bloqueadas: 0, inadimplentes: 0, degustacao: 0 });
    // ... Implementação da lógica de fetch (loadEmpresas, save, delete) iguai ao original ...
    
    // (Consulte o arquivo backend/master_panel_endpoints.js para a lógica de API correspondente)

    // Helper de Status Badge
    const getStatusBadge = (status) => {
        const styles = {
            'ATIVO': 'bg-green-100 text-green-800 border-green-300',
            'BLOQUEADO': 'bg-red-100 text-red-800 border-red-300',
            'INADIMPLENTE': 'bg-yellow-100 text-yellow-800 border-yellow-300',
            'DEGUSTAÇÃO': 'bg-blue-100 text-blue-800 border-blue-300'
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status] || 'bg-gray-100'}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            {/* 1. Header com Métricas (Grids coloridos) */}
            <div className="grid grid-cols-5 gap-4">
               {/* Cards de metricas aqui... */}
            </div>

            {/* 2. Barra de Ferramentas (Busca e Novo) */}
            <div className="flex items-center justify-between">
                {/* Inputs de busca... */}
                <Button onClick={() => setShowForm(true)}><Plus /> Nova Empresa</Button>
            </div>

            {/* 3. Modal de Formulário (Overlay ou Card fixo) */}
            {showForm && (
                <Card className="border-2 border-slate-200 shadow-xl ...">
                    {/* Header Escuro */}
                    <CardHeader className="bg-slate-900 text-white py-4">...</CardHeader>
                    <CardContent>
                       {/* Grid de Inputs... */}
                       {/* Seção de Banco de Dados (bg-slate-50)... */}
                    </CardContent>
                </Card>
            )}

            {/* 4. Lista de Empresas (Iteração) */}
             <Card>
                <CardContent>
                    {filteredEmpresas.map(empresa => (
                        <div key={empresa.id} className="border rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between p-4 bg-white hover:bg-gray-50">
                                {/* Dados da empresa e Botões... */}
                            </div>
                            
                            {/* 5. Área Expansível: Usuários */}
                            {expandedEmpresa === empresa.id && (
                                <div className="bg-gray-50 border-t p-4">
                                     {/* Lista de usuários e form de usuário... */}
                                </div>
                            )}
                        </div>
                    ))}
                </CardContent>
             </Card>
        </div>
    );
};
```

## 4. Requisitos de UX (Experiência do Usuário)

1.  **Feedback Visual Imediato**:
    *   Ao bloquear uma empresa, o badge de status deve mudar instantaneamente para Vermelho.
    *   Ao testar a conexão com o banco, mostrar um `Loader` (spinner) no botão e exibir mensagem de Sucesso (Verde) ou Falha (Vermelho).

2.  **Segurança Visual**:
    *   O botão de **Excluir** deve sempre exigir confirmação (`window.confirm` ou Modal de Alerta).
    *   Configurações sensíveis (Senha do Banco) devem estar ocultas (`type="password"`).

3.  **Facilitadores**:
    *   **Máscara de CNPJ:** Ao digitar o CNPJ, formatar automaticamente ou usar fonte monoespaçada (`font-mono`) para fácil leitura.
    *   **Busca Automática:** O botão de "Lupa" ao lado do CNPJ deve preencher Razão Social e Fantasia automaticamente (integração Backend).
