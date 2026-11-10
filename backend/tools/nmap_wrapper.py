"""
Nmap wrapper using python-nmap or fallback socket/subprocess scanning.
Backend Dev B / Dev A integration for network reconnaissance.
"""

import subprocess
import shutil
import socket
from typing import Dict, Any, List

def run_nmap_scan(action: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Execute nmap scan based on action ("port_scan" or "service_scan").
    Returns structured results per schemas.md.
    """
    target = params.get("target") or params.get("host")
    if not target:
        return {"status": "error", "error": "No target specified for nmap scan", "result": None}

    # Clean target (remove http:// if present)
    if "://" in target:
        target = target.split("://")[1].split("/")[0]
    if ":" in target and not target.startswith("["):
        target = target.split(":")[0]

    ports = params.get("ports", "21,22,80,443,3000,8080,8443")

    # Check if nmap executable is available
    nmap_path = shutil.which("nmap")

    if nmap_path:
        try:
            # Run real nmap
            cmd = [nmap_path, "-p", str(ports), "-T4"]
            if action == "service_scan":
                cmd.append("-sV")
            cmd.append(target)

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode != 0:
                return {
                    "status": "error",
                    "error": f"Nmap exited with code {result.returncode}: {result.stderr}",
                    "result": None
                }

            # Parse nmap text output into structured ports list
            parsed_ports = []
            for line in result.stdout.splitlines():
                if "/tcp" in line and "open" in line:
                    parts = line.split()
                    port_proto = parts[0]
                    port_num = int(port_proto.split("/")[0])
                    state = parts[1]
                    service = parts[2] if len(parts) > 2 else "unknown"
                    version = " ".join(parts[3:]) if len(parts) > 3 else None

                    parsed_ports.append({
                        "port": port_num,
                        "protocol": "tcp",
                        "state": state,
                        "service": service,
                        "version": version
                    })

            return {
                "status": "success",
                "result": {
                    "target": target,
                    "raw_output": result.stdout,
                    "ports": parsed_ports
                },
                "error": None
            }

        except subprocess.TimeoutExpired:
            return {"status": "error", "error": "Nmap scan timed out after 30s", "result": None}
        except Exception as e:
            return {"status": "error", "error": f"Nmap execution error: {str(e)}", "result": None}
    else:
        # Fallback Python socket scan if nmap binary is not installed in lab container
        open_ports = []
        port_list = []
        for p_range in str(ports).split(","):
            if "-" in p_range:
                start, end = map(int, p_range.split("-"))
                port_list.extend(range(start, end + 1))
            else:
                try:
                    port_list.append(int(p_range.strip()))
                except ValueError:
                    pass

        for p in port_list[:50]:  # limit for fallback
            try:
                s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                s.settimeout(0.5)
                res = s.connect_ex((target, p))
                s.close()
                if res == 0:
                    service = "http" if p in (80, 443, 3000, 8080) else "ssh" if p == 22 else "unknown"
                    open_ports.append({
                        "port": p,
                        "protocol": "tcp",
                        "state": "open",
                        "service": service,
                        "version": "fallback-socket-scan"
                    })
            except Exception:
                pass

        return {
            "status": "success",
            "result": {
                "target": target,
                "note": "Fallback socket scan (nmap binary not found)",
                "ports": open_ports
            },
            "error": None
        }
