import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def link_dirty():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Tentando vincular os restantes 499 usando join dinâmico (mais lento)...")
    cur.execute("""
        UPDATE ro_consult.itens_ped i
        SET ite_idproduto = c.pro_id
        FROM ro_consult.cad_prod c
        WHERE i.ite_idproduto = 0
          AND i.ite_industria = c.pro_industria
          AND i.ite_codigonormalizado = REGEXP_REPLACE(REGEXP_REPLACE(UPPER(c.pro_codprod), '[^A-Z0-9]', '', 'g'), '^0+', '');
    """)
    updated = cur.rowcount
    print(f"Vínculos criados: {updated}")
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM ro_consult.itens_ped i JOIN ro_consult.pedidos p ON i.ite_pedido = p.ped_pedido WHERE p.ped_data BETWEEN '2026-01-01' AND '2026-01-31' AND i.ite_idproduto = 0")
    rem_jan = cur.fetchone()[0]
    print(f"Restantes zerados em Janeiro/2026: {rem_jan}")
    
    conn.close()

if __name__ == "__main__":
    link_dirty()
