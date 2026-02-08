
import pandas as pd

def check_excel():
    try:
        df = pd.read_excel(r'E:\Sistemas_ia\SalesMasters\data\cli_descpro.xlsx')
        print("Excel Columns:", df.columns.tolist())
        # Search for client 16 or 00016
        # The column name might be 'cli_codigo' or something else (it was mapped in the script)
        # Let's look for any column that looks like a client ID
        id_col = None
        for col in df.columns:
            if 'cli' in col.lower() and 'cod' in col.lower():
                id_col = col
                break
        
        if id_col:
            print(f"Searching in column: {id_col}")
            # Convert to string and strip to compare
            df[id_col + '_str'] = df[id_col].astype(str).str.strip().str.replace('.0', '', regex=False)
            res = df[df[id_col + '_str'].isin(['16', '016', '0016', '00016'])]
            if not res.empty:
                print(f"Found {len(res)} rows for client 16 in Excel:")
                print(res.to_string())
            else:
                print("Client 16 not found in Excel.")
        else:
            print("Could not find client ID column in Excel.")
            print("First 5 rows:")
            print(df.head())

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_excel()
