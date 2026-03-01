import requests
import ssl
import socket
from urllib.parse import urlparse

class WebScanner:
    def __init__(self, url):
        self.url = url
        if not self.url.startswith("http"):
            self.url = "http://" + self.url
        
        self.parsed_url = urlparse(self.url)
        self.results = {
            "headers": {},
            "security_headers_missing": [],
            "ssl_info": None,
            "tech_stack": [],
            "common_files": []
        }

    def check_headers(self):
        try:
            response = requests.get(self.url, timeout=5)
            self.results["headers"] = dict(response.headers)
            
            # Check for security headers
            security_headers = [
                "Content-Security-Policy",
                "X-Frame-Options",
                "X-XSS-Protection",
                "Strict-Transport-Security",
                "X-Content-Type-Options"
            ]
            
            for h in security_headers:
                if h not in response.headers:
                    self.results["security_headers_missing"].append(h)
                    
            # Basic Tech Detection from Server header
            if "Server" in response.headers:
                self.results["tech_stack"].append(f"Server: {response.headers['Server']}")
            if "X-Powered-By" in response.headers:
                self.results["tech_stack"].append(f"Powered By: {response.headers['X-Powered-By']}")
                
        except Exception as e:
            self.results["error"] = str(e)

    def check_ssl(self):
        if self.parsed_url.scheme != "https":
            self.results["ssl_info"] = "Target is not using HTTPS"
            return

        try:
            hostname = self.parsed_url.netloc
            context = ssl.create_default_context()
            with socket.create_connection((hostname, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                    cert = ssock.getpeercert()
                    self.results["ssl_info"] = {
                        "issuer": dict(x[0] for x in cert['issuer']),
                        "subject": dict(x[0] for x in cert['subject']),
                        "version": cert['version'],
                        "notAfter": cert['notAfter']
                    }
        except Exception as e:
            self.results["ssl_info"] = f"SSL Check Failed: {str(e)}"

    def check_common_paths(self):
        # Very basic enumeration
        paths = ["/robots.txt", "/sitemap.xml", "/admin", "/login", "/.git/HEAD"]
        base_url = f"{self.parsed_url.scheme}://{self.parsed_url.netloc}"
        
        for path in paths:
            try:
                r = requests.head(base_url + path, timeout=3)
                if r.status_code == 200:
                    self.results["common_files"].append({"path": path, "status": 200})
                elif r.status_code == 403:
                    self.results["common_files"].append({"path": path, "status": 403})
            except:
                pass

    def scan(self):
        self.check_headers()
        if self.parsed_url.scheme == "https":
            self.check_ssl()
        self.check_common_paths()
        return self.results
