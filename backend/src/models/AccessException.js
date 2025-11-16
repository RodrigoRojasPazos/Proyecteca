import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Lista blanca de correos permitidos como excepción manual
const AccessException = sequelize.define('AccessException', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true, validate: { isEmail: true } },
  note: { type: DataTypes.STRING(255), allowNull: true }
}, {
  tableName: 'access_exceptions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AccessException;