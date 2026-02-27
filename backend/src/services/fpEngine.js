const { memoryStore, saveStore } = require('../store/memoryStore');

const analyzeFinding = (finding) => {
    let score = 0;

    // Signal 1: Version confidence
    if (finding.versionMatch === 'exact') score += 0;
    else if (finding.versionMatch === 'partial') score += 15;
    else if (finding.versionMatch === 'banner') score += 25;

    // Signal 2: Port actually open?
    if (!finding.portConfirmed) score += 20;

    // Signal 3, 4, 5, 6 mocks
    if (Math.random() > 0.5) score += 15; // Random missing OS match
    if (Math.random() > 0.8) score += 10; // Random KB match

    // Signal 7: Local exploitability
    if (finding.attackVector === 'LOCAL') score += 5;

    let decision = 'confirmed_true_positive';
    if (score >= 70) decision = 'false_positive';
    else if (score >= 31) decision = 'needs_review';

    return { score, decision, confidence: `${Math.min(100, score)}%` };
};

const batchAnalyze = (findings) => {
    findings.forEach(finding => {
        const analysis = analyzeFinding(finding);
        memoryStore.fpDecisions[finding.cveId] = {
            decision: analysis.decision,
            analyst: 'system',
            timestamp: Date.now(),
            reason: `Auto-scored by FP Engine. Confidence: ${analysis.confidence}`,
            signals: analysis
        };
        // Attach FP context back to vuln
        finding.fpAnalysis = analysis;
    });
    saveStore();
};

module.exports = { analyzeFinding, batchAnalyze };
