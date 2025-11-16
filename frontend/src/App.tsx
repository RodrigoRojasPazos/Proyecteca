import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Admin from './pages/Admin';
import Memorias from './pages/Memorias';
import Revisiones from './pages/Revisiones';

function App() {
  return (
    <AuthProvider>
      <Router 
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            {/* Ruta /dashboard eliminada */}
            <Route 
              path="/proyectos" 
              element={
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole="director">
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/inicio" 
              element={
                <ProtectedRoute allowedRoles={['alumno', 'profesor', 'asesor']}>
                  <Memorias />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/revisiones" 
              element={
                <ProtectedRoute allowedRoles={['profesor', 'director', 'asesor']}>
                  <Revisiones />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;