import json
import psycopg2
from psycopg2.extras import execute_values
import os

# Configurações do Banco
DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

SCHEMA = 'ro_consult'
JSON_PATH = r'e:\Sistemas_ia\SalesMasters\data\itens_ped.json'
BATCH_SIZE = 3000

def import_itens_ped_v3():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo não encontrado: {JSON_PATH}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Carregar pedidos existentes no ro_consult para evitar ÓRFÃOS
        print(f"🔍 Carregando pedidos de {SCHEMA}.pedidos para validar órfãos...")
        cur.execute(f"SELECT ped_pedido FROM {SCHEMA}.pedidos")
        pedidos_validos = {str(row[0]).strip() for row in cur.fetchall()}
        print(f"✅ {len(pedidos_validos)} pedidos válidos encontrados no banco.")

        # 2. Ler o arquivo JSON
        print(f"📖 Lendo arquivo JSON (pode demorar): {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
        
        print(f"📊 Total de registros no JSON: {len(records)}")

        # 3. Filtrar e Preparar Dados
        # Note: ite_idproduto set to 0 to avoid not-null constraint failure
        cols = [
            'ite_pedido', 'ite_industria', 'ite_seq', 'ite_produto', 
            'ite_nomeprod', 'ite_quant', 'ite_puni', 'ite_totbruto', 
            'ite_totliquido', 'ite_ipi', 'ite_idproduto'
        ]
        
        to_import = []
        skipped_orphan = 0
        
        # Mapa para gerenciar sequences se vierem nulas
        seq_map = {} # (pedido, industria) -> last_seq

        for rec in records:
            ped_id = str(rec.get('ITE_PEDIDO', '')).strip()
            ind_id = rec.get('ITE_INDUSTRIA')
            
            # Filtro de ÓRFÃO: Só importa se o pedido existir no nosso banco ro_consult
            if ped_id not in pedidos_validos:
                skipped_orphan += 1
                continue
            
            # Tratamento de ite_seq
            raw_seq = rec.get('ITE_SEQ')
            if raw_seq is None:
                key = (ped_id, ind_id)
                new_seq = seq_map.get(key, 0) + 1
                seq_map[key] = new_seq
                final_seq = new_seq
            else:
                final_seq = int(raw_seq)

            row = (
                ped_id,
                ind_id,
                final_seq,
                rec.get('ITE_PRODUTO'),
                rec.get('ITE_NOMEPROD'),
                rec.get('ITE_QUANT', 0),
                rec.get('ITE_PUNI', 0),
                rec.get('ITE_TOTBRUTO', 0),
                rec.get('ITE_TOTLIQUIDO', 0),
                rec.get('ITE_IPI', 0),
                0 # ite_idproduto set to 0 as per user request
            )
            to_import.append(row)

        print(f"✅ Filtro concluído:")
        print(f"   - Itens para importar: {len(to_import)}")
        print(f"   - Itens órfãos (pulados): {skipped_orphan}")

        if not to_import:
            print("🛑 Nenhum item para importar após filtrar órfãos.")
        else:
            # 4. Inserção em Lotes
            query = f"INSERT INTO {SCHEMA}.itens_ped ({', '.join(cols)}) VALUES %s"
            
            total_count = len(to_import)
            for i in range(0, total_count, BATCH_SIZE):
                batch = to_import[i:i + BATCH_SIZE]
                execute_values(cur, query, batch)
                conn.commit()
                print(f"📦 Lote: {min(i + BATCH_SIZE, total_count)}/{total_count}...")

            print(f"🎉 Sucesso! {total_count} itens importados no {SCHEMA}.itens_ped.")

    except Exception as e:
        print(f"❌ Erro: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    import_itens_ped_v3()
