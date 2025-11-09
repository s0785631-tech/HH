import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  FileText, 
  Activity,
  User,
  Calendar,
  Heart,
  Thermometer,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Download,
  Printer,
  Plus,
  Search,
  Eye
} from 'lucide-react';
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
  _id: string;
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

interface Consultation {
  _id?: string;
  pacienteId: Patient;
  medicoId: any;
  triageId?: string;
  motivoConsulta: string;
  anamnesis: string;
  examenFisico: string;
  diagnostico: string;
  tratamiento: string;
  medicamentos: {
    nombre: string;
    dosis: string;
    frecuencia: string;
    duracion: string;
  }[];
  examenes: {
    tipo: string;
    descripcion: string;
    urgente: boolean;
  }[];
  proximaCita?: string;
  estado: 'en_curso' | 'completada';
  fechaHora: string;
}

const ConsultorioDashboard: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [pendingTriages, setPendingTriages] = useState<TriageData[]>([]);
  const [selectedTriage, setSelectedTriage] = useState<TriageData | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'consultas' | 'triajes' | 'historial'>('consultas');
  
  // Estados para notificaciones
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [newConsultation, setNewConsultation] = useState<Consultation>({
    pacienteId: {} as Patient,
    medicoId: '',
    triageId: '',
    motivoConsulta: '',
    anamnesis: '',
    examenFisico: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
    examenes: [{ tipo: '', descripcion: '', urgente: false }],
    proximaCita: '',
    estado: 'en_curso',
    fechaHora: new Date().toISOString()
  });

  // Información del doctor (simulada por ahora)
  const doctorInfo = {
    nombre: 'Carlos',
    apellido: 'Mendez',
    especialidad: 'Medicina General',
    numeroLicencia: 'MED-12345',
    consultorio: {
      numero: '101',
      nombre: 'Consultorio Principal'
    }
  };

  useEffect(() => {
    fetchConsultations();
    fetchPendingTriages();
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nueva-consulta':
          setActiveTab('triajes');
          break;
        case 'triajes-pendientes':
          setActiveTab('triajes');
          break;
        case 'historial-consultas':
          setActiveTab('historial');
          break;
      }
    };

    window.addEventListener('menuAction', handleMenuAction);
    return () => window.removeEventListener('menuAction', handleMenuAction);
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations?fecha=${today}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setConsultations(data);
      } else {
        setConsultations([]);
      }
    } catch (error) {
      console.error('Error fetching consultations:', error);
      setConsultations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTriages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations/pending-triages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPendingTriages(data);
      } else {
        setPendingTriages([]);
      }
    } catch (error) {
      console.error('Error fetching pending triages:', error);
      setPendingTriages([]);
    }
  };

  const handleStartConsultation = (triage: TriageData) => {
    // Actualizar el estado del triaje a "en_proceso" cuando el doctor lo toma
    updateTriageStatus(triage._id, 'en_proceso');
    setSelectedTriage(triage);
    setNewConsultation({
      ...newConsultation,
      pacienteId: triage.pacienteId,
      triageId: triage._id,
      motivoConsulta: triage.sintomas
    });
    setShowNewConsultation(true);
  };

  const addMedicamento = () => {
    setNewConsultation({
      ...newConsultation,
      medicamentos: [...newConsultation.medicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]
    });
  };

  const removeMedicamento = (index: number) => {
    const updatedMedicamentos = newConsultation.medicamentos.filter((_, i) => i !== index);
    setNewConsultation({
      ...newConsultation,
      medicamentos: updatedMedicamentos
    });
  };

  const updateMedicamento = (index: number, field: string, value: string) => {
    const updatedMedicamentos = [...newConsultation.medicamentos];
    updatedMedicamentos[index] = { ...updatedMedicamentos[index], [field]: value };
    setNewConsultation({
      ...newConsultation,
      medicamentos: updatedMedicamentos
    });
  };

  const addExamen = () => {
    setNewConsultation({
      ...newConsultation,
      examenes: [...newConsultation.examenes, { tipo: '', descripcion: '', urgente: false }]
    });
  };

  const removeExamen = (index: number) => {
    const updatedExamenes = newConsultation.examenes.filter((_, i) => i !== index);
    setNewConsultation({
      ...newConsultation,
      examenes: updatedExamenes
    });
  };

  const updateExamen = (index: number, field: string, value: string | boolean) => {
    const updatedExamenes = [...newConsultation.examenes];
    updatedExamenes[index] = { ...updatedExamenes[index], [field]: value };
    setNewConsultation({
      ...newConsultation,
      examenes: updatedExamenes
    });
  };

  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const consultationData = {
        ...newConsultation,
        estado: 'completada'
      };
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(consultationData)
      });
      
      if (response.ok) {
        const savedConsultation = await response.json();
        
        // Marcar el triaje como completado cuando se guarda la consulta
        if (selectedTriage) {
          await updateTriageStatus(selectedTriage._id, 'completado');
        }
        
        fetchConsultations();
        fetchPendingTriages();
        setShowNewConsultation(false);
        setSelectedTriage(null);
        setNewConsultation({
          pacienteId: {} as Patient,
          medicoId: '',
          triageId: '',
          motivoConsulta: '',
          anamnesis: '',
          examenFisico: '',
          diagnostico: '',
          tratamiento: '',
          medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
          examenes: [{ tipo: '', descripcion: '', urgente: false }],
          proximaCita: '',
          estado: 'en_curso',
          fechaHora: new Date().toISOString()
        });
        
        setSuccessMessage('¡Consulta guardada exitosamente!');
        setShowSuccessToast(true);
        setActiveTab('consultas');
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.message || 'Error al guardar la consulta');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error saving consultation:', error);
      setErrorMessage('Error de conexión. Verifique su conexión a internet.');
      setShowErrorModal(true);
    }
  };

  const updateTriageStatus = async (triageId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/triage/${triageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: newStatus })
      });
    } catch (error) {
      console.error('Error updating triage status:', error);
    }
  };

  const generatePDF = async (consultation: Consultation, type: 'historia' | 'receta') => {
    try {
      let blob: Blob;
      let filename: string;
      
      if (type === 'historia') {
        blob = await PDFGenerator.generateConsultationPDF(consultation, doctorInfo, selectedTriage || undefined);
        filename = `historia_clinica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        blob = await PDFGenerator.generatePrescriptionPDF(consultation, doctorInfo);
        filename = `receta_medica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      }
      
      PDFGenerator.downloadPDF(blob, filename);
      
      setSuccessMessage(`${type === 'historia' ? 'Historia clínica' : 'Receta médica'} generada exitosamente`);
      setShowSuccessToast(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setErrorMessage('Error al generar el PDF. Intente nuevamente.');
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

  const todayStats = {
    total: consultations.length,
    completadas: consultations.filter(c => c.estado === 'completada').length,
    enCurso: consultations.filter(c => c.estado === 'en_curso').length,
    triagesPendientes: pendingTriages.length
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200 flex-shrink-0">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-blue-900">Consultorio Médico</h1>
              <p className="text-blue-700">Dr. {doctorInfo.nombre} {doctorInfo.apellido} - {doctorInfo.especialidad}</p>
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
                <p className="text-sm font-medium text-gray-600">Consultas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.total}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completadas}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Curso</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.enCurso}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triajes Pendientes</p>
                <p className="text-2xl font-bold text-red-600">{todayStats.triagesPendientes}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('consultas')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'consultas'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Consultas del Día
              </button>
              <button
                onClick={() => setActiveTab('triajes')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'triajes'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Triajes Pendientes ({pendingTriages.length})
              </button>
              <button
                onClick={() => setActiveTab('historial')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'historial'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Historial
              </button>
            </nav>
          </div>
        </div>

        {activeTab === 'consultas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Consultas del Día</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {consultations.length > 0 ? consultations.map((consultation) => (
                <div key={consultation._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {consultation.pacienteId.nombre} {consultation.pacienteId.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(consultation.pacienteId.fechaNacimiento)} años)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          consultation.estado === 'completada' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {consultation.estado === 'completada' ? 'COMPLETADA' : 'EN CURSO'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{consultation.motivoConsulta}</p>
                      <p className="text-sm text-gray-600 mb-3">{consultation.diagnostico}</p>
                      
                      <div className="text-sm text-gray-500">
                        {new Date(consultation.fechaHora).toLocaleString('es-ES')}
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => generatePDF(consultation, 'historia')}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1"
                      >
                        <Download className="w-4 h-4" />
                        <span>Historia</span>
                      </button>
                      <button
                        onClick={() => generatePDF(consultation, 'receta')}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                      >
                        <Printer className="w-4 h-4" />
                        <span>Receta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay consultas registradas</h3>
                  <p className="text-gray-600">Las consultas del día aparecerán aquí</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'triajes' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Triajes Pendientes de Consulta</h2>
            </div>
            
            <div className="divide-y divide-gray-200">
              {pendingTriages.length > 0 ? pendingTriages.map((triage) => (
                <div key={triage._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {triage.pacienteId.nombre} {triage.pacienteId.apellido}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({calculateAge(triage.pacienteId.fechaNacimiento)} años)
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPrioridadColor(triage.prioridad)}`}>
                          {triage.prioridad.toUpperCase()}
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
                    
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleStartConsultation(triage)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Iniciar Consulta</span>
                      </button>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="p-12 text-center text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No hay triajes pendientes</h3>
                  <p className="text-gray-600">Los triajes completados aparecerán aquí para iniciar consultas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'historial' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Historial de Consultas</h2>
            </div>
            
            <div className="p-6">
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Historial de Consultas</h3>
                <p className="text-gray-600">Aquí aparecerá el historial completo de consultas realizadas</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Consultation Modal */}
      {showNewConsultation && selectedTriage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Consulta</h2>
              <p className="text-gray-600">
                Paciente: {selectedTriage.pacienteId.nombre} {selectedTriage.pacienteId.apellido} - 
                C.I: {selectedTriage.pacienteId.cedula}
              </p>
            </div>
            
            <form onSubmit={handleSaveConsultation} className="p-6 space-y-6">
              {/* Información del Triaje */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-blue-900 mb-3">Información del Triaje</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">PA:</span>
                    <span className="ml-1 text-blue-700">{selectedTriage.signosVitales.presionArterial}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">Temp:</span>
                    <span className="ml-1 text-blue-700">{selectedTriage.signosVitales.temperatura}°C</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">FC:</span>
                    <span className="ml-1 text-blue-700">{selectedTriage.signosVitales.pulso} bpm</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-blue-800">SpO2:</span>
                    <span className="ml-1 text-blue-700">{selectedTriage.signosVitales.saturacionOxigeno}%</span>
                  </div>
                </div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Síntomas:</span> {selectedTriage.sintomas}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de Consulta *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.motivoConsulta}
                    onChange={(e) => setNewConsultation({...newConsultation, motivoConsulta: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Anamnesis *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.anamnesis}
                    onChange={(e) => setNewConsultation({...newConsultation, anamnesis: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Examen Físico *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.examenFisico}
                    onChange={(e) => setNewConsultation({...newConsultation, examenFisico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diagnóstico *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newConsultation.diagnostico}
                    onChange={(e) => setNewConsultation({...newConsultation, diagnostico: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tratamiento *
                </label>
                <textarea
                  required
                  rows={3}
                  value={newConsultation.tratamiento}
                  onChange={(e) => setNewConsultation({...newConsultation, tratamiento: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Medicamentos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Medicamentos
                  </label>
                  <button
                    type="button"
                    onClick={addMedicamento}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newConsultation.medicamentos.map((med, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Nombre del medicamento"
                        value={med.nombre}
                        onChange={(e) => updateMedicamento(index, 'nombre', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Dosis"
                        value={med.dosis}
                        onChange={(e) => updateMedicamento(index, 'dosis', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Frecuencia"
                        value={med.frecuencia}
                        onChange={(e) => updateMedicamento(index, 'frecuencia', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Duración"
                          value={med.duracion}
                          onChange={(e) => updateMedicamento(index, 'duracion', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        {newConsultation.medicamentos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMedicamento(index)}
                            className="bg-red-100 text-red-700 px-2 py-2 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exámenes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Exámenes Solicitados
                  </label>
                  <button
                    type="button"
                    onClick={addExamen}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar</span>
                  </button>
                </div>
                
                <div className="space-y-3">
                  {newConsultation.examenes.map((exam, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                      <input
                        type="text"
                        placeholder="Tipo de examen"
                        value={exam.tipo}
                        onChange={(e) => updateExamen(index, 'tipo', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={exam.descripcion}
                        onChange={(e) => updateExamen(index, 'descripcion', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex items-center space-x-3">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={exam.urgente}
                            onChange={(e) => updateExamen(index, 'urgente', e.target.checked)}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <span className="text-sm text-gray-700">Urgente</span>
                        </label>
                        {newConsultation.examenes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeExamen(index)}
                            className="bg-red-100 text-red-700 px-2 py-2 rounded-lg hover:bg-red-200 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Próxima Cita (Opcional)
                </label>
                <input
                  type="date"
                  value={newConsultation.proximaCita}
                  onChange={(e) => setNewConsultation({...newConsultation, proximaCita: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewConsultation(false);
                    setSelectedTriage(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar Consulta
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

export default ConsultorioDashboard;