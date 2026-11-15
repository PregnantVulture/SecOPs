# Minimal FastAPI application with WebSocket endpoint (/ws/agent) and report endpoint
# Backend Dev A - Agent core & API

import asyncio
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4
from fastapi import FastAPI, Body, HTTPException, UploadFile, File, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.agent.loop import AgentLoop
from backend.report.generator import build_report
from backend.tools.registry import run_tool

# .env holds the real secrets (ZAP key, Tavily key); .env.local may override them locally.
# Loading only .env.local silently dropped ZAP_API_KEY/ZAP_API_URL and sent ZAP calls
# to the wrong port with an empty key.
load_dotenv(".env")
load_dotenv(".env.local", override=True)

UPLOAD_DIR = Path(__file__).resolve().parent / "scope" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="SecOps AI Agent API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for reports and run logs
reports_db = {}


@app.get("/")
def read_root():
    return {"status": "online", "service": "SecOps AI Agent Backend Core"}


@app.post("/api/run")
async def start_agent_run(
    target: str = Query(...),
    scope_text: str = Query(None),
    objective: str = Query("Perform basic security assessment"),
    max_steps: int = Query(10)
):
    """
    Start a new agent run.
    Returns run_id for tracking via WebSocket and GET /api/report/{run_id}.

    scope_text (optional) is the raw content of a scope file (JSON/YAML/txt). It is
    written to a temp file, loaded by ScopeGuard, then deleted — nothing is stored.
    When absent, the default backend/scope.json is used (localhost/juice-shop).
    """
    if not target or not target.strip():
        return {"error": "target is required"}

    run_id = f"run_{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    # Persist the caller's scope text (if any) just long enough to load it.
    tmp_scope_path = None
    if scope_text and scope_text.strip():
        tmp = UPLOAD_DIR / f"{run_id}.scope"
        tmp.write_text(scope_text, encoding="utf-8")
        tmp_scope_path = str(tmp)

    try:
        agent = AgentLoop(
            target=target.strip(),
            scope_file=tmp_scope_path or "backend/scope.json",
            objective=objective,
            max_steps=int(max_steps),
        )
    finally:
        if tmp_scope_path and os.path.exists(tmp_scope_path):
            try:
                os.unlink(tmp_scope_path)
            except OSError:
                pass

    reports_db[run_id] = {
        "agent": agent,
        "target": target.strip(),
        "objective": objective,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "steps_completed": 0,
        "run_log": [],
        "findings": [],
        "scope_violations": [],
        "nuclei_running": False
    }

    asyncio.create_task(run_agent_loop(run_id, agent))

    return {
        "run_id": run_id,
        "status": "started",
        "message": f"Agent started against target '{target}' with objective: '{objective}'"
    }


@app.post("/api/run/{run_id}/nuclei")
async def run_approved_nuclei(run_id: str, approval: dict = Body(...)):
    """Run Nuclei once against the run's target after an explicit user approval."""
    report = reports_db.get(run_id)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Run {run_id} not found")
    if not isinstance(approval, dict) or approval.get("approved") is not True:
        raise HTTPException(status_code=400, detail="Explicit Nuclei approval is required")
    if report.get("nuclei_running"):
        raise HTTPException(status_code=409, detail="A Nuclei scan is already running for this run")

    report["nuclei_running"] = True
    target = report["target"]
    started = {
        "event_id": uuid4().hex,
        "type": "tool_call",
        "step": report.get("steps_completed", 0),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": {"tool": "nuclei", "action": "scan", "target": target},
    }
    report["run_log"].append(started)

    try:
        result = await run_tool(
            {
                "tool": "nuclei",
                "action": "scan",
                "params": {"target": target, "approved": True},
            },
            report["agent"].state.guard,
        )
        finished = {
            "event_id": uuid4().hex,
            "type": "tool_result",
            "step": report.get("steps_completed", 0),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "data": result,
        }
        report["run_log"].append(finished)
        report.update(build_report(
            run_log=report["run_log"],
            target=report["target"],
            objective=report["objective"],
        ))
        return {"events": [started, finished], "result": result}
    finally:
        report["nuclei_running"] = False


async def run_agent_loop(run_id: str, agent: AgentLoop):
    """Run the agent loop in the background and store results."""
    try:
        async for update in agent.run():
            if run_id in reports_db:
                reports_db[run_id]["steps_completed"] = update.get("step", 0)
                reports_db[run_id]["run_log"].append(update)

                update_type = update.get("type")
                if update_type == "scope_blocked":
                    reports_db[run_id]["scope_violations"].append(update.get("data", {}))
                    reports_db[run_id]["status"] = "blocked"

                elif update_type == "objective_complete":
                    reports_db[run_id]["status"] = "completed"
                    reports_db[run_id]["end_time"] = datetime.now(timezone.utc).isoformat()
                    data = update.get("data", {})
                    reports_db[run_id]["findings"] = data.get("findings", [])
                    reports_db[run_id]["scope_violations"] = data.get("scope_violations", [])
                    reports_db[run_id]["total_steps"] = data.get("total_steps", 0)
                    reports_db[run_id]["summary"] = data.get("summary", "Objective completed")
                    break

        if run_id in reports_db and reports_db[run_id]["status"] == "running":
            reports_db[run_id]["status"] = "completed"
            reports_db[run_id]["end_time"] = datetime.now(timezone.utc).isoformat()

        # Build final report
        if run_id in reports_db:
            rep_data = reports_db[run_id]
            final_rep = build_report(
                run_log=rep_data["run_log"],
                target=rep_data["target"],
                objective=rep_data["objective"]
            )
            rep_data.update(final_rep)

    except Exception as e:
        if run_id in reports_db:
            reports_db[run_id]["status"] = "error"
            reports_db[run_id]["error"] = str(e)


@app.websocket("/ws/agent/{run_id}")
async def agent_websocket(websocket: WebSocket, run_id: str):
    """
    WebSocket endpoint that streams Agent Decision objects for a specific run.
    Clients connect with /ws/agent/{run_id} and receive updates in real-time.
    """
    await websocket.accept()

    try:
        if run_id in reports_db:
            await websocket.send_json({
                "status": reports_db[run_id]["status"],
                "run_id": run_id,
                "message": f"Agent run {run_id} connected"
            })

        last_sent_index = 0

        while run_id in reports_db:
            report = reports_db[run_id]
            run_log = report.get("run_log", [])

            # Send new log items
            while last_sent_index < len(run_log):
                await websocket.send_json(run_log[last_sent_index])
                last_sent_index += 1

            if report["status"] in ("completed", "error", "blocked"):
                await asyncio.sleep(0.5)
                break

            await asyncio.sleep(0.8)

    except WebSocketDisconnect:
        print(f"[WebSocket] Frontend disconnected from run {run_id}")
    except Exception as e:
        print(f"[WebSocket Error] run {run_id}: {str(e)}")
    finally:
        try:
            await websocket.close()
        except:
            pass


@app.get("/api/report/{run_id}")
async def get_report(run_id: str):
    """Fetch the final report for a completed run."""
    if run_id in reports_db:
        report = reports_db[run_id]
        return {
            "run_id": run_id,
            "target": report.get("target"),
            "objective": report.get("objective"),
            "objective_status": report.get("objective_status", report["status"]),
            "start_time": report.get("start_time"),
            "end_time": report.get("end_time"),
            "total_steps": report.get("total_steps", report.get("steps_completed", 0)),
            "findings": report.get("findings", []),
            "scope_violations": report.get("scope_violations", []),
            "summary": report.get("summary", "Assessment summary")
        }
    return {"error": f"Run {run_id} not found"}, 404


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)