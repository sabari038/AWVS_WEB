const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '..', '..', 'data', 'db.json');

// Ensure data directory exists
const dataDir = path.dirname(STORE_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Initial state
let memoryStore = {
    scans: {},
    vulnerabilities: {},
    fpDecisions: {},
    assets: {},
    topology: { nodes: [], edges: [] }
};

// Load from disk if exists
try {
    if (fs.existsSync(STORE_PATH)) {
        const data = fs.readFileSync(STORE_PATH, 'utf-8');
        memoryStore = JSON.parse(data);
        console.log(`[Store] Loaded persistent data from ${STORE_PATH}`);
    } else {
        console.log(`[Store] No existing database found, starting fresh.`);
    }
} catch (e) {
    console.error(`[Store] Failed to load db.json: ${e.message}`);
}

// Helper to save to disk
const saveStore = () => {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(memoryStore, null, 2));
    } catch (e) {
        console.error(`[Store] Failed to save db.json: ${e.message}`);
    }
};

module.exports = {
    memoryStore,
    saveStore
};
