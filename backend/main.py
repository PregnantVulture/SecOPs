# Minimal FastAPI application with WebSocket endpoint (/ws/agent) and report endpoint
# Backend Dev A - Agent core & API

import asyncio
from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.agent.loop import AgentLoop
from backend.report.generator import build_report

load_dotenv(".env.local")

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
    target: str,
    scope_file: str = None,
    objective: str = "Perform basic security assessment",
    max_steps: int = 10
):
    """
    Start a new agent run.
    Returns run_id for tracking via WebSocket and GET /api/report/{run_id}.
    """
    run_id = f"run_{int(datetime.now(timezone.utc).timestamp() * 1000)}"

    # Initialize and start the agent loop
    agent = AgentLoop(
        target=target,
        scope_file=scope_file or "scope.txt",
        objective=objective,
        max_steps=max_steps
    )

    # Store agent reference and start state
    reports_db[run_id] = {
        "agent": agent,
        "target": target,
        "objective": objective,
        "start_time": datetime.now(timezone.utc).isoformat(),
        "status": "running",
        "steps_completed": 0,
        "run_log": [],
        "findings": [],
        "scope_violations": []
    }

    # Start the agent loop in the background
    asyncio.create_task(run_agent_loop(run_id, agent))

    return {
        "run_id": run_id,
        "status": "started",
        "message": f"Agent started against target '{target}' with objective: '{objective}'"
    }


async def run_agent_loop(run_id: str, agent: AgentLoop):
    """Run the agent loop in the background and store results."""
    try:
        async for update in agent.run_step():
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