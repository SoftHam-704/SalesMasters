import psycopg2
import pandas as pd

# Database connection parameters
DB_HOST = 'node254557-salesmaster.sp1.br.saveincloud.net.br'
DB_PORT = 13062
DB_NAME = 'basesales'
DB_USER = 'webadmin'
DB_PASS = 'ytAyO0u043'

def check_remap_schema():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        cur = conn.cursor()

        # 1. Get list of tables in 'remap' schema
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'remap' 
              AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cur.fetchall()]

        if not tables:
            print("No tables found in schema 'remap'.")
            return

        print(f"Found {len(tables)} tables in schema 'remap'. Checking row counts...\n")
        
        print(f"{'TABLE NAME':<30} | {'ROW COUNT':<10}")
        print("-" * 45)

        non_empty_tables = []

        for table in tables:
            # Count rows for each table
            # distinct count is slow, count(*) is faster but exact enough for "empty" check
            cur.execute(f"SELECT COUNT(*) FROM remap.{table}")
            count = cur.fetchone()[0]
            
            print(f"{table:<30} | {count:<10}")
            
            if count > 0:
                non_empty_tables.append(table)

        print("-" * 45)
        if non_empty_tables:
            print(f"\n WARNING: The following tables are NOT empty: {', '.join(non_empty_tables)}")
        else:
            print("\n SUCCESS: All tables in schema 'remap' are empty.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_remap_schema()
