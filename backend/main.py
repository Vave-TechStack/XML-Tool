import sys
import os
import threading
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Setup Base Directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

# Database & Auth
from database import engine, Base, SessionLocal
from models import User, UserRole
from auth import require_active_access, hash_password

# Create DB tables
Base.metadata.create_all(bind=engine)

# ================= CENTRAL CLEANUP WORKER (TTL) =================
def central_cleanup_worker():
    """
    Scans temp_jobs and outputs directories every 10 minutes.
    Deletes files older than 30 minutes to ensure 'Transient Storage' 
    while preventing 'Network issue' download errors.
    """
    dirs_to_clean = ["temp_jobs", "outputs"]
    ttl_seconds = 30 * 60 # 30 minutes
    
    while True:
        now = time.time()
        for d in dirs_to_clean:
            if not os.path.exists(d):
                continue
            for f in os.listdir(d):
                f_path = os.path.join(d, f)
                # Skip directories and keep the folders themselves
                if os.path.isdir(f_path):
                    continue
                try:
                    f_age = now - os.path.getmtime(f_path)
                    if f_age > ttl_seconds:
                        os.remove(f_path)
                except Exception as e:
                    print(f"TTL Cleanup Error for {f_path}: {e}")
        time.sleep(600) # Sleep for 10 minutes

# ================= SUPER ADMIN INIT =================
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start the central cleanup worker in the background
    threading.Thread(target=central_cleanup_worker, daemon=True).start()

    db = SessionLocal()

    admin_email = os.environ.get(
        "SUPERADMIN_EMAIL",
        "admin@vavetechstack.com"
    )

    admin_password = os.environ.get(
        "SUPERADMIN_PASSWORD",
        "admin123"
    )

    super_admin_exists = db.query(User).filter(
        User.role == UserRole.SUPERADMIN
    ).first()

    if not super_admin_exists:

        hashed_pwd = hash_password(admin_password)

        db.add(
            User(
                email=admin_email,
                hashed_password=hashed_pwd,
                role=UserRole.SUPERADMIN,
                is_active=True,
                subscription_active=True
            )
        )

        db.commit()

    db.close()

    yield


# ================= FASTAPI APP =================
app = FastAPI(
    title="Black Vave Multi-Tool API - Authenticated",
    lifespan=lifespan
)

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= STATIC FOLDERS =================
os.makedirs("outputs", exist_ok=True)
os.makedirs("temp_jobs", exist_ok=True)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/temp_jobs", StaticFiles(directory="temp_jobs"), name="temp_jobs")

# ================= ROUTERS =================

from routes import (
    pdf_to_tiff,
    pdf_to_word_text,
    pdf_split,
    ocr_preview,
    ln_xml_manual,
    image_crop,
    pdf_to_xml,
    auth_routes,
    admin_routes
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

# ================= AUTH ROUTES =================
app.include_router(auth_routes.router)
app.include_router(admin_routes.router)

# ================= SECURED ROUTES =================
secure = [Depends(require_active_access)]

app.include_router(pdf_to_word_text.router, dependencies=secure)
app.include_router(pdf_to_tiff.router, dependencies=secure)
app.include_router(ocr_preview.router, dependencies=secure)
app.include_router(ln_xml_router, dependencies=secure)
app.include_router(xml_job_router, dependencies=secure)
app.include_router(folder_router, dependencies=secure)
app.include_router(ln_xml_manual.router, dependencies=secure)
app.include_router(image_crop.router, dependencies=secure)
app.include_router(ocr_router, dependencies=secure)
app.include_router(ws_router, dependencies=secure)
app.include_router(pdf_to_xml.router, dependencies=secure)
app.include_router(bits_router, dependencies=secure)

# 🔓 MAKE SPLIT PDF PUBLIC
app.include_router(split_pdf_router)

app.include_router(bits_meta_router, dependencies=secure)

if not getattr(xml_ref_router, "prefix", None):
    app.include_router(
        xml_ref_router,
        prefix="/api/xml-ref",
        dependencies=secure
    )
else:
    app.include_router(xml_ref_router, dependencies=secure)

app.include_router(case_reference_router, dependencies=secure)
app.include_router(build_router, dependencies=secure)
app.include_router(ocr_docbook_router, dependencies=secure)
app.include_router(docxmlindex_router, dependencies=secure)

# ================= HEALTH CHECK =================
@app.get("/")
async def root():
    return {"message": "Black Vave Backend is Running (Protected)"}