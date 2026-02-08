
import json
import psycopg2
from psycopg2.extras import execute_values
import os
from datetime import datetime

# Configurações do Banco
DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}
SCHEMA = 'ro_consult'
JSON_PATH = r'e:\Sistemas_ia\SalesMasters\data\pedidos.json'
BATCH_SIZE = 3000

def parse_date(date_str):
    try:
        if not date_str: return None
        # Converte "02.02.2026" para "2026-02-02"
        return datetime.strptime(date_str, '%d.%m.%Y').date()
    except Exception:
        return None

def import_pedidos():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo não encontrado: {JSON_PATH}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Carregar pedidos que já existem para evitar duplicidade
        print(f"🔍 Carregando pedidos já existentes em {SCHEMA}.pedidos...")
        cur.execute(f"SELECT ped_pedido FROM {SCHEMA}.pedidos")
        pedidos_no_banco = {row[0] for row in cur.fetchall()}
        print(f"✅ {len(pedidos_no_banco)} pedidos encontrados no banco.")

        # 2. Ler o arquivo JSON
        print(f"📖 Lendo arquivo JSON: {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
        
        print(f"📊 Total de registros no JSON: {len(records)}")

        # 3. Filtrar novos pedidos
        pedidos_para_importar = []
        duplicados_nas_chaves = 0
        
        # Colunas com base na estrutura ro_consult.pedidos
        cols = [
            'ped_numero', 'ped_pedido', 'ped_tabela', 'ped_data', 
            'ped_industria', 'ped_cliente', 'ped_transp', 'ped_vendedor',
            'ped_cliind', 'ped_situacao', 'ped_totliq', 'ped_totbruto'
        ]
        
        for rec in records:
            ped_id = rec.get('PED_PEDIDO')
            
            if ped_id in pedidos_no_banco:
                duplicados_nas_chaves += 1
                continue
            
            # Montar a tupla
            row = (
                rec.get('PED_NUMERO'),
                ped_id,
                rec.get('PED_TABELA', ''),
                parse_date(rec.get('PED_DATA')),
                rec.get('PED_INDUSTRIA'),
                rec.get('PED_CLIENTE'),
                rec.get('PED_TRANSP'),
                rec.get('PED_VENDEDOR'),
                rec.get('PED_CLIIND', ''),
                rec.get('PED_SITUACAO', 'P'),
                rec.get('PED_TOTLIQ', 0),
                rec.get('PED_TOTBRUTO', 0)
            )
            pedidos_para_importar.append(row)
            # Adicionar ao set local para evitar duplicidade dentro do próprio JSON
            pedidos_no_banco.add(ped_id)

        print(f"✅ Filtro concluído:")
        print(f"   - Novos pedidos para importar: {len(pedidos_para_importar)}")
        print(f"   - Pulados (já existentes): {duplicados_nas_chaves}")

        if not pedidos_para_importar:
            print("⚠️ Todos os pedidos já estão no banco.")
        else:
            # 4. Inserção em Lotes
            query = f"""
                INSERT INTO {SCHEMA}.pedidos ({', '.join(cols)})
                VALUES %s
            """
            
            total_importado = 0
            for i in range(0, len(pedidos_para_importar), BATCH_SIZE):
                batch = pedidos_para_importar[i:i + BATCH_SIZE]
                execute_values(cur, query, batch)
                conn.commit()
                total_importado += len(batch)
                print(f"📦 Lote pedidos: {total_importado}/{len(pedidos_para_importar)}...")

            print(f"🎉 Sucesso! {total_importado} novos pedidos importados.")

    except Exception as e:
        print(f"❌ Erro durante a importação: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    import_pedidos()
