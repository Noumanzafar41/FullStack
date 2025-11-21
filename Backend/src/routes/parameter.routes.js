const express = require('express');
const router = express.Router();
const { getParameters, createParameter } = require('../controllers/parameter.controller');

router.get('/', getParameters);
router.post('/', createParameter);

module.exports = router;

