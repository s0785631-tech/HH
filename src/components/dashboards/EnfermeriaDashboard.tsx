import React, { useState, useEffect } from 'react';
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
  Shield,
  Search
} from 'lucide-react';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
  genero: 'M' | 'F';
}

interface TriajeData {
  _id?: string;
  pacienteId: Patient;
  sintomas: string;
  prioridad: 'alta' | 'media' | 'baja';
  signosVitales: {
    presionArterial: string;
    temperatura: number;
    pulso: number;
    saturacionOxigeno: number;
    frecuenciaRespiratoria?: number;
  };
  estado: 'pendiente' | 'en_proceso' | 'completado';
  observaciones?: string;
  fechaHora: string;
}

const EnfermeriaDashboard: React.FC = () => {
  const [triajes, setTriajes] = useState<TriajeData[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchCedula, setSearchCedula] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'triajes' | 'nuevo-triaje' | 'estadisticas'>('triajes');

  const [nuevoTriaje, setNuevoTriaje] = useState({
    sintomas: '',
    presionArterial: '',
    temperatura: '',
    pulso: '',
    saturacionOxigeno: '',
    frecuenciaRespiratoria: '',
    observaciones: ''
  });

  useEffect(() => {
    fetchTriajes();
    fetchPatients();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nuevo-triaje':
          setActiveTab('nuevo-triaje');
          break;
        case 'triajes-dia':
          setActiveTab('triajes');
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchTriajes = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/triage?fecha=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTriajes(data);
      } else {
        setTriajes([]);
      }
    } catch (error) {
      console.error('Error fetching triages:', error);
      setTriajes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPatients(data);
      } else {
        setPatients([]);
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
      setPatients([]);
    }
  };

  const searchPatientByCedula = async () => {
    if (!searchCedula.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/patients/search/${searchCedula}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          setSelectedPatient(data[0]);
          setMostrarFormulario(true);
        } else {
          alert('Paciente no encontrado');
        }
      } else {
        alert('Error al buscar paciente');
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Error al buscar paciente');
    }
  };

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

  const determinarPrioridad = (): 'alta' | 'media' | 'baja' => {
    const temp = parseFloat(nuevoTriaje.temperatura);
    const pulso = parseInt(nuevoTriaje.pulso);
    const saturacion = parseInt(nuevoTriaje.saturacionOxigeno);
    
    if (temp > 38.5 || pulso > 100 || saturacion < 95) return 'alta';
    if (temp > 37.5 || pulso > 90 || saturacion < 98) return 'media';
    return 'baja';
  };

  const handleSubmitTriaje = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) return;

    const triageData = {
      pacienteId: selectedPatient._id,
      sintomas: nuevoTriaje.sintomas,
      prioridad: determinarPrioridad(),
      signosVitales: {
        presionArterial: nuevoTriaje.presionArterial,
        temperatura: parseFloat(nuevoTriaje.temperatura),
        pulso: parseInt(nuevoTriaje.pulso),
        saturacionOxigeno: parseInt(nuevoTriaje.saturacionOxigeno),
        frecuenciaRespiratoria: nuevoTriaje.frecuenciaRespiratoria ? parseInt(nuevoTriaje.frecuenciaRespiratoria) : undefined
      },
      observaciones: nuevoTriaje.observaciones
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/triage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(triageData)
      });
      
      if (response.ok) {
        fetchTriajes();
        setMostrarFormulario(false);
        setSelectedPatient(null);
        setSearchCedula('');
        setNuevoTriaje({
          sintomas: '',
          presionArterial: '',
          temperatura: '',
          pulso: '',
          saturacionOxigeno: '',
          frecuenciaRespiratoria: '',
          observaciones: ''
        });
      } else {
        alert('Error al crear triaje');
      }
    } catch (error) {
      console.error('Error creating triage:', error);
      alert('Error al crear triaje');
    }
  };

  const actualizarEstado = async (id: string, nuevoEstado: 'pendiente' | 'en_proceso' | 'completado') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/triage/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });
      
      if (response.ok) {
        fetchTriajes();
      }
    } catch (error) {
      console.error('Error updating triage status:', error);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
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
      <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-red-900 animate-fade-in">Enfermería - Triaje</h1>
              <p className="text-red-700">Evaluación y clasificación de pacientes</p>
            </div>
            
            {/* Search Patient */}
            {/* <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Buscar por cédula..."
                  value={searchCedula}
                  onChange={(e) => setSearchCedula(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && searchPatientByCedula()}
                />
                <button
                  onClick={searchPatientByCedula}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Search className="w-4 h-4" />
                  <span>Buscar</span>
                </button>
              </div>
            </div> */}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('triajes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'triajes'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Triajes del Día
              </button>
              <button
                onClick={() => setActiveTab('nuevo-triaje')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nuevo-triaje'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nuevo Triaje
              </button>
              <button
                onClick={() => setActiveTab('estadisticas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'estadisticas'
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Estadísticas
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'triajes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Triajes del Día</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {triajes.length > 0 ? triajes.map((triaje) => (
                <div key={triaje._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {triaje.pacienteId.nombre} {triaje.pacienteId.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(triaje.pacienteId.fechaNacimiento)} años)
                        </span>
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
                          <span className="text-sm text-gray-600">PA: {triaje.signosVitales.presionArterial}</span>
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
                          <span className="text-sm text-gray-600">SpO2: {triaje.signosVitales.saturacionOxigeno}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-sm text-gray-500">
                        {new Date(triaje.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex space-x-2">
                        {triaje.estado === 'pendiente' && (
                          <button
                            onClick={() => actualizarEstado(triaje._id!, 'en_proceso')}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm"
                          >
                            Iniciar
                          </button>
                        )}
                        {triaje.estado === 'en_proceso' && (
                          <button
                            onClick={() => actualizarEstado(triaje._id!, 'completado')}
                            className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm"
                          >
                            Completar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay triajes registrados</h3>
                  <p className="text-gray-600">Los triajes del día aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'nuevo-triaje' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Nuevo Triaje</h2>
            </div>
            
            <div className="p-6">
              <div className="max-w-2xl mx-auto">
                {/* Búsqueda de paciente */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Paciente por Cédula
                  </label>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Ingrese número de cédula"
                      value={searchCedula}
                      onChange={(e) => setSearchCedula(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      onKeyPress={(e) => e.key === 'Enter' && searchPatientByCedula()}
                    />
                    <button
                      onClick={searchPatientByCedula}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                    >
                      <Search className="w-4 h-4" />
                      <span>Buscar</span>
                    </button>
                  </div>
                </div>

                {/* Información del paciente encontrado */}
                {selectedPatient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Paciente encontrado</span>
                    </div>
                    <div className="text-sm text-green-700">
                      <p className="font-medium">{selectedPatient.nombre} {selectedPatient.apellido}</p>
                      <p>C.I: {selectedPatient.cedula}</p>
                      <p>Edad: {calculateAge(selectedPatient.fechaNacimiento)} años</p>
                      <p>Teléfono: {selectedPatient.telefono}</p>
                    </div>
                  </div>
                )}

                {/* Formulario de triaje */}
                {selectedPatient && (
                  <form onSubmit={handleSubmitTriaje} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Síntomas Principales *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={nuevoTriaje.sintomas}
                        onChange={(e) => setNuevoTriaje({...nuevoTriaje, sintomas: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Describa los síntomas principales del paciente"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Presión Arterial *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="120/80"
                          value={nuevoTriaje.presionArterial}
                          onChange={(e) => setNuevoTriaje({...nuevoTriaje, presionArterial: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Temperatura (°C) *
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          placeholder="36.5"
                          value={nuevoTriaje.temperatura}
                          onChange={(e) => setNuevoTriaje({...nuevoTriaje, temperatura: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pulso (bpm) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="70"
                          value={nuevoTriaje.pulso}
                          onChange={(e) => setNuevoTriaje({...nuevoTriaje, pulso: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Saturación O2 (%) *
                        </label>
                        <input
                          type="number"
                          required
                          placeholder="98"
                          value={nuevoTriaje.saturacionOxigeno}
                          onChange={(e) => setNuevoTriaje({...nuevoTriaje, saturacionOxigeno: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Freq. Respiratoria
                        </label>
                        <input
                          type="number"
                          placeholder="16"
                          value={nuevoTriaje.frecuenciaRespiratoria}
                          onChange={(e) => setNuevoTriaje({...nuevoTriaje, frecuenciaRespiratoria: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observaciones Adicionales
                      </label>
                      <textarea
                        rows={3}
                        value={nuevoTriaje.observaciones}
                        onChange={(e) => setNuevoTriaje({...nuevoTriaje, observaciones: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="Observaciones adicionales sobre el estado del paciente"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPatient(null);
                          setSearchCedula('');
                          setNuevoTriaje({
                            sintomas: '',
                            presionArterial: '',
                            temperatura: '',
                            pulso: '',
                            saturacionOxigeno: '',
                            frecuenciaRespiratoria: '',
                            observaciones: ''
                          });
                        }}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Guardar Triaje
                      </button>
                    </div>
                  </form>
                )}

                {!selectedPatient && (
                  <div className="text-center py-12 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Buscar Paciente</h3>
                    <p className="text-gray-600">Ingrese el número de cédula para buscar al paciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Estadísticas de Triaje</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribución por Prioridad */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Distribución por Prioridad</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Prioridad Alta</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(estadisticas.prioridadAlta / estadisticas.total) * 100}%` }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{estadisticas.prioridadAlta}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Prioridad Media</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {triajes.filter(t => t.prioridad === 'media').length}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Prioridad Baja</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {triajes.filter(t => t.prioridad === 'baja').length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tiempo Promedio de Atención */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tiempo Promedio de Atención</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">15 min</div>
                    <div className="text-sm text-gray-600 mb-4">Tiempo promedio por triaje</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prioridad Alta</span>
                        <span className="font-medium">8 min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prioridad Media</span>
                        <span className="font-medium">15 min</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Prioridad Baja</span>
                        <span className="font-medium">22 min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signos Vitales Promedio */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales Promedio</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600 mb-1">120/80</div>
                      <div className="text-sm text-gray-600">Presión Arterial</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600 mb-1">36.8°C</div>
                      <div className="text-sm text-gray-600">Temperatura</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">75 bpm</div>
                      <div className="text-sm text-gray-600">Pulso</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">98%</div>
                      <div className="text-sm text-gray-600">Saturación O2</div>
                    </div>
                  </div>
                </div>

                {/* Tendencia Semanal */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Tendencia Semanal</h3>
                  <div className="space-y-3">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia, index) => (
                      <div key={dia} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 w-8">{dia}</span>
                        <div className="flex items-center space-x-3 flex-1 ml-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-600 h-2 rounded-full" 
                              style={{ width: `${Math.random() * 80 + 20}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">
                            {Math.floor(Math.random() * 20) + 5}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Nuevo Triaje (mantener el existente para compatibilidad) */}
      {mostrarFormulario && selectedPatient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nuevo Triaje</h2>
              <p className="text-gray-600">
                Paciente: {selectedPatient.nombre} {selectedPatient.apellido} - C.I: {selectedPatient.cedula}
              </p>
            </div>
            
            <form onSubmit={handleSubmitTriaje} className="p-6 space-y-6">
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
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Presión Arterial
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="120/80"
                    value={nuevoTriaje.presionArterial}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, presionArterial: e.target.value})}
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
                    value={nuevoTriaje.saturacionOxigeno}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, saturacionOxigeno: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Freq. Respiratoria
                  </label>
                  <input
                    type="number"
                    value={nuevoTriaje.frecuenciaRespiratoria}
                    onChange={(e) => setNuevoTriaje({...nuevoTriaje, frecuenciaRespiratoria: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={nuevoTriaje.observaciones}
                  onChange={(e) => setNuevoTriaje({...nuevoTriaje, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormulario(false);
                    setSelectedPatient(null);
                    setSearchCedula('');
                  }}
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