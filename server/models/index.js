const { Sequelize } = require('sequelize');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL || '';

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, { logging: false })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../data.sqlite'),
      logging: false,
    });

const User = require('./user')(sequelize);
const Task = require('./task')(sequelize);

User.hasMany(User, { as: 'subordinates', foreignKey: 'managerId' });
User.belongsTo(User, { as: 'manager', foreignKey: 'managerId' });

User.hasMany(Task, { as: 'createdTasks', foreignKey: 'creatorId' });
User.hasMany(Task, { as: 'assignedTasks', foreignKey: 'assigneeId' });
Task.belongsTo(User, { as: 'creator', foreignKey: 'creatorId' });
Task.belongsTo(User, { as: 'assignee', foreignKey: 'assigneeId' });

module.exports = { sequelize, User, Task };
