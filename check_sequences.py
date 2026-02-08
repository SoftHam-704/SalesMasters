
import psycopg2
import sys

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

def run():
    SCHEMA = 'brasil_wl'
    try:
        conn = psycopg2.connect(
            host="node254557-salesmaster.sp1.br.saveincloud.net.br",
            port=13062,
            database="basesales",
            user="webadmin",
            password="ytAyO0u043"
        )
        cur = conn.cursor()
        
        # 1. List sequence names and current values for the schema
        print(f"📊 Analyzing sequences in schema '{SCHEMA}':")
        cur.execute(f"""
            SELECT sequence_name 
            FROM information_schema.sequences 
            WHERE sequence_schema = '{SCHEMA}'
        """)
        sequences = cur.fetchall()
        
        if not sequences:
            # Maybe it uses generic SERIAL pattern
            print("No explicit sequences found. Checking columns for sequence defaults...")
            cur.execute(f"""
                SELECT table_name, column_name, column_default 
                FROM information_schema.columns 
                WHERE table_schema = '{SCHEMA}' 
                AND column_default LIKE 'nextval%'
            """)
            defaults = cur.fetchall()
            for d in defaults:
                print(f"  - Table: {d[0]} | Col: {d[1]} | Default: {d[2]}")
                # Extract sequence name from nextval('seq_name'::regclass)
                seq_full = d[2].split("'")[1]
                
                # Check current max in table
                try:
                    cur.execute(f"SELECT MAX({d[1]}) FROM {SCHEMA}.{d[0]}")
                    max_val = cur.fetchone()[0] or 0
                    
                    # Check sequence current value
                    cur.execute(f"SELECT last_value FROM {seq_full}")
                    curr_val = cur.fetchone()[0]
                    
                    print(f"    * Max in table: {max_val} | Seq last_value: {curr_val}")
                except Exception as e:
                    print(f"    * Error checking specific values: {e}")

        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    run()
