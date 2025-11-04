import React, { useState } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Clock, 
  Heart, 
  Thermometer, 
  Activity,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  TrendingUp,
  Shield
} from 'lucide-react';

interface TriajeData {
  id: string;
  paciente: string;
  edad: number;
  sintomas: string;
  prioridad: 'alta' | 'media' | 'baja';
  signosVitales: {
    presion: string;
    temperatura: number;
    pulso: number;
    saturacion: number;
  };
  hora: string;
  estado: 'pendiente' | 'en_proceso' | 'completado';
}

const EnfermeriaDashboard: React.FC = () => {
  const [triajes, setTriajes] = useState<TriajeData[]>([
    {
      id: '1',
      paciente: 'Juan Pérez',
      edad: 45,
      sintomas: 'Dolor de pecho, dificultad respiratoria',
      prioridad: 'alta',
      signosVitales: {
        presion: '140/90',
        temperatura: 37.2,
        pulso: 95,
        saturacion: 96
      },
      hora: '08:30',
      estado: 'pendiente'
    },
    {
      id: '2',
      paciente: 'María González',
      edad: 32,
      sintomas: 'Fiebre, dolor de garganta',
      prioridad: 'media',
      signosVitales: {
        presion: '120/80',
        temperatura: 38.5,
        pulso: 88,
        saturacion: 98
      },
      hora: '09:15',
      estado: 'en_proceso'
    },
    {
      id: '3',
      paciente: 'Carlos Ruiz',
      edad: 28,
      sintomas: 'Dolor de cabeza leve',
      prioridad: 'baja',
      signosVitales: {
        presion: '110/70',
        temperatura: 36.8,
        pulso: 72,
        saturacion: 99
      },
      hora: '09:45',
      estado: 'completado'
    }
  ]);

  const [nuevoTriaje, setNuevoTriaje] = useState({
    paciente: '',
    edad: '',
    sintomas: '',
    presion: '',
    temperatura: '',
    pulso: '',
    saturacion: ''
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-orange-100 text-orange-800';
      case 'en_proceso': return 'bg-blue-100 text-blue-800';
      case 'completado': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSubmitTriaje = (e: React.FormEvent) => {
    e.preventDefault();
    
    const determinarPrioridad = (): 'alta' | 'media' | 'baja' => {
      const temp = parseFloat(nuevoTriaje.temperatura);
      const pulso = parseInt(nuevoTriaje.pulso);
      const saturacion = parseInt(nuevoTriaje.saturacion);
      
      if (temp > 38.5 || pulso > 100 || saturacion < 95) return 'alta';
      if (temp > 37.5 || pulso > 90 || saturacion < 98) return 'media';
      return 'baja';
    };

    const nuevoRegistro: TriajeData = {
      id: Date.now().toString(),
      paciente: nuevoTriaje.paciente,
      edad: parseInt(nuevoTriaje.edad),
      sintomas: nuevoTriaje.sintomas,
      prioridad: determinarPrioridad(),
      signosVitales: {
        presion: nuevoTriaje.presion,
        temperatura: parseFloat(nuevoTriaje.temperatura),
        pulso: parseInt(nuevoTriaje.pulso),
        saturacion: parseInt(nuevoTriaje.saturacion)
      },
      hora: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      estado: 'pendiente'
    };

    setTriajes([nuevoRegistro, ...triajes]);
    setNuevoTriaje({
      paciente: '',
      edad: '',
      sintomas: '',
      presion: '',
      temperatura: '',
      pulso: '',
      saturacion: ''
    });
    setMostrarFormulario(false);
  };

  const actualizarEstado = (id: string, nuevoEstado: 'pendiente' | 'en_proceso' | 'completado') => {
    setTriajes(triajes.map(triaje => 
      triaje.id === id ? { ...triaje, estado: nuevoEstado } : triaje
    ));
  };

  const estadisticas = {
    total: triajes.length,
    pendientes: triajes.filter(t => t.estado === 'pendiente').length,
    enProceso: triajes.filter(t => t.estado === 'en_proceso').length,
    completados: triajes.filter(t => t.estado === 'completado').length,
    prioridadAlta: triajes.filter(t => t.prioridad === 'alta').length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/SAVISER.png" 
                alt="SAVISER" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Enfermería - Triaje</h1>
                <p className="text-gray-600">Evaluación y clasificación de pacientes</p>
              </div>
            </div>
            <button
              onClick={() => setMostrarFormulario(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>Nuevo Triaje</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Triajes</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{estadisticas.enProceso}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{estadisticas.completados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prioridad Alta</p>
                <p className="text-2xl font-bold text-red-600">{estadisticas.prioridadAlta}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Lista de Triajes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Triajes del Día</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {triajes.map((triaje) => (
              <div key={triaje.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{triaje.paciente}</h3>
                      <span className="text-sm text-gray-500">({triaje.edad} años)</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(triaje.prioridad)}`}>
                        {triaje.prioridad.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(triaje.estado)}`}>
                        {triaje.estado.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{triaje.sintomas}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-gray-600">PA: {triaje.signosVitales.presion}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <span className="text-sm text-gray-600">T°: {triaje.signosVitales.temperatura}°C</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Activity className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">FC: {triaje.signosVitales.pulso} bpm</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">SpO2: {triaje.signosVitales.saturacion}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <span className="text-sm text-gray-500">{triaje.hora}</span>
                    <div className="flex space-x-2">
                      {triaje.estado === 'pendiente' && (
                        <button
                          onClick={() => actualizarEstado(triaje.id, 'en_proceso')}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                        >
                          Iniciar
                        </button>
                      )}
                      {triaje.estado === 'en_proceso' && (
                        <button
                          onClick={() => actualizarEstado(triaje.id, 'completado')}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                        >
                          Completar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Nuevo Triaje */}
      {mostrarFormulario && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Triaje</h2>
            </div>
            
            <form onSubmit={handleSubmitTriaje} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Paciente
                  </label>
                  <input
                    type="text"
                    required
                    value={nuevoTriaje.paciente}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, paciente: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Edad
                  </label>
                  <input
                    type="number"
                    required
                    value={nuevoTriaje.edad}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, edad: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Síntomas Principales
                </label>
                <textarea
                  required
                  rows={3}
                  value={nuevoTriaje.sintomas}
                  onChange={(e) => setNuevoTriaje({...nuevoTriaje, sintomas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presión Arterial
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    value={nuevoTriaje.presion}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, presion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperatura (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={nuevoTriaje.temperatura}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, temperatura: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pulso (bpm)
                  </label>
                  <input
                    type="number"
                    required
                    value={nuevoTriaje.pulso}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, pulso: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Saturación (%)
                  </label>
                  <input
                    type="number"
                    required
                    value={nuevoTriaje.saturacion}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, saturacion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Triaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnfermeriaDashboard;