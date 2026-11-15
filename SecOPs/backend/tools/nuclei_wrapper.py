"""Manually approved, bounded Nuclei scan wrapper for the configured local lab."""

import json
import logging
import shutil
import subprocess

from backend.scope.local_lab import validate_local_target


logger = logging.getLogger(__name__)
TIMEOUT_SECONDS = 60
TAGS = "misconfig,exposure"
SEVERITIES = "medium,high,critical"


def _findings(stdout):
    findings = []
    malformed_lines = 0
    for line in stdout.splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            malformed_lines += 1
            continue
        if not isinstance(record, dict):
            malformed_lines += 1
            continue
        info = record.get("info") if isinstance(record.get("info"), dict) else {}
        findings.append(
            {
                "template_id": record.get("template-id") or record.get("template_id") or "",
                "name": info.get("name") or record.get("template-id") or "",
                "severity": info.get("severity") or "unknown",
                "matched_at": record.get("matched-at") or record.get("matched_at") or "",
                "description": info.get("description") or "",
            }
        )
    return findings, malformed_lines


def _stderr_text(stderr):
    if isinstance(stderr, bytes):
        return stderr.decode("utf-8", errors="replace").strip()
    return (stderr or "").strip()


def run(params):
    """Run only after explicit approval and local-scope validation."""
    if not isinstance(params, dict) or params.get("approved") is not True:
        return {"status": "failed", "reason": "explicit approval required", "findings": []}

    target = validate_local_target(params.get("target"))
    binary = shutil.which("nuclei")
    if not binary:
        logger.info("Nuclei unavailable: binary not installed on PATH")
        return {
            "status": "unavailable",
            "reason": "nuclei binary not installed on PATH",
            "findings": [],
        }

    command = [
        binary,
        "-u", target,
        "-tags", TAGS,
        "-severity", SEVERITIES,
        "-duc",
        "-silent",
        "-jsonl",
    ]
    command_text = subprocess.list2cmdline(command)
    logger.info("Running approved local-lab Nuclei command: %s", command_text)

    try:
        completed = subprocess.run(
            command,
            stdin=subprocess.DEVNULL,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        stderr = _stderr_text(exc.stderr)
        logger.warning("Nuclei timed out after %ss; command=%s; stderr=%s",
                       TIMEOUT_SECONDS, command_text, stderr)
        return {
            "status": "timeout",
            "reason": f"Nuclei exceeded {TIMEOUT_SECONDS}-second timeout",
            "stderr": stderr,
            "command": command_text,
            "findings": [],
        }
    except OSError as exc:
        logger.error("Nuclei execution failed; command=%s; error=%s", command_text, exc)
        return {
            "status": "failed",
            "reason": str(exc),
            "command": command_text,
            "findings": [],
        }

    stderr = _stderr_text(completed.stderr)
    if stderr:
        logger.info("Nuclei stderr; command=%s; stderr=%s", command_text, stderr)
    findings, malformed_lines = _findings(completed.stdout or "")
    if malformed_lines:
        logger.warning("Nuclei returned %s malformed JSONL line(s)", malformed_lines)
    if completed.returncode:
        return {
            "status": "failed",
            "reason": stderr or f"Nuclei exited with status {completed.returncode}",
            "returncode": completed.returncode,
            "stderr": stderr,
            "command": command_text,
            "findings": findings,
        }
    return {
        "status": "success",
        "target": target,
        "findings": findings,
        "malformed_lines": malformed_lines,
        "stderr": stderr,
        "command": command_text,
    }
