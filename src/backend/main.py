# requirements: fastapi, uvicorn[standard], httpx, python-multipart
# Install: pip install fastapi "uvicorn[standard]" httpx python-multipart
#
# Run: python main.py
#   or: python -m uvicorn main:app --reload --port 8001

import json
import os
import uuid
from typing import Any, Dict, Optional

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# ── Config ────────────────────────────────────────────────────────────────────
DATA_FILE = os.path.join(os.path.dirname(__file__), "test_data.json")
TP_API_BASE = "http://107.111.159.37:8000/api/tp/data"


# ── Models ────────────────────────────────────────────────────────────────────
class TestRow(BaseModel):
    id: str = ""
    testId: str = ""
    deviceId: str = ""
    requestType: str = ""
    details: str = ""
    results: str = ""
    status: str = "idle"  # idle | running | completed | error


class TestRowUpdate(BaseModel):
    testId: Optional[str] = None
    deviceId: Optional[str] = None
    requestType: Optional[str] = None
    details: Optional[str] = None
    results: Optional[str] = None
    status: Optional[str] = None


# ── Persistence helpers ───────────────────────────────────────────────────────
def _load() -> list[Dict[str, Any]]:
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def _save(rows: list[Dict[str, Any]]) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)


def _init_data_file() -> None:
    """Create test_data.json with one default row if it doesn't exist."""
    if not os.path.exists(DATA_FILE):
        default_row = {
            "id": str(uuid.uuid4()),
            "testId": "",
            "deviceId": "",
            "requestType": "",
            "details": "",
            "results": "",
            "status": "idle",
        }
        _save([default_row])
        print(f"[INIT] Created {DATA_FILE} with one default test row.")


# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(title="5G Lab Test Automator API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Logging middleware ────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    body_bytes = await request.body()
    body_text = body_bytes.decode("utf-8") if body_bytes else ""
    print(f"\n[REQUEST]  {request.method} {request.url.path}")
    if body_text:
        print(f"           payload: {body_text}")

    response = await call_next(request)

    print(f"[RESPONSE] status={response.status_code} path={request.url.path}")
    return response


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/tests")
async def list_tests():
    rows = _load()
    print(f"[DATA] Returning {len(rows)} test row(s).")
    return rows


@app.post("/api/tests", status_code=201)
async def create_test(row: TestRow):
    rows = _load()
    new_row: Dict[str, Any] = {
        "id": str(uuid.uuid4()),
        "testId": row.testId,
        "deviceId": row.deviceId,
        "requestType": row.requestType,
        "details": row.details,
        "results": row.results,
        "status": "idle",
    }
    rows.append(new_row)
    _save(rows)
    print(f"[DATA] Created test row id={new_row['id']}")
    return new_row


@app.put("/api/tests/{row_id}")
async def update_test(row_id: str, update: TestRowUpdate):
    rows = _load()
    for row in rows:
        if row["id"] == row_id:
            if update.testId is not None:
                row["testId"] = update.testId
            if update.deviceId is not None:
                row["deviceId"] = update.deviceId
            if update.requestType is not None:
                row["requestType"] = update.requestType
            if update.details is not None:
                row["details"] = update.details
            if update.results is not None:
                row["results"] = update.results
            if update.status is not None:
                row["status"] = update.status
            _save(rows)
            print(f"[DATA] Updated test row id={row_id}")
            return row
    raise HTTPException(status_code=404, detail=f"Test row '{row_id}' not found.")


@app.delete("/api/tests/{row_id}")
async def delete_test(row_id: str):
    rows = _load()
    filtered = [r for r in rows if r["id"] != row_id]
    if len(filtered) == len(rows):
        raise HTTPException(status_code=404, detail=f"Test row '{row_id}' not found.")
    _save(filtered)
    print(f"[DATA] Deleted test row id={row_id}")
    return {"success": True, "message": f"Test row '{row_id}' deleted."}


@app.post("/api/tests/{row_id}/start")
async def start_test(row_id: str):
    rows = _load()
    target = next((r for r in rows if r["id"] == row_id), None)
    if target is None:
        raise HTTPException(status_code=404, detail=f"Test row '{row_id}' not found.")

    # Mark as running
    target["status"] = "running"
    _save(rows)

    test_id: str = target.get("testId", "")

    if test_id.upper().startswith("TP"):
        url = f"{TP_API_BASE}/{test_id}"
        print(f"\n[EXT REQUEST]  GET {url}")
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.get(url)
            print(f"[EXT RESPONSE] status={resp.status_code} body={resp.text[:500]}")
            resp.raise_for_status()
            data = resp.json()
            description = data.get("description", "")
            target["details"] = description
            target["results"] = description
            target["status"] = "completed"
        except httpx.HTTPStatusError as exc:
            target["status"] = "error"
            target["results"] = f"HTTP error {exc.response.status_code}: {exc.response.text[:200]}"
        except Exception as exc:
            target["status"] = "error"
            target["results"] = f"Request failed: {str(exc)}"
    else:
        target["status"] = "completed"
        target["results"] = "Started"

    _save(rows)
    print(f"[DATA] Test row id={row_id} finished with status={target['status']}")
    return target


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    _init_data_file()
    print("FastAPI server starting on http://localhost:8001")
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
