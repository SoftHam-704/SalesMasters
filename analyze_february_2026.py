import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def analyze_february_2026():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    print("--- ANÁLISE DE FEVEREIRO/2026 (SISTEMA AO VIVO) ---")
    
    # 1. Verificar disparidade entre Cabeçalho e Soma dos Itens para Fevereiro
    cur.execute("""
        SELECT 
            COUNT(p.ped_pedido) as qtd_pedidos,
            SUM(p.ped_totliq) as total_head_liq,
            SUM(sub.total_item_liq) as total_items_liq,
            SUM(sub.total_item_liq) - SUM(p.ped_totliq) as diferenca
        FROM ro_consult.pedidos p
        LEFT JOIN (
            SELECT ite_pedido, SUM(ite_totliquido) as total_item_liq
            FROM ro_consult.itens_ped
            GROUP BY ite_pedido
        ) sub ON p.ped_pedido = sub.ite_pedido
        WHERE p.ped_data >= '2026-02-01' AND p.ped_data <= '2026-02-28'
        AND p.ped_situacao IN ('P', 'F')
    """)
    res = cur.fetchone()
    
    print(f"Pedidos em Fevereiro: {res['qtd_pedidos']}")
    print(f"Total nos Cabeçalhos: R$ {res['total_head_liq'] or 0:,.2f}")
    print(f"Total Real (Soma Itens): R$ {res['total_items_liq'] or 0:,.2f}")
    print(f"Diferença Detectada: R$ {res['diferenca'] or 0:,.2f}")

    # 2. Listar pedidos com divergência em Fevereiro (se houver)
    if res['diferenca'] and abs(res['diferenca']) > 0.01:
        print("\n--- DETALHE DE PEDIDOS COM DIVERGÊNCIA EM FEVEREIRO ---")
        cur.execute("""
            SELECT 
                p.ped_pedido, 
                p.ped_data,
                p.ped_totliq as valor_head, 
                COALESCE(sub.total_item_liq, 0) as valor_itens
            FROM ro_consult.pedidos p
            LEFT JOIN (
                SELECT ite_pedido, SUM(ite_totliquido) as total_item_liq
                FROM ro_consult.itens_ped
                GROUP BY ite_pedido
            ) sub ON p.ped_pedido = sub.ite_pedido
            WHERE p.ped_data >= '2026-02-01' AND p.ped_data <= '2026-02-28'
            AND ABS(p.ped_totliq - COALESCE(sub.total_item_liq, 0)) > 0.01
        """)
        diffs = cur.fetchall()
        for d in diffs:
            print(f"Pedido: {d['ped_pedido']} | Data: {d['ped_data']} | Head: {d['valor_head']:,.2f} | Items: {d['valor_itens']:,.2f} | Diff: {d['valor_itens'] - d['valor_head']:,.2f}")

    conn.close()

if __name__ == "__main__":
    analyze_february_2026()
