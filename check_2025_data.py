import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_2025_data():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- VERIFICAÇÃO DE DADOS DO ANO DE 2025 (SCHEMA ro_consult) ---")
    
    # 1. Total de pedidos em 2025
    cur.execute("""
        SELECT COUNT(*) as qtd, SUM(ped_totliq) as total 
        FROM ro_consult.pedidos 
        WHERE ped_data >= '2025-01-01' AND ped_data <= '2025-12-31'
    """)
    res = cur.fetchone()
    print(f"Pedidos em 2025: {res['qtd']} | Total Líquido: R$ {res['total'] or 0:,.2f}")

    # 2. Distribuição por Mês em 2025
    print("\nDistribuição mensal em 2025:")
    cur.execute("""
        SELECT 
            EXTRACT(MONTH FROM ped_data) as mes, 
            COUNT(*) as qtd, 
            SUM(ped_totliq) as total
        FROM ro_consult.pedidos 
        WHERE ped_data >= '2025-01-01' AND ped_data <= '2025-12-31'
        GROUP BY mes
        ORDER BY mes
    """)
    for row in cur.fetchall():
        print(f"Mês {int(row['mes']):02d}: {row['qtd']} pedidos | Total: R$ {row['total']:,.2f}")

    # 3. Verificar se existem ITENS para esses pedidos
    cur.execute("""
        SELECT COUNT(*) as qtd
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data >= '2025-01-01' AND p.ped_data <= '2025-12-31'
    """)
    items_res = cur.fetchone()
    print(f"\nTotal de ITENS em 2025: {items_res['qtd']}")

    conn.close()

if __name__ == "__main__":
    check_2025_data()
