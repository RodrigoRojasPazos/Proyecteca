# Proyecto Estancias - Sistema de Gestión de Proyectos

## 🚀 Descripción
Sistema web para gestión de proyectos con autenticación Google, roles de usuario y visualización de estadísticas.

## 🏗️ Arquitectura

### Frontend
- **React + TypeScript (TSX)** - Interfaz de usuario moderna
- **React Router** - Navegación entre pantallas
- **Axios** - Cliente HTTP para API
- **TailwindCSS** - Estilos responsivos
- **@react-oauth/google** - Autenticación con Google

### Backend  
- **Express.js + Node.js** - API REST
- **Sequelize ORM** - ORM para MySQL
- **google-auth-library** - Verificación de tokens Google
- **JWT** - Manejo de sesiones y roles
- **Multer** - Upload de archivos
- **dotenv** - Variables de entorno

### Base de Datos
- **MySQL Server** - Base de datos relacional

## 🛠️ Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- MySQL Server (v8.0 o superior)
- npm o yarn
- Cuenta de Google Cloud Console

#### 1. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar backend/.env con tus configuraciones
npm run dev
```

#### 2. Configurar Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Editar frontend/.env con tu GOOGLE_CLIENT_ID
npm run dev
```

## 📁 Estructura del Proyecto
```
Estancias2/
├── frontend/          # React + TypeScript
├── backend/           # Express.js API
└── README.md
```

## 🚦 Scripts Disponibles

### Frontend
- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run lint` - Linter

### Backend
- `npm run dev` - Servidor con nodemon
- `npm start` - Servidor de producción
- `npm run migrate` - Ejecutar migraciones

## 🔐 Configuración OAuth Google
1. Crear proyecto en Google Cloud Console
2. Habilitar Google+ API
3. Configurar pantalla de consentimiento OAuth
4. Crear credenciales OAuth 2.0
5. Agregar CLIENT_ID al .env

## 📊 Funcionalidades
- ✅ Login con Google (cuentas institucionales)
- ✅ Gestión de roles de usuario (admin, teacher, student)
- ✅ CRUD completo de proyectos
- ✅ Upload de archivos con Multer
- ✅ Dashboard con estadísticas
- ✅ API REST con Express.js + Sequelize
- ✅ Autenticación JWT + Google OAuth
- ✅ Middleware de seguridad (Helmet, CORS, Rate Limiting)
- ✅ Base de datos MySQL con relaciones

## 🔧 Variables de Entorno

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=estancias_db
DB_USER=root
DB_PASSWORD=tu_password
JWT_SECRET=tu_jwt_secret_super_seguro
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_client_secret
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=tu_google_client_id
VITE_API_URL=http://localhost:5000/api
```

## 🚀 Despliegue en Producción

### Backend
```bash
npm run build
npm start
```

### Frontend
```bash
npm run build
# Servir archivos estáticos con nginx/apache
```