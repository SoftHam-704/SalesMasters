
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def list_tables_across_schemas():
    engine = create_engine(DB_URL)
    
    query = text("""
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name IN ('cad_prod', 'cad_pro', 'tabelas_precos')
        AND table_schema NOT IN ('information_schema', 'pg_catalog')
        ORDER BY table_schema, table_name;
    """)
    
    with engine.connect() as conn:
        result = conn.execute(query)
        rows = result.fetchall()
        if not rows:
            print("No matching tables found in any schema.")
        else:
            for row in rows:
                print(f"Schema: {row[0]}, Table: {row[1]}")

if __name__ == "__main__":
    list_tables_across_schemas()
