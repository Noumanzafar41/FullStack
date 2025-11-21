const express = require('express');
const router = express.Router();
const { getIncomingMaterialInspections, createIncomingMaterialInspection } = require('../controllers/incoming-material-inspection.controller');

router.get('/', getIncomingMaterialInspections);
router.post('/', createIncomingMaterialInspection);

module.exports = router;

