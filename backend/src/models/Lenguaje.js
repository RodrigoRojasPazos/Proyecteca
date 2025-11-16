import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Lenguaje = sequelize.define('Lenguaje', {
  id_lenguaje: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  color: {
    type: DataTypes.STRING(10),
    allowNull: false
  }
}, {
  tableName: 'lenguajes',
  timestamps: false
});

export default Lenguaje;