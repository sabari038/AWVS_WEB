const parseTopology = (assets) => {
    const nodes = Object.values(assets).map(a => ({ id: a.ip, val: a.riskScore, name: a.os }));
    return { nodes, edges: [] };
};

module.exports = { parseTopology };
