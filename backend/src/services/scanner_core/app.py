from flask import Flask, render_template, request, jsonify, send_file, after_this_request
import os
import threading
import time
from scanners.host_discovery import HostDiscovery
from scanners.network_scanner import NetworkScanner
from scanners.web_scanner import WebScanner
from scanners.audit_scanner import AuditScanner
from scanners.vulnerability_scanner import VulnerabilityScanner
from reports.report_generator import ReportGenerator
from visualizer.network_mapper import build_network_map

import json
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'supersecretkey'

# Store scan results in memory (for immediate PDF download)
SCAN_RESULTS = {}

# Persistence Files
HISTORY_FILE = "history.json"
CONFIG_FILE = "config.json"

def load_json(filename):
    if os.path.exists(filename):
        try:
            with open(filename, 'r') as f:
                return json.load(f)
        except:
            return [] if 'history' in filename else {}
    return [] if 'history' in filename else {}

def save_json(filename, data):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=4)

def add_to_history(scan_type, target, result_count):
    history = load_json(HISTORY_FILE)
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "type": scan_type,
        "target": target,
        "count": result_count
    }
    history.insert(0, entry) # Add to top
    save_json(HISTORY_FILE, history)

# Load Config
APP_CONFIG = load_json(CONFIG_FILE)
if not APP_CONFIG:
    APP_CONFIG = {"default_target": "127.0.0.1", "timeout": 60}

@app.route('/')
def index():
    return render_template('index.html', config=APP_CONFIG)

@app.route('/history')
def history():
    data = load_json(HISTORY_FILE)
    return render_template('history.html', history=data)

@app.route('/settings', methods=['GET', 'POST'])
def settings():
    global APP_CONFIG
    message = None
    if request.method == 'POST':
        APP_CONFIG['default_target'] = request.form.get('default_target')
        APP_CONFIG['timeout'] = request.form.get('timeout')
        APP_CONFIG['nvd_key'] = request.form.get('nvd_key')
        save_json(CONFIG_FILE, APP_CONFIG)
        message = "Settings saved successfully!"
    
    return render_template('settings.html', config=APP_CONFIG, message=message)

@app.route('/scan/host', methods=['POST'])
def scan_host():
    target = request.form.get('target', '192.168.1.0/24')
    scanner = HostDiscovery(target)
    results = scanner.scan()
    SCAN_RESULTS['host'] = results 
    add_to_history('host', target, len(results))
    return jsonify(results)

@app.route('/scan/network', methods=['POST'])
def scan_network():
    target = request.form.get('target', '127.0.0.1')
    scan_type = request.form.get('type', 'quick')
    
    ports = None
    if scan_type == 'full':
        ports = range(1, 1000) # Simplified 'full' for demo speed
    
    scanner = NetworkScanner(target=target, ports=ports)
    results = scanner.scan()
    SCAN_RESULTS['network'] = results
    add_to_history('network', target, len(results.get('open_ports', [])) if isinstance(results, dict) else 0)
    return jsonify(results)

@app.route('/scan/web', methods=['POST'])
def scan_web():
    url = request.form.get('url')
    if not url:
        return jsonify({"error": "URL is required"}), 400
    
    scanner = WebScanner(url)
    results = scanner.scan()
    SCAN_RESULTS['web'] = results
    return jsonify(results)

@app.route('/scan/audit', methods=['POST'])
def scan_audit():
    creds = {
        "username": request.form.get('username'),
        "password": request.form.get('password')
    }
    scanner = AuditScanner(credentials=creds if creds['username'] else None)
    results = scanner.scan()
    SCAN_RESULTS['audit'] = results
    return jsonify(results)

@app.route('/scan/advanced', methods=['POST'])
def scan_advanced():
    target = request.form.get('target', '127.0.0.1')
    
    # 1. Network
    net_scanner = NetworkScanner(target=target)
    net_results = net_scanner.scan()
    
    # 2. Audit
    audit_scanner = AuditScanner()
    audit_results = audit_scanner.scan()
    
    # 3. CVE
    v_scanner = VulnerabilityScanner()
    
    # AuditScanner now returns "os_info" and "software" consistent with main.py logic
    sys_info = {
        "OS": audit_results.get("os_info", {}),
        "Installed Software": audit_results.get("software", []),
        "Hotfixes": audit_results.get("hotfixes", [])
    }
    print(f"DEBUG: Sys Info keys: {sys_info.keys()}")
    cve_results = v_scanner.fetch_cves(system_info=sys_info)
    print(f"DEBUG: Found {len(cve_results)} CVEs")

    full_results = {
        "network": net_results,
        "audit": audit_results,
        "cves": cve_results
    }
    SCAN_RESULTS['advanced'] = full_results
    add_to_history('advanced', target, len(cve_results))
    return jsonify(full_results)

@app.route('/report/<scan_type>')
def download_report(scan_type):
    data = SCAN_RESULTS.get(scan_type)
    if not data:
        return "No scan data found for this type. Please run the scan first.", 404
        
    filename = f"report_{scan_type}_{int(time.time())}.pdf"
    
    # Generate PDF
    report_gen = ReportGenerator(filename)
    
    if scan_type == 'advanced':
        # Special handling for composite data
        report_gen.add_section("Network Scan Results", data.get('network', {}))
        report_gen.add_section("System Audit Results", data.get('audit', {}))
        cve_data = data.get('cves', [])
        report_gen.add_cve_section("Vulnerabilities (CVEs)", cve_data)
        report_gen.add_severity_summary(cve_data)
    else:
        # Generic handling
        title = f"{scan_type.capitalize()} Scan Results"
        report_gen.add_section(title, data)

    # Build PDF
    success = report_gen.build()
    
    if success and os.path.exists(filename):
        @after_this_request
        def remove_file(response):
            try:
                os.remove(filename)
            except Exception as e:
                print(f"Error removing temp file: {e}")
            return response
            
        return send_file(filename, as_attachment=True, download_name=filename)
    else:
        return "Failed to generate PDF report", 500

if __name__ == '__main__':
    print("[*] STARTING ON PORT 8080 (UNIQUE SESSION)")
    app.run(debug=True, host='0.0.0.0', port=8080)
