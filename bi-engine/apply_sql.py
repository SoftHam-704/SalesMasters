
import os
from services.database import engine

def apply_sql():
    sql_path = '../backend/sql/fn_produtos_dashboard_complete.sql'
    print(f"Reading SQL from {sql_path}...")
    
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    print("Connecting to database...")
    conn = engine.raw_connection()
    try:
        cur = conn.cursor()
        print("Executing SQL script...")
        cur.execute(sql_content)
        conn.commit()
        print("SQL applied successfully!")
    except Exception as e:
        conn.rollback()
        print(f"Error applying SQL: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    apply_sql()
