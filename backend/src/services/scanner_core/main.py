# main.py

from scanners.system_scanner import SystemScanner
from scanners.network_scanner import NetworkScanner
from reports.report_generator import ReportGenerator
from reports.advanced_scan_report_generator import AdvancedScanReportGenerator
from scanners.vulnerability_scanner import VulnerabilityScanner
from visualizer.network_mapper import build_network_map
from datetime import datetime
from collections import Counter
import time
import subprocess
import json


# ============================================================
# Helper: Collect Windows-specific software info dynamically
# ============================================================
def collect_windows_details():
    print("[*] Collecting detailed Windows information (PowerShell)...")
    try:
        # Get Windows version
        os_info = subprocess.check_output(
            ["powershell", "-Command", "Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, OsBuildNumber | ConvertTo-Json"],
            text=True, stderr=subprocess.DEVNULL
        )
        os_info = json.loads(os_info)

        # Get installed hotfixes
        hotfixes = subprocess.check_output(
            ["powershell", "-Command", "Get-HotFix | Select-Object -ExpandProperty HotFixID | ConvertTo-Json"],
            text=True, stderr=subprocess.DEVNULL
        )
        hotfixes = json.loads(hotfixes)

        # Get installed software list
        software = subprocess.check_output(
            ["powershell", "-Command", "Get-WmiObject -Class Win32_Product | Select-Object -ExpandProperty Name | ConvertTo-Json"],
            text=True, stderr=subprocess.DEVNULL
        )
        software = json.loads(software)

        return {
            "OS": os_info,
            "Hotfixes": hotfixes if isinstance(hotfixes, list) else [hotfixes],
            "Installed Software": software if isinstance(software, list) else [software],
        }

    except Exception as e:
        print(f"[!] Failed to collect system details: {e}")
        return {}


# ============================================================
# FAST SCAN (Option 1)
# ============================================================
def quick_scan(target_ip):
    print(f"\n[*] Running FAST Scan against {target_ip}...")
    
    is_local = target_ip in ["127.0.0.1", "localhost", "::1"]
    merged_info = {}

    if is_local:
        sys_scan = SystemScanner().scan()
        win_details = collect_windows_details()
        merged_info = {**sys_scan, **win_details}
    else:
        print("[*] Remote target. Skipping local WMI queries.")
        merged_info = {"OS": {"WindowsProductName": "Remote System"}}

    target_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3306, 3389, 8080]
    print(f"[*] Scanning top {len(target_ports)} ports...")
    net_scan = NetworkScanner(target=target_ip, ports=target_ports).scan()

    print(f"[*] Fetching CVEs (Fast Mode: 5 components, max 5 results each)...")
    vscanner = VulnerabilityScanner()
    vuln_data = vscanner.fetch_cves(target=target_ip, system_info=merged_info, max_keywords=5, results_per_keyword=5)


