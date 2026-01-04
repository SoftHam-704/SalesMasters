
import os
from services.database import engine

def check_status():
    conn = engine.raw_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT DISTINCT pro_status FROM cad_prod")
        rows = cur.fetchall()
        print("Values in pro_status:")
        for row in rows:
            print(row[0])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_status()
