const asyncHandler = (handler) =>
  async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error('[API] Unhandled error:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };

module.exports = asyncHandler;

