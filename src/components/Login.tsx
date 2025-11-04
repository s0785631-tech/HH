import React, { useState } from 'react';
import { Building2, User, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ email, password }),
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
        { email: 'empresa@saviser.com', password: 'empresa123', role: 'empresa' },
        { email: 'recepcion@saviser.com', password: 'recepcion123', role: 'recepcion' },
        { email: 'consultorio@saviser.com', password: 'consultorio123', role: 'consultorio' },
        { email: 'enfermeria@saviser.com', password: 'enfermeria123', role: 'enfermeria' },
      ];

      const user = mockUsers.find(u => u.email === email && u.password === password);
      if (user) {
        onLogin(user.role);
      } else {
        setError('Credenciales inválidas');
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: string, userEmail: string, userPassword: string) => {
    setEmail(userEmail);
    setPassword(userPassword);
    setTimeout(() => {
      onLogin(role);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <Building2 className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SAVISER</h1>
          <p className="text-gray-600">Sistema de Gestión Médica</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="usuario@saviser.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          {/* Quick Access */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4 text-center">Acceso rápido para pruebas:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => quickLogin('empresa', 'empresa@saviser.com', 'empresa123')}
                className="p-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="font-medium">Empresa</div>
                <div className="text-xs opacity-75">Director General</div>
              </button>
              <button
                onClick={() => quickLogin('recepcion', 'recepcion@saviser.com', 'recepcion123')}
                className="p-3 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                <div className="font-medium">Recepción</div>
                <div className="text-xs opacity-75">Ana García</div>
              </button>
              <button
                onClick={() => quickLogin('consultorio', 'consultorio@saviser.com', 'consultorio123')}
                className="p-3 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="font-medium">Consultorio</div>
                <div className="text-xs opacity-75">Dr. Carlos Mendez</div>
              </button>
              <button
                onClick={() => quickLogin('enfermeria', 'enfermeria@saviser.com', 'enfermeria123')}
                className="p-3 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="font-medium">Enfermería</div>
                <div className="text-xs opacity-75">Enf. María López</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;