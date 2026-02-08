from sqlalchemy import create_engine, text, event
from sqlalchemy.orm import sessionmaker
import pandas as pd
from config import DATABASE_URL
from utils.tenant_context import get_tenant_engine

# SQLAlchemy Engine (Fallback para local) - com encoding UTF-8
engine_local = create_engine(
    DATABASE_URL, 
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=5
)

# Garantir encoding UTF-8 em cada nova conexão
@event.listens_for(engine_local, "connect")
def set_client_encoding(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET client_encoding TO 'UTF8'")
    cursor.close()

def get_current_engine():
    return get_tenant_engine() or engine_local

def execute_query(query: str, params: dict = None):
    
    # Limit to 3 attempts
    for attempt in range(1, 4):
        try:
            engine = get_current_engine()
            # Explicitly set client_encoding during connection to avoid UnicodeDecodeErrors
            # with non-UTF8 system error messages from libpq
            with engine.connect().execution_options(
                isolation_level="AUTOCOMMIT"
            ) as conn:
                conn.execute(text("SET client_encoding TO 'UTF8'"))
                result = conn.execute(text(query), params or {})
                if result.returns_rows:
                    rows = result.fetchall()
                    cols = list(result.keys())
                    return pd.DataFrame(rows, columns=cols)
                return pd.DataFrame()
        except Exception as e:
            if attempt == 1:
                try:
                    # Defensive against UnicodeDecodeError in the error message itself
                    err_msg = str(e)
                except UnicodeDecodeError:
                    err_msg = "[Encoding Error in DB Message]"
                print(f"❌ [DB Error] {err_msg}", flush=True)
            
            if attempt < 3:
                import time
                time.sleep(0.5 * attempt)
            else:
                return pd.DataFrame()
    return pd.DataFrame()
