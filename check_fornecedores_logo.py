
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
        
        print(f"Checking columns in {schema}.fornecedores related to logo/image...")
        cur.execute(f"""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' 
            AND table_name = 'fornecedores'
            AND column_name IN ('for_logotipo', 'for_locimagem')
        """)
        
        rows = cur.fetchall()
        for r in rows:
            print(f"Column: {r[0]}, Type: {r[1]}, Max Length: {r[2]}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
