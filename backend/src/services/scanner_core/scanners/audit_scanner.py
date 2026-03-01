import subprocess
import json
import platform

class AuditScanner:
    def __init__(self, credentials=None):
        self.credentials = credentials # Not fully used in this local demo, but structured for future
        self.os_type = platform.system()

    def check_password_policy(self):
        """
        Checks Windows password policy.
        """
        if self.os_type != "Windows":
            return {"error": "Audit scan currently only supports Windows"}

        try:
            # simplistic check using net accounts
            output = subprocess.check_output("net accounts", shell=True, text=True)
            return output
        except Exception as e:
            return f"Error checking password policy: {e}"

    def check_firewall_state(self):
        if self.os_type != "Windows":
            return "N/A"
        
        try:
            output = subprocess.check_output('powershell "Get-NetFirewallProfile | Select-Object Name,Enabled"', shell=True, text=True)
            return output
        except:
            return "Error checking firewall"

    def check_installed_patches(self):
        if self.os_type != "Windows":
            return "N/A"
        
        try:
            output = subprocess.check_output('wmic qfe get HotFixID,InstalledOn', shell=True, text=True)
            # Basic parsing could be added here
            return output.strip().split('\n')[:10] # Return top 10 for brevity
        except:
            return "Error listing patches"

    def collect_detailed_system_info(self):
        """
        Replicates the logic from main.py collect_windows_details.
        """
        if self.os_type != "Windows":
            return {}

        details = {}
        try:
            # 1. OS Info
            try:
                os_info = subprocess.check_output(
                    ["powershell", "-Command", "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber | ConvertTo-Json"],
                    text=True, stderr=subprocess.DEVNULL
                )
                details["os_info"] = json.loads(os_info)
            except:
                details["os_info"] = {}
            
            # 2. Installed Software (Win32_Product is slow but used in main.py)
            try:
                software = subprocess.check_output(
                    ["powershell", "-Command", "Get-WmiObject -Class Win32_Product | Select-Object -ExpandProperty Name | ConvertTo-Json"],
                    text=True, stderr=subprocess.DEVNULL
                )
                data = json.loads(software)
                details["software"] = data if isinstance(data, list) else [data]
            except:
                 details["software"] = []

            # 3. Hotfixes
            try:
                hotfixes = subprocess.check_output(
                   ["powershell", "-Command", "Get-HotFix | Select-Object -ExpandProperty HotFixID | ConvertTo-Json"],
                   text=True, stderr=subprocess.DEVNULL
                )
                data = json.loads(hotfixes)
                details["hotfixes"] = data if isinstance(data, list) else [data]
            except:
                details["hotfixes"] = []

        except Exception as e:
            print(f"Audit Scan Error: {e}")
        
        return details

    def scan(self):
        # Base audit
        results = {
            "password_policy": self.check_password_policy(),
            "firewall_status": self.check_firewall_state(),
            "recent_hotfixes": self.check_installed_patches()
        }
        
        # Enhanced System Details (for CVE lookup)
        sys_details = self.collect_detailed_system_info()
        results.update(sys_details)
        
        return results
