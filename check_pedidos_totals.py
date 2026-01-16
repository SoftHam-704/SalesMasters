import pandas as pd
from sqlalchemy import create_engine, text
import os

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "rimef"

def main():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    try:
        engine = create_engine(connection_string)
        with engine.connect() as conn:
            # Check for non-zero totals
            query = f"""
                SELECT 
                    COUNT(*) as total_rows,
                    COUNT(CASE WHEN ped_totliq > 0 THEN 1 END) as rows_with_liq,
                    COUNT(CASE WHEN ped_totbruto > 0 THEN 1 END) as rows_with_bruto,
                    SUM(ped_totliq) as sum_liq
                FROM {SCHEMA}.pedidos
            """
            result = conn.execute(text(query)).fetchone()
            print(f"Total Pedidos: {result[0]}")
            print(f"Pedidos com Total Liquido > 0: {result[1]}")
            print(f"Pedidos com Total Bruto > 0: {result[2]}")
            print(f"Soma Total Liquido: {result[3]}")

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    main()
