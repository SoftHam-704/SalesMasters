import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def list_cols():
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'pedidos'")
    cols = [r['column_name'] for r in cur.fetchall()]
    print(f"Columns in ro_consult.pedidos: {cols}")
    conn.close()

if __name__ == "__main__":
    list_cols()