# ============================================================
# DEEP SCAN (Option 2) — System-Aware CVE + CVSS Lookup
# ============================================================
def advanced_scan(target_ip):
    print(f"\n[*] Running DEEP Scan against {target_ip}...")

    is_local = target_ip in ["127.0.0.1", "localhost", "::1"]
    merged_info = {}

    if is_local:
        sys_scan = SystemScanner().scan()
        win_details = collect_windows_details()
        merged_info = {**sys_scan, **win_details}
        print("[*] System details and local software collected.")
    else:
        print("[*] Remote target. Skipping local WMI queries.")
        sys_scan = {"Basic Information": {"os": "Unknown Remote", "ip_address": target_ip}}
        win_details = {}
        merged_info = {"OS": {"WindowsProductName": "Remote System"}}

    # Top ~80 ports for DEEP scan
    target_ports = [
        20, 21, 22, 23, 25, 53, 67, 68, 69, 80, 110, 111, 123, 135, 137, 138, 139, 143, 161, 162, 
        389, 443, 445, 465, 500, 514, 515, 587, 631, 636, 873, 993, 995, 1080, 1099, 1194, 1433, 
        1434, 1521, 1723, 1883, 2049, 2181, 3128, 3306, 3389, 3690, 4333, 4848, 5000, 5432, 5900, 
        5984, 5985, 5986, 6379, 7001, 8000, 8080, 8081, 8443, 8500, 8888, 9000, 9042, 9092, 9200, 
        9300, 10000, 11211, 27017, 27018, 50000 
    ]
    
    print(f"[*] Scanning comprehensive {len(target_ports)} ports...")
    net_scan = NetworkScanner(target=target_ip, ports=target_ports).scan()

    print(f"[*] Exhaustive CVE Lookup (Deep Mode: 15 components, max 15 results each)...")
    vscanner = VulnerabilityScanner()
    
    MAX_RUNTIME = 300  # 5 minutes
    start_time = time.time()

    vuln_data = []
    try:
        vuln_data = vscanner.fetch_cves(target=target_ip, system_info=merged_info, max_keywords=15, results_per_keyword=15)
    except Exception as e:
        print(f"[!] CVE fetch failed: {e}")

    if (time.time() - start_time) >= MAX_RUNTIME:
        print("[!] Time limit reached — partial CVE data collected.")

    # ============================================================
    # Normalize & Assign Severity from CVSS
    # ============================================================
    def severity_from_score(score):
        try:
            s = float(score)
            if s >= 9.0:
                return "Critical"
            elif s >= 7.0:
                return "High"
            elif s >= 4.0:
                return "Medium"
            elif s > 0.0:
                return "Low"
            return "Informational"
        except Exception:
            return "Unknown"

    seen = set()
    unique = []
    for item in vuln_data:
        cid = item.get("id", "unknown")
        if cid not in seen:
            seen.add(cid)
            if item.get("severity") in ("Unknown", "N/A"):
                item["severity"] = severity_from_score(item.get("cvss_score"))
            unique.append(item)

    vuln_data = sorted(unique, key=lambda x: str(x.get("severity")).lower())

    # ============================================================
    # Executive Summary
    # ============================================================
    counts = Counter([v.get("severity", "Unknown") for v in vuln_data])
    summary = {
        "Total CVEs Found": len(vuln_data),
        "Critical": counts.get("Critical", 0),
        "High": counts.get("High", 0),
        "Medium": counts.get("Medium", 0),
        "Low": counts.get("Low", 0),
        "Informational": counts.get("Informational", 0),
        "Unknown": counts.get("Unknown", 0),
    }

    # ============================================================
    # PDF Report Generation
    # ============================================================
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    report_name = f"advanced_vulnerability_report_{timestamp}.pdf"

    adv_report = AdvancedScanReportGenerator(report_name)
    adv_report.add_section("Executive Summary", summary)
    adv_report.add_section("System Information", sys_scan.get("Basic Information"))
    adv_report.add_section("Windows Details", win_details)
    adv_report.add_section("Network Scan - TCP", net_scan.get("open_tcp_ports"))
    adv_report.add_cve_section("CVE & CVSS Vulnerability Data", vuln_data)

    try:
        image_path = build_network_map()
        adv_report.add_image(image_path, "Discovered Network Topology")
    except Exception as e:
        print(f"[!] Network map generation failed: {e}")

    adv_report.build()
    print(f"[+] Advanced Scan completed. Report saved as {report_name}")


# ============================================================
# MAIN MENU
# ============================================================
if __name__ == "__main__":
    print("=" * 60)
    print("     CYBERSEC VULNERABILITY ANALYZER")
    print("=" * 60)
    
    target = input("Enter target IP / Hostname (default: 127.0.0.1): ").strip()
    if not target:
        target = "127.0.0.1"
        
    print("Choose an option:")
    print("1. FAST Scan (15 ports, max 5 system components)")
    print("2. DEEP Scan (84 ports, robust exhaustive CVE/CVSS lookup)")
    print("=" * 60)

    choice = input("Enter choice [1/2]: ").strip()

    if choice == "1":
        quick_scan(target)
    elif choice == "2":
        advanced_scan(target)
    else:
        print("Invalid choice! Exiting...")
