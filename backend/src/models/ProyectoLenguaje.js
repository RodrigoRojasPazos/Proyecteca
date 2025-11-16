import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProyectoLenguaje = sequelize.define('ProyectoLenguaje', {
  id_proyecto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'proyectos',
      key: 'id_proyecto'
    }
  },
  id_lenguaje: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'lenguajes',
      key: 'id_lenguaje'
    }
  },
  porcentaje: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    }
  }
}, {
  tableName: 'proyecto_lenguaje',
  timestamps: false
});

export default ProyectoLenguaje;