
import os
import sqlalchemy
from sqlalchemy import create_engine, text
import urllib.parse
from dotenv import load_dotenv

# Load backend .env for remote DB connection
load_dotenv(dotenv_path='e:/Sistemas_ia/SalesMasters/backend/.env')

db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def run_create_views():
    engine = create_engine(DB_URL)
    
    # We'll execute the SQL directly instead of importing the view file 
    # to avoid path issues and because we want to be 100% sure it runs against the remote DB.
    
    statements = [
        "DROP VIEW IF EXISTS vw_analise_portfolio CASCADE;",
        "DROP VIEW IF EXISTS vw_metricas_cliente CASCADE;",
        "DROP VIEW IF EXISTS vw_performance_mensal CASCADE;",
        "DROP VIEW IF EXISTS vw_itens_ped_fixed CASCADE;",
        
        """
        CREATE OR REPLACE VIEW vw_itens_ped_fixed AS
        SELECT *, 
               CASE 
                   WHEN ite_pedido ~ '^[Ff]?[0-9]+$' THEN CAST(REGEXP_REPLACE(ite_pedido, '[^0-9]', '', 'g') AS INTEGER)
                   ELSE NULL 
               END as ite_pedido_int
        FROM itens_ped
        WHERE ite_pedido ~ '^[Ff]?[0-9]+$';
        """,
        
        """
        CREATE OR REPLACE VIEW vw_metricas_cliente AS
        SELECT 
            p.ped_cliente as cliente_id,
            c.cli_nomred as cliente_nome,
            p.ped_industria as industry_id,
            (CURRENT_DATE - MAX(p.ped_data)::date) as dias_sem_compra,
            SUM(p.ped_totliq) as valor_total,
            COUNT(p.ped_pedido) as total_pedidos,
            AVG(p.ped_totliq) as ticket_medio
        FROM pedidos p
        JOIN clientes c ON p.ped_cliente = c.cli_codigo
        WHERE p.ped_situacao IN ('P', 'F')
        GROUP BY p.ped_cliente, c.cli_nomred, p.ped_industria;
        """,
        
        """
        CREATE OR REPLACE VIEW vw_performance_mensal AS
        SELECT 
            EXTRACT(YEAR FROM ped_data) as ano,
            EXTRACT(MONTH FROM ped_data) as mes,
            ped_industria as industry_id,
            SUM(ped_totliq) as valor_total,
            COUNT(DISTINCT ped_pedido) as qtd_pedidos,
            COUNT(DISTINCT ped_cliente) as clientes_ativos,
            AVG(ped_totliq) as ticket_medio
        FROM pedidos
        WHERE ped_situacao IN ('P', 'F')
        GROUP BY 1, 2, 3;
        """
    ]
    
    with engine.connect() as conn:
        print("Applying BI Views to remote database...")
        for sql in statements:
            try:
                conn.execute(text(sql))
                conn.commit()
                print("Statement executed successfully.")
            except Exception as e:
                print(f"Error executing statement: {e}")
                conn.rollback()

if __name__ == "__main__":
    run_create_views()
