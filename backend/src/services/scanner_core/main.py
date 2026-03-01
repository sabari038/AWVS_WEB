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
# QUICK SCAN
# ============================================================
def quick_scan():
    print("[*] Running Quick Scan...")
    sys_scan = SystemScanner().scan()
    net_scan = NetworkScanner(target="127.0.0.1").scan()

    report = ReportGenerator("vulnerability_report.pdf")
    report.add_section("System Information", sys_scan.get("Basic Information"))
    report.add_section("CPU", sys_scan.get("CPU"))
    report.add_section("Memory", sys_scan.get("Memory"))
    report.add_section("Disk", sys_scan.get("Disk"))
    report.add_section("Running Processes", sys_scan.get("Running Processes"))
    report.add_section("Installed Hotfixes", sys_scan.get("Installed Hotfixes"))
    report.add_section(".NET Versions", sys_scan.get(".NET Versions"))
    report.add_section("Antivirus", sys_scan.get("Antivirus"))
    report.add_section("Firewall Status", sys_scan.get("Firewall Status"))
    report.add_section("Users and Groups", sys_scan.get("Users and Groups"))
    report.add_section("Network Scan - TCP", net_scan.get("open_tcp_ports"))
    report.add_section("TCP Banners", net_scan.get("tcp_banners"))
    report.add_section("UDP Services", net_scan.get("open_udp_services"))
    report.add_section("ARP Table", net_scan.get("arp_table"))
    report.add_section("DNS Cache", net_scan.get("dns_cache"))
    report.add_section("Network Interfaces", net_scan.get("network_interfaces"))
    report.add_section("Network Shares", net_scan.get("network_shares"))
    report.add_section("RPC Endpoints", net_scan.get("rpc_endpoints"))

    try:
        image_path = build_network_map()
        report.add_image(image_path, "Discovered Network Topology")
    except Exception as e:
        print(f"[!] Network map generation failed: {e}")

    report.build()
    print("[+] Quick Scan completed. Report saved as vulnerability_report.pdf")


# ============================================================
# ADVANCED SCAN — System-Aware CVE + CVSS Lookup
# ============================================================
def advanced_scan():
    print("\n[*] Running Advanced Scan (System-aware CVE/CVSS lookup)...")

    sys_scan = SystemScanner().scan()
    net_scan = NetworkScanner(target="127.0.0.1").scan()
    win_details = collect_windows_details()

    # Merge all data
    merged_info = {**sys_scan, **win_details}

    print("[*] Preparing targeted CVE lookup using your actual system details...")
    vscanner = VulnerabilityScanner()

    MAX_RUNTIME = 120  # 2 minutes
    start_time = time.time()

    def time_exceeded():
        return (time.time() - start_time) >= MAX_RUNTIME

    # Prepare keywords from system data
    keywords = []
    try:
        os_name = merged_info.get("OS", {}).get("WindowsProductName", "")
        version = merged_info.get("OS", {}).get("WindowsVersion", "")
        build = merged_info.get("OS", {}).get("OsBuildNumber", "")
        software_list = merged_info.get("Installed Software", [])

        # Collect top keywords
        keywords.append(os_name)
        keywords.append(f"Windows {version}")
        keywords.append(f"Build {build}")

        if isinstance(software_list, list):
            keywords.extend(software_list[:5])  # Limit to 5 software for focused lookup

        # Remove blanks and duplicates
        keywords = [k for k in keywords if k and k not in ("N/A", "Unknown")]
        keywords = list(dict.fromkeys(keywords))

    except Exception as e:
        print(f"[!] Failed to prepare keywords: {e}")

    print(f"[*] Searching CVEs for keywords: {keywords[:8]}")

    vuln_data = []
    try:
        vuln_data = vscanner.fetch_cves(system_info=merged_info, max_keywords=8, results_per_keyword=8)
    except Exception as e:
        print(f"[!] CVE fetch failed: {e}")

    if time_exceeded():
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
    print("Choose an option:")
    print("1. Quick Scan  (System + Network)")
    print("2. Advanced Scan (System-aware CVE/CVSS lookup, 2-min limit)")
    print("=" * 60)

    choice = input("Enter choice [1/2]: ").strip()

    if choice == "1":
        quick_scan()
    elif choice == "2":
        advanced_scan()
    else:
        print("Invalid choice! Exiting...")
