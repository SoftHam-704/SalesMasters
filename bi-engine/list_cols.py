
import os
from services.database import engine

def list_columns():
    conn = engine.raw_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'cad_prod'")
        rows = cur.fetchall()
        print("Columns in cad_prod:")
        for row in rows:
            print(row[0])
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    list_columns()
