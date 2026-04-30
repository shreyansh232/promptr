import uvicorn
from app import app  # noqa: F401 — used by uvicorn via "main:app" string reference


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
