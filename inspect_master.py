
import psycopg2
import sys

# Force output to utf-8 just in case
sys.stdout.reconfigure(encoding='utf-8')

def check_table(cur, table_name):
    print(f"\nChecking table '{table_name}'...")
    try:
        cur.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table_name}'")
        cols = cur.fetchall()
        if not cols:
            print("  (Table not found or no columns)")
            return
        for c in cols:
            print(f"  - {c[0]} ({c[1]})")
            
        # Try to sample data
        cur.execute(f"SELECT * FROM public.{table_name} LIMIT 1")
        rows = cur.fetchall()
        print(f"  Sample row: {rows}")
    except Exception as e:
        print(f"  Error checking {table_name}: {e}")

def run():
    try:
        # Try UTF8 first
        conn = psycopg2.connect(
            user="postgres",
            password="postgres",
            host="localhost",
            port=5432,
            database="basesales",
            client_encoding="UTF8" 
        )
        cur = conn.cursor()
        
        print("Connected. Listing ALL tables in public:")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
        """)
        tables = [t[0] for t in cur.fetchall()]
        print(f"Tables: {tables}")
        
        # Check specific tables
        check_table(cur, 'user_nomes')
        check_table(cur, 'clientes')
        check_table(cur, 'empresas')
        check_table(cur, 'config_clientes')
        
        conn.close()
    except Exception as e:
        print(f"Main Error: {e}")

if __name__ == "__main__":
    run()
