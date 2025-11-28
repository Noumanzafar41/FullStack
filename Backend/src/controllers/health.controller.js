// src/controllers/health.controller.js
import { getConnection } from '../database.js';
import asyncHandler from '../utils/asyncHandler.js';

export const getHealth = asyncHandler(async (_req, res) => {
  try {
    const conn = await getConnection();
    // Simple lightweight query to test connection
    await new Promise((resolve, reject) => {
      conn.exec('SELECT 1 FROM DUMMY', (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.json({ status: 'ok', message: 'Database connection successful.' });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed.',
      error: error.message
    });
  }
});
