import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def final_report():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    query = """
        SELECT
            f.for_nomered as industria,
            SUM(p.ped_totliq) as total_liquido
        FROM
            ro_consult.pedidos p
        JOIN
            ro_consult.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE
            p.ped_situacao IN ('P', 'F')
            AND p.ped_data >= '2026-01-01'
            AND p.ped_data <= '2026-01-31'
        GROUP BY
            f.for_nomered
        ORDER BY
            total_liquido DESC;
    """
    
    print("--- RELATORIO DE VENDAS JANEIRO 2026 (RO_CONSULT) ---")
    cur.execute(query)
    results = cur.fetchall()
    
    total = 0
    print(f"{'INDUSTRIA':<30} | {'TOTAL LIQUIDO':>15}")
    print("-" * 50)
    for row in results:
        nome = row['industria']
        val = float(row['total_liquido'])
        total += val
        print(f"{nome:<30} | {val:,.2f}")
    print("-" * 50)
    print(f"{'TOTAL GERAL':<30} | {total:,.2f}")
    
    conn.close()

if __name__ == "__main__":
    final_report()
