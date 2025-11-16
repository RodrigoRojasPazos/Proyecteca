export interface User {
  id_usuario: number;
  email?: string; // Para compatibilidad
  correo?: string; // Campo principal en BD
  nombre: string;
  rol: 'alumno' | 'profesor' | 'director' | 'asesor';
  matricula?: string;
  creado_en: string;
  avatar?: string;
}

export interface Cuatrimestre {
  id_cuatri: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  estatus: 'activo' | 'inactivo';
}

export interface Lenguaje {
  id_lenguaje: number;
  nombre: string;
  color: string;
}

export interface Project {
  id_proyecto: number;
  titulo: string;
  descripcion?: string;
  asignatura?: string;
  cuatrimestre_id?: number;
  tipo?: 'estancia' | 'estadía';
  origen?: 'inicial' | 'mejora';
  periodo?: string;
  url_repositorio?: string;
  estatus: 'borrador' | 'en_revision' | 'aprobado' | 'rechazado';
  estado?: 'pendiente' | 'en-revision' | 'aceptado' | 'rechazado';
  profesor_id?: number;
  creado_en: string;
  cuatrimestre?: Cuatrimestre;
  profesor?: User;
  alumnos?: User[];
  alumnos_data?: any; // Datos de alumnos que pueden venir como string JSON o array
  lenguajes?: Lenguaje[];
  // Campos adicionales para proyectos subidos
  autor?: string;
  asesor?: string;
  programa?: string;
  fechaDefensa?: string;
  baseDatos?: string | string[];
  tecnologias?: string[];
  archivo?: string | null;
  // Campos para revisión de proyectos
  motivo_rechazo?: string;
  comentarios?: string;
}

export interface Archivo {
  id_archivo: number;
  id_proyecto: number;
  tipo: 'imagen' | 'pdf' | 'presentacion';
  ruta_archivo: string;
  subido_en: string;
}

export interface AuthContextType {
  user: User | null;
  login: (credential: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AccessPolicy {
  id?: number;
  minAlumnoYear: number;
  extraAllowedYears: number[];
}

export interface AccessException {
  id: number;
  email: string;
  note?: string;
}