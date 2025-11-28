/**
 * Wraps an async route handler and catches any errors.
 * Sends a 500 response if an unhandled error occurs.
 */
const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    console.error('[API] Unhandled error:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};

export default asyncHandler;
