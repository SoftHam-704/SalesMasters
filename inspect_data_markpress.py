import pandas as pd
import os

folder = 'data'
files = ['vendedores.xlsx', 'fornecedores.xlsx', 'grupos.xlsx', 'produtos.xlsx', 'clientes.xlsx']

print("--- INSPECIONANDO COLUNAS ---")

for f in files:
    path = os.path.join(folder, f)
    if os.path.exists(path):
        try:
            df = pd.read_excel(path, nrows=0) # Ler só cabeçalho
            print(f"\n📁 ARQUIVO: {f}")
            print(f"   Colunas: {list(df.columns)}")
        except Exception as e:
            print(f"   ❌ Erro ao ler {f}: {e}")
    else:
        print(f"\n⚠️ Arquivo não encontrado: {path}")
