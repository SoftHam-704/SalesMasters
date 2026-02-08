
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
        
        # Search for HF01 specifically in markpress schema, industry 6
        print("🔍 Searching for 'HF01' in schema 'markpress', industry 6...")
        cur.execute("""
            SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria
            FROM cad_prod 
            WHERE pro_industria = 6
              AND (pro_codprod ILIKE '%HF01%' 
                   OR pro_conversao ILIKE '%HF01%'
                   OR pro_codigooriginal ILIKE '%HF01%')
        """)
        rows = cur.fetchall()
        if rows:
            for r in rows:
                print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]} | Ind: {r[4]}")
        else:
            print("❌ No matches for HF01 in markpress/6.")
            
            # List some conversion codes from this industry to see what they look like
            print("\n📋 Sample conversion codes from industry 6 in markpress:")
            cur.execute("""
                SELECT pro_codprod, pro_nome, pro_conversao 
                FROM cad_prod 
                WHERE pro_industria = 6 AND pro_conversao IS NOT NULL AND pro_conversao != ''
                LIMIT 5
            """)
            for r in cur.fetchall():
                print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
