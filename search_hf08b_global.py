
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
        
        # Search across ALL schemas for HF08B
        print("🔍 Searching for 'HF08B' in ALL schemas...")
        cur.execute("""
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog')
        """)
        schemas = [r[0] for r in cur.fetchall()]
        
        found = False
        for schema in schemas:
            try:
                # Search in cad_prod and also check if there's any mention in price tables
                query = f"""
                    SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria, '{schema}' as schema
                    FROM {schema}.cad_prod 
                    WHERE pro_codprod ILIKE '%HF08B%' 
                       OR pro_conversao ILIKE '%HF08B%' 
                       OR pro_codigooriginal ILIKE '%HF08B%'
                       OR pro_nome ILIKE '%HF08B%'
                """
                cur.execute(query)
                rows = cur.fetchall()
                for r in rows:
                    print(f"  ✅ FOUND in Schema: {r[5]} | Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]} | Industry: {r[4]}")
                    found = True
            except:
                continue

        if not found:
            print("❌ 'HF08B' not found in any product table in any schema.")
            
            # Look for ANY code starting with HF0 in any schema
            print("\n🔍 Checking for ANY codes starting with 'HF0'...")
            for schema in schemas:
                try:
                    cur.execute(f"SELECT pro_codprod, '{schema}' FROM {schema}.cad_prod WHERE pro_codprod ILIKE 'HF0%' LIMIT 3")
                    for r in cur.fetchall():
                        print(f"  - Possible match: {r[0]} (Schema: {r[1]})")
                except:
                    continue

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
