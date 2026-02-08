import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def link_only():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Vinculando (usando apenas o que já está normalizado no catálogo)...")
    cur.execute("""
        UPDATE ro_consult.itens_ped i
        SET ite_idproduto = c.pro_id
        FROM ro_consult.cad_prod c
        WHERE i.ite_idproduto = 0
          AND i.ite_codigonormalizado = c.pro_codigonormalizado
          AND i.ite_industria = c.pro_industria;
    """)
    updated = cur.rowcount
    print(f"Vínculos criados: {updated}")
    conn.commit()

    cur.execute("SELECT COUNT(*) FROM ro_consult.itens_ped WHERE ite_idproduto = 0")
    rem = cur.fetchone()[0]
    print(f"Restantes zerados: {rem}")
    
    conn.close()

if __name__ == "__main__":
    link_only()
