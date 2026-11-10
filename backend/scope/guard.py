"""
Scope Guard - Parses scope files and validates targets/actions against scope.
Dev A owns this. Deny by default: anything not explicitly allowed is blocked.
"""

import os
import ipaddress
import json
from typing import Dict, List, Set, Optional, Any
from urllib.parse import urlparse


class ScopeGuard:
    def __init__(self, scope_file_path: str = None):
        self.allowed_hosts: Set[str] = set()
        self.allowed_networks: List[ipaddress.IPv4Network | ipaddress.IPv6Network] = []
        self.allowed_ports: Set[int] = set()
        self.allowed_actions: Set[str] = set()  # format: "tool:action"
        self.allow_multi_host: bool = False

        if scope_file_path and os.path.exists(scope_file_path):
            self.load_scope(scope_file_path)
        else:
            # Default permissive scope for demo/hackathon if no file provided
            self.allowed_hosts.add("localhost")
            self.allowed_hosts.add("127.0.0.1")
            self.allowed_networks.append(ipaddress.ip_network("127.0.0.0/8"))
            self.allowed_ports.update([80, 443, 8080, 3000])
            self.allowed_actions.update([
                "nmap:port_scan",
                "nmap:service_scan",
                "zap:spider",
                "zap:active_scan",
                "tavily:research"
            ])
            self.allow_multi_host = False

    def load_scope(self, path: str):
        """Load scope from JSON, YAML, or plain text file."""
        with open(path, "r") as f:
            content = f.read().strip()

        if not content:
            return

        # Try JSON first
        try:
            data = json.loads(content)
            self._parse_structured(data)
            return
        except json.JSONDecodeError:
            pass

        # Try YAML
        try:
            import yaml
            data = yaml.safe_load(content)
            if data:
                self._parse_structured(data)
                return
        except Exception:
            pass

        # Fall back to plain text parsing
        self._parse_plain_text(content)

    def _parse_structured(self, data: Dict[str, Any]):
        """Parse structured scope data (JSON/YAML)."""
        if "allowed_hosts" in data:
            for host in data["allowed_hosts"]:
                self.allowed_hosts.add(host.lower().strip())

        if "allowed_cidrs" in data:
            for cidr in data["allowed_cidrs"]:
                try:
                    self.allowed_networks.append(ipaddress.ip_network(cidr.strip(), strict=False))
                except ValueError:
                    pass

        if "allowed_ports" in data:
            for port in data["allowed_ports"]:
                try:
                    self.allowed_ports.add(int(port))
                except (ValueError, TypeError):
                    pass

        if "allowed_actions" in data:
            for action in data["allowed_actions"]:
                self.allowed_actions.add(action.strip().lower())

        if "allow_multi_host" in data:
            self.allow_multi_host = bool(data["allow_multi_host"])

    def _parse_plain_text(self, content: str):
        """Parse plain text scope file (one entry per line, # comments)."""
        for line in content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue

            # Check for key:value format
            if ":" in line and not line.startswith("http"):
                key, value = line.split(":", 1)
                key = key.strip().lower()
                value = value.strip()

                if key == "allowed_hosts" or key == "host":
                    self.allowed_hosts.add(value.lower())
                elif key == "allowed_cidrs" or key == "cidr":
                    try:
                        self.allowed_networks.append(ipaddress.ip_network(value, strict=False))
                    except ValueError:
                        pass
                elif key == "allowed_ports" or key == "ports":
                    for port in value.split(","):
                        try:
                            self.allowed_ports.add(int(port.strip()))
                        except ValueError:
                            pass
                elif key == "allowed_actions" or key == "actions":
                    for action in value.split(","):
                        self.allowed_actions.add(action.strip().lower())
                elif key == "allow_multi_host":
                    self.allow_multi_host = value.lower() in ("true", "yes", "1")
            else:
                # Try as host/IP/CIDR
                try:
                    if "/" in line:
                        self.allowed_networks.append(ipaddress.ip_network(line, strict=False))
                    else:
                        self.allowed_hosts.add(line.lower())
                except ValueError:
                    self.allowed_hosts.add(line.lower())

    def _resolve_hostname(self, hostname: str) -> List[str]:
        """Resolve hostname to IPs to validate against CIDR ranges."""
        import socket
        try:
            infos = socket.getaddrinfo(hostname, None)
            return list(set(info[4][0] for info in infos))
        except socket.gaierror:
            return []

    def _normalize_target(self, target: str) -> Dict[str, Any]:
        """Normalize target to extract host, port, and resolved IPs."""
        target_clean = target.strip()

        # Remove protocol
        if "://" in target_clean:
            parsed = urlparse(target_clean)
            host = parsed.hostname or ""
            port = parsed.port
        else:
            # Might be host:port or just host
            if ":" in target_clean and not target_clean.startswith("["):
                host, port_str = target_clean.rsplit(":", 1)
                try:
                    port = int(port_str)
                except ValueError:
                    port = None
            else:
                host = target_clean
                port = None

        host = host.lower().strip()
        resolved_ips = self._resolve_hostname(host) if host else []

        return {
            "host": host,
            "port": port,
            "resolved_ips": resolved_ips
        }

    def check(self, tool: str, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Check if a tool action with given params is allowed by scope.
        Returns {"allowed": bool, "reason": str}
        """
        # Check action is allowed
        action_key = f"{tool}:{action}".lower()
        if self.allowed_actions and action_key not in self.allowed_actions:
            return {
                "allowed": False,
                "reason": f"Action '{action_key}' not in allowed_actions list"
            }

        # Extract target from params
        target = params.get("target") or params.get("url") or params.get("host")
        if not target:
            return {
                "allowed": False,
                "reason": "No target/url/host specified in params"
            }

        normalized = self._normalize_target(target)
        host = normalized["host"]
        port = normalized["port"]
        resolved_ips = normalized["resolved_ips"]

        # Check host/IP against allowed lists
        host_allowed = False

        # Direct hostname match
        if host in self.allowed_hosts:
            host_allowed = True
        elif "*" in self.allowed_hosts:
            host_allowed = True

        # Check resolved IPs against CIDR ranges
        if not host_allowed and resolved_ips:
            for ip_str in resolved_ips:
                try:
                    ip_obj = ipaddress.ip_address(ip_str)
                    for net in self.allowed_networks:
                        if ip_obj in net:
                            host_allowed = True
                            break
                    if host_allowed:
                        break
                except ValueError:
                    pass

        # Check if host itself is an IP in allowed networks
        if not host_allowed:
            try:
                ip_obj = ipaddress.ip_address(host)
                for net in self.allowed_networks:
                    if ip_obj in net:
                        host_allowed = True
                        break
            except ValueError:
                pass

        if not host_allowed:
            return {
                "allowed": False,
                "reason": f"Host '{host}' (resolved: {resolved_ips}) not in allowed hosts/CIDRs"
            }

        # Check port if specified and ports are restricted
        if port is not None and self.allowed_ports:
            if port not in self.allowed_ports:
                return {
                    "allowed": False,
                    "reason": f"Port {port} not in allowed_ports: {sorted(self.allowed_ports)}"
                }

        return {"allowed": True, "reason": "Allowed by scope"}

    def is_allowed(self, target: str) -> bool:
        """Legacy method for backward compatibility - checks host only."""
        result = self.check("nmap", "port_scan", {"target": target})
        return result["allowed"]

    def get_scope_summary(self) -> Dict[str, Any]:
        """Return a summary of the loaded scope for reporting."""
        return {
            "allowed_hosts": sorted(self.allowed_hosts),
            "allowed_cidrs": [str(n) for n in self.allowed_networks],
            "allowed_ports": sorted(self.allowed_ports),
            "allowed_actions": sorted(self.allowed_actions),
            "allow_multi_host": self.allow_multi_host
        }


# Global instance for easy import (uses default scope.txt if exists)
_default_guard = ScopeGuard(os.path.join(os.path.dirname(__file__), "..", "scope.txt"))

def is_allowed(target: str) -> bool:
    return _default_guard.is_allowed(target)