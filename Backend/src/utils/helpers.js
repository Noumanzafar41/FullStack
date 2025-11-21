const toDecimal = (value) => {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const toBool = (value) => Boolean(value);

const parseDetails = (value) => {
  try {
    return JSON.parse(value || '[]');
  } catch (_error) {
    return [];
  }
};

module.exports = {
  toDecimal,
  toBool,
  parseDetails
};

