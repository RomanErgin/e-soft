const { Router } = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');

const router = Router();
const auth = require('../middleware/auth');

router.post(
  '/register',
  body('login').isString().trim().notEmpty(),
  body('password').isString().isLength({ min: 6 }),
  body('firstName').isString().notEmpty(),
  body('lastName').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { login, password, firstName, lastName, middleName, managerId, role } = req.body;
    const existing = await User.findOne({ where: { login } });
    if (existing) return res.status(400).json({ message: 'Login already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      login,
      passwordHash,
      firstName,
      lastName,
      middleName,
      managerId: managerId || null,
      role: role || 'employee',
    });
    res.json({ id: user.id });
  }
);

router.post(
  '/login',
  body('login').isString().trim().notEmpty(),
  body('password').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { login, password } = req.body;
    const user = await User.findOne({ where: { login } });
    if (!user)
      return res.status(400).json({ message: 'Пользователь с таким логином не существует' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Неверный пароль' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', {
      expiresIn: '12h',
    });
    res.json({
      token,
      user: { id: user.id, firstName: user.firstName, lastName: user.lastName, role: user.role },
    });
  }
);

module.exports = router;
router.get('/me', auth, async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: ['id', 'firstName', 'lastName', 'role', 'managerId'],
  });
  res.json({ user });
});
