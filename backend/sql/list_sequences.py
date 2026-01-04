
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
import os

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def list_sequences():
    try:
        engine = create_engine(DB_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'"))
            sequences = [row[0] for row in result.fetchall()]
            print("Sequences found:")
            for seq in sequences:
                print(seq)
                
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_sequences()
