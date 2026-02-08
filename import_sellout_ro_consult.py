
import json
import psycopg2
from psycopg2.extras import execute_values
import os
from datetime import date

# Configurações do Banco
DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}
SCHEMA = 'ro_consult'
JSON_PATH = r'e:\Sistemas_ia\SalesMasters\data\sellout.json'
BATCH_SIZE = 3000

def import_sellout():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo não encontrado: {JSON_PATH}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Carregar registros já existentes para deduplicação
        # Chave composta: (cli_codigo, for_codigo, periodo)
        print(f"🔍 Carregando registros existentes de {SCHEMA}.crm_sellout...")
        cur.execute(f"SELECT cli_codigo, for_codigo, periodo FROM {SCHEMA}.crm_sellout")
        # Armazenamos como tuplas no set para busca O(1)
        # Note: periodo no Postgres retorna como objeto date
        existentes = {(row[0], row[1], row[2]) for row in cur.fetchall()}
        print(f"✅ {len(existentes)} registros carregados para deduplicação.")

        # 2. Ler o arquivo JSON
        print(f"📖 Lendo arquivo JSON: {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
        
        print(f"📊 Total de registros no JSON: {len(records)}")

        # 3. Filtrar e Preparar Dados
        dados_para_importar = []
        pulados_duplicados = 0
        
        # Colunas na tabela crm_sellout
        # id é serial, criado_em tem default
        cols = ['cli_codigo', 'for_codigo', 'periodo', 'valor', 'quantidade']
        
        for rec in records:
            ano = rec.get('SO_ANO')
            mes = rec.get('SO_MES')
            cli_codigo = rec.get('SO_CLIENTE')
            for_codigo = rec.get('SO_INDUSTRIA')
            
            if not all([ano, mes, cli_codigo, for_codigo]):
                continue

            # Construir o período (Primeiro dia do mês como padrão do sistema)
            periodo = date(int(ano), int(mes), 1)
            
            # Verificar duplicidade
            chave = (cli_codigo, for_codigo, periodo)
            if chave in existentes:
                pulados_duplicados += 1
                continue
            
            # Montar a tupla para inserção
            row = (
                cli_codigo,
                for_codigo,
                periodo,
                rec.get('SO_VENDA_VALOR', 0),
                rec.get('SO_VENDA_QTD', 0)
            )
            dados_para_importar.append(row)
            # Adicionar ao set local para cases de duplicidade dentro do próprio JSON
            existentes.add(chave)

        print(f"✅ Filtro concluído:")
        print(f"   - Novos registros para importar: {len(dados_para_importar)}")
        print(f"   - Pulados (já existem no banco): {pulados_duplicados}")

        if not dados_para_importar:
            print("⚠️ Nenhum registro novo para importar.")
            return

        # 4. Inserção em Lotes (BATCH_SIZE = 3000)
        query = f"""
            INSERT INTO {SCHEMA}.crm_sellout ({', '.join(cols)})
            VALUES %s
        """
        
        total_importado = 0
        for i in range(0, len(dados_para_importar), BATCH_SIZE):
            batch = dados_para_importar[i:i + BATCH_SIZE]
            execute_values(cur, query, batch)
            conn.commit()
            total_importado += len(batch)
            print(f"📦 Lote sellout: {total_importado}/{len(dados_para_importar)}...")

        print(f"\n🎉 Sucesso! {total_importado} registros de Sell-Out importados para {SCHEMA}.crm_sellout.")

    except Exception as e:
        print(f"❌ Erro durante a importação: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    import_sellout()
