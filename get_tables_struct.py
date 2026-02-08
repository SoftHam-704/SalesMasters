
from sqlalchemy import create_engine, text

# Configuração do banco
DB_HOST = "node254557-salesmaster.sp1.br.saveincloud.net.br"
DB_PORT = "13062"
DB_NAME = "basesales"
DB_USER = "webadmin"
DB_PASSWORD = "ytAyO0u043"
SCHEMA = "ndsrep"

def get_all_columns(table):
    connection_string = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    engine = create_engine(connection_string)
    
    query = f"""
        SELECT column_name
        FROM information_schema.columns 
        WHERE table_schema = '{SCHEMA}' AND table_name = '{table}'
    """
    
    with engine.connect() as conn:
        result = conn.execute(text(query))
        return [row[0] for row in result.fetchall()]

if __name__ == "__main__":
    tables = ['clientes', 'pedidos', 'itens_ped', 'vendedores', 'fornecedores', 'transportadora', 'cidades', 'regioes']
    for t in tables:
        cols = get_all_columns(t)
        print(f"TABLE {t}: {cols}")
