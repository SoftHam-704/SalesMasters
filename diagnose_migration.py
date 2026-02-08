import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def deep_diagnose():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- DIAGNÓSTICO PROFUNDO JANEIRO 2026 (RO_CONSULT) ---")
    
    # 1. Totais por Status (Ver se o dinheiro está "preso" em outro status)
    print("\n1. TOTAIS POR STATUS:")
    cur.execute("""
        SELECT 
            ped_situacao, 
            COUNT(*) as qtd,
            SUM(ped_totliq) as total_liquido,
            SUM(ped_totbruto) as total_bruto
        FROM ro_consult.pedidos 
        WHERE ped_data BETWEEN '2026-01-01' AND '2026-01-31'
        GROUP BY ped_situacao
        ORDER BY total_liquido DESC
    """)
    for row in cur.fetchall():
        print(f"Status {row['ped_situacao']}: {row['qtd']} pedidos | Liq: R$ {row['total_liquido']:,.2f} | Bruto: R$ {row['total_bruto']:,.2f}")

    # 2. Verificar pedidos com datas estranhas ou fora do range que podem ser de Janeiro
    print("\n2. PEDIDOS COM DATAS INVÁLIDAS OU FORA DE 2026 (Potencial erro de parsing):")
    cur.execute("""
        SELECT COUNT(*) as qtd, SUM(ped_totliq) as total 
        FROM ro_consult.pedidos 
        WHERE ped_data < '2023-01-01' OR ped_data IS NULL
    """)
    row = cur.fetchone()
    print(f"Pedidos 'Ano Antigo' ou Nulo: {row['qtd']} | Total: R$ {row['total'] or 0:,.2f}")

    # 3. Verificar o total GERAL de Janeiro (Sem filtro de status)
    cur.execute("""
        SELECT 
            SUM(ped_totliq) as total_liq_geral,
            SUM(ped_totbruto) as total_bruto_geral
        FROM ro_consult.pedidos 
        WHERE ped_data BETWEEN '2026-01-01' AND '2026-01-31'
    """)
    res = cur.fetchone()
    print(f"\n3. TOTAL GERAL JANEIRO 2026 (SEM FILTRO):")
    print(f"Líquido: R$ {res['total_liq_geral']:,.2f}")
    print(f"Bruto:   R$ {res['total_bruto_geral']:,.2f}")

    conn.close()

if __name__ == "__main__":
    deep_diagnose()
