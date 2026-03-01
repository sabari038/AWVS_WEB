import subprocess
import socket
import threading
from concurrent.futures import ThreadPoolExecutor
import os
import platform

class HostDiscovery:
    def __init__(self, target_subnet):
        """
        target_subnet: CIDR notation (e.g., "192.168.1.0/24") or single IP
        """
        self.target_subnet = target_subnet
        self.active_hosts = []

    def ping_host(self, ip):
        """
        Pings a single host. Returns IP if active, else None.
        """
        param = '-n' if platform.system().lower() == 'windows' else '-c'
        command = ['ping', param, '1', ip]
        
        try:
            # We suppress output to keep console clean
            subprocess.check_call(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            return ip
        except subprocess.CalledProcessError:
            return None

    def scan(self):
        """
        Scans the subnet for active hosts.
        Note: Python socket libraries generally don't support ICMP without root/admin.
        This uses system ping command for broader compatibility.
        """
        # Parse subnet to get list of IPs (Simplified for planning, using basic loop for /24)
        # For a robust implementation, use `ipaddress` module
        import ipaddress
        
        try:
            network = ipaddress.ip_network(self.target_subnet, strict=False)
            hosts = list(network.hosts())
        except ValueError:
            # Maybe it's a single IP
            return [self.target_subnet] if self.ping_host(self.target_subnet) else []

        # Limit to 255 hosts for performance if a large subnet is given
        hosts = hosts[:255] 
        host_strs = [str(h) for h in hosts]

        print(f"[*] Scanning {len(host_strs)} hosts in {self.target_subnet}...")

        with ThreadPoolExecutor(max_workers=20) as executor:
            results = executor.map(self.ping_host, host_strs)
        
        self.active_hosts = [ip for ip in results if ip is not None]
        
        # Try to resolve hostnames
        final_results = []
        for ip in self.active_hosts:
            try:
                hostname = socket.gethostbyaddr(ip)[0]
            except socket.herror:
                hostname = "Unknown"
            final_results.append({"ip": ip, "hostname": hostname, "status": "Up"})

        return final_results
