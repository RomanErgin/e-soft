const { Router } = require('express');
const { User } = require('../models');
const auth = require('../middleware/auth');

const router = Router();

// Get current user's subordinates
router.get('/subordinates', auth, async (req, res) => {
  const subs = await User.findAll({
    where: { managerId: req.user.id },
    attributes: ['id', 'firstName', 'lastName'],
  });
  res.json(subs);
});

module.exports = router;
