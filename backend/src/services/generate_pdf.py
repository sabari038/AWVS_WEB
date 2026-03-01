import sys
import json
import os

# Add Vulnerabilty_Scanner to path
scanner_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'scanner_core'))
sys.path.append(os.path.join(scanner_dir, 'reports'))

try:
    from advanced_scan_report_generator import AdvancedScanReportGenerator
except ImportError as e:
    print(f"Error importing AdvancedScanReportGenerator: {e}")
    sys.exit(1)

def generate(db_path, output_pdf_name):
    if not os.path.exists(db_path):
        print("db.json not found!")
        sys.exit(1)
        
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    rg = AdvancedScanReportGenerator(filename=output_pdf_name)
    
    # 1. Executive Summary
    total_vulns = len(db.get("vulnerabilities", {}))
    critical = high = medium = low = info = 0
    vulns_raw = list(db.get("vulnerabilities", {}).values())
    
    for v in vulns_raw:
        sev = str(v.get("severity", "")).upper()
        if sev == "CRITICAL": critical += 1
        elif sev == "HIGH": high += 1
        elif sev == "MEDIUM": medium += 1
        elif sev == "LOW": low += 1
        else: info += 1
        
    rg.add_section("Executive Summary", {
        "Total Assets Monitored": len(db.get("assets", {})), 
        "Total Vulnerabilities": total_vulns,
        "Critical": critical,
        "High": high,
        "Medium": medium,
        "Low": low,
        "Informational": info
    })
    
    # 2. Asset Information
    assets = list(db.get("assets", {}).values())
    if assets:
        # Just grab the first/main asset for the report context
        main_asset = assets[0]
        rg.add_section("Scanned Target Information", {
            "IP Address": main_asset.get("ip", "Unknown"),
            "Operating System": main_asset.get("os", "Unknown"),
            "Calculated Risk Score": f"{main_asset.get('riskScore', 0)} / 100",
            "Open Ports": ", ".join(map(str, main_asset.get("ports", []))) if main_asset.get("ports") else "None detected"
        })
    
    # 3. Vulnerability Details
    vulns = []
    for v in vulns_raw:
        vulns.append({
            "id": v.get("cveId", "N/A"),
            "severity": v.get("severity", "Unknown").capitalize(),
            "cvss_score": v.get("cvss", "N/A"),
            "description": v.get("title", "No description available.")
        })
    
    rg.add_cve_section("Comprehensive Vulnerability Details", vulns)
    
    try:
        rg.build()
        print("PDF generated successfully.")
    except Exception as e:
        print(f"Failed to build PDF: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: py generate_pdf.py <db_path> <output_pdf>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
