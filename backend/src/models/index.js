import User from './User.js';
import Project from './Project.js';
import Cuatrimestre from './Cuatrimestre.js';
import Archivo from './Archivo.js';
import Lenguaje from './Lenguaje.js';
import ProyectoAlumno from './ProyectoAlumno.js';
import ProyectoLenguaje from './ProyectoLenguaje.js';
import AccessPolicy from './AccessPolicy.js';
import AccessException from './AccessException.js';

// Definir asociaciones

// Usuario (Profesor) - Proyectos
User.hasMany(Project, {
  foreignKey: 'profesor_id',
  as: 'proyectosProfesor'
});

Project.belongsTo(User, {
  foreignKey: 'profesor_id',
  as: 'profesor'
});

// Cuatrimestre - Proyectos
Cuatrimestre.hasMany(Project, {
  foreignKey: 'cuatrimestre_id',
  as: 'proyectos'
});

Project.belongsTo(Cuatrimestre, {
  foreignKey: 'cuatrimestre_id',
  as: 'cuatrimestre'
});

// Proyecto - Archivos
Project.hasMany(Archivo, {
  foreignKey: 'id_proyecto',
  as: 'archivos'
});

Archivo.belongsTo(Project, {
  foreignKey: 'id_proyecto',
  as: 'proyecto'
});

// Relaciones many-to-many

// Proyectos - Alumnos (many-to-many)
User.belongsToMany(Project, {
  through: ProyectoAlumno,
  foreignKey: 'id_alumno',
  otherKey: 'id_proyecto',
  as: 'proyectosAlumno'
});

Project.belongsToMany(User, {
  through: ProyectoAlumno,
  foreignKey: 'id_proyecto',
  otherKey: 'id_alumno',
  as: 'alumnos'
});

// Proyectos - Lenguajes (many-to-many)
Project.belongsToMany(Lenguaje, {
  through: ProyectoLenguaje,
  foreignKey: 'id_proyecto',
  otherKey: 'id_lenguaje',
  as: 'lenguajes'
});

Lenguaje.belongsToMany(Project, {
  through: ProyectoLenguaje,
  foreignKey: 'id_lenguaje',
  otherKey: 'id_proyecto',
  as: 'proyectos'
});

export { 
  User, 
  Project, 
  Cuatrimestre, 
  Archivo, 
  Lenguaje, 
  ProyectoAlumno, 
  ProyectoLenguaje,
  AccessPolicy,
  AccessException
};