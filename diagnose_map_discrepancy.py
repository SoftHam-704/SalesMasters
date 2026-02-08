import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def diagnose_map_discrepancy():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SET search_path TO ro_consult, public")

    print("--- DIAGNÓSTICO DE DISCREPÂNCIA NO MAPA DE VENDAS (JAN/2026) ---")
    
    # 1. Valor "Bruto" no banco (Itens com Pedido P/F)
    cur.execute("""
        SELECT SUM(i.ite_totliquido) as total
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
          AND p.ped_situacao IN ('P', 'F')
    """)
    res_banco = cur.fetchone()['total']
    print(f"Total Banco (Itens + Pedido P/F): R$ {res_banco:,.2f}")

    # 2. Valor com JOIN Clientes (O que pode estar filtrando no relatório)
    cur.execute("""
        SELECT SUM(i.ite_totliquido) as total
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        JOIN ro_consult.clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
          AND p.ped_situacao IN ('P', 'F')
    """)
    res_cli = cur.fetchone()['total']
    print(f"Total com JOIN Clientes: R$ {res_cli:,.2f}")

    # 3. Valor com JOIN Fornecedores
    cur.execute("""
        SELECT SUM(i.ite_totliquido) as total
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        JOIN ro_consult.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
          AND p.ped_situacao IN ('P', 'F')
    """)
    res_for = cur.fetchone()['total']
    print(f"Total com JOIN Fornecedores: R$ {res_for:,.2f}")

    # 4. Valor com TODOS os JOINS (Relatório Completo)
    cur.execute("""
        SELECT SUM(i.ite_totliquido) as total
        FROM ro_consult.itens_ped i
        JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
        JOIN ro_consult.clientes c ON p.ped_cliente = c.cli_codigo
        JOIN ro_consult.fornecedores f ON p.ped_industria = f.for_codigo
        WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
          AND p.ped_situacao IN ('P', 'F')
    """)
    res_full = cur.fetchone()['total']
    print(f"Total com TODOS os JOINS (Relatório): R$ {res_full:,.2f}")

    # 5. Diferença para o valor do sistema (Delphi) que o Hamilton disse ser 5.420.367,70
    print(f"Diferença Banco vs Full JOIN: R$ {res_banco - res_full:,.2f}")

    # 6. Identificar quem está de fora (Join Clientes)
    if res_banco != res_cli:
        print("\nPedidos de fora por falta de CLIENTE:")
        cur.execute("""
            SELECT p.ped_pedido, p.ped_cliente, SUM(i.ite_totliquido) as total
            FROM ro_consult.itens_ped i
            JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
            LEFT JOIN ro_consult.clientes c ON p.ped_cliente = c.cli_codigo
            WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
              AND p.ped_situacao IN ('P', 'F')
              AND c.cli_codigo IS NULL
            GROUP BY 1, 2
        """)
        for r in cur.fetchall():
            print(f"Pedido: {r['ped_pedido']} | Cod Cli: {r['ped_cliente']} | Valor: R$ {r['total']:,.2f}")

    # 7. Identificar quem está de fora (Join Fornecedores)
    if res_banco != res_for:
        print("\nPedidos de fora por falta de FORNECEDOR (Indústria):")
        cur.execute("""
            SELECT p.ped_pedido, p.ped_industria, SUM(i.ite_totliquido) as total
            FROM ro_consult.itens_ped i
            JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido
            LEFT JOIN ro_consult.fornecedores f ON p.ped_industria = f.for_codigo
            WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31'
              AND p.ped_situacao IN ('P', 'F')
              AND f.for_codigo IS NULL
            GROUP BY 1, 2
        """)
        for r in cur.fetchall():
            print(f"Pedido: {r['ped_pedido']} | Cod Ind: {r['ped_industria']} | Valor: R$ {r['total']:,.2f}")

    conn.close()

if __name__ == "__main__":
    diagnose_map_discrepancy()
