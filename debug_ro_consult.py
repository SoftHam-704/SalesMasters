import psycopg2
from psycopg2.extras import RealDictCursor

DB_CONFIG = {
    'host': 'node254557-salesmaster.sp1.br.saveincloud.net.br',
    'port': 13062,
    'database': 'basesales',
    'user': 'webadmin',
    'password': 'ytAyO0u043'
}

def inspect():
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor(cursor_factory=RealDictCursor)


        # 1. List tables in ro_consult (full list)
        print("--- Tables in ro_consult ---")
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'ro_consult'")
        ro_tables = [row['table_name'] for row in cur.fetchall()]
        print(ro_tables)

        # 2. Inspect pedidos
        print("\n--- Sample ro_consult.pedidos ---")
        cur.execute("SELECT ped_data, ped_industria, ped_situacao, ped_totliq FROM ro_consult.pedidos LIMIT 5")
        for row in cur.fetchall():
            print(row)


        # 3. Check for fornecedores table
        print("\n--- Checking for Fornecedores table ---")
        cur.execute("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name LIKE '%fornecedores%'")
        for row in cur.fetchall():
            print(f"{row['table_schema']}.{row['table_name']}")
        
        # 4. Check contents of likely match
        print("\n--- Checking public.fornecedores columns ---")
        try:
             cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'fornecedores'")
             print([row['column_name'] for row in cur.fetchall()])
        except: pass

        print("\n--- Checking ro_consult.fin_fornecedores columns ---")
        try:
             cur.execute("SELECT column_name FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'fin_fornecedores'")
             print([row['column_name'] for row in cur.fetchall()])
        except: pass

    except Exception as e:
        print(f"Error: {e}")
    finally:
        if 'conn' in locals(): conn.close()

if __name__ == '__main__':
    inspect()
