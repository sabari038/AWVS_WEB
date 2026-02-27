const { memoryStore, saveStore } = require('../store/memoryStore');

const getAllFpDecisions = (req, res) => {
    res.json({ fpDecisions: memoryStore.fpDecisions });
};

const getStats = (req, res) => {
    const decisions = Object.values(memoryStore.fpDecisions);
    const stats = {
        autoFP: decisions.filter(d => d.decision === 'false_positive').length,
        needsReview: decisions.filter(d => d.decision === 'needs_review').length,
        confirmed: decisions.filter(d => d.decision === 'confirmed_true_positive').length,
        overridden: decisions.filter(d => d.decision === 'overridden').length
    };
    res.json({ stats });
};

const getFpDetails = (req, res) => {
    const { cveId } = req.params;
    const details = memoryStore.fpDecisions[cveId];
    if (!details) return res.status(404).json({ error: 'FP Details not found' });
    res.json({ details });
};

const submitDecision = (req, res) => {
    const { cveId } = req.params;
    const { decision, reason } = req.body;
    if (!memoryStore.fpDecisions[cveId]) {
        memoryStore.fpDecisions[cveId] = {};
    }
    memoryStore.fpDecisions[cveId] = {
        ...memoryStore.fpDecisions[cveId],
        decision, reason, analyst: req.user?.username || 'admin', timestamp: Date.now()
    };

    if (memoryStore.vulnerabilities[cveId]) {
        if (!memoryStore.vulnerabilities[cveId].fpAnalysis) {
            memoryStore.vulnerabilities[cveId].fpAnalysis = {};
        }
        memoryStore.vulnerabilities[cveId].fpAnalysis.decision = decision;
        memoryStore.vulnerabilities[cveId].fpAnalysis.reason = reason;
        memoryStore.vulnerabilities[cveId].fpAnalysis.timestamp = Date.now();
    }
    saveStore();
    res.json({ success: true, decision: memoryStore.fpDecisions[cveId] });
};

const overrideDecision = (req, res) => {
    const { cveId } = req.params;
    const { reason } = req.body;

    if (memoryStore.fpDecisions[cveId]) {
        memoryStore.fpDecisions[cveId].decision = 'overridden';
        memoryStore.fpDecisions[cveId].reason = reason;
        memoryStore.fpDecisions[cveId].timestamp = Date.now();

        if (memoryStore.vulnerabilities[cveId]) {
            if (!memoryStore.vulnerabilities[cveId].fpAnalysis) {
                memoryStore.vulnerabilities[cveId].fpAnalysis = {};
            }
            memoryStore.vulnerabilities[cveId].fpAnalysis.decision = 'overridden';
            memoryStore.vulnerabilities[cveId].fpAnalysis.reason = reason;
            memoryStore.vulnerabilities[cveId].fpAnalysis.timestamp = Date.now();
        }
        saveStore();
    }

    res.json({ success: true });
};

module.exports = { getAllFpDecisions, getStats, getFpDetails, submitDecision, overrideDecision };
