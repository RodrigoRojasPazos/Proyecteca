import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Cuatrimestre = sequelize.define('Cuatrimestre', {
  id_cuatri: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  nombre: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  fecha_inicio: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  fecha_fin: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  estatus: {
    type: DataTypes.ENUM('activo', 'inactivo'),
    defaultValue: 'inactivo'
  }
}, {
  tableName: 'cuatrimestres',
  timestamps: false
});

export default Cuatrimestre;