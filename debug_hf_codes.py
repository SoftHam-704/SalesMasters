
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
        
        # Search for conversion codes starting with HF
        cur.execute("""
            SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria
            FROM cad_prod 
            WHERE pro_conversao ILIKE 'HF%' 
               OR pro_codigooriginal ILIKE 'HF%'
            LIMIT 10
        """)
        rows = cur.fetchall()
        print(f"🔍 Found {len(rows)} products with HF codes:")
        for r in rows:
            print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]} | Ind: {r[4]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
