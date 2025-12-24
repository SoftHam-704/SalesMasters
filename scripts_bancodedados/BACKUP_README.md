# Documentação de Backup - SalesMasters

## Scripts Criados

### 1. backup_diario.bat
Script para backup automático diário do banco de dados PostgreSQL.

**Localização**: `scripts_bancodedados/backup_diario.bat`

**Funcionalidades**:
- Backup completo em formato custom (`.backup`)
- Nome do arquivo com data e hora (formato: `backup_YYYYMMDD_HHMM.backup`)
- Limpeza automática de backups antigos (mantém últimos 30 dias)
- Log de execução com status

**Configuração**:
- Database: `basesales`
- Usuário: `postgres`
- Diretório de backup: `E:\Backups\SalesMasters`

### 2. restaurar_backup.bat
Script para restauração de backup com confirmações de segurança.

**Localização**: `scripts_bancodedados/restaurar_backup.bat`

**Funcionalidades**:
- Seleção interativa do arquivo de backup
- Confirmação antes de restaurar (evita perda acidental de dados)
- Desconexão automática de usuários ativos
- Recriação do database
- Restauração completa com feedback

---

## Como Usar

### Fazer Backup Manual

1. Execute o arquivo `backup_diario.bat`
2. Aguarde a conclusão
3. O arquivo será salvo em `E:\Backups\SalesMasters\`

### Restaurar Backup

1. Execute o arquivo `restaurar_backup.bat`
2. Digite o caminho completo do arquivo de backup
3. Confirme a operação (digite S)
4. Aguarde a conclusão

**⚠️ ATENÇÃO**: A restauração irá **SUBSTITUIR** todos os dados atuais!

---

## Agendamento Automático

### Windows Task Scheduler

Para configurar backup automático diário:

1. Abra o **Agendador de Tarefas** do Windows
2. Clique em **Criar Tarefa Básica**
3. Configure:
   - **Nome**: Backup SalesMasters Diário
   - **Disparador**: Diariamente às 23:00
   - **Ação**: Iniciar um programa
   - **Programa**: `E:\Sistemas_ia\SalesMasters\scripts_bancodedados\backup_diario.bat`
4. Em **Configurações**:
   - ✅ Executar com privilégios mais altos
   - ✅ Executar independentemente de o usuário estar conectado

---

## Teste de Backup e Restauração

### Checklist de Teste

- [ ] 1. Executar `backup_diario.bat` manualmente
- [ ] 2. Verificar se arquivo foi criado em `E:\Backups\SalesMasters\`
- [ ] 3. Criar database de teste: `basesales_teste`
- [ ] 4. Modificar `restaurar_backup.bat` temporariamente para usar `basesales_teste`
- [ ] 5. Executar restauração no database de teste
- [ ] 6. Verificar se dados foram restaurados corretamente
- [ ] 7. Deletar database de teste
- [ ] 8. Reverter modificações em `restaurar_backup.bat`

---

## Backup na Nuvem (Opcional)

Para copiar backups automaticamente para a nuvem, adicione ao final de `backup_diario.bat`:

```batch
REM Copiar para Google Drive / Dropbox / OneDrive
set CLOUD_DIR=C:\Users\%USERNAME%\Google Drive\Backups\SalesMasters
if exist "%CLOUD_DIR%" (
    copy "%BACKUP_FILE%" "%CLOUD_DIR%\"
    echo Backup copiado para nuvem: %CLOUD_DIR%
)
```

---

## Solução de Problemas

### Erro: "pg_dump não é reconhecido"
- Verifique se o PostgreSQL está instalado em `C:\Program Files\PostgreSQL\16\`
- Ajuste o caminho no script se necessário

### Erro: "Autenticação falhou"
- Verifique a senha em `PGPASSWORD` no script
- Confirme que o usuário `postgres` tem permissões adequadas

### Erro: "Diretório não encontrado"
- Crie manualmente o diretório `E:\Backups\SalesMasters`
- Ou ajuste `BACKUP_DIR` no script para outro local

---

## Manutenção

### Verificar Espaço em Disco
Monitore regularmente o espaço em disco do diretório de backups.

### Testar Restauração
Recomenda-se testar a restauração mensalmente para garantir que os backups estão funcionais.

### Backup Offsite
Considere manter cópias dos backups em outro local físico ou na nuvem para proteção contra desastres.
