"""Tool registry (Dev B): run_tool(tool_call, guard) -> Tool Call dict (shared/schemas.md §1).

Never raises. Fails closed: the guard must be a real ScopeGuard; tool:action, ports and hosts must be explicitly
in scope. The registry applies its own host/DNS policy (host_reason) AND the guard's check() must also allow.
Per-run state (hosts targeted, DNS pins) is keyed to the run's ScopeGuard instance, so runs never share it.
"""
import asyncio
import ipaddress
import re
import socket
import threading
import weakref
from dataclasses import dataclass, field
from datetime import datetime, timezone
from urllib.parse import urlparse

from backend.scope.guard import ScopeGuard
from backend.tools import nmap_wrapper, tavily_wrapper, zap_wrapper

ACTIONS = {
    "nmap": {"port_scan", "service_scan"},
    "zap": {"spider", "active_scan", "alerts"},
    "tavily": {"research"},
}
DEFAULT_PORTS = {"http": 80, "https": 443}
HOST_RE = re.compile(r"^[a-z0-9][a-z0-9.-]*$")  # no leading "-" (nmap option injection), no spaces


@dataclass
class RunState:
    hosts: set = field(default_factory=set)    # every host this run asked nmap/zap about (Tavily redaction)
    pins: dict = field(default_factory=dict)   # hostname -> IPs it first resolved to in this run
    lock: threading.Lock = field(default_factory=threading.Lock)


_RUNS = weakref.WeakKeyDictionary()  # ScopeGuard instance (one per run) -> RunState; freed with the guard
_RUNS_LOCK = threading.Lock()


def run_state(guard):
    with _RUNS_LOCK:
        state = _RUNS.get(guard)
        if state is None:
            state = _RUNS[guard] = RunState()
        return state


def utc_now():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _ip(value):
    try:
        return ipaddress.ip_address(str(value).split("%")[0])
    except ValueError:
        return None


def _verdict(guard, tool, action, params):
    v = guard.check(tool, action, params)
    return None if v.get("allowed") is True else v.get("reason") or "denied"


def host_reason(guard, host, state):
    """Registry host policy for every nmap target and ZAP URL. None = allowed.
    Allowed addresses = allowed_networks + IPs listed in allowed_hosts.
    IP: must be an allowed address. Hostname: must resolve to >=1 valid IP and stay on its first resolution in
    this run; if the scope has any allowed addresses, EVERY resolved IP must be one (being listed by name does not
    bypass this); if the scope has none, the hostname must be listed exactly."""
    host = str(host or "")
    literal = _ip(host)
    if not literal and not HOST_RE.match(host):
        return f"invalid host '{host}'"
    with state.lock:
        state.hosts.add(host)
    listed_ips = {ip for ip in map(_ip, guard.allowed_hosts) if ip}
    addr_ok = lambda ip: ip in listed_ips or any(ip in net for net in guard.allowed_networks)
    if literal:
        return None if addr_ok(literal) else f"{host} is not in the allowed addresses"
    try:
        ips = {ip for ip in (_ip(info[4][0]) for info in socket.getaddrinfo(host, None)) if ip}
    except OSError:
        return f"cannot resolve '{host}'"
    if not ips:
        return f"'{host}' resolved to no valid IP addresses"
    with state.lock:
        pinned = state.pins.setdefault(host, frozenset(ips))
    if not ips <= pinned:
        return f"'{host}' changed DNS during the run: {sorted(map(str, ips - pinned))}"
    if listed_ips or guard.allowed_networks:
        bad = sorted(str(ip) for ip in ips if not addr_ok(ip))
        return f"'{host}' resolves outside the allowed addresses: {bad}" if bad else None
    return None if host in guard.allowed_hosts else f"'{host}' is not in allowed_hosts"


def url_reason(guard, action, url, state):
    """Why a URL is out of scope (None if allowed). Default ports count: http://h == http://h:80."""
    p = urlparse(url)
    try:
        port = p.port or DEFAULT_PORTS.get(p.scheme)
    except ValueError:
        return f"invalid port in '{url}'"
    if p.scheme not in DEFAULT_PORTS or not p.hostname or p.username or p.password:
        return f"unsupported url '{url}'"
    if port not in guard.allowed_ports:
        return f"port {port} not in allowed_ports"
    return host_reason(guard, p.hostname, state) or _verdict(guard, "zap", action, {"url": url})


def scope_reason(guard, tool, action, params):
    """Canonicalises params in place, then returns why the call is out of scope (None if allowed)."""
    if not isinstance(guard, ScopeGuard):
        return "scope guard missing or invalid (fail closed)"
    if "*" in guard.allowed_hosts:
        return "wildcard host in scope is not accepted"
    if f"{tool}:{action}" not in guard.allowed_actions:
        return f"'{tool}:{action}' is not explicitly allowed by the scope"
    if tool == "tavily":
        return _verdict(guard, tool, action, params)
    if not guard.allowed_ports:
        return "scope lists no allowed_ports"
    state = run_state(guard)
    if tool == "zap":
        params["url"] = zap_wrapper.canonical_url(params.pop("url", None) or params.pop("target", None))
        return url_reason(guard, action, params["url"], state)
    params["target"] = host = nmap_wrapper.host_of(params.pop("target", None) or params.pop("host", None))
    if reason := host_reason(guard, host, state):
        return reason
    params["ports"] = params.get("ports") or ",".join(map(str, sorted(guard.allowed_ports)))
    extra = set(nmap_wrapper.parse_ports(params["ports"])) - guard.allowed_ports
    return f"ports {sorted(extra)[:10]} not in allowed_ports" if extra else _verdict(guard, tool, action, params)


def _run(tool, action, params, guard):
    state = run_state(guard)
    if tool == "nmap":  # scan exactly the addresses that were checked (no second DNS lookup)
        host = params["target"]
        with state.lock:
            addresses = [host] if _ip(host) else sorted(map(str, state.pins[host]))
        return nmap_wrapper.run(action, params, addresses=addresses)
    if tool == "zap":
        def in_scope(url):
            try:
                return url_reason(guard, action, url, state) is None
            except Exception:
                return False
        return zap_wrapper.run(action, params, in_scope)
    with state.lock:
        redact = set(guard.allowed_hosts) | state.hosts
    return tavily_wrapper.run(action, params, redact=redact)


async def run_tool(tool_call, guard=None):
    tc = tool_call if isinstance(tool_call, dict) else {}
    tool, action = str(tc.get("tool", "")).lower().strip(), str(tc.get("action", "")).lower().strip()
    raw = tc.get("params")
    params = dict(raw) if isinstance(raw, dict) else {}
    out = {"tool": tool, "action": action, "params": params, "status": "failed",
           "result": None, "error": None, "timestamp": utc_now()}
    try:
        if raw is not None and not isinstance(raw, dict):
            out["error"] = f"params must be a JSON object, got {type(raw).__name__}"
        elif action not in ACTIONS.get(tool, ()):
            out["error"] = f"Unsupported tool/action '{tool}:{action}'. Allowed: {ACTIONS}"
        elif reason := scope_reason(guard, tool, action, params):
            out["error"] = f"Scope blocked: {reason}"
        else:
            out["result"] = await asyncio.to_thread(_run, tool, action, params, guard)
            out["status"] = "success"
    except Exception as e:  # tool failures come back as data so the agent can recover
        out["error"] = f"{type(e).__name__}: {e}"
    return out
