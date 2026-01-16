import pandas as pd
from sqlalchemy import create_engine, text
import os

# Configuração do banco (copied from import_rimef_v2.py)
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
        print(f"Conectando ao banco {DB_NAME} no schema {SCHEMA}...")

        with engine.connect() as conn:
            # List tables
            query_tables = f"""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = '{SCHEMA}' 
                ORDER BY table_name
            """
            result_tables = conn.execute(text(query_tables)).fetchall()
            
            if not result_tables:
                print(f"Nenhuma tabela encontrada no schema {SCHEMA}.")
                return

            print(f"\nTabalas encontradas no schema '{SCHEMA}':")
            print(f"{'TABELA':<30} | {'LINHAS':<10}")
            print("-" * 45)

            for row in result_tables:
                table_name = row[0]
                try:
                    count_query = text(f"SELECT COUNT(*) FROM {SCHEMA}.{table_name}")
                    count_result = conn.execute(count_query).scalar()
                    print(f"{table_name:<30} | {count_result:<10}")
                except Exception as e:
                    print(f"{table_name:<30} | Erro ao contar: {e}")

    except Exception as e:
        print(f"Erro de conexão ou execução: {e}")

if __name__ == "__main__":
    main()
