const { memoryStore, saveStore } = require('../store/memoryStore');
const { v4: uuidv4 } = require('uuid');
const scannerService = require('../services/scannerService');

const startScan = async (req, res) => {
    const { name, target, type } = req.body;
    if (!target) return res.status(400).json({ error: 'Target IP/Hostname is required' });

    const scanId = uuidv4();
    memoryStore.scans[scanId] = {
        id: scanId, name, target, type,
        status: 'running', progress: 0,
        startTime: Date.now(), logs: [], rawOutput: {},
        processedVulns: [], riskScore: 0
    };

    saveStore();

    // Launch async
    scannerService.runScan(scanId, target, type);
    res.json({ id: scanId, message: 'Scan started' });
};

const getScanStatus = (req, res) => {
    const { id } = req.params;
    const scan = memoryStore.scans[id];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ status: scan.status, progress: scan.progress, logsCount: scan.logs.length });
};

const getScanLogs = (req, res) => {
    const { id } = req.params;
    const scan = memoryStore.scans[id];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });
    res.json({ logs: scan.logs });
};

const cancelScan = (req, res) => {
    const { id } = req.params;
    const scan = memoryStore.scans[id];
    if (!scan) return res.status(404).json({ error: 'Scan not found' });

    if (scan.status === 'running') {
        scannerService.cancelScan(id);
        scan.status = 'cancelled';
        saveStore();
    }
    res.json({ message: 'Scan cancelled successfully' });
};

const listScans = (req, res) => {
    const list = Object.values(memoryStore.scans).map(s => ({
        id: s.id, name: s.name, target: s.target, status: s.status, progress: s.progress, startTime: s.startTime
    }));
    res.json({ scans: list });
};

module.exports = { startScan, getScanStatus, getScanLogs, cancelScan, listScans };
