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

    query = """
        SELECT
            f.for_nomered as industria,
            SUM(p.ped_totliq) as total_liquido
        FROM
            ro_consult.pedidos p
        LEFT JOIN
            markpress.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE
            p.ped_situacao IN ('P', 'F')
            AND p.ped_data >= '2026-01-01'
            AND p.ped_data <= '2026-01-31'
        GROUP BY
            f.for_nomered, p.ped_industria
        ORDER BY
            total_liquido DESC;
    """
    
    print("--- RELATORIO DE VENDAS JANEIRO 2026 (RO_CONSULT) ---")
    print("Nota: Utilizando nomes de 'markpress.fornecedores' pois 'ro_consult.fornecedores' não foi encontrada.")
    
    cur.execute(query)
    results = cur.fetchall()
    
    total = 0
    print(f"{'INDUSTRIA':<30} | {'TOTAL':>15}")
    print("-" * 50)
    for row in results:
        nome = row['industria'] or 'DESCONHECIDO'
        val = float(row['total_liquido'])
        total += val
        print(f"{nome:<30} | {val:,.2f}")
    print("-" * 50)
    print(f"{'TOTAL GERAL':<30} | {total:,.2f}")
    
    print("\n\n--- SQL ---")
    print(query)

    conn.close()

if __name__ == "__main__":
    run_report()
