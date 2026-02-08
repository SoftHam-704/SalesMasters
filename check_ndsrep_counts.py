
from sqlalchemy import create_engine, text

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "ndsrep"

def check_counts():
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    tables = ['clientes', 'pedidos', 'itens_ped', 'vendedores', 'fornecedores', 'transportadora']
    
    with engine.connect() as conn:
        print(f"Contagem de registros no schema {SCHEMA}:")
        for table in tables:
            try:
                res = conn.execute(text(f"SELECT COUNT(*) FROM {SCHEMA}.{table}"))
                count = res.fetchone()[0]
                print(f"- {table}: {count}")
            except Exception as e:
                print(f"- {table}: ERRO ({e})")

if __name__ == "__main__":
    check_counts()
