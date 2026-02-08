
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
        
        # Set search path to markpress
        cur.execute("SET search_path TO markpress")
        
        # 1. Total products in industry 6
        cur.execute("SELECT COUNT(*) FROM cad_prod WHERE pro_industria = 6")
        total = cur.fetchone()[0]
        print(f"📊 Total products in Industry 6 (markpress): {total}")

        # 2. Sample products from industry 6
        print("\n📋 Sample products from industry 6:")
        cur.execute("""
            SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal 
            FROM cad_prod 
            WHERE pro_industria = 6 
            LIMIT 10
        """)
        for r in cur.fetchall():
            print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]}")

        # 3. Check if HF01 exists ANYWHERE in markpress
        print("\n🔍 Searching for 'HF01' ANYWHERE in markpress schema...")
        cur.execute("""
            SELECT pro_codprod, pro_industria 
            FROM cad_prod 
            WHERE pro_codprod ILIKE '%HF01%' 
               OR pro_conversao ILIKE '%HF01%' 
               OR pro_codigooriginal ILIKE '%HF01%'
        """)
        for r in cur.fetchall():
            print(f"  - Found: Cod={r[0]} | Industry={r[1]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
