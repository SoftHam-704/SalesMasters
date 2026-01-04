
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
import os

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def reset_sequences():
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            # Sequences to reset
            sequences = ['regioes_reg_codigo_seq', 'gen_regioes_id']
            
            for seq in sequences:
                try:
                    # Reset sequence to 13 (so nextval is 13)
                    conn.execute(text(f"SELECT setval('{seq}', 12, true)"))
                    conn.commit()
                    print(f"Successfully reset {seq} to 12 (next value will be 13).")
                    
                    # Verify
                    result = conn.execute(text(f"SELECT last_value FROM {seq}"))
                    print(f"Current value of {seq}: {result.scalar()}")
                    
                except Exception as seq_err:
                    print(f"Could not reset {seq} (might not exist): {seq_err}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    reset_sequences()
