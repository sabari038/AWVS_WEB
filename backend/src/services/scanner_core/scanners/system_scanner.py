import platform
import psutil
import socket
import os
import subprocess
import winreg
import wmi
from datetime import datetime

class SystemScanner:
    def __init__(self):
        self.c = wmi.WMI()

    def get_basic_info(self):
        os_info = self.c.Win32_OperatingSystem()[0]
        return {
            "os": os_info.Caption,
            "os_version": os_info.Version,
            "build_number": os_info.BuildNumber,
            "architecture": platform.machine(),
            "hostname": socket.gethostname(),
            "ip_address": socket.gethostbyname(socket.gethostname()),
            "boot_time": str(datetime.fromtimestamp(psutil.boot_time()))
        }

    def get_cpu_info(self):
        return {
            "cpu_count": psutil.cpu_count(logical=True),
            "cpu_usage_percent": psutil.cpu_percent(interval=1),
            "cpu_freq": psutil.cpu_freq()._asdict() if psutil.cpu_freq() else {}
        }

    def get_memory_info(self):
        mem = psutil.virtual_memory()
        return {
            "total_memory": f"{round(mem.total / (1024**3), 2)} GB",
            "used_memory": f"{round(mem.used / (1024**3), 2)} GB",
            "percent_used": mem.percent
        }

    def get_disk_info(self):
        disks = {}
        for partition in psutil.disk_partitions():
            try:
                usage = psutil.disk_usage(partition.mountpoint)
                disks[partition.mountpoint] = {
                    "filesystem": partition.fstype,
                    "total": f"{round(usage.total / (1024**3), 2)} GB",
                    "used": f"{round(usage.used / (1024**3), 2)} GB",
                    "percent_used": usage.percent
                }
            except PermissionError:
                continue
        return disks

    def get_running_processes(self):
        return [proc.info for proc in psutil.process_iter(['pid', 'name', 'username', 'status'])]

    def get_installed_hotfixes(self):
        return [qfe.HotFixID for qfe in self.c.Win32_QuickFixEngineering()]

    def get_dotnet_versions(self):
        versions = []
        try:
            key = winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\Microsoft\NET Framework Setup\NDP')
            for i in range(0, winreg.QueryInfoKey(key)[0]):
                subkey_name = winreg.EnumKey(key, i)
                if subkey_name.startswith("v"):
                    versions.append(subkey_name)
        except Exception as e:
            versions.append(f"Error: {e}")
        return versions

    def get_antivirus(self):
        try:
            output = subprocess.getoutput(
                'powershell "Get-WmiObject -Namespace \\"root\\SecurityCenter2\\" -Class AntiVirusProduct | Select displayName"'
            )
            return output.strip()
        except Exception as e:
            return str(e)

    def get_firewall_status(self):
        try:
            output = subprocess.getoutput('netsh advfirewall show allprofiles')
            return output
        except Exception as e:
            return str(e)

    def get_users_and_groups(self):
        users = [u.Name for u in self.c.Win32_UserAccount()]
        groups = [g.Name for g in self.c.Win32_Group()]
        return {"users": users, "groups": groups}

    def scan(self):
        """
        Full system scan for Windows security posture
        """
        return {
            "Basic Information": self.get_basic_info(),
            "CPU": self.get_cpu_info(),
            "Memory": self.get_memory_info(),
            "Disk": self.get_disk_info(),
            "Running Processes": self.get_running_processes(),
            "Installed Hotfixes": self.get_installed_hotfixes(),
            ".NET Versions": self.get_dotnet_versions(),
            "Antivirus": self.get_antivirus(),
            "Firewall Status": self.get_firewall_status(),
            "Users and Groups": self.get_users_and_groups()
        }
