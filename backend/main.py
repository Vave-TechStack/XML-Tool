import sys
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Setup Base Directory for imports
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Database & Auth
from database import engine, Base, SessionLocal
from models import User, UserRole
from auth import require_active_access, hash_password

# Initialize Database Schema
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Enforce Single Super Admin and use Env Vars
    db = SessionLocal()
    admin_email = os.environ.get("SUPERADMIN_EMAIL", "admin@vavetechstack.com")
    admin_password = os.environ.get("SUPERADMIN_PASSWORD", "admin123")
    
    # Check if ANY Super Admin exists
    super_admin_exists = db.query(User).filter(User.role == UserRole.SUPERADMIN).first()
    
    if not super_admin_exists:
        hashed_pwd = hash_password(admin_password)
        db.add(User(
            email=admin_email, 
            hashed_password=hashed_pwd, 
            role=UserRole.SUPERADMIN,
            is_active=True,
            subscription_active=True
        ))
        db.commit()
    db.close()
    yield

# Initialize FastAPI
app = FastAPI(title="Black Vave Multi-Tool API - Authenticated", lifespan=lifespan)

# CORS Middleware (Essential for Frontend communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static File Mounting 
os.makedirs("outputs", exist_ok=True)
os.makedirs("temp_jobs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/temp_jobs", StaticFiles(directory="temp_jobs"), name="temp_jobs")

# Import Routers
from routes import (
    pdf_to_tiff, pdf_to_word_text, pdf_split, ocr_preview, 
    ln_xml_manual, image_crop, pdf_to_xml, auth_routes, admin_routes
)
from routes.ln_xml import router as ln_xml_router
from routes.xml_job import router as xml_job_router
from routes.folder_creator import router as folder_router
from routes.pdf_to_word_ocr import router as ocr_router
from routes.ws_progress import router as ws_router
from routes.bits_pdf_to_xml import router as bits_router
from routes.split_pdf import router as split_pdf_router
from routes.bits_meta import router as bits_meta_router
from routes.xml_ref import xml_ref_router
from routes.case_reference import case_reference_router
from routes.build import router as build_router
from routes.ocr_docbook import router as ocr_docbook_router
from routes.docxmlindex import router as docxmlindex_router

# 1. Include Auth/Admin Routers (Unprotected paths defined inside)
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)

# 2. Include Tool Routers with Protection Dependency
secure = [Depends(require_active_access)]

app.include_router(pdf_to_word_text.router, dependencies=secure)
app.include_router(pdf_to_tiff.router, dependencies=secure)
app.include_router(pdf_split.router, dependencies=secure)
app.include_router(ocr_preview.router, dependencies=secure)
app.include_router(ln_xml_router, dependencies=secure)
app.include_router(xml_job_router, dependencies=secure)
app.include_router(folder_router, dependencies=secure)
app.include_router(ln_xml_manual.router, dependencies=secure)
app.include_router(image_crop.router, dependencies=secure)
app.include_router(ocr_router, dependencies=secure)
app.include_router(ws_router, dependencies=secure) # Wait, websockets might need custom token passing, but this works for basic routes
app.include_router(pdf_to_xml.router, dependencies=secure)
app.include_router(bits_router, dependencies=secure)
app.include_router(split_pdf_router, dependencies=secure)
app.include_router(bits_meta_router, dependencies=secure)
# Make sure to handle prefix for xml_ref router carefully, avoiding double prefixing if it already has one.
if not getattr(xml_ref_router, 'prefix', None):
    app.include_router(xml_ref_router, prefix="/api/xml-ref", dependencies=secure)
else:
    app.include_router(xml_ref_router, dependencies=secure)
app.include_router(case_reference_router, dependencies=secure)
app.include_router(build_router, dependencies=secure)
app.include_router(ocr_docbook_router, dependencies=secure)
app.include_router(docxmlindex_router, dependencies=secure)

# Root endpoint for health check
@app.get("/")
async def root():
    return {"message": "Black Vave Backend is Running (Protected)"}
