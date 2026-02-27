const computeAssetRisk = (asset, vulns) => {
    // Simple risk formula for now
    return Math.min(100, vulns.reduce((sum, v) => sum + (v.cvss * 2), 0));
};

module.exports = { computeAssetRisk };
