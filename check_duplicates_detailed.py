import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_item_duplicates():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- INVESTIGANDO DUPLICIDADE DE ITENS (JANEIRO 2026) ---")
    
    # Busca pedidos que tem itens repetidos (mesmo pedido, mesma industria, mesma sequencia)
    cur.execute("""
        SELECT ite_pedido, ite_industria, ite_seq, COUNT(*) as ocorrencias
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
        GROUP BY ite_pedido, ite_industria, ite_seq
        HAVING COUNT(*) > 1
        LIMIT 10
    """)
    duplicates = cur.fetchall()
    
    if duplicates:
        print(f"❌ ENCONTRADA DUPLICIDADE! Existem {len(duplicates)}+ sequencias repetidas.")
        for d in duplicates:
            print(f"Pedido: {d['ite_pedido']} | Ind: {d['ite_industria']} | Seq: {d['ite_seq']} | Repetições: {d['ocorrencias']}")
    else:
        print("✅ Não foram encontradas sequencias duplicadas (ite_seq). O erro pode ser no valor unitário ou no arquivo de origem.")

    # Verificar se as indústrias que sobraram no cabeçalho (que eu não tinha achado nome) existem no Firebird
    # IDs 8 (Ranalle/Mobensani?), 3 (Sampel/Ima?)
    
    conn.close()

if __name__ == "__main__":
    check_item_duplicates()
