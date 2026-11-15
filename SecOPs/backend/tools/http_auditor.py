"""
Fallback HTTP web security auditor: Direct probe of target for common Juice Shop vulnerabilities.
Runs when ZAP is unavailable or too slow. Fast, reliable, real findings.
"""
import asyncio
import httpx
import json
import re
from urllib.parse import urljoin, urlparse


async def audit_http_security(base_url: str, timeout: float = 10.0) -> dict:
    """
    Direct HTTP probe of target for security issues.
    Returns: {"url": base_url, "alerts": [...], "status": "success" or "error"}
    """
    alerts = []
    parsed = urlparse(base_url)
    scheme_port = f"{parsed.scheme}://{parsed.netloc}"

    try:
        async with httpx.AsyncClient(timeout=timeout, verify=False) as client:
            # Test 1: Security Headers
            try:
                resp = await client.get(base_url, follow_redirects=True)
                headers = resp.headers

                # Missing security headers
                missing_headers = []
                for header in [
                    "X-Frame-Options",
                    "X-Content-Type-Options",
                    "Content-Security-Policy",
                    "Strict-Transport-Security",
                    "X-XSS-Protection"
                ]:
                    if header not in headers:
                        missing_headers.append(header)

                if missing_headers:
                    alerts.append({
                        "alert": "Missing Security Headers",
                        "risk": "medium",
                        "confidence": "high",
                        "url": base_url,
                        "method": "GET",
                        "evidence": f"Missing headers: {', '.join(missing_headers)}",
                        "solution": "Configure web server to emit security headers.",
                        "cwe": "693"  # CWE-693: Protection Mechanism Failure
                    })

                # Server disclosure
                server = headers.get("Server", "")
                if server:
                    alerts.append({
                        "alert": "Server Information Disclosure",
                        "risk": "low",
                        "confidence": "high",
                        "url": base_url,
                        "method": "GET",
                        "evidence": f"Server header reveals: {server}",
                        "solution": "Remove or obfuscate Server header.",
                        "cwe": "200"
                    })
            except Exception as e:
                pass

            # Test 2: SQL Injection on search endpoint
            try:
                sqli_payloads = ["'", "' OR '1'='1", "' UNION SELECT 1--"]
                for payload in sqli_payloads:
                    try:
                        test_url = urljoin(scheme_port, f"/rest/products/search?q={payload}")
                        resp = await client.get(test_url)
                        if resp.status_code == 200 and ("error" in resp.text.lower() or "sql" in resp.text.lower()):
                            alerts.append({
                                "alert": "SQL Injection Vulnerability",
                                "risk": "high",
                                "confidence": "medium",
                                "url": test_url,
                                "method": "GET",
                                "param": "q",
                                "evidence": f"Payload: {payload} returned error response",
                                "solution": "Use parameterized queries; sanitize all user input.",
                                "cwe": "89"  # CWE-89: SQL Injection
                            })
                            break
                    except Exception:
                        pass
            except Exception as e:
                pass

            # Test 3: Path Traversal / Directory Enumeration
            sensitive_paths = [
                "/ftp",
                "/admin",
                "/.env",
                "/config",
                "/api/Users",
                "/rest/admin/users"
            ]
            for path in sensitive_paths:
                try:
                    test_url = urljoin(scheme_port, path)
                    resp = await client.get(test_url, follow_redirects=False)
                    if resp.status_code in [200, 201]:
                        alerts.append({
                            "alert": f"Sensitive Path Exposed: {path}",
                            "risk": "medium",
                            "confidence": "high",
                            "url": test_url,
                            "method": "GET",
                            "evidence": f"Endpoint {path} returned HTTP {resp.status_code}",
                            "solution": f"Restrict access to {path} or remove if not needed.",
                            "cwe": "552"  # CWE-552: Files or Directories Accessible to External Parties
                        })
                except Exception:
                    pass

            # Test 4: Weak Session Management (check for secure cookie flags)
            try:
                resp = await client.get(urljoin(scheme_port, "/"))
                set_cookie = resp.headers.get("Set-Cookie", "")
                if set_cookie and "secure" not in set_cookie.lower():
                    alerts.append({
                        "alert": "Insecure Session Cookie",
                        "risk": "medium",
                        "confidence": "high",
                        "url": base_url,
                        "method": "GET",
                        "evidence": f"Session cookie missing Secure flag: {set_cookie[:80]}",
                        "solution": "Set Secure and HttpOnly flags on session cookies.",
                        "cwe": "614"  # CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute
                    })
            except Exception:
                pass

            # Test 5: Unencrypted HTTP (if https not used)
            if parsed.scheme == "http":
                alerts.append({
                    "alert": "Unencrypted Communication (HTTP)",
                    "risk": "high",
                    "confidence": "high",
                    "url": base_url,
                    "method": "GET",
                    "evidence": "Target is accessed via HTTP, not HTTPS",
                    "solution": "Use HTTPS (TLS/SSL) for all communications.",
                    "cwe": "295"  # CWE-295: Improper Certificate Validation
                })

        return {
            "url": base_url,
            "alerts": alerts,
            "count": len(alerts),
            "timed_out": False
        }

    except Exception as e:
        return {
            "url": base_url,
            "alerts": [],
            "count": 0,
            "error": str(e),
            "timed_out": False
        }
