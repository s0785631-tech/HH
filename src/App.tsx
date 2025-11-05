import { useState } from 'react';
import EmpresaDashboard from './components/dashboards/EmpresaDashboard';
import RecepcionDashboard from './components/dashboards/RecepcionDashboard';
import ConsultorioDashboard from './components/dashboards/ConsultorioDashboard';
import EnfermeriaDashboard from './components/dashboards/EnfermeriaDashboard';
import Login from './components/Login';

function App() {
  const [userRole, setUserRole] = useState(null);

  const handleLogin = (role) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('hasShownWelcome');
    setUserRole(null);
  };

  const renderDashboard = () => {
    switch (userRole) {
      case 'empresa':
        return <EmpresaDashboard />;
      case 'recepcion':
        return <RecepcionDashboard />;
      case 'consultorio':
        return <ConsultorioDashboard />;
      case 'enfermeria':
        return <EnfermeriaDashboard />;
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {userRole && (
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <img 
                  src="/SAVISER copy.png" 
                  alt="SAVISER - Salud con calidad al servicio de todos" 
                  className="h-10 w-auto"
                />
                <span className="text-xl font-semibold text-gray-900">
                  Sistema de Gestión Médica
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
      {renderDashboard()}
    </div>
  );
}

export default App;