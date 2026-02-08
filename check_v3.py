
import psycopg2

def check():
    try:
        conn = psycopg2.connect("host=localhost dbname=basesales user=postgres password=postgres")
        cur = conn.cursor()
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'ro_consult' AND table_name = 'cli_descpro' AND column_name = 'cli_codigo'")
        col = cur.fetchone()
        print(f"Column cli_codigo details: {col}")
        
        cur.execute("SELECT cli_codigo FROM ro_consult.cli_descpro LIMIT 10")
        rows = cur.fetchall()
        print(f"Sample cli_codigo from table: {rows}")
        
        cur.execute("SELECT COUNT(*) FROM ro_consult.cli_descpro WHERE cli_codigo::text = '16' OR cli_codigo::text = '00016'")
        count = cur.fetchone()
        print(f"Records for 16 or 00016: {count}")
        
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check()
