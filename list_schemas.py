
from sqlalchemy import create_engine, text

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"

def list_schemas():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    query = "SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema'"
    
    with engine.connect() as conn:
        result = conn.execute(text(query))
        print('Schemas encontrados:')
        for row in result.fetchall():
            print(f"- {row[0]}")

if __name__ == "__main__":
    list_schemas()
