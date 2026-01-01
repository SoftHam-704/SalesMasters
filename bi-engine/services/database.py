from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
from config import DATABASE_URL

# SQLAlchemy Engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency para obter sessão do banco"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def execute_query(query: str, params: dict = None):
    """
    Executa query SQL e retorna DataFrame pandas.
    
    Args:
        query: SQL query string
        params: Dictionary com parâmetros nomeados
    
    Returns:
        pandas DataFrame com os resultados
    """
    with engine.connect() as conn:
        if params:
            result = conn.execute(text(query), params)
        else:
            result = conn.execute(text(query))
        
        df = pd.DataFrame(result.fetchall(), columns=result.keys())
        return df
