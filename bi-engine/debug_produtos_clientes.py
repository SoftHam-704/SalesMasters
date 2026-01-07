import sys
sys.path.insert(0, '.')
from config import DATABASE_URL
from sqlalchemy import create_engine, text
import traceback

print("Connecting to database...")
engine = create_engine(DATABASE_URL)

def test_fn_produtos_clientes(produto_id, compraram, ano, mes_inicio, mes_fim):
    print(f"\n--- Testing fn_produtos_clientes(id={produto_id}, comp={compraram}, ano={ano}, start={mes_inicio}, end={mes_fim}) ---")
    try:
        with engine.connect() as conn:
            query = text("SELECT * FROM fn_produtos_clientes(:prod, :comp, :ano, :start, :end)")
            result = conn.execute(query, {
                "prod": produto_id,
                "comp": compraram,
                "ano": ano,
                "start": mes_inicio,
                "end": mes_fim
            })
            rows = result.fetchall()
            print(f"✅ Success! Found {len(rows)} rows.")
            for row in rows[:3]:
                print(f"  Row: {row}")
    except Exception as e:
        print("❌ Error:")
        traceback.print_exc()

# Test with parameters from the frontend (Ano 2025, Mes 1-12)
# We need a valid product ID. Let's find one first.
def get_rank_1_product():
    try:
        with engine.connect() as conn:
            res = conn.execute(text("SELECT produto_id FROM fn_produtos_ranking(2025, 1, 12, NULL, NULL) LIMIT 1"))
            row = res.fetchone()
            return row[0] if row else None
    except:
        return None

prod_id = get_rank_1_product()
if prod_id:
    test_fn_produtos_clientes(prod_id, True, 2025, 1, 12)
    test_fn_produtos_clientes(prod_id, False, 2025, 1, 12)
else:
    print("Could not find a valid product ID to test.")
