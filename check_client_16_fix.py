
import psycopg2
from psycopg2.extras import RealDictCursor

def check_discounts():
    try:
        conn = psycopg2.connect(
            host="localhost",
            port=5432,
            dbname="basesales",
            user="postgres",
            password="postgres",
            client_encoding='UTF8'
        )
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        print("Checking for client 16...")
        cur.execute("SELECT * FROM ro_consult.cli_descpro WHERE cli_codigo = 16")
        rows = cur.fetchall()
        
        if rows:
            print(f"Found {len(rows)} records for client 16:")
            for row in rows:
                print(row)
        else:
            print("No records found for client 16.")
            # Let's see some sample data
            cur.execute("SELECT cli_codigo FROM ro_consult.cli_descpro LIMIT 5")
            samples = cur.fetchall()
            print("Sample codes in table:", [s['cli_codigo'] for s in samples])

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_discounts()
