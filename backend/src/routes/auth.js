const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../lib/prisma');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../utils/validation');

const router = express.Router();

function signToken(userId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET is not configured on the server');
    err.status = 503;
    throw err;
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

router.post(
  '/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty().isLength({ max: 100 }),
  ],
  validate,
  async (req, res) => {
    const { email, password, name } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashed,
        name,
        settings: { create: {} },
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    try {
      const token = signToken(user.id);
      res.status(201).json({ user, token });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Server configuration error' });
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    try {
      const token = signToken(user.id);
      res.json({
        user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt },
        token,
      });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message || 'Server configuration error' });
    }
  }
);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
