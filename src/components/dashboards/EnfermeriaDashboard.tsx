import React, { useState, useEffect } from 'react';
import { automation } from '../../services/automationService';
import { 
  Shield, 
  Users, 
  Activity, 
  Heart,
  Thermometer,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  User,
  FileText,
  BarChart3
} from 'lucide-react';
import { useAPI } from '../../hooks/useAPI';
import { PDFGenerator } from '../../utils/pdfGenerator';
import ErrorModal from '../ErrorModal';
import SuccessToast from '../SuccessToast';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
  genero: 'M' | 'F';
  direccion?: string;
}

interface TriageData {
  _id?: string;
  pacienteId: Patient | string;
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
  enfermeraId?: string;
  fechaHora: string;
}

const EnfermeriaDashboard: React.FC = () => {
  const [triages, setTriages] = useState<TriageData[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'triajes' | 'nuevo-triaje' | 'estadisticas'>('triajes');
  
  // Estados para modales
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTriage, setSelectedTriage] = useState<TriageData | null>(null);
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTriages, setFilteredTriages] = useState<TriageData[]>([]);

  // Estados para formulario de triaje
  const [newTriage, setNewTriage] = useState<TriageData>({
    pacienteId: '',
    sintomas: '',
    prioridad: 'media',
    signosVitales: {
      presionArterial: '',
      temperatura: 36.5,
      pulso: 70,
      saturacionOxigeno: 98,
      frecuenciaRespiratoria: 16
    },
    estado: 'pendiente',
    observaciones: '',
    fechaHora: new Date().toISOString()
  });

  const api = useAPI();

  useEffect(() => {
    fetchData();
    
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

  useEffect(() => {
    // Filtrar triajes
    const filtered = triages.filter(triage => {
      const patient = typeof triage.pacienteId === 'object' ? triage.pacienteId : null;
      if (!patient) return false;
      
      return (
        patient.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.cedula.includes(searchTerm) ||
        triage.sintomas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        triage.prioridad.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredTriages(filtered);
  }, [searchTerm, triages]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [triagesData, patientsData] = await Promise.all([
        api.triage.getAll(),
        api.patients.getAll()
      ]);
      
      setTriages(triagesData || []);
      setPatients(patientsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorMessage('Error al cargar los datos');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const triageData = {
        ...newTriage,
        fechaHora: new Date().toISOString()
      };
      
      const createdTriage = await api.triage.create(triageData);
      
      fetchData();
      setNewTriage({
        pacienteId: '',
        sintomas: '',
        prioridad: 'media',
        signosVitales: {
          presionArterial: '',
          temperatura: 36.5,
          pulso: 70,
          saturacionOxigeno: 98,
          frecuenciaRespiratoria: 16
        },
        estado: 'pendiente',
        observaciones: '',
        fechaHora: new Date().toISOString()
      });
      
      setSuccessMessage('¡Triaje creado exitosamente!');
      setShowSuccessToast(true);
      setActiveTab('triajes');
      
      // Disparar evento de automatización si es prioridad alta
      if (newTriage.prioridad === 'alta') {
        automation.onTriageCreated({
          ...createdTriage,
          pacienteId: newTriage.pacienteId,
          prioridad: newTriage.prioridad
        });
      }
    } catch (error) {
      setErrorMessage('Error al crear el triaje');
      setShowErrorModal(true);
    }
  };

  const handleEditTriage = (triage: TriageData) => {
    setSelectedTriage(triage);
    setShowEditModal(true);
  };

  const handleUpdateTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTriage) return;
    
    try {
      await api.triage.update(selectedTriage._id!, selectedTriage);
      
      fetchData();
      setShowEditModal(false);
      setSelectedTriage(null);
      setSuccessMessage('¡Triaje actualizado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al actualizar el triaje');
      setShowErrorModal(true);
    }
  };

  const handleDeleteTriage = async (id: string) => {
    if (!confirm('¿Está seguro de que desea eliminar este triaje?')) return;
    
    try {
      await api.triage.delete(id);
      fetchData();
      setSuccessMessage('¡Triaje eliminado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al eliminar el triaje');
      setShowErrorModal(true);
    }
  };

  const generateTriageReport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTriages = triages.filter(t => 
        new Date(t.fechaHora).toISOString().split('T')[0] === today
      );
      
      const blob = await PDFGenerator.generateTriagesReportPDF(todayTriages);
      const filename = `reporte_triajes_${today}.pdf`;
      PDFGenerator.downloadPDF(blob, filename);
      
      setSuccessMessage('¡Reporte generado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al generar el reporte');
      setShowErrorModal(true);
    }
  };

  const generateTriageStatistics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayTriages = triages.filter(t => 
        new Date(t.fechaHora).toISOString().split('T')[0] === today
      );
      
      const stats = {
        total: todayTriages.length,
        pendientes: todayTriages.filter(t => t.estado === 'pendiente').length,
        enProceso: todayTriages.filter(t => t.estado === 'en_proceso').length,
        completados: todayTriages.filter(t => t.estado === 'completado').length,
        prioridadAlta: todayTriages.filter(t => t.prioridad === 'alta').length,
        prioridadMedia: todayTriages.filter(t => t.prioridad === 'media').length,
        prioridadBaja: todayTriages.filter(t => t.prioridad === 'baja').length
      };
      
      const blob = await PDFGenerator.generateTriageStatisticsPDF(stats, todayTriages);
      const filename = `estadisticas_triajes_${today}.pdf`;
      PDFGenerator.downloadPDF(blob, filename);
      
      setSuccessMessage('¡Estadísticas generadas exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al generar las estadísticas');
      setShowErrorModal(true);
    }
  };

  const generateSingleTriagePDF = async (triage: TriageData) => {
    try {
      const blob = await PDFGenerator.generateSingleTriagePDF(triage);
      const patient = typeof triage.pacienteId === 'object' ? triage.pacienteId : null;
      const filename = `triaje_${patient?.nombre}_${patient?.apellido}_${new Date(triage.fechaHora).toISOString().split('T')[0]}.pdf`;
      PDFGenerator.downloadPDF(blob, filename);
      
      setSuccessMessage('¡PDF del triaje generado exitosamente!');
      setShowSuccessToast(true);
    } catch (error) {
      setErrorMessage('Error al generar el PDF');
      setShowErrorModal(true);
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

  const todayStats = {
    total: triages.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return new Date(t.fechaHora).toISOString().split('T')[0] === today;
    }).length,
    pendientes: triages.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return new Date(t.fechaHora).toISOString().split('T')[0] === today && t.estado === 'pendiente';
    }).length,
    enProceso: triages.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return new Date(t.fechaHora).toISOString().split('T')[0] === today && t.estado === 'en_proceso';
    }).length,
    completados: triages.filter(t => {
      const today = new Date().toISOString().split('T')[0];
      return new Date(t.fechaHora).toISOString().split('T')[0] === today && t.estado === 'completado';
    }).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-red-900">Dashboard de Enfermería</h1>
              <p className="text-red-700">Gestión de triajes y evaluación de pacientes</p>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar triajes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent w-80"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triajes Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <Shield className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.enProceso}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completados</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completados}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
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
                Triajes del Día ({todayStats.total})
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

        {/* Content */}
        {activeTab === 'triajes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Triajes del Día</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredTriages.length > 0 ? filteredTriages.map((triage) => {
                const patient = typeof triage.pacienteId === 'object' ? triage.pacienteId : null;
                if (!patient) return null;
                
                return (
                  <div key={triage._id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {patient.nombre} {patient.apellido}
                          </h3>
                          <span className="text-sm text-gray-500">
                            ({calculateAge(patient.fechaNacimiento)} años)
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(triage.prioridad)}`}>
                            {triage.prioridad.toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(triage.estado)}`}>
                            {triage.estado.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{triage.sintomas}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-gray-600">PA: {triage.signosVitales.presionArterial}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Thermometer className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-600">T°: {triage.signosVitales.temperatura}°C</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Activity className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-600">FC: {triage.signosVitales.pulso} bpm</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Shield className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">SpO2: {triage.signosVitales.saturacionOxigeno}%</span>
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          {new Date(triage.fechaHora).toLocaleString('es-ES')}
                        </div>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => generateSingleTriagePDF(triage)}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                          title="Generar PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTriage(triage)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Editar triaje"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTriage(triage._id!)}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Eliminar triaje"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="p-12 text-center text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
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
            
            <form onSubmit={handleCreateTriage} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paciente *
                </label>
                <select
                  required
                  value={newTriage.pacienteId}
                  onChange={(e) => setNewTriage({...newTriage, pacienteId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.filter(p => p.isActive).map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.nombre} {patient.apellido} - {patient.cedula}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Síntomas *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newTriage.sintomas}
                  onChange={(e) => setNewTriage({...newTriage, sintomas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Describa los síntomas del paciente"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <select
                  required
                  value={newTriage.prioridad}
                  onChange={(e) => setNewTriage({...newTriage, prioridad: e.target.value as 'alta' | 'media' | 'baja'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presión Arterial *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="120/80"
                      value={newTriage.signosVitales.presionArterial}
                      onChange={(e) => setNewTriage({
                        ...newTriage,
                        signosVitales: {...newTriage.signosVitales, presionArterial: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      min="35"
                      max="42"
                      value={newTriage.signosVitales.temperatura}
                      onChange={(e) => setNewTriage({
                        ...newTriage,
                        signosVitales: {...newTriage.signosVitales, temperatura: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pulso (bpm) *
                    </label>
                    <input
                      type="number"
                      required
                      min="40"
                      max="200"
                      value={newTriage.signosVitales.pulso}
                      onChange={(e) => setNewTriage({
                        ...newTriage,
                        signosVitales: {...newTriage.signosVitales, pulso: parseInt(e.target.value)}
                      })}
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
                      min="70"
                      max="100"
                      value={newTriage.signosVitales.saturacionOxigeno}
                      onChange={(e) => setNewTriage({
                        ...newTriage,
                        signosVitales: {...newTriage.signosVitales, saturacionOxigeno: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Frecuencia Respiratoria (rpm)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="40"
                    value={newTriage.signosVitales.frecuenciaRespiratoria || ''}
                    onChange={(e) => setNewTriage({
                      ...newTriage,
                      signosVitales: {...newTriage.signosVitales, frecuenciaRespiratoria: e.target.value ? parseInt(e.target.value) : undefined}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={newTriage.observaciones}
                  onChange={(e) => setNewTriage({...newTriage, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Observaciones adicionales (opcional)"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Triaje</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'estadisticas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas del Día</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total de triajes:</span>
                  <span className="font-semibold">{todayStats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pendientes:</span>
                  <span className="font-semibold text-orange-600">{todayStats.pendientes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">En proceso:</span>
                  <span className="font-semibold text-blue-600">{todayStats.enProceso}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completados:</span>
                  <span className="font-semibold text-green-600">{todayStats.completados}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Reportes</h3>
              <div className="space-y-3">
                <button
                  onClick={generateTriageReport}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Reporte de Triajes</span>
                </button>
                <button
                  onClick={generateTriageStatistics}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Estadísticas Detalladas</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedTriage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editar Triaje</h2>
            </div>
            
            <form onSubmit={handleUpdateTriage} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Síntomas *
                </label>
                <textarea
                  required
                  rows={3}
                  value={selectedTriage.sintomas}
                  onChange={(e) => setSelectedTriage({...selectedTriage, sintomas: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridad *
                </label>
                <select
                  required
                  value={selectedTriage.prioridad}
                  onChange={(e) => setSelectedTriage({...selectedTriage, prioridad: e.target.value as 'alta' | 'media' | 'baja'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <select
                  required
                  value={selectedTriage.estado}
                  onChange={(e) => setSelectedTriage({...selectedTriage, estado: e.target.value as 'pendiente' | 'en_proceso' | 'completado'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En Proceso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Signos Vitales</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Presión Arterial *
                    </label>
                    <input
                      type="text"
                      required
                      value={selectedTriage.signosVitales.presionArterial}
                      onChange={(e) => setSelectedTriage({
                        ...selectedTriage,
                        signosVitales: {...selectedTriage.signosVitales, presionArterial: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Temperatura (°C) *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={selectedTriage.signosVitales.temperatura}
                      onChange={(e) => setSelectedTriage({
                        ...selectedTriage,
                        signosVitales: {...selectedTriage.signosVitales, temperatura: parseFloat(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pulso (bpm) *
                    </label>
                    <input
                      type="number"
                      required
                      value={selectedTriage.signosVitales.pulso}
                      onChange={(e) => setSelectedTriage({
                        ...selectedTriage,
                        signosVitales: {...selectedTriage.signosVitales, pulso: parseInt(e.target.value)}
                      })}
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
                      value={selectedTriage.signosVitales.saturacionOxigeno}
                      onChange={(e) => setSelectedTriage({
                        ...selectedTriage,
                        signosVitales: {...selectedTriage.signosVitales, saturacionOxigeno: parseInt(e.target.value)}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows={3}
                  value={selectedTriage.observaciones || ''}
                  onChange={(e) => setSelectedTriage({...selectedTriage, observaciones: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTriage(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Actualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Error Modal */}
      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="¡Ups, algo salió mal!"
        message={errorMessage}
        buttonText="Aceptar"
      />

      {/* Success Toast */}
      <SuccessToast
        isOpen={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        message={successMessage}
      />
    </div>
  );
};

export default EnfermeriaDashboard;