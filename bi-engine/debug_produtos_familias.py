import sys
sys.path.insert(0, '.')
from config import DATABASE_URL
from sqlalchemy import create_engine, text

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

def test_fn_produtos_familias(ano, start, end, industria):
    print(f"\n--- Testing fn_produtos_familias(ano={ano}, start={start}, end={end}, ind={industria}) ---")
    try:
        with engine.connect() as conn:
            query = text("SELECT * FROM fn_produtos_familias(:ano, :start, :end, :ind, NULL)")
            result = conn.execute(query, {
                "ano": ano,
                "start": start,
                "end": end,
                "ind": industria
            })
            rows = result.fetchall()
            print(f"✅ Success! Found {len(rows)} rows.")
            for row in rows[:5]:
                print(f"  Row: {row}")
    except Exception as e:
        print(f"❌ Error: {e}")

test_fn_produtos_familias(2025, 1, 12, None)
