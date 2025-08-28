const { Router } = require('express');
const { Op } = require('sequelize');
const { body, param, validationResult } = require('express-validator');
const { Task, User } = require('../models');
const auth = require('../middleware/auth');

const router = Router();

function isManagerOf(managerId, user) {
  return user.managerId === managerId;
}

async function canAssign(creator, assigneeId) {
  if (creator.id === assigneeId) return true;
  const subordinate = await User.findOne({ where: { id: assigneeId, managerId: creator.id } });
  return Boolean(subordinate);
}

router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const mode = req.query.mode || 'all';

  const where = {};
  if (mode === 'my') {
    where.assigneeId = userId;
  } else if (mode === 'managed') {
    // tasks of my subordinates
    const subs = await User.findAll({ where: { managerId: userId }, attributes: ['id'] });
    where.assigneeId = { [Op.in]: subs.map((s) => s.id) };
  }

  const tasks = await Task.findAll({
    where,
    include: [
      { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
      { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
    ],
    order: [['updatedAt', 'DESC']],
  });
  res.json(tasks);
});

router.post(
  '/',
  auth,
  body('title').isString().notEmpty(),
  body('dueDate').isISO8601().toDate(),
  body('priority').isIn(['high', 'medium', 'low']).optional(),
  body('status').isIn(['todo', 'in_progress', 'done', 'cancelled']).optional(),
  body('assigneeId').isString().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const creator = await User.findByPk(req.user.id);
    const { title, description, dueDate, priority, status, assigneeId } = req.body;
    const okAssign = await canAssign(creator, assigneeId);
    if (!okAssign)
      return res.status(400).json({ message: 'Нельзя назначить не своему подчиненному' });
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      status,
      creatorId: creator.id,
      assigneeId,
    });
    
    // Возвращаем задачу с полной информацией о связях
    const taskWithRelations = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
      ],
    });
    
    res.status(201).json(taskWithRelations);
  }
);

router.put(
  '/:id',
  auth,
  param('id').isString().notEmpty(),
  body('title').optional().isString().notEmpty(),
  body('dueDate').optional().isISO8601().toDate(),
  body('priority').optional().isIn(['high', 'medium', 'low']),
  body('status').optional().isIn(['todo', 'in_progress', 'done', 'cancelled']),
  body('assigneeId').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Determine permissions
    const creatorUser = await User.findByPk(task.creatorId);
    const isCreator = task.creatorId === req.user.id;
    const isManagerOfCreator = creatorUser && creatorUser.managerId === req.user.id;

    if (!isCreator && !isManagerOfCreator) {
      // Не создатель и не руководитель создателя → запрещаем изменения (включая статус)
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Полное редактирование для создателя или его руководителя
    if (req.body.assigneeId) {
      const actor = await User.findByPk(req.user.id);
      const okAssign = await canAssign(actor, req.body.assigneeId);
      if (!okAssign)
        return res.status(400).json({ message: 'Нельзя назначить не своему подчиненному' });
    }
    await task.update(req.body);
    
    // Возвращаем обновленную задачу с полной информацией о связях
    const updatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
        { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName', 'managerId'] },
      ],
    });
    
    res.json(updatedTask);
  }
);

router.delete('/:id', auth, async (req, res) => {
  const task = await Task.findByPk(req.params.id);
  if (!task) return res.status(404).json({ message: 'Task not found' });
  if (task.creatorId !== req.user.id) {
    // allow manager of creator to delete
    const creator = await User.findByPk(task.creatorId);
    const isManagerOfCreator = creator && creator.managerId === req.user.id;
    if (!isManagerOfCreator) return res.status(403).json({ message: 'Forbidden' });
  }
  await task.destroy();
  res.json({ ok: true });
});

module.exports = router;
