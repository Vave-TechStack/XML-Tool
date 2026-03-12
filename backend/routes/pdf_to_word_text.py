from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from pdf2docx import Converter
import os, uuid

router = APIRouter()

TEMP_DIR = "temp_jobs"
os.makedirs(TEMP_DIR, exist_ok=True)

def cleanup_files(*file_paths: str):
    """Safely delete files after the response has been sent to the user."""
    for path in file_paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Cleanup error for {path}: {e}")

@router.post("/pdf-to-word")
async def pdf_to_word_text_based(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Converts a text-based PDF directly to a layout-preserving DOCX file.
    Enforces strict zero-storage by deleting all files immediately after returning the response.
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files allowed")

    job_id = str(uuid.uuid4())
    pdf_path = os.path.join(TEMP_DIR, f"{job_id}.pdf")
    docx_path = os.path.join(TEMP_DIR, f"{job_id}.docx")

    # 1. Save uploaded PDF temporarily
    with open(pdf_path, "wb") as f:
        f.write(await file.read())

    # 2. Perform the strict layout conversion
    try:
        cv = Converter(pdf_path)
        cv.convert(docx_path)
        cv.close()
    except Exception as e:
        cleanup_files(pdf_path, docx_path)
        raise HTTPException(500, f"Conversion failed: {str(e)}")

    # 3. Schedule absolute cleanup the millisecond the response successfully transmits
    background_tasks.add_task(cleanup_files, pdf_path, docx_path)

    # 4. Stream the pure document back to the frontend
    # Note: `FileResponse` will wait until the file is fully downloaded by the client
    # before executing the background tasks!
    return FileResponse(
        docx_path,
        filename=file.filename.replace(".pdf", ".docx").replace(".PDF", ".docx"),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
