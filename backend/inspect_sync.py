import psycopg2
import sys

def check_db():
    try:
        conn = psycopg2.connect("postgres://postgres:S0fth4m@localhost:5432/basesales")
        cur = conn.cursor()
        
        # 1. Procurar tabelas de integracao/sync (using % as wildcard)
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        all_tables = [t[0] for t in cur.fetchall()]
        
        sync_tables = [t for t in all_tables if 'sync' in t.lower() or 'sinc' in t.lower() or 'integra' in t.lower()]
        print(f"Tables matching sync: {sync_tables}")
        
        if sync_tables:
            for table in sync_tables:
                try:
                    cur.execute(f"SELECT * FROM {table} ORDER BY 1 DESC LIMIT 1")
                    row = cur.fetchone()
                    print(f"Last record in {table}: {row}")
                except:
                    print(f"Could not read {table}")
                    conn.rollback()

        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('parametros', 'config', 'empresa')")
        config_tables = [t[0] for t in cur.fetchall()]
        print(f"Config tables found: {config_tables}")
        
        for table in config_tables:
            cur.execute(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
            cols = [c[0] for c in cur.fetchall()]
            print(f"Columns for {table}: {cols}")
            
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    check_db()
