import socket
import threading
import subprocess
import psutil
from collections import defaultdict

class NetworkScanner:
    def __init__(self, target="127.0.0.1", ports=None, udp_ports=[53, 123, 161]):
        self.target = target
        # Default to top 20 common ports if none provided, to be faster for web demo
        self.ports = ports if ports else [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 993, 995, 1723, 3306, 3389, 5900, 8080, 8443]
        self.udp_ports = udp_ports
        self.open_ports = []
        self.udp_services = []
        self.banners = {}
        self.lock = threading.Lock()

    def scan_port(self, port):
        """
        TCP connect scan + banner grab.
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(1.0) # Slightly increased timeout
            result = sock.connect_ex((self.target, port))
            if result == 0:
                with self.lock:
                    self.open_ports.append(port)
                try:
                    # Simple banner grab
                    sock.send(b"HEAD / HTTP/1.0\r\n\r\n")
                    banner = sock.recv(1024).decode(errors="ignore").strip()
                    if banner:
                        with self.lock:
                            self.banners[port] = banner.split("\n")[0]
                except Exception:
                    with self.lock:
                        self.banners[port] = "Service detected, no banner"
            sock.close()
        except Exception:
            pass

    def scan_udp(self, port):
        """
        Very simple UDP probe.
        """
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            sock.settimeout(1)
            sock.sendto(b"\x00", (self.target, port))
            data, _ = sock.recvfrom(1024)
            with self.lock:
                self.udp_services.append({port: data.decode(errors="ignore")})
            sock.close()
        except Exception:
            pass

    def get_arp_table(self):
        try:
            return subprocess.getoutput("arp -a")
        except:
            return "N/A"

    def get_dns_cache(self):
        try:
            return subprocess.getoutput('powershell "Get-DnsClientCache"')
        except:
             return "N/A"

    def get_network_interfaces(self):
        try:
            return {nic: addrs[0].address for nic, addrs in psutil.net_if_addrs().items() if addrs}
        except:
             return {}

    def get_network_shares(self):
        try:
            return subprocess.getoutput("net share")
        except:
             return "N/A"

    def get_rpc_endpoints(self):
         try:
            return subprocess.getoutput('powershell "Get-WmiObject -Namespace root\\cimv2 -Class Win32_Service | Select Name,DisplayName"')
         except:
             return "N/A"

    def scan(self):
        """
        Perform full network scan with system enumeration.
        """
        # TCP Scan
        threads = []
        for port in self.ports:
            t = threading.Thread(target=self.scan_port, args=(port,))
            threads.append(t)
            t.start()
        for t in threads:
            t.join()

        # UDP Scan
        for port in self.udp_ports:
            self.scan_udp(port)
            
        # Sort ports
        self.open_ports.sort()

        return {
            "target": self.target,
            "open_tcp_ports": self.open_ports,
            "tcp_banners": self.banners,
            "open_udp_services": self.udp_services,
            "arp_table": self.get_arp_table(),
            "dns_cache": self.get_dns_cache(),
            "network_interfaces": self.get_network_interfaces(),
            "network_shares": self.get_network_shares(),
            "rpc_endpoints": self.get_rpc_endpoints()
        }
