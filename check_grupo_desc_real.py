
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
        
        print(f"Checking table structure for ro_consult.grupo_desc...")
        cur.execute(f"""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'ro_consult' AND table_name = 'grupo_desc';
        """)
        for col in cur.fetchall():
            print(col)

        print("\nChecking first 5 rows of ro_consult.grupo_desc...")
        cur.execute("SELECT * FROM ro_consult.grupo_desc LIMIT 5")
        for row in cur.fetchall():
            print(row)

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
