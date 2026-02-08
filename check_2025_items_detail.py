import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_2025_items_detail():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- ANÁLISE DETALHADA DE ITENS 2025 (ro_consult) ---")
    
    # 1. Verificar se cada mês de 2025 tem itens associados
    cur.execute("""
        SELECT 
            EXTRACT(MONTH FROM p.ped_data) as mes, 
            COUNT(p.ped_pedido) as qtd_pedidos,
            COUNT(i.ite_pedido) as qtd_itens,
            SUM(i.ite_totliquido) as soma_itens_liq,
            AVG(p.ped_totliq) as media_ped_liq
        FROM ro_consult.pedidos p
        LEFT JOIN ro_consult.itens_ped i ON p.ped_pedido = i.ite_pedido
        WHERE p.ped_data >= '2025-01-01' AND p.ped_data <= '2025-12-31'
        GROUP BY mes
        ORDER BY mes
    """)
    results = cur.fetchall()
    
    print(f"{'Mês':<5} | {'Pedidos':<10} | {'Itens':<10} | {'Soma Itens Liq':<15}")
    print("-" * 50)
    for row in results:
        mes = int(row['mes'])
        pedidos = row['qtd_pedidos']
        itens = row['qtd_itens']
        soma = float(row['soma_itens_liq'] or 0)
        print(f"{mes:02d}    | {pedidos:<10} | {itens:<10} | R$ {soma:,.2f}")

    # 2. Verificar se existem pedidos de 2025 SEM itens (Órfãos de pai)
    cur.execute("""
        SELECT COUNT(*) as qtd
        FROM ro_consult.pedidos p
        WHERE p.ped_data >= '2025-01-01' AND p.ped_data <= '2025-12-31'
        AND NOT EXISTS (SELECT 1 FROM ro_consult.itens_ped i WHERE i.ite_pedido = p.ped_pedido)
    """)
    res_no_items = cur.fetchone()
    print(f"\nPedidos de 2025 SEM NENHUM ITEM: {res_no_items['qtd']}")

    conn.close()

if __name__ == "__main__":
    check_2025_items_detail()
