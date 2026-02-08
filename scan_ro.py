import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def scan_ro_consult():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- TABLES in ro_consult ---")
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ro_consult'")
    tables = [row['table_name'] for row in cur.fetchall()]
    print(tables)
    
    # Check 'empresas' if exists
    if 'empresas' in tables:
        print("\n--- ro_consult.empresas ---")
        cur.execute("SELECT * FROM ro_consult.empresas LIMIT 5")
        rows = cur.fetchall()
        for row in rows:
            print(row)
            
    # Check if there is any table with 'ind' in name
    ind_tables = [t for t in tables if 'ind' in t]
    print(f"\n--- Tables with 'ind' in name: {ind_tables} ---")
    for t in ind_tables:
        try:
            cur.execute(f"SELECT * FROM ro_consult.{t} LIMIT 2")
            print(f"> {t}: {cur.fetchall()}")
        except: pass

    conn.close()

if __name__ == "__main__":
    scan_ro_consult()
