
import os
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
from dotenv import load_dotenv

# Use the environment variables from the backend .env
load_dotenv(dotenv_path='e:/Sistemas_ia/SalesMasters/backend/.env')

db_host = os.getenv('MASTER_DB_HOST', 'node254557-salesmaster.sp1.br.saveincloud.net.br')
db_port = os.getenv('MASTER_DB_PORT', 13062)
db_name = os.getenv('MASTER_DB_DATABASE', 'basesales')
db_user = os.getenv('MASTER_DB_USER', 'webadmin')
db_pass = os.getenv('MASTER_DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def find_schema():
    engine = create_engine(DB_URL)
    with engine.connect() as conn:
        cnpj = '17504829000124'
        query = text("SELECT db_schema, db_nome FROM empresas WHERE cnpj = :cnpj OR REPLACE(REPLACE(REPLACE(cnpj, '.', ''), '/', ''), '-', '') = :cnpj")
        result = conn.execute(query, {"cnpj": cnpj}).fetchone()
        if result:
            print(f"Schema: {result[0]}, DB: {result[1]}")
        else:
            print("CNPJ not found in empresas.")

if __name__ == "__main__":
    find_schema()
