import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Archivo = sequelize.define('Archivo', {
  id_archivo: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  id_proyecto: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'proyectos',
      key: 'id_proyecto'
    }
  },
  tipo: {
    type: DataTypes.ENUM('imagen', 'pdf', 'presentacion'),
    allowNull: false
  },
  ruta_archivo: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  subido_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'archivos',
  timestamps: false
});

export default Archivo;