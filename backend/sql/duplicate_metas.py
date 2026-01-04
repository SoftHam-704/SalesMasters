
import sqlalchemy
from sqlalchemy import create_engine, text

import urllib.parse

# Connection string
# Using user provided credentials
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"

def duplicate_data():
    engine = create_engine(DB_URL)
    
    # SQL to check if 2025 data already exists to avoid duplication
    check_sql = text("SELECT COUNT(*) FROM vend_metas WHERE met_ano = 2025")
    
    # SQL to Insert
    insert_sql = text("""
    INSERT INTO vend_metas (met_ano, met_industria, met_vendedor, met_jan, met_fev, met_mar, met_abr, met_mai, met_jun, met_jul, met_ago, met_set, met_out, met_nov, met_dez)
    SELECT 
        2025, 
        met_industria, 
        met_vendedor, 
        met_jan * 0.8, 
        met_fev * 0.8, 
        met_mar * 0.8, 
        met_abr * 0.8, 
        met_mai * 0.8, 
        met_jun * 0.8, 
        met_jul * 0.8, 
        met_ago * 0.8, 
        met_set * 0.8, 
        met_out * 0.8, 
        met_nov * 0.8, 
        met_dez * 0.8
    FROM vend_metas
    WHERE met_ano = 2026;
    """)

    try:
        with engine.connect() as conn:
            # Check existing
            result = conn.execute(check_sql).scalar()
            if result > 0:
                print(f"Aborting: Found {result} records for 2025.")
                # Optional: Delete them?
                # conn.execute(text("DELETE FROM vend_metas WHERE met_ano = 2025"))
                # conn.commit()
                # print("Deleted existing 2025 records.")
                return

            # Insert
            result = conn.execute(insert_sql)
            conn.commit()
            print(f"Successfully duplicated {result.rowcount} records from 2026 to 2025.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    duplicate_data()
