
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def list_tables():
    try:
        conn = psycopg2.connect(
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432,
            database="basesales",
            client_encoding="LATIN1"
        )
        cur = conn.cursor()
        
        print("Scanning tables in public schema...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = cur.fetchall()
        for t in tables:
            print(f"- {t[0]}")
            
        candidates = ['clientes', 'clients', 'tenants', 'empresas', 'master', 'config', 'fin_clientes']
        
        found_candidate = False
        for table in tables:
            t_name = table[0].lower()
            if any(c in t_name for c in candidates):
                found_candidate = True
                print(f"\nColumns for potentially relevant table '{t_name}':")
                try:
                    cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{t_name}'")
                    cols = cur.fetchall()
                    for c in cols:
                        print(f"  - {c[0]} ({c[1]})")
                except Exception as ex:
                    print(f"  Error reading columns: {ex}")

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_tables()
