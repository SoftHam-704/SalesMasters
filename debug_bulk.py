
import pandas as pd
import json
from sqlalchemy import create_engine

DB_URL = "postgresql://webadmin:ytAyO0u043@node254557-salesmaster.sp1.br.saveincloud.net.br:13062/basesales"
engine = create_engine(DB_URL)

try:
    with open(r'e:\Sistemas_ia\SalesMasters\data\itens_ped.json', 'r', encoding='latin-1') as f:
        data = json.load(f)
    df = pd.DataFrame(data['RecordSet']).head(50)
    df.columns = [c.lower() for c in df.columns]
    # Converter data
    if 'ite_data' in df.columns:
        df['ite_data'] = pd.to_datetime(df['ite_data'], errors='coerce', dayfirst=True)
    
    df.to_sql('itens_ped', engine, schema='ndsrep', if_exists='append', index=False, method='multi')
    print("Bulk test success!")
except Exception as e:
    print(f"Bulk test failed: {e}")
