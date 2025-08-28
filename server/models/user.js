const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      firstName: { type: DataTypes.STRING, allowNull: false },
      lastName: { type: DataTypes.STRING, allowNull: false },
      middleName: { type: DataTypes.STRING },
      login: { type: DataTypes.STRING, unique: true, allowNull: false },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      managerId: { type: DataTypes.UUID, allowNull: true },
      role: {
        type: DataTypes.ENUM('manager', 'employee'),
        allowNull: false,
        defaultValue: 'employee',
      },
    },
    {
      tableName: 'users',
      indexes: [{ unique: true, fields: ['login'] }],
    }
  );

  return User;
};
