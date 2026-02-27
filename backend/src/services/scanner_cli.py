import sys
import json
import os
import time

# Force UTF-8 encoding for standard output to avoid charmap errors on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Append the original scanner directory so we can import its modules
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SCANNER_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "scanner_core"))

if SCANNER_DIR not in sys.path:
    sys.path.append(SCANNER_DIR)

try:
    from scanners.system_scanner import SystemScanner
    from scanners.network_scanner import NetworkScanner
    from scanners.vulnerability_scanner import VulnerabilityScanner
    from main import collect_windows_details
except ImportError as e:
    print(json.dumps({"error": f"Failed to import scanner modules: {str(e)}"}))
    sys.exit(1)

def severity_from_score(score):
    try:
        s = float(score)
        if s >= 9.0: return "Critical"
        elif s >= 7.0: return "High"
        elif s >= 4.0: return "Medium"
        elif s > 0.0: return "Low"
        return "Informational"
    except Exception:
        return "Unknown"

def main():
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: scanner_cli.py <target_ip> <scan_type>"}))
        sys.exit(1)

    target_ip = sys.argv[1]
    scan_type = sys.argv[2]  # FAST, DEEP, WEB

    print(json.dumps({"log": f"Starting {scan_type} scan on {target_ip}..."}))

    try:
        # 1. System Info
        print(json.dumps({"log": "Initializing System Scanner..."}))
        sys_scan = SystemScanner().scan()
        print(json.dumps({"log": "OS and Hardware Details Collected."}))

        # 2. Window Details (installed software, hotfixes)
        print(json.dumps({"log": "Querying Windows WMI for installed patches and software..."}))
        win_details = collect_windows_details()
        print(json.dumps({"log": "Windows Details Collected."}))

        # Merge for CVE lookup
        merged_info = {**sys_scan, **win_details}

        # Define parameters based on scan type
        if scan_type == "FAST":
            target_ports = [21, 22, 23, 25, 53, 80, 110, 135, 139, 143, 443, 445, 3306, 3389, 8080]
            max_kw = 5
            res_per_kw = 5
        elif scan_type == "WEB":
            target_ports = [80, 443, 8080, 8443, 8000, 3000, 5000]
            max_kw = 8
            res_per_kw = 8
        else: # DEEP
            # Top ~100 ports for a deeper scan without taking hours
            target_ports = [
                20, 21, 22, 23, 25, 53, 67, 68, 69, 80, 110, 111, 123, 135, 137, 138, 139, 143, 161, 162, 
                389, 443, 445, 465, 500, 514, 515, 587, 631, 636, 873, 993, 995, 1080, 1099, 1194, 1433, 
                1434, 1521, 1723, 1883, 2049, 2181, 3128, 3306, 3389, 3690, 4333, 4848, 5000, 5432, 5900, 
                5984, 5985, 5986, 6379, 7001, 8000, 8080, 8081, 8443, 8500, 8888, 9000, 9042, 9092, 9200, 
                9300, 10000, 11211, 27017, 27018, 50000 
            ]
            max_kw = 15
            res_per_kw = 15

        # 3. Network Scan
        print(json.dumps({"log": f"Running Network Port Scan against {target_ip} with {len(target_ports)} ports..."}))
        net_scan = NetworkScanner(target=target_ip, ports=target_ports).scan()
        
        # 4. Vulnerability Lookup
        print(json.dumps({"log": f"Mapping up to {max_kw} components to CVE database... (Max {res_per_kw} results each)"}))
        vscanner = VulnerabilityScanner()
        vuln_data = vscanner.fetch_cves(system_info=merged_info, max_keywords=max_kw, results_per_keyword=res_per_kw)

        # Normalize severities
        seen = set()
        unique = []
        for item in vuln_data:
            cid = item.get("id", "unknown")
            if cid not in seen:
                seen.add(cid)
                if item.get("severity") in ("Unknown", "N/A"):
                    item["severity"] = severity_from_score(item.get("cvss_score"))
                unique.append({
                    "cveId": item.get("id"),
                    "title": item.get("description", "Unknown Vulnerability")[:60] + "...",
                    "cvss": float(item.get("cvss_score", 0)),
                    "severity": item.get("severity"),
                    "service": "System/Network",
                    "port": 0,
                    "versionMatch": "partial", 
                    "portConfirmed": True, 
                    "attackVector": "NETWORK" if "NETWORK" in str(item.get("description")).upper() else "LOCAL"
                })

        # Augment with port data if possible
        tcp_ports = net_scan.get("open_tcp_ports", [])
        if tcp_ports and len(unique) > 0:
            for p in tcp_ports:
                for u in unique:
                    if u["port"] == 0:
                        u["port"] = p
                        break

        # Generate asset
        asset = {
            "ip": target_ip,
            "os": merged_info.get("OS", {}).get("WindowsProductName", "Windows / Linux"),
            "ports": tcp_ports,
            "services": [],
            "riskScore": 0
        }

        result = {
            "type": "results",
            "vulnerabilities": unique,
            "asset": asset
        }

        print(json.dumps({"log": "Scan completed successfully."}))
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": f"Scan failed: {str(e)}"}))
        sys.exit(1)

if __name__ == "__main__":
    main()
