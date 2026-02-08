
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
        conn.autocommit = True
        cur = conn.cursor()
        schema = 'ro_consult'
        
        print(f"Fixing column type for {schema}.empresa_status.emp_logotipo...")
        
        # Check if views depend on it? Usually altering type to TEXT is safe but let's just do it.
        # Sometimes you need to drop views. But let's try direct alter first.
        try:
            print("Attempting: ALTER TABLE ro_consult.empresa_status ALTER COLUMN emp_logotipo TYPE TEXT")
            cur.execute(f"ALTER TABLE {schema}.empresa_status ALTER COLUMN emp_logotipo TYPE TEXT")
            print("✅ Success!")
        except Exception as e:
            print(f"❌ Error during ALTER: {e}")
            
        conn.close()
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    run()
