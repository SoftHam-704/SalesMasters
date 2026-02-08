
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import sys
import numpy as np

# Force output to utf-8
sys.stdout.reconfigure(encoding='utf-8')

def import_data():
    excel_path = r'E:\Sistemas_ia\SalesMasters\data\cli_descpro.xlsx'
    print(f"Reading Excel file: {excel_path}")
    df = pd.read_excel(excel_path)
    
    # Rename columns to lowercase to match database
    df.columns = [c.lower() for c in df.columns]
    
    # Fill NaN with 0 for numeric columns
    numeric_cols = ['cli_codigo', 'cli_forcodigo', 'cli_grupo', 
                    'cli_desc1', 'cli_desc2', 'cli_desc3', 'cli_desc4', 'cli_desc5', 
                    'cli_desc6', 'cli_desc7', 'cli_desc8', 'cli_desc9']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = df[col].fillna(0)

    try:
        conn = psycopg2.connect(
            host='node254557-salesmaster.sp1.br.saveincloud.net.br',
            port=13062,
            database='basesales',
            user='webadmin',
            password='ytAyO0u043'
        )
        cur = conn.cursor()
        schema = 'ro_consult'
        table = 'cli_descpro'
        
        print(f"Importing {len(df)} rows into {schema}.{table}...")
        
        # Prepare the query with ON CONFLICT DO UPDATE
        cols = [c for c in df.columns if c != 'gid']
        
        # Ensure all required cols are present
        required = ['cli_codigo', 'cli_forcodigo', 'cli_grupo']
        for r in required:
            if r not in cols:
                print(f"Error: Required column {r} missing in Excel.")
                return

        query = f"""
            INSERT INTO {schema}.{table} ({', '.join(cols)})
            VALUES %s
            ON CONFLICT (cli_codigo, cli_forcodigo, cli_grupo) 
            DO UPDATE SET
                {', '.join([f"{c} = EXCLUDED.{c}" for c in cols if c not in required])}
        """
        
        data = []
        for _, row in df.iterrows():
            row_tuple = []
            for c in cols:
                val = row[c]
                if isinstance(val, (np.integer, np.int64)):
                    val = int(val)
                elif isinstance(val, (np.floating, np.float64)):
                    val = float(val)
                elif pd.isna(val):
                    val = None
                row_tuple.append(val)
            data.append(tuple(row_tuple))
        
        execute_values(cur, query, data)
        conn.commit()
        print(f"✅ Successfully imported/updated {len(df)} rows.")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    import_data()
