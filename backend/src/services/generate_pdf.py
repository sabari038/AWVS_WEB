import sys
import json
import os

# Add Vulnerabilty_Scanner to path
scanner_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), 'scanner_core'))
sys.path.append(os.path.join(scanner_dir, 'reports'))

try:
    from report_generator import ReportGenerator
except ImportError as e:
    print(f"Error importing ReportGenerator: {e}")
    sys.exit(1)

def generate(db_path, output_pdf_name):
    if not os.path.exists(db_path):
        print("db.json not found!")
        sys.exit(1)
        
    with open(db_path, 'r', encoding='utf-8') as f:
        db = json.load(f)
    
    rg = ReportGenerator(filename=output_pdf_name)
    rg.add_section("VulnScan Pro - Dashboard Overview", {
        "Total Assets Monitored": len(db.get("assets", {})), 
        "Total Vulnerabilities": len(db.get("vulnerabilities", {}))
    })
    
    vulns_raw = list(db.get("vulnerabilities", {}).values())
    vulns = []
    for v in vulns_raw:
        vulns.append({
            "id": v.get("cveId", "N/A"),
            "severity": v.get("severity", "Unknown"),
            "cvss_score": v.get("cvss", "N/A"),
            "description": v.get("title", "No description available.")
        })
    
    # Filter out FP suppressed if we wanted to, but let's just show all for the report
    rg.add_severity_summary(vulns)
    rg.add_cve_section("Vulnerability Details", vulns)
    
    success = rg.build()
    if not success:
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: py generate_pdf.py <db_path> <output_pdf>")
        sys.exit(1)
    generate(sys.argv[1], sys.argv[2])
