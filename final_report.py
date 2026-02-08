import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def run_report():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # 1. Get Distinct Industries from Orders
    cur.execute("""
        SELECT DISTINCT ped_industria 
        FROM ro_consult.pedidos 
        WHERE ped_situacao IN ('P', 'F') 
        AND ped_data >= '2026-01-01'
        AND ped_data <= '2026-01-31'
    """)
    ped_inds = [row['ped_industria'] for row in cur.fetchall()]
    print(f"Industries in Orders (Jan 2026): {ped_inds}")
    
    # 2. Check match in PUBLIC.fornecedores (since ro_consult.fornecedores implies checking where it exists)
    # The user said 'relacionamento é com a tabela fornecedores.for_codigo'
    print("\n--- Checking public.fornecedores ---")
    if ped_inds:
        placeholders = ','.join(['%s'] * len(ped_inds))
        cur.execute(f"SELECT for_codigo, for_nomered FROM public.fornecedores WHERE for_codigo IN ({placeholders})", tuple(ped_inds))
        rows = cur.fetchall()
        print(f"Found {len(rows)} matches in public.fornecedores.")
        for r in rows:
            print(f"ID {r['for_codigo']} -> {r['for_nomered']}")
            
    # 3. Run the Full Report Query
    print("\n--- REPORT JAN 2026 ---")
    query = """
        SELECT
            f.for_nomered as industria,
            SUM(p.ped_totliq) as total_liquido
        FROM
            ro_consult.pedidos p
        JOIN
            public.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE
            p.ped_situacao IN ('P', 'F')
            AND p.ped_data >= '2026-01-01'
            AND p.ped_data <= '2026-01-31'
        GROUP BY
            f.for_nomered
        ORDER BY
            total_liquido DESC;
    """
    cur.execute(query)
    results = cur.fetchall()
    
    total = 0
    print(f"{'INDUSTRIA':<30} | {'TOTAL':>15}")
    print("-" * 50)
    for row in results:
        val = float(row['total_liquido'])
        total += val
        print(f"{row['industria']:<30} | {val:,.2f}")
    print("-" * 50)
    print(f"{'TOTAL GERAL':<30} | {total:,.2f}")

    conn.close()

if __name__ == "__main__":
    run_report()
