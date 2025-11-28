/**
 * Converts a value to a decimal number.
 * Returns 0 if the value is null, undefined, empty string, or not a valid number.
 */
export const toDecimal = (value) => {
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

/**
 * Converts a value to a boolean.
 * Accepts true, false, 1, 0, 'true', 'false', '1', '0'.
 */
export const toBool = (value) => {
  if (typeof value === 'string') {
    return ['true', '1'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

/**
 * Parses a JSON string into an array.
 * Returns empty array if parsing fails.
 */
export const parseDetails = (value) => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (_error) {
    return [];
  }
};
