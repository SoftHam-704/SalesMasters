
import psycopg2
from psycopg2.extras import RealDictCursor

def check_discounts():
    conn = psycopg2.connect("host=localhost port=5432 dbname=basesales user=postgres password=postgres")
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Check for client 16
    print("Checking discounts for client 16...")
    cur.execute("SELECT * FROM ro_consult.cli_descpro WHERE cli_codigo IN (16, 00016) OR cli_codigo::text = '00016'")
    rows = cur.fetchall()
    
    if not rows:
        print("No discounts found for client 16 in ro_consult.cli_descpro.")
        # Check all records to see if there's any data
        cur.execute("SELECT COUNT(*) FROM ro_consult.cli_descpro")
        count = cur.fetchone()['count']
        print(f"Total records in cli_descpro: {count}")
    else:
        for row in rows:
            print(row)
            
    cur.close()
    conn.close()

if __name__ == "__main__":
    check_discounts()
