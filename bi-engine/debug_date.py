from sqlalchemy import create_engine, text
from config import DATABASE_URL

engine = create_engine(DATABASE_URL)

sql = """
SELECT ped_data, ped_totliq 
FROM pedidos 
WHERE ped_totliq BETWEEN 10424.40 AND 10424.50 
LIMIT 5;
"""

with engine.connect() as conn:
    print(f"Checking ped_data for value ~10424.44...")
    result = conn.execute(text(sql))
    for row in result:
        print(f"Data: {row.ped_data} | Valor: {row.ped_totliq}")
    print("Done.")
