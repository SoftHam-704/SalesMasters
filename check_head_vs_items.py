import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def compare_head_vs_items():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- COMPARATIVO CABEÇALHO VS ITENS (JANEIRO 2026) ---")
    
    # 1. Soma dos Cabeçalhos
    cur.execute("""
        SELECT SUM(ped_totliq) as total_head, SUM(ped_totbruto) as total_bruto_head, COUNT(*) as qtd
        FROM ro_consult.pedidos 
        WHERE ped_data BETWEEN '2026-01-01' AND '2026-01-31'
        AND ped_situacao IN ('P', 'F')
    """)
    head = cur.fetchone()
    print(f"CABEÇALHOS (Pedidos):")
    print(f"  - Qtd: {head['qtd']}")
    print(f"  - Total Líquido: R$ {head['total_head']:,.2f}")
    print(f"  - Total Bruto:   R$ {head['total_bruto_head']:,.2f}")

    # 2. Soma dos Itens (Geral do mês)
    cur.execute("""
        SELECT SUM(i.ite_totliquido) as total_items, SUM(i.ite_totbruto) as total_bruto_items, COUNT(*) as qtd
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
        AND p.ped_situacao IN ('P', 'F')
    """)
    items = cur.fetchone()
    print(f"\nITENS (Produtos):")
    print(f"  - Qtd Itens: {items['qtd']}")
    print(f"  - Total Líquido (ite_totliquido): R$ {items['total_items'] or 0:,.2f}")
    print(f"  - Total Bruto (ite_totbruto):     R$ {items['total_bruto_items'] or 0:,.2f}")

    # 3. Verificar se existem itens sem pedido (Órfãos)
    cur.execute("""
        SELECT COUNT(*) as qtd, SUM(ite_totliquido) as total
        FROM ro_consult.itens_ped
        WHERE ite_pedido NOT IN (SELECT ped_pedido FROM ro_consult.pedidos)
    """)
    orphans = cur.fetchone()
    print(f"\nITENS ÓRFÃOS (Sem cabeçalho no ro_consult):")
    print(f"  - Qtd: {orphans['qtd']}")
    print(f"  - Total: R$ {orphans['total'] or 0:,.2f}")

    conn.close()

if __name__ == "__main__":
    compare_head_vs_items()
