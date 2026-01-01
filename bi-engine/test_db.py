import sys
import os
sys.path.append(os.getcwd())

from services.data_fetcher import fetch_faturamento_anual
import pandas as pd

print("Testing fetch_faturamento_anual(2025)...")
try:
    df = fetch_faturamento_anual(2025)
    print(f"Shape: {df.shape}")
    print(df)
except Exception as e:
    print(f"Error: {e}")
