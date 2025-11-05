import React, { useState } from 'react';
import { User, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [documentType, setDocumentType] = useState('cedula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        onLogin(data.user.role);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error de autenticación');
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
        onLogin(user.role);
      } else {
        setError('Documento no encontrado');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string, docNumber: string) => {
    setDocumentNumber(docNumber);
    setTimeout(() => {
      onLogin(role);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-green-100 flex items-center justify-center p-4">
      <div className="flex max-w-6xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Left Side - Branding */}
        <div className="flex-1 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">ZONASER</h1>
            <p className="text-blue-200 text-sm">AFILIADO</p>
          </div>
          
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 leading-tight">
              TU OFICINA DE ATENCIÓN<br />
              SIN SALIR DE CASA
            </h2>
          </div>
          
          <div className="text-xs text-blue-200 mt-auto">
            <p>Gcopy. Copyright 2025 Todos los derechos reservados MUTUAL SER EPS</p>
            <p>Política de protección de datos personales.</p>
            <p className="text-blue-300 underline cursor-pointer">
              Conoce nuestra política para garantizar la seguridad de sus datos personales.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-8">
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Identifícate</h2>
              <p className="text-gray-600">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-400 text-white py-3 px-4 rounded-lg hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>

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
  );
};

export default Login;