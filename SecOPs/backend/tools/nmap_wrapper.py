"""nmap wrapper (Dev B). Fixed, safe argument sets only; no caller-supplied flags."""
import os
import re
import socket
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import urlparse

import nmap

ARGS = {"port_scan": "-sT -Pn -T4", "service_scan": "-sT -Pn -sV -T4"}
PORTS_RE = re.compile(r"^\d{1,5}(-\d{1,5})?(,\d{1,5}(-\d{1,5})?)*$")
MAX_PORTS = 65535


def host_of(target):
    t = str(target or "").strip()
    return urlparse(t if "://" in t else f"//{t}").hostname or ""


def parse_ports(spec):
    spec = str(spec).replace(" ", "")
    if not PORTS_RE.match(spec):
        raise ValueError(f"invalid ports '{spec}' (use e.g. '80,443' or '1-1000')")
    ports = set()
    for part in spec.split(","):
        lo, _, hi = part.partition("-")
        lo, hi = int(lo), int(hi or lo)
        if not 1 <= lo <= hi <= MAX_PORTS:
            raise ValueError(f"invalid port range '{part}'")
        ports.update(range(lo, hi + 1))
    return sorted(ports)


def _socket_scan(addresses, ports, timeout=1.0):
    def is_open(job):
        addr, port = job
        with socket.socket(socket.AF_INET6 if ":" in addr else socket.AF_INET) as s:
            s.settimeout(timeout)
            return s.connect_ex((addr, port)) == 0
    jobs = [(a, p) for a in addresses for p in ports]
    with ThreadPoolExecutor(100) as ex:
        return [{"address": a, "port": p, "service": "unknown", "version": None}
                for (a, p), ok in zip(jobs, ex.map(is_open, jobs)) if ok]


def run(action, params, addresses=None):
    """Scan `addresses` (the IPs the registry checked); `target` is only the label reported back."""
    host = host_of(params.get("target") or params.get("host") or params.get("url"))
    if not host:
        raise ValueError("params.target is required")
    v4 = [a for a in addresses or [host] if ":" not in a]
    scan, ipv6 = (v4, False) if v4 else (list(addresses or [host]), True)
    spec = str(params.get("ports") or "1-1000").replace(" ", "")
    ports = parse_ports(spec)
    try:
        scanner = nmap.PortScanner()
    except nmap.PortScannerError:  # nmap binary missing: honest TCP-connect fallback
        return {"target": host, "addresses": scan, "open_ports": _socket_scan(scan, ports),
                "note": "nmap binary not found; TCP connect fallback, no service/version detection"}
    data = scanner.scan(" ".join(scan), spec, arguments=ARGS[action] + (" -6" if ipv6 else ""),
                        timeout=int(os.getenv("NMAP_TIMEOUT", "300")))
    open_ports = []
    for h in scanner.all_hosts():
        for port, info in sorted(scanner[h].get("tcp", {}).items()):
            if info.get("state") == "open":
                version = " ".join(filter(None, (info.get("product"), info.get("version"), info.get("extrainfo"))))
                open_ports.append({"address": h, "port": port, "service": info.get("name") or "unknown",
                                   "version": version or None})
    return {"target": host, "addresses": scan, "open_ports": open_ports, "command": data["nmap"]["command_line"]}
