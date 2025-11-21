const { getPool } = require('../database');
const asyncHandler = require('../utils/asyncHandler');

const getHealth = asyncHandler(async (_req, res) => {
  await getPool();
  res.json({ status: 'ok' });
});

module.exports = {
  getHealth
};

