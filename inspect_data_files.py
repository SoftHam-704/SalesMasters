
import pandas as pd
import os

def inspect_excel():
    folder = "data"
    files = [f for f in os.listdir(folder) if f.endswith('.xlsx')]
    
    print(f"📂 Found {len(files)} Excel files in {folder}/")
    
    for file in files:
        path = os.path.join(folder, file)
        try:
            df = pd.read_excel(path, nrows=3)
            print(f"\n📄 {file} columns:")
            print(list(df.columns))
            print(f"   Rows: {len(df)} (preview)")
        except Exception as e:
            print(f"❌ Error reading {file}: {e}")

if __name__ == "__main__":
    inspect_excel()
