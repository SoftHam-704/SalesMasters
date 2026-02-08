
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
        table = 'cli_descpro'
        
        print(f"Checking table structure for {schema}.{table}...")
        
        cur.execute(f"""
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' AND table_name = '{table}';
        """)
        
        columns = cur.fetchall()
        if not columns:
            print(f"Table {schema}.{table} not found.")
        else:
            for col in columns:
                print(col)

        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    run()
