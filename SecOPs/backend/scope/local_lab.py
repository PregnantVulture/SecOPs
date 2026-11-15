"""Hard boundary for scanner targets, independent of user-supplied scope files."""

import ipaddress
import json
import socket
from pathlib import Path
from urllib.parse import urlparse, urlunparse


LOCAL_SCOPE_PATH = Path(__file__).resolve().parents[1] / "scope.json"
TARGET_SCOPE_ERROR = "Target outside local lab scope"


def _configured_local_scope():
    try:
        data = json.loads(LOCAL_SCOPE_PATH.read_text(encoding="utf-8"))
        networks = [ipaddress.ip_network(value, strict=False) for value in data["local_lab_cidrs"]]
        hosts = {str(value).lower().rstrip(".") for value in data["local_lab_hosts"]}
    except (OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        raise RuntimeError("Invalid local lab scope configuration") from exc
    if not networks or not hosts:
        raise RuntimeError("Invalid local lab scope configuration")
    return networks, hosts


def _allowed_address(address, networks):
    return any(address.version == network.version and address in network for network in networks)


def validate_local_target(target):
    """Validate a lab URL/host and return a version pinned to an approved IP."""
    if not isinstance(target, str) or not target.strip():
        raise ValueError(TARGET_SCOPE_ERROR)

    networks, allowed_hosts = _configured_local_scope()
    value = target.strip()
    if "://" not in value and value.count(":") >= 2 and not value.startswith("["):
        value = f"[{value}]"
    parsed = urlparse(value if "://" in value else f"//{value}")
    if parsed.scheme and parsed.scheme.lower() not in ("http", "https"):
        raise ValueError(TARGET_SCOPE_ERROR)
    if not parsed.hostname or parsed.username or parsed.password or parsed.fragment:
        raise ValueError(TARGET_SCOPE_ERROR)
    try:
        port = parsed.port
    except ValueError as exc:
        raise ValueError(TARGET_SCOPE_ERROR) from exc

    hostname = parsed.hostname.lower().rstrip(".")
    try:
        address = ipaddress.ip_address(hostname.split("%", 1)[0])
        addresses = [address]
    except ValueError:
        if hostname not in allowed_hosts:
            raise ValueError(TARGET_SCOPE_ERROR)
        try:
            addresses = sorted(
                {
                    ipaddress.ip_address(info[4][0].split("%", 1)[0])
                    for info in socket.getaddrinfo(hostname, port)
                },
                key=lambda ip: (ip.version != 4, int(ip)),
            )
        except (OSError, ValueError) as exc:
            raise ValueError(TARGET_SCOPE_ERROR) from exc
        if not addresses:
            raise ValueError(TARGET_SCOPE_ERROR)

    if any(not _allowed_address(address, networks) for address in addresses):
        raise ValueError(TARGET_SCOPE_ERROR)

    address = addresses[0]
    host = f"[{address}]" if address.version == 6 else str(address)
    netloc = host if port is None else f"{host}:{port}"
    if parsed.scheme:
        return urlunparse((parsed.scheme.lower(), netloc, parsed.path, parsed.params, parsed.query, ""))
    return netloc
