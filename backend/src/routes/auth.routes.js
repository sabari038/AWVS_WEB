const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'vulnscan2024') {
        // Return a dummy token for now
        res.json({ token: 'dummy-jwt-token-uuid-1234', user: { username: 'admin', role: 'admin' } });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

router.get('/me', (req, res) => {
    res.json({ user: { username: 'admin', role: 'admin' } });
});

router.post('/logout', (req, res) => {
    res.json({ success: true });
});

module.exports = router;
