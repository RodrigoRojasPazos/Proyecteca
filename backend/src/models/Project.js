import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Project = sequelize.define('Project', {
  id_proyecto: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  titulo: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  asignatura: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  cuatrimestre_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'cuatrimestres',
      key: 'id_cuatri'
    }
  },
  tipo: {
    type: DataTypes.ENUM('estancia', 'estadía'),
    allowNull: true
  },
  origen: {
    type: DataTypes.ENUM('inicial', 'mejora'),
    allowNull: true
  },
  periodo: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  url_repositorio: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  tecnologias: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of technologies used in the project'
  },
  base_datos: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of databases used in the project'
  },
  estatus: {
    type: DataTypes.ENUM('borrador', 'en_revision', 'aprobado', 'rechazado'),
    defaultValue: 'borrador'
  },
  profesor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'usuarios',
      key: 'id_usuario'
    }
  },
  creado_en: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  programa: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Programa académico del proyecto'
  },
  autor: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nombre del autor principal'
  },
  asesor: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nombre del asesor'
  },
  fecha_defensa: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de defensa del proyecto'
  },
  archivo: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Nombre del archivo subido'
  },
  alumnos_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información de los alumnos participantes'
  },
  estado: {
    type: DataTypes.ENUM('pendiente', 'en-revision', 'aceptado', 'rechazado'),
    defaultValue: 'pendiente',
    comment: 'Estado de revisión del proyecto'
  },
  motivo_rechazo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Motivo del rechazo del proyecto'
  },
  comentarios: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentarios adicionales sobre el proyecto'
  }
}, {
  tableName: 'proyectos',
  timestamps: false
});

export default Project;