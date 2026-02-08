from sqlalchemy import create_engine
import json
import urllib.parse
from fastapi import Request
from contextvars import ContextVar
from typing import Optional

tenant_engine_var: ContextVar[Optional[any]] = ContextVar("tenant_engine", default=None)
tenant_cnpj_var: ContextVar[Optional[str]] = ContextVar("tenant_cnpj", default=None)

_engines_cache = {}

def get_tenant_engine():
    return tenant_engine_var.get()

def get_tenant_cnpj():
    return tenant_cnpj_var.get()

async def db_context_middleware(request: Request, call_next):
    cnpj = request.headers.get("x-tenant-cnpj")
    db_config_raw = request.headers.get("x-tenant-db-config")
    
    engine = None
    if db_config_raw:
        try:
            db_config = json.loads(db_config_raw)
            cache_key = f"{db_config.get('host')}_{db_config.get('database')}_{db_config.get('schema', 'public')}"
            
            if cache_key in _engines_cache:
                engine = _engines_cache[cache_key]
            else:
                user = db_config.get("user")
                password = urllib.parse.quote_plus(db_config.get("password", ""))
                db_url = f"postgresql://{user}:{password}@{db_config.get('host')}:{db_config.get('port')}/{db_config.get('database')}"
                
                engine = create_engine(
                    db_url, 
                    pool_pre_ping=True, 
                    pool_size=20,
                    max_overflow=10,
                    connect_args={
                        "options": f"-c search_path={db_config.get('schema', 'public')},public",
                        "client_encoding": "utf8"
                    }
                )
                _engines_cache[cache_key] = engine
        except Exception as e:
            print(f"❌ [DB CONTEXT] Error creating engine for {cnpj}: {e}", flush=True)
            pass
            
    token_engine = tenant_engine_var.set(engine)
    token_cnpj = tenant_cnpj_var.set(cnpj)
    try:
        return await call_next(request)
    finally:
        tenant_engine_var.reset(token_engine)
        tenant_cnpj_var.reset(token_cnpj)
