
import pandas as pd
from sqlalchemy import create_engine, text
import urllib.parse
import os

# Connection string
password = urllib.parse.quote_plus("@12Pilabo")
DB_URL = f"postgresql://postgres:{password}@localhost:5432/basesales"
EXCEL_FILE = r"e:\Sistemas_ia\SalesMasters\data\cidades_regioes.xlsx"

def import_data():
    try:
        print("Connecting to database...")
        engine = create_engine(DB_URL)
        
        print(f"Reading Excel file: {EXCEL_FILE}")
        # Read Excel file
        df = pd.read_excel(EXCEL_FILE)
        
        print("Columns found in Excel:", df.columns.tolist())
        
        print("Inserting data into 'cidades_regioes' table...")
        # Insert data into the table
        # if_exists='append' adds to existing data
        # index=False avoids inserting the dataframe index as a column
        df.to_sql('cidades_regioes', engine, if_exists='append', index=False)
        
        print("Import completed successfully!")
        print(f"Inserted {len(df)} rows.")
        
    except Exception as e:
        print(f"Error during import: {e}")

if __name__ == "__main__":
    import_data()
