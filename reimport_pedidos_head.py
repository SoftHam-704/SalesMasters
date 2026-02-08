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
BATCH_SIZE = 1000

def parse_date(date_str):
    try:
        if not date_str: return None
        # Converte "02.01.2026" para "2026-01-02"
        return datetime.strptime(date_str, '%d.%m.%Y').date()
    except Exception:
        return None

def clean_obs(obs):
    if not obs: return None
    # Substitui CR (0x0D), LF (0x0A) por espaços para limpar a observação
    return obs.replace('\r', ' ').replace('\n', ' ').strip()

def import_pedidos_head():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo JSON não encontrado em: {JSON_PATH}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Carregar chaves existentes para evitar duplicidade (Safety First)
        print(f"🔍 Verificando pedidos existentes em {SCHEMA}.pedidos...")
        cur.execute(f"SELECT ped_pedido FROM {SCHEMA}.pedidos")
        pedidos_no_banco = {str(row[0]).strip() for row in cur.fetchall()}
        print(f"✅ {len(pedidos_no_banco)} pedidos encontrados no banco.")

        # 2. Ler o arquivo JSON
        print(f"📖 Lendo JSON: {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
        
        print(f"📊 Registros no JSON: {len(records)}")

        # 3. Preparar colunas e dados (Ignorando datas de faturamento/envio conforme pedido)
        cols = [
            'ped_numero', 'ped_pedido', 'ped_tabela', 'ped_data', 
            'ped_industria', 'ped_cliente', 'ped_transp', 'ped_vendedor',
            'ped_cliind', 'ped_situacao', 'ped_totliq', 'ped_totbruto',
            'ped_obs', 'ped_condpag', 'ped_totalipi'
        ]
        
        to_import = []
        skipped_date = 0
        skipped_exists = 0
        
        for rec in records:
            ped_id = str(rec.get('PED_PEDIDO', '')).strip()
            ped_data = parse_date(rec.get('PED_DATA'))

            # Trava de segurança: Apenas Janeiro de 2026 (Migration target)
            if not ped_data or ped_data.year != 2026 or ped_data.month != 1:
                skipped_date += 1
                continue

            if ped_id in pedidos_no_banco:
                skipped_exists += 1
                continue
            
            # Montar a tupla com limpeza de OBS e ignorando DATAFAT/DATAENVIO
            row = (
                rec.get('PED_NUMERO'),
                ped_id,
                rec.get('PED_TABELA'),
                ped_data,
                rec.get('PED_INDUSTRIA'),
                rec.get('PED_CLIENTE'),
                rec.get('PED_TRANSP'),
                rec.get('PED_VENDEDOR'),
                rec.get('PED_CLIIND'),
                rec.get('PED_SITUACAO', 'P'),
                rec.get('PED_TOTLIQ', 0),
                rec.get('PED_TOTBRUTO', 0),
                clean_obs(rec.get('PED_OBS')),
                rec.get('PED_CONDPAG'),
                rec.get('PED_TOTALIPI', 0)
            )
            to_import.append(row)
            pedidos_no_banco.add(ped_id)

        print(f"✅ Filtros:")
        print(f"   - Para importar: {len(to_import)}")
        print(f"   - Pulados (Não Janeiro/2026): {skipped_date}")
        print(f"   - Pulados (Já existem): {skipped_exists}")

        if not to_import:
            print("🛑 Nada para importar.")
        else:
            # 4. Inserção
            placeholders = ", ".join(["%s"] * len(cols))
            query = f"INSERT INTO {SCHEMA}.pedidos ({', '.join(cols)}) VALUES %s"
            
            for i in range(0, len(to_import), BATCH_SIZE):
                batch = to_import[i:i + BATCH_SIZE]
                execute_values(cur, query, batch)
                conn.commit()
                print(f"📦 Importado: {i + len(batch)}/{len(to_import)}...")

            print(f"🎉 Importação de CABEÇALHOS finalizada!")

    except Exception as e:
        print(f"❌ Erro: {e}")
        if 'conn' in locals(): conn.rollback()
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    import_pedidos_head()
