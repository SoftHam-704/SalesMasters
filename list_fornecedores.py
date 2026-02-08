
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
        schema = 'ro_consult' 
        
        print(f"Listing all fornecedores in {schema}...")
        cur.execute(f"SELECT for_codigo, for_nome FROM {schema}.fornecedores LIMIT 50")
        fornecedores = cur.fetchall()
        for f in fornecedores:
            print(f"ID={f[0]}, Name={f[1]}")
            
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
