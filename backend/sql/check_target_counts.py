
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def check_target_counts():
    engine = create_engine(DB_URL)
    
    tables = ['cad_prod', 'cad_tabelaspre']
    
    with engine.connect() as conn:
        for table in tables:
            count_query = text(f"SELECT count(*) FROM target.{table}")
            count = conn.execute(count_query).scalar()
            print(f"Table target.{table} row count: {count}")

if __name__ == "__main__":
    check_target_counts()
