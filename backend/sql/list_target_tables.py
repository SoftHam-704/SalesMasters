
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def list_all_tables_in_target():
    engine = create_engine(DB_URL)
    
    query = text("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'target'
        ORDER BY table_name;
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query)
        rows = result.fetchall()
        print("Tables in 'target' schema:")
        for row in rows:
            print(row[0])

if __name__ == "__main__":
    list_all_tables_in_target()
