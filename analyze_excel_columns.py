import pandas as pd
import os

files = [
    'cidades.xlsx', 
    'clientes.xlsx', 
    'fornecedores.xlsx', 
    'grupos.xlsx', 
    'transportadora.xlsx', 
    'vendedores.xlsx'
]
path = 'data/'

for f in files:
    try:
        full_path = os.path.join(path, f)
        if not os.path.exists(full_path):
            print(f"Skipping {f}: File not found")
            continue
            
        print(f"\n--- {f} ---")
        df = pd.read_excel(full_path, nrows=1) 
        # nrows=1 is enough to get headers
        print(list(df.columns))
        
    except Exception as e:
        print(f"Error reading {f}: {e}")
