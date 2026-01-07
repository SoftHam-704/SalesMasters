import json
import urllib.parse
from sqlalchemy import create_engine
from fastapi import Request
from contextvars import ContextVar
from typing import Optional

# Variável de contexto para armazenar o engine do tenant atual na requisição
tenant_engine_var: ContextVar[Optional[any]] = ContextVar("tenant_engine", default=None)

def get_tenant_engine():
    """Retorna o engine do tenant atual para a requisição"""
    return tenant_engine_var.get()

async def db_context_middleware(request: Request, call_next):
    """
    Middleware que identifica o tenant pelos headers e configura o banco
    """
    cnpj = request.headers.get("x-tenant-cnpj")
    db_config_raw = request.headers.get("x-tenant-db-config")
    
    engine = None
    
    if db_config_raw:
        try:
            db_config = json.loads(db_config_raw)
            
            # Monta a URL de conexão do SQLAlchemy
            user = db_config.get("user")
            password = urllib.parse.quote_plus(db_config.get("password", ""))
            host = db_config.get("host")
            port = db_config.get("port")
            dbname = db_config.get("database")
            
            db_url = f"postgresql://{user}:{password}@{host}:{port}/{dbname}"
            
            # Cria o engine (em produção idealmente usaríamos um pool cacheado)
            engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)
            
            print(f"📡 [BI-ENGINE] Conectado ao tenant: {cnpj} em {host}")
            
        except Exception as e:
            print(f"⚠️ [BI-ENGINE] Erro ao configurar banco do tenant: {str(e)}")
    
    # Se não houver config de tenant, pode usar o padrão do .env se necessário
    # Mas para o seu caso 100% nuvem, o ideal é vir sempre do header
    
    token = tenant_engine_var.set(engine)
    try:
        response = await call_next(request)
        return response
    finally:
        tenant_engine_var.reset(token)
        if engine:
            engine.dispose() # Limpa a conexão após a requisição
