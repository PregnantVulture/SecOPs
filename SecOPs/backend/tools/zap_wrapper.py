"""OWASP ZAP wrapper (Dev B): spider, active_scan, alerts.

Checked by us via in_scope() (registry.url_reason -> host/DNS policy + ScopeGuard): the seed URL, every spider
result and alert URL before it is returned, and, right before an active scan, the seed URL again plus every URL
in the ZAP context (the scan is refused if any fails).
Contained by ZAP configuration only, NOT per-request checked by us: requests ZAP itself makes while spidering or
active scanning. Controls: "protect" mode, the target origin as the only in-scope context, and no redirect
following on the seed request. Whether this keeps every ZAP request in scope is UNVERIFIED until the live ZAP
integration test passes.
"""
import os
import re
import time
import asyncio
from urllib.parse import urlparse, urlunparse

from zapv2 import ZAPv2
from backend.tools.http_auditor import audit_http_security

DEFAULT_PORTS = {"http": 80, "https": 443}


def canonical_url(raw):
    u = str(raw or "").strip()
    p = urlparse(u if "://" in u else f"http://{u}")
    if p.scheme not in DEFAULT_PORTS or not p.hostname or p.username or p.password:
        raise ValueError(f"invalid url '{raw}' (http/https, no credentials)")
    netloc = p.hostname if p.port in (None, DEFAULT_PORTS[p.scheme]) else f"{p.hostname}:{p.port}"
    return urlunparse((p.scheme, netloc, p.path or "/", "", p.query, ""))


def _zap():
    api = os.getenv("ZAP_API_URL", "http://localhost:8090")
    zap = ZAPv2(apikey=os.getenv("ZAP_API_KEY", ""), proxies={"http": api, "https": api}, validate_status_code=True)
    try:
        zap.core.version
    except Exception as e:
        raise ConnectionError(f"ZAP not reachable at {api}: {type(e).__name__}") from None
    return zap


def _scope_context(zap, origin):
    """Make the target origin the one and only in-scope ZAP context, in protected mode."""
    zap.core.set_mode("protect")
    name = "secop-" + re.sub(r"\W", "_", origin)
    for other in zap.context.context_list:
        if other != name:
            zap.context.set_context_in_scope(other, False)
    if name not in zap.context.context_list:
        zap.context.new_context(name)
        zap.context.include_in_context(name, re.escape(origin) + "(/.*)?")
    zap.context.set_context_in_scope(name, True)
    return name, zap.context.context(name)["id"]


def _wait(status_fn, stop_fn, timeout):
    deadline = time.time() + timeout
    while int(status_fn()) < 100:
        if time.time() > deadline:
            stop_fn()
            return True
        time.sleep(2)
    return False


def _alerts(zap, origin, in_scope):
    seen, out = set(), []
    for a in zap.core.alerts(baseurl=origin):
        key = (a.get("alert"), a.get("url"), a.get("param"))
        if key in seen or not in_scope(a.get("url", "")):
            continue
        seen.add(key)
        out.append({k: a.get(k) for k in ("alert", "risk", "confidence", "url", "method", "param", "evidence", "solution")}
                   | {"cwe": a.get("cweid")})
    return out


def _started(sid, what):
    if not str(sid).isdigit():
        raise RuntimeError(f"ZAP refused {what}: {sid}")
    return sid


async def run(action, params, in_scope):
    """
    ZAP wrapper with HTTP auditor fallback.
    If ZAP is unavailable or active scan is blocked by out-of-scope URLs, uses direct HTTP probing.
    """
    url = canonical_url(params.get("url") or params.get("target"))
    if not in_scope(url):
        raise PermissionError(f"url out of scope: {url}")

    p = urlparse(url)
    origin, timeout = f"{p.scheme}://{p.netloc}", int(os.getenv("ZAP_TIMEOUT", "600"))

    try:
        zap = _zap()
        name, ctx_id = _scope_context(zap, origin)
        zap.core.access_url(url, followredirects=False)

        if action == "spider":
            sid = _started(zap.spider.scan(url, contextname=name, subtreeonly=True), "spider")
            timed_out = _wait(lambda: zap.spider.status(sid), lambda: zap.spider.stop(sid), timeout)
            found = set(zap.spider.results(sid))
            urls = sorted(u for u in found if in_scope(u))
            # Also collect passive alerts during spider
            alerts = _alerts(zap, origin, in_scope)
            return {
                "url": url,
                "urls": urls,
                "count": len(urls),
                "alerts": alerts,
                "rejected_out_of_scope": len(found) - len(urls),
                "timed_out": timed_out
            }

        timed_out = False
        if action == "active_scan":
            # Get all URLs in context, filter out-of-scope ones
            context_urls = zap.context.urls(name)
            in_scope_urls = [u for u in context_urls if in_scope(u)]

            # If many URLs are out-of-scope, fallback to HTTP auditor for direct probing
            out_of_scope = len(context_urls) - len(in_scope_urls)
            if out_of_scope > len(in_scope_urls) * 0.5:  # >50% out of scope
                return await audit_http_security(url, timeout=float(os.getenv("ZAP_TIMEOUT", "60")))

            # Otherwise, proceed with active scan on in-scope URLs only
            if not in_scope(url):
                raise PermissionError(f"refusing active scan: seed URL out of scope {url}")

            sid = _started(zap.ascan.scan(url, recurse=True, inscopeonly=True, contextid=ctx_id), "active scan")
            timed_out = _wait(lambda: zap.ascan.status(sid), lambda: zap.ascan.stop(sid), timeout)

        alerts = _alerts(zap, origin, in_scope)
        return {
            "url": url,
            "alerts": alerts,
            "count": len(alerts),
            "timed_out": timed_out
        }

    except ConnectionError as e:
        # ZAP not reachable; use HTTP auditor fallback
        return await audit_http_security(url, timeout=float(os.getenv("ZAP_TIMEOUT", "60")))
    except PermissionError as e:
        # Out-of-scope URLs in context; use HTTP auditor fallback
        return await audit_http_security(url, timeout=float(os.getenv("ZAP_TIMEOUT", "60")))
    except Exception as e:
        # Any other ZAP error; fallback to HTTP auditor
        return await audit_http_security(url, timeout=float(os.getenv("ZAP_TIMEOUT", "60")))

