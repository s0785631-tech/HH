import React, { useState, useEffect } from 'react';
import { Users, Calendar, FileText, Stethoscope, Clock, User, Heart, Thermometer, Activity, Pill, TestTube, Save, Eye, CreditCard as Edit, Plus, AlertTriangle, Download, Printer } from 'lucide-react';
import { PDFGenerator } from '../../utils/pdfGenerator';

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
  const [activeTab, setActiveTab] = useState<'today' | 'triages' | 'history' | 'nueva-consulta'>('today');
  const [loading, setLoading] = useState(true);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);

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
    
    // Escuchar acciones del menú
    const handleMenuAction = (event: any) => {
      const { action } = event.detail;
      switch (action) {
        case 'nueva-consulta':
          setActiveTab('nueva-consulta');
          break;
        case 'triajes-pendientes':
          setActiveTab('triages');
          break;
        case 'historial-consultas':
          setActiveTab('history');
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
    }
  };

  const handleCreateConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConsultation(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newConsultation)
      });
      
      if (response.ok) {
        const savedConsultation = await response.json();
        fetchConsultations();
        fetchPendingTriages();
        setShowNewConsultation(false);
        
        // Mostrar opción para generar PDF
        const generatePDF = window.confirm('Consulta guardada exitosamente. ¿Desea generar la historia clínica en PDF?');
        if (generatePDF) {
          await handleGenerateConsultationPDF(savedConsultation);
        }
        
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
    } finally {
      setSavingConsultation(false);
    }
  };

  const handleGenerateConsultationPDF = async (consultation: Consultation, includeTriageData?: PendingTriage) => {
    setGeneratingPDF(true);
    try {
      // Obtener información del doctor
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Simular datos del doctor (en producción esto vendría de la API)
      const doctorData = {
        nombre: user.name?.split(' ')[0] || 'Doctor',
        apellido: user.name?.split(' ').slice(1).join(' ') || 'Médico',
        especialidad: 'Medicina General',
        numeroLicencia: 'LIC-' + user.id?.toString().slice(-6) || 'LIC-123456',
        consultorio: {
          numero: '101',
          nombre: 'Consultorio General'
        }
      };

      // Generar PDF de historia clínica
      const pdfBlob = await PDFGenerator.generateConsultationPDF(
        consultation,
        doctorData,
        includeTriageData
      );

      // Descargar PDF
      const fileName = `Historia_Clinica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      PDFGenerator.downloadPDF(pdfBlob, fileName);

      // Guardar referencia del documento en la base de datos
      await saveDocumentReference(consultation._id, 'historia_clinica', fileName, pdfBlob);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Intente nuevamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleGeneratePrescriptionPDF = async (consultation: Consultation) => {
    if (consultation.medicamentos.length === 0) {
      alert('Esta consulta no tiene medicamentos prescritos.');
      return;
    }

    setGeneratingPDF(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      const doctorData = {
        nombre: user.name?.split(' ')[0] || 'Doctor',
        apellido: user.name?.split(' ').slice(1).join(' ') || 'Médico',
        especialidad: 'Medicina General',
        numeroLicencia: 'LIC-' + user.id?.toString().slice(-6) || 'LIC-123456',
        consultorio: {
          numero: '101',
          nombre: 'Consultorio General'
        }
      };

      const pdfBlob = await PDFGenerator.generatePrescriptionPDF(consultation, doctorData);
      
      const fileName = `Receta_Medica_${consultation.pacienteId.nombre}_${consultation.pacienteId.apellido}_${new Date().toISOString().split('T')[0]}.pdf`;
      PDFGenerator.downloadPDF(pdfBlob, fileName);

      await saveDocumentReference(consultation._id, 'receta_medica', fileName, pdfBlob);

    } catch (error) {
      console.error('Error generating prescription PDF:', error);
      alert('Error al generar la receta médica. Intente nuevamente.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const saveDocumentReference = async (consultationId: string, documentType: string, fileName: string, pdfBlob: Blob) => {
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('document', pdfBlob, fileName);
      formData.append('consultationId', consultationId);
      formData.append('documentType', documentType);

      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/consultation-documents/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    } catch (error) {
      console.error('Error saving document reference:', error);
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
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 animate-fade-in">Consultorio Médico</h1>
              <p className="text-blue-700">Atención médica y seguimiento</p>
            </div>
            {/* <button
              onClick={() => setShowNewConsultation(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Consulta</span>
            </button> */}
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
              <button
                onClick={() => setActiveTab('nueva-consulta')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'nueva-consulta'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Nueva Consulta
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
                      <button 
                        onClick={() => handleGenerateConsultationPDF(consultation)}
                        disabled={generatingPDF}
                        className="px-4 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center space-x-2 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span>Historia Clínica</span>
                      </button>
                      {consultation.medicamentos.length > 0 && (
                        <button 
                          onClick={() => handleGeneratePrescriptionPDF(consultation)}
                          disabled={generatingPDF}
                          className="px-4 py-2 text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors flex items-center space-x-2 disabled:opacity-50"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Receta</span>
                        </button>
                      )}
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
                          disabled={savingConsultation}
                        >
                          {savingConsultation ? 'Procesando...' : 'Iniciar Consulta'}
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
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Historial de Consultas</h3>
                  <div className="flex items-center space-x-3">
                    <input
                      type="date"
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      <option>Todos los estados</option>
                      <option>Completadas</option>
                      <option>En proceso</option>
                    </select>
                  </div>
                </div>

                {/* Lista de consultas históricas */}
                <div className="space-y-4">
                  {consultations.map((consultation) => (
                    <div key={consultation._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <User className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {consultation.pacienteId.nombre} {consultation.pacienteId.apellido}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {new Date(consultation.fechaHora).toLocaleDateString('es-ES')} - 
                              {new Date(consultation.fechaHora).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
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
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Motivo:</span>
                          <p className="text-gray-600 mt-1">{consultation.motivoConsulta}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Diagnóstico:</span>
                          <p className="text-gray-600 mt-1">{consultation.diagnostico}</p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-4">
                        <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors text-sm">
                          Ver Completa
                        </button>
                        <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm">
                          Imprimir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'nueva-consulta' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-2">Nueva Consulta Médica</h3>
                  <p className="text-blue-700 text-sm">
                    Puedes crear una nueva consulta desde un triaje pendiente o directamente seleccionando un paciente.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Desde Triajes Pendientes */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600 mr-2" />
                      Desde Triajes Pendientes
                    </h4>
                    
                    {pendingTriages.length > 0 ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {pendingTriages.slice(0, 5).map((triage) => (
                          <div key={triage._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h5 className="font-medium text-gray-900">
                                  {triage.pacienteId.nombre} {triage.pacienteId.apellido}
                                </h5>
                                <p className="text-sm text-gray-600">
                                  Prioridad: <span className={`font-medium ${
                                    triage.prioridad === 'alta' ? 'text-red-600' :
                                    triage.prioridad === 'media' ? 'text-yellow-600' :
                                    'text-green-600'
                                  }`}>
                                    {triage.prioridad.toUpperCase()}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">{triage.sintomas}</p>
                            <button
                              onClick={() => createConsultationFromTriage(triage)}
                              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Iniciar Consulta
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>No hay triajes pendientes</p>
                      </div>
                    )}
                  </div>

                  {/* Consulta Directa */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Stethoscope className="w-5 h-5 text-blue-600 mr-2" />
                      Consulta Directa
                    </h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Seleccionar Paciente
                        </label>
                        <select
                          value={selectedPatient?._id || ''}
                          onChange={(e) => {
                            const patient = patients.find(p => p._id === e.target.value);
                            setSelectedPatient(patient || null);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Seleccionar paciente</option>
                          {patients.map(patient => (
                            <option key={patient._id} value={patient._id}>
                              {patient.nombre} {patient.apellido} - {patient.cedula}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {selectedPatient && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h5 className="font-medium text-gray-900 mb-2">Paciente Seleccionado</h5>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Nombre:</span> {selectedPatient.nombre} {selectedPatient.apellido}</p>
                            <p><span className="font-medium">C.I:</span> {selectedPatient.cedula}</p>
                            <p><span className="font-medium">Teléfono:</span> {selectedPatient.telefono}</p>
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => {
                          if (selectedPatient) {
                            setNewConsultation({
                              ...newConsultation,
                              pacienteId: selectedPatient._id,
                              triageId: ''
                            });
                            setShowNewConsultation(true);
                          }
                        }}
                        disabled={!selectedPatient}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Crear Consulta
                      </button>
                    </div>
                  </div>
                </div>
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
                  disabled={savingConsultation}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingConsultation ? 'Guardando...' : 'Guardar Consulta'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading overlay para PDF */}
      {generatingPDF && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Generando PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultorioDashboard;