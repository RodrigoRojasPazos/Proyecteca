import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const ProyectoAlumno = sequelize.define('ProyectoAlumno', {
  id_proyecto: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'proyectos',
      key: 'id_proyecto'
    }
  },
  id_alumno: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  }
}, {
  tableName: 'proyectos_alumnos',
  timestamps: false
});

export default ProyectoAlumno;