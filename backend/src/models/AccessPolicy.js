import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

// Tabla de política de acceso para alumnos
// Permite definir el año mínimo y excepciones de generaciones específicas
const AccessPolicy = sequelize.define('AccessPolicy', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  minAlumnoYear: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2020
  },
  // Almacena arreglo de años permitidos adicionalmente (excepciones)
  extraAllowedYears: {
    type: DataTypes.TEXT, // Guardaremos JSON.stringify([...])
    allowNull: true,
    get() {
      const raw = this.getDataValue('extraAllowedYears');
      if (!raw) return [];
      try { return JSON.parse(raw); } catch { return []; }
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('extraAllowedYears', JSON.stringify(value));
      } else if (typeof value === 'string') {
        // Admitir cadena separada por comas
        const arr = value.split(',').map(v => parseInt(v.trim(), 10)).filter(n => !isNaN(n));
        this.setDataValue('extraAllowedYears', JSON.stringify(arr));
      } else {
        this.setDataValue('extraAllowedYears', JSON.stringify([]));
      }
    }
  }
}, {
  tableName: 'access_policy',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AccessPolicy;