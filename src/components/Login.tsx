import React, { useState } from 'react';
import { User, Heart, UserPlus } from 'lucide-react';
import ErrorModal from './ErrorModal';
import SuccessToast from './SuccessToast';
import { authAPI } from '../services/api';

interface LoginProps {
  onLogin: (role: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [documentType, setDocumentType] = useState('cedula');
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Estados para registro
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    documentType: 'cedula',
    documentNumber: '',
    password: '',
    confirmPassword: '',
    role: 'recepcion'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Login con API
        const response = await authAPI.login({
          documentType,
          documentNumber,
          password
        });

        const data = response.data;
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        const hasShownWelcome = sessionStorage.getItem('hasShownWelcome');
        if (!hasShownWelcome) {
          setShowSuccessToast(true);
          sessionStorage.setItem('hasShownWelcome', 'true');
          setTimeout(() => {
            setShowSuccessToast(false);
            onLogin(data.user.role);
          }, 2000);
        } else {
          onLogin(data.user.role);
        }
      } else {
        // Registro
        const response = await authAPI.register(registerData);
        const data = response.data;

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        setShowSuccessToast(true);
        setTimeout(() => {
          setShowSuccessToast(false);
          onLogin(data.user.role);
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error en autenticación:', error);
      if (!isLogin && registerData.password !== registerData.confirmPassword) {
        setError('Las contraseñas no coinciden');
      } else {
        const errorMessage = error.response?.data?.message || 'Credenciales inválidas';
        setError(errorMessage);
        setShowErrorModal(true);
      }
    }

    setLoading(false);
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
                  className="h-80 w-auto transform hover:scale-105 transition-transform duration-300"
                />
              </div>
              
              {/* Main Slogan */}
              <h2 className="text-4xl font-bold text-blue-900 leading-tight animate-fade-in">
                Servicio De Apoyo a La Vida <br />
                Del Ser Humano 
              </h2>
            </div>
          </div>

          {/* Right Side - Login/Register Form */}
          <div className="w-96">
            <div className="bg-white rounded-2xl shadow-xl p-8 transform hover:shadow-2xl transition-all duration-300">
              {/* Toggle Buttons */}
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    isLogin 
                      ? 'bg-blue-600 text-white shadow-md transform scale-105' 
                      : 'text-gray-600 hover:text-blue-600'
                  }`}
                >
                  Iniciar Sesión
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
                    !isLogin 
                      ? 'bg-green-600 text-white shadow-md transform scale-105' 
                      : 'text-gray-600 hover:text-green-600'
                  }`}
                >
                  Registrarse
                </button>
              </div>

              {/* User Icon */}
              <div className="text-center mb-6">
                <div className={`p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                  isLogin ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {isLogin ? (
                    <User className={`w-8 h-8 ${isLogin ? 'text-blue-600' : 'text-green-600'}`} />
                  ) : (
                    <UserPlus className="w-8 h-8 text-green-600" />
                  )}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {isLogin ? 'Identifícate' : 'Crear Cuenta'}
                </h2>
                <p className="text-gray-600 text-sm">
                  {isLogin 
                    ? 'Selecciona tu tipo de documento para confirmar tu cuenta.'
                    : 'Completa los datos para crear tu cuenta.'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {!isLogin && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre Completo*
                      </label>
                      <input
                        type="text"
                        required
                        value={registerData.name}
                        onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email*
                      </label>
                      <input
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                        placeholder="correo@ejemplo.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rol*
                      </label>
                      <select
                        value={registerData.role}
                        onChange={(e) => setRegisterData({...registerData, role: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      >
                       <option value="empresa">Empresa</option>
                        <option value="recepcion">Recepción</option>
                        <option value="enfermeria">Enfermería</option>
                        <option value="consultorio">Consultorio</option>
                      </select>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de documento*
                  </label>
                  <select
                    value={isLogin ? documentType : registerData.documentType}
                    onChange={(e) => isLogin 
                      ? setDocumentType(e.target.value)
                      : setRegisterData({...registerData, documentType: e.target.value})
                    }
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent bg-white text-gray-900 transition-all duration-300 ${
                      isLogin ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                    }`}
                  >
                    <option value="cedula">Cédula de ciudadanía</option>
                    <option value="tarjeta">Tarjeta de identidad</option>
                    <option value="pasaporte">Pasaporte</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Identificación*
                  </label>
                  <input
                    type="text"
                    required
                    value={isLogin ? documentNumber : registerData.documentNumber}
                    onChange={(e) => isLogin 
                      ? setDocumentNumber(e.target.value)
                      : setRegisterData({...registerData, documentNumber: e.target.value})
                    }
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                      isLogin ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Ingrese su número de identificación"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña*
                  </label>
                  <input
                    type="password"
                    required
                    value={isLogin ? password : registerData.password}
                    onChange={(e) => isLogin 
                      ? setPassword(e.target.value)
                      : setRegisterData({...registerData, password: e.target.value})
                    }
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all duration-300 ${
                      isLogin ? 'focus:ring-blue-500' : 'focus:ring-green-500'
                    }`}
                    placeholder="Contraseña"
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirmar Contraseña*
                    </label>
                    <input
                      type="password"
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300"
                      placeholder="Confirmar contraseña"
                    />
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm animate-shake">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg focus:ring-2 focus:ring-offset-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-medium transform hover:scale-105 active:scale-95 ${
                    isLogin 
                      ? 'bg-cyan-400 hover:bg-cyan-500 focus:ring-cyan-500 text-white' 
                      : 'bg-green-500 hover:bg-green-600 focus:ring-green-500 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{isLogin ? 'Verificando...' : 'Registrando...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Continuar' : 'Crear Cuenta'
                  )}
                </button>
              </form>

              {/* reCAPTCHA placeholder */}
              <div className="mt-6 flex justify-end">
                <div className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-500 hover:bg-gray-200 transition-colors duration-300">
                  reCAPTCHA
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
        message={error || "Las credenciales proporcionadas no son válidas"}
        buttonText="Aceptar"
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={isLogin ? "¡Bienvenido! Has iniciado sesión exitosamente" : "¡Cuenta creada exitosamente! Ahora puedes iniciar sesión"}
      />

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default Login;