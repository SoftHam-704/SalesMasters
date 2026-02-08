# 🖨️ Mapeamento de Modelos de Impressão de Pedido

Este documento serve como a "Fonte da Verdade" para os modelos de impressão de pedidos do SalesMasters, espelhando as funcionalidades validadas no sistema legado (Delphi).

## 📋 Lista de Modelos Ativos

| ID Projeto | Descrição do Layout (Origem Delphi) | Observações |
| :--- | :--- | :--- |
| **1** | Modelo Padrão Retrato (Full Detail) | Baseado na imagem Delphi. Agrupado por desconto com sub-totais. |
| **2** | [Aguardando Definição] | - |
| **3** | [Aguardando Definição] | - |
| **4** | [Aguardando Definição] | - |
| **5** | [Aguardando Definição] | - |
| **6** | [Aguardando Definição] | - |
| **7** | [Aguardando Definição] | - |
| **10** | [Aguardando Definição] | - |
| **11** | [Aguardando Definição] | - |
| **12** | [Aguardando Definição] | - |
| **13** | [Aguardando Definição] | - |
| **14** | [Aguardando Definição] | - |
| **15** | [Aguardando Definição] | - |
| **16** | [Aguardando Definição] | - |
| **17** | [Aguardando Definição] | - |
| **20** | [Aguardando Definição] | - |
| **21** | [Aguardando Definição] | - |
| **22** | Modelo Paisagem (Full Detail) | Mesmo layout do 26. |
| **24** | [Aguardando Definição] | - |
| **25** | [Aguardando Definição] | - |
| **26** | Modelo Paisagem (Full Detail) | Layout Horizontal com todas as colunas. |
| **27** | [Aguardando Definição] | Paisagem (Landscape) |
| **28** | [Aguardando Definição] | - |

## 🛠️ Regras Gerais de Implementação (PDF)

- **Orientação**: Somente os modelos **22**, **26** e **27** são renderizados em modo Paisagem.
- **Códigos**: Modelos técnicos priorizam o código do fabric. (`ite_complem`), enquanto modelos de venda priorizam o código interno.
- **Preços**: Certos modelos (ex: simplificados) ocultam colunas de valor unitário e impostos.
- **Rodapé de Sistema**: Todas as páginas contêm a assinatura "SoftHam Sistemas (67) 9 9607-8885" e o número do layout.

---
*Última atualização: 07/02/2026*
