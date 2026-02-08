
from sqlalchemy import create_engine, text

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "ndsrep"
TABLE = "clientes"

def list_columns():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    query = f"""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' AND table_name = '{TABLE}'
    """
    
    with engine.connect() as conn:
        result = conn.execute(text(query))
        print(f'Colunas em {SCHEMA}.{TABLE}:')
        for row in result.fetchall():
            print(f"- {row[0]} ({row[1]})")

if __name__ == "__main__":
    list_columns()
