import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Stethoscope, Clock, User, Heart, Thermometer, Activity, Pill, TestTube, Save, Eye, CreditCard as Edit, Plus, AlertTriangle } from 'lucide-react';

interface Patient {
  _id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  fechaNacimiento: string;
  telefono: string;
}

interface Consultation {
  _id: string;
  pacienteId: Patient;
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
  estado: 'en_curso' | 'completada';
  fechaHora: string;
}

interface PendingTriage {
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
  fechaHora: string;
}

const ConsultorioDashboard: React.FC = () => {
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [pendingTriages, setPendingTriages] = useState<PendingTriage[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showNewConsultation, setShowNewConsultation] = useState(false);
  const [activeTab, setActiveTab] = useState<'today' | 'triages' | 'history'>('today');
  const [loading, setLoading] = useState(true);

  const [newConsultation, setNewConsultation] = useState({
    pacienteId: '',
    triageId: '',
    motivoConsulta: '',
    anamnesis: '',
    examenFisico: '',
    diagnostico: '',
    tratamiento: '',
    medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
    examenes: [{ tipo: '', descripcion: '', urgente: false }]
  });

  useEffect(() => {
    fetchConsultations();
    fetchPatients();
    fetchPendingTriages();
  }, []);

  const fetchConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations?fecha=${today}`, {
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
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/patients`, {
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
    }
  };

  const fetchPendingTriages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations/pending-triages`, {
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
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/consultations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConsultation)
      });
      
      if (response.ok) {
        fetchConsultations();
        fetchPendingTriages();
        setShowNewConsultation(false);
        setNewConsultation({
          pacienteId: '',
          triageId: '',
          motivoConsulta: '',
          anamnesis: '',
          examenFisico: '',
          diagnostico: '',
          tratamiento: '',
          medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
          examenes: [{ tipo: '', descripcion: '', urgente: false }]
        });
      }
    } catch (error) {
      console.error('Error creating consultation:', error);
    }
  };

  const addMedicamento = () => {
    setNewConsultation({
      ...newConsultation,
      medicamentos: [...newConsultation.medicamentos, { nombre: '', dosis: '', frecuencia: '', duracion: '' }]
    });
  };

  const addExamen = () => {
    setNewConsultation({
      ...newConsultation,
      examenes: [...newConsultation.examenes, { tipo: '', descripcion: '', urgente: false }]
    });
  };

  const updateMedicamento = (index: number, field: string, value: string) => {
    const updatedMedicamentos = [...newConsultation.medicamentos];
    updatedMedicamentos[index] = { ...updatedMedicamentos[index], [field]: value };
    setNewConsultation({ ...newConsultation, medicamentos: updatedMedicamentos });
  };

  const updateExamen = (index: number, field: string, value: string | boolean) => {
    const updatedExamenes = [...newConsultation.examenes];
    updatedExamenes[index] = { ...updatedExamenes[index], [field]: value };
    setNewConsultation({ ...newConsultation, examenes: updatedExamenes });
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

  const createConsultationFromTriage = (triage: PendingTriage) => {
    setNewConsultation({
      pacienteId: triage.pacienteId._id,
      triageId: triage._id,
      motivoConsulta: triage.sintomas,
      anamnesis: '',
      examenFisico: `Signos vitales: PA: ${triage.signosVitales.presionArterial}, T°: ${triage.signosVitales.temperatura}°C, FC: ${triage.signosVitales.pulso} bpm, SpO2: ${triage.signosVitales.saturacionOxigeno}%${triage.signosVitales.frecuenciaRespiratoria ? `, FR: ${triage.signosVitales.frecuenciaRespiratoria} rpm` : ''}`,
      diagnostico: '',
      tratamiento: '',
      medicamentos: [{ nombre: '', dosis: '', frecuencia: '', duracion: '' }],
      examenes: [{ tipo: '', descripcion: '', urgente: false }]
    });
    setShowNewConsultation(true);
  };

  const todayStats = {
    totalConsultations: consultations.length,
    completed: consultations.filter(c => c.estado === 'completada').length,
    inProgress: consultations.filter(c => c.estado === 'en_curso').length,
    pendingTriages: pendingTriages.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/SAVISER copy.png" 
                alt="SAVISER - Salud con calidad al servicio de todos" 
                className="h-10 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Consultorio Médico</h1>
                <p className="text-gray-600">Atención médica y seguimiento</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewConsultation(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Consulta</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consultas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{todayStats.totalConsultations}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{todayStats.completed}</p>
              </div>
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Proceso</p>
                <p className="text-2xl font-bold text-orange-600">{todayStats.inProgress}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Triajes Pendientes</p>
                <p className="text-2xl font-bold text-blue-600">{todayStats.pendingTriages}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('today')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'today'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Consultas de Hoy
              </button>
              <button
                onClick={() => setActiveTab('triages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'triages'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Triajes Pendientes ({pendingTriages.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Historial
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'today' && (
              <div className="space-y-6">
                {consultations.length > 0 ? consultations.map((consultation) => (
                  <div key={consultation._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-blue-100 p-3 rounded-full">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {consultation.pacienteId.nombre} {consultation.pacienteId.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {calculateAge(consultation.pacienteId.fechaNacimiento)} años • C.I: {consultation.pacienteId.cedula}
                          </p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        consultation.estado === 'completada' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {consultation.estado === 'completada' ? 'Completada' : 'En Proceso'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Motivo de Consulta</h4>
                          <p className="text-gray-700 text-sm">{consultation.motivoConsulta}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Anamnesis</h4>
                          <p className="text-gray-700 text-sm">{consultation.anamnesis}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Examen Físico</h4>
                          <p className="text-gray-700 text-sm">{consultation.examenFisico}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Diagnóstico</h4>
                          <p className="text-gray-700 text-sm">{consultation.diagnostico}</p>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Tratamiento</h4>
                          <p className="text-gray-700 text-sm">{consultation.tratamiento}</p>
                        </div>

                        {consultation.medicamentos.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Pill className="w-4 h-4 mr-2" />
                              Medicamentos
                            </h4>
                            <div className="space-y-2">
                              {consultation.medicamentos.map((med, index) => (
                                <div key={index} className="bg-blue-50 p-3 rounded-lg">
                                  <p className="font-medium text-blue-900">{med.nombre}</p>
                                  <p className="text-sm text-blue-700">
                                    {med.dosis} - {med.frecuencia} por {med.duracion}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {consultation.examenes.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <TestTube className="w-4 h-4 mr-2" />
                              Exámenes Solicitados
                            </h4>
                            <div className="space-y-2">
                              {consultation.examenes.map((exam, index) => (
                                <div key={index} className={`p-3 rounded-lg ${
                                  exam.urgente ? 'bg-red-50' : 'bg-gray-50'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <p className={`font-medium ${
                                      exam.urgente ? 'text-red-900' : 'text-gray-900'
                                    }`}>
                                      {exam.tipo}
                                    </p>
                                    {exam.urgente && (
                                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                        URGENTE
                                      </span>
                                    )}
                                  </div>
                                  <p className={`text-sm ${
                                    exam.urgente ? 'text-red-700' : 'text-gray-700'
                                  }`}>
                                    {exam.descripcion}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                      <button className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center space-x-2">
                        <Edit className="w-4 h-4" />
                        <span>Editar</span>
                      </button>
                      <button className="px-4 py-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2">
                        <Eye className="w-4 h-4" />
                        <span>Ver Historial</span>
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay consultas hoy</h3>
                    <p className="text-gray-600">Las consultas del día aparecerán aquí</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'triages' && (
              <div className="space-y-6">
                {pendingTriages.length > 0 ? pendingTriages.map((triage) => (
                  <div key={triage._id} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-orange-100 p-3 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {triage.pacienteId.nombre} {triage.pacienteId.apellido}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {calculateAge(triage.pacienteId.fechaNacimiento)} años • C.I: {triage.pacienteId.cedula}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          triage.prioridad === 'alta' ? 'bg-red-100 text-red-800' :
                          triage.prioridad === 'media' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          Prioridad {triage.prioridad.toUpperCase()}
                        </span>
                        <button
                          onClick={() => createConsultationFromTriage(triage)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Iniciar Consulta
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Síntomas</h4>
                        <p className="text-gray-700 text-sm mb-4">{triage.sintomas}</p>
                        
                        <h4 className="font-medium text-gray-900 mb-2">Signos Vitales</h4>
                        <div className="grid grid-cols-2 gap-3">
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
                            <Activity className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-gray-600">SpO2: {triage.signosVitales.saturacionOxigeno}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            Triaje realizado: {new Date(triage.fechaHora).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay triajes pendientes</h3>
                    <p className="text-gray-600">Los triajes completados aparecerán aquí para iniciar consultas</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Historial de Consultas</h3>
                <p className="text-gray-600">Aquí se mostrará el historial completo de consultas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Consultation Modal */}
      {showNewConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Nueva Consulta Médica</h2>
            </div>
            
            <form onSubmit={handleCreateConsultation} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Paciente</label>
                <select
                  required
                  value={newConsultation.pacienteId}
                  onChange={(e) => setNewConsultation({...newConsultation, pacienteId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!newConsultation.triageId}
                >
                  <option value="">Seleccionar paciente</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.nombre} {patient.apellido} - {patient.cedula}
                    </option>
                  ))}
                </select>
                {newConsultation.triageId && (
                  <p className="text-sm text-blue-600 mt-1">
                    Paciente seleccionado desde triaje
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de Consulta</label>
                    <textarea
                      required
                      rows={3}
                      value={newConsultation.motivoConsulta}
                      onChange={(e) => setNewConsultation({...newConsultation, motivoConsulta: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Anamnesis</label>
                    <textarea
                      required
                      rows={4}
                      value={newConsultation.anamnesis}
                      onChange={(e) => setNewConsultation({...newConsultation, anamnesis: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Examen Físico</label>
                    <textarea
                      required
                      rows={4}
                      value={newConsultation.examenFisico}
                      onChange={(e) => setNewConsultation({...newConsultation, examenFisico: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Diagnóstico</label>
                    <textarea
                      required
                      rows={3}
                      value={newConsultation.diagnostico}
                      onChange={(e) => setNewConsultation({...newConsultation, diagnostico: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tratamiento</label>
                    <textarea
                      required
                      rows={4}
                      value={newConsultation.tratamiento}
                      onChange={(e) => setNewConsultation({...newConsultation, tratamiento: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Medicamentos */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Medicamentos</h3>
                  <button
                    type="button"
                    onClick={addMedicamento}
                    className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                  >
                    Agregar Medicamento
                  </button>
                </div>
                <div className="space-y-3">
                  {newConsultation.medicamentos.map((med, index) => (
                    <div key={index} className="grid grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg">
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
                      <input
                        type="text"
                        placeholder="Duración"
                        value={med.duracion}
                        onChange={(e) => updateMedicamento(index, 'duracion', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Exámenes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Exámenes Solicitados</h3>
                  <button
                    type="button"
                    onClick={addExamen}
                    className="bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 transition-colors text-sm"
                  >
                    Agregar Examen
                  </button>
                </div>
                <div className="space-y-3">
                  {newConsultation.examenes.map((exam, index) => (
                    <div key={index} className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
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
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={exam.urgente}
                          onChange={(e) => updateExamen(index, 'urgente', e.target.checked)}
                          className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <label className="text-sm text-gray-700">Urgente</label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewConsultation(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Consulta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultorioDashboard;