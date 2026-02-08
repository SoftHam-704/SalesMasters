import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_fornecedores():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- COUNT fin_fornecedores ---")
    cur.execute("SELECT COUNT(*) FROM ro_consult.fin_fornecedores")
    print(cur.fetchone())

    print("\n--- SAMPLE fin_fornecedores ---")
    cur.execute("SELECT id, nome_fantasia FROM ro_consult.fin_fornecedores LIMIT 5")
    for row in cur.fetchall():
        print(row)
        
    print("\n--- DISTINCT ped_industria in PEDIDOS ---")
    cur.execute("SELECT DISTINCT ped_industria FROM ro_consult.pedidos LIMIT 10")
    print([r['ped_industria'] for r in cur.fetchall()])
    
    conn.close()

if __name__ == "__main__":
    check_fornecedores()
