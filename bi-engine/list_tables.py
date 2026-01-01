from services.database import execute_query
import pandas as pd

def list_tables():
    q = "SELECT column_name FROM information_schema.columns WHERE table_name='clientes'"
    try:
        df = execute_query(q)
        print(df)
    except Exception as e:
        print(e)

if __name__ == "__main__":
    list_tables()
