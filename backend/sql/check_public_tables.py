
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def check_public_tables():
    engine = create_engine(DB_URL)
    
    tables = ['cad_prod', 'cad_tabelaspre', 'cad_pro']
    
    with engine.connect() as conn:
        for table in tables:
            query = text(f"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '{table}')")
            result = conn.execute(query).scalar()
            print(f"Table public.{table} exists: {result}")
            
            if result:
                count_query = text(f"SELECT count(*) FROM public.{table}")
                count = conn.execute(count_query).scalar()
                print(f"Table public.{table} row count: {count}")

if __name__ == "__main__":
    check_public_tables()
