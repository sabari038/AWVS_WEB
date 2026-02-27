const express = require('express');
const router = express.Router();
const fpController = require('../controllers/fpController');

router.get('/', fpController.getAllFpDecisions);
router.get('/stats', fpController.getStats);
router.get('/:cveId', fpController.getFpDetails);
router.post('/:cveId/decide', fpController.submitDecision);
router.post('/:cveId/override', fpController.overrideDecision);

module.exports = router;
