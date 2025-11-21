const express = require('express');
const router = express.Router();
const { getIncomingMaterialInspectionPlans, createIncomingMaterialInspectionPlan } = require('../controllers/incoming-material-inspection-plan.controller');

router.get('/', getIncomingMaterialInspectionPlans);
router.post('/', createIncomingMaterialInspectionPlan);

module.exports = router;

