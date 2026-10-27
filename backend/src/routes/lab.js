const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { auth } = require('../middleware/auth');

// POST /api/lab/start-lab
router.post('/start-lab', auth, labController.startLab);

// POST /api/lab/stop-lab
router.post('/stop-lab', auth, labController.stopLab);

router.post('/submit-flag', auth, labController.submitFlag);


module.exports = router;
