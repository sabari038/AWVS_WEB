const express = require('express');
const router = express.Router();
const { memoryStore } = require('../store/memoryStore');

router.get('/', (req, res) => {
    res.json({ topology: memoryStore.topology });
});

module.exports = router;
