const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Task = sequelize.define(
    'Task',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      title: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT },
      dueDate: { type: DataTypes.DATE, allowNull: false },
      priority: {
        type: DataTypes.ENUM('high', 'medium', 'low'),
        allowNull: false,
        defaultValue: 'medium',
      },
      status: {
        type: DataTypes.ENUM('todo', 'in_progress', 'done', 'cancelled'),
        allowNull: false,
        defaultValue: 'todo',
      },
      creatorId: { type: DataTypes.UUID, allowNull: false },
      assigneeId: { type: DataTypes.UUID, allowNull: false },
    },
    {
      tableName: 'tasks',
      timestamps: true,
    }
  );

  return Task;
};
