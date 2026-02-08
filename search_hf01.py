
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
        
        # Search for HF01 globally in cad_prod
        print("🔍 Searching for 'HF01' globally in cad_prod...")
        cur.execute("""
            SELECT pro_codprod, pro_nome, pro_conversao, pro_codigooriginal, pro_industria, pro_nome
            FROM cad_prod 
            WHERE pro_codprod ILIKE '%HF01%' 
               OR pro_conversao ILIKE '%HF01%'
               OR pro_codigooriginal ILIKE '%HF01%'
               OR pro_nome ILIKE '%HF01%'
        """)
        rows = cur.fetchall()
        for r in rows:
            print(f"  - Cod: {r[0]} | Nome: {r[1]} | Conv: {r[2]} | Orig: {r[3]} | Ind: {r[4]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
