
import psycopg2
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def run():
    SCHEMA = 'brasil_wl'
    try:
        conn = psycopg2.connect(
            host="node254557-salesmaster.sp1.br.saveincloud.net.br",
            port=13062,
            database="basesales",
            user="webadmin",
            password="ytAyO0u043"
        )
        cur = conn.cursor()
        
        # Search for ALL sequences in the database that might belong to this tenant
        print(f"📊 Global search for sequences containing '{SCHEMA}':")
        cur.execute(f"""
            SELECT n.nspname as schema_name, c.relname as sequence_name
            FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind = 'S'
            AND (n.nspname = '{SCHEMA}' OR c.relname LIKE '{SCHEMA}%')
        """)
        sequences = cur.fetchall()
        for s in sequences:
            print(f"  - {s[0]}.{s[1]}")

        # Check column defaults again with a different query for all tables in brasil_wl
        print(f"\n🔍 Checking defaults for tables in '{SCHEMA}':")
        cur.execute(f"""
            SELECT table_name, column_name, column_default 
            FROM information_schema.columns 
            WHERE table_schema = '{SCHEMA}' 
            AND column_default IS NOT NULL
        """)
        defaults = cur.fetchall()
        for d in defaults:
            print(f"  - Table: {d[0]} | Col: {d[1]} | Default: {d[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
