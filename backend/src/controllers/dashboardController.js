const { memoryStore } = require('../store/memoryStore');

const getDashboardStats = (req, res) => {
    const vulns = Object.values(memoryStore.vulnerabilities);
    const assets = Object.values(memoryStore.assets);
    const fpDecisions = Object.values(memoryStore.fpDecisions);

    const totalAssets = assets.length;
    const totalVulns = vulns.length;
    const critical = vulns.filter(v => v.severity && v.severity.toUpperCase() === 'CRITICAL').length;
    const high = vulns.filter(v => v.severity && v.severity.toUpperCase() === 'HIGH').length;
    const fpSuppressed = fpDecisions.filter(d => d.decision === 'false_positive').length;

    let maxRisk = 0;
    assets.forEach(a => {
        if (a.riskScore && a.riskScore > maxRisk) maxRisk = a.riskScore;
    });

    const recentVulns = vulns.slice(-5).map(v => ({
        cve: v.cveId,
        severity: v.severity,
        cvss: v.cvss,
        asset: '127.0.0.1', // Simplified
        fpConfidence: v.fpAnalysis?.score || 0
    }));

    res.json({
        totalAssets, totalVulns, critical, high, fpSuppressed, riskScore: maxRisk, recentVulns
    });
};

module.exports = { getDashboardStats };
