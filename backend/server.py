"""
Jambh Electricals mobile app is a pure WebView wrapper for the PWA at
https://jambh-ell.vercel.app. It does NOT use this backend.

This file exists only to keep the platform's supervisor process healthy.
It exposes a single /api/health endpoint and nothing else.

Safe to delete this entire `backend/` directory when running locally.
"""
from fastapi import FastAPI, APIRouter
from starlette.middleware.cors import CORSMiddleware

app = FastAPI(title="Jambh Electricals - Unused Backend")
api_router = APIRouter(prefix="/api")


@api_router.get("/health")
async def health():
    return {"status": "ok", "note": "Backend not used by the mobile app."}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
