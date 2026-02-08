import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def final_correct_report():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Note: Summing ite_totliquido from items grouped by industry
    query = """
        SELECT
            f.for_nomered as industria,
            SUM(i.ite_totliquido) as total_liquido
        FROM
            ro_consult.itens_ped i
        JOIN
            ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        LEFT JOIN
            ro_consult.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE
            p.ped_situacao IN ('P', 'F')
            AND p.ped_data >= '2026-01-01'
            AND p.ped_data <= '2026-01-31'
        GROUP BY
            f.for_nomered, p.ped_industria
        ORDER BY
            total_liquido DESC;
    """
    
    print("--- RELATÓRIO REAL JANEIRO 2026 (BASEADO NOS FILHOS) ---")
    cur.execute(query)
    results = cur.fetchall()
    
    total = 0
    print(f"{'INDUSTRIA':<30} | {'TOTAL REAL (ITENS)':>20}")
    print("-" * 55)
    for row in results:
        nome = row['industria'] or 'DESCONHECIDO'
        val = float(row['total_liquido'])
        total += val
        print(f"{nome:<30} | R$ {val:,.2f}")
    print("-" * 55)
    print(f"{'TOTAL GERAL':<30} | R$ {total:,.2f}")
    
    conn.close()

if __name__ == "__main__":
    final_correct_report()
