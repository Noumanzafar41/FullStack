const express = require('express');
const router = express.Router();
const { getProductInspections, createProductInspection } = require('../controllers/product-inspection.controller');

router.get('/', getProductInspections);
router.post('/', createProductInspection);

module.exports = router;

