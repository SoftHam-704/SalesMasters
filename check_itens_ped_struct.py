import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def check_constraints():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("--- CONSTRAINTS FOR ro_consult.itens_ped ---")
    cur.execute("""
        SELECT conname, pg_get_constraintdef(c.oid)
        FROM pg_constraint c
        JOIN pg_namespace n ON n.oid = c.connamespace
        WHERE n.nspname = 'ro_consult' AND conrelid = 'ro_consult.itens_ped'::regclass
    """)
    for row in cur.fetchall():
        print(row)
        
    print("\n--- COLUMNS FOR ro_consult.itens_ped ---")
    cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'itens_ped'")
    for row in cur.fetchall():
        print(row)
        
    conn.close()

if __name__ == "__main__":
    check_constraints()
