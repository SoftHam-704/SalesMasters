
# Guia de Importação de Dados - Schema Markpress

Este documento detalha o processo de importação de dados para o schema `markpress`. Este processo é recorrente e deve ser seguido para manter o banco de dados atualizado com as planilhas da pasta `data/`.

## 📂 Localização dos Arquivos
- **Planilhas**: `data/` (na raiz do projeto)
- **Script de Importação**: `backend/_dev_scripts/import_markpress_master.js`

## 📊 Tabelas Suportadas
O script atual processa os seguintes arquivos Excel:
1. `area_atu.xlsx` -> Tabela `area_atu` (Áreas de Atuação)
2. `cidades.xlsx` -> Tabela `cidades` (Cidades e Estados)
3. `vendedores.xlsx` -> Tabela `vendedores` (Equipe de Vendas)
4. `fornecedores.xlsx` -> Tabela `fornecedores` (Indústrias/Fabricantes)
5. `produtos.xlsx` -> Tabelas `cad_prod` e `cad_tabelaspre` (Insumos e Preços)
6. `clientes.xlsx` -> Tabela `clientes` (Carteira de Clientes)

## 🚀 Como Executar a Importação

Para rodar a importação completa, use o terminal e siga os passos:

1. Acesse a pasta de scripts:
   ```bash
   cd backend/_dev_scripts
   ```

2. Execute o script master:
   ```bash
   node import_markpress_master.js
   ```

O script irá:
- Abrir as planilhas na pasta `data/`.
- Validar a conexão com o banco de dados (via `.env`).
- Inserir ou Atualizar (`UPSERT`) os dados no schema `markpress`.

## 🛠️ Detalhes Técnicos do Script
- **Schema Alvo**: `markpress`
- **Conflitos**: O script utiliza a cláusula `ON CONFLICT` para evitar duplicidade de registros, atualizando dados existentes com base na chave primária (ex: `cli_codigo`, `for_codigo`).
- **Data de Cadastro**: Para novos clientes, é inserida a data da importação.

## 📝 Regras de Negócio Importantes
- **Clientes**: O CNPJ/CPF é normalizado durante a importação para garantir buscas eficientes.
- **Cidades**: O código IBGE e UF são mantidos conforme a planilha da base nacional.

---
*Última atualização: 26/01/2026*
