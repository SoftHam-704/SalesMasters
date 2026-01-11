---
description: Reinstalar todo o container na SaveInCloud
---

# Reinstalação completa do container na SaveInCloud

Esta workflow descreve o processo passo‑a‑passo para remover o container atual, limpar imagens antigas e recriar/reimplantar o ambiente completo na plataforma **SaveInCloud**.

## Pré‑requisitos
- Acesso ao painel da SaveInCloud com permissões de **Deploy**.
- Credenciais SSH ou acesso ao terminal da máquina onde o container será gerenciado (geralmente via `ssh` ao servidor da SaveInCloud).
- Docker e Docker‑Compose instalados no host (versões recentes são recomendadas).
- Variáveis de ambiente necessárias para a aplicação (ex.: `DB_HOST`, `DB_USER`, `DB_PASS`, `API_URL`).

## Passos
1. **Conectar ao servidor SaveInCloud**
   ```bash
   ssh user@saveincloud-server-ip
   ```
   Substitua `user` e `saveincloud-server-ip` pelos valores corretos.

2. **Parar e remover containers existentes**
   ```bash
   docker-compose down --remove-orphans
   ```
   Isso garante que todos os containers definidos no `docker-compose.yml` sejam interrompidos e removidos.

3. **Limpar imagens antigas (opcional, mas recomendado)**
   ```bash
   docker image prune -a -f
   ```
   Remove imagens não utilizadas para evitar conflitos de versão.

4. **Atualizar o código-fonte**
   - Se o código estiver em um repositório Git, faça pull da última versão:
     ```bash
     git pull origin main
     ```
   - Caso esteja enviando um .zip, copie‑o para o servidor e extraia:
     ```bash
     unzip salesmasters_latest.zip -d /path/to/project
     ```

5. **Revisar/Atualizar variáveis de ambiente**
   - Edite o arquivo `.env` (ou outro mecanismo de configuração) com as credenciais corretas.
   - Exemplo de `.env`:
     ```dotenv
     DB_HOST=postgres.saveincloud.com.br
     DB_PORT=5432
     DB_USER=sales_user
     DB_PASS=super_secret
     API_URL=https://salesmasters.softham.com.br/api
     ```

6. **Construir e iniciar os containers**
   ```bash
   docker-compose up -d --build
   ```
   O flag `--build` garante que as imagens sejam reconstruídas a partir do Dockerfile atualizado.

7. **Verificar logs e saúde dos serviços**
   ```bash
   docker-compose logs -f
   ```
   - Confirme que o backend (Node.js) está escutando na porta `8080`.
   - Verifique se o BI Engine (Python) está rodando sem erros.
   - Teste a conexão ao banco de dados.

8. **Validar o deployment**
   - Abra o navegador e acesse `https://salesmasters.softham.com.br`.
   - Verifique se a aplicação carrega corretamente e se todas as funcionalidades (login, dashboards, APIs) estão operacionais.

9. **Limpar arquivos temporários (opcional)**
   ```bash
   rm -rf /tmp/*
   ```

## Dicas avançadas
- **Rollback rápido**: mantenha uma tag Git (`previous-stable`) antes de atualizar. Caso algo falhe, basta fazer checkout dessa tag e repetir os passos 4‑6.
- **Backup de banco**: antes de mudar variáveis de conexão, faça backup do banco na SaveInCloud usando `pg_dump`.
- **Monitoramento**: configure alertas no painel da SaveInCloud para uso de CPU/memória dos containers.

---

**⚡️ Esta workflow está pronta para ser usada.** Basta seguir os passos na ordem indicada ou adaptar conforme seu fluxo de CI/CD.
