from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import pandas as pd
from config import DATABASE_URL

from utils.tenant_context import get_tenant_engine

# SQLAlchemy Engine (Fallback para local)
engine_local = create_engine(DATABASE_URL)
engine = engine_local # Compatibility
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_local)

def get_current_engine():
    """Retorna o engine correto (Tenant ou Local)"""
    from utils.tenant_context import get_tenant_engine
    return get_tenant_engine() or engine_local

def get_db():
    """Dependency para obter sessão do banco (usando tenant engine se disponível)"""
    engine = get_current_engine()
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()
    try:
        yield db
    finally:
        db.close()

def execute_query(query: str, params: dict = None):
    """
    Executa query SQL e retorna DataFrame pandas usando o engine do tenant atual.
    """
    # Prioriza o engine do tenant (Nuvem/Headers) se disponível
    engine = get_current_engine()
    
    with engine.connect() as conn:
        if params:
            result = conn.execute(text(query), params)
        else:
            result = conn.execute(text(query))
        
        # Converte para DataFrame
        rows = result.fetchall()
        df = pd.DataFrame(rows, columns=result.keys())
        return df
