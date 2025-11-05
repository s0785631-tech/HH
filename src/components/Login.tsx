import React, { useState } from 'react';
import { User, Heart } from 'lucide-react';
import ErrorModal from './ErrorModal';
import SuccessToast from './SuccessToast';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [documentType, setDocumentType] = useState('cedula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          documentType, 
          documentNumber 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (isFirstLogin) {
          setShowSuccessToast(true);
          setTimeout(() => {
            onLogin(data.user.role);
            setIsFirstLogin(false);
          }, 5300);
        } else {
          onLogin(data.user.role);
        }
      } else {
        const errorData = await response.json();
        setShowErrorModal(true);
      }
    } catch (error) {
      // Fallback to mock authentication for development
      const mockUsers = [
        { documentNumber: '12345678', role: 'empresa' },
        { documentNumber: '87654321', role: 'recepcion' },
        { documentNumber: '11111111', role: 'consultorio' },
        { documentNumber: '22222222', role: 'enfermeria' },
      ];

      const user = mockUsers.find(u => u.documentNumber === documentNumber);
      if (user) {
        if (isFirstLogin) {
          setShowSuccessToast(true);
          setTimeout(() => {
            onLogin(user.role);
            setIsFirstLogin(false);
          }, 5300);
        } else {
          onLogin(user.role);
        }
      } else {
        setShowErrorModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string, docNumber: string) => {
    setDocumentNumber(docNumber);
    if (isFirstLogin) {
      setShowSuccessToast(true);
      setTimeout(() => {
        onLogin(role);
        setIsFirstLogin(false);
      }, 5300);
    } else {
      onLogin(role);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl flex items-center justify-between">
          {/* Left Side - Branding */}
          <div className="flex-1 pr-16">
            {/* Logo */}
            <div className="mb-12">
              <div className="flex items-center space-x-3 mb-8">
                <img 
                  src="/SAVISER copy.png" 
                  alt="SAVISER - Salud con calidad al servicio de todos" 
                  className="h-80 w-auto"
                />
              </div>
              
              {/* Main Slogan */}
              <h2 className="text-4xl font-bold text-blue-900 leading-tight">
                Servicio De Apoyo a La Vida <br />
                  Del Ser Humano 
              </h2>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-96">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              {/* User Icon */}
              <div className="text-center mb-6">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Identifícate</h2>
                <p className="text-gray-600 text-sm">
                  Selecciona tu tipo de documento para confirmar tu cuenta.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de documento*
                  </label>
                  <select
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                  >
                    <option value="cedula">Cédula de ciudadanía</option>
                    <option value="tarjeta">Tarjeta de identidad</option>
                    <option value="pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número*
                  </label>
                  <input
                    type="text"
                    required
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Número"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cyan-400 text-white py-3 px-4 rounded-lg hover:bg-cyan-500 focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </button>
              </form>

              {/* reCAPTCHA placeholder */}
              <div className="mt-6 flex justify-end">
                <div className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-500">
                  reCAPTCHA
                </div>
              </div>

              {/* Quick Access for Testing */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4 text-center">Acceso rápido para pruebas:</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => quickLogin('empresa', '12345678')}
                    className="p-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <div className="font-medium">Empresa</div>
                    <div className="text-xs opacity-75">12345678</div>
                  </button>
                  <button
                    onClick={() => quickLogin('recepcion', '87654321')}
                    className="p-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="font-medium">Recepción</div>
                    <div className="text-xs opacity-75">87654321</div>
                  </button>
                  <button
                    onClick={() => quickLogin('consultorio', '11111111')}
                    className="p-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="font-medium">Consultorio</div>
                    <div className="text-xs opacity-75">11111111</div>
                  </button>
                  <button
                    onClick={() => quickLogin('enfermeria', '22222222')}
                    className="p-3 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="font-medium">Enfermería</div>
                    <div className="text-xs opacity-75">22222222</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-sm text-gray-500 text-center">
            © 2025 SAVISER – Servicio de Apoyo a la Vida del Ser Humano. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="¡Ups, parece que algo salió mal!"
        message="Las credenciales proporcionadas no son válidas"
        buttonText="Aceptar"
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message="¡Bienvenido! Has iniciado sesión exitosamente"
      />
    </div>
  );
};

export default Login;