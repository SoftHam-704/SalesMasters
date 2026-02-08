
import json
import psycopg2
from psycopg2.extras import execute_values
import os
import sys

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

def import_itens():
    if not os.path.exists(JSON_PATH):
        print(f"❌ Arquivo não encontrado: {JSON_PATH}")
        return

    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        # 1. Carregar pedidos existentes para validação Pai (Requisito 1)
        print(f"🔍 Carregando pedidos de {SCHEMA}.pedidos...")
        cur.execute(f"SELECT ped_pedido FROM {SCHEMA}.pedidos")
        pedidos_existentes = {row[0] for row in cur.fetchall()}
        print(f"✅ {len(pedidos_existentes)} pedidos carregados para validação referencial.")

        # 2. Carregar CHAVES ÚNICAS dos itens para evitar duplicidade
        # Chave: (ite_pedido, ite_industria, ite_produto)
        print(f"🕵️ Carregando chaves (pedido, industria, produto) ja existentes...")
        cur.execute(f"SELECT ite_pedido, ite_industria, ite_produto FROM {SCHEMA}.itens_ped")
        chaves_existentes = {(row[0], row[1], row[2]) for row in cur.fetchall()}
        print(f"✅ {len(chaves_existentes)} chaves de itens carregadas para deduplicação.")

        # 3. Ler o arquivo JSON
        print(f"📖 Lendo arquivo JSON: {JSON_PATH}...")
        with open(JSON_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
            records = data.get('RecordSet', [])
        
        print(f"📊 Total de registros no JSON: {len(records)}")

        # 4. Filtrar e Preparar Dados
        itens_para_importar = []
        descartados_orfaos = 0
        descartados_duplicados = 0
        
        # Colunas mapeadas
        cols = [
            'ite_pedido', 'ite_industria', 'ite_produto', 'ite_idproduto',
            'ite_embuch', 'ite_nomeprod', 'ite_grupo', 'ite_quant', 
            'ite_puni', 'ite_puniliq', 'ite_totliquido', 'ite_descadic',
            'ite_des1', 'ite_des2', 'ite_des3', 'ite_des4', 'ite_des5', 
            'ite_des6', 'ite_des7', 'ite_status'
        ]
        
        for rec in records:
            ped_id = rec.get('ITE_PEDIDO')
            ind_id = rec.get('ITE_INDUSTRIA')
            prod_id = rec.get('ITE_PRODUTO')
            
            # Validação 1: Registro Pai
            if ped_id not in pedidos_existentes:
                descartados_orfaos += 1
                continue
            
            # Validação 2: Duplicidade (Chave Composta)
            chave = (ped_id, ind_id, prod_id)
            if chave in chaves_existentes:
                descartados_duplicados += 1
                continue
            
            # Montar a tupla para inserção
            row = (
                ped_id,
                ind_id,
                prod_id,
                0, # ite_idproduto (ignorar relacionamento por enquanto)
                rec.get('ITE_EMBUCH', ''),
                rec.get('ITE_NOMEPROD', ''),
                rec.get('ITE_GRUPO', 0),
                rec.get('ITE_QUANT', 0),
                rec.get('ITE_PUNI', 0),
                rec.get('ITE_PUNILIQ', 0),
                rec.get('ITE_TOTLIQUIDO', 0),
                rec.get('ITE_DESCADIC', 0),
                rec.get('ITE_DES1', 0),
                rec.get('ITE_DES2', 0),
                rec.get('ITE_DES3', 0),
                rec.get('ITE_DES4', 0),
                rec.get('ITE_DES5', 0),
                rec.get('ITE_DES6', 0),
                rec.get('ITE_DES7', 0),
                'A' # Status Ativo
            )
            itens_para_importar.append(row)
            # Adicionar ao set local para evitar duplicatas dentro do mesmo JSON
            chaves_existentes.add(chave)

        print(f"✅ Filtro concluído:")
        print(f"   - Prontos para importar: {len(itens_para_importar)}")
        print(f"   - Pulados (já existem no banco): {descartados_duplicados}")
        print(f"   - Descartados (sem Pedido Pai): {descartados_orfaos}")

        if not itens_para_importar:
            print("⚠️ Nenhum registro NOVO encontrado para importar.")
            return

        # 5. Inserção em Lotes (BATCH_SIZE = 3000)
        query = f"""
            INSERT INTO {SCHEMA}.itens_ped ({', '.join(cols)})
            VALUES %s
        """
        
        total_importado = 0
        for i in range(0, len(itens_para_importar), BATCH_SIZE):
            batch = itens_para_importar[i:i + BATCH_SIZE]
            execute_values(cur, query, batch)
            conn.commit()
            total_importado += len(batch)
            print(f"📦 Lote itens: {total_importado}/{len(itens_para_importar)}...")

        print(f"\n🎉 Sucesso! {total_importado} NOVOS itens importados para {SCHEMA}.itens_ped.")

    except Exception as e:
        print(f"❌ Erro durante a importação: {e}")
        if 'conn' in locals():
            conn.rollback()
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    import_itens()
