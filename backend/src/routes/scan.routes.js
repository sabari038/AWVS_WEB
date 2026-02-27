const express = require('express');
const router = express.Router();
const scanController = require('../controllers/scanController');

router.post('/start', scanController.startScan);
router.get('/', scanController.listScans);
router.get('/:id/status', scanController.getScanStatus);
router.get('/:id/logs', scanController.getScanLogs);
router.delete('/:id', scanController.cancelScan);

module.exports = router;
