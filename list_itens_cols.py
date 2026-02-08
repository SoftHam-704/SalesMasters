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
    cur.execute("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'itens_ped' ORDER BY ordinal_position")
    cols = cur.fetchall()
    for c in cols:
        print(f"{c['column_name']}: {c['is_nullable']}")
    conn.close()

if __name__ == "__main__":
    list_cols()
