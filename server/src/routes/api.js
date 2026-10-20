const express = require('express');
const router = express.Router();
const predictController = require('../controllers/predictController');

router.post('/predict', predictController.predict);
router.get('/stats', predictController.getStats);
router.get('/samples', predictController.getSamples);
router.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

module.exports = router;
