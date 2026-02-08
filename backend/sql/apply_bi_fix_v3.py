
import os
import sqlalchemy
from sqlalchemy import create_engine
import urllib.parse
from dotenv import load_dotenv

load_dotenv()

db_host = os.getenv('DB_HOST')
db_port = os.getenv('DB_PORT')
db_name = os.getenv('DB_NAME')
db_user = os.getenv('DB_USER')
db_pass = os.getenv('DB_PASSWORD')

password = urllib.parse.quote_plus(db_pass)
DB_URL = f"postgresql://{db_user}:{password}@{db_host}:{db_port}/{db_name}"

def apply_fix():
    engine = create_engine(DB_URL)
    sql_file = 'e:/Sistemas_ia/SalesMasters/backend/sql/fix_dashboard_metrics_v3.sql'
    
    with open(sql_file, 'r', encoding='utf-8') as f:
        sql_content = f.read()
    
    # Use raw connection to bypass SQLAlchemy's parameter parsing
    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cursor:
            print("Applying SQL fix for get_dashboard_metrics via raw connection...")
            cursor.execute(sql_content)
        raw_conn.commit()
        print("Fix applied successfully.")
    except Exception as e:
        print(f"Error applying fix: {e}")
        raw_conn.rollback()
        raise e
    finally:
        raw_conn.close()

def verify_fix():
    engine = create_engine(DB_URL)
    try:
        with engine.connect() as conn:
            print("\nVerifying call with 3 args (Industry 36)...")
            # Wrap in text() for SQLAlchemy
            from sqlalchemy import text
            query = text("SELECT * FROM target.get_dashboard_metrics(2025, NULL, 36)")
            result = conn.execute(query).fetchone()
            if result:
                print(f"Success! Total Sold: {result[0]}")
                print(f"Full Row: {result}")
            else:
                print("No data returned.")
    except Exception as e:
        print(f"Verification failed: {e}")

if __name__ == "__main__":
    apply_fix()
    verify_fix()
