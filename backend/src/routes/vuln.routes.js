const express = require('express');
const router = express.Router();
const { memoryStore } = require('../store/memoryStore');

// Simple stub for vuln.routes
router.get('/', (req, res) => {
    res.json({ vulnerabilities: Object.values(memoryStore.vulnerabilities) });
});

module.exports = router;
