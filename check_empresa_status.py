
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
        
        print(f"Checking column type for {schema}.empresa_status.emp_logotipo...")
        cur.execute(f"""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = '{schema}' 
            AND table_name = 'empresa_status'
            AND column_name = 'emp_logotipo'
        """)
        
        row = cur.fetchone()
        if row:
            print(f"Column: {row[0]}, Type: {row[1]}, Max Length: {row[2]}")
        else:
            print("Column not found!")

        # Also check public schema just in case
        print(f"Checking column type for public.empresa_status.emp_logotipo...")
        cur.execute(f"""
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'empresa_status'
            AND column_name = 'emp_logotipo'
        """)
        row = cur.fetchone()
        if row:
            print(f"Column: {row[0]}, Type: {row[1]}, Max Length: {row[2]}")
        else:
            print("Column not found in public!")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
