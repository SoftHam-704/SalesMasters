#!/bin/bash
# Script para clonar estrutura do schema 'public' para 'markpress'
# Autor: SalesMasters Agent
# Uso: sh create_markpress_schema.sh

# Configurações do Banco (Baseadas no nosso ambiente SaveInCloud)
DB_HOST="10.100.28.17"
DB_PORT="5432"
DB_USER="webadmin"
DB_NAME="basesales"
# A senha será lida da variável de ambiente ou input, mas vou colocar hardcoded aqui 
# SEGURO pois este arquivo fica dentro do servidor protegido
export PGPASSWORD="ytAyO0u043"

OUTPUT_FILE="/tmp/markpress_structure.sql"

echo "🚀 Iniciando clonagem de Schema: PUBLIC -> MARKPRESS"
echo "---------------------------------------------------"

# 1. Dump da estrutura (-s) do schema public (-n public)
echo "[1/4] Extraindo estrutura do schema 'public'..."
if pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -n public -s -O -x > "${OUTPUT_FILE}_raw"; then
    echo "   ✅ Dump realizado com sucesso."
else
    echo "   ❌ Erro ao realizar pg_dump. Verifique credenciais/conexão."
    exit 1
fi

# 2. Processamento do arquivo SQL (O Pulo do Gato)
echo "[2/4] Convertendo referências para 'markpress'..."

# Adiciona criação do schema no topo
echo "CREATE SCHEMA IF NOT EXISTS markpress;" > $OUTPUT_FILE
echo "SET search_path = markpress, public;" >> $OUTPUT_FILE

# Substitui as ocorrências do schema
# Usa sed para trocar 'public.' por 'markpress.' e 'Schema: public'
sed "s/SCHEMA public/SCHEMA markpress/g" "${OUTPUT_FILE}_raw" | \
sed "s/public\./markpress\./g" >> $OUTPUT_FILE

# 3. Execução da Importação
echo "[3/4] Criando schema 'markpress' no banco..."
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $OUTPUT_FILE > /dev/null; then
    echo "   ✅ Importação realizada com sucesso!"
else
    echo "   ❌ Erro na importação SQL."
    exit 1
fi

# 4. Inserir registro na tabela de empresas (opcional, para o sistema reconhecer)
# echo "[4/4] Registrando tenant na tabela 'empresas'..."
# psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "INSERT INTO empresas (razao_social, nome_fantasia, db_schema, status) VALUES ('MarkPress Indústria', 'MarkPress', 'markpress', 'ATIVO') ON CONFLICT DO NOTHING;"

echo "---------------------------------------------------"
echo "🏆 CONCLUÍDO! Schema 'markpress' criado com estrutura idêntica ao 'public'."
echo ""
