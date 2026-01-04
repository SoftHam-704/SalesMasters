
import os
from services.database import engine
from sqlalchemy import text

def test_portfolio():
    print("Testing fn_produtos_portfolio_vendas(2025, NULL)...")
    conn = engine.raw_connection()
    try:
        cur = conn.cursor()
        cur.execute("SELECT * FROM fn_produtos_portfolio_vendas(%s, %s)", (2025, None))
        rows = cur.fetchall()
        print(f"Success! Got {len(rows)} rows.")
        for row in rows:
            print(row)
    except Exception as e:
        print(f"CRASH: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    test_portfolio()
