# Development Scripts

Esta pasta contém scripts de desenvolvimento, debug, testes e utilitários que foram usados durante o desenvolvimento do SalesMasters.

## Categorias

- **check_*.js** - Scripts de verificação de estruturas de banco de dados e tabelas
- **debug_*.js** - Scripts de debug para diagnosticar problemas
- **inspect_*.js** - Scripts para inspecionar arquivos Excel e dados
- **test_*.js** - Scripts de teste de APIs e funcionalidades
- **import_*.js** - Scripts de importação de dados (já executados)
- **migrate_*.js** - Scripts de migração de dados (já executados)
- **analyze_*.js** - Scripts de análise de dados
- **create_*.js** - Scripts de criação de funções SQL e tabelas
- **fix_*.js** - Scripts de correção de problemas pontuais

## Como Usar

Estes scripts são executáveis standalone:

```bash
node _dev_scripts/check_tables.js
node _dev_scripts/import_clientes.js
```

## Importante

⚠️ **Estes scripts NÃO são importados pelo `server.js`**  
⚠️ Foram movidos para organização - podem ser restaurados se necessário  
⚠️ A maioria já foi executada e serviu seu propósito no setup inicial
