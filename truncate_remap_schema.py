import psycopg2

# Database connection parameters
DB_HOST = 'node254557-salesmaster.sp1.br.saveincloud.net.br'
DB_PORT = 13062
DB_NAME = 'basesales'
DB_USER = 'webadmin'
DB_PASS = 'ytAyO0u043'

def truncate_remap_schema():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Get list of tables in 'remap' schema
        print("Fetching tables in 'remap' schema...")
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'remap' 
              AND table_type = 'BASE TABLE'
        """)
        tables = [f"remap.{row[0]}" for row in cur.fetchall()]

        if not tables:
            print("No tables found in schema 'remap'.")
            return

        print(f"Found {len(tables)} tables. Truncating all of them...")

        # Construct the TRUNCATE command
        # TRUNCATE table1, table2, ... CASCADE;
        # This is efficient and handles foreign keys if they exist between tables in the list
        truncate_query = f"TRUNCATE TABLE {', '.join(tables)} CASCADE;"
        
        print("Executing TRUNCATE command...")
        cur.execute(truncate_query)
        
        print("SUCCESS: All tables in schema 'remap' have been truncated.")

        cur.close()
        conn.close()

    except Exception as e:
        print(f"Error executing truncate: {e}")

if __name__ == "__main__":
    truncate_remap_schema()
