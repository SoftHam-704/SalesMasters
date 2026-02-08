
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
        
        # Search for ANY text in cad_prod that contains 'HF'
        print("🔍 Searching for ANY product related to 'HF' in markpress...")
        cur.execute("SET search_path TO markpress")
        cur.execute("""
            SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria
            FROM cad_prod 
            WHERE pro_codprod ILIKE '%HF%' 
               OR pro_conversao ILIKE '%HF%' 
               OR pro_codigooriginal ILIKE '%HF%'
            LIMIT 50
        """)
        rows = cur.fetchall()
        if rows:
            for r in rows:
                print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]} | Ind: {r[4]}")
        else:
            print("❌ No matches for 'HF' in markpress.")

        # Check industry 6 specifically in other schemas
        print("\n🔍 Checking for ANY products in industry 6 in other schemas...")
        cur.execute("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')")
        schemas = [r[0] for r in cur.fetchall()]
        for schema in schemas:
            try:
                cur.execute(f"SELECT COUNT(*) FROM {schema}.cad_prod WHERE pro_industria = 6")
                count = cur.fetchone()[0]
                if count > 0:
                    print(f"  - Schema: {schema} has {count} products in Industry 6")
                    cur.execute(f"SELECT pro_codprod, pro_conversao FROM {schema}.cad_prod WHERE pro_industria = 6 LIMIT 3")
                    for r in cur.fetchall():
                        print(f"    * {r[0]} | Conv: {r[1]}")
            except:
                continue

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
