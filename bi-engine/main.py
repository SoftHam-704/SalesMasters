from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import CORS_ORIGINS
from routers import dashboard, narratives, portfolio, abc_intelligence, metas, equipe, produtos

# ... app setup ...

# Include routers
app = FastAPI(
    title="SalesMasters BI Engine",
    description="Microserviço Python para análises de BI e processamento de dados",
    version="1.0.0"
)

# CORS Middleware
origins = CORS_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173"]
print(f"DEBUG: CORS Origins Enabled: {origins}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(dashboard.router)
app.include_router(narratives.router)
app.include_router(portfolio.router)
app.include_router(abc_intelligence.router)
app.include_router(metas.router)
app.include_router(equipe.router)
app.include_router(produtos.router)

@app.get("/")
async def root():
    return {
        "success": True,
        "message": "SalesMasters BI Engine is running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "bi-engine"}

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=True)
