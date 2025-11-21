const bcrypt = require('bcrypt');
const { getPool, sql } = require('../database');
const asyncHandler = require('../utils/asyncHandler');

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar(255), normalizedEmail)
    .query('SELECT TOP (1) Id, Name, Email, PasswordHash FROM dbo.Users WHERE Email = @email');

  if (!result.recordset.length) {
    return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
  }

  const user = result.recordset[0];
  const passwordMatch = await bcrypt.compare(password, user.PasswordHash);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid credentials. Please try again.' });
  }

  return res.json({
    message: 'Login successful.',
    token: Buffer.from(`${user.Email}:${Date.now()}`).toString('base64'),
    profile: { name: user.Name, email: user.Email }
  });
});

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  const normalizedEmail = email.toLowerCase();
  const pool = await getPool();
  const existingUser = await pool
    .request()
    .input('email', sql.NVarChar(255), normalizedEmail)
    .query('SELECT 1 FROM dbo.Users WHERE Email = @email');

  if (existingUser.recordset.length) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await pool
    .request()
    .input('name', sql.NVarChar(150), name.trim())
    .input('email', sql.NVarChar(255), normalizedEmail)
    .input('passwordHash', sql.NVarChar(255), passwordHash)
    .query(
      'INSERT INTO dbo.Users (Name, Email, PasswordHash) VALUES (@name, @email, @passwordHash);'
    );

  return res.status(201).json({ message: 'Account created successfully.' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  const pool = await getPool();
  await pool
    .request()
    .input('email', sql.NVarChar(255), email.toLowerCase())
    .query('SELECT 1 FROM dbo.Users WHERE Email = @email');

  return res.json({
    message: 'If an account exists, password reset instructions were sent.'
  });
});

module.exports = {
  login,
  register,
  forgotPassword
};

