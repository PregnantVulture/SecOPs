"""Tavily wrapper (Dev B): research service versions / CVEs. Target identifiers are stripped from the
query before it leaves the lab; failures are reported, never replaced with made-up results."""
import os
import re

import httpx

PATTERNS = [
    r"\b[a-z][a-z0-9+.-]*://\S+",                     # URLs
    r"\S+@\S+",                                       # emails
    r"\b\d{1,3}(\.\d{1,3}){3}(/\d{1,2})?(:\d+)?\b",   # IPv4 (+cidr/port)
    r"\b[0-9a-f]{0,4}(:[0-9a-f]{0,4}){2,7}\b",        # IPv6
    r"\b[\w-]+:\d{2,5}\b",                            # host:port leftovers
]
TLDS = ("com|org|net|io|co|dev|app|ai|edu|gov|mil|int|info|biz|us|uk|de|in|cloud|site|online|xyz|"
        "test|example|invalid|localhost|local|lan|internal|corp|home|lab|localdomain|intranet|private")
DOMAIN_RE = re.compile(rf"\b(?:[a-z0-9-]+\.){{2,}}[a-z][a-z0-9-]*\b|\b[a-z0-9-]+\.(?:{TLDS})\b", re.I)
KEEP = {"asp.net", "ado.net", "socket.io"}  # technology names that look like domains


def sanitize(query, redact=()):
    q = str(query)
    for term in sorted(filter(None, map(str, redact)), key=len, reverse=True):
        q = re.sub(rf"(?<![\w.-]){re.escape(term)}(?![\w.-])", " ", q, flags=re.I)
    for pat in PATTERNS:
        q = re.sub(pat, " ", q, flags=re.I)
    q = DOMAIN_RE.sub(lambda m: m[0] if m[0].lower() in KEEP else " ", q)
    return re.sub(r"\s+", " ", q).strip()[:300]


def run(action, params, redact=()):
    query = sanitize(params.get("query", ""), redact)
    if len(query) < 3:
        raise ValueError("query is empty after removing target identifiers")
    key = os.getenv("TAVILY_API_KEY")
    if not key:
        raise RuntimeError("TAVILY_API_KEY is not set")
    r = httpx.post("https://api.tavily.com/search", timeout=float(os.getenv("TAVILY_TIMEOUT", "20")),
                   headers={"Authorization": f"Bearer {key}"},
                   json={"query": query, "max_results": min(int(params.get("max_results", 5)), 10),
                         "search_depth": "basic", "include_answer": True})
    r.raise_for_status()
    data = r.json()
    sources = [{"title": s.get("title"), "url": s.get("url"), "snippet": (s.get("content") or "")[:300]}
               for s in data.get("results", [])]
    summary = data.get("answer") or (sources[0]["snippet"] if sources else "No results.")
    return {"query_sent": query, "summary": summary, "sources": sources}
