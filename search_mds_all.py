
import psycopg2
import sys

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def run():
    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        
        # Search across all schemas for MDS
        print("🔍 Searching for 'MDS' in all schemas...")
        cur.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
        """)
        schemas = [r[0] for r in cur.fetchall()]
        
        for schema in schemas:
            try:
                cur.execute(f"SELECT for_codigo, for_nomered FROM {schema}.fornecedores WHERE for_nomered ILIKE '%MDS%'")
                rows = cur.fetchall()
                for r in rows:
                    print(f"  - Schema: {schema} | ID: {r[0]} | NomRed: {r[1]}")
            except:
                pass

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
