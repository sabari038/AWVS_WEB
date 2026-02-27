const { memoryStore, saveStore } = require('../store/memoryStore');
const fpEngine = require('./fpEngine');
const riskEngine = require('./riskEngine');
const spawn = require('cross-spawn');
const path = require('path');

const cancelTimeouts = {};

const runScan = (scanId, target, type) => {
    const scan = memoryStore.scans[scanId];
    if (!scan) return;

    const logs = scan.logs;
    scan.progress = 5;

    logs.push(`[${new Date().toISOString()}] Starting REAL ${type} scan on target ${target}...`);

    const scannerScript = path.join(__dirname, 'scanner_cli.py');

    // Spawn Python script
    const child = spawn('python', [scannerScript, target, type]);
    cancelTimeouts[scanId] = child;

    let resultData = null;

    child.stdout.on('data', (data) => {
        const lines = data.toString().split('\n').filter(l => l.trim() !== '');

        for (const line of lines) {
            try {
                const parsed = JSON.parse(line);
                if (parsed.log) {
                    logs.push(`[${new Date().toISOString()}] ${parsed.log}`);
                    if (scan.progress < 90) scan.progress += 5; // increment progress bar
                } else if (parsed.type === 'results') {
                    resultData = parsed;
                } else if (parsed.error) {
                    logs.push(`[${new Date().toISOString()}] ERROR: ${parsed.error}`);
                }
            } catch (e) {
                // If not JSON, just log as raw stdout
                logs.push(`[${new Date().toISOString()}] ${line}`);
            }
        }
    });

    child.stderr.on('data', (data) => {
        logs.push(`[${new Date().toISOString()}] STDERR: ${data.toString()}`);
    });

    child.on('close', (code) => {
        scan.progress = 100;
        if (code === 0) {
            logs.push(`[${new Date().toISOString()}] Scan completed. Processing results...`);
            finishScan(scanId, resultData);
        } else {
            logs.push(`[${new Date().toISOString()}] Scan failed with exit code ${code}.`);
            scan.status = 'failed';
        }
        delete cancelTimeouts[scanId];
    });
};

const cancelScan = (scanId) => {
    if (cancelTimeouts[scanId]) {
        const child = cancelTimeouts[scanId];
        child.kill('SIGKILL');
        delete cancelTimeouts[scanId];
        const scan = memoryStore.scans[scanId];
        if (scan) {
            scan.logs.push(`[${new Date().toISOString()}] Scan cancelled by user.`);
        }
    }
};

const finishScan = (scanId, resultData) => {
    const scan = memoryStore.scans[scanId];
    if (!scan) return;

    scan.status = 'complete';

    let rawVulns = [];
    if (resultData && resultData.vulnerabilities) {
        rawVulns = resultData.vulnerabilities;
    } else {
        scan.logs.push(`[${new Date().toISOString()}] No valid vulnerability data returned from scanner.`);
    }

    rawVulns.forEach(v => {
        // Generate an ID if needed
        if (!v.cveId) v.cveId = 'CVE-UNKNOWN-' + Math.floor(Math.random() * 10000);

        // Prevent strictly overwriting existing ones if they already have fpAnalysis etc
        if (!memoryStore.vulnerabilities[v.cveId]) {
            memoryStore.vulnerabilities[v.cveId] = v;
        } else {
            // Update only specific fields to avoid overwriting user decisions
            memoryStore.vulnerabilities[v.cveId].cvss = v.cvss;
            memoryStore.vulnerabilities[v.cveId].port = v.port;
            memoryStore.vulnerabilities[v.cveId].severity = v.severity;
        }

        scan.processedVulns.push(v.cveId);
    });

    // Run FP Engine & Risk Engine on real findings
    fpEngine.batchAnalyze(rawVulns);

    scan.riskScore = Math.min(100, Math.floor(rawVulns.reduce((sum, v) => sum + v.cvss, 0)));

    // Update assets
    if (resultData && resultData.asset) {
        memoryStore.assets[scan.target] = {
            ...resultData.asset,
            riskScore: scan.riskScore
        };
    } else {
        memoryStore.assets[scan.target] = {
            ip: scan.target,
            os: 'Unknown System',
            ports: [],
            services: [],
            riskScore: scan.riskScore
        };
    }

    saveStore();
};

module.exports = { runScan, cancelScan };
