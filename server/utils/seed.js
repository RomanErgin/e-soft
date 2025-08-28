const bcrypt = require('bcrypt');
const { sequelize, User, Task } = require('../models');

async function seed() {
  await sequelize.sync({ force: true });

  const passwordHash = await bcrypt.hash('password123', 10);
  const manager = await User.create({
    firstName: 'Ivan',
    lastName: 'Ivanov',
    login: 'manager',
    passwordHash,
    role: 'manager',
  });
  const emp1 = await User.create({
    firstName: 'Petr',
    lastName: 'Petrov',
    login: 'petr',
    passwordHash,
    role: 'employee',
    managerId: manager.id,
  });
  const emp2 = await User.create({
    firstName: 'Sidr',
    lastName: 'Sidorov',
    login: 'sidr',
    passwordHash,
    role: 'employee',
    managerId: manager.id,
  });

  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;
  await Task.bulkCreate([
    {
      title: 'Сегодняшняя задача',
      description: 'описание',
      dueDate: new Date(now.getTime()),
      priority: 'high',
      status: 'todo',
      creatorId: manager.id,
      assigneeId: emp1.id,
    },
    {
      title: 'На неделю',
      description: 'описание',
      dueDate: new Date(now.getTime() + 3 * oneDay),
      priority: 'medium',
      status: 'in_progress',
      creatorId: manager.id,
      assigneeId: emp2.id,
    },
    {
      title: 'Будущее',
      description: 'описание',
      dueDate: new Date(now.getTime() + 10 * oneDay),
      priority: 'low',
      status: 'todo',
      creatorId: manager.id,
      assigneeId: emp2.id,
    },
  ]);

  console.log('Seeded');
}

if (require.main === module) {
  seed().then(() => process.exit(0));
}

module.exports = seed;
